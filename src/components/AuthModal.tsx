import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Crown, KeyRound, AlertTriangle } from 'lucide-react';
import { ADMIN_EMAIL } from '../services/storage';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, displayName?: string) => void;
  currentUser: UserProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (isRegister && !displayName.trim()) {
      setErrorMsg('Informe o nome ou apelido do seu aventureiro.');
      return;
    }

    onLogin(email.trim(), displayName.trim() || email.split('@')[0]);
    onClose();
  };

  const handleQuickSwitch = (quickEmail: string, quickName: string) => {
    onLogin(quickEmail, quickName);
    onClose();
  };

  return (
    <div className="tavern-modal-backdrop" onClick={onClose}>
      <div 
        className="tavern-modal-content parchment-card" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '28px', maxWidth: '520px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} color="var(--amber-deep)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
                {isRegister ? 'Registro de Novo Aventureiro' : 'Identificação na Taberna'}
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-medium)', marginTop: '4px' }}>
              {isRegister 
                ? 'Novos cadastros necessitam de aprovação prévia do Taberneiro-Chefe.'
                : 'Apresente suas credenciais para adentrar aos aposentos da guilda.'}
            </p>
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

        {/* Informative Alert about Administrative Approval */}
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.12)',
          borderLeft: '4px solid var(--amber-torch)',
          padding: '10px 14px',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--ink-dark)',
          marginBottom: '20px',
          lineHeight: 1.4
        }}>
          <strong>Aviso da Estalagem:</strong> Por ordem do Mestre, todo aventureiro recém-chegado fica em estado <em>Pendente</em> até que <strong>{ADMIN_EMAIL}</strong> aprove sua entrada na Câmara Administrativa.
        </div>

        {/* Quick Demo Switcher Buttons */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-light)', letterSpacing: '0.05em' }}>
            Acesso Rápido para Demonstração & Teste:
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
              <span style={{ fontSize: '9px', opacity: 0.8, color: '#34d399' }}>Acesso Total</span>
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

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--parchment-dark)' }} />
          <span style={{ fontSize: '11px', color: 'var(--ink-light)', textTransform: 'uppercase' }}>ou utilize seu e-mail</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--parchment-dark)' }} />
        </div>

        {/* Custom Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              gap: '6px'
            }}>
              <AlertTriangle size={15} />
              {errorMsg}
            </div>
          )}

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
                Nome do Personagem ou Jogador:
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ex: Alistair, o Bárbaro"
                  className="tavern-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
              Endereço de E-mail:
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
              Palavra Secreta (Senha):
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="tavern-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-tavern btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
          >
            <KeyRound size={16} />
            {isRegister ? 'Solicitar Acesso à Taberna' : 'Confirmar e Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
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
              ? 'Já tem cadastro? Faça seu login' 
              : 'Não tem cadastro? Crie seu perfil de aventureiro'}
          </button>
        </div>
      </div>
    </div>
  );
};
