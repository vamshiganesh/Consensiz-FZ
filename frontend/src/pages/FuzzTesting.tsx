import { useState, useEffect, useRef } from 'react';

export function FuzzTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [useOllama, setUseOllama] = useState(false);
  const [fuzzData, setFuzzData] = useState<any>(null);
  const [currentFuzzValue, setCurrentFuzzValue] = useState('0x00...00');
  const [logs, setLogs] = useState<string[]>([]);
  
  const simulationIntervalRef = useRef<any>(null);

  const generateRandomHex = () => '0x' + Math.random().toString(16).slice(2, 10).toUpperCase() + '...';
  const generateRandomInt = () => Math.floor(Math.random() * 1000000).toString();

  const startSimulation = () => {
    setSimulationActive(true);
    simulationIntervalRef.current = setInterval(() => {
      const isHex = Math.random() > 0.5;
      setCurrentFuzzValue(isHex ? generateRandomHex() : generateRandomInt());
    }, 50);
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setSimulationActive(false);
  };

  const runFuzzTest = async () => {
    setIsRunning(true);
    setLogs(['[SYSTEM] Initializing AI Fuzzing Engine...', '[SYSTEM] Analyzing contract entry points...']);
    setFuzzData(null);

    const groqKey = localStorage.getItem('groq_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');
    const activeProvider = localStorage.getItem('active_provider') || 'GROQ';
    const ollamaUrl = localStorage.getItem('ollama_url');
    const ollamaModel = localStorage.getItem('ollama_model');

    try {
      const res = await fetch('http://localhost:3001/api/fuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groqKey, geminiKey, activeProvider, ollamaUrl, ollamaModel })
      });
      const data = await res.json();

      if (data.error) {
        setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
        setIsRunning(false);
        return;
      }

      setFuzzData(data);
      setLogs(prev => [
        ...prev, 
        `[SYSTEM] Target functions detected: ${data.targetFunctions.join(', ')}`,
        `[SYSTEM] Fuzzing script generated. Starting live simulation...`
      ]);

      // Start the visual simulation
      startSimulation();

      // Run simulation for 3 seconds before "crashing"
      setTimeout(() => {
        stopSimulation();
        setIsRunning(false);
        setLogs(prev => [
          ...prev,
          `[CRITICAL] CRASH DETECTED on function: ${data.targetFunctions[0]}`,
          `[CRITICAL] Failing Input: ${JSON.stringify(data.crashInputs)}`,
          `[SUCCESS] Vulnerability logged to Failure Vault as #${data.databaseId.slice(0,6)}`
        ]);
      }, 4000);

    } catch (e: any) {
      setLogs(prev => [...prev, `[ERROR] ${e.message || 'Connection failed'}`]);
      setIsRunning(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient">Continuous Fuzzing Engine</h1>
          <p style={{ color: 'var(--text-muted)' }}>AI-guided state exploration & dynamic invariant testing.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setUseOllama(false)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: !useOllama ? 'white' : 'var(--text-muted)', background: !useOllama ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
              >Groq</button>
              <button 
                onClick={() => setUseOllama(true)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', color: useOllama ? 'white' : 'var(--text-muted)', background: useOllama ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
              >Ollama</button>
           </div>
           <button className="btn btn-primary" onClick={runFuzzTest} disabled={isRunning}>
             {isRunning ? 'Engine Running...' : '▶ Start Fuzzing Campaign'}
           </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: '70vh' }}>
        {/* Sidebar: Targets & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel p-6">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Fuzz Targets</h3>
            {fuzzData ? (
              <div className="flex-col gap-2">
                {fuzzData.targetFunctions.map((fn: string) => (
                  <div key={fn} style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid var(--primary)', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {fn}()
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting for analysis...</p>
            )}
          </div>

          <div className="glass-panel p-6" style={{ background: isRunning ? 'rgba(239, 68, 68, 0.05)' : 'var(--panel-bg)', border: isRunning ? '1px solid var(--danger)' : '1px solid var(--panel-border)' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Engine Status</h3>
             <div className="flex items-center gap-3">
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isRunning ? 'var(--danger)' : 'var(--text-muted)', boxShadow: isRunning ? '0 0 10px var(--danger)' : 'none' }}></div>
               <span style={{ fontWeight: 600, color: isRunning ? 'var(--danger)' : 'var(--text-muted)' }}>{isRunning ? 'INJECTING VALUES' : 'STANDBY'}</span>
             </div>
             {simulationActive && (
               <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CURRENT FUZZ VALUE</p>
                 <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>{currentFuzzValue}</div>
               </div>
             )}
          </div>
        </div>

        {/* Main Body: Script & Terminal */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 250px', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>AI-GENERATED FUZZ SCRIPT (FOUNDRY/ECHIDNA)</span>
            </div>
            <div style={{ flex: 1, padding: '1.5rem', background: '#0d1117', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.85rem', overflowY: 'auto' }}>
              {fuzzData ? (
                <pre style={{ margin: 0 }}>{fuzzData.fuzzScript}</pre>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#484f58' }}>
                  Engine ready to generate test vectors...
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ background: '#020617', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>&gt;_ EXECUTION LOGS</span>
            </div>
            <div style={{ flex: 1, padding: '1rem 1.5rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ color: log.includes('[CRITICAL]') ? '#f87171' : log.includes('[SUCCESS]') ? '#4ade80' : log.includes('[ERROR]') ? '#fbbf24' : '#94a3b8' }}>
                  {log}
                </div>
              ))}
              {isRunning && <span className="animate-pulse" style={{ color: '#4ade80' }}>_</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
