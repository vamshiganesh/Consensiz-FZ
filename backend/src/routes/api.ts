import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const prisma = new PrismaClient();

router.get('/findings', async (req, res) => {
  const findings = await prisma.finding.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(findings);
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const content = req.file.buffer.toString('utf-8');
  const contract = await prisma.contract.create({
    data: {
      name: req.file.originalname,
      source: content
    }
  });
  
  res.json({ success: true, contract });
});

router.post('/fuzz', async (req, res) => {
  const { groqKey, geminiKey, activeProvider, ollamaUrl, ollamaModel } = req.body;
  
  const contract = await prisma.contract.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!contract) return res.status(400).json({ error: 'No contracts uploaded yet' });

  const prompt = `Analyze this Solidity code for vulnerabilities as a Fuzz Tester. 
1. Detect which functions should be targetted for fuzzing.
2. Write a professional Echidna/Foundry fuzz test script for it.
3. Simulate a crash and identify the exact inputs that caused it.

Code: ${contract.source.substring(0, 3000)}

Respond ONLY with a JSON object strictly following this structure: 
{
  "targetFunctions": ["functionName1", "functionName2"],
  "fuzzScript": "contract FuzzTest { ... }",
  "crashInputs": [{"arg": "amount", "value": "2**256 - 1"}, {"arg": "sender", "value": "0x000...00"}],
  "vulnerability": {
    "title": "Short title",
    "severity": "CRITICAL",
    "vulnClass": "Arithmetic Overflow",
    "description": "Detailed explanation of why it broke"
  }
}`;

  try {
    let resultJson = "";
    
    if (activeProvider === 'OLLAMA') {
      const baseUrl = ollamaUrl || 'http://localhost:11434';
      const targetModel = ollamaModel || 'llama3';
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: targetModel, prompt, stream: false, format: 'json' })
      });
      const data: any = await response.json();
      resultJson = data.response;
    } else if (activeProvider === 'GEMINI') {
      if (!geminiKey) return res.status(400).json({ error: 'Gemini API Key missing' });
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt + "\nIMPORTANT: YOUR ENTIRE RESPONSE MUST BE A VALID JSON OBJECT. NO EXTRA TEXT.");
      const response = await result.response;
      resultJson = response.text();
      // Clean possible markdown backticks
      resultJson = resultJson.replace(/```json/g, '').replace(/```/g, '').trim();
    } else {
      // Default to GROQ
      if (!groqKey) return res.status(400).json({ error: 'Groq API Key missing' });
      const groq = new Groq({ apiKey: groqKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt + "\nIMPORTANT: RESPONSE MUST BE A VALID JSON OBJECT." }],
        model: 'llama-3.1-8b-instant',
      });
      resultJson = chatCompletion.choices[0]?.message?.content || "{}";
    }

    let data;
    try {
      // Robust JSON extraction: Find the first { and last }
      const jsonMatch = resultJson.match(/\{[\s\S]*\}/);
      const cleanedJson = jsonMatch ? jsonMatch[0] : resultJson;
      data = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", resultJson);
      return res.status(422).json({ 
        error: "AI returned malformed data. Try again or switch models.",
        rawResponse: resultJson.substring(0, 500)
      });
    }
    
    // Log to Failure Vault
    const finding = await prisma.finding.create({
      data: {
        contractId: contract.id,
        title: data.vulnerability?.title || "Unknown Break",
        severity: data.vulnerability?.severity || "HIGH",
        vulnClass: data.vulnerability?.vulnClass || "Logic Error",
        description: data.vulnerability?.description || "The fuzzer encountered an unexpected state."
      }
    });

    res.json({ success: true, ...data, databaseId: finding.id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cross-contract', async (req, res) => {
  const { groqKey, geminiKey, activeProvider, ollamaUrl, ollamaModel } = req.body;
  
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  if (contracts.length < 2) {
    return res.status(400).json({ error: 'At least two contracts required for cross-contract analysis' });
  }

  const codeContext = contracts.map(c => `// --- ${c.name} ---\n${c.source}`).join('\n\n');
  const prompt = `Analyze these smart contracts for CROSS-CONTRACT COLLISIONS, state inconsistencies, or logic overlaps.
Specifically look for:
1. Inconsistent state updates between interconnected contracts.
2. Reentrancy vectors spanning across external calls to different contracts.
3. Access control mismatches in multi-contract workflows.
4. Call-order dependencies that could lead to locked funds.

CONTEXT:
${codeContext.substring(0, 4000)}

Respond ONLY with a JSON object strictly following this structure: {"issues": [{"title": "Short title", "contractsInvolved": ["A.sol", "B.sol"], "description": "Detailed explanation of the collision"}]}`;

  try {
    let resultJson = "";
    if (activeProvider === 'OLLAMA') {
      const baseUrl = ollamaUrl || 'http://localhost:11434';
      const targetModel = ollamaModel || 'llama3';
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: targetModel, prompt: prompt, stream: false, format: 'json' })
      });
      const data: any = await response.json();
      resultJson = data.response;
    } else if (activeProvider === 'GEMINI') {
      if (!geminiKey) return res.status(400).json({ error: 'Gemini API Key missing' });
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt + "\nIMPORTANT: YOUR ENTIRE RESPONSE MUST BE A VALID JSON OBJECT. NO EXTRA TEXT.");
      const response = await result.response;
      resultJson = response.text();
      resultJson = resultJson.replace(/```json/g, '').replace(/```/g, '').trim();
    } else {
      if (!groqKey) return res.status(400).json({ error: 'Groq API Key missing' });
      const groq = new Groq({ apiKey: groqKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt + "\nIMPORTANT: RESPONSE MUST BE A VALID JSON OBJECT." }],
        model: 'llama-3.1-8b-instant',
      });
      resultJson = chatCompletion.choices[0]?.message?.content || "{}";
    }

    let findingData;
    try {
      const jsonMatch = resultJson.match(/\{[\s\S]*\}/);
      const cleanedJson = jsonMatch ? jsonMatch[0] : resultJson;
      findingData = JSON.parse(cleanedJson);
    } catch (parseError) {
      return res.status(422).json({ error: "AI returned malformed data for cross-contract analysis." });
    }
    res.json({ success: true, analysis: findingData });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
