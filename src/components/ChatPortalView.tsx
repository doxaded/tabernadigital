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
  Info
} from 'lucide-react';
import { Campaign, ChatChannel, ChatMessage, ChatScope, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { storageService, ADMIN_EMAIL } from '../services/storage';

interface ChatPortalViewProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  allUsers: UserProfile[];
  onOpenProfile: (user: UserProfile) => void;
  initialChannelId?: string | null;
}

const QUICK_DICE = [
  { label: 'd4', expr: '1d4' },
  { label: 'd6', expr: '1d6' },
  { label: 'd8', expr: '1d8' },
  { label: 'd10', expr: '1d10' },
  { label: 'd12', expr: '1d12' },
  { label: 'd20', expr: '1d20' },
  { label: 'd100', expr: '1d100' },
];

export const ChatPortalView: React.FC<ChatPortalViewProps> = ({
  currentUser,
  campaigns,
  allUsers,
  onOpenProfile,
  initialChannelId
}) => {
  // Abas da lista de canais: 'campaigns' (Mesas) ou 'direct' (Aventureiros)
  const [channelTab, setChannelTab] = useState<'campaigns' | 'direct'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNewDmModalOpen, setIsNewDmModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Constrói os canais
  const channelsData = currentUser
    ? chatService.buildChannels(currentUser, campaigns, allUsers)
    : { campaignPublic: [], campaignPrivate: [], direct: [], allChannels: [] };

  // Define canal inicial se ainda não selecionado
  useEffect(() => {
    if (!activeChannelId) {
      if (initialChannelId && channelsData.allChannels.some(c => c.id === initialChannelId)) {
        setActiveChannelId(initialChannelId);
      } else if (channelsData.campaignPublic.length > 0) {
        setActiveChannelId(channelsData.campaignPublic[0].id);
      } else if (channelsData.allChannels.length > 0) {
        setActiveChannelId(channelsData.allChannels[0].id);
      }
    }
  }, [channelsData.allChannels.length, initialChannelId]);

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

      await chatService.sendMessage({
        channelId: activeChannel.id,
        scope: activeChannel.type,
        text,
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

  // Rolar dado rápido
  const handleQuickRoll = (expr: string) => {
    handleSend(`/r ${expr}`);
  };

  // Filtragem de canais
  const filterChannels = (list: ChatChannel[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      (c.campaignName && c.campaignName.toLowerCase().includes(q))
    );
  };

  const filteredCampaignPublic = filterChannels(channelsData.campaignPublic);
  const filteredCampaignPrivate = filterChannels(channelsData.campaignPrivate);
  const filteredDirect = filterChannels(channelsData.direct);

  // Usuários para iniciar novo DM (exclui o atual)
  const availableUsersForDm = allUsers.filter(u =>
    currentUser &&
    u.uid !== currentUser.uid &&
    u.email.toLowerCase() !== currentUser.email.toLowerCase()
  );

  return (
    <>
      {/* 1. Hero do Portal de Chats (70% da viewport, fundo preto contínuo, sem legendas) */}
      <header className="salao-hero salao-hero--chat">
        <div className="salao-hero__inner">
          <h1 className="salao-hero__title" aria-label="Portal de Chats">
            <span className="salao-hero__line salao-hero__line--a">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">Portal</span>
              </span>
            </span>
            <span className="salao-hero__line salao-hero__line--b">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">de Chats</span>
              </span>
            </span>
          </h1>
        </div>
      </header>

      {/* 2. Área do Portal de Mensageria da Taverna */}
      <section className="portal-chamber" aria-label="Consola de Mensagens da Taverna">
        <div className="portal-inner">
          {/* Coluna Lateral: Canais & Contatos */}
          <aside className="portal-side">
            {/* Header da Barra Lateral */}
            <div className="portal-side__header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="portal-eyebrow">Mensageria & Conversas</span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(currentUser)}
                    className="portal-my-profile-btn"
                    title="Editar Meu Perfil de Aventureiro"
                  >
                    <User size={13} />
                    <span>Meu Perfil</span>
                  </button>
                )}
              </div>

              {/* Seletor de Abas: Mesas de Campanha vs Sussurros Diretos */}
              <div className="portal-tabs">
                <button
                  type="button"
                  onClick={() => setChannelTab('campaigns')}
                  className={`portal-tab ${channelTab === 'campaigns' ? 'is-active' : ''}`}
                >
                  <Shield size={14} />
                  <span>Mesas ({channelsData.campaignPublic.length + channelsData.campaignPrivate.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelTab('direct')}
                  className={`portal-tab ${channelTab === 'direct' ? 'is-active' : ''}`}
                >
                  <Users size={14} />
                  <span>Aventureiros ({channelsData.direct.length})</span>
                </button>
              </div>

              {/* Barra de Pesquisa de Canais */}
              <div className="portal-search">
                <Search size={14} className="portal-search__icon" />
                <input
                  type="text"
                  placeholder={channelTab === 'campaigns' ? 'Filtrar salas ou campanhas...' : 'Buscar aventureiro...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="portal-search__input"
                />
              </div>
            </div>

            {/* Lista Rolável de Canais */}
            <div className="portal-channels-list">
              {channelTab === 'campaigns' ? (
                <>
                  {/* Seção 1: Salões Públicos da Mesa */}
                  <div className="portal-section-label">
                    <Flame size={12} />
                    <span>Salões Gerais das Mesas</span>
                  </div>

                  {filteredCampaignPublic.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhum salão público encontrado. Entre ou crie uma campanha no Salão Comunal.
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

                  {/* Seção 2: Sussurros Privados da Mesa (Mestre <-> Jogadores) */}
                  <div className="portal-section-label" style={{ marginTop: '16px' }}>
                    <Lock size={12} />
                    <span>Sussurros Secretos da Mesa</span>
                  </div>

                  {filteredCampaignPrivate.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhum canal secreto ativo para suas campanhas no momento.
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
              ) : (
                /* Aba: Sussurros Diretos 1-on-1 */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
                    <div className="portal-section-label" style={{ margin: 0 }}>
                      <Users size={12} />
                      <span>Conversas Privadas</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsNewDmModalOpen(true)}
                      className="portal-new-dm-btn"
                    >
                      <Plus size={13} />
                      <span>Nova Conversa</span>
                    </button>
                  </div>

                  {filteredDirect.length === 0 ? (
                    <div className="portal-empty-notice">
                      Nenhuma conversa direta iniciada. Clique em "+ Nova Conversa" para mandar um sussurro a um companheiro de estalagem.
                    </div>
                  ) : (
                    filteredDirect.map(channel => {
                      const isActive = activeChannelId === channel.id;
                      const otherUser = channel.directOtherUser;

                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => setActiveChannelId(channel.id)}
                          className={`portal-channel-item ${isActive ? 'is-active' : ''}`}
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

          {/* Coluna Principal: Feed do Chat e Console de Mensagens */}
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
                          Salão Público
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
                    </div>

                    <p className="portal-chat-header__sub">
                      {activeChannel.subtitle || 'Canal ativo da Taberna Digital.'}
                    </p>
                  </div>

                  {/* Participantes com avatares clicáveis para inspecionar perfil */}
                  <div className="portal-chat-header__actions">
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
                            title={`Inspecionar perfil de ${user.displayName}`}
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
                      <MessageSquare size={36} style={{ color: 'var(--amber-glow)', opacity: 0.5 }} />
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
                          {/* Avatar do Emissor (clicável para abrir perfil) */}
                          <div
                            onClick={() => senderUser && onOpenProfile(senderUser)}
                            className="portal-msg__avatar"
                            style={{
                              borderColor: msg.senderBadgeColor || '#d97706',
                              cursor: senderUser ? 'pointer' : 'default'
                            }}
                            title={senderUser ? `Ver perfil de ${msg.senderName}` : msg.senderName}
                          >
                            {msg.senderAvatarUrl || senderUser?.photoURL ? (
                              <img src={msg.senderAvatarUrl || senderUser?.photoURL} alt={msg.senderName} />
                            ) : (
                              <span>{msg.senderName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="portal-msg__body">
                            {/* Metadados: Nome, Título Honorífico e Horário */}
                            <div className="portal-msg__meta">
                              <span
                                onClick={() => senderUser && onOpenProfile(senderUser)}
                                className="portal-msg__sender"
                                style={{ cursor: senderUser ? 'pointer' : 'default' }}
                              >
                                {msg.senderName}
                              </span>

                              {msg.senderTitle && (
                                <span
                                  className="portal-msg__title-tag"
                                  style={{ color: msg.senderBadgeColor || '#d97706' }}
                                >
                                  "{msg.senderTitle}"
                                </span>
                              )}

                              <span className="portal-msg__time">{timeStr}</span>
                            </div>

                            {/* Conteúdo da Mensagem */}
                            <div className="portal-msg__bubble">
                              {/* Se for uma rolagem de dados formatada */}
                              {msg.diceResult ? (
                                <div className="portal-dice-card">
                                  <div className="portal-dice-card__header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Dices size={16} style={{ color: 'var(--amber-glow)' }} />
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
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Barra de Rolagem Rápida de Dados da Taverna */}
                <div className="portal-quick-dice">
                  <span className="portal-quick-dice__label">
                    <Dices size={14} /> Dados rápidos:
                  </span>
                  <div className="portal-quick-dice__buttons">
                    {QUICK_DICE.map(d => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => handleQuickRoll(d.expr)}
                        className="portal-quick-dice__btn"
                        title={`Rolar ${d.expr} no chat`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barra de Input / Envio */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(inputText);
                  }}
                  className="portal-composer"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escreva uma mensagem ou role dados (ex: /d20, /r 2d6+3, /r 1d8+4)..."
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
            ) : (
              <div className="portal-no-channel">
                <Shield size={48} style={{ color: 'var(--amber-glow)', opacity: 0.6 }} />
                <h3>Selecione um Salão ou Aventureiro</h3>
                <p>Escolha um canal de campanha ou conversa direta na barra lateral para começar a interagir.</p>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* 3. Modal de Nova Conversa Direta (Caixa Branca com letras pretas conforme regra do usuário) */}
      {isNewDmModalOpen && (
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
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewDmModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              color: '#1a1a1a',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '80vh'
            }}
          >
            {/* Header da Caixa Branca */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f9fafb'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: '#d97706' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#111827' }}>
                  Iniciar Novo Sussurro Direto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDmModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {/* Lista de Aventureiros Registrados */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Selecione um aventureiro presente na Taberna Digital para iniciar uma conversa confidencial:
              </p>

              {availableUsersForDm.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '13px' }}>
                  Nenhum outro aventureiro disponível no momento.
                </div>
              ) : (
                availableUsersForDm.map(u => (
                  <div
                    key={u.uid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: u.customBadgeColor || '#d97706',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: 700,
                          overflow: 'hidden'
                        }}
                      >
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          u.displayName.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                          {u.displayName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {u.title ? `"${u.title}" • ` : ''}{u.favoriteClass || 'Aventureiro'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProfile(u);
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Ver perfil completo"
                      >
                        Perfil
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser) {
                            const dmChannelId = chatService.getDirectChannelId(currentUser.uid, u.uid);
                            setActiveChannelId(dmChannelId);
                            setChannelTab('direct');
                            setIsNewDmModalOpen(false);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#111827',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MessageSquare size={12} />
                        <span>Conversar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
