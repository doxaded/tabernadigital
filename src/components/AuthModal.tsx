import React, { useState } from 'react';
import { 
  X, ShieldCheck, Mail, Lock, User, Crown, KeyRound, AlertTriangle, 
  Check, RefreshCw, Flame, HelpCircle
} from 'lucide-react';
import { ADMIN_EMAIL, DEFAULT_MASTER_PASSWORD, storageService } from '../services/storage';
import { firebaseAuthService, parseFirebaseError, isLiveFirebaseConfigured } from '../services/firebase';
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
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);

    try {
      if (isResetMode) {
        // Redefinição de senha por e-mail via Firebase
        await firebaseAuthService.sendPasswordReset(email);
        setSuccessMsg(`Instruções de redefinição de senha enviadas para ${email}! Verifique sua caixa de entrada.`);
        setIsLoading(false);
        return;
      }

      if (isRegister) {
        // Cadastro por e-mail e senha no Firebase
        if (!displayName.trim()) {
          setErrorMsg('Informe o nome ou alcunha do seu aventureiro.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('A palavra secreta (senha) deve conter no mínimo 6 caracteres.');
          setIsLoading(false);
          return;
        }

        const userProfile = await firebaseAuthService.registerWithEmail(email, password, displayName);
        onLoginSuccess(userProfile);
        onClose();
      } else {
        // Login com e-mail e senha no Firebase
        if (!password) {
          setErrorMsg('Informe sua palavra secreta (senha) para entrar.');
          setIsLoading(false);
          return;
        }

        const userProfile = await firebaseAuthService.loginWithEmail(email, password);
        onLoginSuccess(userProfile);
        onClose();
      }
    } catch (err: any) {
      console.error('Erro na autenticação Firebase:', err);
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = async (quickEmail: string, quickName: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const isMaster = quickEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const pass = isMaster ? DEFAULT_MASTER_PASSWORD : '123456';
      let userProfile: UserProfile;
      try {
        userProfile = await firebaseAuthService.loginWithEmail(quickEmail, pass);
      } catch {
        userProfile = await firebaseAuthService.registerWithEmail(quickEmail, pass, quickName);
      }
      onLoginSuccess(userProfile);
      onClose();
    } catch {
      const localUser = storageService.loginUser(quickEmail);
      onLoginSuccess(localUser);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tavern-modal-backdrop" onClick={onClose}>
      <div 
        className="tavern-modal-content parchment-card" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '28px', maxWidth: '520px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} color="var(--amber-deep)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, textTransform: 'none', margin: 0 }}>
                {isResetMode 
                  ? 'Recuperar Palavra Secreta' 
                  : isRegister 
                  ? 'Registro de Aventureiro' 
                  : 'Identificação na Estalagem'}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--amber-torch)', fontWeight: 700 }}>
                Cofre de Credenciais:
              </span>
              <span className="wax-badge" style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
                fontSize: '9px',
                padding: '1px 6px'
              }}>
                ● Cofre da Taberna Ativo
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-medium)',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Active Session Notice & Disconnect Button */}
        {currentUser && (
          <div style={{
            backgroundColor: 'var(--wood-dark)',
            border: '1px solid var(--wood-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Aventureiro conectado no momento:</div>
              <div style={{ fontWeight: 700, color: '#fef3c7', fontSize: '13px' }}>
                {currentUser.displayName} <span style={{ fontWeight: 400, color: '#fbbf24' }}>({currentUser.email})</span>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="btn-tavern btn-secondary"
                style={{ padding: '6px 12px', fontSize: '11px', color: '#fca5a5', border: '1px solid #7f1d1d' }}
              >
                Sair da Conta
              </button>
            )}
          </div>
        )}

        {/* Informative Alert about Administrative Approval */}
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.12)',
          borderLeft: '4px solid var(--amber-torch)',
          padding: '10px 14px',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--ink-dark)',
          marginBottom: '18px',
          lineHeight: 1.4
        }}>
          <strong>Aviso de Segurança:</strong> Ao se cadastrar por e-mail, seu perfil receberá o status <em>PENDENTE</em>. O acesso às salas e ferramentas será liberado após aprovação exclusiva de <strong>{ADMIN_EMAIL}</strong>.
        </div>

        {/* Quick Demo Switcher Buttons */}
        {!isResetMode && (
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-light)', letterSpacing: '0.05em' }}>
              Atalhos Rápidos para Demonstração:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickSwitch(ADMIN_EMAIL, 'Henrique Berbert')}
                className="btn-tavern"
                style={{
                  backgroundColor: '#2a180b',
                  color: '#fef08a',
                  border: '1px solid #eab308',
                  fontSize: '11px',
                  padding: '8px 10px',
                  minHeight: '44px',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crown size={12} color="#facc15" />
                  <span>Henrique (Admin)</span>
                </div>
                <span style={{ fontSize: '9px', opacity: 0.8, color: '#34d399' }}>Aprovador Máximo</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('thorin.escudo@taberna.rpg', 'Thorin Quebra-Machado')}
                className="btn-tavern"
                style={{
                  backgroundColor: '#3e2412',
                  color: '#fff',
                  border: '1px solid #78350f',
                  fontSize: '11px',
                  padding: '8px 10px',
                  minHeight: '44px',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <span>Thorin</span>
                <span style={{ fontSize: '9px', opacity: 0.8, color: '#34d399' }}>Aprovado</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('lyanna.sombra@taberna.rpg', 'Lyanna Sombra-da-Noite')}
                className="btn-tavern"
                style={{
                  backgroundColor: '#3e2412',
                  color: '#fbbf24',
                  border: '1px solid #b45309',
                  fontSize: '11px',
                  padding: '8px 10px',
                  minHeight: '44px',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <span>Lyanna</span>
                <span style={{ fontSize: '9px', opacity: 0.8, color: '#f59e0b' }}>Pendente</span>
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--parchment-dark)' }} />
          <span style={{ fontSize: '11px', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
            {isResetMode ? 'e-mail cadastrado' : 'ou credenciais de e-mail'}
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--parchment-dark)' }} />
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <AlertTriangle size={15} />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Check size={15} />
            {successMsg}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
                Nome do Personagem ou Jogador:
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ex: Aldor, o Conjurador de Chamas"
                  className="tavern-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
              Endereço de E-mail (Firebase Auth):
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="tavern-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {!isResetMode && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)' }}>
                  Palavra Secreta (Senha do Firebase):
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--amber-deep)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="tavern-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-tavern btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="torch-flicker" />
                <span>Processando no Firebase...</span>
              </>
            ) : isResetMode ? (
              <>
                <Mail size={16} />
                <span>Enviar Link de Recuperação</span>
              </>
            ) : isRegister ? (
              <>
                <KeyRound size={16} />
                <span>Registrar via Firebase Auth</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Entrar na Taberna</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switchers */}
        <div style={{ textAlign: 'center', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isResetMode ? (
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--amber-deep)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Voltar para a tela de login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--amber-deep)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isRegister 
                ? 'Já possui conta no Firebase? Faça seu login' 
                : 'Novo na estalagem? Cadastre-se com e-mail e senha'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
