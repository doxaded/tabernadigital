import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, MoreVertical, Plus, Dices, Send, Star, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { Campaign, ChatChannel, ChatMessage, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { storageService } from '../services/storage';
import { tavernAudio } from '../services/tavernAudio';

interface BardosMessengerPartitionProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  allUsers: UserProfile[];
  initialChannelId?: string | null;
  onOpenProfile?: (user: UserProfile) => void;
}

type SidebarFilter = 'all' | 'unread' | 'favorites' | 'groups';

const GENERAL_CHANNEL_ID = 'room_geral';
const serif = "'Cormorant Garamond', 'Playfair Display', serif";

const readKey = (uid: string) => `taberna_bardos_last_read_${uid}`;

const loadReadMap = (uid: string): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(readKey(uid)) || '{}');
  } catch {
    return {};
  }
};

const formatListTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const Avatar: React.FC<{ name: string; url?: string; color?: string; size?: number }> = ({ name, url, color, size = 46 }) => (
  <div
    className="bardos-avatar"
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      backgroundImage: url ? `url(${url})` : undefined,
      background: url ? undefined : color || '#3a2415',
    }}
    aria-hidden="true"
  >
    {!url && (name.replace(/[^\p{L}\p{N}]/gu, '').charAt(0) || '?').toUpperCase()}
  </div>
);

