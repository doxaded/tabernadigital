import React from 'react';
import { Shield, Palette, Beer, Scroll, ArrowLeft } from 'lucide-react';

export type TavernRoomTab = 'campaigns' | 'sketch' | 'urd' | 'chat';

interface TavernRoomTabBarProps {
  activeTab: TavernRoomTab;
  onSelectTab: (tab: TavernRoomTab) => void;
  onBackToHub: () => void;
}

const ROOM_TABS: Array<{
  id: TavernRoomTab;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
}> = [
  {
    id: 'campaigns',
    title: 'Mesa dos Apostadores',
    subtitle: 'MESA DE CARVALHO & MURAL',
    icon: <Shield size={18} strokeWidth={2.2} />,
    badge: 'MESAS'
  },
  {
    id: 'sketch',
    title: 'Telas do Alaúde',
    subtitle: 'ATELIÊ DO BARDO & CAVALETE',
    icon: <Palette size={18} strokeWidth={2.2} />,
    badge: 'ARTE'
  },
  {
    id: 'urd',
    title: 'Urd, o Taberneiro',
    subtitle: 'BALCÃO DE PEDRA & LAREIRA',
    icon: <Beer size={18} strokeWidth={2.2} />,
    badge: 'ORÁCULO'
  },
  {
    id: 'chat',
    title: 'Canto dos Bardos',
    subtitle: 'SCRIPTORIUM & MISSIVAS',
    icon: <Scroll size={18} strokeWidth={2.2} />,
    badge: 'AO VIVO'
  }
];

export const TavernRoomTabBar: React.FC<TavernRoomTabBarProps> = ({
  activeTab,
  onSelectTab,
  onBackToHub
}) => {
  return (
    <nav className="tavern-room-bar" aria-label="Navegação entre Salas da Taverna">
      <div className="tavern-room-bar__inner">
        {/* Linha 1: Botão de retorno ao Menu Principal */}
        <div className="tavern-room-bar__top-row">
          <button
            type="button"
            onClick={onBackToHub}
            className="tavern-room-bar__back-btn"
            title="Retornar aos grandes banners do Menu Inicial"
          >
            <ArrowLeft size={14} />
            <span>Menu Inicial</span>
          </button>
        </div>

        {/* Linha 2: As 4 Abas Únicas de Salas em Grid de 4 Colunas Proporcionais */}
        <div className="tavern-room-bar__tabs-grid" role="tablist">
          {ROOM_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
                className={`tavern-room-tab-card tavern-room-tab-card--${tab.id} ${isActive ? 'is-active' : ''}`}
                title={`Entrar na sala: ${tab.title}`}
              >
                <span className="tavern-room-tab-card__icon" aria-hidden="true">
                  {tab.icon}
                </span>
                <div className="tavern-room-tab-card__content">
                  <span className="tavern-room-tab-card__title">{tab.title}</span>
                  <span className="tavern-room-tab-card__subtitle">{tab.subtitle}</span>
                </div>
                {tab.badge && (
                  <span className="tavern-room-tab-card__badge">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
