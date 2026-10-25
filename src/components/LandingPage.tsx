import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div
      onClick={onEnter}
      style={{
        backgroundColor: '#0e0906',
        color: '#fef3c7',
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
      {/* Iluminação de lareira suave atrás do título */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(1200px, 95vw)',
          height: 'min(800px, 80vh)',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.26) 0%, rgba(146, 64, 14, 0.09) 50%, transparent 75%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Título Monumental em Tela Cheia */}
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
            color: '#fef3c7',
            textShadow: '0 10px 40px rgba(0, 0, 0, 0.95)',
            lineHeight: 0.80,
            fontFamily: 'inherit',
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
            color: '#d97706',
            textShadow: '0 10px 40px rgba(0, 0, 0, 0.95)',
            lineHeight: 0.80,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          DIGITAL
        </h1>
      </div>
    </div>
  );
};