export const BardosMessengerPartition: React.FC<BardosMessengerPartitionProps> = ({
  currentUser,
  campaigns,
  allUsers,
  initialChannelId,
  onOpenProfile,
}) => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialChannelId || null);
  const [mobileChatOpen, setMobileChatOpen] = useState(!!initialChannelId);
  const [filter, setFilter] = useState<SidebarFilter>('all');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const uid = currentUser?.uid;

  const rebuild = useCallback(() => {
    if (!currentUser) return;
    const built = chatService.buildChannels(currentUser, campaigns, allUsers);
    const stored = storageService.getChatMessages();
    const generalMsgs = stored.filter((m) => m.channelId === GENERAL_CHANNEL_ID);
    const lastGeneral = generalMsgs[generalMsgs.length - 1];
    const general: ChatChannel = {
      id: GENERAL_CHANNEL_ID,
      type: 'group',
      title: 'Salão Geral',
      subtitle: 'Todos os viajantes da estalagem',
      participants: [],
      lastMessage: lastGeneral
        ? lastGeneral.diceResult
          ? `🎲 ${lastGeneral.senderName} rolou ${lastGeneral.diceResult.expression}`
          : `${lastGeneral.senderName}: ${lastGeneral.text}`
        : 'O silêncio reina sob as vigas...',
      lastMessageAt: lastGeneral?.createdAt,
      badgeColor: '#D4A359',
    };
    // Mensagens sem histórico não aparecem como "ordenadas": ficam depois
    setChannels([general, ...built.allChannels]);
    setTick((t) => t + 1);
  }, [currentUser, campaigns, allUsers]);

  useEffect(() => {
    rebuild();
    window.addEventListener('taberna-contacts-updated', rebuild);
    window.addEventListener('taberna-chat-updated', rebuild);
    return () => {
      window.removeEventListener('taberna-contacts-updated', rebuild);
      window.removeEventListener('taberna-chat-updated', rebuild);
    };
  }, [rebuild]);

  useEffect(() => {
    if (uid) setReadMap(loadReadMap(uid));
  }, [uid]);

  // Ordenação: favoritos fixados no topo, depois por atividade recente
  const sorted = useMemo(() => {
    const time = (c: ChatChannel) => (c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0);
    return [...channels].sort((a, b) => {
      if (!!a.isFavorite !== !!b.isFavorite) return a.isFavorite ? -1 : 1;
      return time(b) - time(a);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, tick]);

  const unreadFor = useCallback(
    (c: ChatChannel): number => {
      if (!uid) return 0;
      const lastRead = readMap[c.id];
      return storageService
        .getChatMessages(c.id)
        .filter((m) => m.senderUid !== uid && (!lastRead || new Date(m.createdAt) > new Date(lastRead))).length;
    },
    [uid, readMap]
  );

  // Seleciona automaticamente a conversa mais recente (ou a pedida)
  useEffect(() => {
    if (activeId && channels.some((c) => c.id === activeId)) return;
    if (initialChannelId && channels.some((c) => c.id === initialChannelId)) {
      setActiveId(initialChannelId);
      return;
    }
    if (channels.length) setActiveId(sorted[0]?.id ?? channels[0].id);
  }, [channels, sorted, activeId, initialChannelId]);

  const activeChannel = channels.find((c) => c.id === activeId) || null;

  // Assina mensagens do canal ativo
  useEffect(() => {
    if (!activeId) return;
    const unsub = chatService.subscribeChannel(activeId, setMessages);
    return () => unsub();
  }, [activeId]);

  // Marca como lida
  useEffect(() => {
    if (!uid || !activeId || messages.length === 0) return;
    const last = messages[messages.length - 1].createdAt;
    setReadMap((prev) => {
      if (prev[activeId] && new Date(prev[activeId]) >= new Date(last)) return prev;
      const next = { ...prev, [activeId]: last };
      localStorage.setItem(readKey(uid), JSON.stringify(next));
      return next;
    });
  }, [messages, uid, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  const filtered = sorted.filter((c) => {
    if (search.trim() && !c.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (filter === 'favorites') return !!c.isFavorite;
    if (filter === 'groups') return c.type !== 'direct';
    if (filter === 'unread') return unreadFor(c) > 0;
    return true;
  });

  const send = async (text: string) => {
    if (!currentUser || !activeChannel) return;
    const recipient = activeChannel.directOtherUser;
    await chatService.sendMessage({
      channelId: activeChannel.id,
      scope: activeChannel.type,
      text,
      currentUser,
      campaignId: activeChannel.campaignId || campaigns[0]?.id,
      campaignName: activeChannel.campaignName || campaigns[0]?.name,
      recipientUid: recipient?.uid,
      recipientName: recipient?.displayName,
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    tavernAudio.playBellChime();
    await send(text);
  };

  const handleDice = async () => {
    tavernAudio.playDiceRoll();
    await send('/d20');
  };

  if (!currentUser) {
    return (
      <div className="editorial-frosted-card room-matte-IV">
        <p style={{ fontStyle: 'italic', margin: 0 }}>Entre na taverna para conversar no Recanto dos Bardos.</p>
      </div>
    );
  }

  const shownMessages = chatSearch.trim()
    ? messages.filter((m) => m.text.toLowerCase().includes(chatSearch.trim().toLowerCase()))
    : messages;

  const lastOtherAt = messages.filter((m) => m.senderUid !== uid).slice(-1)[0]?.createdAt;

  const filters: { id: SidebarFilter; label: string }[] = [
    { id: 'all', label: 'Tudo' },
    { id: 'unread', label: 'Não lidas' },
    { id: 'favorites', label: 'Favoritas' },
    { id: 'groups', label: 'Mesas/Grupos' },
  ];

  let lastDay = '';

  return (
    <div className={`bardos-messenger ${mobileChatOpen ? 'is-chat-open' : ''}`} role="region" aria-label="Mensageiro do Recanto dos Bardos">
      {/* ===== Coluna esquerda: conversas ===== */}
      <aside className="bardos-sidebar">
        <div className="bardos-sidebar__top">
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              id="bardos-sidebar-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar ou começar uma nova conversa"
              className="bardos-input"
              style={{ width: '100%', paddingLeft: 38, borderRadius: 999, boxSizing: 'border-box' }}
            />
          </div>
          <div className="bardos-pills">
            {filters.map((f) => (
              <button key={f.id} className={`bardos-pill ${filter === f.id ? 'is-active' : ''}`} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bardos-sidebar__list">
          {filtered.length === 0 && (
            <div style={{ padding: '28px 20px', fontStyle: 'italic', opacity: 0.6, fontSize: 14 }}>
              Nenhuma conversa encontrada. Adicione aliados na partição “Jogadores & Contatos”.
            </div>
          )}
          {filtered.map((c) => {
            const unread = c.id === activeId ? 0 : unreadFor(c);
            return (
              <button
                key={c.id}
                className={`bardos-chat-item ${c.id === activeId ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveId(c.id);
                  setMobileChatOpen(true);
                  setChatSearchOpen(false);
                  setChatSearch('');
                }}
              >
                <Avatar name={c.title} url={c.directOtherUser?.photoURL} color={c.badgeColor} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                    <span className="bardos-chat-item__name">{c.title}</span>
                    <span style={{ fontSize: 11, opacity: unread ? 1 : 0.5, color: unread ? '#D4A359' : undefined, flexShrink: 0 }}>
                      {formatListTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <span className="bardos-chat-item__preview">{c.lastMessage}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {c.isFavorite && <Star size={12} fill="#D4A359" color="#D4A359" />}
                      {unread > 0 && <span className="bardos-badge">{unread > 99 ? '99+' : unread}</span>}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ===== Coluna direita: conversa ativa ===== */}
      <section className="bardos-main">
        {activeChannel ? (
          <>
            <header className="bardos-main__header">
              <button className="bardos-icon-btn bardos-mobile-back" onClick={() => setMobileChatOpen(false)} aria-label="Voltar às conversas">
                <ArrowLeft size={18} />
              </button>
              <Avatar name={activeChannel.title} url={activeChannel.directOtherUser?.photoURL} color={activeChannel.badgeColor} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeChannel.title}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeChannel.type === 'direct'
                    ? navigator.onLine
                      ? `Online • ${activeChannel.directOtherUser?.title || 'Viajante'}`
                      : `Visto por último ${formatListTime(lastOtherAt) || 'há algum tempo'}`
                    : activeChannel.subtitle}
                </div>
              </div>
              <button className="bardos-icon-btn" title="Buscar na conversa" onClick={() => setChatSearchOpen((o) => !o)}>
                <Search size={17} />
              </button>
              <div style={{ position: 'relative' }}>
                <button className="bardos-icon-btn" title="Mais opções" onClick={() => setMenuOpen((o) => !o)}>
                  <MoreVertical size={17} />
                </button>
                {menuOpen && (
                  <div className="bardos-menu" onMouseLeave={() => setMenuOpen(false)}>
                    {activeChannel.directOtherUser && (
                      <button
                        onClick={() => {
                          onOpenProfile?.(activeChannel.directOtherUser!);
                          setMenuOpen(false);
                        }}
                      >
                        Ver perfil do aventureiro
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setChatSearchOpen(true);
                        setMenuOpen(false);
                      }}
                    >
                      Buscar mensagens
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDice();
                      }}
                    >
                      Rolar d20 na conversa
                    </button>
                  </div>
                )}
              </div>
            </header>

            {chatSearchOpen && (
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(212,163,89,0.15)' }}>
                <input
                  autoFocus
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Buscar nesta conversa..."
                  className="bardos-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 14px' }}
                />
              </div>
            )}

            <div className="bardos-main__messages">
              {shownMessages.length === 0 && (
                <div style={{ margin: 'auto', fontStyle: 'italic', opacity: 0.6, textAlign: 'center', padding: 24 }}>
                  {chatSearch ? 'Nenhuma mensagem encontrada.' : 'Nenhuma palavra trocada ainda. Quebre o gelo com um brinde!'}
                </div>
              )}
              {shownMessages.map((m) => {
                const isMe = m.senderUid === uid;
                const label = dayLabel(m.createdAt);
                const showDay = label !== lastDay;
                lastDay = label;
                const seen = isMe && !!lastOtherAt && new Date(lastOtherAt) > new Date(m.createdAt);
                return (
                  <React.Fragment key={m.id}>
                    {showDay && <div className="bardos-day-sep"><span>{label}</span></div>}
                    <div className={`bardos-bubble ${isMe ? 'is-me' : 'is-them'}`}>
                      {!isMe && activeChannel.type !== 'direct' && (
                        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: m.senderBadgeColor || '#D4A359', fontWeight: 700, marginBottom: 3 }}>
                          {m.senderName}
                        </div>
                      )}
                      <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>{m.text.replace(/\*\*/g, '')}</div>
                      <div className="bardos-bubble__meta">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (seen ? <CheckCheck size={14} color="#D4A359" /> : <Check size={14} />)}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={endRef} />
            </div>

            <form className="bardos-composer" onSubmit={handleSend}>
              <button type="button" className="bardos-icon-btn" title="Ações rápidas" onClick={() => setInputText((t) => (t ? t : '/'))}>
                <Plus size={20} />
              </button>
              <button type="button" className="bardos-icon-btn" title="Rolar /d20" onClick={handleDice}>
                <Dices size={19} />
              </button>
              <input
                id="bardos-message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="bardos-input"
                style={{ flex: 1, borderRadius: 999 }}
              />
              <button type="submit" className="bardos-send" disabled={!inputText.trim()} title="Enviar" style={{ opacity: inputText.trim() ? 1 : 0.5 }}>
                <Send size={17} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ margin: 'auto', fontStyle: 'italic', opacity: 0.6 }}>Selecione uma conversa.</div>
        )}
      </section>
    </div>
  );
};
