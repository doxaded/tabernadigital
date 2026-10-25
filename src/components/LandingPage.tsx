import React, { useEffect } from 'react';
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
  // Efeito de scroll suave para paralaxe
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const elements = document.querySelectorAll('.parallax');
      elements.forEach((el) => {
        const speed = (el as HTMLElement).dataset.speed || '0.5';
        (el as HTMLElement).style.transform = `translateY(${scrolled * parseFloat(speed)}px)`;
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#0e0906',
        color: '#fef3c7',
        minHeight: '100vh',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Barra Superior Discreta de Áudio */}
      {onToggleAudio && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            padding: '24px clamp(20px, 4vw, 48px)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
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
        </div>
      )}

      {/* Iluminação ambiente suave de tochas ao fundo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, rgba(146, 64, 14, 0.06) 55%, transparent 75%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Seção Hero: Tipografia Gigante e Botões de Acesso */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          padding: '60px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div className="parallax" data-speed="0.25" style={{ textAlign: 'center', lineHeight: 0.9 }}>
          <h1
            style={{
              fontSize: 'clamp(56px, 14vw, 190px)',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#fef3c7',
              textShadow: '0 6px 20px rgba(0, 0, 0, 0.85)',
              fontFamily: 'inherit',
            }}
          >
            TABERNA
          </h1>
          <h1
            style={{
              fontSize: 'clamp(56px, 14vw, 190px)',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#d97706',
              textShadow: '0 6px 20px rgba(0, 0, 0, 0.85)',
              fontFamily: 'inherit',
            }}
          >
            DIGITAL
          </h1>

          <p
            style={{
              marginTop: '20px',
              fontSize: 'clamp(14px, 1.4vw, 18px)',
              fontStyle: 'italic',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              opacity: 0.75,
              color: '#cfc6b8',
            }}
          >
            Salões & Crônicas Medievais
          </p>

          {/* Identificação se usuário já estiver conectado */}
          {currentUser && (
            <div
              style={{
                marginTop: '24px',
                fontSize: '14px',
                letterSpacing: '0.16em',
                color: '#f59e0b',
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}
            >
              Aventureiro: {currentUser.displayName || currentUser.email}
            </div>
          )}

          {/* Botões: "Entrar na Taverna" ou "Logar" */}
          <div
            style={{
              marginTop: currentUser ? '24px' : '44px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Botão Principal: Entrar na Taverna */}
            <button
              onClick={onEnter}
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                color: '#ffffff',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '9999px',
                padding: '16px 40px',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
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
              <ArrowRight size={18} color="#ffffff" />
            </button>

            {/* Botão Secundário: Logar / Minha Conta */}
            <button
              onClick={onOpenAuth}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fef3c7',
                border: '1px solid rgba(254, 243, 199, 0.25)',
                borderRadius: '9999px',
                padding: '16px 36px',
                fontSize: '14px',
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
              {currentUser ? <User size={17} color="#fef3c7" /> : <LogIn size={17} color="#fef3c7" />}
              <span>{currentUser ? 'Perfil / Conta' : 'Logar / Criar Conta'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segunda Seção: Manifesto de RPG da Taberna */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          padding: '120px 24px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#120a06',
          borderTop: '1px solid rgba(245, 158, 11, 0.12)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '840px',
            padding: '0 20px',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 56px)',
              fontWeight: 700,
              color: '#fef3c7',
              letterSpacing: '0.04em',
              marginBottom: '24px',
              lineHeight: 1.2,
              fontFamily: 'inherit',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
            }}
          >
            UM COMPANHEIRO PARA SUAS AVENTURAS ÉPICAS.
          </h2>
          <p
            style={{
              fontSize: 'clamp(16px, 1.2vw, 19px)',
              color: '#cfc6b8',
              lineHeight: 1.8,
              fontWeight: 400,
              fontStyle: 'italic',
              fontFamily: 'inherit',
              margin: '0 auto 40px',
            }}
          >
            Gerencie suas campanhas ao redor de mesas de carvalho, crie personagens imersivos,
            consulte a sabedoria ancestral do taberneiro Urd e invoque o poder dos bardos para dar vida ao seu universo de RPG de mesa.
          </p>

          <button
            onClick={onEnter}
            style={{
              background: 'transparent',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '9999px',
              padding: '12px 30px',
              fontSize: '13px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            }}
          >
            Entrar na Taberna →
          </button>
        </div>
      </div>
    </div>
  );
};
