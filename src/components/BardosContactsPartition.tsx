import React, { useEffect, useMemo, useState } from 'react';
import { Star, Feather, MessageCircle, Trash2, UserPlus, Check, X } from 'lucide-react';
import { UserContact, UserProfile } from '../types';
import { storageService } from '../services/storage';
import { tavernAudio } from '../services/tavernAudio';

interface BardosContactsPartitionProps {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  onStartChat: (otherUid: string) => void;
  onOpenProfile?: (user: UserProfile) => void;
}

type ContactFilter = 'all' | 'favorites' | 'recent';

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const serif = "'Cormorant Garamond', 'Cinzel', serif";

export const BardosContactsPartition: React.FC<BardosContactsPartitionProps> = ({
  currentUser,
  allUsers,
  onStartChat,
  onOpenProfile,
}) => {
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<ContactFilter>('all');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const uid = currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const load = () => setContacts(storageService.getUserContacts(uid));
    load();
    window.addEventListener('taberna-contacts-updated', load);
    return () => window.removeEventListener('taberna-contacts-updated', load);
  }, [uid]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const resolveUser = (contactUid: string): UserProfile | undefined =>
    allUsers.find((u) => u.uid === contactUid) || storageService.getUsers().find((u) => u.uid === contactUid);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    const raw = query.trim();
    if (!raw) return;

    // Aceita tag (#K7M9P2X) ou nome de usuário
    let tag = raw.replace(/^#/, '');
    const looksLikeTag = /^[A-Za-z0-9]{7}$/.test(tag);
    if (!raw.startsWith('#') && !looksLikeTag) {
      const pool = [...allUsers, ...storageService.getUsers()];
      const needle = raw.toLowerCase();
      const matches = pool.filter(
        (u, i, arr) =>
          arr.findIndex((x) => x.uid === u.uid) === i &&
          u.uid !== uid &&
          (u.displayName || '').toLowerCase().includes(needle)
      );
      const exact = matches.find((u) => (u.displayName || '').toLowerCase() === needle);
      const chosen = exact || (matches.length === 1 ? matches[0] : undefined);
      if (!chosen) {
        setFeedback({
          type: 'error',
          text: matches.length > 1
            ? 'Mais de um aventureiro corresponde a esse nome. Use a tag de 7 caracteres (ex: #K7M9P2X).'
            : `Nenhum aventureiro encontrado para "${raw}".`,
        });
        return;
      }
      tag = chosen.userTag || chosen.tag || '';
    }

    const res = storageService.addUserContactByTag(uid, tag);
    if (res.success) {
      tavernAudio.playBellChime();
      setFeedback({ type: 'ok', text: `${res.user?.displayName || 'Aventureiro'} foi adicionado à sua aliança.` });
      setQuery('');
    } else {
      setFeedback({ type: 'error', text: res.error || 'Não foi possível adicionar o contato.' });
    }
  };

  const visible = useMemo(() => {
    const now = Date.now();
    let list = [...contacts];
    if (filter === 'favorites') list = list.filter((c) => c.isFavorite);
    if (filter === 'recent') list = list.filter((c) => now - new Date(c.addedAt).getTime() <= RECENT_WINDOW_MS);
    return list.sort((a, b) => {
      if (!!a.isFavorite !== !!b.isFavorite) return a.isFavorite ? -1 : 1;
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }, [contacts, filter]);

  const favoritesCount = contacts.filter((c) => c.isFavorite).length;

  const commitNickname = (targetUid: string) => {
    if (!uid) return;
    storageService.setContactNickname(uid, targetUid, nicknameDraft);
    setEditingUid(null);
  };

  if (!currentUser) {
    return (
      <div className="editorial-frosted-card room-matte-IV">
        <p style={{ fontStyle: 'italic', margin: 0 }}>Entre na taverna para montar o seu Grimório de Alianças.</p>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    letterSpacing: '0.25em',
    fontSize: '11px',
    textTransform: 'uppercase',
    opacity: 0.65,
    marginBottom: '12px',
    color: '#D4A359',
  };

  return (
    <section style={{ width: '100%', animation: 'fadeIn 0.4s ease' }}>
      <div className="editorial-grid-12" style={{ alignItems: 'stretch' }}>
        {/* Bloco Superior Esquerdo — Adicionar Jogadores */}
        <div className="editorial-frosted-card room-matte-IV">
          <div style={labelStyle}>SALA IV • PARTIÇÃO II</div>
          <h1
            style={{
              fontFamily: serif,
              fontSize: 'clamp(32px, 4.5vw, 44px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              color: '#EAE0D5',
            }}
          >
            Grimório de Alianças
          </h1>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '17px', lineHeight: 1.7, maxWidth: '560px', margin: '0 0 24px 0', opacity: 0.85 }}>
            Registre companheiros de jornada pelo nome de usuário ou pela tag única, favorite os mais fiéis e dê a cada um um apelido digno de balada.
          </p>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              id="bardos-add-contact-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (feedback) setFeedback(null);
              }}
              placeholder="Nome de usuário ou tag (ex: #K7M9P2X)"
              className="bardos-input"
              style={{ flex: '1 1 240px' }}
            />
            <button type="submit" id="bardos-add-contact-btn" className="editorial-btn-primary" disabled={!query.trim()} style={{ opacity: query.trim() ? 1 : 0.55 }}>
              <UserPlus size={15} />
              Adicionar Contato
            </button>
          </form>

          {feedback && (
            <div
              role="status"
              style={{
                marginTop: '14px',
                fontSize: '14px',
                fontStyle: 'italic',
                color: feedback.type === 'ok' ? '#9BC995' : '#E58C7B',
              }}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Bloco Superior Direito — Resumo de Contatos */}
        <aside className="editorial-frosted-card room-matte-IV">
          <div style={{ ...labelStyle, opacity: 0.6, marginBottom: '14px', fontWeight: 600 }}>Registro da Aliança</div>
          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Total de Aliados</span>
            <span className="editorial-meta-value">{contacts.length}</span>
          </div>
          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Favoritos</span>
            <span className="editorial-meta-value">{favoritesCount}</span>
          </div>
          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Solicitações Pendentes</span>
            <span className="editorial-meta-value">0</span>
          </div>
          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Status da Rede</span>
            <span className="editorial-meta-value" style={{ color: online ? '#9BC995' : '#E58C7B' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
          <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.7, lineHeight: 1.6, margin: '16px 0 0 0' }}>
            A sua tag: <strong style={{ fontStyle: 'normal', color: '#D4A359' }}>#{currentUser.userTag || currentUser.tag || '—'}</strong>
          </p>
        </aside>
      </div>

      {/* Bloco Inferior — Lista de Jogadores Adicionados */}
      <div className="editorial-frosted-card room-matte-IV" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div style={{ ...labelStyle, margin: 0 }}>Jogadores Adicionados</div>
          <div className="editorial-segmented-control dark-theme">
            {([
              { id: 'all', label: 'Todos' },
              { id: 'favorites', label: 'Favoritos' },
              { id: 'recent', label: 'Recentes' },
            ] as { id: ContactFilter; label: string }[]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`editorial-segmented-item ${filter === f.id ? 'is-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p style={{ fontStyle: 'italic', opacity: 0.65, margin: '8px 0' }}>
            {contacts.length === 0
              ? 'Nenhum aliado registrado ainda. Adicione um aventureiro pela tag acima.'
              : 'Nenhum aliado neste filtro.'}
          </p>
        ) : (
          <div className="editorial-cards-grid-2">
            {visible.map((c) => {
              const user = resolveUser(c.uid);
              const realName = user?.displayName || 'Aventureiro';
              const shown = c.nickname || realName;
              const isEditing = editingUid === c.uid;
              return (
                <div key={c.uid} className="bardos-contact-card" style={c.isFavorite ? { borderColor: 'rgba(212,163,89,0.5)' } : undefined}>
                  <button
                    type="button"
                    className="bardos-avatar"
                    onClick={() => user && onOpenProfile?.(user)}
                    title="Ver perfil"
                    style={{ backgroundImage: user?.photoURL ? `url(${user.photoURL})` : undefined }}
                  >
                    {!user?.photoURL && shown.charAt(0).toUpperCase()}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          commitNickname(c.uid);
                        }}
                        style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                      >
                        <input
                          autoFocus
                          value={nicknameDraft}
                          onChange={(e) => setNicknameDraft(e.target.value)}
                          placeholder={realName}
                          maxLength={32}
                          className="bardos-input"
                          style={{ padding: '6px 10px', fontSize: '14px', minWidth: 0, flex: 1 }}
                        />
                        <button type="submit" className="bardos-icon-btn" title="Salvar apelido"><Check size={15} /></button>
                        <button type="button" className="bardos-icon-btn" title="Cancelar" onClick={() => setEditingUid(null)}><X size={15} /></button>
                      </form>
                    ) : (
                      <>
                        <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shown}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.6, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.nickname ? `${realName} • ` : ''}#{c.userTag}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    <button
                      className="bardos-icon-btn"
                      title={c.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                      aria-pressed={!!c.isFavorite}
                      onClick={() => uid && storageService.toggleFavoriteContact(uid, c.uid)}
                      style={{ color: c.isFavorite ? '#D4A359' : undefined }}
                    >
                      <Star size={16} fill={c.isFavorite ? '#D4A359' : 'none'} />
                    </button>
                    <button
                      className="bardos-icon-btn"
                      title="Apelidar"
                      onClick={() => {
                        setEditingUid(c.uid);
                        setNicknameDraft(c.nickname || '');
                      }}
                    >
                      <Feather size={16} />
                    </button>
                    <button className="bardos-icon-btn" title="Iniciar conversa direta" onClick={() => onStartChat(c.uid)}>
                      <MessageCircle size={16} />
                    </button>
                    <button
                      className="bardos-icon-btn bardos-icon-btn--danger"
                      title="Remover da lista"
                      onClick={() => {
                        if (uid && window.confirm(`Remover ${shown} da sua lista de aliados?`)) {
                          storageService.removeUserContact(uid, c.uid);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
