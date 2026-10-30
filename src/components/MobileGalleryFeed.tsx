import React from 'react';
import { Menu } from 'lucide-react';

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
        id={`mobile-feed-room-${room.id}`}
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
  activeRoom: string;
  onMenu: () => void;
  onSelectRoom: (roomId: string) => void;
}

const HUD_ROOMS: { id: string; label: string }[] = [
  { id: 'I', label: '1' },
  { id: 'II', label: '2' },
  { id: 'III', label: '3' },
  { id: 'IV', label: '4' },
  { id: 'V', label: '5' },
];

/** Barra inferior fixa (HUD) do feed mobile: Menu (esquerda) + salas 1 a 5. */
export const MobileHudBar: React.FC<MobileHudBarProps> = ({ activeRoom, onMenu, onSelectRoom }) => (
  <nav className="mobile-hud" aria-label="Navegação inferior">
    <button type="button" className="mobile-hud__btn" onClick={onMenu} aria-label="Menu">
      <Menu size={24} strokeWidth={1.6} />
    </button>
    <div className="mobile-hud__numbers">
      {HUD_ROOMS.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`mobile-hud__num${activeRoom === r.id ? ' is-active' : ''}`}
          onClick={() => onSelectRoom(r.id)}
          aria-label={`Sala ${r.label}`}
          aria-current={activeRoom === r.id ? 'true' : undefined}
        >
          {r.label}
        </button>
      ))}
    </div>
  </nav>
);
