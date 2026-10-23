import React from 'react';

interface MedievalCornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const MedievalCornerOrnament: React.FC<MedievalCornerOrnamentProps> = ({
  position,
  className = '',
}) => {
  return (
    <div
      className={`hub-corner hub-corner--${position} ${className}`}
      aria-hidden="true"
    >

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" fill="currentColor">
        {/* Linhas de enquadramento gótico clássico (delicadas e coladas nos eixos 0,0) */}
        <path d="M 0,118 L 0,0 L 118,0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" opacity="0.9" />
        <path d="M 4,112 L 4,4 L 112,4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" opacity="0.55" />
        
        {/* Nós e amarras de canto (0,0) */}
        <line x1="0" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1.4" opacity="0.8" />
        <line x1="12" y1="0" x2="12" y2="8" stroke="currentColor" strokeWidth="1.4" opacity="0.8" />
        <line x1="0" y1="24" x2="6" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <line x1="24" y1="0" x2="24" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />

        {/* Vértice Angular: Flor-de-lis e roseta esculpida diretamente no canto (0,0) */}
        <path d="M 0,0 L 0,14 C 3,12 6,10 9,6 C 9,6 11,3 14,0 Z" fill="currentColor" />
        <path d="M 0,0 L 18,0 C 15,3 13,7 10,11 C 7,13 4,15 0,18 Z" fill="currentColor" opacity="0.9" />
        <circle cx="6" cy="6" r="2.2" fill="currentColor" />
        <circle cx="14" cy="14" r="1.6" fill="currentColor" opacity="0.75" />

        {/* =========================================================================
            BRAÇO VERTICAL: Arabescos de Folhas de Acanto, Espirais e Finial Gótico
            ========================================================================= */}
        {/* Espiral Superior com Folhagem de Acanto */}
        <path d="M 2,28 C 8,28 16,33 19,41 C 21,50 18,60 11,64 C 4,66 0,61 1,54 C 3,48 9,46 14,49 C 16.5,51 16.5,56 13,57 C 11,58 10,55.5 11.5,53.5" 
              fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        
        {/* Miolo floral da espiral vertical */}
        <circle cx="15" cy="51" r="2.5" fill="currentColor" />
        <circle cx="15" cy="51" r="1" fill="none" stroke="currentColor" strokeWidth="0.8" />

        {/* Esporões e Pétalas de Acanto ao longo da espiral vertical */}
        <path d="M 2,22 C 7,21 12,18 14,13 C 12,18 8,20 2,21 Z" fill="currentColor" />
        <path d="M 2,36 C 8,37 14,37 20,33 C 14,39 9,41 2,39 Z" fill="currentColor" />
        <path d="M 18,44 C 26,45 33,42 38,35 C 32,42 25,48 18,49 Z" fill="currentColor" />
        <path d="M 20,47 C 26,52 30,59 31,68 C 28,60 23,55 18,53 Z" fill="currentColor" />
        <path d="M 13,65 C 19,72 21,80 18,88 C 16,80 14,74 7,71 Z" fill="currentColor" />
        <path d="M 2,78 C 8,79 12,85 12,92 C 9,86 6,84 2,83 Z" fill="currentColor" />

        {/* Segunda Espiral Menor Inferior */}
        <path d="M 4,72 C 8,72 13,75 14,79 C 15,84 12,88 8,88 C 5,88 4,85 5,82 C 6,80 8,80 9,82" 
              fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

        {/* Finial Terminal Vertical: Flor-de-lis / Ponta de Lança Gótica colada em X=0 */}
        <path d="M 0,98 C 0,98 5,103 5,112 C 5,116 2,120 0,120 Z" fill="currentColor" />
        <path d="M 0,102 C 4,102 8,106 8,110 C 7,113 4,113 0,109 Z" fill="currentColor" />
        <path d="M 0,106 C 3,106 5,109 5,114 C 4,116 2,116 0,113 Z" fill="currentColor" opacity="0.8" />
        <rect x="0" y="97" width="6.5" height="2.4" rx="0.5" fill="currentColor" />
        <circle cx="3" cy="94" r="1.6" fill="currentColor" />

        {/* =========================================================================
            BRAÇO HORIZONTAL: Arabescos de Folhas de Acanto, Espirais e Finial Gótico
            ========================================================================= */}
        {/* Espiral Superior com Folhagem de Acanto */}
        <path d="M 28,2 C 28,8 33,16 41,19 C 50,21 60,18 64,11 C 66,4 61,0 54,1 C 48,3 46,9 49,14 C 51,16.5 56,16.5 57,13 C 58,11 55.5,10 53.5,11.5" 
              fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        
        {/* Miolo floral da espiral horizontal */}
        <circle cx="51" cy="15" r="2.5" fill="currentColor" />
        <circle cx="51" cy="15" r="1" fill="none" stroke="currentColor" strokeWidth="0.8" />

        {/* Esporões e Pétalas de Acanto ao longo da espiral horizontal */}
        <path d="M 22,2 C 21,7 18,12 13,14 C 18,12 20,8 21,2 Z" fill="currentColor" />
        <path d="M 36,2 C 37,8 37,14 33,20 C 39,14 41,9 39,2 Z" fill="currentColor" />
        <path d="M 44,18 C 45,26 42,33 35,38 C 42,32 48,25 49,18 Z" fill="currentColor" />
        <path d="M 47,20 C 52,26 59,30 68,31 C 60,28 55,23 53,18 Z" fill="currentColor" />
        <path d="M 65,13 C 72,19 80,21 88,18 C 80,16 74,14 71,7 Z" fill="currentColor" />
        <path d="M 78,2 C 79,8 85,12 92,12 C 86,9 84,6 83,2 Z" fill="currentColor" />

        {/* Segunda Espiral Menor Horizontal */}
        <path d="M 72,4 C 72,8 75,13 79,14 C 84,15 88,12 88,8 C 88,5 85,4 82,5 C 80,6 80,8 82,9" 
              fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

        {/* Finial Terminal Horizontal: Flor-de-lis / Ponta de Lança Gótica colada em Y=0 */}
        <path d="M 98,0 C 98,0 103,5 112,5 C 116,5 120,2 120,0 Z" fill="currentColor" />
        <path d="M 102,0 C 102,4 106,8 110,8 C 113,7 113,4 109,0 Z" fill="currentColor" />
        <path d="M 106,0 C 106,3 109,5 114,5 C 116,4 116,2 113,0 Z" fill="currentColor" opacity="0.8" />
        <rect x="97" y="0" width="2.4" height="6.5" rx="0.5" fill="currentColor" />
        <circle cx="94" cy="3" r="1.6" fill="currentColor" />

        {/* =========================================================================
            NÓ MEDIEVAL CENTRAL & BROTO DE ACANTO DIAGONAL
            ========================================================================= */}
        {/* Arco conector e folha s-curve */}
        <path d="M 15,38 C 20,30 30,20 38,15 C 30,22 22,30 15,38 Z" fill="currentColor" />
        
        {/* Roseta Central em (28, 28) */}
        <circle cx="28" cy="28" r="4" fill="currentColor" />
        <circle cx="28" cy="28" r="1.8" fill="none" stroke="currentColor" strokeWidth="0.9" />
        {/* 4 Pétalas clássicas da roseta medieval */}
        <path d="M 28,22 C 29.5,17 33,17 34,21 C 32,22 30,23 28,22 Z" fill="currentColor" />
        <path d="M 22,28 C 17,29.5 17,33 21,34 C 22,32 23,30 22,28 Z" fill="currentColor" />
        <path d="M 28,34 C 29.5,39 33,39 34,35 C 32,34 30,33 28,34 Z" fill="currentColor" />
        <path d="M 34,28 C 39,29.5 39,33 35,34 C 34,32 33,30 34,28 Z" fill="currentColor" />

        {/* Broto de Acanto Floral que se expande para o interior do banner */}
        <path d="M 30,30 C 40,40 50,47 62,52 C 53,48 44,41 30,30 Z" fill="currentColor" />
        <path d="M 30,30 C 47,50 40,40 52,62 C 48,53 41,44 30,30 Z" fill="currentColor" />
        <circle cx="63" cy="53" r="2.4" fill="currentColor" />
        <circle cx="53" cy="63" r="2.4" fill="currentColor" />
        <circle cx="56" cy="56" r="1.5" fill="currentColor" opacity="0.85" />

        {/* Tendril decorativo interno em espiral */}
        <path d="M 33,33 C 42,42 48,46 51,44 C 54,42 53,38 49,38 C 46,38 44,41 46,43" 
              fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />

        {/* =========================================================================
            PONTILHADO GÓTICO DE ILUMINURA MEDIEVAL
            ========================================================================= */}
        <circle cx="8" cy="22" r="1.4" fill="currentColor" opacity="0.85" />
        <circle cx="22" cy="8" r="1.4" fill="currentColor" opacity="0.85" />
        <circle cx="8" cy="90" r="1.4" fill="currentColor" opacity="0.85" />
        <circle cx="90" cy="8" r="1.4" fill="currentColor" opacity="0.85" />
        <circle cx="6" cy="96" r="1.2" fill="currentColor" opacity="0.7" />
        <circle cx="96" cy="6" r="1.2" fill="currentColor" opacity="0.7" />
        <circle cx="16" cy="32" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="32" cy="16" r="1" fill="currentColor" opacity="0.6" />
      </svg>

    </div>
  );
};
