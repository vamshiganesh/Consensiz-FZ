import React, { useEffect, useState } from 'react';

interface RegistrationState {
  findingId: string;
  status: 'idle' | 'registering' | 'done' | 'error';
  currentStep: string;
  result: any;
  error: string;
}

export function FailureVault() {
  const [findings, setFindings] = useState([]);
  const [registrations, setRegistrations] = useState<Record<string, RegistrationState>>({});
  const [expandedProof, setExpandedProof] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/findings')
      .then(res => res.json())
      .then(data => setFindings(data));
  }, []);

  const registerOnChain = async (findingId: string) => {
    const pinataApiKey = localStorage.getItem('pinata_api_key');
    const pinataSecretKey = localStorage.getItem('pinata_secret_key');
    const sepoliaPrivateKey = localStorage.getItem('sepolia_private_key');
    const sepoliaRpcUrl = localStorage.getItem('sepolia_rpc_url') || 'https://rpc.sepolia.org';

    if (!pinataApiKey || !pinataSecretKey) {
      alert('Pinata API credentials missing. Please configure them in Settings.');
      return;
    }
    if (!sepoliaPrivateKey) {
      alert('Sepolia private key missing. Please configure it in Settings.');
      return;
    }

    setRegistrations(prev => ({
      ...prev,
      [findingId]: { findingId, status: 'registering', currentStep: 'IPFS', result: null, error: '' }
    }));

    // Simulate step progression for live UX
    setTimeout(() => {
      setRegistrations(prev => ({
        ...prev,
        [findingId]: { ...prev[findingId], currentStep: 'SEPOLIA' }
      }));
    }, 2000);

    setTimeout(() => {
      setRegistrations(prev => ({
        ...prev,
        [findingId]: { ...prev[findingId], currentStep: 'ZKP' }
      }));
    }, 5000);

    try {
      const res = await fetch('http://localhost:3001/api/register-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId,
          pinataApiKey,
          pinataSecretKey,
          sepoliaPrivateKey,
          sepoliaRpcUrl
        })
      });

      const data = await res.json();

      if (data.error) {
        setRegistrations(prev => ({
          ...prev,
          [findingId]: { ...prev[findingId], status: 'error', error: data.error }
        }));
      } else {
        setRegistrations(prev => ({
          ...prev,
          [findingId]: { ...prev[findingId], status: 'done', result: data, currentStep: 'COMPLETE' }
        }));
        // Refresh findings to show updated data from DB
        const refreshed = await fetch('http://localhost:3001/api/findings');
        setFindings(await refreshed.json());
      }
    } catch (err: any) {
      setRegistrations(prev => ({
        ...prev,
        [findingId]: { ...prev[findingId], status: 'error', error: err.message || 'Registration failed' }
      }));
    }
  };

  const stepIcon = (step: string, currentStep: string, status: string) => {
    const steps = ['IPFS', 'SEPOLIA', 'ZKP', 'COMPLETE'];
    const stepIdx = steps.indexOf(step);
    const currentIdx = steps.indexOf(currentStep);

    if (status === 'done') return '✅';
    if (status === 'error' && stepIdx >= currentIdx) return '❌';
    if (stepIdx < currentIdx) return '✅';
    if (stepIdx === currentIdx) return '⏳';
    return '⬜';
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Failure Case Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>
            Persistent, verifiable chain of detected vulnerabilities — anchored to IPFS, Sepolia & ZKP.
          </p>
        </div>
      </div>

      <div className="flex-col gap-6">
        {findings.map((f: any) => {
          const reg = registrations[f.id];
          const isRegistered = !!f.ipfsCid;
          const isRegistering = reg?.status === 'registering';

          return (
            <div key={f.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Finding Header */}
              <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                  <div className="flex items-center gap-4">
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      color: 'var(--danger)',
                      fontWeight: 800,
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>#{f.id?.slice(0, 8) || '????????'}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: f.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: f.severity === 'CRITICAL' ? '#ff4d4d' : '#ffa500'
                    }}>{f.severity || 'UNKNOWN'}</span>
                    {isRegistered && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80'
                      }}>🔗 ON-CHAIN</span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Date Unknown'}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  BEHAVIOR (WHAT BROKE?)
                </h3>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Invariant Broken: {f.title}</p>

                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  DETAILS (WHY IT HAPPENED)
                </h3>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {f.description}
                </div>
              </div>

              {/* Registration Panel */}
              <div style={{
                padding: '1.5rem 2rem',
                background: isRegistered ? 'rgba(34, 197, 94, 0.03)' : 'rgba(59, 130, 246, 0.03)',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                {!isRegistered && !isRegistering && reg?.status !== 'error' && reg?.status !== 'done' && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>Blockchain Verification</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pin to IPFS → Attest on Sepolia → Generate Zero-Knowledge Proof</p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => registerOnChain(f.id)}
                      style={{ padding: '0.7rem 1.5rem', fontWeight: 800, borderRadius: '10px', fontSize: '0.85rem' }}
                    >
                      🔒 Register on Chain
                    </button>
                  </div>
                )}

                {/* Live Progress */}
                {isRegistering && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--primary)' }}>
                      ⏳ Registration in Progress...
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      {['IPFS', 'SEPOLIA', 'ZKP'].map(step => (
                        <div key={step} style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.2)',
                          border: `1px solid ${reg.currentStep === step ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                          textAlign: 'center',
                          transition: 'all 0.3s'
                        }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stepIcon(step, reg.currentStep, reg.status)}</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{step}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {step === 'IPFS' && 'Pinata Gateway'}
                            {step === 'SEPOLIA' && 'Testnet TX'}
                            {step === 'ZKP' && 'Poseidon Proof'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {reg?.status === 'error' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 600 }}>
                      ❌ {reg.error}
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => registerOnChain(f.id)}
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      ↻ Retry
                    </button>
                  </div>
                )}

                {/* Success — On-Chain Record */}
                {(isRegistered || reg?.status === 'done') && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1.25rem', color: '#4ade80' }}>
                      ✅ Verified & Registered On-Chain
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      {/* IPFS */}
                      <div style={{
                        padding: '1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                      }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                          📦 IPFS CID
                        </div>
                        {(f.ipfsCid || reg?.result?.ipfsCid) ? (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${f.ipfsCid || reg?.result?.ipfsCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              wordBreak: 'break-all',
                              textDecoration: 'none'
                            }}
                          >
                            {(f.ipfsCid || reg?.result?.ipfsCid)?.slice(0, 20)}...
                          </a>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                      </div>

                      {/* Sepolia */}
                      <div style={{
                        padding: '1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                      }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                          ⛓️ SEPOLIA TX
                        </div>
                        {(f.sepoliaTxHash || reg?.result?.sepoliaTxHash) ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${f.sepoliaTxHash || reg?.result?.sepoliaTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              wordBreak: 'break-all',
                              textDecoration: 'none'
                            }}
                          >
                            {(f.sepoliaTxHash || reg?.result?.sepoliaTxHash)?.slice(0, 20)}...
                          </a>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}
                      </div>

                      {/* ZKP */}
                      <div style={{
                        padding: '1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        cursor: 'pointer'
                      }}
                        onClick={() => setExpandedProof(expandedProof === f.id ? null : f.id)}
                      >
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                          🔐 ZK PROOF
                        </div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: '#a78bfa',
                          wordBreak: 'break-all'
                        }}>
                          {(() => {
                            const proof = f.zkProof || reg?.result?.zkProof;
                            if (!proof) return '—';
                            try {
                              const parsed = typeof proof === 'string' ? JSON.parse(proof) : proof;
                              return (parsed.proof || proof).slice(0, 20) + '...';
                            } catch {
                              return typeof proof === 'string' ? proof.slice(0, 20) + '...' : '—';
                            }
                          })()}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click to expand</div>
                      </div>
                    </div>

                    {/* Expanded ZKP Details */}
                    {expandedProof === f.id && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(167, 139, 250, 0.2)',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        lineHeight: 1.8
                      }}>
                        <div style={{ fontWeight: 800, color: '#a78bfa', marginBottom: '1rem', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          Zero-Knowledge Proof Details (Poseidon Commitment)
                        </div>
                        {(() => {
                          const proof = f.zkProof || reg?.result?.zkProof;
                          if (!proof) return <span style={{ color: 'var(--text-muted)' }}>No proof data</span>;
                          try {
                            const parsed = typeof proof === 'string' ? JSON.parse(proof) : proof;
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div><span style={{ color: '#4ade80' }}>PROOF:</span> <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{parsed.proof}</span></div>
                                <div><span style={{ color: '#4ade80' }}>COMMITMENT:</span> <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{parsed.commitment}</span></div>
                                <div><span style={{ color: '#4ade80' }}>NULLIFIER:</span> <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{parsed.nullifier}</span></div>
                                <div><span style={{ color: '#4ade80' }}>PUB_INPUT_HASH:</span> <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{parsed.publicInputHash}</span></div>
                                <div><span style={{ color: '#4ade80' }}>TIMESTAMP:</span> <span style={{ color: '#94a3b8' }}>{parsed.timestamp ? new Date(parsed.timestamp).toISOString() : '—'}</span></div>
                              </div>
                            );
                          } catch {
                            return <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{typeof proof === 'string' ? proof : JSON.stringify(proof)}</span>;
                          }
                        })()}
                      </div>
                    )}

                    {/* Registration Timestamp */}
                    {(f.registeredAt || reg?.result?.registeredAt) && (
                      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Registered: {new Date(f.registeredAt || reg?.result?.registeredAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {findings.length === 0 && (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No failures logged yet. Run a fuzz test to populate the vault.</p>
          </div>
        )}
      </div>
    </div>
  );
}
