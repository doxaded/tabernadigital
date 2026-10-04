import React, { useEffect } from 'react';
import { Flame } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  // Simple scroll effect for parallax
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
    <div style={{
      backgroundColor: '#050505',
      color: '#ffffff',
      minHeight: '200vh',
      fontFamily: '"Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Huge Hero Typography */}
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="parallax" data-speed="0.3" style={{ textAlign: 'center', lineHeight: 0.85 }}>
          <h1 style={{
            fontSize: 'clamp(60px, 15vw, 200px)',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            color: '#ffffff'
          }}>
            TABERNA
          </h1>
          <h1 style={{
            fontSize: 'clamp(60px, 15vw, 200px)',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            color: '#ffffff'
          }}>
            DIGITAL
          </h1>
          
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onEnter}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '40px',
                padding: '16px 40px',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              <span>Entrar na Taverna</span>
              <Flame size={18} color="#f59e0b" />
            </button>
          </div>
        </div>
      </div>

      {/* Immersive Image Section */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505'
      }}>
        <div 
          className="parallax" 
          data-speed="0.15"
          style={{
            position: 'absolute',
            inset: '-10%',
            backgroundImage: 'url("https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2560&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6,
            zIndex: 1
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', padding: '0 24px' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 64px)',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: '24px',
            lineHeight: 1.1
          }}>
            UM COMPANHEIRO PARA SUAS AVENTURAS ÉPICAS.
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#a1a1aa',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Gerencie suas campanhas, crie personagens imersivos, e invoque o poder da inteligência artificial para dar vida ao seu universo de RPG de mesa.
          </p>
        </div>
      </div>
    </div>
  );
};
