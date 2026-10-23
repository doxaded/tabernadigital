import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Campaign, UserProfile } from '../types';

interface TavernHubViewProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  sketchesCount?: number;
  onNavigate: (tab: 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
}

interface HubModuleConfig {
  id: 'campaigns' | 'sketch' | 'urd' | 'chat';
  theme: 'dark' | 'light';
  lineA: string;
  lineB: string;
  description: string;
  actionText: string;
}

const HUB_MODULES: HubModuleConfig[] = [
  {
    id: 'campaigns',
    theme: 'dark',
    lineA: 'Mesa dos',
    lineB: 'Apostadores',
    description: 'Junte-se a uma mesa compartilhada pela chave do mestre ou crie e conduza sua própria saga com fichas, lore e regras.',
    actionText: 'Acessar Mesa dos Apostadores',
  },
  {
    id: 'sketch',
    theme: 'light',
    lineA: 'Telas',
    lineB: 'do Alaúde',
    description: 'Ilustre itens lendários, mapas arcanos, criaturas e heróis com o traço aveludado e a imaginação do bardo Orlan Pena-Fina.',
    actionText: 'Abrir Telas do Alaúde',
  },
  {
    id: 'urd',
    theme: 'dark',
    lineA: 'Urd',
    lineB: 'o Taberneiro',
    description: 'Consulte a sabedoria ancestral de Urd, desvende profecias, ouça os boatos sussurrados na lareira e crie crônicas vivas.',
    actionText: 'Consultar o Taberneiro',
  },
  {
    id: 'chat',
    theme: 'light',
    lineA: 'Recanto dos',
    lineB: 'Bardos',
    description: 'Comunique-se em tempo real com taverneiros e companheiros de aventura, planeje suas sessões e troque mensagens diretas.',
    actionText: 'Entrar no Recanto dos Bardos',
  },
];

export const TavernHubView: React.FC<TavernHubViewProps> = ({
  onNavigate,
}) => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <div className="hub-checkerboard" role="main" aria-label="Portal de Opções da Taberna Digital">
      {HUB_MODULES.map((mod, index) => {
        const isHovered = hoveredModule === mod.id;
        const isFirst = index === 0;

        return (
          <section
            key={mod.id}
            id={`hub-section-${mod.id}`}
            className={`hub-banner hub-banner--${mod.theme}${isFirst ? ' hub-banner--first' : ''}${isHovered ? ' is-hovered' : ''}`}
            aria-label={`${mod.lineA} ${mod.lineB}`}
          >
            <div className="hub-banner__inner">
              {/* Botão Interativo com o Título Gigante */}
              <button
                type="button"
                className="hub-banner__title-btn"
                onClick={() => onNavigate(mod.id)}
                onMouseEnter={() => setHoveredModule(mod.id)}
                onMouseLeave={() => setHoveredModule(null)}
                aria-label={`${mod.actionText}: ${mod.lineA} ${mod.lineB}`}
                title={`Clique para acessar ${mod.lineA} ${mod.lineB}`}
              >
                <h2 className="hub-banner__title">
                  <span className="hub-banner__line hub-banner__line--a">
                    <span className="hub-banner__word">{mod.lineA}</span>
                  </span>
                  <span className="hub-banner__line hub-banner__line--b">
                    <span className="hub-banner__word">{mod.lineB}</span>
                    <span className="hub-banner__arrow-wrap">
                      <ArrowUpRight className="hub-banner__arrow" size={44} />
                    </span>
                  </span>
                </h2>

                {/* Pill interativo dinâmico que ganha destaque no hover */}
                <div className="hub-banner__pill-tray">
                  <span className="hub-banner__pill">
                    <span>{mod.actionText}</span>
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </button>

              {/* Legenda inferior explicativa do serviço posicionada de forma absoluta para não alterar a posição do título */}
              <div className="hub-banner__service-desc">
                <p>{mod.description}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};
