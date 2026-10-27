import React from 'react';

/**
 * Cores de iluminuras e pigmentos medievais autênticos:
 * - Ouro Velho: #D4A359
 * - Vermelho Carmim: #8B261D
 * - Azul Ultramarino Envelhecido: #2B4C65
 * - Verde Musgo: #4A5D3F
 */

/** SALA I: Ramo floral iluminado que sobe pela margem externa esquerda da coluna esquerda */
export const FoliateVineLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 48 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-vine-left ${className}`}
    style={{
      position: 'absolute',
      left: '-36px',
      top: '5%',
      height: '92%',
      width: '38px',
      pointerEvents: 'none',
      overflow: 'visible',
      opacity: 0.85,
    }}
    aria-hidden="true"
  >
    {/* Caule principal sinuoso em ouro velho */}
    <path
      d="M24 315 C18 260 32 210 20 160 C10 115 30 70 22 5"
      stroke="#D4A359"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="none"
    />
    {/* Raminho fino secundário */}
    <path
      d="M22 280 C36 265 38 240 28 230"
      stroke="#D4A359"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M18 190 C6 175 4 150 16 140"
      stroke="#D4A359"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M22 100 C34 85 36 60 26 50"
      stroke="#D4A359"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    {/* Folhas de Acanto em Verde Musgo */}
    <path
      d="M20 232 C30 226 38 234 34 246 C28 248 22 242 20 232 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="0.8"
    />
    <path
      d="M16 142 C6 136 -2 144 2 156 C8 158 14 152 16 142 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="0.8"
    />
    <path
      d="M24 52 C34 46 42 54 38 66 C32 68 26 62 24 52 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="0.8"
    />

    {/* Flores e Bagas em Vermelho Carmim */}
    <circle cx="34" cy="225" r="4.2" fill="#8B261D" stroke="#D4A359" strokeWidth="0.8" />
    <circle cx="2" cy="135" r="4.2" fill="#8B261D" stroke="#D4A359" strokeWidth="0.8" />
    <circle cx="32" cy="45" r="4.5" fill="#8B261D" stroke="#D4A359" strokeWidth="0.8" />

    {/* Brotos em Azul Ultramarino Envelhecido */}
    <circle cx="20" cy="275" r="3" fill="#2B4C65" />
    <circle cx="16" cy="185" r="3" fill="#2B4C65" />
    <circle cx="25" cy="95" r="3" fill="#2B4C65" />

    {/* Finial Superior em Flor-de-Lis em Ouro */}
    <path
      d="M22 5 C20 0 24 0 22 5 M18 10 C15 6 19 3 22 5 C25 3 29 6 26 10 Z"
      fill="#D4A359"
    />
  </svg>
);

/** SALA II: Arabesco de Iluminura no Canto Superior Direito */
export const ArabesqueCornerTopRight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 90 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-arabesque-tr ${className}`}
    style={{
      position: 'absolute',
      top: '-24px',
      right: '-24px',
      width: '74px',
      height: '74px',
      pointerEvents: 'none',
      opacity: 0.82,
    }}
    aria-hidden="true"
  >
    {/* Espiral gótica de canto em ouro velho */}
    <path
      d="M85 5 C85 45 45 85 5 85"
      stroke="#D4A359"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M85 18 C65 24 35 48 20 85"
      stroke="#D4A359"
      strokeWidth="1.2"
      strokeDasharray="2 3"
      opacity="0.7"
    />
    <path
      d="M75 10 C60 10 50 25 55 40 C60 52 75 48 72 35 C70 28 62 28 62 34"
      stroke="#8B261D"
      strokeWidth="1.4"
      fill="none"
    />
    {/* Pétala floral azul ultramarino */}
    <path
      d="M78 8 C88 8 88 18 78 18 C72 15 72 10 78 8 Z"
      fill="#2B4C65"
      stroke="#D4A359"
      strokeWidth="0.8"
    />
    <circle cx="85" cy="5" r="3.2" fill="#D4A359" />
    <circle cx="5" cy="85" r="2.8" fill="#D4A359" />
  </svg>
);

/** SALA II: Floreio / Estrelas de Pena ao final do parágrafo */
export const PenFlourishEnd: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      marginLeft: '8px',
      color: '#D4A359',
      opacity: 0.85,
      fontSize: '0.85em',
      verticalAlign: 'middle',
    }}
    aria-hidden="true"
  >
    <span style={{ color: '#8B261D' }}>✦</span>
    <span>❦</span>
    <span style={{ color: '#2B4C65' }}>✦</span>
  </span>
);

