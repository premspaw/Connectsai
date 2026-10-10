import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, ChevronDown, User, Settings, AlertTriangle, Sun, Moon, Monitor, Plus, Check, Building2, Globe } from 'lucide-react';
import { C, FONT } from '../constants.js';
import { api } from '../api.js';
import { useTheme } from '../theme.jsx';
import logoUrl from '../assets/forgemind-logo.gif';

const THEME_CYCLE = { light: 'dark', dark: 'system', system: 'light' };
const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

// Two workspaces, not three. Chats used to be its own tab, which split one job
// across two places: the funnel and the conversation are the same people seen
// from opposite ends, and moving between them meant changing workspace. The
// inbox, automations and agents now live inside Sales.
const SECTIONS = [
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
];

export default function Topbar({ user, onUserChange, onLogout, onNavigate, section, onSectionChange, hideSections }) {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = THEME_ICON[theme] || Sun;
  const [userOpen, setUserOpen] = useState(false);
  const [unhealthyAccounts, setUnhealthyAccounts] = useState([]);
  const [subaccounts, setSubaccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [subOpen, setSubOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const ref = useRef(null);
  const subRef = useRef(null);

  const loadSubaccounts = () => {
    api.subaccounts.list().then(list => {
      setSubaccounts(list || []);
      api.subaccounts.active().then(act => {
        setActiveAccount(act || list?.[0]);
      }).catch(() => {});
    }).catch(() => {});
  };

  useEffect(() => {
    loadSubaccounts();
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setUserOpen(false);
      if (subRef.current && !subRef.current.contains(e.target)) setSubOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSwitchAccount = async (accId) => {
    setSubOpen(false);
    try {
      const res = await api.subaccounts.switch(accId);
      if (res?.user && onUserChange) {
        onUserChange(res.user);
      }
      setActiveAccount(res?.activeAccount || subaccounts.find(a => a.id === accId));
    } catch (err) {
      console.error('Account switch failed:', err);
    }
  };

  const handleCreateSubaccount = async (e) => {
    e.preventDefault();
    if (!newClientName) return;
    try {
      const created = await api.subaccounts.create({
        name: newClientName,
        shortName: newClientName,
        displayPhoneNumber: newClientPhone || '+91 99999 00000',
        adminEmail: newClientEmail || `admin@${newClientName.toLowerCase().replace(/\s+/g, '')}.com`,
      });
      setCreateModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      loadSubaccounts();
      if (created?.id) {
        handleSwitchAccount(created.id);
      }
    } catch (err) {
      console.error('Failed to create subaccount:', err);
    }
  };

  // Poll account health every 60s so the banner appears within a minute
  // of Meta rejecting a token. Cleared instantly when token is updated.
  useEffect(() => {
    let cancelled = false;
    const check = () => {
      api.whatsappAccounts.list()
        .then(accs => { if (!cancelled) setUnhealthyAccounts(accs.filter(a => a.healthStatus === 'invalid_token')); })
        .catch(() => {});
    };
    check();
    const t = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <>
    {user?.role === 'admin' && unhealthyAccounts.length > 0 && (
      <div
        onClick={() => onNavigate('admin-settings')}
        style={{
          background: '#A32D2D', color: '#fff', padding: '8px 16px',
          fontSize: 14, fontFamily: FONT, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 500,
        }}
      >
        <AlertTriangle size={14} />
        <span>
          Access token expired for {unhealthyAccounts.map(a => a.displayName).join(', ')} — click to update in Settings → WhatsApp Accounts
        </span>
      </div>
    )}
    <div style={{
      height: 56,
      background: C.headerBg,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 13,
      paddingRight: 20,
      borderBottom: `1px solid ${C.headerBorder}`,
      flexShrink: 0,
      zIndex: 100,
      position: 'relative',
    }}>
      {/* Logo area — flush-left logo + wordmark (matches ForgeSocial) */}
      <button
        onClick={() => onNavigate('chats')}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 50%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.headerText,
            fontFamily: FONT,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            CONNECTS
            <span style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 5,
              lineHeight: 1.2,
              letterSpacing: '0.04em',
              display: 'inline-block',
            }}>AI</span>
          </div>
        </div>
      </button>

      {/* Subaccount Switcher Badge & Dropdown */}
      <div ref={subRef} style={{ position: 'relative', marginLeft: 16 }}>
        <button
          onClick={() => setSubOpen(p => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 9,
            background: activeAccount?.id === 'ACCT-002' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            border: `1.5px solid ${activeAccount?.id === 'ACCT-002' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
            cursor: 'pointer',
            fontFamily: FONT,
            transition: 'all .15s',
          }}
        >
          <span style={{ fontSize: 14 }}>
            {activeAccount?.id === 'ACCT-002' ? '🏥' : '👑'}
          </span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}>
              {activeAccount?.shortName || activeAccount?.name || 'Prem Spawar'}
            </div>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: activeAccount?.id === 'ACCT-002' ? '#10b981' : '#6366f1',
              lineHeight: 1.1,
            }}>
              {activeAccount?.id || 'ACCT-001'} • {activeAccount?.type || 'Master'}
            </div>
          </div>
          <ChevronDown size={14} color={C.textMuted} style={{ marginLeft: 2 }} />
        </button>

        {subOpen && (
          <div style={{
            position: 'absolute',
            top: 42,
            left: 0,
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
            padding: 8,
            minWidth: 280,
            zIndex: 300,
            fontFamily: FONT,
          }}>
            <div style={{
              padding: '6px 10px 8px',
              borderBottom: `1px solid ${C.border}`,
              marginBottom: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: C.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Select Subaccount CRM</span>
              <span style={{ background: C.headerSurface, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                {subaccounts.length} Accounts
              </span>
            </div>

            {subaccounts.map(acc => {
              const isSelected = (activeAccount?.id || 'ACCT-001') === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => handleSwitchAccount(acc.id)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    marginBottom: 2,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.headerSurface; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{acc.id === 'ACCT-002' ? '🏥' : '👑'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        {acc.id} • {acc.displayPhoneNumber}
                      </div>
                      <div style={{ fontSize: 10, color: '#0ea5e9' }}>
                        {acc.domain}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="#6366f1" />}
                </button>
              );
            })}

            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6 }}>
              <button
                onClick={() => { setSubOpen(false); setCreateModalOpen(true); }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px dashed ${C.border}`,
                  background: 'transparent',
                  color: C.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                <Plus size={14} />
                + Create New Client Subaccount
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section tabs — Marketing / Sales / Chats. Each section drives its own
          sidebar nav (see Sidebar SECTION_NAV); section is UI state in App.jsx. */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {!hideSections && (
        <div style={{
          display: 'flex',
          gap: 4,
          background: C.headerSurface,
          border: `1.5px solid ${C.headerBorder}`,
          borderRadius: 11,
          padding: 3,
        }}>
          {SECTIONS.map(s => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSectionChange(s.id)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? C.primary : 'transparent',
                  color: active ? '#fff' : C.headerText,
                  // ⚠ NO opacity fade. An inactive tab sat at 0.7 and lifted to
                  // 1 on hover, so the section you are NOT in read as washed
                  // out and only became solid under the cursor — the same
                  // "it goes light until I touch it" the sidebar had. The
                  // active tab is already unmistakable from its red pill and
                  // heavier weight; dimming the other one adds nothing and
                  // costs legibility.
                  fontFamily: FONT,
                  fontSize: 15,
                  fontWeight: active ? 700 : 600,
                  letterSpacing: '-.01em',
                  transition: 'all .15s',
                  whiteSpace: 'nowrap',
                }}
                // Hover moves the BACKGROUND only, so there is no value to
                // restore and no way for the two to drift apart.
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.headerSurface; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle (Light → Dark → System) */}
        <button
          onClick={() => setTheme(THEME_CYCLE[theme] || 'light')}
          title={`Theme: ${theme} (click to switch)`}
          style={{
            width: 36, height: 36, borderRadius: 9,
            background: C.headerSurface, border: `1.5px solid ${C.headerBorder}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <ThemeIcon size={16} color={C.headerText} />
        </button>

        {/* Bell */}
        <button style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: C.headerSurface,
          border: `1.5px solid ${C.headerBorder}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Bell size={16} color={C.headerText} />
        </button>

        {/* User avatar */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserOpen(p => !p)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #534AB7, #7B72E0)',
              border: userOpen ? '2px solid #fff' : `1.5px solid ${C.headerBorder}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              fontFamily: FONT,
              transition: 'border .15s',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </button>

          {userOpen && (
            <div style={{
              position: 'absolute',
              top: 44,
              right: 0,
              background: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: C.shadowMd,
              padding: 6,
              minWidth: 180,
              zIndex: 200,
            }}>
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  {user.displayName || user.username}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                  {user.role}
                </div>
              </div>
              <button
                onClick={() => { setUserOpen(false); onNavigate('admin-settings'); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.text,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: FONT,
                  marginBottom: 4,
                }}
              >
                <Settings size={14} />
                {user?.role === 'admin' ? 'Admin Settings' : 'Settings'}
              </button>
              <button
                onClick={() => { setUserOpen(false); onLogout(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.primary,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Create Client Subaccount Modal */}
    {createModalOpen && (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
        fontFamily: FONT,
      }}>
        <div style={{
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: 480,
          padding: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🏥</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                Register Client Subaccount CRM
              </h3>
              <p style={{ fontSize: 13, color: C.textMuted, margin: '2px 0 0' }}>
                Generates a completely isolated CRM replica for your client.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSubaccount} style={{ marginTop: 20 }}>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                Client / Business Name
              </div>
              <input
                type="text"
                placeholder="e.g. DermaSculpt Clinic, Dr. Smile Dental"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14,
                  fontFamily: FONT,
                  background: C.pageBg,
                  color: C.text,
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                Client WhatsApp Business Number
              </div>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={newClientPhone}
                onChange={e => setNewClientPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14,
                  fontFamily: FONT,
                  background: C.pageBg,
                  color: C.text,
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                Client Admin Email (for login)
              </div>
              <input
                type="email"
                placeholder="e.g. admin@dermasculpt.com"
                value={newClientEmail}
                onChange={e => setNewClientEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14,
                  fontFamily: FONT,
                  background: C.pageBg,
                  color: C.text,
                  outline: 'none',
                }}
              />
            </label>

            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 12,
              color: C.text,
            }}>
              <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: 2 }}>Subdomain Setup:</div>
              <div>Hostinger DNS: <code>{newClientName ? newClientName.toLowerCase().replace(/\s+/g, '') : 'client'}.yourdomain.com</code></div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.text,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: FONT,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '9px 18px',
                  borderRadius: 9,
                  border: 'none',
                  background: C.primary,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: FONT,
                }}
              >
                Create Subaccount Replica
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
