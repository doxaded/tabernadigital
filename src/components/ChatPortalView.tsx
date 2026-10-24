import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Shield,
  Sparkles,
  Send,
  Dices,
  Lock,
  Users,
  Search,
  Plus,
  Crown,
  ChevronRight,
  User,
  Volume2,
  Trash2,
  ExternalLink,
  Flame,
  Info,
  Star,
  Copy,
  Check,
  Settings,
  Smile,
  Edit3,
  X,
  UserMinus,
  UserCheck,
  AlertCircle,
  LogOut,
  UserPlus
} from 'lucide-react';
import { Campaign, ChatChannel, ChatMessage, ChatScope, CustomChatRoom, UserContact, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { storageService, ADMIN_EMAIL, normalizeUserTag } from '../services/storage';
import { AvatarFrame } from './AvatarFrame';

interface ChatPortalViewProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  allUsers: UserProfile[];
  onOpenProfile: (user: UserProfile) => void;
  initialChannelId?: string | null;
}

const QUICK_DICE = [
  { label: 'D4', expr: '1d4' },
  { label: 'D6', expr: '1d6' },
  { label: 'D8', expr: '1d8' },
  { label: 'D10', expr: '1d10' },
  { label: 'D12', expr: '1d12' },
  { label: 'D20', expr: '1d20' },
  { label: 'D100', expr: '1d100' },
];

const TAVERN_PRESENCES = [
  { id: 'counter' as const, label: 'Ao Balcão', sub: 'Disponível para prosa', icon: '🍺', dotColor: '#34d399' },
  { id: 'combat' as const, label: 'Em Combate', sub: 'Mesa ativa', icon: '⚔️', dotColor: '#f87171' },
  { id: 'reading' as const, label: 'Lendo Grimório', sub: 'Ocupado / Ausente', icon: '📜', dotColor: '#D6CFC4' },
  { id: 'shadows' as const, label: 'Nas Sombras', sub: 'Silencioso', icon: '🌑', dotColor: '#94a3b8' },
];

const MEDIEVAL_REACTIONS = ['🍺', '⚔️', '📜', '🎲', '👑'];

const EMOJI_CATEGORIES = {
  rpg: {
    label: '🏰 Fantasia & RPG',
    emojis: ['🍺', '⚔️', '🛡️', '🏹', '🐉', '🧙‍♂️', '👑', '📜', '🎲', '💎', '🏰', '🕯️', '💀', '🪙', '🧝', '🧟', '🗡️', '🔮', '🗝️', '🪵', '🐺', '🦅', '🍻', '🎪', '🍖', '🍞', '🐎', '⛺', '🔥']
  },
  faces: {
    label: '😀 Expressões',
    emojis: ['😄', '😂', '🤣', '😉', '😊', '😍', '🤩', '😎', '🥳', '🤔', '🤫', '🤨', '🤐', '🙄', '😬', '😱', '😴', '🤠', '😈', '👻', '🤖', '🧙', '🧐', '😏', '🫡', '😭', '🤯', '🥱', '😇']
  },
  symbols: {
    label: '👍 Símbolos & Ações',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '👊', '✊', '🦾', '💖', '🔥', '⭐', '✨', '💥', '⚡', '💯', '🎯', '🚩', '⚠️', '🛑', '❌', '✔️', '🎉', '🏆', '🥇', '⚔️', '🛡️', '💬', '👀']
  }
};

const ROOM_ICON_PRESETS = ['🛡️', '⚔️', '🍺', '👑', '📜', '🐉', '🏹', '🏰', '💎', '🎲', '🔮', '🗡️', '🕯️', '🐺'];

