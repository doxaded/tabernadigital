import React from 'react';
import { Menu } from 'lucide-react';

export interface MobileRoomBanner {
  key: string;
  imageUrl: string;
  title: string;
  description: string;
  onClick: () => void;
}

interface MobileRoomBannersProps {
  roomName: string;
  banners: MobileRoomBanner[];
}

/**
 * Modo Galeria mobile (< 768px): banners da aba ativa, cada um com
 * imagem + breve explicação abaixo. Visível apenas em telas pequenas.
 */
export const MobileRoomBanners: React.FC<MobileRoomBannersProps> = ({ roomName, banners }) => (
  <section className="mobile-feed" aria-label={roomName}>
    {banners.map((b) => (
      <button
        key={b.key}
        type="button"
        className="mobile-feed__card"
        onClick={b.onClick}
        aria-label={`${b.title} — ${roomName}`}
      >
        <span className="mobile-feed__media">
          <img src={b.imageUrl} alt={b.title} draggable={false} />
        </span>
        <span className="mobile-feed__text">
          <strong className="mobile-feed__title">{b.title}</strong>
          <span className="mobile-feed__desc">{b.description}</span>
        </span>
      </button>
    ))}
  </section>
);

const ROMANS = ['I', 'II', 'III', 'IV', 'V'];

interface MobileHudBarProps {
  activeRoom: string;
  onMenu: () => void;
  onSelectRoom: (roomId: string) => void;
}

/** Barra inferior fixa (HUD): Menu à esquerda + algarismos romanos I–V (opacidade por distância). */
export const MobileHudBar: React.FC<MobileHudBarProps> = ({ activeRoom, onMenu, onSelectRoom }) => {
  const activeIndex = ROMANS.indexOf(activeRoom);
  return (
    <nav className="mobile-hud" aria-label="Navegação inferior">
      <button type="button" className="mobile-hud__btn" onClick={onMenu} aria-label="Menu">
        <Menu size={24} strokeWidth={1.6} />
      </button>
      <div className="mobile-hud__numbers">
        {ROMANS.map((roman, idx) => {
          const distance = Math.abs(activeIndex - idx);
          const opacity =
            distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.3 : distance === 3 ? 0.16 : 0.08;
          const isActive = activeRoom === roman;
          return (
            <button
              key={roman}
              type="button"
              className={`mobile-hud__num${isActive ? ' is-active' : ''}`}
              style={{ opacity }}
              onClick={() => onSelectRoom(roman)}
              aria-label={`Sala ${roman}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="awwwards-nav-stretched-text">{roman}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
