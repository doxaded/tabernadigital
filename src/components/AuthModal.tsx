import React, { useState } from 'react';
import { X, Flame, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { ADMIN_EMAIL, storageService } from '../services/storage';
import { firebaseAuthService, parseFirebaseError } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid e-mail address.');
      return;
    }

    setIsLoading(true);

    try {
      if (isResetMode) {
        await firebaseAuthService.sendPasswordReset(email);
        setSuccessMsg(`Reset instructions sent to ${email}! Check your inbox.`);
        setIsLoading(false);
        return;
      }

      if (isRegister) {
        if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setErrorMsg(`The address ${ADMIN_EMAIL} belongs exclusively to the Master Administrator.`);
          setIsLoading(false);
          return;
        }
        if (!displayName.trim()) {
          setErrorMsg('Please enter your character or player name.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }

        const userProfile = await firebaseAuthService.registerWithEmail(email, password, displayName);
        onLoginSuccess(userProfile);
        onClose();
      } else {
        if (!password) {
          setErrorMsg('Please enter your password.');
          setIsLoading(false);
          return;
        }

        const userProfile = await firebaseAuthService.loginWithEmail(email, password);
        onLoginSuccess(userProfile);
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #e5e7eb',
    padding: '12px 0',
    fontSize: '15px',
    color: '#111',
    backgroundColor: 'transparent',
    outline: 'none',
    marginBottom: '24px',
    fontFamily: '"Inter", sans-serif'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        width: '100%',
        maxWidth: '960px',
        height: 'auto',
        minHeight: '600px',
        maxHeight: '90vh',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        fontFamily: '"Inter", sans-serif'
      }} onClick={e => e.stopPropagation()}>
        {/* LEFT SIDE */}
        <div style={{
          flex: 1,
          backgroundColor: '#ffffff',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <img 
              src="/taberna-logo-black.png" 
              alt="Taberna Digital Logo" 
              style={{
                width: 'clamp(280px, 35vw, 450px)',
                height: 'auto',
                objectFit: 'contain',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={{
          flex: window.innerWidth < 768 ? 'auto' : 1.2,
          backgroundColor: '#ffffff',
          padding: '40px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflowY: 'auto'
        }}>
          <button 
            onClick={onClose} 
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#111' }}
          >
            <X size={24} />
          </button>

          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '32px' }}>
            {isResetMode ? 'Reset password' : isRegister ? 'Register with your e-mail' : 'Log in'}
          </h2>

          {/* Active Session Notice & Disconnect Button */}
          {currentUser && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Currently logged in as:</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                  {currentUser.displayName} <span style={{ fontWeight: 400, color: '#475569' }}>({currentUser.email})</span>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Log out
                </button>
              )}
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: '#10b981', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} /> {successMsg}
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            {isRegister && (
              <div>
                <label style={labelStyle}>Username (*)</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Username"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>{isRegister ? 'Email (*)' : 'Email or Username'}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isRegister ? 'E-mail' : 'Email or Username'}
                style={inputStyle}
              />
            </div>

            {!isResetMode && (
              <div>
                <label style={labelStyle}>Password {isRegister && '(*)'}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  style={inputStyle}
                />
              </div>
            )}

            {isRegister && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '32px', lineHeight: 1.5 }}>
                Taberna Digital may keep me informed with personalized emails about products and services. See our <strong>Privacy Policy</strong> for more details.<br/><br/>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" required style={{ accentColor: '#111' }} />
                  I have read and accept the Terms and Conditions
                </label>
              </div>
            )}

            {!isRegister && !isResetMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', fontSize: '13px', color: '#444' }}>
                <input type="checkbox" style={{ accentColor: '#111' }} />
                Keep me logged in
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#000000'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
            >
              {isLoading ? (
                <><RefreshCw size={18} className="spin" /> Processing...</>
              ) : isResetMode ? (
                'Send Recovery Link'
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Log in now'
              )}
            </button>
            
            {!isRegister && !isResetMode && (
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setIsResetMode(true); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#111',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textTransform: 'uppercase'
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            )}
            
            {isResetMode && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                 <button
                  type="button"
                  onClick={() => { setIsResetMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#111',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ← Back to login
                </button>
              </div>
            )}

            {!isResetMode && (
              <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#555' }}>
                {isRegister ? "Already a member? " : "Not a member yet? "}
                <button 
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setIsResetMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', fontWeight: 700, color: '#111', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {isRegister ? "Log in now" : "Register now"}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
    </div>
  );
};
