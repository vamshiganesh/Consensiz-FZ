/**
 * Registration Route — POST /api/register-finding
 * 
 * Orchestrates the three-layer verification:
 *   1. Pin finding data to IPFS (Pinata)
 *   2. Attest IPFS CID on Sepolia testnet
 *   3. Generate ZKP commitment
 *   4. Persist all results to the database
 * 
 * This file is completely independent from api.ts — zero coupling.
 */
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { pinToIPFS } from '../lib/ipfs';
import { attestOnSepolia } from '../lib/sepolia';
import { generateZKProof } from '../lib/zkp';

const router = Router();
const prisma = new PrismaClient();

router.post('/register-finding', async (req, res) => {
  const {
    findingId,
    pinataApiKey,
    pinataSecretKey,
    sepoliaPrivateKey,
    sepoliaRpcUrl
  } = req.body;

  // ── Validate inputs ──────────────────────────────────────────
  if (!findingId) {
    return res.status(400).json({ error: 'findingId is required' });
  }
  if (!pinataApiKey || !pinataSecretKey) {
    return res.status(400).json({ error: 'Pinata API credentials are required. Configure them in Settings.' });
  }
  if (!sepoliaPrivateKey || !sepoliaRpcUrl) {
    return res.status(400).json({ error: 'Sepolia credentials are required. Configure them in Settings.' });
  }

  // ── Fetch finding from DB ────────────────────────────────────
  const finding = await prisma.finding.findUnique({ where: { id: findingId } });
  if (!finding) {
    return res.status(404).json({ error: `Finding ${findingId} not found` });
  }
  if (finding.ipfsCid) {
    return res.status(409).json({ error: 'This finding is already registered on-chain' });
  }

  // ── Prepare finding data for registration ────────────────────
  const findingPayload = {
    platform: 'CONSENSIZ-FZ',
    version: '1.0.0',
    findingId: finding.id,
    contractId: finding.contractId,
    title: finding.title,
    severity: finding.severity,
    vulnClass: finding.vulnClass,
    description: finding.description,
    detectedAt: finding.createdAt.toISOString(),
    registeredAt: new Date().toISOString()
  };

  const results: any = {
    steps: [],
    ipfsCid: null,
    sepoliaTxHash: null,
    zkProof: null
  };

  try {
    // ── Step 1: Pin to IPFS ──────────────────────────────────────
    results.steps.push({ step: 'IPFS', status: 'in_progress' });
    const ipfsCid = await pinToIPFS(findingPayload, pinataApiKey, pinataSecretKey);
    results.ipfsCid = ipfsCid;
    results.steps[results.steps.length - 1].status = 'complete';
    results.steps[results.steps.length - 1].cid = ipfsCid;

    // ── Step 2: Attest on Sepolia ────────────────────────────────
    results.steps.push({ step: 'SEPOLIA', status: 'in_progress' });
    const sepoliaResult = await attestOnSepolia(ipfsCid, sepoliaPrivateKey, sepoliaRpcUrl);
    results.sepoliaTxHash = sepoliaResult.txHash;
    results.steps[results.steps.length - 1].status = 'complete';
    results.steps[results.steps.length - 1].txHash = sepoliaResult.txHash;
    results.steps[results.steps.length - 1].blockNumber = sepoliaResult.blockNumber;

    // ── Step 3: Generate ZKP ─────────────────────────────────────
    results.steps.push({ step: 'ZKP', status: 'in_progress' });
    const zkResult = generateZKProof(finding.id, findingPayload);
    results.zkProof = zkResult.proof;
    results.steps[results.steps.length - 1].status = 'complete';
    results.steps[results.steps.length - 1].commitment = zkResult.commitment;
    results.steps[results.steps.length - 1].nullifier = zkResult.nullifier;

    // ── Step 4: Persist to database ──────────────────────────────
    const updatedFinding = await prisma.finding.update({
      where: { id: findingId },
      data: {
        ipfsCid: ipfsCid,
        sepoliaTxHash: sepoliaResult.txHash,
        zkProof: JSON.stringify({
          proof: zkResult.proof,
          commitment: zkResult.commitment,
          nullifier: zkResult.nullifier,
          publicInputHash: zkResult.publicInputHash,
          timestamp: zkResult.timestamp
        }),
        registeredAt: new Date()
      }
    });

    results.registeredAt = updatedFinding.registeredAt;
    res.json({ success: true, ...results });

  } catch (error: any) {
    console.error('[register-finding] Error:', error);

    // Return partial results so the UI can show which step failed
    const failedStep = results.steps[results.steps.length - 1];
    if (failedStep) {
      failedStep.status = 'failed';
      failedStep.error = error.message;
    }

    res.status(500).json({
      error: `Registration failed at step: ${failedStep?.step || 'UNKNOWN'}`,
      detail: error.message,
      partialResults: results
    });
  }
});

export default router;
