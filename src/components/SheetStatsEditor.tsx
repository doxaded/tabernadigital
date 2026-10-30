import React from 'react';
import { Plus, X } from 'lucide-react';
import { CustomStat } from '../types';
import { DEFAULT_STATS, DefaultStats, STAT_CODE_REGEX, normalizeStatCode } from '../services/sheetStats';

interface SheetStatsEditorProps {
  stats: DefaultStats;
  onStatsChange: (stats: DefaultStats) => void;
  customStats: CustomStat[];
  onCustomStatsChange: (list: CustomStat[]) => void;
  error?: string;
}

const MAX_CUSTOM_STATS = 12;

/**
 * Editor de atributos: os 6 padrões ficam sempre no início (valores editáveis, não removíveis);
 * em seguida vêm os atributos extras, que podem ser adicionados, renomeados e removidos.
 * Todo nome de atributo extra é sempre normalizado para 3 letras maiúsculas.
 */
export const SheetStatsEditor: React.FC<SheetStatsEditorProps> = ({
  stats,
  onStatsChange,
  customStats,
  onCustomStatsChange,
  error,
}) => {
  const updateCustom = (index: number, patch: Partial<CustomStat>) =>
    onCustomStatsChange(customStats.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeCustom = (index: number) =>
    onCustomStatsChange(customStats.filter((_, i) => i !== index));

  const addCustom = () => {
    if (customStats.length >= MAX_CUSTOM_STATS) return;
    onCustomStatsChange([...customStats, { code: '', value: 10 }]);
  };

  const cellLabel: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' };
  const numberInput: React.CSSProperties = { padding: '8px 4px', textAlign: 'center' };

  return (
    <div id="sheet-stats-editor">
      <label style={{ fontSize: '11px', fontWeight: 600 }}>Atributos:</label>

      {/* Atributos padrão — sempre primeiro */}
      <div className="sheet-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
        {DEFAULT_STATS.map(({ key, code }) => (
          <div key={key} style={{ textAlign: 'center' }}>
            <span style={cellLabel}>{code}</span>
            <input
              type="number" min={1} max={30}
              value={stats[key]}
              onChange={e => onStatsChange({ ...stats, [key]: Number(e.target.value) })}
              className="tavern-input"
              style={numberInput}
              aria-label={`Atributo ${code}`}
            />
          </div>
        ))}
      </div>

      {/* Atributos extras */}
      {customStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: '6px', marginTop: '8px' }}>
          {customStats.map((stat, index) => {
            const invalid = stat.code !== '' && !STAT_CODE_REGEX.test(stat.code);
            return (
              <div
                key={index}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px', borderRadius: '6px',
                  border: '1px solid var(--line-soft)', background: 'rgba(60, 36, 18, 0.05)'
                }}
              >
                <input
                  value={stat.code}
                  onChange={e => updateCustom(index, { code: normalizeStatCode(e.target.value) })}
                  maxLength={3}
                  placeholder="ABC"
                  aria-label="Nome do atributo (3 letras)"
                  className="tavern-input"
                  style={{
                    width: '48px', padding: '6px 2px', textAlign: 'center', fontWeight: 800,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    borderColor: invalid ? '#b91c1c' : undefined
                  }}
                />
                <input
                  type="number" min={0} max={99}
                  value={stat.value}
                  onChange={e => updateCustom(index, { value: Number(e.target.value) })}
                  aria-label={`Valor de ${stat.code || 'atributo'}`}
                  className="tavern-input"
                  style={{ ...numberInput, width: '100%', minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => removeCustom(index)}
                  title="Remover atributo"
                  aria-label={`Remover atributo ${stat.code}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '2px', display: 'flex' }}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        id="sheet-add-stat-btn"
        onClick={addCustom}
        disabled={customStats.length >= MAX_CUSTOM_STATS}
        className="btn-tavern btn-secondary"
        style={{ marginTop: '8px', minHeight: '32px', padding: '4px 12px', fontSize: '11px' }}
      >
        <Plus size={13} /> Adicionar atributo
      </button>

      {error && (
        <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 600, color: '#b91c1c' }}>{error}</div>
      )}
    </div>
  );
};
