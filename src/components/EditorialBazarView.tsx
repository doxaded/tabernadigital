import React, { useState } from 'react';
import { Sparkles, Coins, Gift, Check, Shield, Crown } from 'lucide-react';
import { UserProfile, ShopTitleItem, ShopFrameItem, ShopItemRarity } from '../types';
import {
  SHOP_TITLES,
  SHOP_FRAMES,
  getEffectiveGold,
  isItemUnlocked,
  isItemEquipped,
  isDailyRewardAvailable,
  DAILY_REWARD_GOLD,
  DEFAULT_TITLE_NAME,
  DEFAULT_FRAME_ID
} from '../services/tavernShopCatalog';
import { AvatarFrame } from './AvatarFrame';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialBazarViewProps {
  onBack?: () => void;
  currentUser: UserProfile | null;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onOpenAuth?: () => void;
}

type TabFilter = 'all' | 'titles' | 'frames';

export const EditorialBazarView: React.FC<EditorialBazarViewProps> = ({
  onBack,
  currentUser,
  onSaveProfile,
  onOpenAuth,
}) => {
  const [filter, setFilter] = useState<TabFilter>('all');
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const currentGold = currentUser ? getEffectiveGold(currentUser) : 0;
  const equippedTitle = currentUser?.title || DEFAULT_TITLE_NAME;
  const equippedFrameId = currentUser?.frameId || DEFAULT_FRAME_ID;

  const notify = (text: string, ok = true) => {
    setFeedback({ text, ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleClaimDaily = async () => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    if (!isDailyRewardAvailable(currentUser) || isProcessing) return;

    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      const newGold = currentGold + DAILY_REWARD_GOLD;
      const nowIso = new Date().toISOString();
      await onSaveProfile({
        gold: newGold,
        lastDailyRewardDate: nowIso,
      });
      notify(`Baú da lareira aberto: +${DAILY_REWARD_GOLD} Peças de Ouro adicionadas ao seu bornal!`);
    } catch {
      notify('Falha ao recolher ouro da lareira.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyTitle = async (item: ShopTitleItem) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    if (isProcessing) return;
    if (currentGold < item.price) {
      notify(`Ouro insuficiente! Necessita de mais ${item.price - currentGold} PO.`, false);
      return;
    }

    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      const unlocked = [...(currentUser.unlockedTitles || ['Iniciante da Taberna'])];
      if (!unlocked.includes(item.name)) unlocked.push(item.name);

      await onSaveProfile({
        gold: currentGold - item.price,
        title: item.name,
        unlockedTitles: unlocked,
      });
      notify(`Título "${item.name}" adquirido e consagrado ao seu herói!`);
    } catch {
      notify('Falha ao adquirir título.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquipTitle = async (titleName: string) => {
    if (!currentUser || isProcessing) return;
    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      await onSaveProfile({ title: titleName });
      notify(`Título "${titleName}" empunhado com honra.`);
    } catch {
      notify('Falha ao trocar título.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyFrame = async (item: ShopFrameItem) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    if (isProcessing) return;
    if (currentGold < item.price) {
      notify(`Ouro insuficiente! Necessita de mais ${item.price - currentGold} PO.`, false);
      return;
    }

    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      const unlocked = [...(currentUser.unlockedFrames || ['default'])];
      if (!unlocked.includes(item.id)) unlocked.push(item.id);

      await onSaveProfile({
        gold: currentGold - item.price,
        frameId: item.id,
        unlockedFrames: unlocked,
      });
      notify(`Moldura "${item.name}" adquirida e engastada!`);
    } catch {
      notify('Falha ao adquirir moldura.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquipFrame = async (frameId: string) => {
    if (!currentUser || isProcessing) return;
    try {
      setIsProcessing(true);
      tavernAudio.playBellChime();
      await onSaveProfile({ frameId });
      notify(`Moldura forjada ao redor de seu avatar.`);
    } catch {
      notify('Falha ao equipar moldura.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  const canClaimDaily = currentUser ? isDailyRewardAvailable(currentUser) : false;

  return (
    <main className="editorial-room-container">
      {/* 2. Cabeçalho Interno da Sala em Linha Única */}
      <div className="editorial-header-bar">
        <button
          onClick={() => {
            if (onBack) onBack();
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 0',
            cursor: 'pointer',
            color: 'inherit',
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '14px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'opacity 0.2s ease',
          }}
          className="hover:opacity-100"
        >
          ← Voltar à Galeria
        </button>

        {/* Sub-abas do Bazar em Segmented Control */}
        <div className="editorial-segmented-control dark-theme">
          {[
            { id: 'all', label: 'Todo o Bazar' },
            { id: 'titles', label: 'Títulos de Honra' },
            { id: 'frames', label: 'Molduras Místicas' },
          ].map((t) => {
            const isActive = filter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as TabFilter)}
                className={`editorial-segmented-item ${isActive ? 'is-active' : ''}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            backgroundColor: feedback.ok ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedback.ok ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* 3. Layout Assimétrico Estilo Kerbache HR / Claude (8 colunas / 4 colunas) */}
      <div className="editorial-grid-12">
        {/* Coluna Principal (Esquerda - 8 colunas) */}
        <div>
          <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px' }}>
            SALA V • MERCADO MEDIEVAL
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
              fontSize: 'clamp(32px, 4.5vw, 44px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              color: 'inherit',
            }}
          >
            Bazar de Relíquias
          </h1>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '17px',
              lineHeight: '1.7',
              maxWidth: '580px',
              margin: '0 0 32px 0',
              opacity: 0.8,
            }}
          >
            Artefatos lendários, títulos nobiliárquicos e molduras místicas forjadas para distinguir seu herói nos anais da estalagem.
          </p>

          {/* SEÇÃO 1: TÍTULOS DE HONRA */}
          {(filter === 'all' || filter === 'titles') && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Crown size={17} /> Títulos de Nobreza & Glória
                </h3>
                <span style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.6 }}>Reconhecimento nos anais</span>
              </div>

              <div className="editorial-cards-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {SHOP_TITLES.map((title) => {
                  const isUnlocked = isItemUnlocked(currentUser, 'title', title.name);
                  const isEquipped = isItemEquipped(currentUser, 'title', title.name);

                  return (
                    <div
                      key={title.id}
                      onMouseEnter={() => setPreviewTitle(title.name)}
                      onMouseLeave={() => setPreviewTitle(null)}
                      className="editorial-claude-card dark-theme"
                      style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="editorial-pill-tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{title.rarity}</span>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '13px', opacity: 0.85 }}>{title.price} PO</span>
                        </div>
                        <div style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontSize: '20px', fontWeight: 600, fontStyle: 'italic', marginBottom: '6px' }}>
                          "{title.name}"
                        </div>
                        <p style={{ fontSize: '13px', opacity: 0.7, margin: 0, lineHeight: '1.6' }}>
                          {title.description}
                        </p>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>
                            <Check size={14} /> Consagrado
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleEquipTitle(title.name)}
                            className="editorial-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            Empunhar Título
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyTitle(title)}
                            className="editorial-btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            Adquirir ({title.price} PO)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEÇÃO 2: MOLDURAS MÍSTICAS */}
          {(filter === 'all' || filter === 'frames') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={17} /> Molduras Místicas & Forjadas
                </h3>
                <span style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.6 }}>Aros arcanos para seu retrato</span>
              </div>

              <div className="editorial-cards-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {SHOP_FRAMES.map((frame) => {
                  const isUnlocked = isItemUnlocked(currentUser, 'frame', frame.id);
                  const isEquipped = isItemEquipped(currentUser, 'frame', frame.id);

                  return (
                    <div
                      key={frame.id}
                      onMouseEnter={() => setPreviewFrameId(frame.id)}
                      onMouseLeave={() => setPreviewFrameId(null)}
                      className="editorial-claude-card dark-theme"
                      style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'space-between', gap: '16px' }}
                    >
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="editorial-pill-tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{frame.rarity}</span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '13px', opacity: 0.85 }}>{frame.price} PO</span>
                      </div>

                      <div style={{ margin: '8px 0' }}>
                        <AvatarFrame
                          user={currentUser}
                          frameId={frame.id}
                          size="lg"
                        />
                      </div>

                      <div>
                        <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                          {frame.name}
                        </div>
                        <p style={{ fontSize: '12px', opacity: 0.7, margin: 0, lineHeight: '1.5' }}>
                          {frame.description}
                        </p>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>
                            <Check size={14} /> Engastada
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleEquipFrame(frame.id)}
                            className="editorial-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            Engastar no Retrato
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyFrame(frame)}
                            className="editorial-btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            Adquirir ({frame.price} PO)
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

        {/* Coluna Lateral (Direita - 4 colunas): Card Editorial Claude */}
        <aside className="editorial-claude-card dark-theme">
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '14px', fontWeight: 600 }}>
            Tesouro do Viajante
          </div>

          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Saldo em Ouro</span>
            <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', color: '#D4A373' }}>
              <Coins size={16} /> {currentGold.toLocaleString('pt-BR')} PO
            </span>
          </div>

          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Título Ativo</span>
            <span className="editorial-meta-value" style={{ fontStyle: 'italic', fontSize: '13px' }}>
              "{previewTitle || equippedTitle}"
            </span>
          </div>

          <div style={{ marginTop: '20px', marginBottom: '14px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', marginBottom: '8px' }}>
              <AvatarFrame
                user={currentUser}
                frameId={previewFrameId || equippedFrameId}
                size="lg"
              />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Aventureiro'}
            </div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.65 }}>
              Visualização de Retrato
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '18px', marginTop: '16px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '10px' }}>
              Lareira da Estalagem
            </div>

            <button
              onClick={handleClaimDaily}
              disabled={!canClaimDaily || isProcessing}
              className={canClaimDaily ? 'editorial-btn-primary' : 'editorial-btn-secondary'}
              style={{ width: '100%', justifyContent: 'center', opacity: canClaimDaily ? 1 : 0.4 }}
            >
              <Gift size={14} />
              {canClaimDaily
                ? `Baú da Lareira (+${DAILY_REWARD_GOLD} PO)`
                : 'Coletado Hoje'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};
