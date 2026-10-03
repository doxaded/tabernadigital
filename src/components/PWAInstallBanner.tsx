import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Mostra suavemente após 3 segundos caso não seja instalado ainda
    const timer = setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('Para instalar no iOS/Safari: Toque em "Compartilhar" e selecione "Adicionar à Tela de Início". No Chrome/Android: Toque no menu do navegador (três pontinhos) e clique em "Instalar aplicativo".');
    }
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '72px',
      left: '16px',
      right: '16px',
      maxWidth: '460px',
      margin: '0 auto',
      backgroundColor: '#24150b',
      border: '2px solid var(--amber-torch)',
      borderRadius: '10px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(245, 158, 11, 0.3)',
      zIndex: 850,
      animation: 'modalEnter 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: '#3e2412',
          border: '1px solid var(--amber-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Smartphone size={18} color="#fbbf24" />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fef3c7', lineHeight: 1.2 }}>
            Instalar Taberna Digital
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            Acesso offline e tela cheia na sua mesa de jogo
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={handleInstall}
          className="btn-tavern btn-primary"
          style={{ padding: '6px 12px', fontSize: '11px', minHeight: '34px' }}
        >
          <Download size={13} />
          <span>Instalar</span>
        </button>

        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
