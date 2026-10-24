import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

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
        color: '#fef3c7',
        minHeight: '100vh',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Seção Hero: Tipografia Gigante com cor sólida de fundo e cor única para o título */}
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
              fontFamily: 'var(--font-body)',
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
              color: '#fef3c7',
              fontFamily: 'var(--font-body)',
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
                fontFamily: 'var(--font-body)'
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
              <ArrowRight size={18} color="#ffffff" />
            </button>
          </div>
        </div>
      </div>

      {/* Segunda Seção: Visual de Taverna Acolhedor com cor sólida de fundo */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0e0906'
        }}
      >
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
              fontFamily: 'var(--font-body)',
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
              fontFamily: 'var(--font-body)'
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