export const ChatPortalView: React.FC<ChatPortalViewProps> = ({
  currentUser,
  campaigns,
  allUsers,
  onOpenProfile,
  initialChannelId
}) => {
  // Abas da barra lateral: 'added' (Pessoas adicionadas), 'favorites' (Favoritos), 'rooms' (Salas de grupo), 'campaigns' (Mesas RPG)
  const [channelTab, setChannelTab] = useState<'added' | 'favorites' | 'rooms' | 'campaigns'>('added');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Sincronização e recarga local de contatos e salas
  const [syncTick, setSyncTick] = useState(0);
  const refreshChannels = () => setSyncTick(t => t + 1);

  // Modais
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
  const [addTagInput, setAddTagInput] = useState('');
  const [addTagError, setAddTagError] = useState<string | null>(null);
  const [addTagSuccess, setAddTagSuccess] = useState<string | null>(null);

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState('🛡️');
  const [newRoomMembers, setNewRoomMembers] = useState<string[]>([]);

  const [isManageRoomModalOpen, setIsManageRoomModalOpen] = useState(false);
  const [manageRoomTab, setManageRoomTab] = useState<'members' | 'invite' | 'edit'>('members');
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomDescription, setEditRoomDescription] = useState('');
  const [editRoomEmoji, setEditRoomEmoji] = useState('🛡️');

  // Emojis e Presença
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<'rpg' | 'faces' | 'symbols'>('rpg');
  const [copiedMyTag, setCopiedMyTag] = useState(false);
  const [tavernStatus, setTavernStatus] = useState<'counter' | 'combat' | 'reading' | 'shadows'>('counter');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [diceModifier, setDiceModifier] = useState<number>(0);
  const [isSealedDispatch, setIsSealedDispatch] = useState<boolean>(false);
  const [messageReactions, setMessageReactions] = useState<{ [msgId: string]: string[] }>({});

  const activePresence = TAVERN_PRESENCES.find(p => p.id === tavernStatus) || TAVERN_PRESENCES[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Escuta cliques fora do emoji picker para fechá-lo
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        const targetEl = e.target as HTMLElement;
        if (!targetEl.closest('.portal-emoji-trigger-btn')) {
          setIsEmojiPickerOpen(false);
        }
      }
    };
    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isEmojiPickerOpen]);

  // Escuta eventos de atualização de contatos e salas
  useEffect(() => {
    const handleUpdate = () => refreshChannels();
    window.addEventListener('taberna-contacts-updated', handleUpdate);
    window.addEventListener('taberna-rooms-updated', handleUpdate);
    window.addEventListener('taberna-chat-updated', handleUpdate);
    return () => {
      window.removeEventListener('taberna-contacts-updated', handleUpdate);
      window.removeEventListener('taberna-rooms-updated', handleUpdate);
      window.removeEventListener('taberna-chat-updated', handleUpdate);
    };
  }, []);

  // Constrói os canais do usuário
  const channelsData = currentUser
    ? chatService.buildChannels(currentUser, campaigns, allUsers)
    : { campaignPublic: [], campaignPrivate: [], direct: [], favorites: [], rooms: [], allChannels: [] };

  // Define canal inicial
  useEffect(() => {
    if (!activeChannelId) {
      if (initialChannelId && channelsData.allChannels.some(c => c.id === initialChannelId)) {
        setActiveChannelId(initialChannelId);
      } else if (channelsData.rooms.length > 0) {
        setActiveChannelId(channelsData.rooms[0].id);
      } else if (channelsData.direct.length > 0) {
        setActiveChannelId(channelsData.direct[0].id);
      } else if (channelsData.campaignPublic.length > 0) {
        setActiveChannelId(channelsData.campaignPublic[0].id);
      }
    }
  }, [channelsData.allChannels.length, initialChannelId, syncTick]);

  // Escuta mensagens do canal ativo em tempo real
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    const unsubscribe = chatService.subscribeChannel(activeChannelId, (updatedMsgs) => {
      setMessages(updatedMsgs);
    });

    return () => {
      unsubscribe();
    };
  }, [activeChannelId]);

  // Rolagem suave para o fim da lista de mensagens
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  // Canal ativo atual
  const activeChannel = channelsData.allChannels.find(c => c.id === activeChannelId) || null;

  // Enviar mensagem
  const handleSend = async (textToSend: string) => {
    if (!currentUser || !activeChannel) return;
    const text = textToSend.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      let recipientUid: string | undefined = undefined;
      let recipientName: string | undefined = undefined;

      if (activeChannel.type === 'direct') {
        const otherUid = activeChannel.participants.find(p => p !== currentUser.uid);
        const otherUser = allUsers.find(u => u.uid === otherUid);
        recipientUid = otherUid;
        recipientName = otherUser?.displayName;
      } else if (activeChannel.type === 'campaign-private') {
        const otherUid = activeChannel.participants.find(p => p !== currentUser.uid);
        const otherUser = allUsers.find(u => u.uid === otherUid);
        recipientUid = otherUid;
        recipientName = otherUser?.displayName;
      }

      // Se o modo despacho selado estiver ativo e não for comando /r
      const finalMsgText = isSealedDispatch && !text.startsWith('/')
        ? `📜 [Despacho Selado]: ${text}`
        : text;

      await chatService.sendMessage({
        channelId: activeChannel.id,
        scope: activeChannel.type,
        text: finalMsgText,
        currentUser,
        campaignId: activeChannel.campaignId,
        campaignName: activeChannel.campaignName,
        recipientUid,
        recipientName,
      });

      // Atualiza localmente de imediato
      setMessages(storageService.getChatMessages(activeChannel.id));
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Inserção de Emoji no Input no local do cursor
  const handleInsertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setInputText(prev => prev + emoji);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const nextText = inputText.substring(0, start) + emoji + inputText.substring(end);
    setInputText(nextText);

    setTimeout(() => {
      input.focus();
      const newCursor = start + emoji.length;
      input.setSelectionRange(newCursor, newCursor);
    }, 10);
  };

  // Rolar dado rápido com aplicação do modificador ativo
  const handleQuickRoll = (expr: string) => {
    const finalExpr = diceModifier !== 0
      ? (diceModifier > 0 ? `${expr}+${diceModifier}` : `${expr}${diceModifier}`)
      : expr;
    handleSend(`/r ${finalExpr}`);
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[msgId] || [];
      const updated = current.includes(emoji)
        ? current.filter(e => e !== emoji)
        : [...current, emoji];
      return { ...prev, [msgId]: updated };
    });
  };

  // Filtragem de canais por busca
  const filterChannels = (list: ChatChannel[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      (c.campaignName && c.campaignName.toLowerCase().includes(q))
    );
  };

  const filteredDirect = filterChannels(channelsData.direct);
  const filteredFavorites = filterChannels(channelsData.favorites);
  const filteredRooms = filterChannels(channelsData.rooms);
  const filteredCampaignPublic = filterChannels(channelsData.campaignPublic);
  const filteredCampaignPrivate = filterChannels(channelsData.campaignPrivate);

  // Manipulação de Contatos
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setAddTagError(null);
    setAddTagSuccess(null);

    const res = storageService.addUserContactByTag(currentUser.uid, addTagInput);
    if (!res.success) {
      setAddTagError(res.error || 'Erro ao adicionar aventureiro.');
      return;
    }

    refreshChannels();
    setAddTagSuccess(`Aventureiro ${res.user?.displayName} adicionado com sucesso ao seu recanto!`);
    setAddTagInput('');
    setChannelTab('added');

    if (res.user) {
      const newDmChannelId = chatService.getDirectChannelId(currentUser.uid, res.user.uid);
      setActiveChannelId(newDmChannelId);
    }

    setTimeout(() => {
      setIsAddTagModalOpen(false);
      setAddTagSuccess(null);
    }, 1200);
  };

  const handleToggleFavorite = (targetUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    storageService.toggleFavoriteContact(currentUser.uid, targetUid);
    refreshChannels();
  };

  const handleRemoveContact = (targetUid: string, targetName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (window.confirm(`Deseja realmente remover ${targetName} dos seus companheiros adicionados?`)) {
      storageService.removeUserContact(currentUser.uid, targetUid);
      refreshChannels();
      const dmId = chatService.getDirectChannelId(currentUser.uid, targetUid);
      if (activeChannelId === dmId) {
        setActiveChannelId(null);
      }
    }
  };

  // Criação de Nova Sala / Grupo
  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newRoomName.trim()) return;

    const room = storageService.createCustomRoom(currentUser, {
      name: newRoomName.trim(),
      description: newRoomDescription.trim() || undefined,
      iconEmoji: newRoomEmoji,
      memberUids: newRoomMembers
    });

    refreshChannels();
    setIsCreateRoomModalOpen(false);
    setNewRoomName('');
    setNewRoomDescription('');
    setNewRoomMembers([]);
    setChannelTab('rooms');
    setActiveChannelId(`room_${room.id}`);
  };

  // Gerenciamento da Sala Ativa
  const activeCustomRoom = activeChannel?.customRoom || null;
  const isCurrentUserCreator = !!(activeCustomRoom && currentUser && activeCustomRoom.creatorUid === currentUser.uid);
  const isCurrentUserAdmin = !!(
    activeCustomRoom &&
    currentUser &&
    (activeCustomRoom.adminUids.includes(currentUser.uid) || isCurrentUserCreator)
  );

  const openManageModal = () => {
    if (!activeCustomRoom) return;
    setEditRoomName(activeCustomRoom.name);
    setEditRoomDescription(activeCustomRoom.description || '');
    setEditRoomEmoji(activeCustomRoom.iconEmoji || '🛡️');
    setManageRoomTab('members');
    setIsManageRoomModalOpen(true);
  };

  const handleSaveRoomEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomRoom || !currentUser) return;
    const res = storageService.updateCustomRoom(activeCustomRoom.id, currentUser.uid, {
      name: editRoomName.trim(),
      description: editRoomDescription.trim(),
      iconEmoji: editRoomEmoji
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    refreshChannels();
    alert('Informações da sala atualizadas com sucesso!');
  };

  const handleToggleAdminStatus = (targetUid: string) => {
    if (!activeCustomRoom || !currentUser) return;
    const res = storageService.toggleAdminCustomRoom(activeCustomRoom.id, currentUser.uid, targetUid);
    if (!res.success) {
      alert(res.error);
      return;
    }
    refreshChannels();
  };

  const handleExpelMember = (targetUid: string, targetName: string) => {
    if (!activeCustomRoom || !currentUser) return;
    if (window.confirm(`Deseja realmente expulsar ${targetName} desta sala de bate-papo?`)) {
      const res = storageService.removeMemberFromCustomRoom(activeCustomRoom.id, currentUser.uid, targetUid);
      if (!res.success) {
        alert(res.error);
        return;
      }
      refreshChannels();
    }
  };

  const handleAddMemberToRoom = (memberUid: string) => {
    if (!activeCustomRoom || !currentUser) return;
    const res = storageService.addMemberToCustomRoom(activeCustomRoom.id, currentUser.uid, memberUid);
    if (!res.success) {
      alert(res.error);
      return;
    }
    refreshChannels();
  };

  const handleLeaveOrDeleteRoom = () => {
    if (!activeCustomRoom || !currentUser) return;
    const actionText = isCurrentUserCreator
      ? 'Deseja realmente EXCLUIR DEFINITIVAMENTE esta sala de bate-papo? Todas as mensagens serão perdidas.'
      : 'Deseja realmente sair desta sala de bate-papo?';

    if (window.confirm(actionText)) {
      const res = storageService.leaveOrDeleteCustomRoom(activeCustomRoom.id, currentUser.uid);
      if (res.success) {
        refreshChannels();
        setIsManageRoomModalOpen(false);
        setActiveChannelId(null);
      } else {
        alert(res.error);
      }
    }
  };

  // Contatos que ainda não estão no grupo para convidar
  const addedContactsForInvite = (channelsData.direct || [])
    .map(c => c.directOtherUser)
    .filter((u): u is UserProfile => !!u && (!activeCustomRoom || !activeCustomRoom.memberUids.includes(u.uid)));

  const myTagDisplay = currentUser?.userTag || currentUser?.tag || 'TABERNA';

  return (
    <div className="portal-chamber" style={{ width: '100%', height: '100vh', minHeight: '100vh', backgroundColor: '#0e0906', backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(217, 119, 6, 0.12) 0%, rgba(14, 9, 6, 0.98) 75%)', color: '#FAF7F2', padding: 0, margin: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div className="portal-unified-stage" aria-label="Recanto dos Bardos - Mensageria da Taberna" style={{ width: '100%', height: '100%', margin: 0, borderRadius: 0, border: 'none', boxShadow: 'none' }}>
        <div className="portal-inner">
          
          {/* ============================================================== */}
          {/* BARRA LATERAL (Scriptorium / Recanto dos Bardos)                 */}
          {/* ============================================================== */}
          <aside className="portal-side">
            <div className="portal-side__header">
              
              {/* Topo do Header: Título da Sala e Tag Única do Usuário */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span className="portal-eyebrow" style={{ color: '#f59e0b', display: 'block', fontSize: '11px', fontWeight: 800 }}>
                    RECANTO DOS BARDOS
                  </span>
                  <div style={{ fontSize: '11px', color: '#a89a85', marginTop: '2px' }}>
                    Sua Tag: <strong style={{ color: '#FCD34D', fontFamily: 'monospace' }}>#{myTagDisplay}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(myTagDisplay);
                      setCopiedMyTag(true);
                      setTimeout(() => setCopiedMyTag(false), 2000);
                    }}
                    style={{
                      background: 'rgba(244, 237, 221, 0.08)',
                      border: '1px solid rgba(244, 237, 221, 0.2)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: copiedMyTag ? '#34d399' : '#FAF7F2',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Copiar minha Tag de 7 caracteres para compartilhar com amigos"
                  >
                    {copiedMyTag ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedMyTag ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenProfile(currentUser!)}
                    className="portal-my-profile-btn"
                    title="Editar Meu Perfil de Aventureiro"
                  >
                    <User size={13} />
                    <span>Perfil</span>
                  </button>
                </div>
              </div>

              {/* Botões de Ações Rápidas: Adicionar por Tag & Criar Nova Sala */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAddTagError(null);
                    setAddTagSuccess(null);
                    setAddTagInput('');
                    setIsAddTagModalOpen(true);
                  }}
                  style={{
                    backgroundColor: '#d97706',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                  }}
                  title="Adicionar um companheiro utilizando sua tag única de 7 caracteres"
                >
                  <UserPlus size={14} />
                  <span>Adicionar Tag</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewRoomName('');
                    setNewRoomDescription('');
                    setNewRoomMembers([]);
                    setIsCreateRoomModalOpen(true);
                  }}
                  style={{
                    backgroundColor: '#1E1E1E',
                    color: '#F4EDDD',
                    border: '1px solid rgba(244, 237, 221, 0.22)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Criar uma sala de bate-papo em grupo com ferramentas de administração"
                >
                  <Plus size={14} />
                  <span>Criar Chat</span>
                </button>
              </div>

              {/* Seletor de Abas: Adicionados, Favoritos, Salas, Mesas */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px',
                  marginBottom: '12px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setChannelTab('added')}
                  className={`portal-tab ${channelTab === 'added' ? 'is-active' : ''}`}
                  title="Companheiros que você adicionou por tag"
                >
                  <Users size={13} />
                  <span>Adicionados ({channelsData.direct.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelTab('favorites')}
                  className={`portal-tab ${channelTab === 'favorites' ? 'is-active' : ''}`}
                  title="Companheiros marcados como favoritos"
                >
                  <Star size={13} />
                  <span>Favoritos ({channelsData.favorites.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelTab('rooms')}
                  className={`portal-tab ${channelTab === 'rooms' ? 'is-active' : ''}`}
                  title="Salas e grupos criados"
                >
                  <Shield size={13} />
                  <span>Salas ({channelsData.rooms.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelTab('campaigns')}
                  className={`portal-tab ${channelTab === 'campaigns' ? 'is-active' : ''}`}
                  title="Canais das suas Mesas de RPG ativas"
                >
                  <Flame size={13} />
                  <span>Mesas RPG ({channelsData.campaignPublic.length + channelsData.campaignPrivate.length})</span>
                </button>
              </div>

              {/* Barra de Pesquisa de Canais */}
              <div className="portal-search">
                <Search size={14} className="portal-search__icon" />
                <input
                  type="text"
                  placeholder={
                    channelTab === 'added'
                      ? 'Filtrar contatos adicionados...'
                      : channelTab === 'favorites'
                      ? 'Filtrar favoritos...'
                      : channelTab === 'rooms'
                      ? 'Filtrar salas de grupo...'
                      : 'Filtrar mesas...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="portal-search__input"
                />
              </div>
            </div>

            {/* Conteúdo Rolável da Barra Lateral Conforme a Aba Selecionada */}
            <div className="portal-channels-list">
              
              {/* ============================================================== */}
              {/* ABA 1: PESSOAS ADICIONADAS                                    */}
              {/* ============================================================== */}
              {channelTab === 'added' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 8px' }}>
                    <div className="portal-section-label" style={{ padding: 0, margin: 0 }}>
                      <Users size={12} />
                      <span>Companheiros Adicionados</span>
                    </div>
                  </div>

                  {channelsData.direct.length === 0 ? (
                    /* ABA DE CHATS INICIALMENTE VAZIA (CASO NÃO POSSUA NENHUMA PESSOA ADICIONADA) */
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: '#121212',
                        borderRadius: '8px',
                        border: '1px dashed rgba(242, 236, 225, 0.18)',
                        margin: '8px 0'
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(217, 119, 6, 0.12)',
                          border: '1px solid rgba(217, 119, 6, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f59e0b'
                        }}
                      >
                        <Users size={24} />
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: '#F4EDDD' }}>
                          Aba de Chats Vazia
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#a89a85', lineHeight: 1.5 }}>
                          Você ainda não possui nenhuma pessoa adicionada no seu recanto.
                        </p>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#0A0A0A',
                          border: '1px solid rgba(244, 237, 221, 0.15)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: '#d1d5db',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        Peça a <strong>tag de 7 caracteres</strong> de outros aventureiros para adicioná-los e iniciar conversas secretas!
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAddTagError(null);
                          setAddTagSuccess(null);
                          setAddTagInput('');
                          setIsAddTagModalOpen(true);
                        }}
                        style={{
                          backgroundColor: '#d97706',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <UserPlus size={14} />
                        <span>Adicionar por Tag</span>
                      </button>
                    </div>
                  ) : filteredDirect.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhum companheiro encontrado para a busca "{searchQuery}".
                    </div>
                  ) : (
                    filteredDirect.map(channel => {
                      const isActive = activeChannelId === channel.id;
                      const otherUser = channel.directOtherUser;

                      return (
                        <div
                          key={channel.id}
                          className={`portal-channel-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => setActiveChannelId(channel.id)}
                          style={{ position: 'relative' }}
                        >
                          <div
                            className="portal-channel-item__avatar"
                            style={{ borderColor: channel.badgeColor || '#7c3aed' }}
                          >
                            {otherUser?.photoURL ? (
                              <img src={otherUser.photoURL} alt={channel.title} />
                            ) : (
                              <span>{channel.title.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="portal-channel-item__content">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <div className="portal-channel-item__title">{channel.title}</div>
                              {otherUser && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    color: '#FCD34D',
                                    background: 'rgba(0,0,0,0.4)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(252, 211, 77, 0.25)'
                                  }}
                                  title={`Tag de aventureiro: #${otherUser.userTag || otherUser.tag}`}
                                >
                                  #{otherUser.userTag || otherUser.tag}
                                </span>
                              )}
                            </div>
                            <div className="portal-channel-item__sub">{channel.lastMessage}</div>
                          </div>

                          {/* Ações Rápidas: Favoritar e Remover Contato */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                            {otherUser && (
                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(otherUser.uid, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: channel.isFavorite ? '#f59e0b' : '#6b7280',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title={channel.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                              >
                                <Star size={14} fill={channel.isFavorite ? '#f59e0b' : 'none'} />
                              </button>
                            )}

                            {otherUser && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveContact(otherUser.uid, channel.title, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0.7
                                }}
                                title="Remover dos contatos adicionados"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* ABA 2: FAVORITOS                                              */}
              {/* ============================================================== */}
              {channelTab === 'favorites' && (
                <>
                  <div className="portal-section-label" style={{ padding: '4px 6px 8px', margin: 0 }}>
                    <Star size={12} />
                    <span>Aventureiros Favoritos</span>
                  </div>

                  {channelsData.favorites.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#121212',
                        borderRadius: '8px',
                        border: '1px dashed rgba(242, 236, 225, 0.18)',
                        margin: '8px 0'
                      }}
                    >
                      <Star size={24} style={{ color: '#f59e0b', opacity: 0.6 }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4EDDD' }}>
                        Nenhum Favorito Marcado
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#a89a85', lineHeight: 1.4 }}>
                        Acesse a aba <strong>Adicionados</strong> e clique na estrela ao lado de um companheiro para fixá-lo aqui.
                      </p>
                    </div>
                  ) : filteredFavorites.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhum favorito encontrado para "{searchQuery}".
                    </div>
                  ) : (
                    filteredFavorites.map(channel => {
                      const isActive = activeChannelId === channel.id;
                      const otherUser = channel.directOtherUser;

                      return (
                        <div
                          key={channel.id}
                          className={`portal-channel-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => setActiveChannelId(channel.id)}
                        >
                          <div
                            className="portal-channel-item__avatar"
                            style={{ borderColor: channel.badgeColor || '#d97706' }}
                          >
                            {otherUser?.photoURL ? (
                              <img src={otherUser.photoURL} alt={channel.title} />
                            ) : (
                              <span>{channel.title.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="portal-channel-item__content">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <div className="portal-channel-item__title">{channel.title}</div>
                              {otherUser && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    color: '#FCD34D',
                                    background: 'rgba(0,0,0,0.4)',
                                    padding: '1px 5px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  #{otherUser.userTag || otherUser.tag}
                                </span>
                              )}
                            </div>
                            <div className="portal-channel-item__sub">{channel.lastMessage}</div>
                          </div>

                          {otherUser && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(otherUser.uid, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remover dos favoritos"
                            >
                              <Star size={14} fill="#f59e0b" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* ABA 3: SALAS & GRUPOS CUSTOMIZADOS                            */}
              {/* ============================================================== */}
              {channelTab === 'rooms' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 8px' }}>
                    <div className="portal-section-label" style={{ padding: 0, margin: 0 }}>
                      <Shield size={12} />
                      <span>Salas & Grupos Criados</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreateRoomModalOpen(true)}
                      className="portal-new-dm-btn"
                    >
                      <Plus size={13} />
                      <span>Nova Sala</span>
                    </button>
                  </div>

                  {channelsData.rooms.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#121212',
                        borderRadius: '8px',
                        border: '1px dashed rgba(242, 236, 225, 0.18)',
                        margin: '8px 0'
                      }}
                    >
                      <Shield size={24} style={{ color: '#d97706' }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4EDDD' }}>
                        Nenhuma Sala de Chat Criada
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#a89a85', lineHeight: 1.4 }}>
                        Crie grupos e salas de conversa com ferramentas completas de administração, expulsão de membros e personalização!
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateRoomModalOpen(true)}
                        style={{
                          backgroundColor: '#d97706',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + Criar Sala
                      </button>
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhuma sala encontrada para "{searchQuery}".
                    </div>
                  ) : (
                    filteredRooms.map(channel => {
                      const isActive = activeChannelId === channel.id;
                      const room = channel.customRoom;

                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setActiveChannelId(channel.id)}
                          className={`portal-channel-item ${isActive ? 'is-active' : ''}`}
                        >
                          <div className="portal-channel-item__icon" style={{ fontSize: '18px' }}>
                            {room?.iconEmoji || '🛡️'}
                          </div>

                          <div className="portal-channel-item__content">
                            <div className="portal-channel-item__title">{channel.title}</div>
                            <div className="portal-channel-item__sub">{channel.subtitle || channel.lastMessage}</div>
                          </div>

                          <ChevronRight size={14} className="portal-channel-item__arrow" />
                        </button>
                      );
                    })
                  )}
                </>
              )}

              {/* ============================================================== */}
              {/* ABA 4: MESAS RPG                                              */}
              {/* ============================================================== */}
              {channelTab === 'campaigns' && (
                <>
                  <div className="portal-section-label">
                    <Flame size={12} />
                    <span>Salões Gerais das Mesas</span>
                  </div>

                  {filteredCampaignPublic.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhum salão público encontrado. Crie ou entre em uma mesa com chave de acesso.
                    </div>
                  ) : (
                    filteredCampaignPublic.map(channel => {
                      const isActive = activeChannelId === channel.id;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setActiveChannelId(channel.id)}
                          className={`portal-channel-item ${isActive ? 'is-active' : ''}`}
                        >
                          <div className="portal-channel-item__icon portal-channel-item__icon--public">
                            📢
                          </div>
                          <div className="portal-channel-item__content">
                            <div className="portal-channel-item__title">{channel.title}</div>
                            <div className="portal-channel-item__sub">{channel.lastMessage}</div>
                          </div>
                          <ChevronRight size={14} className="portal-channel-item__arrow" />
                        </button>
                      );
                    })
                  )}

                  <div className="portal-section-label" style={{ marginTop: '16px' }}>
                    <Lock size={12} />
                    <span>Sussurros Secretos da Mesa</span>
                  </div>

                  {filteredCampaignPrivate.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhum canal secreto de sussurros ativo para suas mesas no momento.
                    </div>
                  ) : (
                    filteredCampaignPrivate.map(channel => {
                      const isActive = activeChannelId === channel.id;
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setActiveChannelId(channel.id)}
                          className={`portal-channel-item ${isActive ? 'is-active' : ''}`}
                        >
                          <div className="portal-channel-item__icon portal-channel-item__icon--secret">
                            🤫
                          </div>
                          <div className="portal-channel-item__content">
                            <div className="portal-channel-item__title">{channel.title}</div>
                            <div className="portal-channel-item__sub">{channel.lastMessage}</div>
                          </div>
                          <ChevronRight size={14} className="portal-channel-item__arrow" />
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </aside>

          {/* ============================================================== */}
          {/* PAINEL PRINCIPAL: CHAT FEED, COMPOSER & EMOJIS                  */}
          {/* ============================================================== */}
          <main className="portal-main">
            {activeChannel ? (
              <div className="portal-chat-box">
                {/* Header do Chat Ativo */}
                <div className="portal-chat-header">
                  <div className="portal-chat-header__info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h2 className="portal-chat-header__title">{activeChannel.title}</h2>

                      {activeChannel.type === 'campaign-public' && (
                        <span className="portal-badge portal-badge--public">
                          Salão Público da Mesa
                        </span>
                      )}
                      {activeChannel.type === 'campaign-private' && (
                        <span className="portal-badge portal-badge--secret">
                          <Lock size={11} /> Sussurro Secreto
                        </span>
                      )}
                      {activeChannel.type === 'direct' && (
                        <span className="portal-badge portal-badge--dm">
                          <MessageSquare size={11} /> Conversa Direta
                        </span>
                      )}
                      {activeChannel.type === 'group' && (
                        <span
                          className="portal-badge"
                          style={{
                            backgroundColor: 'rgba(217, 119, 6, 0.18)',
                            color: '#FCD34D',
                            border: '1px solid rgba(217, 119, 6, 0.4)'
                          }}
                        >
                          <Shield size={11} /> Sala de Bate-Papo
                        </span>
                      )}
                    </div>

                    <p className="portal-chat-header__sub">
                      {activeChannel.subtitle || 'Canal ativo da Taberna Digital.'}
                    </p>
                  </div>

                  {/* Ações do Header do Canal */}
                  <div className="portal-chat-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                    {/* Botão de Ferramentas de Gerenciamento da Sala de Grupo */}
                    {activeChannel.type === 'group' && activeCustomRoom && (
                      <button
                        type="button"
                        onClick={openManageModal}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: isCurrentUserAdmin ? '#d97706' : '#222222',
                          color: isCurrentUserAdmin ? '#000000' : '#F4EDDD',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: isCurrentUserAdmin ? '0 2px 8px rgba(217, 119, 6, 0.3)' : 'none'
                        }}
                        title="Abrir ferramentas de distribuição de administração, expulsão e edição da sala"
                      >
                        <Settings size={14} />
                        <span>{isCurrentUserAdmin ? 'Gerenciar Sala' : 'Ver Membros'}</span>
                      </button>
                    )}

                    {/* Chips de Participantes Clicáveis para Ver Perfil */}
                    <div className="portal-participants-bar" title="Aventureiros no canal (clique para ver perfil)">
                      {activeChannel.participants.map(uid => {
                        const user = allUsers.find(u => u.uid === uid);
                        if (!user) return null;
                        return (
                          <button
                            key={user.uid}
                            type="button"
                            onClick={() => onOpenProfile(user)}
                            className="portal-participant-chip"
                            title={`Inspecionar perfil de ${user.displayName} (#${user.userTag || user.tag})`}
                          >
                            <span
                              className="portal-participant-dot"
                              style={{ backgroundColor: user.customBadgeColor || '#d97706' }}
                            />
                            <span>{user.displayName.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Banner de Aviso de Canal Privado se for Sussurro */}
                {activeChannel.type === 'campaign-private' && (
                  <div className="portal-whisper-banner">
                    <Lock size={14} />
                    <span>
                      Este é um canal secreto de sussurros. As mensagens e rolagens enviadas aqui são visíveis exclusivamente entre o Mestre e o jogador.
                    </span>
                  </div>
                )}

                {/* Feed de Mensagens */}
                <div className="portal-messages-log">
                  {messages.length === 0 ? (
                    <div className="portal-empty-chat">
                      <MessageSquare size={36} style={{ color: 'var(--text-parchment, #F2ECE1)', opacity: 0.4 }} />
                      <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-soft)' }}>
                        O silêncio ecoa neste salão. Seja o primeiro a quebrar a quietude ou a rolar os dados!
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Dica: Digite <code>/d20</code> ou <code>/r 2d6+3</code> para rolar dados diretamente na mesa.
                      </span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = currentUser?.uid === msg.senderUid;
                      const senderUser = allUsers.find(u => u.uid === msg.senderUid);
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={msg.id}
                          className={`portal-msg ${isMe ? 'portal-msg--me' : 'portal-msg--other'}`}
                        >
                          <div
                            onClick={() => senderUser && onOpenProfile(senderUser)}
                            style={{ cursor: senderUser ? 'pointer' : 'default', flexShrink: 0 }}
                            title={senderUser ? `Ver perfil de ${msg.senderName} (#${senderUser.userTag || senderUser.tag})` : msg.senderName}
                          >
                            <AvatarFrame
                              user={senderUser}
                              avatarUrl={msg.senderAvatarUrl || senderUser?.photoURL}
                              displayName={msg.senderName}
                              size="sm"
                            />
                          </div>

                          <div className="portal-msg__body">
                            <div className="portal-msg__meta">
                              <span
                                onClick={() => senderUser && onOpenProfile(senderUser)}
                                className="portal-msg__sender"
                                style={{ cursor: senderUser ? 'pointer' : 'default' }}
                              >
                                {msg.senderName}
                              </span>

                              {senderUser && (
                                <span style={{ fontSize: '10px', color: '#a89a85', fontFamily: 'monospace' }}>
                                  #{senderUser.userTag || senderUser.tag}
                                </span>
                              )}

                              {(msg.senderTitle || senderUser?.title) && (
                                <span
                                  className="portal-msg__title-tag"
                                  style={{ color: msg.senderBadgeColor || '#d97706' }}
                                >
                                  "{msg.senderTitle || senderUser?.title}"
                                </span>
                              )}

                              <span className="portal-msg__time">{timeStr}</span>
                            </div>

                            <div className="portal-msg__bubble">
                              {msg.diceResult ? (
                                <div className="portal-dice-card">
                                  <div className="portal-dice-card__header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Dices size={16} style={{ color: 'var(--text-parchment, #F2ECE1)' }} />
                                      <strong>Rolagem de Dados: <code>{msg.diceResult.expression}</code></strong>
                                    </div>
                                    {msg.diceResult.hasNat20 && (
                                      <span className="portal-dice-crit portal-dice-crit--nat20">
                                        🌟 ACERTO CRÍTICO!
                                      </span>
                                    )}
                                    {msg.diceResult.hasNat1 && (
                                      <span className="portal-dice-crit portal-dice-crit--nat1">
                                        💀 FALHA CRÍTICA!
                                      </span>
                                    )}
                                  </div>

                                  <div className="portal-dice-card__body">
                                    <div className="portal-dice-card__rolls">
                                      <span>Resultados: [{msg.diceResult.rolls.join(', ')}]</span>
                                      {msg.diceResult.modifier !== 0 && (
                                        <span>Modificador: {msg.diceResult.modifier > 0 ? `+${msg.diceResult.modifier}` : msg.diceResult.modifier}</span>
                                      )}
                                    </div>
                                    <div className="portal-dice-card__total">
                                      Total: <strong>{msg.diceResult.total}</strong>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="portal-msg__text">{msg.text}</p>
                              )}

                              {/* Reações Rápidas */}
                              <div className="portal-msg-reactions-row">
                                {(messageReactions[msg.id] || []).map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="portal-reaction-badge is-active"
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    title="Remover reação"
                                  >
                                    {emoji} 1
                                  </button>
                                ))}

                                <div className="portal-reaction-stamps">
                                  {MEDIEVAL_REACTIONS.map(emoji => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      className="portal-reaction-stamp-btn"
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      title={`Carimbar com ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Bandeja de Rolagem de Dados */}
                <div className="portal-quick-dice">
                  <div className="portal-quick-dice__left">
                    <span className="portal-quick-dice__label">
                      <Dices size={14} /> Dados:
                    </span>
                    <div className="portal-quick-dice__buttons">
                      {QUICK_DICE.map(d => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => handleQuickRoll(d.expr)}
                          className="portal-quick-dice__btn"
                          title={`Rolar ${d.expr}${diceModifier ? (diceModifier > 0 ? `+${diceModifier}` : diceModifier) : ''} no chat`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="portal-dice-modifiers" role="group" aria-label="Modificador de Dados">
                    <span className="portal-dice-mod-label">Mod:</span>
                    {[-2, -1, 0, 1, 2, 3, 4, 5].map(mod => (
                      <button
                        key={mod}
                        type="button"
                        className={`portal-dice-mod-pill ${diceModifier === mod ? 'is-active' : ''}`}
                        onClick={() => setDiceModifier(mod)}
                        title={`Modificador ${mod >= 0 ? `+${mod}` : mod}`}
                      >
                        {mod > 0 ? `+${mod}` : mod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compositor de Mensagens com Seletor de Emojis */}
                <div style={{ position: 'relative' }}>
                  
                  {/* Seletor Flutuante de Emojis Popover */}
                  {isEmojiPickerOpen && (
                    <div
                      ref={emojiPickerRef}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '16px',
                        marginBottom: '8px',
                        width: '320px',
                        backgroundColor: '#161412',
                        border: '1px solid rgba(244, 237, 221, 0.22)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                        zIndex: 50,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Categorias de Emojis */}
                      <div
                        style={{
                          display: 'flex',
                          backgroundColor: '#0E0D0B',
                          borderBottom: '1px solid rgba(244, 237, 221, 0.1)',
                          padding: '6px'
                        }}
                      >
                        {(Object.keys(EMOJI_CATEGORIES) as Array<'rpg' | 'faces' | 'symbols'>).map(catKey => {
                          const cat = EMOJI_CATEGORIES[catKey];
                          const isActive = activeEmojiCategory === catKey;
                          return (
                            <button
                              key={catKey}
                              type="button"
                              onClick={() => setActiveEmojiCategory(catKey)}
                              style={{
                                flex: 1,
                                background: isActive ? 'rgba(217, 119, 6, 0.2)' : 'none',
                                border: 'none',
                                color: isActive ? '#FCD34D' : '#a89a85',
                                borderRadius: '6px',
                                padding: '6px 4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Grade de Emojis */}
                      <div
                        style={{
                          padding: '10px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '6px',
                          maxHeight: '160px',
                          overflowY: 'auto'
                        }}
                      >
                        {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji)}
                            style={{
                              background: 'none',
                              border: '1px solid transparent',
                              borderRadius: '6px',
                              padding: '4px',
                              fontSize: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.1s, background-color 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(244, 237, 221, 0.1)';
                              e.currentTarget.style.transform = 'scale(1.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title={`Inserir ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend(inputText);
                    }}
                    className="portal-composer"
                  >
                    <button
                      type="button"
                      className={`portal-seal-btn ${isSealedDispatch ? 'is-active' : ''}`}
                      onClick={() => setIsSealedDispatch(v => !v)}
                      title={isSealedDispatch ? 'Modo Despacho Selado ATIVO (com cera)' : 'Ativar Modo Despacho Selado'}
                    >
                      <span>📜 Selo</span>
                    </button>

                    {/* Botão de Emojis */}
                    <button
                      type="button"
                      className="portal-emoji-trigger-btn"
                      onClick={() => setIsEmojiPickerOpen(v => !v)}
                      style={{
                        background: isEmojiPickerOpen ? '#d97706' : 'rgba(244, 237, 221, 0.08)',
                        border: '1px solid rgba(244, 237, 221, 0.2)',
                        borderRadius: '6px',
                        color: isEmojiPickerOpen ? '#000000' : '#F4EDDD',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                      title="Escolher e inserir emojis na mensagem"
                    >
                      <Smile size={18} />
                    </button>

                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isSealedDispatch ? 'Despacho selado: escreva sua mensagem oficial...' : 'Escreva uma mensagem ou role dados (ex: /d20, /r 2d6+3)...'}
                      disabled={isSending}
                      className="portal-composer__input"
                    />

                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className="portal-composer__send-btn"
                      aria-label="Enviar mensagem"
                    >
                      <Send size={16} />
                      <span>Enviar</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="portal-no-channel">
                <Shield size={48} style={{ color: 'var(--text-parchment, #F2ECE1)', opacity: 0.5 }} />
                <h3>Selecione um Salão ou Companheiro</h3>
                <p>Escolha um companheiro na barra lateral ou adicione aventureiros pela tag de 7 caracteres para começar.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADICIONAR AVENTUREIRO POR TAG DE 7 CARACTERES           */}
      {/* ============================================================== */}
      {isAddTagModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddTagModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#161412',
              color: '#F4EDDD',
              borderRadius: '16px',
              border: '1px solid rgba(244, 237, 221, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid rgba(244, 237, 221, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#110F0D'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#F4EDDD' }}>
                  Adicionar Aventureiro por Tag
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTagModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a89a85',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#a89a85', marginTop: 0, marginBottom: '16px', lineHeight: 1.5 }}>
                Digite a <strong>tag única de 7 caracteres</strong> (composta por letras e números em maiúsculas) do aventureiro que deseja adicionar aos seus companheiros.
              </p>

              {addTagError && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{addTagError}</span>
                </div>
              )}

              {addTagSuccess && (
                <div
                  style={{
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    color: '#6ee7b7',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Check size={16} />
                  <span>{addTagSuccess}</span>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tag de 7 Caracteres
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#f59e0b',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '16px'
                    }}
                  >
                    #
                  </span>
                  <input
                    type="text"
                    value={addTagInput}
                    onChange={(e) => {
                      const val = normalizeUserTag(e.target.value);
                      if (val.length <= 7) {
                        setAddTagInput(val);
                      }
                    }}
                    placeholder="Ex: K7M9P2X"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 30px',
                      backgroundColor: '#0B0B0B',
                      border: '1px solid rgba(244, 237, 221, 0.25)',
                      borderRadius: '8px',
                      color: '#FCD34D',
                      fontSize: '16px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    Apenas letras e números maiúsculos
                  </span>
                  <span style={{ fontSize: '11px', color: addTagInput.length === 7 ? '#34d399' : '#a89a85', fontWeight: 700 }}>
                    {addTagInput.length}/7
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0E0D0B',
                  border: '1px solid rgba(244, 237, 221, 0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '20px',
                  fontSize: '11px',
                  color: '#a89a85'
                }}
              >
                Sua própria tag de aventureiro é: <strong style={{ color: '#FCD34D', fontFamily: 'monospace' }}>#{myTagDisplay}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddTagModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(244, 237, 221, 0.2)',
                    color: '#F4EDDD',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={addTagInput.length !== 7}
                  style={{
                    backgroundColor: addTagInput.length === 7 ? '#d97706' : 'rgba(217, 119, 6, 0.3)',
                    color: addTagInput.length === 7 ? '#000000' : '#888888',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: addTagInput.length === 7 ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <UserPlus size={14} />
                  <span>Adicionar Aventureiro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CRIAR NOVA SALA / GRUPO DE BATE-PAPO                   */}
      {/* ============================================================== */}
      {isCreateRoomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateRoomModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#161412',
              color: '#F4EDDD',
              borderRadius: '16px',
              border: '1px solid rgba(244, 237, 221, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh'
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid rgba(244, 237, 221, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#110F0D'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: '#d97706' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#F4EDDD' }}>
                  Criar Nova Sala de Conversa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRoomModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a89a85',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Nome da Sala *
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Ex: Conselho da Aliança, Guarda Noturna..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0B0B0B',
                    border: '1px solid rgba(244, 237, 221, 0.2)',
                    borderRadius: '6px',
                    color: '#FAF7F2',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Ícone / Brasão da Sala
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ROOM_ICON_PRESETS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewRoomEmoji(ic)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: newRoomEmoji === ic ? 'rgba(217, 119, 6, 0.3)' : '#0B0B0B',
                        border: newRoomEmoji === ic ? '2px solid #d97706' : '1px solid rgba(244, 237, 221, 0.15)',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Descrição / Objetivo (Opcional)
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Descreva o propósito da sala ou as regras do grupo..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0B0B',
                    border: '1px solid rgba(244, 237, 221, 0.2)',
                    borderRadius: '6px',
                    color: '#FAF7F2',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Convidar Companheiros Iniciais
                </label>

                {channelsData.direct.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#6b7280', padding: '8px', background: '#0B0B0B', borderRadius: '6px', border: '1px solid rgba(244, 237, 221, 0.1)' }}>
                    Você ainda não adicionou nenhum companheiro por tag. Crie a sala agora e convide amigos depois!
                  </div>
                ) : (
                  <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {channelsData.direct.map(ch => {
                      const u = ch.directOtherUser;
                      if (!u) return null;
                      const isSelected = newRoomMembers.includes(u.uid);

                      return (
                        <div
                          key={u.uid}
                          onClick={() => {
                            setNewRoomMembers(prev =>
                              prev.includes(u.uid) ? prev.filter(id => id !== u.uid) : [...prev, u.uid]
                            );
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.15)' : '#0B0B0B',
                            border: isSelected ? '1px solid #d97706' : '1px solid rgba(244, 237, 221, 0.12)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                backgroundColor: u.customBadgeColor || '#d97706',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              {u.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF7F2' }}>
                                {u.displayName}
                              </div>
                              <div style={{ fontSize: '10px', color: '#FCD34D', fontFamily: 'monospace' }}>
                                #{u.userTag || u.tag}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: isSelected ? 'none' : '1px solid rgba(244, 237, 221, 0.3)',
                              backgroundColor: isSelected ? '#d97706' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000000'
                            }}
                          >
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateRoomModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(244, 237, 221, 0.2)',
                    color: '#F4EDDD',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  style={{
                    backgroundColor: newRoomName.trim() ? '#d97706' : 'rgba(217, 119, 6, 0.3)',
                    color: newRoomName.trim() ? '#000000' : '#888888',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: newRoomName.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Criar Sala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: GERENCIAR SALA (ADMINISTRAÇÃO, EXPULSÃO, EDIÇÃO)        */}
      {/* ============================================================== */}
      {isManageRoomModalOpen && activeCustomRoom && currentUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsManageRoomModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#161412',
              color: '#F4EDDD',
              borderRadius: '16px',
              border: '1px solid rgba(244, 237, 221, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh'
            }}
          >
            {/* Header do Gerenciador da Sala */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(244, 237, 221, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#110F0D'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{activeCustomRoom.iconEmoji || '🛡️'}</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#F4EDDD' }}>
                    {activeCustomRoom.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#a89a85' }}>
                    {activeCustomRoom.memberUids.length} aventureiros • {isCurrentUserCreator ? '👑 Você é o Criador' : (isCurrentUserAdmin ? '🛡️ Você é Administrador' : 'Membro')}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsManageRoomModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a89a85',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas Internas do Modal de Gerenciamento */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#0E0D0B',
                borderBottom: '1px solid rgba(244, 237, 221, 0.1)',
                padding: '4px 8px'
              }}
            >
              <button
                type="button"
                onClick={() => setManageRoomTab('members')}
                style={{
                  flex: 1,
                  background: manageRoomTab === 'members' ? 'rgba(217, 119, 6, 0.2)' : 'none',
                  border: 'none',
                  color: manageRoomTab === 'members' ? '#FCD34D' : '#a89a85',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Membros & Cargos ({activeCustomRoom.memberUids.length})
              </button>

              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={() => setManageRoomTab('invite')}
                  style={{
                    flex: 1,
                    background: manageRoomTab === 'invite' ? 'rgba(217, 119, 6, 0.2)' : 'none',
                    border: 'none',
                    color: manageRoomTab === 'invite' ? '#FCD34D' : '#a89a85',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Convidar Contatos
                </button>
              )}

              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={() => setManageRoomTab('edit')}
                  style={{
                    flex: 1,
                    background: manageRoomTab === 'edit' ? 'rgba(217, 119, 6, 0.2)' : 'none',
                    border: 'none',
                    color: manageRoomTab === 'edit' ? '#FCD34D' : '#a89a85',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Editar Informações
                </button>
              )}
            </div>

            {/* Conteúdo da Aba */}
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              
              {/* ABA DE MEMBROS, DISTRIBUIÇÃO DE ADMINISTRAÇÃO E EXPULSÃO */}
              {manageRoomTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeCustomRoom.memberUids.map(uid => {
                    const memberUser = allUsers.find(u => u.uid === uid);
                    const isCreator = uid === activeCustomRoom.creatorUid;
                    const isAdmin = activeCustomRoom.adminUids.includes(uid);
                    const isSelf = uid === currentUser.uid;

                    return (
                      <div
                        key={uid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: '#0B0B0B',
                          border: '1px solid rgba(244, 237, 221, 0.12)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: memberUser?.customBadgeColor || '#d97706',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 700
                            }}
                          >
                            {memberUser ? memberUser.displayName.charAt(0).toUpperCase() : '?'}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FAF7F2' }}>
                                {memberUser ? memberUser.displayName : 'Aventureiro'}
                              </span>

                              {isSelf && (
                                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                                  (Você)
                                </span>
                              )}

                              {isCreator ? (
                                <span
                                  style={{
                                    backgroundColor: 'rgba(217, 119, 6, 0.25)',
                                    color: '#FCD34D',
                                    border: '1px solid rgba(217, 119, 6, 0.5)',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <Crown size={10} /> Criador
                                </span>
                              ) : isAdmin ? (
                                <span
                                  style={{
                                    backgroundColor: 'rgba(124, 58, 237, 0.2)',
                                    color: '#c084fc',
                                    border: '1px solid rgba(124, 58, 237, 0.4)',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <Shield size={10} /> Administrador
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                  Membro
                                </span>
                              )}
                            </div>

                            {memberUser && (
                              <div style={{ fontSize: '10px', color: '#a89a85', fontFamily: 'monospace' }}>
                                #{memberUser.userTag || memberUser.tag}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ações de Distribuição de Administração e Expulsão */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          
                          {/* Botão de Promover / Rebaixar Administração */}
                          {isCurrentUserCreator && !isCreator && (
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(uid)}
                              style={{
                                backgroundColor: isAdmin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 58, 237, 0.2)',
                                border: isAdmin ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(124, 58, 237, 0.4)',
                                color: isAdmin ? '#fca5a5' : '#c084fc',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title={isAdmin ? 'Remover cargo de administrador' : 'Promover a administrador desta sala'}
                            >
                              {isAdmin ? 'Rebaixar' : 'Promover a Admin'}
                            </button>
                          )}

                          {isCurrentUserAdmin && !isCurrentUserCreator && !isCreator && !isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(uid)}
                              style={{
                                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                                border: '1px solid rgba(124, 58, 237, 0.4)',
                                color: '#c084fc',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Promover membro a administrador"
                            >
                              Promover a Admin
                            </button>
                          )}

                          {/* Botão de Expulsão */}
                          {isCurrentUserAdmin && !isCreator && !isSelf && (isCurrentUserCreator || !isAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleExpelMember(uid, memberUser?.displayName || 'este membro')}
                              style={{
                                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                                border: '1px solid rgba(220, 38, 38, 0.4)',
                                color: '#f87171',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Expulsar este membro da sala"
                            >
                              <UserMinus size={12} />
                              <span>Expulsar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(244, 237, 221, 0.1)', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleLeaveOrDeleteRoom}
                      style={{
                        backgroundColor: isCurrentUserCreator ? '#dc2626' : '#222222',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isCurrentUserCreator ? <Trash2 size={13} /> : <LogOut size={13} />}
                      <span>{isCurrentUserCreator ? 'Excluir Sala de Bate-Papo' : 'Sair da Sala'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ABA DE CONVIDAR CONTATOS ADICIONADOS */}
              {manageRoomTab === 'invite' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#a89a85', marginTop: 0 }}>
                    Selecione um companheiro da sua lista de adicionados para colocá-lo na sala:
                  </p>

                  {addedContactsForInvite.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280', fontSize: '13px' }}>
                      Todos os seus companheiros adicionados já estão nesta sala de bate-papo!
                    </div>
                  ) : (
                    addedContactsForInvite.map(u => (
                      <div
                        key={u.uid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: '#0B0B0B',
                          border: '1px solid rgba(244, 237, 221, 0.12)',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: u.customBadgeColor || '#d97706',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 700
                            }}
                          >
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FAF7F2' }}>
                              {u.displayName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#FCD34D', fontFamily: 'monospace' }}>
                              #{u.userTag || u.tag}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddMemberToRoom(u.uid)}
                          style={{
                            backgroundColor: '#d97706',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Plus size={12} />
                          <span>Adicionar à Sala</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ABA DE EDIÇÃO DA SALA (APENAS ADMINISTRADORES) */}
              {manageRoomTab === 'edit' && (
                <form onSubmit={handleSaveRoomEdits}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Nome da Sala
                    </label>
                    <input
                      type="text"
                      value={editRoomName}
                      onChange={(e) => setEditRoomName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#0B0B0B',
                        border: '1px solid rgba(244, 237, 221, 0.2)',
                        borderRadius: '6px',
                        color: '#FAF7F2',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Ícone / Emoji da Sala
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {ROOM_ICON_PRESETS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setEditRoomEmoji(ic)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            backgroundColor: editRoomEmoji === ic ? 'rgba(217, 119, 6, 0.3)' : '#0B0B0B',
                            border: editRoomEmoji === ic ? '2px solid #d97706' : '1px solid rgba(244, 237, 221, 0.15)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#a89a85', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Descrição / Regras
                    </label>
                    <textarea
                      value={editRoomDescription}
                      onChange={(e) => setEditRoomDescription(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#0B0B0B',
                        border: '1px solid rgba(244, 237, 221, 0.2)',
                        borderRadius: '6px',
                        color: '#FAF7F2',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#d97706',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
