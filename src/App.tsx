import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CampaignsView } from './components/CampaignsView';
import { SketchStudioView } from './components/SketchStudioView';
import { UrdChatView } from './components/UrdChatView';
import { MasterScreenView } from './components/MasterScreenView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { storageService, ADMIN_EMAIL } from './services/storage';
import { firebaseAuthService } from './services/firebase';
import { Campaign, CharacterSheet, LoreEntry, RuleDocument, SketchAsset, UserProfile } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storageService.getCurrentUser());
  const [users, setUsers] = useState<UserProfile[]>(() => storageService.getUsers());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storageService.getCampaigns());
  const [sketches, setSketches] = useState<SketchAsset[]>(() => storageService.getSketches());
  const [urdMessages, setUrdMessages] = useState(() => storageService.getUrdMessages());

  const [activeTab, setActiveTab] = useState<'campaigns' | 'sketch' | 'urd'>('campaigns');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(() => campaigns[0]?.id || null);
  const [masterScreenCampaignId, setMasterScreenCampaignId] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => !storageService.getCurrentUser());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Sincroniza dados com o storage
  const reloadData = () => {
    setUsers(storageService.getUsers());
    setCampaigns(storageService.getCampaigns());
    setSketches(storageService.getSketches());
    setUrdMessages(storageService.getUrdMessages());
    const refreshedCurrent = storageService.getCurrentUser();
    setCurrentUser(refreshedCurrent);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handlers de Autenticação
  const handleLogin = (email: string, displayName?: string) => {
    const res = storageService.loginUser(email);
    setCurrentUser(res);
    reloadData();
  };

  const handleLogout = async () => {
    await firebaseAuthService.logout();
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Handlers Administrativos (Exclusivos para henrique.v.berbert@gmail.com)
  const handleApproveUser = (uid: string) => {
    if (!currentUser) return;
    const ok = storageService.approveUser(uid, currentUser.email);
    if (ok) {
      reloadData();
    }
  };

  const handleRejectUser = (uid: string) => {
    if (!currentUser) return;
    const ok = storageService.rejectUser(uid, currentUser.email);
    if (ok) {
      reloadData();
    }
  };

  // Handlers de Campanhas
  const handleCreateCampaign = (name: string, description: string, system: string, coverUrl?: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const res = storageService.createCampaign(currentUser, name, description, system, coverUrl);
    if (res.success) {
      reloadData();
      if (res.campaign) {
        setSelectedCampaignId(res.campaign.id);
      }
    }
    return res;
  };

  const handleUpdateCampaign = (id: string, data: Partial<Pick<Campaign, 'name' | 'coverUrl' | 'description' | 'system'>>) => {
    if (!currentUser) return;
    storageService.updateCampaign(id, currentUser, data);
    reloadData();
  };

  const handleDeleteCampaign = (id: string) => {
    if (!currentUser) return;
    storageService.deleteCampaign(id, currentUser);
    reloadData();
    const remaining = storageService.getCampaigns();
    setSelectedCampaignId(remaining[0]?.id || null);
  };

  // Handlers de Divisórias (Fichas, Lore, Regras)
  const handleAddSheet = (campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>) => {
    storageService.addSheet(campaignId, sheet);
    reloadData();
  };

  const handleUpdateSheet = (campaignId: string, sheetId: string, data: Partial<CharacterSheet>) => {
    storageService.updateSheet(campaignId, sheetId, data);
    reloadData();
  };

  const handleDeleteSheet = (campaignId: string, sheetId: string) => {
    storageService.deleteSheet(campaignId, sheetId);
    reloadData();
  };

  const handleAddLore = (campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>) => {
    storageService.addLore(campaignId, lore);
    reloadData();
  };

  const handleDeleteLore = (campaignId: string, loreId: string) => {
    storageService.deleteLore(campaignId, loreId);
    reloadData();
  };

  const handleAddRule = (campaignId: string, rule: Omit<RuleDocument, 'id' | 'campaignId'>) => {
    storageService.addRule(campaignId, rule);
    reloadData();
  };

  const handleDeleteRule = (campaignId: string, ruleId: string) => {
    storageService.deleteRule(campaignId, ruleId);
    reloadData();
  };

  // Handlers do Sketch Studio
  const handleSaveSketch = (sketch: Omit<SketchAsset, 'id' | 'createdAt'>) => {
    const item = storageService.saveSketch(sketch);
    reloadData();
    return item;
  };

  const handleDeleteSketch = (id: string) => {
    storageService.deleteSketch(id);
    reloadData();
  };

  // Handlers do Urd
  const handleSendUrdMessage = (sender: 'user' | 'urd', text: string) => {
    storageService.addUrdMessage(sender, text);
    reloadData();
  };

  const handleClearUrdChat = () => {
    storageService.clearUrdChat();
    reloadData();
  };

  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setMasterScreenCampaignId(null);
          setActiveTab(tab);
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="content-with-bottom-nav" style={{ flex: 1, paddingBottom: '40px' }}>
        {/* Caso 1: Usuário não autenticado */}
        {!currentUser && (
          <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
            <div className="parchment-card" style={{ padding: '40px 28px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--wood-dark)',
                border: '2px solid var(--amber-torch)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(245, 158, 11, 0.4)'
              }}>
                <img src="/icon.svg" alt="Taberna Digital" style={{ width: '40px', height: '40px' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                Bem-vindo à Taberna Digital
              </h2>
              <p className="font-lore" style={{ fontSize: '17px', color: 'var(--ink-dark)', lineHeight: 1.6, marginBottom: '24px' }}>
                "Empurre as portas duplas de carvalho, sinta o aroma de cerveja preta e carne assada na lareira.
                Aqui repousam as crônicas da sua mesa de RPG, as fichas dos seus heróis e a sabedoria do oráculo Urd."
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-tavern btn-primary"
                style={{ fontSize: '14px', padding: '12px 28px' }}
              >
                Identificar-se na Estalagem
              </button>
            </div>
          </div>
        )}

        {/* Caso 2: Usuário com status PENDENTE (Requisito Mandatório: Aprovação por Área Administrativa) */}
        {currentUser && currentUser.status === 'PENDING' && (
          <PendingApprovalScreen
            user={currentUser}
            onRefresh={reloadData}
            onLogout={handleLogout}
          />
        )}

        {/* Caso 3: Usuário APROVADO (Acesso completo aos módulos) */}
        {currentUser && currentUser.status === 'APPROVED' && (
          <>
            {masterScreenCampaignId ? (
              (() => {
                const targetCampaign = campaigns.find(c => c.id === masterScreenCampaignId) || campaigns[0];
                const isMasterOfCampaign = targetCampaign && (targetCampaign.masterId === currentUser.uid || currentUser.role === 'admin');
                if (!isMasterOfCampaign) {
                  return (
                    <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
                      <div className="parchment-card" style={{ padding: '36px 20px', border: '2px solid var(--amber-torch)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
                          Acesso Restrito ao Mestre da Sala
                        </h3>
                        <p className="font-lore" style={{ fontSize: '15px', color: 'var(--ink-dark)', marginBottom: '16px' }}>
                          Apenas o criador da sala possui acesso aos pergaminhos secretos desta mesa.
                        </p>
                        <button onClick={() => setMasterScreenCampaignId(null)} className="btn-tavern btn-primary">
                          Voltar às Campanhas
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <MasterScreenView
                    campaign={targetCampaign}
                    currentUser={currentUser}
                    onBackToCampaign={() => setMasterScreenCampaignId(null)}
                    onAddLore={handleAddLore}
                  />
                );
              })()
            ) : (
              <>
                {activeTab === 'campaigns' && (
                  <CampaignsView
                    campaigns={campaigns}
                    currentUser={currentUser}
                    selectedCampaignId={selectedCampaignId}
                    onSelectCampaign={setSelectedCampaignId}
                    onCreateCampaign={handleCreateCampaign}
                    onUpdateCampaign={handleUpdateCampaign}
                    onDeleteCampaign={handleDeleteCampaign}
                    onAddSheet={handleAddSheet}
                    onUpdateSheet={handleUpdateSheet}
                    onDeleteSheet={handleDeleteSheet}
                    onAddLore={handleAddLore}
                    onDeleteLore={handleDeleteLore}
                    onAddRule={handleAddRule}
                    onDeleteRule={handleDeleteRule}
                    onOpenMasterScreen={(campId) => setMasterScreenCampaignId(campId)}
                  />
                )}

                {activeTab === 'sketch' && (
                  <SketchStudioView
                    sketches={sketches}
                    campaigns={campaigns}
                    activeCampaignId={selectedCampaignId}
                    onSaveSketch={handleSaveSketch}
                    onDeleteSketch={handleDeleteSketch}
                  />
                )}

                {activeTab === 'urd' && (
                  <UrdChatView
                    messages={urdMessages}
                    campaigns={campaigns}
                    activeCampaignId={selectedCampaignId}
                    onSendMessage={handleSendUrdMessage}
                    onAddToLore={(campaignId, title, content) => {
                      handleAddLore(campaignId, {
                        title,
                        content,
                        category: 'rumores',
                        author: 'Urd, o Taberneiro',
                        tags: ['Oráculo Urd', 'Boato de Taberna']
                      });
                    }}
                    onClearChat={handleClearUrdChat}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation (Cinto do Aventureiro) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setMasterScreenCampaignId(null);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        pendingCount={pendingCount}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          reloadData();
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Exclusive Admin Modal (Acesso restrito a henrique.v.berbert@gmail.com) */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        users={users}
        campaigns={campaigns}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App;
