import React from 'react';
import { Flame, Shield, Dices, Beer, Scroll, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div
      style={{
        backgroundColor: '#0e0906',
        backgroundImage: 'radial-gradient(ellipse at 50% 25%, rgba(217, 119, 6, 0.18) 0%, rgba(14, 9, 6, 0.98) 75%)',
        color: '#f5ecdc',
        minHeight: '100vh',
        fontFamily: 'var(--font-cinzel), Georgia, serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box'
      }}
    >
      {/* Luz difusa de Lareira e Tochas ao Fundo */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)'
        }}
      />

      {/* Conteúdo Central: Entrada da Taverna */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '920px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        {/* Emblema da Tocha / Brasão */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 20px',
            borderRadius: '30px',
            border: '1.5px solid #f59e0b',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(69, 26, 3, 0.4) 100%)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), inset 0 1px 1px rgba(254, 243, 199, 0.4)',
            color: '#fef3c7',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
          }}
        >
          <Flame size={16} style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 6px #f59e0b)' }} />
          <span>Taverna Medieval & Companion de Boardgames</span>
          <Flame size={16} style={{ color: '#f59e0b' }} />
        </div>

        {/* Título Principal em Relevo Dourado */}
        <div>
          <h1
            style={{
              fontSize: 'clamp(48px, 11vw, 110px)',
              fontWeight: 900,
              margin: 0,
              lineHeight: 0.95,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#fef3c7',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.45)',
              fontFamily: 'var(--font-cinzel), Georgia, serif'
            }}
          >
            TABERNA
          </h1>
          <h1
            style={{
              fontSize: 'clamp(48px, 11vw, 110px)',
              fontWeight: 900,
              margin: 0,
              lineHeight: 0.95,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#d97706',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(217, 119, 6, 0.5)',
              fontFamily: 'var(--font-cinzel), Georgia, serif'
            }}
          >
            DIGITAL
          </h1>
        </div>

        {/* Descrição Imersiva de RPG */}
        <p
          style={{
            fontSize: 'clamp(16px, 2.2vw, 21px)',
            color: '#cfc6b8',
            fontFamily: 'var(--font-lore), Georgia, serif',
            maxWidth: '740px',
            margin: '8px 0 16px',
            lineHeight: 1.6,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)'
          }}
        >
          O refúgio medieval para mestres e aventureiros de RPG. Role dados em mesas de carvalho,
          gerencie fichas e regras com facilidade, ouça as profecias do taberneiro Urd e ilustre suas maiores lendas.
        </p>

        {/* Botão de Entrada Rústico com Brilho de Tocha */}
        <div>
          <button
            onClick={onEnter}
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
              color: '#ffffff',
              border: '2px solid #f59e0b',
              borderRadius: '40px',
              padding: '18px 46px',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 0 28px rgba(245, 158, 11, 0.5), 0 8px 24px rgba(0, 0, 0, 0.8)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
              fontFamily: 'var(--font-cinzel), Georgia, serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 35px rgba(245, 158, 11, 0.7), 0 12px 30px rgba(0, 0, 0, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(245, 158, 11, 0.5), 0 8px 24px rgba(0, 0, 0, 0.8)';
            }}
          >
            <span>Empurrar as Portas da Taverna</span>
            <Flame size={18} />
          </button>
        </div>

        {/* 4 Recursos Rápidos da Taverna */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            width: '100%',
            marginTop: '40px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              padding: '18px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              background: 'rgba(20, 12, 7, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Dices size={24} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7' }}>Mural de Mesas</span>
            <span style={{ fontSize: '11px', color: '#a89a85', fontFamily: 'var(--font-body)' }}>Fichas & Campanhas</span>
          </div>

          <div
            style={{
              padding: '18px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              background: 'rgba(20, 12, 7, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={24} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7' }}>Telas do Alaúde</span>
            <span style={{ fontSize: '11px', color: '#a89a85', fontFamily: 'var(--font-body)' }}>Ateliê de Ilustração</span>
          </div>

          <div
            style={{
              padding: '18px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              background: 'rgba(20, 12, 7, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Beer size={24} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7' }}>Balcão de Urd</span>
            <span style={{ fontSize: '11px', color: '#a89a85', fontFamily: 'var(--font-body)' }}>Lareira & Oráculo</span>
          </div>

          <div
            style={{
              padding: '18px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              background: 'rgba(20, 12, 7, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Scroll size={24} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7' }}>Recanto dos Bardos</span>
            <span style={{ fontSize: '11px', color: '#a89a85', fontFamily: 'var(--font-body)' }}>Scriptorium & Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};
