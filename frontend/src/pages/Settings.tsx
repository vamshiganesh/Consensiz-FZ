import { useState, useEffect } from 'react';

export function Settings() {
  const [groqKey, setGroqKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('ollama_url') || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(localStorage.getItem('ollama_model') || 'llama3');
  const [activeProvider, setActiveProvider] = useState(localStorage.getItem('active_provider') || 'GROQ');
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [pinataApiKey, setPinataApiKey] = useState(localStorage.getItem('pinata_api_key') || '');
  const [pinataSecretKey, setPinataSecretKey] = useState(localStorage.getItem('pinata_secret_key') || '');
  const [sepoliaPrivateKey, setSepoliaPrivateKey] = useState(localStorage.getItem('sepolia_private_key') || '');
  const [sepoliaRpcUrl, setSepoliaRpcUrl] = useState(localStorage.getItem('sepolia_rpc_url') || 'https://rpc.sepolia.org');

  useEffect(() => {
    detectLocalModels();
  }, [ollamaUrl]);

  const detectLocalModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`);
      const data = await res.json();
      if (data.models) {
        setLocalModels(data.models.map((m: any) => m.name));
      }
    } catch (e) {
      console.error('Failed to detect local models:', e);
      setLocalModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('groq_api_key', groqKey);
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('ollama_url', ollamaUrl);
    localStorage.setItem('ollama_model', ollamaModel);
    localStorage.setItem('active_provider', activeProvider);
    localStorage.setItem('pinata_api_key', pinataApiKey);
    localStorage.setItem('pinata_secret_key', pinataSecretKey);
    localStorage.setItem('sepolia_private_key', sepoliaPrivateKey);
    localStorage.setItem('sepolia_rpc_url', sepoliaRpcUrl);
    alert('Settings saved successfully!');
  };

  const providers = [
    { id: 'GROQ', name: 'Groq Cloud', icon: '⚡' },
    { id: 'GEMINI', name: 'Google Gemini', icon: '💎' },
    { id: 'OLLAMA', name: 'Local Ollama', icon: '🏠' }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <h1 className="text-gradient">AI Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Configure and select your primary LLM provider for the fuzz testing engine.</p>
      
      {/* Provider Selector */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {providers.map(p => (
          <div 
            key={p.id}
            onClick={() => setActiveProvider(p.id)}
            className="glass-panel"
            style={{ 
              flex: 1, 
              padding: '1.5rem', 
              cursor: 'pointer', 
              textAlign: 'center',
              border: activeProvider === p.id ? '2px solid var(--primary)' : '1px solid var(--panel-border)',
              background: activeProvider === p.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--panel-bg)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{p.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
            {activeProvider === p.id && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, marginTop: '0.5rem' }}>ACTIVE</div>}
          </div>
        ))}
      </div>

      <div className="flex gap-6 flex-wrap">
        {/* Groq Settings */}
        <div className="glass-panel p-6 flex-col" style={{ gap: '1rem', flex: '1 1 350px', opacity: activeProvider === 'GROQ' ? 1 : 0.5 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>Groq Cloud</h3>
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>API Key</label>
            <input 
              type="password" 
              className="input" 
              value={groqKey} 
              onChange={(e) => setGroqKey(e.target.value)} 
              placeholder="gsk_..."
              disabled={activeProvider !== 'GROQ'}
            />
          </div>
        </div>

        {/* Gemini Settings */}
        <div className="glass-panel p-6 flex-col" style={{ gap: '1rem', flex: '1 1 350px', opacity: activeProvider === 'GEMINI' ? 1 : 0.5 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4285F4' }}>Google Gemini</h3>
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>API Key</label>
            <input 
              type="password" 
              className="input" 
              value={geminiKey} 
              onChange={(e) => setGeminiKey(e.target.value)} 
              placeholder="AIza..."
              disabled={activeProvider !== 'GEMINI'}
            />
          </div>
        </div>

        {/* Ollama Settings */}
        <div className="glass-panel p-6 flex-col" style={{ gap: '1rem', flex: '1 1 350px', opacity: activeProvider === 'OLLAMA' ? 1 : 0.5 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>Local Ollama</h3>
          
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Base URL</label>
            <input 
              type="text" 
              className="input" 
              value={ollamaUrl} 
              onChange={(e) => setOllamaUrl(e.target.value)} 
              placeholder="http://localhost:11434"
              disabled={activeProvider !== 'OLLAMA'}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Detected Models</label>
            <select 
              className="input" 
              value={ollamaModel} 
              onChange={(e) => setOllamaModel(e.target.value)}
              disabled={activeProvider !== 'OLLAMA' || isLoadingModels}
            >
              {isLoadingModels ? (
                <option>Detecting models...</option>
              ) : localModels.length > 0 ? (
                localModels.map(m => <option key={m} value={m}>{m}</option>)
              ) : (
                <option>No models detected (Ensure Ollama is running)</option>
              )}
            </select>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.3rem', fontSize: '0.7rem', marginTop: '0.2rem' }}
              onClick={detectLocalModels}
              disabled={activeProvider !== 'OLLAMA'}
            >
              ↻ Refresh Models
            </button>
          </div>
        </div>
      </div>
      {/* Blockchain Verification Settings */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>🔗 Blockchain Verification</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Configure credentials for IPFS pinning, Sepolia attestation, and ZKP registration.</p>
        
        <div className="flex gap-6 flex-wrap">
          {/* Pinata */}
          <div className="glass-panel p-6 flex-col" style={{ gap: '1rem', flex: '1 1 350px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>📦 Pinata (IPFS)</h3>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>API Key</label>
              <input 
                type="password" 
                className="input" 
                value={pinataApiKey} 
                onChange={(e) => setPinataApiKey(e.target.value)} 
                placeholder="Your Pinata API Key"
              />
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>API Secret</label>
              <input 
                type="password" 
                className="input" 
                value={pinataSecretKey} 
                onChange={(e) => setPinataSecretKey(e.target.value)} 
                placeholder="Your Pinata API Secret"
              />
            </div>
          </div>

          {/* Sepolia */}
          <div className="glass-panel p-6 flex-col" style={{ gap: '1rem', flex: '1 1 350px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6' }}>⛓️ Sepolia Testnet</h3>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Private Key</label>
              <input 
                type="password" 
                className="input" 
                value={sepoliaPrivateKey} 
                onChange={(e) => setSepoliaPrivateKey(e.target.value)} 
                placeholder="0x... (testnet wallet only!)"
              />
            </div>
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>RPC URL</label>
              <input 
                type="text" 
                className="input" 
                value={sepoliaRpcUrl} 
                onChange={(e) => setSepoliaRpcUrl(e.target.value)} 
                placeholder="https://rpc.sepolia.org"
              />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
              ⚠️ Use a dedicated testnet wallet. Never use your mainnet private key.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="btn btn-primary" onClick={saveSettings} style={{ padding: '0.75rem 2.5rem', fontWeight: 700 }}>SAVE SETTINGS</button>
      </div>
    </div>
  );
}
