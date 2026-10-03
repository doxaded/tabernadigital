import React, { useState } from 'react';
import { X, KeyRound, Lock, CheckCircle2, AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL, DEFAULT_MASTER_PASSWORD } from '../services/storage';
import { firebaseAuthService } from '../services/firebase';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const isMasterUser = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Informe a palavra secreta atual.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('A nova palavra secreta deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('A nova palavra secreta e a confirmação não coincidem.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('A nova palavra secreta deve ser diferente da atual.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await firebaseAuthService.changePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccessMsg('Palavra secreta alterada com sucesso! As novas credenciais já estão ativas.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(result.error || 'Erro ao alterar a palavra secreta.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao processar a troca de senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tavern-modal-backdrop" onClick={onClose}>
      <div 
        className="tavern-modal-content parchment-card" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '28px', maxWidth: '480px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={22} color="var(--amber-deep)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {isMasterUser ? 'Trocar Senha do Mestre' : 'Alterar Palavra Secreta'}
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-medium)', marginTop: '4px' }}>
              Atualize sua senha de acesso para proteger sua conta na Taberna Digital.
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

        {/* Master User Context Alert */}
        {isMasterUser ? (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderLeft: '4px solid #f59e0b',
            padding: '10px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--ink-dark)',
            marginBottom: '16px',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--amber-deep)' }}>
              <Crown size={15} color="#b45309" />
              Credenciais do Usuário Master ({currentUser.email})
            </div>
            A senha mestre inicial padrão da estalagem é: 
            <code style={{ marginLeft: '4px', backgroundColor: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 700, color: '#b45309' }}>
              {DEFAULT_MASTER_PASSWORD}
            </code>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            borderLeft: '4px solid var(--amber-torch)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--ink-dark)',
            marginBottom: '16px'
          }}>
            Usuário atual: <strong>{currentUser.email}</strong>
          </div>
        )}

        {/* Error Feedback */}
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
            marginBottom: '14px'
          }}>
            <AlertTriangle size={15} />
            {errorMsg}
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '10px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
              Palavra Secreta Atual:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Informe sua senha atual"
                className="tavern-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
              Nova Palavra Secreta:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="tavern-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-dark)', marginBottom: '4px' }}>
              Confirmar Nova Palavra Secreta:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--ink-light)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova palavra secreta"
                className="tavern-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-tavern btn-primary"
              style={{ flex: 1 }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="torch-flicker" />
                  <span>Atualizando Senha...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Gravar Nova Senha</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-tavern btn-secondary"
            >
              Fechar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
