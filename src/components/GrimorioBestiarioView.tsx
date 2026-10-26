import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Shield, Sparkles, Skull, BookOpen, Filter, X, 
  ExternalLink, ChevronRight, Plus, FileText, Check 
} from 'lucide-react';
import { masterOracleService, CompendiumData } from '../services/masterOracleService';
import { CompendiumDoc, LoreEntry } from '../types';
import { tavernAudio } from '../services/tavernAudio';

interface GrimorioBestiarioViewProps {
  activeCampaignId?: string;
  loreEntries?: LoreEntry[];
  onAddLore?: () => void;
  onEditLore?: (entry: LoreEntry) => void;
  onDeleteLore?: (loreId: string) => void;
}

type SubSection = 'bestiary' | 'spells' | 'rules' | 'lore';

export const GrimorioBestiarioView: React.FC<GrimorioBestiarioViewProps> = ({
  activeCampaignId,
  loreEntries = [],
  onAddLore,
  onEditLore,
  onDeleteLore,
}) => {
  const [compendium, setCompendium] = useState<CompendiumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SubSection>('bestiary');

  // Filtros do Bestiário
  const [monsterSearch, setMonsterSearch] = useState('');
  const [monsterCrFilter, setMonsterCrFilter] = useState<string>('all');
  const [monsterTypeFilter, setMonsterTypeFilter] = useState<string>('all');

  // Filtros do Grimório de Magias
  const [spellSearch, setSpellSearch] = useState('');
  const [spellLevelFilter, setSpellLevelFilter] = useState<string>('all');
  const [spellSchoolFilter, setSpellSchoolFilter] = useState<string>('all');

  // Filtros de Regras & Condições
  const [ruleSearch, setRuleSearch] = useState('');

  // Item selecionado para exibição detalhada
  const [selectedDoc, setSelectedDoc] = useState<CompendiumDoc | null>(null);

  useEffect(() => {
    masterOracleService.loadCompendium().then((data) => {
      setCompendium(data);
      setLoading(false);
    });
  }, []);

  // Lista de Monstros filtrados
  const filteredMonsters = useMemo(() => {
    if (!compendium) return [];
    let list = compendium.catalog.monstros || [];

    if (monsterSearch.trim()) {
      const q = monsterSearch.toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.title_en.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q)
      );
    }

    if (monsterCrFilter !== 'all') {
      list = list.filter(m => {
        const crNum = parseFloat(m.cr.replace('1/2', '0.5').replace('1/4', '0.25').replace('1/8', '0.125')) || 0;
        if (monsterCrFilter === '0-1') return crNum <= 1;
        if (monsterCrFilter === '2-4') return crNum >= 2 && crNum <= 4;
        if (monsterCrFilter === '5-10') return crNum >= 5 && crNum <= 10;
        if (monsterCrFilter === '11-16') return crNum >= 11 && crNum <= 16;
        if (monsterCrFilter === '17+') return crNum >= 17;
        return true;
      });
    }

    if (monsterTypeFilter !== 'all') {
      list = list.filter(m => m.type.toLowerCase().includes(monsterTypeFilter.toLowerCase()));
    }

    return list;
  }, [compendium, monsterSearch, monsterCrFilter, monsterTypeFilter]);

  // Lista de Magias filtradas
  const filteredSpells = useMemo(() => {
    if (!compendium) return [];
    let list = compendium.catalog.magias || [];

    if (spellSearch.trim()) {
      const q = spellSearch.toLowerCase();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.title_en.toLowerCase().includes(q) ||
        s.info.toLowerCase().includes(q)
      );
    }

    if (spellLevelFilter !== 'all') {
      list = list.filter(s => {
        if (spellLevelFilter === '0') return s.info.toLowerCase().includes('truque');
        return s.info.toLowerCase().includes(`nível ${spellLevelFilter}`) || s.info.toLowerCase().includes(`${spellLevelFilter}º`);
      });
    }

    if (spellSchoolFilter !== 'all') {
      list = list.filter(s => s.info.toLowerCase().includes(spellSchoolFilter.toLowerCase()));
    }

    return list;
  }, [compendium, spellSearch, spellLevelFilter, spellSchoolFilter]);

  // Lista de Regras & Condições
  const filteredRules = useMemo(() => {
    if (!compendium) return [];
    let list = compendium.docs.filter(d => d.category === 'Regras Oficiais');
    if (ruleSearch.trim()) {
      const q = ruleSearch.toLowerCase();
      list = list.filter(r => 
        r.title.toLowerCase().includes(q) || 
        (r.title_en && r.title_en.toLowerCase().includes(q)) ||
        (r.content && r.content.toLowerCase().includes(q))
      );
    }
    return list;
  }, [compendium, ruleSearch]);

  const handleOpenDocByPath = (path: string, fallbackTitle: string) => {
    if (!compendium) return;
    const doc = compendium.docs.find(d => d.path === path || d.title.toLowerCase() === fallbackTitle.toLowerCase());
    if (doc) {
      setSelectedDoc(doc);
    } else {
      setSelectedDoc({
        id: path,
        title: fallbackTitle,
        title_en: fallbackTitle,
        category: 'Bestiário',
        path: path,
        content: `Carregando registros arcanos de ${fallbackTitle}...`,
      });
    }
    tavernAudio.playBellChime();
  };

  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      {/* 1. Header Fosco com Sub-abas do Grimório & Bestiário */}
      <div 
        className="editorial-frosted-card room-matte-III"
        style={{ marginBottom: '32px' }}
      >
        <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '8px', color: '#D4A359' }}>
          CAPÍTULO III • ACERVO OFICIAL D&D 2024 & CRÔNICAS
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                margin: '0 0 8px 0',
                color: '#EAE0D5',
              }}
            >
              Grimório de RPG & Bestiário
            </h1>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '16px',
                lineHeight: '1.6',
                maxWidth: '620px',
                margin: 0,
                opacity: 0.85,
                color: '#EAE0D5',
              }}
            >
              Consulta rápida e enciclopédia completa de monstros, encantamentos arcanos, condições de combate e as crônicas gravadas pela confraria.
            </p>
          </div>

          {/* Sub-abas do Grimório & Bestiário */}
          <div className="editorial-segmented-control dark-theme">
            {[
              { id: 'bestiary', label: `Bestiário (${compendium?.catalogCounts.monstros || 339})` },
              { id: 'spells', label: `Grimório (${compendium?.catalogCounts.magias || 326})` },
              { id: 'rules', label: 'Condições & Regras' },
              { id: 'lore', label: `Crônicas (${loreEntries.length})` },
            ].map(tab => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSection(tab.id as SubSection);
                    tavernAudio.playBellChime();
                  }}
                  className={`editorial-segmented-item ${isActive ? 'is-active' : ''}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Conteúdo da Seção Ativa */}
      {activeSection === 'bestiary' && (
        <div className="editorial-grid-12">
          {/* Coluna Principal: Busca & Lista de Criaturas */}
          <div>
            {/* Barra de Filtros e Busca */}
            <div className="editorial-frosted-card room-matte-III" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: '#D4A359' }} />
                  <input
                    type="text"
                    value={monsterSearch}
                    onChange={(e) => setMonsterSearch(e.target.value)}
                    placeholder="Buscar monstro (ex: Dragão, Goblin, Lich, Vampiro)..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 163, 89, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px 10px 38px',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '15px',
                      color: '#EAE0D5',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {monsterSearch && (
                    <button
                      onClick={() => setMonsterSearch('')}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtro por Nível de Desafio */}
                <select
                  value={monsterCrFilter}
                  onChange={(e) => setMonsterCrFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 163, 89, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#EAE0D5',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all" style={{ background: '#2E1F16' }}>Todos os Níveis de Desafio (ND)</option>
                  <option value="0-1" style={{ background: '#2E1F16' }}>ND 0 a 1 (Iniciante)</option>
                  <option value="2-4" style={{ background: '#2E1F16' }}>ND 2 a 4 (Heróico)</option>
                  <option value="5-10" style={{ background: '#2E1F16' }}>ND 5 a 10 (Veterano)</option>
                  <option value="11-16" style={{ background: '#2E1F16' }}>ND 11 a 16 (Mestre)</option>
                  <option value="17+" style={{ background: '#2E1F16' }}>ND 17+ (Lendário)</option>
                </select>
              </div>

              {/* Chips Rápidos de Tipos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Tipo:</span>
                {['all', 'Dragão', 'Morto-Vivo', 'Ínfero', 'Besta', 'Humanóide', 'Gigante', 'Monstruosidade'].map(type => (
                  <button
                    key={type}
                    onClick={() => setMonsterTypeFilter(type)}
                    style={{
                      border: '1px solid',
                      borderColor: monsterTypeFilter === type ? '#D4A359' : 'rgba(255, 255, 255, 0.1)',
                      background: monsterTypeFilter === type ? 'rgba(212, 163, 89, 0.15)' : 'transparent',
                      color: monsterTypeFilter === type ? '#D4A359' : '#EAE0D5',
                      borderRadius: '9999px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {type === 'all' ? 'Todos' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Criaturas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredMonsters.slice(0, 60).map(m => (
                <div
                  key={m.path}
                  onClick={() => handleOpenDocByPath(m.path, m.title)}
                  className="editorial-campaign-card room-matte-III"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '18px', fontWeight: 600, color: '#EAE0D5' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.65 }}>
                        {m.title_en}
                      </div>
                    </div>
                    <span 
                      className="editorial-pill-tag"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      ND {m.cr}
                    </span>
                  </div>

                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', opacity: 0.65, letterSpacing: '0.04em' }}>
                      {m.type}
                    </span>
                    <span style={{ fontSize: '11px', color: '#D4A359', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Examinar <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredMonsters.length > 60 && (
              <p style={{ textAlign: 'center', fontStyle: 'italic', opacity: 0.6, fontSize: '13px', marginTop: '20px' }}>
                Exibindo 60 de {filteredMonsters.length} criaturas. Refine sua busca pelo nome ou ND acima.
              </p>
            )}

            {filteredMonsters.length === 0 && (
              <div className="editorial-frosted-card room-matte-III" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontStyle: 'italic', opacity: 0.7, margin: 0 }}>
                  Nenhuma criatura encontrada para os critérios selecionados.
                </p>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Resumo do Bestiário & Instruções */}
          <aside className="editorial-claude-card room-matte-III">
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
              Bestiário D&D 2024
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Monstros Catalogados</span>
              <span className="editorial-meta-value">{compendium?.catalogCounts.monstros || 339}</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Versão</span>
              <span className="editorial-meta-value">SRD 5.2 / D&D 2024</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Maior Ameaça</span>
              <span className="editorial-meta-value">Tarrasque (ND 30)</span>
            </div>

            <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.6', marginTop: '16px', marginBottom: 0 }}>
              Toque em qualquer criatura para abrir sua ficha completa com Pontos de Vida, Classe de Armadura, Atributos, Deslocamento e Ações Lendárias.
            </p>
          </aside>
        </div>
      )}

      {/* SEÇÃO 2: GRIMÓRIO DE MAGIAS */}
      {activeSection === 'spells' && (
        <div className="editorial-grid-12">
          {/* Coluna Principal: Busca & Lista de Feitiços */}
          <div>
            <div className="editorial-frosted-card room-matte-III" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: '#D4A359' }} />
                  <input
                    type="text"
                    value={spellSearch}
                    onChange={(e) => setSpellSearch(e.target.value)}
                    placeholder="Buscar magia (ex: Bola de Fogo, Cura, Escudo, Desejo)..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 163, 89, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px 10px 38px',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '15px',
                      color: '#EAE0D5',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {spellSearch && (
                    <button
                      onClick={() => setSpellSearch('')}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filtro por Círculo de Magia */}
                <select
                  value={spellLevelFilter}
                  onChange={(e) => setSpellLevelFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 163, 89, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#EAE0D5',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all" style={{ background: '#2E1F16' }}>Todos os Círculos</option>
                  <option value="0" style={{ background: '#2E1F16' }}>Truques (Círculo 0)</option>
                  <option value="1" style={{ background: '#2E1F16' }}>1º Círculo</option>
                  <option value="2" style={{ background: '#2E1F16' }}>2º Círculo</option>
                  <option value="3" style={{ background: '#2E1F16' }}>3º Círculo</option>
                  <option value="4" style={{ background: '#2E1F16' }}>4º Círculo</option>
                  <option value="5" style={{ background: '#2E1F16' }}>5º Círculo</option>
                  <option value="6" style={{ background: '#2E1F16' }}>6º Círculo</option>
                  <option value="7" style={{ background: '#2E1F16' }}>7º Círculo</option>
                  <option value="8" style={{ background: '#2E1F16' }}>8º Círculo</option>
                  <option value="9" style={{ background: '#2E1F16' }}>9º Círculo (Supremo)</option>
                </select>
              </div>

              {/* Chips Rápidos de Escolas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Escola:</span>
                {['all', 'Evocação', 'Abjuração', 'Ilusão', 'Encantamento', 'Necromancia', 'Transmutação', 'Adivinhação', 'Conjuração'].map(sch => (
                  <button
                    key={sch}
                    onClick={() => setSpellSchoolFilter(sch)}
                    style={{
                      border: '1px solid',
                      borderColor: spellSchoolFilter === sch ? '#D4A359' : 'rgba(255, 255, 255, 0.1)',
                      background: spellSchoolFilter === sch ? 'rgba(212, 163, 89, 0.15)' : 'transparent',
                      color: spellSchoolFilter === sch ? '#D4A359' : '#EAE0D5',
                      borderRadius: '9999px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {sch === 'all' ? 'Todas' : sch}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Magias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredSpells.slice(0, 60).map(s => (
                <div
                  key={s.path}
                  onClick={() => handleOpenDocByPath(s.path, s.title)}
                  className="editorial-campaign-card room-matte-III"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '18px', fontWeight: 600, color: '#EAE0D5' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.65 }}>
                        {s.title_en}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', opacity: 0.75, color: '#D4A359' }}>
                      {s.info}
                    </span>
                    <span style={{ fontSize: '11px', opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Conjurar <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredSpells.length > 60 && (
              <p style={{ textAlign: 'center', fontStyle: 'italic', opacity: 0.6, fontSize: '13px', marginTop: '20px' }}>
                Exibindo 60 de {filteredSpells.length} magias. Refine sua busca pelo nome ou círculo acima.
              </p>
            )}

            {filteredSpells.length === 0 && (
              <div className="editorial-frosted-card room-matte-III" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontStyle: 'italic', opacity: 0.7, margin: 0 }}>
                  Nenhum feitiço encontrado para os critérios selecionados.
                </p>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Resumo das Regras Arcanas */}
          <aside className="editorial-claude-card room-matte-III">
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
              Grimório D&D 2024
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Magias Oficiais</span>
              <span className="editorial-meta-value">{compendium?.catalogCounts.magias || 326}</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Círculos</span>
              <span className="editorial-meta-value">Truques ao 9º</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Escolas</span>
              <span className="editorial-meta-value">8 Escolas Clássicas</span>
            </div>

            <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.6', marginTop: '16px', marginBottom: 0 }}>
              Toque em qualquer feitiço para consultar o tempo de conjuração, componentes (V/S/M), duração, alcance e efeitos mágicos completos.
            </p>
          </aside>
        </div>
      )}

      {/* SEÇÃO 3: CONDIÇÕES & REGRAS OFICIAIS */}
      {activeSection === 'rules' && (
        <div className="editorial-grid-12">
          <div>
            <div className="editorial-frosted-card room-matte-III" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: '#D4A359' }} />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder="Buscar condição ou regra oficial (ex: Cego, Envenenado, Descanso, Ataque)..."
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 163, 89, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px 10px 38px',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '15px',
                    color: '#EAE0D5',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredRules.map(r => (
                <div
                  key={r.id || r.path}
                  onClick={() => {
                    setSelectedDoc(r);
                    tavernAudio.playBellChime();
                  }}
                  className="editorial-campaign-card room-matte-III"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '18px', fontWeight: 600, color: '#EAE0D5', marginBottom: '4px' }}>
                      {r.title}
                    </div>
                    {r.title_en && (
                      <div style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.6, marginBottom: '8px' }}>
                        {r.title_en}
                      </div>
                    )}
                    <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.75, lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.content?.replace(/^#.*$/gm, '').trim()}
                    </p>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: '#D4A359', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Ler Regra <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="editorial-claude-card room-matte-III">
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
              Regras & Condições Oficiais
            </div>
            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Condições</span>
              <span className="editorial-meta-value">14 Essenciais</span>
            </div>
            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Mecânicas</span>
              <span className="editorial-meta-value">Combate & Exploração</span>
            </div>
            <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.6', marginTop: '16px', marginBottom: 0 }}>
              Consulte instantaneamente as penalidades e vantagens de condições como Amedrontado, Agarrado, Invisível e Exaustão durante o combate.
            </p>
          </aside>
        </div>
      )}

      {/* SEÇÃO 4: CRÔNICAS & DIÁRIO DE BORDO DA MESA */}
      {activeSection === 'lore' && (
        <div className="editorial-grid-12">
          <div>
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={onAddLore}
                className="editorial-btn-primary"
              >
                <Plus size={15} />
                Gravar Novo Relato na Crônica
              </button>
            </div>

            {loreEntries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loreEntries.map(entry => (
                  <article
                    key={entry.id}
                    className="editorial-claude-card room-matte-III"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="editorial-pill-tag">
                        {entry.category || 'Crônica'}
                      </span>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                        {onEditLore && (
                          <button
                            onClick={() => onEditLore(entry)}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Editar
                          </button>
                        )}
                        {onDeleteLore && (
                          <button
                            onClick={() => onDeleteLore(entry.id)}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }}
                          >
                            Apagar
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '22px', fontWeight: 600, margin: '0 0 10px 0', letterSpacing: '0.02em', color: '#EAE0D5' }}>
                      {entry.title}
                    </h3>

                    <p style={{ fontStyle: 'italic', fontSize: '15px', lineHeight: '1.7', opacity: 0.9, margin: '0 0 14px 0', color: '#EAE0D5' }}>
                      {entry.content}
                    </p>

                    <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>
                      Tags: {entry.tags?.join(', ') || 'Geral'}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="editorial-frosted-card room-matte-III" style={{ padding: '32px' }}>
                <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.75, margin: 0 }}>
                  As páginas desta crônica ainda aguardam pelos primeiros relatos da expedição.
                </p>
              </div>
            )}
          </div>

          <aside className="editorial-claude-card room-matte-III">
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
              Diário de Bordo da Mesa
            </div>
            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Relatos Gravados</span>
              <span className="editorial-meta-value">{loreEntries.length}</span>
            </div>
            <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.6', marginTop: '16px', marginBottom: 0 }}>
              Utilize as crônicas para registrar pistas descobertas, diálogos memoráveis e lendas da campanha ativa.
            </p>
          </aside>
        </div>
      )}

      {/* MODAL / DRAWER DETALHADO DO COMPÊNDIO */}
      {selectedDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'rgba(20, 12, 8, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxSizing: 'border-box',
          }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              overflowY: 'auto',
              backgroundColor: '#2E1F16',
              border: '1px solid rgba(212, 163, 89, 0.25)',
              borderRadius: '16px',
              padding: '32px',
              boxSizing: 'border-box',
              color: '#EAE0D5',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDoc(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#EAE0D5',
                opacity: 0.7,
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
              }}
              className="hover:opacity-100"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <span className="editorial-pill-tag" style={{ marginBottom: '8px' }}>
                {selectedDoc.category || 'Compêndio Oficial'} {selectedDoc.cr ? `• ND ${selectedDoc.cr}` : ''}
              </span>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                  fontSize: '28px',
                  fontWeight: 600,
                  margin: '8px 0 4px 0',
                  color: '#EAE0D5',
                }}
              >
                {selectedDoc.title}
              </h2>
              {selectedDoc.title_en && (
                <div style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.65 }}>
                  {selectedDoc.title_en} {selectedDoc.type ? `• ${selectedDoc.type}` : ''}
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.7',
                opacity: 0.9,
                whiteSpace: 'pre-wrap',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                borderTop: '1px solid rgba(212, 163, 89, 0.15)',
                paddingTop: '20px',
              }}
            >
              {selectedDoc.content}
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedDoc(null)}
                className="editorial-btn-secondary"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
