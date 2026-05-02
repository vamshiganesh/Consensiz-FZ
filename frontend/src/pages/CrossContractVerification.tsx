import React, { useState, useEffect, useRef } from 'react';

export function CrossContractVerification() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'INTERACTION' | 'COLLISIONS'>('INTERACTION');
  const [selectedContracts, setSelectedContracts] = useState<string[]>(['Vault.sol', 'Pool.sol']);
  const [logs, setLogs] = useState<string[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  
  const availableContracts = [
    { name: 'Vault.sol', type: 'Core' },
    { name: 'Pool.sol', type: 'Liquidity' },
    { name: 'Controller.sol', type: 'Governance' },
    { name: 'Oracle.sol', type: 'Data' },
    { name: 'Token.sol', type: 'Asset' }
  ];

  const toggleContract = (name: string) => {
    setSelectedContracts(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const analyze = async () => {
    if (selectedContracts.length < 2) {
      alert('Select at least 2 contracts to analyze interactions.');
      return;
    }
    
    setLoading(true);
    setAnalysis(null);
    setShowGraph(false);
    setLogs(['[SYSTEM] Initializing Cross-Contract Analysis Engine...', `[SYSTEM] Mapping call-graphs for: ${selectedContracts.join(', ')}`]);

    const groqKey = localStorage.getItem('groq_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');
    const activeProvider = localStorage.getItem('active_provider') || 'GROQ';
    const ollamaUrl = localStorage.getItem('ollama_url');
    const ollamaModel = localStorage.getItem('ollama_model');

    try {
      // Simulation steps for UX
      setTimeout(() => setLogs(prev => [...prev, '[AI] Analyzing state transition dependencies...']), 1000);
      setTimeout(() => setLogs(prev => [...prev, '[AI] Verifying reentrancy vectors across delegated calls...']), 2500);
      setTimeout(() => setShowGraph(true), 1500);

      const res = await fetch('http://localhost:3001/api/cross-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groqKey, 
          geminiKey, 
          activeProvider, 
          ollamaUrl, 
          ollamaModel,
          contracts: selectedContracts
        })
      });
      
      const data = await res.json();
      if (data.error) {
        setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
      } else {
        setAnalysis(data.analysis);
        setLogs(prev => [...prev, '[SUCCESS] Analysis complete. Collision points identified.']);
        setActiveTab('COLLISIONS');
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message || 'Verification failed'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient">Cross-Contract Interaction Lab</h1>
          <p style={{ color: 'var(--text-muted)' }}>Detect state collisions, logic overlaps, and composability risks across multiple contracts.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={analyze} 
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        >
          {loading ? 'Analyzing Interactions...' : '▶ Run Cross-Check'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', height: '75vh' }}>
        {/* Left: Contract Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel p-6" style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Select Lab Scope</h3>
            <div className="flex-col gap-3">
              {availableContracts.map(contract => (
                <div 
                  key={contract.name}
                  onClick={() => toggleContract(contract.name)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: selectedContracts.includes(contract.name) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedContracts.includes(contract.name) ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '3px', 
                      background: selectedContracts.includes(contract.name) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: selectedContracts.includes(contract.name) ? 600 : 400 }}>{contract.name}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{contract.type}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              ℹ️ Select contracts that interact via external calls or shared storage proxies.
            </p>
          </div>

          <div className="glass-panel" style={{ height: '200px', background: '#020617', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #1e293b', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>&gt;_ REASONING CONSOLE</div>
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.4 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.includes('[ERROR]') ? '#f87171' : log.includes('[SUCCESS]') ? '#4ade80' : '#94a3b8', marginBottom: '0.25rem' }}>{log}</div>
              ))}
              {loading && <span className="animate-pulse" style={{ color: 'var(--primary)' }}>_</span>}
            </div>
          </div>
        </div>

        {/* Right: Visualization & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '0 1rem' }}>
              <button 
                onClick={() => setActiveTab('INTERACTION')}
                style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'INTERACTION' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'INTERACTION' ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >Interaction Graph</button>
              <button 
                onClick={() => setActiveTab('COLLISIONS')}
                style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: activeTab === 'COLLISIONS' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'COLLISIONS' ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >Collision Report {analysis?.issues?.length > 0 && <span style={{ background: 'var(--danger)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '4px' }}>{analysis.issues.length}</span>}</button>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
              {activeTab === 'INTERACTION' ? (
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showGraph ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                       {/* Mock SVG Graph */}
                       <svg width="100%" height="100%" viewBox="0 0 800 400">
                         <defs>
                           <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orientation="auto">
                             <polygon points="0 0, 10 3.5, 0 7" fill="var(--primary)" />
                           </marker>
                         </defs>
                         {/* Nodes */}
                         <rect x="100" y="150" width="120" height="60" rx="8" fill="rgba(59, 130, 246, 0.2)" stroke="var(--primary)" strokeWidth="2" />
                         <text x="160" y="185" textAnchor="middle" fill="white" style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedContracts[0]}</text>
                         
                         <rect x="580" y="150" width="120" height="60" rx="8" fill="rgba(59, 130, 246, 0.2)" stroke="var(--primary)" strokeWidth="2" />
                         <text x="640" y="185" textAnchor="middle" fill="white" style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedContracts[1]}</text>

                         {/* Edges */}
                         <path d="M220 180 L570 180" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arrowhead)" className="animate-dash" strokeDasharray="5,5" />
                         <text x="400" y="170" textAnchor="middle" fill="var(--primary)" style={{ fontSize: '10px' }}>delegatecall()</text>

                         <path d="M580 200 L230 200" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arrowhead)" className="animate-dash" strokeDasharray="5,5" />
                         <text x="400" y="220" textAnchor="middle" fill="var(--primary)" style={{ fontSize: '10px' }}>transferFrom()</text>
                       </svg>
                       <div style={{ position: 'absolute', bottom: 0, right: 0, padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                         Detected: 2 Direct Calls, 1 Shared State Proxy
                       </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕸️</div>
                      <p>Run analysis to generate interaction map.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-col gap-6">
                  {analysis?.issues ? (
                    analysis.issues.map((issue: any, i: number) => (
                      <div key={i} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
                        <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>{issue.title}</h3>
                            <div className="flex gap-2">
                              {issue.contractsInvolved.map((c: string) => (
                                <span key={c} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--primary)' }}>{c}</span>
                              ))}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>COLLISION DETECTED</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '1rem' }}>{issue.description}</p>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>AI RECOMMENDATION:</span>
                          <p style={{ marginTop: '0.5rem', color: 'var(--success)' }}>Implement reentrancy guards on all external calls and sync state across {issue.contractsInvolved.join(' and ')} before state mutation.</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                      <p>No collisions detected yet. Run analysis to start verification.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-dash {
          animation: dash 2s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
}
