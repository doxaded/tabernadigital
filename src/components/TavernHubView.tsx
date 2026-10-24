import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Campaign, UserProfile } from '../types';

interface TavernHubViewProps {
  currentUser?: UserProfile | null;
  campaigns?: Campaign[];
  sketchesCount?: number;
  onNavigate: (tab: 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
  onOpenShop?: () => void;
}

interface HubModuleConfig {
  id: 'campaigns' | 'sketch' | 'urd' | 'chat';
  theme: 'dark' | 'light';
  lineA: string;
  lineB: string;
  badge: string;
  description: string;
  actionText: string;
  bgImage?: string;
}

const HUB_MODULES: HubModuleConfig[] = [
  {
    id: 'campaigns',
    theme: 'dark',
    lineA: 'Mesa dos',
    lineB: 'Apostadores',
    badge: 'MESA DE CARVALHO & FICHAS',
    description: 'Junte-se a uma mesa compartilhada pela chave do mestre ou crie e conduza sua própria saga com fichas, lore e regras.',
    actionText: 'Acessar Mesa dos Apostadores',
    bgImage: '/assets/banner_mesa_alchemist.png', // Ilustração do Alquimista e Orbe fornecida pelo usuário
  },
  {
    id: 'sketch',
    theme: 'light',
    lineA: 'Telas',
    lineB: 'do Alaúde',
    badge: 'ATELIÊ DO BARDO & PINTURA',
    description: 'Ilustre itens lendários, mapas arcanos, criaturas e heróis com o traço aveludado e a imaginação do bardo Orlan Pena-Fina.',
    actionText: 'Abrir Telas do Alaúde',
    bgImage: '/assets/bardo_portrait.jpg',
  },
  {
    id: 'urd',
    theme: 'dark',
    lineA: 'Urd',
    lineB: 'o Taberneiro',
    badge: 'LAREIRA DE PEDRA & ORÁCULO',
    description: 'Consulte a sabedoria ancestral de Urd, desvende profecias, ouça os boatos sussurrados na lareira e crie crônicas vivas.',
    actionText: 'Consultar o Taberneiro',
    bgImage: '/assets/urd_portrait.jpg',
  },
  {
    id: 'chat',
    theme: 'light',
    lineA: 'Recanto dos',
    lineB: 'Bardos',
    badge: 'SCRIPTORIUM & CHAT AO VIVO',
    description: 'Comunique-se em tempo real com taverneiros e companheiros de aventura, planeje suas sessões e troque mensagens diretas.',
    actionText: 'Entrar no Recanto dos Bardos',
    bgImage: '/assets/tavern_bg.jpg',
  },
];

export const TavernHubView: React.FC<TavernHubViewProps> = ({
  onNavigate,
}) => {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <div className="hub-checkerboard" role="main" aria-label="Portal de Opções da Taberna Digital">
      {/* Os 4 Banners Gigantes de Salas da Taverna com Arte de Fundo e Legendas */}
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
            {/* Arte de Fundo Borrada respeitando a paleta e a atmosfera medieval */}
            {mod.bgImage && (
              <div className="hub-banner__bg-art" aria-hidden="true">
                <img
                  src={mod.bgImage}
                  alt=""
                  className="hub-banner__bg-img"
                  loading={isFirst ? 'eager' : 'lazy'}
                />
                <div className="hub-banner__bg-overlay" />
              </div>
            )}

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
              </button>

              {/* Legenda dos Banners Restaurada (Design limpo, sem balões ou bordas pesadas) */}
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
