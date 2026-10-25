import React from 'react';
import { ArrowRight, User, Volume2, VolumeX, LogIn } from 'lucide-react';
import { UserProfile } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  onOpenAuth: () => void;
  currentUser: UserProfile | null;
  onLogout?: () => void;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onOpenAuth,
  currentUser,
  isAudioPlaying = false,
  onToggleAudio,
}) => {
  return (
    <div
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
        justifyContent: 'space-between',
        padding: '24px clamp(16px, 3vw, 40px) clamp(24px, 4vh, 44px)',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      {/* Barra Superior com Controle de Trilha Sonora */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          zIndex: 30,
          pointerEvents: 'auto',
          minHeight: '38px',
        }}
      >
        {onToggleAudio && (
          <button
            onClick={onToggleAudio}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(254, 243, 199, 0.2)',
              borderRadius: '9999px',
              padding: '8px 18px',
              color: '#fef3c7',
              fontSize: '12px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'opacity 0.25s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.75';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            title="Alternar trilha sonora da lareira"
          >
            {isAudioPlaying ? <Volume2 size={15} color="#fef3c7" /> : <VolumeX size={15} color="#fef3c7" />}
            <span>Alaúde: {isAudioPlaying ? 'Tocando' : 'Silenciado'}</span>
          </button>
        )}
      </div>

      {/* Iluminação de lareira suave atrás do título */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(950px, 90vw)',
          height: 'min(600px, 60vh)',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.22) 0%, rgba(146, 64, 14, 0.07) 50%, transparent 75%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Centro: Título Gigante "TABERNA DIGITAL" ocupando a tela inteira */}
      <div
        onClick={onEnter}
        style={{
          cursor: 'pointer',
          textAlign: 'center',
          lineHeight: 0.84,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
          zIndex: 10,
        }}
        title="Clique para entrar na Taberna"
      >
        <h1
          style={{
            fontSize: 'clamp(70px, 17.5vw, 240px)',
            fontWeight: 700,
            margin: 0,
            padding: 0,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: '#fef3c7',
            textShadow: '0 8px 32px rgba(0, 0, 0, 0.9)',
            lineHeight: 0.85,
            fontFamily: 'inherit',
          }}
        >
          TABERNA
        </h1>
        <h1
          style={{
            fontSize: 'clamp(70px, 17.5vw, 240px)',
            fontWeight: 700,
            margin: 0,
            padding: 0,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: '#d97706',
            textShadow: '0 8px 32px rgba(0, 0, 0, 0.9)',
            lineHeight: 0.85,
            fontFamily: 'inherit',
          }}
        >
          DIGITAL
        </h1>
      </div>

      {/* Base: Botões "Entrar na Taverna" e "Logar / Perfil" */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <button
          onClick={onEnter}
          style={{
            background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
            color: '#ffffff',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '9999px',
            padding: '14px 38px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.65)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(217, 119, 6, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.65)';
          }}
        >
          <span>Entrar na Taverna</span>
          <ArrowRight size={16} color="#ffffff" />
        </button>

        <button
          onClick={onOpenAuth}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fef3c7',
            border: '1px solid rgba(254, 243, 199, 0.25)',
            borderRadius: '9999px',
            padding: '14px 32px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(254, 243, 199, 0.45)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(254, 243, 199, 0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {currentUser ? <User size={16} color="#fef3c7" /> : <LogIn size={16} color="#fef3c7" />}
          <span>{currentUser ? 'Perfil / Conta' : 'Logar / Criar Conta'}</span>
        </button>
      </div>
    </div>
  );
};
