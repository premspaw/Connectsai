import { useState } from 'react';
import { Lock, LogIn, Eye, EyeOff, Shield } from 'lucide-react';
import { api } from '../api.js';
import { C, FONT } from '../constants.js';

export default function LoginGate({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password required.'); return; }
    setError('');
    setLoading(true);
    try {
      const { user } = await api.auth.login(email, password);
      onLogin(user);
    } catch (err) {
      // Plain, friendly message — never a status code. 401 is the common case
      // (typo'd email/password); other statuses keep the server's already-
      // friendly text (e.g. "Account is disabled. Contact an administrator.").
      let msg;
      if (err.status === 401) msg = 'Incorrect email or password. Please try again.';
      else if (err.network) msg = "Can't reach the server. Please check your connection and try again.";
      else msg = err.message || 'Something went wrong while signing in. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      fontFamily: FONT,
    }}>
      {/* Left brand panel — fills full height */}
      <div className="login-brand-panel" style={{
        flex: 1,
        minWidth: 0,
        background: C.headerBg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle radial accent */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(83,74,183,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 50%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
              flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: C.headerText,
              }}>
                Connects<span style={{ color: C.primary }}>.ai</span>
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.headerMuted,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 4,
              }}>
                AI WhatsApp Growth CRM
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: 42,
            fontWeight: 800,
            color: C.headerText,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: 20,
          }}>
            Manage conversations at scale
          </h1>
          <p style={{
            fontSize: 18,
            color: C.headerMuted,
            lineHeight: 1.6,
            marginBottom: 40,
          }}>
            The unified WhatsApp Business platform for teams. Automate replies, build chatbots, and nurture leads — all in one place.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 12,
            background: C.headerSurface,
            border: `1px solid ${C.headerBorder}`,
            maxWidth: 340,
          }}>
            <Shield size={20} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#d4d4d8' }}>
              Enterprise-grade security & compliance
            </span>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 32,
          left: 64,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--c-x52525b, #52525b)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}>
          Powered by FMOS
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel" style={{
        width: '100%',
        maxWidth: 540,
        minWidth: 360,
        background: C.pageBg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 48px',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Lock size={14} color={C.primary} />
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.primary,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Sign In
            </span>
          </div>
          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.text,
            marginBottom: 28,
            letterSpacing: '-0.02em',
          }}>
            Welcome back
          </h2>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', marginBottom: 18 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.textSecondary,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                Email
              </div>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 15,
                  fontFamily: FONT,
                  outline: 'none',
                  background: C.cardBg,
                  color: C.text,
                  transition: 'border .15s',
                }}
                onFocus={e => (e.target.style.borderColor = C.purple)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 24 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.textSecondary,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                Password
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 38px 11px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 15,
                    fontFamily: FONT,
                    outline: 'none',
                    background: C.cardBg,
                    color: C.text,
                    transition: 'border .15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = C.purple)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div style={{
                background: C.primaryLight,
                color: 'var(--c-dangerText, #A32D2D)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 15,
                marginBottom: 16,
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: C.primary,
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: FONT,
                transition: 'opacity .15s, background .15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.primaryHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.primary; }}
            >
              <LogIn size={16} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div style={{
              margin: '20px 0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: C.textMuted,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span>or explore</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await api.auth.login('premspaw@gmail.com', 'AdminConnectsAI2026!');
                    await api.subaccounts.switch('ACCT-001').catch(() => {});
                    onLogin(res?.user || {
                      id: 1,
                      username: 'premspaw',
                      email: 'premspaw@gmail.com',
                      displayName: 'Prem Spawar',
                      role: 'admin',
                      accountId: 'ACCT-001',
                      accountName: 'Prem Spawar (ConnectsAI Main)',
                      accountType: 'Agency Master',
                      pages: [
                        'home', 'chatbot-builder', 'template-builder', 'chats',
                        'bulk-message', 'admin-settings', 'media-library', 'wa-links',
                        'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
                        'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
                        'sales-pipeline', 'leads', 'payments', 'onboarding',
                        'sales-funnel', 'message-costs'
                      ],
                      assignedWaNumbers: ['918660395136'],
                    });
                  } catch {
                    await api.subaccounts.switch('ACCT-001').catch(() => {});
                    onLogin({
                      id: 1,
                      username: 'premspaw',
                      email: 'premspaw@gmail.com',
                      displayName: 'Prem Spawar',
                      role: 'admin',
                      accountId: 'ACCT-001',
                      accountName: 'Prem Spawar (ConnectsAI Main)',
                      accountType: 'Agency Master',
                      pages: [
                        'home', 'chatbot-builder', 'template-builder', 'chats',
                        'bulk-message', 'admin-settings', 'media-library', 'wa-links',
                        'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
                        'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
                        'sales-pipeline', 'leads', 'payments', 'onboarding',
                        'sales-funnel', 'message-costs'
                      ],
                      assignedWaNumbers: ['918660395136'],
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #6366f1',
                  background: 'rgba(99, 102, 241, 0.08)',
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: FONT,
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>👑</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Prem Spawar (Main Admin)</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>ACCT-001 • Master Account</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>Open →</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await api.auth.login('admin@dermasculpt.com', 'DermaSculptAdmin2026!');
                    await api.subaccounts.switch('ACCT-002').catch(() => {});
                    onLogin(res?.user || {
                      id: 2,
                      username: 'dermasculpt',
                      email: 'admin@dermasculpt.com',
                      displayName: 'DermaSculpt Clinic',
                      role: 'admin',
                      accountId: 'ACCT-002',
                      accountName: 'DermaSculpt Clinic',
                      accountType: 'Client Subaccount',
                      pages: [
                        'home', 'chatbot-builder', 'template-builder', 'chats',
                        'bulk-message', 'admin-settings', 'media-library', 'wa-links',
                        'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
                        'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
                        'sales-pipeline', 'leads', 'payments', 'onboarding',
                        'sales-funnel', 'message-costs'
                      ],
                      assignedWaNumbers: ['919876543210'],
                    });
                  } catch {
                    await api.subaccounts.switch('ACCT-002').catch(() => {});
                    onLogin({
                      id: 2,
                      username: 'dermasculpt',
                      email: 'admin@dermasculpt.com',
                      displayName: 'DermaSculpt Clinic',
                      role: 'admin',
                      accountId: 'ACCT-002',
                      accountName: 'DermaSculpt Clinic',
                      accountType: 'Client Subaccount',
                      pages: [
                        'home', 'chatbot-builder', 'template-builder', 'chats',
                        'bulk-message', 'admin-settings', 'media-library', 'wa-links',
                        'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
                        'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
                        'sales-pipeline', 'leads', 'payments', 'onboarding',
                        'sales-funnel', 'message-costs'
                      ],
                      assignedWaNumbers: ['919876543210'],
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #10b981',
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: FONT,
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🏥</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>DermaSculpt Clinic (Subaccount)</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>ACCT-002 • Client Portal Replica</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>Open →</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Responsive: hide brand panel on small screens */}
      <style>{`
        @media (max-width: 900px) {
          .login-brand-panel { display: none !important; }
        }
        @media (max-width: 900px) {
          .login-form-panel { max-width: 100% !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