/** SALA III: Ornamento caligráfico horizontal iluminado acima do trecho esquerdo */
export const CalligraphicHeaderHorizontal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-header ${className}`}
    style={{
      width: '100%',
      maxWidth: '260px',
      height: '24px',
      margin: '0 auto 12px auto',
      display: 'block',
      opacity: 0.85,
    }}
    aria-hidden="true"
  >
    {/* Linha central com nós góticos */}
    <path d="M10 14 H95 M145 14 H230" stroke="#D4A359" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="10" cy="14" r="2" fill="#D4A359" />
    <circle cx="230" cy="14" r="2" fill="#D4A359" />
    {/* Roseta central esculpida em ouro e carmim */}
    <circle cx="120" cy="14" r="6" fill="#8B261D" stroke="#D4A359" strokeWidth="1.2" />
    <circle cx="120" cy="14" r="2.5" fill="#D4A359" />
    {/* Pétalas de acanto laterais */}
    <path d="M108 14 C100 8 98 20 108 14 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.6" />
    <path d="M132 14 C140 8 142 20 132 14 Z" fill="#4A5D3F" stroke="#D4A359" strokeWidth="0.6" />
  </svg>
);

/** SALA III: Vinheta de folhas entrelaçadas no canto inferior direito */
export const IntertwinedLeavesVignette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 70 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-vignette-br ${className}`}
    style={{
      position: 'absolute',
      bottom: '-16px',
      right: '-16px',
      width: '58px',
      height: '58px',
      pointerEvents: 'none',
      opacity: 0.8,
    }}
    aria-hidden="true"
  >
    <path
      d="M10 60 C30 58 45 48 55 25 C58 18 62 10 65 5"
      stroke="#D4A359"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M32 52 C38 42 48 40 45 54 C40 56 34 56 32 52 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="0.8"
    />
    <path
      d="M45 36 C55 30 62 36 56 46 C50 46 46 40 45 36 Z"
      fill="#D4A359"
    />
    <circle cx="65" cy="5" r="3" fill="#8B261D" />
  </svg>
);

/** SALA IV: Trepadeira medieval abraçando a curva inferior esquerda */
export const IvyBranchBottomLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 60 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-ivy-bl ${className}`}
    style={{
      position: 'absolute',
      left: '-28px',
      bottom: '-10px',
      width: '52px',
      height: '160px',
      pointerEvents: 'none',
      opacity: 0.85,
    }}
    aria-hidden="true"
  >
    <path
      d="M50 175 C15 165 8 135 14 95 C18 65 10 35 16 5"
      stroke="#D4A359"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Folhas de hera em verde musgo e ouro */}
    <path
      d="M16 130 C4 122 8 108 20 114 C22 124 18 128 16 130 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="0.7"
    />
    <path
      d="M14 75 C26 68 28 82 18 88 C12 86 12 78 14 75 Z"
      fill="#4A5D3F"
      stroke="#D4A359"
      strokeWidth="0.7"
    />
    <circle cx="20" cy="114" r="3.2" fill="#8B261D" />
    <circle cx="16" cy="5" r="3.6" fill="#D4A359" />
  </svg>
);

/** SALA V: Iluminura Dourada e Carmim no Topo da Coluna Esquerda */
export const TreasuryCrestTopLeft: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 110 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-crest-tl ${className}`}
    style={{
      position: 'absolute',
      top: '-26px',
      left: '-14px',
      width: '95px',
      height: '32px',
      pointerEvents: 'none',
      opacity: 0.85,
    }}
    aria-hidden="true"
  >
    <path d="M5 24 C25 24 35 12 55 12 C75 12 85 24 105 24" stroke="#D4A359" strokeWidth="1.5" />
    <circle cx="55" cy="12" r="5" fill="#8B261D" stroke="#D4A359" strokeWidth="1.2" />
    <circle cx="55" cy="12" r="2" fill="#D4A359" />
    <circle cx="32" cy="18" r="2.8" fill="#2B4C65" />
    <circle cx="78" cy="18" r="2.8" fill="#2B4C65" />
  </svg>
);

/** SALA V: Iluminura com Gemas e Ouro Velho na Base Interna da Coluna Direita */
export const TreasuryGemsBaseRight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`medieval-illumination-gems-br ${className}`}
    style={{
      position: 'absolute',
      bottom: '-22px',
      left: '0px',
      width: '110px',
      height: '26px',
      pointerEvents: 'none',
      opacity: 0.85,
    }}
    aria-hidden="true"
  >
    <path d="M5 15 H115" stroke="#D4A359" strokeWidth="1.2" strokeLinecap="round" />
    {/* Gemas em losango */}
    <polygon points="60,6 66,15 60,24 54,15" fill="#8B261D" stroke="#D4A359" strokeWidth="0.8" />
    <polygon points="30,9 35,15 30,21 25,15" fill="#D4A359" />
    <polygon points="90,9 95,15 90,21 85,15" fill="#2B4C65" />
  </svg>
);
