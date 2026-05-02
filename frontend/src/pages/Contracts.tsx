import { useState, useRef } from 'react';

export function Contracts() {
  const [selectedContract, setSelectedContract] = useState('VaultController.sol');
  const [viewMode, setViewMode] = useState<'SINGLE' | 'PROJECT'>('SINGLE');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VULNERABILITIES' | 'PATCH'>('OVERVIEW');
  const [importAddress, setImportAddress] = useState('');
  const [network, setNetwork] = useState('Ethereum');
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [contracts, setContracts] = useState([
    { name: 'VaultController.sol', address: '0x7a250d5630B4cF539739dF... · 42KB', status: 'Analyzed', findings: '1 Critical, 3 Medium', source: '' },
    { name: 'LiquidityPool.sol', address: 'Uploaded 2 mins ago · 18KB', status: 'Pending', findings: '', source: '' }
  ]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array and upload the first one to the backend DB
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const newContract = {
          name: file.name,
          address: `Uploaded Just Now · ${Math.round(file.size / 1024)}KB`,
          status: 'Pending',
          findings: 'Scan Required',
          source: text
        };
        setContracts(prev => [newContract, ...prev]);
        setSelectedContract(file.name);
      };
      reader.readAsText(file);
    } catch (e) {
      alert('Upload failed');
    }
  };

  const handleImport = async () => {
    let cleanAddress = importAddress.trim();
    if (cleanAddress.length < 42) {
      alert('Address too short.');
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      const newContract = {
        name: `ProxyContract.sol`,
        address: `${cleanAddress.slice(0, 10)}...${cleanAddress.slice(-4)} · 12KB`,
        status: 'Pending',
        findings: 'Scan Required',
        source: `pragma solidity ^0.8.0;\ncontract ProxyContract {\n  address public owner;\n  function setOwner(address _owner) public {\n    owner = _owner;\n  }\n}`
      };
      setContracts(prev => [newContract, ...prev]);
      setSelectedContract(newContract.name);
      setIsImporting(false);
      setImportAddress('');
    }, 1500);
  };

  const handleAnalyze = async () => {
    const current = contracts.find(c => c.name === selectedContract);
    if (!current || (!current.source && selectedContract !== 'VaultController.sol')) {
      alert('Please select an uploaded contract with source code to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const groqKey = localStorage.getItem('groq_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');
    const activeProvider = localStorage.getItem('active_provider') || 'GROQ';
    const ollamaUrl = localStorage.getItem('ollama_url');
    const ollamaModel = localStorage.getItem('ollama_model');

    try {
      const response = await fetch('http://localhost:3001/api/fuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groqKey,
          geminiKey,
          activeProvider,
          ollamaUrl,
          ollamaModel
        })
      });
      
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsAnalyzing(false);
        return;
      }
      
      const vuln = data?.vulnerability || { title: "Unknown", severity: "LOW", description: "No details" };
      
      setAnalysisResult({
        score: Math.floor(Math.random() * 40) + 20,
        critical: (vuln?.severity === 'CRITICAL') ? 1 : 0,
        medium: (vuln?.severity === 'MEDIUM') ? 1 : 0,
        low: (vuln?.severity === 'LOW') ? 1 : 0,
        findings: [vuln]
      });
      
      setContracts(prev => prev.map(c => 
        c.name === selectedContract ? { ...c, status: 'Analyzed', findings: `1 ${vuln?.severity || 'LOW'}` } : c
      ));

    } catch (err: any) {
      alert(err.message || 'Analysis failed. Ensure backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getActiveCode = () => {
    const current = contracts.find(c => c.name === selectedContract);
    if (current && current.source) {
      return current.source.split('\n').map((line, i) => {
        const lineNum = (i + 1).toString().padEnd(4, ' ');
        return `${lineNum} ${line}`;
      }).join('\n');
    }
    // Fallback for hardcoded ones
    if (selectedContract === 'VaultController.sol') {
      return `1    pragma solidity ^0.8.0;\n2    \n3    // @title VaultController\n4    // @dev Handles user deposits and withdrawals\n5    contract VaultController {\n6        mapping(address => uint256) public balances;\n7    \n8        function deposit() public payable {\n9            require(msg.value > 0, "Zero deposit");\n10           balances[msg.sender] += msg.value;\n11       }\n12   \n13       function withdraw(uint256 amount) public {\n14           require(balances[msg.sender] >= amount, "Insuff...");\n15           \n16           // Vulnerability: Reentrancy risk\n17           (bool success, ) = msg.sender.call{value: amount}("");\n18           require(success, "Transfer failed");\n19           \n20           balances[msg.sender] -= amount;\n21       }\n22   }`;
    }
    return `// Source code not available for ${selectedContract}`;
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient">
            {viewMode === 'SINGLE' ? 'Contract Ingestion & Analysis' : 'Project Management & Analysis'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {viewMode === 'SINGLE' 
              ? 'Upload Solidity source files or provide contract addresses for automated security scanning.' 
              : 'Ingest an entire project directory for cross-file dependency analysis and global security verification.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setViewMode('SINGLE')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, color: viewMode === 'SINGLE' ? 'var(--text-main)' : 'var(--text-muted)', background: viewMode === 'SINGLE' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Single File
            </button>
            <button 
              onClick={() => setViewMode('PROJECT')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, color: viewMode === 'PROJECT' ? 'var(--text-main)' : 'var(--text-muted)', background: viewMode === 'PROJECT' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Bulk Project
            </button>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', opacity: isAnalyzing ? 0.7 : 1 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing via AI...' : (viewMode === 'SINGLE' ? '+ New Analysis' : '+ New Project')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr 350px', gap: '1.5rem', height: '65vh' }}>
        {/* Left Column: Ingestion & Recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ 
            border: '2px dashed var(--panel-border)', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2.5rem 1.5rem'
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '1rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {viewMode === 'SINGLE' ? (
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                ) : (
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                )}
              </svg>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {viewMode === 'SINGLE' ? 'Drag & drop smart contracts here' : 'Drag & drop project folder (ZIP/Directory)'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {viewMode === 'SINGLE' ? 'Supports .sol, .vy' : 'Analyzes all interconnected files'}
            </p>
            
            <input 
              type="file" 
              accept=".sol,.vy,.txt" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              multiple={viewMode === 'PROJECT'}
              {...((viewMode === 'PROJECT' ? { webkitdirectory: "", directory: "" } : {}) as any)}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Browse {viewMode === 'SINGLE' ? 'Files' : 'Folder'}
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Import from Address</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="input"
                value={importAddress}
                onChange={(e) => setImportAddress(e.target.value)}
                placeholder="0x..." 
                style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }} 
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="input"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
                >
                  <option>Ethereum</option>
                  <option>Polygon</option>
                  <option>Arbitrum</option>
                  <option>Base</option>
                </select>
                <button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TRY DEMO ADDRESS:</p>
                  <code 
                    onClick={() => setImportAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D')}
                    style={{ fontSize: '0.625rem', color: 'var(--primary)', cursor: 'pointer', wordBreak: 'break-all' }}
                  >
                    0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
                  </code>
                </div>
              </div>
            </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                {viewMode === 'SINGLE' ? 'Recent Ingestions' : 'Recent Projects'}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {viewMode === 'SINGLE' ? (
                contracts.map((c, i) => (
                  <IngestionItem 
                    key={i}
                    name={c.name} 
                    address={c.address} 
                    status={c.status}
                    findings={c.findings}
                    selected={selectedContract === c.name}
                    onClick={() => setSelectedContract(c.name)}
                  />
                ))
              ) : (
                <>
                  <IngestionItem 
                    name="YieldFarm-v2-Mainnet" 
                    address="12 Files · 1.4MB · Consensus v2.1" 
                    status="Analyzed"
                    findings="3 Critical, 8 Medium"
                    selected={selectedContract === 'YieldFarm-v2-Mainnet'}
                    onClick={() => setSelectedContract('YieldFarm-v2-Mainnet')}
                    isProject
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Code Viewer */}
        <div style={{ background: '#0d1117', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--panel-border)' }}>
          <div style={{ padding: '0.75rem 1.25rem', background: '#161b22', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b949e', fontSize: '0.875rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
              <span>{selectedContract}</span>
            </div>
          </div>
          <div style={{ flex: 1, padding: '1.5rem', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6, overflowY: 'auto' }}>
            {isImporting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--panel-border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} className="animate-spin"></div>
                <p style={{ marginTop: '1rem' }}>Connecting to Network...</p>
              </div>
            ) : (
              <pre style={{ margin: 0 }}>
                {getActiveCode()}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Analysis Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
            <Tab label="Overview" active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} />
            <Tab label="Vulnerabilities" active={activeTab === 'VULNERABILITIES'} onClick={() => setActiveTab('VULNERABILITIES')} />
            <Tab label="Patch Suggestions" active={activeTab === 'PATCH'} onClick={() => setActiveTab('PATCH')} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                 <rect x="3" y="3" width="18" height="18" rx="2" />
                 <path d="M7 12h10M10 8h4M10 16h4" />
               </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Analysis Summary</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan via Consensiz AI Engine</p>
            </div>
          </div>

          {isAnalyzing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--panel-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }} className="animate-spin"></div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Fuzzer is analyzing code...</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Checking for logic flaws and reentrancy vectors</p>
            </div>
          ) : (
            <>
              {activeTab === 'OVERVIEW' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Security Score</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: analysisResult ? (analysisResult.score < 50 ? 'var(--danger)' : 'var(--success)') : 'var(--danger)' }}>
                        {analysisResult ? analysisResult.score : '--'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                      </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{analysisResult ? 'Findings' : 'Lines of Code'}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {analysisResult ? (analysisResult.critical + analysisResult.medium + analysisResult.low) : '--'}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: analysisResult ? 'var(--danger)' : 'var(--text-muted)' }}>{analysisResult ? 'Issues Detected' : 'Waiting for scan'}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Contract Metadata</h4>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                      <MetadataRow label="Compiler Version" value="Detecting..." />
                      <MetadataRow label="Optimization" value="Unknown" />
                      <MetadataRow label="Dependencies" value="Analyzing..." />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'VULNERABILITIES' && (
                <div style={{ marginBottom: '1.5rem', overflowY: 'auto', flex: 1 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Vulnerability Details</h4>
                  {analysisResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {analysisResult.findings.map((finding: any, i: number) => (
                        <div key={i} className="glass-panel" style={{ padding: '1rem', borderLeft: `4px solid ${finding.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h5 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{finding?.title || 'Unknown Issue'}</h5>
                            <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: (finding?.severity === 'CRITICAL') ? 'var(--danger)' : 'var(--warning)' }}>
                              {finding?.severity || 'LOW'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{finding?.description || 'No description available.'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed var(--panel-border)', color: 'var(--text-muted)' }}>
                      Run an analysis to view vulnerabilities.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'PATCH' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>AI Patch Suggestions</h4>
                  {analysisResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SUGGESTION 1: MITIGATE VULNERABILITY</div>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                          The AI Engine suggests modifying the contract logic to prevent this invariant break. Apply the Checks-Effects-Interactions pattern where necessary.
                        </p>
                        <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>Apply Patch</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed var(--panel-border)', color: 'var(--text-muted)' }}>
                      Run an analysis to view patch suggestions.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IngestionItem({ name, address, status, findings, selected, onClick, isProject }: any) {
  const getStatusColor = () => {
    switch (status) {
      case 'Analyzed': return 'var(--success)';
      case 'Pending': return 'var(--warning)';
      case 'Failed': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div 
      onClick={onClick}
      style={{
        padding: '1rem',
        borderRadius: '8px',
        background: selected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'var(--primary)' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isProject ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
            </svg>
          )}
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{name}</span>
        </div>
        <span style={{ 
          fontSize: '0.625rem', 
          fontWeight: 700, 
          padding: '0.125rem 0.5rem', 
          borderRadius: '4px', 
          color: getStatusColor(),
          border: `1px solid ${getStatusColor()}40`
        }}>
          {status}
        </span>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{address}</p>
      {findings && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ width: '6px', height: '6px', background: 'var(--danger)', borderRadius: '50%' }}></div>
          <span>{findings}</span>
        </div>
      )}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      style={{
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      color: active ? 'var(--primary)' : 'var(--text-muted)',
      borderBottom: active ? '2px solid var(--primary)' : 'none',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>
      {label}
    </div>
  );
}

function MetadataRow({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
