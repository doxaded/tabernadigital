import React, { useState, useEffect } from 'react';
import { X, Shield, Sparkles, MessageSquare, Dices, Palette, Edit3, Check, User, Crown, Scroll } from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  currentUser: UserProfile | null;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void> | void;
  onStartDirectChat?: (user: UserProfile) => void;
}

const CLASS_OPTIONS = [
  'Guerreiro',
  'Mago',
  'Ladino',
  'Clérigo',
  'Paladino',
  'Bardo',
  'Bruxo',
  'Druida',
  'Patrulheiro',
  'Bárbaro',
  'Monge',
  'Feiticeiro',
  'Artífice',
  'Mestre de Jogo'
];

const BADGE_COLORS = [
  { name: 'Ouro Real', hex: '#d97706' },
  { name: 'Rubi Forjado', hex: '#dc2626' },
  { name: 'Ametista Arcana', hex: '#7c3aed' },
  { name: 'Esmeralda Silvestre', hex: '#059669' },
  { name: 'Safira das Marés', hex: '#2563eb' },
  { name: 'Obsidiana Sombria', hex: '#374151' },
  { name: 'Rosa Carmesim', hex: '#e11d48' },
  { name: 'Âmbar Antigo', hex: '#b45309' },
];

const DICE_THEMES = [
  'Dourado Nobre',
  'Rubi Forjado',
  'Ametista Arcana',
  'Esmeralda Silvestre',
  'Obsidiana Sombria',
  'Mithral Élfico'
];

