import os

filepath = r'd:\UniGPU\frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove handleUnblockWallet
content = content.replace('''  const handleUnblockWallet = async (userId) => {
    if (!window.confirm("Are you sure you want to manually unblock this user's wallet? This will forgive any negative debt and reset their balance to 0.")) return;
    try {
      await api.unblockWallet(userId);
      alert("Wallet unblocked successfully.");
    } catch (e) {
      console.error('Failed to unblock wallet', e);
      alert(e.detail || "Failed to unblock wallet");
    }
  };

''', '')

# 2. Remove Unblock Wallet button from the UI
unblock_btn = '''                        <button
                          className="cd-btn"
                          style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid var(--lp-stone-divider)' }}
                          onClick={() => handleUnblockWallet(u.id)}
                        >
                          Unblock Wallet
                        </button>'''
content = content.replace(unblock_btn, '')

# 3. Change vibrant colors in Overview stats
content = content.replace("color: '#10b981'", "color: 'var(--lp-midnight-ink)'")
content = content.replace("color: '#8b5cf6'", "color: 'var(--lp-midnight-ink)'")
content = content.replace("color: '#f59e0b'", "color: 'var(--lp-midnight-ink)'")

# 4. Add settingsTab state
content = content.replace("const [tab, setTab] = useState('overview');", "const [tab, setTab] = useState('overview');\n  const [settingsTab, setSettingsTab] = useState('global');")

# 5. Completely rewrite the Settings Tab
settings_old = content[content.find('{/* Settings Tab */}'):content.find('      </div>\\n    </div>\\n  );\\n}')]

settings_new = '''{/* Settings Tab */}
        {tab === 'settings' && (
          <div>
            {/* Nested Settings Tabs */}
            <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--lp-stone-divider)', marginBottom: '32px' }}>
              {[
                { id: 'global', label: 'Global Settings' },
                { id: 'security', label: 'Security' },
                { id: 'agent', label: 'Agent Release' }
              ].map(t => (
                <div
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  style={{
                    paddingBottom: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: settingsTab === t.id ? 600 : 500,
                    color: settingsTab === t.id ? 'var(--lp-midnight-ink)' : 'var(--lp-ash-helper)',
                    borderBottom: settingsTab === t.id ? '2px solid var(--lp-midnight-ink)' : '2px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>

            <div style={{ maxWidth: '640px' }}>
              
              {/* 1. Global Settings */}
              {settingsTab === 'global' && (
                <div className="cd-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 4px' }}>Global Settings</h2>
                  <p style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', margin: '0 0 20px' }}>Manage platform-wide financial thresholds.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Overdraft Limit (Credits)</label>
                      <input 
                        className="cd-input" 
                        type="number" 
                        value={overdraftLimit} 
                        onChange={e => setOverdraftLimit(e.target.value)} 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button 
                      className="cd-btn cd-btn--primary" 
                      onClick={handleSaveSettings} 
                      disabled={savingSettings}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {savingSettings ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Security Settings */}
              {settingsTab === 'security' && (
                <div className="cd-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 4px' }}>Security</h2>
                  <p style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', margin: '0 0 20px' }}>Enhance your admin account with 2FA.</p>
                  
                  {user?.is_2fa_enabled ? (
                    <div style={{ background: 'var(--lp-fog-surface)', border: '1px solid var(--lp-stone-divider)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--lp-midnight-ink)', fontWeight: 500 }}>
                          2FA is enabled
                        </div>
                        {!showDisable2FA && (
                          <button
                            className="cd-btn"
                            onClick={() => setShowDisable2FA(true)}
                            style={{ fontSize: '13px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                          >
                            Disable
                          </button>
                        )}
                      </div>
                      
                      {showDisable2FA && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--lp-stone-divider)' }}>
                          <p style={{ fontSize: '13px', margin: '0 0 12px', color: 'var(--lp-ash-helper)' }}>Enter your authenticator code to confirm disable:</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input
                              className="cd-input"
                              type="text"
                              inputMode="numeric"
                              placeholder="000000"
                              value={disableCode}
                              onChange={e => setDisableCode(e.target.value.replace(/\\D/g, ''))}
                              style={{ width: '100px', textAlign: 'center', letterSpacing: '2px' }}
                              maxLength={6}
                            />
                            <button
                              className="cd-btn"
                              onClick={handleDisable2FA}
                              disabled={disableCode.length !== 6 || disabling2FA}
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            >
                              {disabling2FA ? '...' : 'Confirm'}
                            </button>
                            <button className="cd-btn cd-btn--outline" onClick={() => { setShowDisable2FA(false); setDisableCode(''); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--lp-fog-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--lp-stone-divider)' }}>
                      {!twoFactorQR ? (
                        <div>
                          <p style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', margin: '0 0 16px' }}>Protect your admin account using an authenticator app.</p>
                          <button className="cd-btn cd-btn--primary" onClick={handleSetup2FA} disabled={settingUp2FA}>
                            {settingUp2FA ? 'Generating QR...' : 'Setup 2FA'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>1. Scan this QR Code with your App</p>
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', display: 'inline-block', alignSelf: 'flex-start', border: '1px solid var(--lp-stone-divider)' }}>
                            <img src={twoFactorQR} alt="2FA QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                          </div>
                          
                          <p style={{ fontSize: '13px', fontWeight: 500, margin: '8px 0 0' }}>2. Enter the 6-digit verification code</p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              className="cd-input" 
                              type="text"
                              inputMode="numeric"
                              placeholder="000000" 
                              value={twoFactorCode} 
                              onChange={e => setTwoFactorCode(e.target.value.replace(/\\D/g, ''))}
                              style={{ width: '100px', textAlign: 'center', letterSpacing: '2px', fontSize: '16px' }}
                              maxLength={6}
                            />
                            <button className="cd-btn cd-btn--primary" onClick={handleEnable2FA} disabled={twoFactorCode.length !== 6}>
                              Verify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Agent Release */}
              {settingsTab === 'agent' && (
                <div className="cd-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 4px' }}>Agent Release</h2>
                  <p style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', margin: '0 0 20px' }}>Publish a new version of the UniGPU Agent.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Agent Executable (.exe)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label 
                          htmlFor="agentFileInput" 
                          className="cd-btn" 
                          style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '13px', background: 'var(--lp-fog-surface)' }}
                        >
                          Browse Files
                        </label>
                        <span style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {agentFile ? agentFile.name : 'No file chosen'}
                        </span>
                        <input 
                          id="agentFileInput"
                          type="file" 
                          accept=".exe"
                          onChange={e => setAgentFile(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Version (e.g. v2.1.0)</label>
                      <input 
                        type="text" 
                        value={agentVersion}
                        onChange={e => setAgentVersion(e.target.value)}
                        placeholder="v2.1.0"
                        className="cd-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Patch Notes</label>
                      <textarea 
                        value={agentPatchNotes}
                        onChange={e => setAgentPatchNotes(e.target.value)}
                        placeholder="- Added new feature&#10;- Fixed a bug"
                        className="cd-input"
                        style={{ width: '100%', minHeight: '100px', height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: '1.5' }}
                      />
                    </div>

                    <button 
                      className="cd-btn" 
                      onClick={handleAgentUpload} 
                      disabled={uploadingAgent}
                      style={{ alignSelf: 'flex-start', background: 'var(--lp-midnight-ink)', color: '#fff', border: 'none' }}
                    >
                      {uploadingAgent ? 'Publishing...' : 'Publish Release'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}'''

content = content.replace(settings_old, settings_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Rewrite successful")
