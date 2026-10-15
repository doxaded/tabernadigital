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
        onClick={e => e.stopPropagation()}
        style={{ 
          padding: '32px', 
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)',
          color: '#111'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={22} color="#111" />
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#111' }}>
                {isMasterUser ? 'Trocar Senha do Mestre' : 'Alterar Palavra Secreta'}
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: '4px 0 0 0' }}>
              Atualize sua senha de acesso para proteger sua conta na Taberna Digital.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Master User Context Alert */}
        {isMasterUser ? (
          <div style={{
            backgroundColor: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#78350f',
            marginBottom: '16px',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>
              <Crown size={15} color="#d97706" />
              Credenciais do Usuário Master ({currentUser.email})
            </div>
            A senha mestre inicial padrão da estalagem é: 
            <code style={{ marginLeft: '4px', backgroundColor: '#fde68a', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, color: '#92400e' }}>
              {DEFAULT_MASTER_PASSWORD}
            </code>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f1f5f9',
            borderLeft: '4px solid #64748b',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#334155',
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
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Palavra Secreta Atual:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Informe sua senha atual"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#111',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Nova Palavra Secreta:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#111',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Confirmar Nova Palavra Secreta:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova palavra secreta"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#111',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                padding: '11px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
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
              style={{
                backgroundColor: '#fff',
                color: '#475569',
                border: '1px solid #e2e8f0',
                padding: '11px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
