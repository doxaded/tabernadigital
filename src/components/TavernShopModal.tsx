import React, { useState } from 'react';
import { UserProfile, ShopTitleItem, ShopFrameItem, ShopItemRarity } from '../types';
import {
  SHOP_TITLES,
  SHOP_FRAMES,
  getEffectiveGold,
  isItemUnlocked,
  isItemEquipped,
  isDailyRewardAvailable,
  getTimeUntilNextDaily,
  DAILY_REWARD_GOLD,
  DEFAULT_TITLE_NAME,
  DEFAULT_FRAME_ID
} from '../services/tavernShopCatalog';
import { AvatarFrame } from './AvatarFrame';
import { X, Sparkles, Coins, Gift, Check, Shield, Crown } from 'lucide-react';

interface TavernShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

type TabType = 'all' | 'titles' | 'frames';

export const TavernShopModal: React.FC<TavernShopModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !currentUser) return null;

  const currentGold = getEffectiveGold(currentUser);
  const equippedTitle = currentUser.title || DEFAULT_TITLE_NAME;
  const equippedFrameId = currentUser.frameId || DEFAULT_FRAME_ID;

  // Mostra mensagem temporária
  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 3200);
  };

  // Coleta do baú diário da lareira
  const handleClaimDailyReward = async () => {
    if (!isDailyRewardAvailable(currentUser) || isProcessing) return;

    try {
      setIsProcessing(true);
      const newGold = currentGold + DAILY_REWARD_GOLD;
      const nowIso = new Date().toISOString();

      await onSaveProfile({
        gold: newGold,
        lastDailyRewardDate: nowIso
      });

      showNotification(`Você abriu o Baú da Lareira e recebeu +${DAILY_REWARD_GOLD} Peças de Ouro!`);
    } catch {
      showNotification('Erro ao coletar recompensa diária. Tente novamente.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Compra de título
  const handleBuyTitle = async (item: ShopTitleItem) => {
    if (isProcessing) return;
    if (currentGold < item.price) {
      showNotification(`Ouro insuficiente! Você precisa de mais ${item.price - currentGold} PO.`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const newGold = currentGold - item.price;
      const currentUnlocked = currentUser.unlockedTitles || [];
      const updatedUnlocked = Array.from(new Set([...currentUnlocked, item.id, item.name]));

      await onSaveProfile({
        gold: newGold,
        unlockedTitles: updatedUnlocked,
        title: item.name // Já equipa automaticamente
      });

      setPreviewTitle(item.name);
      showNotification(`Parabéns! Título "${item.name}" adquirido e equipado com sucesso!`);
    } catch {
      showNotification('Falha ao processar a compra do título.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Equipar título
  const handleEquipTitle = async (item: ShopTitleItem) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await onSaveProfile({
        title: item.name
      });
      setPreviewTitle(item.name);
      showNotification(`Título "${item.name}" equipado!`);
    } catch {
      showNotification('Falha ao equipar título.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Compra de moldura
  const handleBuyFrame = async (item: ShopFrameItem) => {
    if (isProcessing) return;
    if (currentGold < item.price) {
      showNotification(`Ouro insuficiente! Você precisa de mais ${item.price - currentGold} PO.`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const newGold = currentGold - item.price;
      const currentUnlocked = currentUser.unlockedFrames || [];
      const updatedUnlocked = Array.from(new Set([...currentUnlocked, item.id]));

      await onSaveProfile({
        gold: newGold,
        unlockedFrames: updatedUnlocked,
        frameId: item.id // Já equipa automaticamente
      });

      setPreviewFrameId(item.id);
      showNotification(`Moldura "${item.name}" adquirida e equipada com sucesso!`);
    } catch {
      showNotification('Falha ao processar a compra da moldura.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Equipar moldura
  const handleEquipFrame = async (item: ShopFrameItem) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await onSaveProfile({
        frameId: item.id
      });
      setPreviewFrameId(item.id);
      showNotification(`Moldura "${item.name}" equipada!`);
    } catch {
      showNotification('Falha ao equipar moldura.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRarityBadgeStyle = (rarity: ShopItemRarity) => {
    switch (rarity) {
      case 'lendario':
        return {
          background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.3) 0%, rgba(136, 19, 55, 0.4) 100%)',
          color: '#f43f5e',
          border: '1px solid rgba(244, 63, 94, 0.5)'
        };
      case 'epico':
        return {
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(107, 33, 168, 0.4) 100%)',
          color: '#c084fc',
          border: '1px solid rgba(192, 132, 252, 0.5)'
        };
      case 'raro':
        return {
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.4) 100%)',
          color: '#fbbf24',
          border: '1px solid rgba(251, 191, 36, 0.5)'
        };
      default:
        return {
          background: 'rgba(113, 113, 122, 0.2)',
          color: '#d4d4d8',
          border: '1px solid rgba(113, 113, 122, 0.4)'
        };
    }
  };

  const activePreviewTitle = previewTitle || equippedTitle;
  const activePreviewFrameId = previewFrameId || equippedFrameId;
  const dailyAvailable = isDailyRewardAvailable(currentUser);
  const dailyCountdown = getTimeUntilNextDaily(currentUser);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          backgroundColor: '#1b120a',
          backgroundImage:
            'radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 40%), linear-gradient(180deg, #24160d 0%, #150b06 100%)',
          border: '2px solid #5a3518',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'var(--font-cinzel), Georgia, serif',
          color: '#fef3c7'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Empório */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1.5px solid rgba(245, 158, 11, 0.25)',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.14) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fbbf24',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)'
              }}
            >
              <Coins size={24} style={{ color: '#fffbeb', filter: 'drop-shadow(0 0 4px #fbbf24)' }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: 0,
                  color: '#fef3c7',
                  letterSpacing: '0.04em',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
                }}
              >
                Bazar da Taverna
              </h2>
              <p
                style={{
                  fontSize: '11px',
                  margin: '2px 0 0 0',
                  color: '#d4b896',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.02em'
                }}
              >
                Gaste suas Peças de Ouro (PO) em honras, títulos e molduras exclusivas para seu aventureiro!
              </p>
            </div>
          </div>

          {/* Bolsa de Moedas e Botão Fechar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Bolsa de Ouro Reluzente */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(120, 53, 15, 0.3) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)'
              }}
            >
              <Coins size={18} style={{ color: '#fbbf24' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    color: '#fbbf24',
                    letterSpacing: '0.04em',
                    lineHeight: 1
                  }}
                >
                  {currentGold.toLocaleString('pt-BR')} PO
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: '#fef3c7',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    opacity: 0.8
                  }}
                >
                  Peças de Ouro
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(40, 20, 10, 0.8)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#d4b896',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(40, 20, 10, 0.8)';
                e.currentTarget.style.color = '#d4b896';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notificação Toast Flutuante */}
        {actionMessage && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'var(--font-body)',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <Sparkles size={16} />
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Corpo do Bazar (Dividido entre Vitrine e Manequim) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            backgroundColor: 'rgba(10, 5, 2, 0.5)'
          }}
        >
          {/* Painel Esquerdo: Catálogo com Abas e Baú Diário */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(245, 158, 11, 0.15)'
            }}
          >
            {/* Banner: Baú Diário da Lareira */}
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: dailyAvailable
                  ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(88, 28, 135, 0.35) 100%)'
                  : 'rgba(30, 20, 15, 0.6)',
                border: dailyAvailable
                  ? '1.5px solid #f59e0b'
                  : '1px solid rgba(120, 113, 108, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: dailyAvailable ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    filter: dailyAvailable ? 'drop-shadow(0 0 8px #f59e0b)' : 'grayscale(0.8)'
                  }}
                >
                  <Gift size={28} color="#f59e0b" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
                    Baú da Lareira (Recompensa Diária)
                  </h4>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '11px',
                      color: '#d4b896',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {dailyAvailable
                      ? `Venha se aquecer e receba +${DAILY_REWARD_GOLD} PO de graça a cada 24 horas!`
                      : `Você já abriu seu baú hoje! Retorne em ${dailyCountdown || 'algumas horas'} para coletar mais ouro.`}
                  </p>
                </div>
              </div>

              {dailyAvailable ? (
                <button
                  onClick={handleClaimDailyReward}
                  disabled={isProcessing}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                    color: '#1a0e05',
                    fontWeight: 900,
                    fontSize: '12px',
                    letterSpacing: '0.04em',
                    border: '1px solid #fcd34d',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Gift size={15} />
                  Abrir Baú (+50 PO)
                </button>
              ) : (
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    color: '#a8a29e',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  Disponível em {dailyCountdown || 'breve'}
                </div>
              )}
            </div>

            {/* Abas de Navegação */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '18px',
                borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
                paddingBottom: '10px'
              }}
            >
              {[
                { id: 'all', label: 'Todos os Artigos', icon: <Sparkles size={14} /> },
                { id: 'titles', label: 'Títulos de Honra', icon: <Crown size={14} /> },
                { id: 'frames', label: 'Molduras de Retrato', icon: <Shield size={14} /> }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                      color: isActive ? '#fef3c7' : '#a8a29e',
                      border: isActive ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Catálogo de Títulos */}
            {(activeTab === 'all' || activeTab === 'titles') && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Crown size={18} style={{ color: '#fbbf24' }} />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fef3c7' }}>
                    Títulos de Honra
                  </h3>
                  <span style={{ fontSize: '11px', color: '#a8a29e', fontFamily: 'var(--font-body)' }}>
                    (Exibidos em seus chats, ficha e perfil)
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {SHOP_TITLES.map((title) => {
                    const isUnlocked = isItemUnlocked(currentUser, 'title', title.id);
                    const isEquipped = isItemEquipped(currentUser, 'title', title.id);
                    const canAfford = currentGold >= title.price;
                    const rarityStyle = getRarityBadgeStyle(title.rarity);

                    return (
                      <div
                        key={title.id}
                        onClick={() => setPreviewTitle(title.name)}
                        style={{
                          padding: '14px',
                          borderRadius: '14px',
                          background: 'linear-gradient(180deg, rgba(40, 24, 14, 0.7) 0%, rgba(20, 12, 7, 0.9) 100%)',
                          border:
                            activePreviewTitle === title.name
                              ? '1.5px solid #fbbf24'
                              : '1px solid rgba(245, 158, 11, 0.15)',
                          boxShadow:
                            activePreviewTitle === title.name
                              ? '0 4px 14px rgba(0, 0, 0, 0.5)'
                              : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '6px'
                            }}
                          >
                            <Shield size={18} color="#f59e0b" />
                            <span
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontWeight: 800,
                                ...rarityStyle
                              }}
                            >
                              {title.rarity}
                            </span>
                          </div>

                          <h4
                            style={{
                              margin: '0 0 4px 0',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#fef3c7'
                            }}
                          >
                            {title.name}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '11px',
                              color: '#a89d8d',
                              fontFamily: 'var(--font-body)',
                              lineHeight: 1.3
                            }}
                          >
                            {title.description}
                          </p>
                        </div>

                        {/* Preço e Botão de Ação */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(245, 158, 11, 0.1)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Coins size={13} style={{ color: '#fbbf24' }} />
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>
                              {title.price === 0 ? 'Grátis' : `${title.price} PO`}
                            </span>
                          </div>

                          {isEquipped ? (
                            <button
                              disabled
                              style={{
                                padding: '5px 12px',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                                border: '1px solid #10b981',
                                color: '#10b981',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'default'
                              }}
                            >
                              <Check size={12} />
                              Equipado
                            </button>
                          ) : isUnlocked ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquipTitle(title);
                              }}
                              disabled={isProcessing}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#fef3c7',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Equipar
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyTitle(title);
                              }}
                              disabled={!canAfford || isProcessing}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '9999px',
                                background: canAfford
                                  ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                                  : 'rgba(60, 40, 30, 0.5)',
                                border: canAfford ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid #573b2a',
                                color: canAfford ? '#1f130b' : '#78685b',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Comprar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catálogo de Molduras */}
            {(activeTab === 'all' || activeTab === 'frames') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Shield size={18} style={{ color: '#fbbf24' }} />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fef3c7' }}>
                    Molduras de Retrato
                  </h3>
                  <span style={{ fontSize: '11px', color: '#a8a29e', fontFamily: 'var(--font-body)' }}>
                    (Bordas místicas ao redor da foto de perfil em todo o reino)
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {SHOP_FRAMES.map((frame) => {
                    const isUnlocked = isItemUnlocked(currentUser, 'frame', frame.id);
                    const isEquipped = isItemEquipped(currentUser, 'frame', frame.id);
                    const canAfford = currentGold >= frame.price;
                    const rarityStyle = getRarityBadgeStyle(frame.rarity);

                    return (
                      <div
                        key={frame.id}
                        onClick={() => setPreviewFrameId(frame.id)}
                        style={{
                          padding: '14px',
                          borderRadius: '14px',
                          background: 'linear-gradient(180deg, rgba(40, 24, 14, 0.7) 0%, rgba(20, 12, 7, 0.9) 100%)',
                          border:
                            activePreviewFrameId === frame.id
                              ? '1.5px solid #fbbf24'
                              : '1px solid rgba(245, 158, 11, 0.15)',
                          boxShadow:
                            activePreviewFrameId === frame.id
                              ? '0 4px 14px rgba(0, 0, 0, 0.5)'
                              : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '8px'
                            }}
                          >
                            <AvatarFrame
                              user={currentUser}
                              frameId={frame.id}
                              size="sm"
                            />
                            <span
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontWeight: 800,
                                ...rarityStyle
                              }}
                            >
                              {frame.rarity}
                            </span>
                          </div>

                          <h4
                            style={{
                              margin: '0 0 4px 0',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#fef3c7'
                            }}
                          >
                            {frame.name}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '11px',
                              color: '#a89d8d',
                              fontFamily: 'var(--font-body)',
                              lineHeight: 1.3
                            }}
                          >
                            {frame.description}
                          </p>
                        </div>

                        {/* Preço e Botão de Ação */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(245, 158, 11, 0.1)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Coins size={13} style={{ color: '#fbbf24' }} />
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>
                              {frame.price === 0 ? 'Grátis' : `${frame.price} PO`}
                            </span>
                          </div>

                          {isEquipped ? (
                            <button
                              disabled
                              style={{
                                padding: '5px 12px',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                                border: '1px solid #10b981',
                                color: '#10b981',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'default'
                              }}
                            >
                              <Check size={12} />
                              Equipado
                            </button>
                          ) : isUnlocked ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquipFrame(frame);
                              }}
                              disabled={isProcessing}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#fef3c7',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Equipar
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyFrame(frame);
                              }}
                              disabled={!canAfford || isProcessing}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '9999px',
                                background: canAfford
                                  ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                                  : 'rgba(60, 40, 30, 0.5)',
                                border: canAfford ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid #573b2a',
                                color: canAfford ? '#1f130b' : '#78685b',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Comprar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Painel Direito: Manequim / Espelho Mágico do Aventureiro (Live Preview) */}
          <div
            style={{
              width: '280px',
              minWidth: '280px',
              padding: '24px 20px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(18, 10, 5, 0.9)',
              background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.08) 0%, rgba(15, 8, 4, 0.95) 100%)'
            }}
          >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#fbbf24',
                  marginBottom: '16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} />
                Espelho do Aventureiro
              </div>

              {/* Avatar com Moldura Selecionada */}
              <div style={{ marginBottom: '16px', marginTop: '10px' }}>
                <AvatarFrame
                  user={currentUser}
                  frameId={activePreviewFrameId}
                  size="2xl"
                  showTitleBadge={false}
                />
              </div>

              {/* Nome do Aventureiro */}
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#fef3c7',
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                  letterSpacing: '0.02em'
                }}
              >
                {currentUser.displayName || currentUser.email.split('@')[0]}
              </h3>

              {/* Título Selecionado */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(120, 53, 15, 0.3) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)'
                }}
              >
                <Shield size={13} color="#f59e0b" />
                <span>{activePreviewTitle}</span>
              </div>

              {/* Prévia de como aparece na mensagem do chat */}
              <div
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(28, 16, 9, 0.8)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ fontSize: '10px', color: '#a89d8d', marginBottom: '8px', fontWeight: 600 }}>
                  PRÉVIA EM MENSAGENS DE CHAT:
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <AvatarFrame
                    user={currentUser}
                    frameId={activePreviewFrameId}
                    size="sm"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#fef3c7' }}>
                        {currentUser.displayName || 'Você'}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '1px 5px',
                          borderRadius: '8px'
                        }}
                      >
                        {activePreviewTitle}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '11px',
                        color: '#d4b896',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.3
                      }}
                    >
                      "Que os dados rolem a nosso favor nesta jornada!"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dica da Taverna no Rodapé do Espelho */}
            <div
              style={{
                width: '100%',
                paddingTop: '16px',
                borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                textAlign: 'center'
              }}
            >
              <p
                style={{
                  fontSize: '10.5px',
                  color: '#8c7d6e',
                  fontFamily: 'var(--font-body)',
                  margin: 0,
                  lineHeight: 1.4
                }}
              >
                Títulos e molduras equipados são exibidos para todos os seus companheiros de mesa e no Recanto dos Bardos!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
