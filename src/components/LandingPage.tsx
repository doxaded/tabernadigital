import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onOpenAuth?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onOpenAuth }) => {
  return (
    <div
      onClick={onEnter}
      style={{
        backgroundColor: '#120B07', // Marrom escuro 100% sólido, profundo e limpo
        color: '#EAE0D5', // Bege claro de pergaminho
        height: '100dvh',
        minHeight: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        fontFamily: "'MedievalSharp', 'UnifrakturMaguntia', serif",
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
      {/* Título Monumental em Tela Cheia — Fonte Gótica MedievalSharp & Cor Única #EAE0D5 */}
      <div
        style={{
          textAlign: 'center',
          lineHeight: 0.80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '100vw',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 'min(21.5vw, 42vh)',
            fontWeight: 700,
            margin: 0,
            padding: 0,
            letterSpacing: '-0.025em',
            textTransform: 'uppercase',
            color: '#EAE0D5',
            textShadow: '0 10px 40px rgba(0, 0, 0, 0.95)',
            lineHeight: 0.80,
            fontFamily: "'MedievalSharp', 'UnifrakturMaguntia', serif",
            whiteSpace: 'nowrap',
          }}
        >
          TABERNA
        </h1>
        <h1
          style={{
            fontSize: 'min(21.5vw, 42vh)',
            fontWeight: 700,
            margin: 0,
            padding: 0,
            letterSpacing: '-0.025em',
            textTransform: 'uppercase',
            color: '#EAE0D5',
            textShadow: '0 10px 40px rgba(0, 0, 0, 0.95)',
            lineHeight: 0.80,
            fontFamily: "'MedievalSharp', 'UnifrakturMaguntia', serif",
            whiteSpace: 'nowrap',
          }}
        >
          DIGITAL
        </h1>
      </div>

      {/* Ações sutis no rodapé */}
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
              color: 'rgba(234, 224, 213, 0.7)',
              border: '1px solid rgba(234, 224, 213, 0.2)',
              borderRadius: '6px',
              padding: '8px 20px',
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: "'MedievalSharp', serif",
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EAE0D5';
              e.currentTarget.style.borderColor = 'rgba(234, 224, 213, 0.5)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(234, 224, 213, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(234, 224, 213, 0.2)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Acessar com Login
          </button>
        </div>
      )}
    </div>
  );
};

