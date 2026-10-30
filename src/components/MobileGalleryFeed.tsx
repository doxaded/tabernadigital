import React from 'react';
import { Menu, Compass, Plus, MessageCircle, User } from 'lucide-react';

export interface MobileFeedRoom {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
}

interface MobileGalleryFeedProps {
  rooms: MobileFeedRoom[];
  onOpenRoom: (roomId: string) => void;
}

/**
 * Feed mobile (< 768px): um card clicável por sala (I a V), sem avatar/autor.
 * Visível apenas em telas pequenas (ver .mobile-feed em index.css).
 */
export const MobileGalleryFeed: React.FC<MobileGalleryFeedProps> = ({ rooms, onOpenRoom }) => (
  <section className="mobile-feed" aria-label="Salas da Taberna">
    {rooms.map((room) => (
      <button
        key={room.id}
        type="button"
        className="mobile-feed__card"
        onClick={() => onOpenRoom(room.id)}
        aria-label={`Abrir ${room.name}`}
      >
        <span className="mobile-feed__title">{room.subtitle}</span>
        <span className="mobile-feed__media">
          <img src={room.imageUrl} alt={room.name} draggable={false} loading="lazy" />
        </span>
      </button>
    ))}
  </section>
);

interface MobileHudBarProps {
  avatarUrl?: string;
  onMenu: () => void;
  onExplore: () => void;
  onCreate: () => void;
  onChat: () => void;
  onProfile: () => void;
}

/** Barra inferior fixa (HUD) do feed mobile: Menu · Explorar · Criar · Chat · Perfil. */
export const MobileHudBar: React.FC<MobileHudBarProps> = ({
  avatarUrl,
  onMenu,
  onExplore,
  onCreate,
  onChat,
  onProfile,
}) => (
  <nav className="mobile-hud" aria-label="Navegação inferior">
    <button type="button" className="mobile-hud__btn" onClick={onMenu} aria-label="Menu">
      <Menu size={24} strokeWidth={1.6} />
    </button>
    <button type="button" className="mobile-hud__btn" onClick={onExplore} aria-label="Explorar mesas">
      <Compass size={24} strokeWidth={1.6} />
    </button>
    <button
      type="button"
      className="mobile-hud__btn mobile-hud__btn--primary"
      onClick={onCreate}
      aria-label="Criar mesa"
    >
      <Plus size={26} strokeWidth={2.2} />
    </button>
    <button type="button" className="mobile-hud__btn" onClick={onChat} aria-label="Mensagens">
      <MessageCircle size={24} strokeWidth={1.6} />
    </button>
    <button type="button" className="mobile-hud__btn" onClick={onProfile} aria-label="Perfil do jogador">
      <span className="mobile-hud__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" draggable={false} />
        ) : (
          <User size={18} strokeWidth={1.8} />
        )}
      </span>
    </button>
  </nav>
);
