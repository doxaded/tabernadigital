import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onOpenAuth?: () => void;
}

const CREAM = '#E6D5B8'; // Creme / pergaminho quente claro
const INK = '#2A1B12'; // Marrom café escuro profundo
const TITLE_INK = '#23150D';

const titleStyle: React.CSSProperties = {
  fontSize: 'min(17vw, 34vh)',
  fontWeight: 500,
  margin: 0,
  padding: 0,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: TITLE_INK,
  lineHeight: 0.92,
  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  whiteSpace: 'nowrap',
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onOpenAuth }) => {
  return (
    <div
      onClick={onEnter}
      style={{
        backgroundColor: CREAM,
        color: INK,
        height: '100dvh',
        minHeight: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2vw',
        boxSizing: 'border-box',
        userSelect: 'none',
        cursor: 'pointer',
      }}
      title="Clique para entrar na Taberna"
    >
      {/* Título editorial clássico em caixa alta, marrom café escuro */}
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '100vw',
          zIndex: 10,
        }}
      >
        <h1 style={titleStyle}>Taberna</h1>
        <h1 style={titleStyle}>Digital</h1>
      </div>

      {onOpenAuth && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onOpenAuth}
            style={{
              background: 'transparent',
              color: INK,
              border: `1px solid ${INK}`,
              borderRadius: '2px',
              padding: '9px 24px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = INK;
              e.currentTarget.style.color = CREAM;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = INK;
            }}
          >
            Acessar com Login
          </button>
        </div>
      )}
    </div>
  );
};