const AVATAR_PRESETS = [
  { label: 'Urd, o Taberneiro', url: '/assets/urd_portrait.jpg' },
  { label: 'Lâmina de Mithral', url: '/assets/sketch_sword.jpg' },
  { label: 'Bardo do Alaúde', url: '/assets/bardo_portrait.jpg' },
  { label: 'Cenário da Taverna', url: '/assets/tavern_bg.jpg' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onSaveProfile,
  onStartDirectChat
}) => {
  const isSelf = !!currentUser && !!targetUser && currentUser.uid === targetUser.uid;
  const [isEditing, setIsEditing] = useState(false);

  // Campos de edição
  const [title, setTitle] = useState('');
  const [favoriteClass, setFavoriteClass] = useState('Guerreiro');
  const [customBadgeColor, setCustomBadgeColor] = useState('#d97706');
  const [bio, setBio] = useState('');
  const [diceTheme, setDiceTheme] = useState('Dourado Nobre');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setTitle(targetUser.title || '');
      setFavoriteClass(targetUser.favoriteClass || 'Guerreiro');
      setCustomBadgeColor(targetUser.customBadgeColor || '#d97706');
      setBio(targetUser.bio || '');
      setDiceTheme(targetUser.diceTheme || 'Dourado Nobre');
      setPhotoURL(targetUser.photoURL || '');
      setIsEditing(false);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const isSuperAdmin = targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile({
        title: title.trim(),
        favoriteClass,
        customBadgeColor,
        bio: bio.trim(),
        diceTheme,
        photoURL: photoURL.trim() || undefined
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Caixa Branca com Letras Pretas conforme diretriz do usuário */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header do Card com Estandarte de Cor Personalizada */}
        <div
          style={{
            position: 'relative',
            height: '110px',
            backgroundColor: isEditing ? customBadgeColor : (targetUser.customBadgeColor || '#d97706'),
            background: `linear-gradient(135deg, ${isEditing ? customBadgeColor : (targetUser.customBadgeColor || '#d97706')} 0%, #1e1b18 100%)`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
            <Scroll size={18} />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {isEditing ? 'Personalizar Perfil' : 'Perfil do Aventureiro'}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Informações e Formulário */}
        <div style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
          {/* Avatar sobreposto ao estandarte */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-45px', marginBottom: '16px' }}>
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '4px solid #ffffff',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {(isEditing ? photoURL : targetUser.photoURL) ? (
                <img
                  src={isEditing ? photoURL : targetUser.photoURL}
                  alt={targetUser.displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    // Fallback se a imagem falhar
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: isEditing ? customBadgeColor : (targetUser.customBadgeColor || '#d97706'),
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 700,
                    fontFamily: 'serif'
                  }}
                >
                  {targetUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Botão de Ação no topo direito do corpo */}
            {isSelf && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                <Edit3 size={15} />
                <span>Editar Meu Perfil</span>
              </button>
            )}

            {!isSelf && onStartDirectChat && (
              <button
                type="button"
                onClick={() => {
                  onStartDirectChat(targetUser);
                  onClose();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: targetUser.customBadgeColor || '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s'
                }}
              >
                <MessageSquare size={15} />
                <span>Enviar Sussurro</span>
              </button>
            )}
          </div>

          {!isEditing ? (
            /* Modo de Visualização do Perfil */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
                    {targetUser.displayName}
                  </h2>
                  {isSuperAdmin && (
                    <span
                      style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Crown size={12} />
                      Mestre Supremo
                    </span>
                  )}
                </div>

                {targetUser.title && (
                  <p style={{ fontSize: '14px', fontWeight: 600, color: targetUser.customBadgeColor || '#d97706', marginTop: '4px', fontStyle: 'italic' }}>
                    "{targetUser.title}"
                  </p>
                )}
              </div>

              {/* Badges de Classe e Dados */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    borderLeft: `4px solid ${targetUser.customBadgeColor || '#d97706'}`,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Shield size={14} style={{ color: targetUser.customBadgeColor || '#d97706' }} />
                  Classe: <strong>{targetUser.favoriteClass || 'Aventureiro'}</strong>
                </span>

                <span
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Dices size={14} style={{ color: '#6b7280' }} />
                  Dados: <strong>{targetUser.diceTheme || 'Dourado Nobre'}</strong>
                </span>
              </div>

              {/* Biografia / Lore do Personagem */}
              <div
                style={{
                  backgroundColor: '#fafafa',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} style={{ color: '#d97706' }} />
                  História & Lore Pessoal
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {targetUser.bio || 'Este aventureiro ainda não escreveu suas crônicas. O mistério envolve seu passado na estalagem...'}
                </p>
              </div>

              {/* Informações da Conta */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                <span>Membro da Taberna desde {new Date(targetUser.createdAt).toLocaleDateString('pt-BR')}</span>
                <span>{targetUser.email}</span>
              </div>
            </div>
          ) : (
            /* Modo de Edição do Perfil */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Título Honorífico / Alcunha na Taverna
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: O Quebra-Machado, Guardião das Sombras, O Menestrel"
                  maxLength={40}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Aparecerá abaixo do seu nome nos canais de chat e na mesa.
                </span>
              </div>

              {/* Classe Favorita */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Classe Favorita de RPG
                </label>
                <select
                  value={favoriteClass}
                  onChange={(e) => setFavoriteClass(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                >
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Cor da Insígnia / Selo de Cera */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Cor do Selo de Cera / Insígnia
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {BADGE_COLORS.map(b => (
                    <button
                      key={b.hex}
                      type="button"
                      onClick={() => setCustomBadgeColor(b.hex)}
                      title={b.name}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: b.hex,
                        border: customBadgeColor === b.hex ? '3px solid #111827' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: customBadgeColor === b.hex ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={customBadgeColor}
                    onChange={(e) => setCustomBadgeColor(e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Escolher cor personalizada"
                  />
                </div>
              </div>

              {/* Conjunto de Dados Favorito */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Tema dos Dados da Sorte
                </label>
                <select
                  value={diceTheme}
                  onChange={(e) => setDiceTheme(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                >
                  {DICE_THEMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Avatar Presets ou URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Retrato / Avatar
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {AVATAR_PRESETS.map(p => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setPhotoURL(p.url)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: photoURL === p.url ? '1px solid #111827' : '1px solid #e5e7eb',
                        backgroundColor: photoURL === p.url ? '#f3f4f6' : '#ffffff',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <img src={p.url} alt={p.label} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="Ou cole a URL de uma imagem da internet"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#111827'
                  }}
                />
              </div>

              {/* Biografia / Lore */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  História do Personagem / Lore Pessoal
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua linhagem, motivações, grandes feitos ou cicatrizes de batalha..."
                  rows={3}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    resize: 'vertical'
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#9ca3af' }}>
                  {bio.length}/500 caracteres
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
