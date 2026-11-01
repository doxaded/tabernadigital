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
  const [selectedRow, setSelectedRow] = useState('classe');

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
    padding: '12px 16px',
    backgroundColor: '#281B12',
    border: '1px solid rgba(212, 163, 89, 0.15)',
    borderRadius: '12px',
    color: '#EAE0D5',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
    boxSizing: 'border-box'
  };

  const optionHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    e.currentTarget.style.backgroundColor = enter ? '#332318' : '#281B12';
    e.currentTarget.style.borderColor = enter ? 'rgba(212, 163, 89, 0.35)' : 'rgba(212, 163, 89, 0.15)';
    e.currentTarget.style.transform = enter ? 'translateY(-1px)' : 'translateY(0)';
  };

  const optionIconContainerStyle: React.CSSProperties = {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: 'rgba(212, 163, 89, 0.12)',
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

  const tagValue = targetUser.userTag || targetUser.tag || '';
  const roleLabel = isSuperAdmin ? 'Mestre Supremo' : 'Aventureiro';
  const goldValue = getEffectiveGold(targetUser).toLocaleString('pt-BR');
  const headerTitle = isEditing
    ? 'PERSONALIZAR PERFIL'
    : (isSelf ? 'REGISTRO DO AVENTUREIRO' : displayNameToShow.toUpperCase());
  const headerSubtitle = [roleLabel, tagValue ? `TAG #${tagValue}` : '', `${goldValue} Peças de Ouro`]
    .filter(Boolean)
    .join(' • ');

  /* Linhas no mesmo padrão da navegação I–V do MENU */
  const navRow = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    background: selected ? 'rgba(212, 163, 89, 0.12)' : 'transparent',
    border: selected ? '1px solid rgba(212, 163, 89, 0.4)' : '1px solid transparent',
    color: selected ? '#D4A359' : '#EAE0D5',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
    boxSizing: 'border-box'
  });
  const rowHoverIn = (e: React.MouseEvent<HTMLButtonElement>, selected: boolean) => {
    if (!selected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
  };
  const rowHoverOut = (e: React.MouseEvent<HTMLButtonElement>, selected: boolean) => {
    if (!selected) e.currentTarget.style.background = 'transparent';
  };
  const rowLabel: React.CSSProperties = { fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap' };
  const rowValue: React.CSSProperties = {
    fontSize: '14px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    textAlign: 'right',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0
  };
  const footerBtn = (color = '#EAE0D5', opacity = 1): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    color,
    opacity,
    cursor: 'pointer',
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'background 0.2s ease',
    textAlign: 'left',
    boxSizing: 'border-box'
  });
  const footHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; };
  const footHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; };

  const infoRows: { id: string; label: string; value: React.ReactNode; onClick?: () => void }[] = [
    { id: 'classe', label: 'Classe', value: targetUser.favoriteClass || 'Aventureiro' },
    { id: 'dados', label: 'Dados da Sorte', value: targetUser.diceTheme || 'Dourado Nobre' },
    {
      id: 'selo',
      label: 'Selo de Cera',
      value: (
        <>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: activeColor, border: '1px solid rgba(244, 237, 221, 0.4)', flexShrink: 0 }} />
          {activeBadgeObj?.name || 'Insígnia'}
        </>
      )
    }
  ];
  if (isSelf) {
    infoRows.push({
      id: 'bazar',
      label: 'Bazar da Taverna',
      value: (<>{goldValue} PO <ChevronRight size={14} /></>),
      onClick: () => { onClose(); onOpenShop?.(); }
    });
    infoRows.push({
      id: 'perfil',
      label: 'Personalizar Perfil',
      value: (<ChevronRight size={14} />),
      onClick: () => setIsEditing(true)
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 12, 8, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
        boxSizing: 'border-box'
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

      {/* Card: mesma arquitetura, proporção e acabamento do modal MENU */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(212, 163, 89, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
          color: '#EAE0D5',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gravura medieval escurecida em marca d'água */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "linear-gradient(rgba(20, 12, 8, 0.82), rgba(20, 12, 8, 0.9)), url('/assets/room_IV_mensagens_v2.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'relative',
            padding: '32px',
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch',
            boxSizing: 'border-box'
          }}
        >
          {/* Botão [ X ] discreto no canto superior direito */}
          <button
            onClick={onClose}
            aria-label="Fechar Perfil"
            title="Fechar"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: '#EAE0D5',
              opacity: 0.6,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={18} />
          </button>

          {/* Cabeçalho idêntico ao MENU */}
          <div style={{ marginBottom: '24px', textAlign: 'left', paddingRight: '32px' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                margin: '0 0 4px 0',
                color: '#EAE0D5',
                overflowWrap: 'anywhere'
              }}
            >
              {headerTitle}
            </h2>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '14px',
                letterSpacing: '0.06em',
                opacity: 0.65,
                margin: 0,
                color: '#EAE0D5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <span>{headerSubtitle}</span>
              {tagValue && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tagValue);
                    setCopiedTag(true);
                    setTimeout(() => setCopiedTag(false), 2000);
                  }}
                  title="Copiar Tag de 7 Caracteres"
                  style={{ background: 'none', border: 'none', color: copiedTag ? '#34d399' : '#EAE0D5', cursor: 'pointer', padding: 0, display: 'inline-flex', opacity: copiedTag ? 1 : 0.7 }}
                >
                  {copiedTag ? <Check size={13} /> : <Copy size={13} />}
                </button>
              )}
            </p>
          </div>

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

          {!isEditing ? (
            <>
              {/* Lista principal em linhas limpas (rótulo à esquerda, valor/ação à direita) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                {infoRows.map((row) => {
                  const selected = selectedRow === row.id;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      id={`profile-row-${row.id}`}
                      onClick={() => {
                        setSelectedRow(row.id);
                        row.onClick?.();
                      }}
                      style={navRow(selected)}
                      onMouseEnter={(e) => rowHoverIn(e, selected)}
                      onMouseLeave={(e) => rowHoverOut(e, selected)}
                    >
                      <span style={rowLabel}>{row.label}</span>
                      <span style={rowValue}>{row.value}</span>
                    </button>
                  );
                })}
              </div>

              {/* Crônicas pessoais */}
              {targetUser.bio && (
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontStyle: 'italic',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    opacity: 0.8,
                    margin: '0 0 16px 0',
                    padding: '0 16px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {targetUser.bio}
                </p>
              )}

              {/* Enviar Sussurro (ao inspecionar outro aventureiro) */}
              {!isSelf && onStartDirectChat && (
                <button
                  type="button"
                  onClick={() => {
                    onStartDirectChat(targetUser);
                    onClose();
                  }}
                  style={{ ...navRow(true), marginBottom: '16px' }}
                >
                  <span style={rowLabel}>Enviar Sussurro</span>
                  <span style={rowValue}><MessageSquare size={16} /></span>
                </button>
              )}

              {/* Linha divisória sutil */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

              {/* Bloco inferior agrupado (ações da conta) */}
              {isSelf ? (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <button type="button" id="option-customize-profile" onClick={() => setIsEditing(true)} style={footerBtn()} onMouseEnter={footHoverIn} onMouseLeave={footHoverOut}>
                    <Edit3 size={15} style={{ opacity: 0.75, color: '#D4A359', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Personalizar Perfil</span>
                  </button>
                  {onOpenChangePassword && (
                    <button type="button" id="option-change-password" onClick={onOpenChangePassword} style={footerBtn()} onMouseEnter={footHoverIn} onMouseLeave={footHoverOut}>
                      <KeyRound size={15} style={{ opacity: 0.75, color: '#D4A359', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>Trocar Senha</span>
                    </button>
                  )}
                  {isSuperAdmin && onOpenAdmin && (
                    <button type="button" id="option-admin-panel" onClick={onOpenAdmin} style={footerBtn('#D4A359')} onMouseEnter={footHoverIn} onMouseLeave={footHoverOut}>
                      <Shield size={15} style={{ opacity: 0.9, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>Área Administrativa</span>
                    </button>
                  )}
                  {onLogout && (
                    <button type="button" id="option-logout" onClick={onLogout} style={footerBtn('#EAE0D5', 0.65)} onMouseEnter={footHoverIn} onMouseLeave={footHoverOut}>
                      <LogOut size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>Sair da Conta</span>
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '12px', letterSpacing: '0.08em', opacity: 0.55, textAlign: 'center', fontStyle: 'italic' }}>
                  Acolhido na Taberna Digital em {new Date(targetUser.createdAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </>
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
                    fontSize: '13px',
                    backgroundColor: '#160D08',
                    border: '1px solid rgba(212, 163, 89, 0.22)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Seção de Anexo de Retrato (Fotos / Arquivos via Computador ou Celular) */}
              <div
                style={{
                  backgroundColor: '#251810',
                  border: '1px solid rgba(212, 163, 89, 0.25)',
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
                    fontSize: '13px',
                    backgroundColor: '#160D08',
                    border: '1px solid rgba(212, 163, 89, 0.22)',
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
                    fontSize: '13px',
                    backgroundColor: '#160D08',
                    border: '1px solid rgba(212, 163, 89, 0.22)',
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
                    fontSize: '13px',
                    backgroundColor: '#160D08',
                    border: '1px solid rgba(212, 163, 89, 0.22)',
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
                    fontSize: '13px',
                    backgroundColor: '#160D08',
                    border: '1px solid rgba(212, 163, 89, 0.22)',
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
