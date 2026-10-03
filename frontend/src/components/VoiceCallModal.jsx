import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, Bot, Clock, AlertCircle, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { api } from '../api.js';

const FONT = 'Plus Jakarta Sans, sans-serif';

export function VoiceCallModal({ isOpen, onClose, initialPhone = '', leadId = null, contactId = null, leadName = '' }) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle | dialing | ringing | in-progress | completed | failed
  const [callId, setCallId] = useState(null);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(initialPhone || '');
      setCallState('idle');
      setError(null);
      setDuration(0);
      setTranscript('');
      api.voice.getAgents().then(data => {
        setAgents(data || []);
        const defaultAgent = (data || []).find(a => a.is_default) || data?.[0];
        if (defaultAgent) setSelectedAgentId(defaultAgent.id);
      }).catch(() => {});
    }
  }, [isOpen, initialPhone]);

  useEffect(() => {
    let timer;
    if (callState === 'in-progress') {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Poll call details when in flight
  useEffect(() => {
    let pollInterval;
    if (callId && (callState === 'dialing' || callState === 'ringing' || callState === 'in-progress')) {
      pollInterval = setInterval(async () => {
        try {
          const c = await api.voice.getCall(callId);
          if (c) {
            if (c.status === 'in-progress' && callState !== 'in-progress') {
              setCallState('in-progress');
            } else if (c.status === 'completed' || c.status === 'failed' || c.status === 'busy') {
              setCallState(c.status);
              if (c.transcript) setTranscript(c.transcript);
              if (c.duration_seconds) setDuration(c.duration_seconds);
              clearInterval(pollInterval);
            }
          }
        } catch (_) {}
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [callId, callState]);

  if (!isOpen) return null;

  const handleStartCall = async () => {
    setError(null);
    const cleanNumber = String(phoneNumber).replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setCallState('dialing');
    try {
      const res = await api.voice.dial({
        phoneNumber: cleanNumber,
        agentId: selectedAgentId,
        leadId,
        contactId,
        metadata: { leadName },
      });
      if (res.callId) {
        setCallId(res.callId);
        setCallState('ringing');
      }
    } catch (err) {
      setError(err.message || 'Failed to place call');
      setCallState('failed');
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--c-cardBg, #18191a)',
        border: '1px solid var(--c-borderDark, rgba(255, 255, 255, 0.12))',
        borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        fontFamily: FONT, color: 'var(--c-text, #e4e6eb)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--c-borderDark, rgba(255, 255, 255, 0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--c-surface, rgba(255, 255, 255, 0.03))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00A884, #008069)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <PhoneCall size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>AI Phone Agent</div>
              <div style={{ fontSize: 12, color: 'var(--c-textMuted, #8a8d91)' }}>
                Powered by VoiceLink & Gemini Live
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--c-textMuted, #8a8d91)',
              fontSize: 20, cursor: 'pointer', padding: '4px 8px', borderRadius: 6
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={16} flexShrink={0} />
              <div>{error}</div>
            </div>
          )}

          {callState === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {leadName && (
                <div style={{
                  padding: '10px 12px', background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <User size={15} color="var(--c-textMuted)" />
                  <span>Calling: <strong>{leadName}</strong></span>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-textMuted, #8a8d91)', display: 'block', marginBottom: 6 }}>
                  PHONE NUMBER (WITH COUNTRY CODE)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 919307512816"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      background: 'var(--c-inputBg, rgba(255, 255, 255, 0.06))',
                      border: '1px solid var(--c-borderDark, rgba(255, 255, 255, 0.15))',
                      color: 'var(--c-text, #fff)', fontSize: 15, fontFamily: 'DM Mono, monospace',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-textMuted, #8a8d91)', display: 'block', marginBottom: 6 }}>
                  SELECT VOICE AGENT
                </label>
                <select
                  value={selectedAgentId || ''}
                  onChange={(e) => setSelectedAgentId(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: 'var(--c-inputBg, rgba(255, 255, 255, 0.06))',
                    border: '1px solid var(--c-borderDark, rgba(255, 255, 255, 0.15))',
                    color: 'var(--c-text, #fff)', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id} style={{ background: '#242526', color: '#fff' }}>
                      {a.name} ({a.voice_name || 'Aoede'} • {a.gemini_model})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartCall}
                style={{
                  marginTop: 8, width: '100%', padding: '14px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #00A884, #008069)',
                  border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 14px rgba(0, 168, 132, 0.35)'
                }}
              >
                <Phone size={18} /> Place Outbound Call
              </button>
            </div>
          )}

          {callState !== 'idle' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              {/* Call Status Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: callState === 'in-progress'
                  ? 'rgba(0, 168, 132, 0.2)'
                  : callState === 'completed'
                  ? 'rgba(59, 130, 246, 0.2)'
                  : callState === 'failed'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(234, 179, 8, 0.2)',
                border: `2px solid ${callState === 'in-progress' ? '#00A884' : callState === 'completed' ? '#3b82f6' : callState === 'failed' ? '#ef4444' : '#eab308'}`
              }}>
                {callState === 'in-progress' ? (
                  <Mic size={32} color="#00A884" />
                ) : callState === 'completed' ? (
                  <CheckCircle2 size={32} color="#3b82f6" />
                ) : callState === 'failed' ? (
                  <PhoneOff size={32} color="#ef4444" />
                ) : (
                  <PhoneCall size={32} color="#eab308" className="animate-pulse" />
                )}
              </div>

              <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', marginBottom: 4 }}>
                {callState === 'dialing' ? 'Dialing Phone Number...' :
                 callState === 'ringing' ? 'Ringing...' :
                 callState === 'in-progress' ? 'Speaking with Gemini Live' :
                 callState === 'completed' ? 'Call Ended' : 'Call Failed'}
              </div>

              <div style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 12 }}>
                {phoneNumber}
              </div>

              {callState === 'in-progress' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, background: 'rgba(0, 168, 132, 0.15)',
                  color: '#00A884', fontWeight: 600, fontSize: 14, fontFamily: 'DM Mono, monospace'
                }}>
                  <Clock size={15} /> {formatSeconds(duration)}
                </div>
              )}

              {transcript && (
                <div style={{
                  marginTop: 16, textAlign: 'left', background: 'rgba(0,0,0,0.25)',
                  padding: 12, borderRadius: 8, maxHeight: 140, overflowY: 'auto',
                  fontSize: 12, lineHeight: 1.5, color: 'var(--c-textMuted)'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: 4 }}>Transcript:</div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{transcript}</pre>
                </div>
              )}

              {(callState === 'completed' || callState === 'failed') && (
                <button
                  onClick={() => setCallState('idle')}
                  style={{
                    marginTop: 20, padding: '10px 24px', borderRadius: 8,
                    background: 'var(--c-surface, rgba(255, 255, 255, 0.1))',
                    border: '1px solid var(--c-borderDark, rgba(255, 255, 255, 0.15))',
                    color: 'var(--c-text)', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Make Another Call
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
