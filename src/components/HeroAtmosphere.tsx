import React, { useState, useEffect, useRef } from 'react';

export type HeroAtmosphereVariant = 'comunal' | 'alaude' | 'urd' | 'chat';

interface HeroAtmosphereProps {
  variant?: HeroAtmosphereVariant;
}

interface LanternState {
  id: string;
  isLit: boolean;
  flared: boolean;
  emberKey: number;
}

export const HeroAtmosphere: React.FC<HeroAtmosphereProps> = ({ variant = 'comunal' }) => {
  // Estados interativos de cada luminária (acesa, apagada, ou com chama atiçada)
  const [lanterns, setLanterns] = useState<Record<string, LanternState>>({
    lantern1: { id: 'lantern1', isLit: true, flared: false, emberKey: 0 },
    lantern2: { id: 'lantern2', isLit: true, flared: false, emberKey: 0 },
    lantern3: { id: 'lantern3', isLit: true, flared: false, emberKey: 0 },
  });

  // Parallax suave com a posição do mouse
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({
      x: relX * 18,
      y: relY * 12,
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Clique na luminária para interagir: atiçar chamas ou apagar/reacender
  const handleToggleLantern = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLanterns(prev => {
      const current = prev[id];
      if (!current.isLit) {
        // Se estava apagada, reacende
        return {
          ...prev,
          [id]: { ...current, isLit: true, flared: false, emberKey: current.emberKey + 1 }
        };
      }
      if (!current.flared) {
        // Se estava acesa normal, atiçar (flare temporário com fagulhas)
        setTimeout(() => {
          setLanterns(p => ({
            ...p,
            [id]: { ...p[id], flared: false }
          }));
        }, 2200);
        return {
          ...prev,
          [id]: { ...current, flared: true, emberKey: current.emberKey + 1 }
        };
      }
      // Se estava em flare, apagar vela (fica apenas o pavio fraco)
      return {
        ...prev,
        [id]: { ...current, isLit: false, flared: false, emberKey: current.emberKey + 1 }
      };
    });
  };

  // Cores de luz e atmosfera por variante de tela
  const getThemeAura = () => {
    switch (variant) {
      case 'alaude':
        return {
          halo: 'rgba(217, 119, 6, 0.08)',
          dust: 'rgba(167, 139, 250, 0.18)',
          label: 'Ateliê do Bardo'
        };
      case 'urd':
        return {
          halo: 'rgba(180, 83, 9, 0.09)',
          dust: 'rgba(245, 158, 11, 0.16)',
          label: 'Balcão de Pedra-Funda'
        };
      case 'chat':
        return {
          halo: 'rgba(147, 51, 234, 0.07)',
          dust: 'rgba(217, 119, 6, 0.15)',
          label: 'Alcova dos Sussurros'
        };
      case 'comunal':
      default:
        return {
          halo: 'rgba(245, 158, 11, 0.08)',
          dust: 'rgba(245, 158, 11, 0.15)',
          label: 'Salão Comunal'
        };
    }
  };

  const aura = getThemeAura();

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-atmosphere"
      aria-hidden="false"
      role="region"
      aria-label="Cenário ambiente da taverna"
    >
      {/* 1. Camada de Fundo Preto com Vinheta Suave e Névoa Distante */}
      <div
        className="hero-atmosphere__vignette"
        style={{
          background: `radial-gradient(ellipse 90% 75% at 50% 45%, ${aura.halo} 0%, rgba(0,0,0,0.85) 65%, #000000 100%)`
        }}
      />

      {/* 2. Silhuetas Arquitetônicas da Taverna (Vigas, Arcos e Prateleiras) — Bem Borradas e Escuras */}
      <div
        className="hero-atmosphere__silhouettes"
        style={{
          transform: `translate3d(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          className="hero-atmosphere__svg"
        >
          <defs>
            <linearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a140f" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#080605" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14100c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#050403" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Viga Superior Mestra de Carvalho Medieval */}
          <path d="M-50,0 L1490,0 L1490,65 Q1100,55 720,70 Q300,55 -50,65 Z" fill="url(#beamGrad)" />

          {/* Vigas Transversais e Colunas em Arco nos Cantos */}
          <path d="M0,0 Q180,90 220,380 Q100,420 0,440 Z" fill="url(#archGrad)" />
          <path d="M1440,0 Q1260,90 1220,380 Q1340,420 1440,440 Z" fill="url(#archGrad)" />

          {/* Silhueta de Arco de Pedra Central ao Fundo */}
          <path
            d="M320,600 C320,240 1120,240 1120,600 Z"
            fill="none"
            stroke="rgba(35, 26, 18, 0.4)"
            strokeWidth="28"
          />

          {/* Silhuetas Específicas por Seção da Taverna */}
          {variant === 'comunal' && (
            <>
              {/* Lareira e Chaminé Rústica Distante */}
              <rect x="640" y="320" width="160" height="280" rx="12" fill="#0c0907" opacity="0.4" />
              <path d="M600,440 C600,380 840,380 840,440 L840,600 L600,600 Z" fill="#050403" opacity="0.6" />
              {/* Bancos e Mesas Distantes em Penumbra */}
              <rect x="80" y="460" width="220" height="18" rx="4" fill="#0d0a07" opacity="0.3" />
              <rect x="1140" y="460" width="220" height="18" rx="4" fill="#0d0a07" opacity="0.3" />
            </>
          )}

          {variant === 'urd' && (
            <>
              {/* Prateleiras com Garrafas e Barris ao Fundo do Balcão */}
              <rect x="60" y="240" width="340" height="14" rx="2" fill="#130e0a" opacity="0.4" />
              <rect x="60" y="310" width="340" height="14" rx="2" fill="#130e0a" opacity="0.4" />
              {/* Barris de Carvalho */}
              <ellipse cx="140" cy="460" rx="60" ry="75" fill="#0f0c08" opacity="0.4" />
              <ellipse cx="250" cy="470" rx="55" ry="70" fill="#0d0906" opacity="0.45" />
              <ellipse cx="1300" cy="460" rx="65" ry="80" fill="#0f0c08" opacity="0.4" />
            </>
          )}

          {variant === 'alaude' && (
            <>
              {/* Cavalete e Instrumento em Silhueta */}
              <path d="M180,550 L220,310 L260,550 Z" stroke="#120e0a" strokeWidth="10" fill="none" opacity="0.35" />
              <circle cx="1280" cy="380" r="50" fill="#0f0c08" opacity="0.35" />
              <rect x="1275" y="260" width="10" height="130" rx="2" fill="#120e0a" opacity="0.35" />
            </>
          )}

          {variant === 'chat' && (
            <>
              {/* Rolos de Pergaminho e Puleiro Silencioso */}
              <rect x="100" y="280" width="200" height="12" rx="3" fill="#120e0a" opacity="0.4" />
              <path d="M1250,220 Q1280,180 1310,240 Q1330,300 1260,340 Z" fill="#0b0806" opacity="0.4" />
            </>
          )}
        </svg>
      </div>

      {/* 3. Partículas e Motes de Poeira Dourada Flutuante (Bokeh Suave) */}
      <div className="hero-atmosphere__dust">
        <span className="hero-dust hero-dust--1" style={{ backgroundColor: aura.dust }} />
        <span className="hero-dust hero-dust--2" style={{ backgroundColor: aura.dust }} />
        <span className="hero-dust hero-dust--3" style={{ backgroundColor: aura.dust }} />
        <span className="hero-dust hero-dust--4" style={{ backgroundColor: aura.dust }} />
        <span className="hero-dust hero-dust--5" style={{ backgroundColor: aura.dust }} />
      </div>

      {/* 4. Luminárias com Velas Interativas (Velas Fracas e Borradas) */}
      <div
        className="hero-atmosphere__lanterns-layer"
        style={{
          transform: `translate3d(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px, 0)`,
        }}
      >
        {/* LUMINÁRIA 1: Esquerda Superior (Luminária de Ferro Forjado Pendurada) */}
        <div
          className={`hero-lantern hero-lantern--left ${lanterns.lantern1.isLit ? 'is-lit' : 'is-extinguished'} ${lanterns.lantern1.flared ? 'is-flared' : ''}`}
          onClick={(e) => handleToggleLantern('lantern1', e)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleLantern('lantern1', e as any); }}
          title={lanterns.lantern1.isLit ? (lanterns.lantern1.flared ? 'Vela atiçada! Clique para soprar' : 'Vela acesa. Clique para atiçar a chama') : 'Vela apagada. Clique para acender'}
        >
          {/* Corrente Suspensa */}
          <div className="hero-lantern__chain" />

          {/* Gaiola / Caixa da Luminária */}
          <div className="hero-lantern__cage">
            {/* Topo cônico de ferro */}
            <div className="hero-lantern__roof" />

            {/* Vidro e Vela Interna */}
            <div className="hero-lantern__chamber">
              {/* Corpo de Cera da Vela */}
              <div className="hero-lantern__candle-wax" />

              {/* Chama Fraca e Borrada */}
              {lanterns.lantern1.isLit ? (
                <div className="hero-lantern__flame-wrapper">
                  <div className="hero-lantern__flame" />
                  <div className="hero-lantern__halo" />
                </div>
              ) : (
                /* Pavio vermelho fraco fumegando */
                <div className="hero-lantern__wick-smoke">
                  <div className="hero-lantern__wick" />
                  <div className="hero-lantern__smoke" />
                </div>
              )}

              {/* Faíscas / Fagulhas ao Atiçar */}
              {lanterns.lantern1.flared && (
                <div key={lanterns.lantern1.emberKey} className="hero-lantern__embers">
                  <span className="hero-ember hero-ember--1" />
                  <span className="hero-ember hero-ember--2" />
                  <span className="hero-ember hero-ember--3" />
                </div>
              )}
            </div>

            {/* Base de Ferro */}
            <div className="hero-lantern__base" />
          </div>

          <span className="hero-lantern__hint">
            {lanterns.lantern1.isLit ? 'Vela na luminária (clique para atiçar)' : 'Apagada (clique para acender)'}
          </span>
        </div>

        {/* LUMINÁRIA 2: Direita Média (Arandela de Parede Medieval) */}
        <div
          className={`hero-lantern hero-lantern--right ${lanterns.lantern2.isLit ? 'is-lit' : 'is-extinguished'} ${lanterns.lantern2.flared ? 'is-flared' : ''}`}
          onClick={(e) => handleToggleLantern('lantern2', e)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleLantern('lantern2', e as any); }}
          title={lanterns.lantern2.isLit ? (lanterns.lantern2.flared ? 'Chama viva! Clique para apagar' : 'Vela acesa. Clique para atiçar') : 'Vela apagada. Clique para acender'}
        >
          {/* Suporte de Parede de Ferro Retorcido */}
          <div className="hero-lantern__sconce-arm" />

          {/* Gaiola / Arandela */}
          <div className="hero-lantern__cage hero-lantern__cage--round">
            <div className="hero-lantern__roof" />
            <div className="hero-lantern__chamber">
              <div className="hero-lantern__candle-wax hero-lantern__candle-wax--short" />

              {lanterns.lantern2.isLit ? (
                <div className="hero-lantern__flame-wrapper hero-lantern__flame-wrapper--right">
                  <div className="hero-lantern__flame" />
                  <div className="hero-lantern__halo" />
                </div>
              ) : (
                <div className="hero-lantern__wick-smoke">
                  <div className="hero-lantern__wick" />
                  <div className="hero-lantern__smoke" />
                </div>
              )}

              {lanterns.lantern2.flared && (
                <div key={lanterns.lantern2.emberKey} className="hero-lantern__embers">
                  <span className="hero-ember hero-ember--1" />
                  <span className="hero-ember hero-ember--2" />
                </div>
              )}
            </div>
            <div className="hero-lantern__base" />
          </div>

          <span className="hero-lantern__hint">
            {lanterns.lantern2.isLit ? 'Arandela de carvalho (clique)' : 'Apagada (clique)'}
          </span>
        </div>

        {/* LUMINÁRIA 3: Fundo Superior Central (Luminária Distante e Mais Borrada) */}
        <div
          className={`hero-lantern hero-lantern--distant ${lanterns.lantern3.isLit ? 'is-lit' : 'is-extinguished'} ${lanterns.lantern3.flared ? 'is-flared' : ''}`}
          onClick={(e) => handleToggleLantern('lantern3', e)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleLantern('lantern3', e as any); }}
          title="Luminária ao fundo"
        >
          <div className="hero-lantern__chain hero-lantern__chain--short" />
          <div className="hero-lantern__cage hero-lantern__cage--tiny">
            <div className="hero-lantern__chamber">
              <div className="hero-lantern__candle-wax hero-lantern__candle-wax--tiny" />
              {lanterns.lantern3.isLit ? (
                <div className="hero-lantern__flame-wrapper">
                  <div className="hero-lantern__flame hero-lantern__flame--distant" />
                  <div className="hero-lantern__halo hero-lantern__halo--distant" />
                </div>
              ) : (
                <div className="hero-lantern__wick-smoke">
                  <div className="hero-lantern__wick" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
