import React from 'react';
import { UserProfile } from '../types';
import { getFrameById, DEFAULT_FRAME_ID } from '../services/tavernShopCatalog';

interface AvatarFrameProps {
  user?: UserProfile | null;
  frameId?: string;
  avatarUrl?: string;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showTitleBadge?: boolean;
  customTitle?: string;
  onClick?: () => void;
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 26, font: 11, badgeFont: 8 },
  sm: { box: 34, font: 13, badgeFont: 9 },
  md: { box: 42, font: 16, badgeFont: 10 },
  lg: { box: 58, font: 22, badgeFont: 11 },
  xl: { box: 80, font: 30, badgeFont: 12 },
  '2xl': { box: 110, font: 40, badgeFont: 13 }
};

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  user,
  frameId,
  avatarUrl,
  displayName,
  size = 'md',
  showTitleBadge = false,
  customTitle,
  onClick,
  className = ''
}) => {
  const effectiveFrameId = frameId || user?.frameId || DEFAULT_FRAME_ID;
  const frame = getFrameById(effectiveFrameId);
  const effectiveAvatar = avatarUrl || user?.photoURL || user?.avatarUrl;
  const effectiveName = displayName || user?.displayName || user?.email || 'Aventureiro';
  const effectiveTitle = customTitle || user?.title;
  const { box, font, badgeFont } = SIZE_MAP[size] || SIZE_MAP.md;

  // Renderizador de efeitos cosméticos adicionais para cada moldura
  const renderFrameEffects = () => {
    switch (effectiveFrameId) {
      case 'frame-fire':
        return (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              fontSize: `${Math.max(10, box * 0.28)}px`,
              filter: 'drop-shadow(0 0 6px #ef4444)',
              pointerEvents: 'none',
              animation: 'emberFlicker 2s infinite alternate ease-in-out'
            }}
          >
            🔥
          </span>
        );
      case 'frame-ice':
        return (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              fontSize: `${Math.max(10, box * 0.26)}px`,
              filter: 'drop-shadow(0 0 6px #38bdf8)',
              pointerEvents: 'none'
            }}
          >
            ❄️
          </span>
        );
      case 'frame-dragon':
        return (
          <span
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              fontSize: `${Math.max(10, box * 0.28)}px`,
              filter: 'drop-shadow(0 0 6px #f43f5e)',
              pointerEvents: 'none'
            }}
          >
            🐉
          </span>
        );
      case 'frame-nature':
        return (
          <span
            style={{
              position: 'absolute',
              bottom: '-3px',
              left: '-3px',
              fontSize: `${Math.max(10, box * 0.26)}px`,
              filter: 'drop-shadow(0 0 6px #10b981)',
              pointerEvents: 'none'
            }}
          >
            🌿
          </span>
        );
      case 'frame-celestial':
        return (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-3px',
              fontSize: `${Math.max(10, box * 0.28)}px`,
              filter: 'drop-shadow(0 0 8px #c084fc)',
              pointerEvents: 'none'
            }}
          >
            ✨
          </span>
        );
      case 'frame-gold':
        return (
          <span
            style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              fontSize: `${Math.max(9, box * 0.24)}px`,
              filter: 'drop-shadow(0 0 6px #f59e0b)',
              pointerEvents: 'none'
            }}
          >
            🪙
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`avatar-frame-container ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Moldura circular */}
      <div
        style={{
          width: `${box}px`,
          height: `${box}px`,
          minWidth: `${box}px`,
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          borderColor: frame.borderColor,
          boxShadow: frame.boxShadow,
          transition: 'all 0.3s ease',
          background: 'linear-gradient(135deg, #2b1810 0%, #160d08 100%)'
        }}
      >
        {/* Camada interna de imagem ou monograma */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f130b',
            color: '#fef3c7',
            fontWeight: 800,
            fontSize: `${font}px`,
            fontFamily: 'var(--font-cinzel), Georgia, serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {effectiveAvatar ? (
            <img
              src={effectiveAvatar}
              alt={effectiveName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                // Se a imagem falhar, cai para o monograma
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            effectiveName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Efeitos especiais de partículas ou adornos */}
        {renderFrameEffects()}
      </div>

      {/* Rótulo de título honorífico opcional */}
      {showTitleBadge && effectiveTitle && (
        <span
          style={{
            marginTop: '4px',
            fontSize: `${badgeFont}px`,
            fontWeight: 700,
            color: '#fbbf24',
            backgroundColor: 'rgba(20, 12, 6, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '1px 6px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--font-cinzel), Georgia, serif',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)'
          }}
          title={effectiveTitle}
        >
          {effectiveTitle}
        </span>
      )}
    </div>
  );
};
