import { Campaign } from '../types';

/** Texto com o progresso salvo da mesa ("Crônicas e Progresso") para alimentar o Oráculo e o Taberneiro */
export function formatCampaignProgress(campaign?: Pick<Campaign, 'name' | 'progress'> | null): string {
  const p = campaign?.progress;
  if (!p) return '';
  const rows: [string, string][] = [
    ['Resumo do Capítulo Atual', p.chapterSummary],
    ['Contexto da História', p.storyContext],
    ['Localização Atual do Grupo', p.location],
    ['NPCs Encontrados', p.npcs],
    ['Missões em Andamento', p.quests],
    ['Notas de Sessão', p.sessionNotes],
  ];
  const body = rows.filter(([, v]) => v && v.trim()).map(([k, v]) => `- ${k}: ${v.trim()}`).join('\n');
  return body ? `Progresso salvo da campanha "${campaign!.name}":\n${body}` : '';
}
