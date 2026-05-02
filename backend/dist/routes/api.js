"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const prisma = new client_1.PrismaClient();
router.get('/findings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const findings = yield prisma.finding.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(findings);
}));
router.post('/upload', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const content = req.file.buffer.toString('utf-8');
    const contract = yield prisma.contract.create({
        data: {
            name: req.file.originalname,
            source: content
        }
    });
    res.json({ success: true, contract });
}));
router.post('/fuzz', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { groqKey, useOllama, ollamaUrl, ollamaModel } = req.body;
    const contract = yield prisma.contract.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!contract)
        return res.status(400).json({ error: 'No contracts uploaded yet' });
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
        if (useOllama) {
            const baseUrl = ollamaUrl || 'http://localhost:11434';
            const targetModel = ollamaModel || 'llama3';
            const response = yield (0, node_fetch_1.default)(`${baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: targetModel, prompt, stream: false, format: 'json' })
            });
            const data = yield response.json();
            resultJson = data.response;
        }
        else {
            if (!groqKey)
                return res.status(400).json({ error: 'Groq API Key missing' });
            const groq = new groq_sdk_1.default({ apiKey: groqKey });
            const chatCompletion = yield groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' }
            });
            resultJson = ((_b = (_a = chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "{}";
        }
        const data = JSON.parse(resultJson);
        // Log to Failure Vault
        const finding = yield prisma.finding.create({
            data: {
                contractId: contract.id,
                title: ((_c = data.vulnerability) === null || _c === void 0 ? void 0 : _c.title) || "Unknown Break",
                severity: ((_d = data.vulnerability) === null || _d === void 0 ? void 0 : _d.severity) || "HIGH",
                vulnClass: ((_e = data.vulnerability) === null || _e === void 0 ? void 0 : _e.vulnClass) || "Logic Error",
                description: ((_f = data.vulnerability) === null || _f === void 0 ? void 0 : _f.description) || "The fuzzer encountered an unexpected state."
            }
        });
        res.json(Object.assign(Object.assign({ success: true }, data), { databaseId: finding.id }));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}));
router.post('/cross-contract', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { groqKey, useOllama, ollamaUrl, ollamaModel } = req.body;
    const contracts = yield prisma.contract.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    if (contracts.length < 2) {
        return res.status(400).json({ error: 'At least two contracts required for cross-contract analysis' });
    }
    const codeContext = contracts.map(c => `// --- ${c.name} ---\n${c.source}`).join('\n\n');
    const prompt = `Analyze these Solidity contracts for composability and cross-contract vulnerabilities (e.g., reentrancy between contracts, flash loan attacks, oracle manipulation).
Contracts Context:
${codeContext.substring(0, 4000)}

Respond ONLY with a JSON object strictly following this structure: {"issues": [{"title": "Short title", "contractsInvolved": ["A.sol", "B.sol"], "description": "Detail the issue"}]}`;
    try {
        let resultJson = "";
        if (useOllama) {
            const baseUrl = ollamaUrl || 'http://localhost:11434';
            const targetModel = ollamaModel || 'llama3';
            const response = yield (0, node_fetch_1.default)(`${baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: targetModel, prompt: prompt, stream: false, format: 'json' })
            });
            const data = yield response.json();
            resultJson = data.response;
        }
        else {
            if (!groqKey)
                return res.status(400).json({ error: 'Groq API Key missing' });
            const groq = new groq_sdk_1.default({ apiKey: groqKey });
            const chatCompletion = yield groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' }
            });
            resultJson = ((_b = (_a = chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "{}";
        }
        const findingData = JSON.parse(resultJson);
        res.json({ success: true, analysis: findingData });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
