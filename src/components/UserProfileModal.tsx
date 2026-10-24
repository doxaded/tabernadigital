import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  Sparkles,
  MessageSquare,
  Dices,
  Edit3,
  Check,
  Crown,
  Scroll,
  Upload,
  Camera,
  Trash2,
  KeyRound,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Copy,
  Coins
} from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';
import { AvatarFrame } from './AvatarFrame';
import { getEffectiveGold } from '../services/tavernShopCatalog';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  currentUser: UserProfile | null;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void> | void;
  onStartDirectChat?: (user: UserProfile) => void;
  onOpenChangePassword?: () => void;
  onOpenShop?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
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

/** Redimensiona e comprime uma foto/arquivo para ~512px em JPEG para salvar local e na nuvem */
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida (escolha JPG, PNG ou WEBP).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 512;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar a imagem.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo do dispositivo.'));
    reader.readAsDataURL(file);
  });
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onSaveProfile,
  onStartDirectChat,
  onOpenChangePassword,
  onOpenShop,
  onLogout,
  onOpenAdmin
}) => {
  const isSelf = !!currentUser && !!targetUser && currentUser.uid === targetUser.uid;
  const [isEditing, setIsEditing] = useState(false);

  // Campos de edição
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [favoriteClass, setFavoriteClass] = useState('Guerreiro');
  const [customBadgeColor, setCustomBadgeColor] = useState('#d97706');
  const [bio, setBio] = useState('');
  const [diceTheme, setDiceTheme] = useState('Dourado Nobre');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  // Upload direto de fotos e arquivos (computador ou celular)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (targetUser) {
      setDisplayName(targetUser.displayName || '');
      setTitle(targetUser.title || '');
      setFavoriteClass(targetUser.favoriteClass || 'Guerreiro');
      setCustomBadgeColor(targetUser.customBadgeColor || '#d97706');
      setBio(targetUser.bio || '');
      setDiceTheme(targetUser.diceTheme || 'Dourado Nobre');
      setPhotoURL(targetUser.photoURL || '');
      setIsEditing(false);
      setUploadError(null);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const isSuperAdmin = targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const activeColor = isEditing ? customBadgeColor : (targetUser.customBadgeColor || '#d97706');
  const activeBadgeObj = BADGE_COLORS.find(b => b.hex.toLowerCase() === activeColor.toLowerCase());

  const optionItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 14px',
    backgroundColor: 'rgba(24, 20, 16, 0.75)',
    border: '1px solid rgba(245, 236, 220, 0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
    boxSizing: 'border-box'
  };

  const optionHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    e.currentTarget.style.backgroundColor = enter ? 'rgba(217, 119, 6, 0.14)' : 'rgba(24, 20, 16, 0.75)';
    e.currentTarget.style.borderColor = enter ? 'rgba(217, 119, 6, 0.45)' : 'rgba(245, 236, 220, 0.12)';
    e.currentTarget.style.transform = enter ? 'translateX(-2px)' : 'translateX(0)';
  };

  const optionIconContainerStyle: React.CSSProperties = {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setUploadError(null);

    try {
      const dataUrl = await processImageFile(file);
      setPhotoURL(dataUrl);
      // Ao anexar uma nova imagem, entra no modo de edição para permitir salvar
      setIsEditing(true);
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao carregar a imagem.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile({
        displayName: displayName.trim() || targetUser.displayName,
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

  const displayNameToShow = isEditing
    ? (displayName || 'Aventureiro')
    : (targetUser.displayName || targetUser.email.split('@')[0] || 'Aventureiro');

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        padding: 0,
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Input de arquivo invisível para anexar fotos/arquivos diretamente via celular ou computador */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Aba Lateral Direita: Design Editorial Medieval da Taverna */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100dvh',
          maxHeight: '100dvh',
          backgroundColor: '#0B0B0B',
          color: '#F4EDDD',
          borderRadius: 0,
          borderLeft: '1px solid rgba(244, 237, 221, 0.15)',
          boxShadow: '-15px 0 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(217, 119, 6, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'var(--font-body)',
          boxSizing: 'border-box'
        }}
      >
        {/* Cabeçalho da Aba Lateral (Editorial, limpo, alinhado com o design da Taberna) */}
        <div
          style={{
            height: '60px',
            backgroundColor: '#120F0C',
            borderBottom: '1px solid rgba(244, 237, 221, 0.1)',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D' }}>
            <Scroll size={17} style={{ color: '#d97706' }} />
            <span
              style={{
                fontFamily: "'Cinzel Hero', 'Cinzel', Georgia, serif",
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#F4EDDD'
              }}
            >
              {isEditing ? 'Personalizar Perfil' : 'Registro do Aventureiro'}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(244, 237, 221, 0.15)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#F4EDDD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(217, 119, 6, 0.2)';
              e.currentTarget.style.borderColor = '#d97706';
              e.currentTarget.style.color = '#FCD34D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(244, 237, 221, 0.15)';
              e.currentTarget.style.color = '#F4EDDD';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll Suave */}
        <div
          style={{
            padding: '24px 20px 48px',
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Mensagem de Erro de Upload se houver */}
          {uploadError && (
            <div
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '12px',
                marginBottom: '16px'
              }}
            >
              {uploadError}
            </div>
          )}

          {/* Cartão de Identidade do Usuário: Avatar & Nome & Título (100% VISÍVEL, NUNCA CORTADO) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '22px'
            }}
          >
            {/* Moldura do Avatar / Retrato com AvatarFrame */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <AvatarFrame
                user={isEditing ? { ...targetUser, photoURL: photoURL || targetUser.photoURL, displayName: displayName || targetUser.displayName } : targetUser}
                size="xl"
              />

              {/* Botão de Câmera sobre o Avatar (permite anexar fotos ou arquivos direto) */}
              {isSelf && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Anexar foto ou arquivo do computador/celular"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: '#d97706',
                    color: '#000000',
                    border: '2.5px solid #0B0B0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.7)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = '#f59e0b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#d97706';
                  }}
                >
                  <Camera size={14} />
                </button>
              )}
            </div>

            {/* Nome Escolhido pelo Usuário & Pequeno Lápis Clássico */}
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#F4EDDD',
                  fontFamily: "'Cinzel Hero', Georgia, serif",
                  letterSpacing: '0.02em',
                  margin: 0
                }}
              >
                {displayNameToShow}
              </h2>

              {isSelf && !isEditing && (
                <button
                  type="button"
                  id="profile-classic-pencil-btn"
                  onClick={() => setIsEditing(true)}
                  title="Personalizar Perfil"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(217, 119, 6, 0.16)',
                    border: '1px solid rgba(217, 119, 6, 0.45)',
                    color: '#F59E0B',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = '#d97706';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.16)';
                    e.currentTarget.style.color = '#F59E0B';
                  }}
                >
                  <Edit3 size={13} />
                </button>
              )}
            </div>

            {/* Título Honorífico */}
            {targetUser.title && (
              <p
                style={{
                  fontSize: '13px',
                  color: activeColor,
                  fontFamily: "'Alegreya', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 600,
                  margin: '4px 0 0 0'
                }}
              >
                "{targetUser.title}"
              </p>
            )}

            {/* Selo Mestre Supremo / Aventureiro */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {isSuperAdmin && (
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                    color: '#FCD34D',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'Cinzel Hero', Georgia, serif",
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Crown size={12} />
                  Mestre Supremo
                </span>
              )}
            </div>

            {/* Tag Única de 7 Caracteres */}
            {(targetUser.userTag || targetUser.tag) && (
              <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <div
                  style={{
                    backgroundColor: '#161412',
                    border: '1px solid rgba(244, 237, 221, 0.22)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    color: '#FCD34D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Tag de Aventureiro (utilize para adicionar amigos e iniciar conversas)"
                >
                  <span style={{ color: '#a89a85', fontWeight: 600 }}>TAG:</span>
                  <span>#{targetUser.userTag || targetUser.tag}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const tagText = targetUser.userTag || targetUser.tag || '';
                    navigator.clipboard.writeText(tagText);
                    setCopiedTag(true);
                    setTimeout(() => setCopiedTag(false), 2000);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(244, 237, 221, 0.2)',
                    borderRadius: '6px',
                    color: copiedTag ? '#34d399' : '#F4EDDD',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Copiar Tag de 7 Caracteres"
                >
                  {copiedTag ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedTag ? 'Copiado!' : 'Copiar Tag'}</span>
                </button>
              </div>
            )}

            {/* Pílula de Peças de Ouro (PO) */}
            <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <div
                style={{
                  backgroundColor: 'rgba(217, 119, 6, 0.18)',
                  border: '1.5px solid #d97706',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
                }}
              >
                <Coins size={15} style={{ color: '#fbbf24' }} />
                <span>{getEffectiveGold(targetUser).toLocaleString('pt-BR')} Peças de Ouro</span>
              </div>
            </div>
          </div>

          {!isEditing ? (
            /* Modo de Visualização do Perfil Medieval */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Opções da Conta (Quando for o próprio usuário) */}
              {isSelf && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#A89A85',
                      fontFamily: "'Inter', sans-serif",
                      display: 'block',
                      marginBottom: '2px'
                    }}
                  >
                    Opções da Conta
                  </span>

                  {/* Bazar da Taverna (Loja Virtual de Títulos & Molduras) */}
                  <button
                    type="button"
                    id="option-tavern-shop"
                    onClick={() => {
                      onClose();
                      onOpenShop?.();
                    }}
                    style={{
                      ...optionItemStyle,
                      border: '1.5px solid rgba(245, 158, 11, 0.45)',
                      background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.22) 0%, rgba(120, 53, 15, 0.35) 100%)',
                      boxShadow: '0 0 14px rgba(245, 158, 11, 0.15)'
                    }}
                    onMouseEnter={(e) => optionHover(e, true)}
                    onMouseLeave={(e) => optionHover(e, false)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ ...optionIconContainerStyle, backgroundColor: 'rgba(245, 158, 11, 0.25)' }}>
                        <Coins size={16} style={{ color: '#fbbf24' }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7', fontFamily: "'Cinzel Hero', Georgia, serif" }}>
                          Bazar da Taverna
                        </div>
                        <div style={{ fontSize: '11px', color: '#d4b896' }}>
                          Comprar e equipar Títulos e Molduras Místicas
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: '#fbbf24' }} />
                  </button>

                  {/* Personalizar Perfil */}
                  <button
                    type="button"
                    id="option-customize-profile"
                    onClick={() => setIsEditing(true)}
                    style={optionItemStyle}
                    onMouseEnter={(e) => optionHover(e, true)}
                    onMouseLeave={(e) => optionHover(e, false)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={optionIconContainerStyle}>
                        <Edit3 size={16} style={{ color: '#FCD34D' }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4EDDD', fontFamily: "'Cinzel Hero', Georgia, serif" }}>
                          Personalizar Perfil
                        </div>
                        <div style={{ fontSize: '11px', color: '#A89A85' }}>
                          Nome, foto/retrato, classe, dados e crônicas
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: '#A89A85' }} />
                  </button>

                  {/* Trocar Senha */}
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      id="option-change-password"
                      onClick={onOpenChangePassword}
                      style={optionItemStyle}
                      onMouseEnter={(e) => optionHover(e, true)}
                      onMouseLeave={(e) => optionHover(e, false)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={optionIconContainerStyle}>
                          <KeyRound size={16} style={{ color: '#FCD34D' }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4EDDD', fontFamily: "'Cinzel Hero', Georgia, serif" }}>
                            Trocar Senha
                          </div>
                          <div style={{ fontSize: '11px', color: '#A89A85' }}>
                            Atualizar senha de acesso à taverna
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#A89A85' }} />
                    </button>
                  )}

                  {/* Área Administrativa (Super Admin) */}
                  {isSuperAdmin && onOpenAdmin && (
                    <button
                      type="button"
                      id="option-admin-panel"
                      onClick={onOpenAdmin}
                      style={optionItemStyle}
                      onMouseEnter={(e) => optionHover(e, true)}
                      onMouseLeave={(e) => optionHover(e, false)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={optionIconContainerStyle}>
                          <Crown size={16} style={{ color: '#fbbf24' }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4EDDD', fontFamily: "'Cinzel Hero', Georgia, serif" }}>
                            Área Administrativa
                          </div>
                          <div style={{ fontSize: '11px', color: '#A89A85' }}>
                            Gerenciar membros e aprovações
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#A89A85' }} />
                    </button>
                  )}

                  {/* Sair da Conta */}
                  {onLogout && (
                    <button
                      type="button"
                      id="option-logout"
                      onClick={onLogout}
                      style={{
                        ...optionItemStyle,
                        borderColor: 'rgba(239, 68, 68, 0.25)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#14110E';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ ...optionIconContainerStyle, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                          <LogOut size={16} style={{ color: '#ef4444' }} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', fontFamily: "'Cinzel Hero', Georgia, serif" }}>
                            Sair da Conta
                          </div>
                          <div style={{ fontSize: '11px', color: '#A89A85' }}>
                            Encerrar sua sessão nesta mesa
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#ef4444' }} />
                    </button>
                  )}
                </div>
              )}

              {/* Botão de Enviar Sussurro (quando inspecionando outro aventureiro) */}
              {!isSelf && onStartDirectChat && (
                <button
                  type="button"
                  onClick={() => {
                    onStartDirectChat(targetUser);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    backgroundColor: targetUser.customBadgeColor || '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'Cinzel Hero', Georgia, serif",
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Enviar Sussurro</span>
                </button>
              )}

              {/* Ficha & Atributos */}
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#A89A85',
                    fontFamily: "'Inter', sans-serif",
                    display: 'block',
                    marginBottom: '8px'
                  }}
                >
                  Ficha do Personagem
                </span>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {/* Classe */}
                  <div
                    style={{
                      backgroundColor: '#14110E',
                      border: '1px solid rgba(244, 237, 221, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(217, 119, 6, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: activeColor,
                        flexShrink: 0
                      }}
                    >
                      <Shield size={16} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#A89A85', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Classe
                      </span>
                      <strong style={{ fontSize: '12px', color: '#F4EDDD' }}>
                        {targetUser.favoriteClass || 'Aventureiro'}
                      </strong>
                    </div>
                  </div>

                  {/* Dados */}
                  <div
                    style={{
                      backgroundColor: '#14110E',
                      border: '1px solid rgba(244, 237, 221, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(217, 119, 6, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FCD34D',
                        flexShrink: 0
                      }}
                    >
                      <Dices size={16} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#A89A85', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Dados da Sorte
                      </span>
                      <strong style={{ fontSize: '12px', color: '#F4EDDD' }}>
                        {targetUser.diceTheme || 'Dourado Nobre'}
                      </strong>
                    </div>
                  </div>

                  {/* Selo de Cera */}
                  <div
                    style={{
                      backgroundColor: '#14110E',
                      border: '1px solid rgba(244, 237, 221, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: activeColor,
                        border: '2px solid rgba(244, 237, 221, 0.3)',
                        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.5)',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#A89A85', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Selo de Cera
                      </span>
                      <strong style={{ fontSize: '12px', color: '#F4EDDD' }}>
                        {activeBadgeObj?.name || 'Insígnia'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pergaminho de Lore / Crônicas Pessoais */}
              <div
                style={{
                  backgroundColor: '#14110E',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#FCD34D',
                    fontFamily: "'Cinzel Hero', Georgia, serif",
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={13} style={{ color: '#d97706' }} />
                  Crônicas & Lore do Personagem
                </div>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#E0D7C6',
                    margin: 0,
                    fontFamily: "'Alegreya', Georgia, serif",
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {targetUser.bio || 'Este aventureiro ainda não escreveu suas crônicas. O mistério envolve seu passado nas mesas da taverna...'}
                </p>
              </div>

              {/* Rodapé de Registro na Taverna */}
              <div
                style={{
                  borderTop: '1px solid rgba(244, 237, 221, 0.1)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#A89A85'
                }}
              >
                <span>Acolhido na Taberna Digital em {new Date(targetUser.createdAt).toLocaleDateString('pt-BR')}</span>
                <span style={{ fontStyle: 'italic' }}>Taberna Digital</span>
              </div>
            </div>
          ) : (
            /* Modo de Edição / Personalização do Perfil na Aba Lateral */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Botão de retorno às Opções */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(244, 237, 221, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FCD34D',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontFamily: "'Cinzel Hero', Georgia, serif",
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '4px 0'
                  }}
                >
                  <ArrowLeft size={14} /> Voltar às Opções
                </button>
                <span style={{ fontSize: '11px', color: '#A89A85', fontStyle: 'italic' }}>Editando Perfil</span>
              </div>

              {/* Nome do Aventureiro (Escolhido pelo usuário) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FCD34D',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '6px'
                  }}
                >
                  Nome Escolhido pelo Usuário
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome ou alcunha principal na taverna"
                  maxLength={50}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 237, 221, 0.18)',
                    fontSize: '13px',
                    backgroundColor: '#14110E',
                    color: '#F4EDDD',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Seção de Anexo de Retrato (Fotos / Arquivos via Computador ou Celular) */}
              <div
                style={{
                  backgroundColor: '#14110E',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#FCD34D',
                      fontFamily: "'Inter', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={14} style={{ color: '#d97706' }} />
                    Retrato do Aventureiro (Fotos & Arquivos)
                  </label>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={() => setPhotoURL('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} /> Remover
                    </button>
                  )}
                </div>

                {/* Botão de Anexo Direto do Celular / Computador */}
                <button
                  type="button"
                  id="btn-upload-profile-file"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1.5px dashed rgba(217, 119, 6, 0.55)',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    color: '#FCD34D',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'Cinzel Hero', Georgia, serif",
                    letterSpacing: '0.03em',
                    transition: 'all 0.2s',
                    marginBottom: '8px',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.2)';
                    e.currentTarget.style.borderColor = '#d97706';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.55)';
                  }}
                >
                  <Upload size={16} />
                  <span>{isProcessingImage ? 'Processando imagem...' : 'Anexar Foto ou Arquivo do Computador/Celular'}</span>
                </button>

                <p style={{ fontSize: '11px', color: '#A89A85', marginBottom: '10px', lineHeight: 1.4 }}>
                  Toque para selecionar da fototeca do celular, usar a câmera ou escolher qualquer imagem (PNG, JPG) dos seus arquivos.
                </p>

                {/* Presets Fantásticos da Taverna */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#A89A85', display: 'block', marginBottom: '6px' }}>
                    Ou escolha uma ilustração da taverna:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                          border: photoURL === p.url ? '1px solid #d97706' : '1px solid rgba(244, 237, 221, 0.15)',
                          backgroundColor: photoURL === p.url ? 'rgba(217, 119, 6, 0.25)' : 'rgba(10, 8, 6, 0.6)',
                          color: photoURL === p.url ? '#FCD34D' : '#CFC6B8',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={p.url} alt={p.label} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL opcional */}
                <input
                  type="text"
                  value={photoURL.startsWith('data:image') ? '' : photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder={photoURL.startsWith('data:image') ? 'Foto anexada por arquivo direto' : 'Ou cole a URL de uma imagem da web'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(244, 237, 221, 0.15)',
                    fontSize: '12px',
                    backgroundColor: '#0E0C09',
                    color: '#F4EDDD',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Título Honorífico / Alcunha */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FCD34D',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '6px'
                  }}
                >
                  Título Honorífico / Alcunha na Taverna
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: O Quebra-Machado, Guardião das Sombras, O Menestrel"
                  maxLength={45}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 237, 221, 0.18)',
                    fontSize: '13px',
                    backgroundColor: '#14110E',
                    color: '#F4EDDD',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Classe Favorita */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FCD34D',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '6px'
                  }}
                >
                  Classe de RPG Favorita
                </label>
                <select
                  value={favoriteClass}
                  onChange={(e) => setFavoriteClass(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 237, 221, 0.18)',
                    fontSize: '13px',
                    backgroundColor: '#14110E',
                    color: '#F4EDDD',
                    boxSizing: 'border-box'
                  }}
                >
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Cor do Selo de Cera / Insígnia */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FCD34D',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '6px'
                  }}
                >
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
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: b.hex,
                        border: customBadgeColor === b.hex ? '3px solid #FCD34D' : '2px solid rgba(244, 237, 221, 0.25)',
                        cursor: 'pointer',
                        transform: customBadgeColor === b.hex ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s',
                        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.5)'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={customBadgeColor}
                    onChange={(e) => setCustomBadgeColor(e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Escolher cor personalizada no espectro"
                  />
                </div>
              </div>

              {/* Tema dos Dados */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FCD34D',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '6px'
                  }}
                >
                  Tema dos Dados da Sorte
                </label>
                <select
                  value={diceTheme}
                  onChange={(e) => setDiceTheme(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 237, 221, 0.18)',
                    fontSize: '13px',
                    backgroundColor: '#14110E',
                    color: '#F4EDDD',
                    boxSizing: 'border-box'
                  }}
                >
                  {DICE_THEMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* História / Lore */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FCD34D',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '6px'
                  }}
                >
                  Crônicas & Lore Pessoal
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua linhagem, motivações, grandes feitos ou cicatrizes de batalha..."
                  rows={3}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 237, 221, 0.18)',
                    fontSize: '13px',
                    backgroundColor: '#14110E',
                    color: '#F4EDDD',
                    resize: 'vertical',
                    fontFamily: "'Alegreya', Georgia, serif",
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#A89A85' }}>
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
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 237, 221, 0.25)',
                    backgroundColor: 'transparent',
                    color: '#CFC6B8',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#d97706',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: "'Cinzel Hero', Georgia, serif",
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)'
                  }}
                >
                  <Check size={16} />
                  <span>{isSaving ? 'Gravando...' : 'Gravar Alterações'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
