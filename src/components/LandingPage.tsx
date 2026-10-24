import React, { useEffect } from 'react';
import { Flame } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
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
        backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(217, 119, 6, 0.16) 0%, rgba(14, 9, 6, 0.98) 75%)',
        color: '#fef3c7',
        minHeight: '200vh',
        fontFamily: '"Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Luz ambiente de lareira no topo */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '650px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.05) 50%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)'
        }}
      />

      {/* Seção Hero: Tipografia Gigante no estilo original com cores quentes de Taverna */}
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="parallax" data-speed="0.3" style={{ textAlign: 'center', lineHeight: 0.85 }}>
          <h1
            style={{
              fontSize: 'clamp(60px, 15vw, 200px)',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              color: '#fef3c7',
              fontFamily: 'var(--font-cinzel), Georgia, serif',
              textShadow: '0 4px 14px rgba(0, 0, 0, 0.85)'
            }}
          >
            TABERNA
          </h1>
          <h1
            style={{
              fontSize: 'clamp(60px, 15vw, 200px)',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              color: '#d97706',
              fontFamily: 'var(--font-cinzel), Georgia, serif',
              textShadow: '0 4px 14px rgba(0, 0, 0, 0.85)'
            }}
          >
            DIGITAL
          </h1>

          <div style={{ marginTop: '44px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onEnter}
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                color: '#ffffff',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '9999px',
                padding: '16px 42px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.65)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
                fontFamily: 'var(--font-cinzel), Georgia, serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(0, 0, 0, 0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.65)';
              }}
            >
              <span>Entrar na Taverna</span>
              <Flame size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Segunda Seção com Imagem e Paralaxe: Visual de Taverna Acolhedor */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#120b06'
        }}
      >
        <div
          className="parallax"
          data-speed="0.15"
          style={{
            position: 'absolute',
            inset: '-10%',
            backgroundImage: 'url("https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2560&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
            filter: 'sepia(40%) contrast(110%)',
            zIndex: 1
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '820px',
            padding: '0 24px'
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 800,
              color: '#fef3c7',
              letterSpacing: '0.02em',
              marginBottom: '24px',
              lineHeight: 1.15,
              fontFamily: 'var(--font-cinzel), Georgia, serif',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
            }}
          >
            UM COMPANHEIRO PARA SUAS AVENTURAS ÉPICAS.
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#cfc6b8',
              lineHeight: 1.7,
              fontWeight: 400,
              fontFamily: 'var(--font-lore), Georgia, serif'
            }}
          >
            Gerencie suas campanhas ao redor de mesas de carvalho, crie personagens imersivos,
            consulte a sabedoria ancestral do taberneiro Urd e invoque o poder dos bardos para dar vida ao seu universo de RPG de mesa.
          </p>
        </div>
      </div>
    </div>
  );
};
