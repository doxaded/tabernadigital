import React, { useState } from 'react';
import { X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
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
    borderBottom: '1px solid rgba(212, 163, 89, 0.35)',
    padding: '12px 0',
    fontSize: '15px',
    color: '#EAE0D5',
    backgroundColor: 'transparent',
    outline: 'none',
    marginBottom: '24px',
    fontFamily: '"Inter", sans-serif'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#D4A359',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '6px',
    fontFamily: "'MedievalSharp', sans-serif"
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        width: '100%',
        maxWidth: '960px',
        height: 'auto',
        minHeight: '560px',
        maxHeight: '90vh',
        backgroundColor: '#160E09',
        border: '1px solid rgba(212, 163, 89, 0.25)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 0, 0, 0.6)',
        color: '#EAE0D5',
        fontFamily: '"Inter", sans-serif'
      }} onClick={e => e.stopPropagation()}>
        {/* LEFT SIDE: Identidade Visual Medieval da Taberna */}
        <div style={{
          flex: 1,
          backgroundColor: '#120B07',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRight: window.innerWidth < 768 ? 'none' : '1px solid rgba(212, 163, 89, 0.16)',
          borderBottom: window.innerWidth < 768 ? '1px solid rgba(212, 163, 89, 0.16)' : 'none',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              fontSize: 'clamp(28px, 3.2vw, 40px)',
              fontWeight: 700,
              fontFamily: "'MedievalSharp', 'UnifrakturMaguntia', serif",
              letterSpacing: '0.08em',
              color: '#EAE0D5',
              lineHeight: 1.1,
              textShadow: '0 4px 18px rgba(0, 0, 0, 0.9)'
            }}>
              TABERNA DIGITAL
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '15px',
              letterSpacing: '0.18em',
              color: '#D4A359',
              marginTop: '10px',
              textTransform: 'uppercase'
            }}>
              Salão de Crônicas & Aventuras
            </div>
            <div style={{
              width: '60px',
              height: '1px',
              backgroundColor: 'rgba(212, 163, 89, 0.35)',
              margin: '22px 0 16px'
            }} />
            <p style={{
              fontSize: '13px',
              lineHeight: 1.8,
              color: 'rgba(234, 224, 213, 0.75)',
              maxWidth: '300px',
              margin: 0,
              fontFamily: "'MedievalSharp', serif"
            }}>
              Adentre o santuário dos aventureiros. Gerencie campanhas épicas, retratos e crônicas ao redor da lareira.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Formulário de Acesso Harmonizado */}
        <div style={{
          flex: window.innerWidth < 768 ? 'auto' : 1.2,
          backgroundColor: '#160E09',
          padding: '40px 50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          <button 
            onClick={onClose} 
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(234, 224, 213, 0.7)',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#EAE0D5'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(234, 224, 213, 0.7)'}
          >
            <X size={22} />
          </button>

          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#EAE0D5',
              marginBottom: '28px',
              fontFamily: "'MedievalSharp', 'Cinzel', serif",
              letterSpacing: '0.04em'
            }}>
              {isResetMode ? 'Recuperar Senha' : isRegister ? 'Registrar na Taverna' : 'Entrar na Taverna'}
            </h2>

            {/* Active Session Notice & Disconnect Button */}
            {currentUser && (
              <div style={{
                backgroundColor: 'rgba(212, 163, 89, 0.08)',
                border: '1px solid rgba(212, 163, 89, 0.25)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#D4A359', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sessão ativa como:</div>
                  <div style={{ fontWeight: 600, color: '#EAE0D5', fontSize: '13px' }}>
                    {currentUser.displayName} <span style={{ fontWeight: 400, color: 'rgba(234, 224, 213, 0.65)' }}>({currentUser.email})</span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      padding: '5px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    Sair
                  </button>
                )}
              </div>
            )}

            {/* Feedback Messages */}
            {errorMsg && (
              <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: '#34d399', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} /> {successMsg}
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              {isRegister && (
                <div>
                  <label style={labelStyle}>Nome do Personagem ou Jogador (*)</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    style={inputStyle}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>{isRegister ? 'E-mail (*)' : 'E-mail ou Usuário'}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={inputStyle}
                />
              </div>

              {!isResetMode && (
                <div>
                  <label style={labelStyle}>Palavra Secreta / Senha {isRegister && '(*)'}</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
              )}

              {isRegister && (
                <div style={{ fontSize: '12px', color: 'rgba(234, 224, 213, 0.7)', marginBottom: '28px', lineHeight: 1.6 }}>
                  A Taberna Digital mantém seus registros em pergaminhos seguros.<br/><br/>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" required style={{ accentColor: '#D4A359' }} />
                    Li e aceito as Regras da Casa e Termos da Taverna
                  </label>
                </div>
              )}

              {!isRegister && !isResetMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', fontSize: '13px', color: 'rgba(234, 224, 213, 0.75)' }}>
                  <input type="checkbox" style={{ accentColor: '#D4A359' }} />
                  Manter conectado nesta taverna
                </div>
              )}

              {/* Botão de Envio Harmonizado: Marrom Escuro & Bege Claro, Sem Laranja */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#26160D',
                  color: '#EAE0D5',
                  border: '1px solid rgba(212, 163, 89, 0.45)',
                  borderRadius: '6px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontFamily: "'MedievalSharp', 'Cinzel', serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#382014';
                  e.currentTarget.style.borderColor = '#D4A359';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#26160D';
                  e.currentTarget.style.borderColor = 'rgba(212, 163, 89, 0.45)';
                  e.currentTarget.style.color = '#EAE0D5';
                }}
              >
                {isLoading ? (
                  <><RefreshCw size={18} className="spin" /> Processando...</>
                ) : isResetMode ? (
                  'Enviar Link de Recuperação'
                ) : isRegister ? (
                  'Criar Conta'
                ) : (
                  'Entrar Agora'
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
                      color: '#D4A359',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textTransform: 'uppercase',
                      fontFamily: "'MedievalSharp', sans-serif"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EAE0D5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#D4A359'}
                  >
                    Esqueceu sua senha?
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
                      color: '#D4A359',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontFamily: "'MedievalSharp', sans-serif"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EAE0D5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#D4A359'}
                  >
                    ← Voltar ao login
                  </button>
                </div>
              )}

              {!isResetMode && (
                <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: 'rgba(234, 224, 213, 0.7)' }}>
                  {isRegister ? "Já possui uma conta? " : "Ainda não faz parte? "}
                  <button 
                    type="button"
                    onClick={() => { setIsRegister(!isRegister); setIsResetMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontWeight: 700,
                      color: '#D4A359',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      fontFamily: "'MedievalSharp', sans-serif"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EAE0D5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#D4A359'}
                  >
                    {isRegister ? "Entrar na Taverna" : "Registrar-se"}
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
