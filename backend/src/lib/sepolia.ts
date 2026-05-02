/**
 * Sepolia Testnet Attestation via ethers.js v6
 * Sends a transaction to Sepolia with the IPFS CID encoded in the data field.
 * This creates an immutable on-chain record linking the finding to its IPFS content.
 */
import { ethers } from 'ethers';

interface SepoliaResult {
  txHash: string;
  blockNumber: number;
  from: string;
}

export async function attestOnSepolia(
  ipfsCid: string,
  privateKey: string,
  rpcUrl: string
): Promise<SepoliaResult> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Encode the IPFS CID as hex data for the transaction
  const encoder = new TextEncoder();
  const cidBytes = encoder.encode(`CONSENSIZ-FZ:FINDING:${ipfsCid}`);
  const hexData = '0x' + Array.from(cidBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Send a self-transaction (to self) with the CID as data
  // This is a common pattern for on-chain data attestation
  const tx = await wallet.sendTransaction({
    to: wallet.address,         // Self-transaction (attestation)
    value: 0,                   // No ETH transfer
    data: hexData,              // IPFS CID encoded as calldata
    gasLimit: BigInt(50000)        // Minimal gas for data-only tx
  });

  const receipt = await tx.wait();
  
  if (!receipt) {
    throw new Error('Transaction receipt is null — tx may have been dropped');
  }

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: wallet.address
  };
}
