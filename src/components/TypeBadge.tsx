import React from 'react';

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Decoração & Geek': { bg: 'rgba(94, 72, 140, 0.2)', text: '#A78BFA', border: 'rgba(94, 72, 140, 0.4)' },
  'Action Figures & Anime': { bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: 'rgba(236, 72, 153, 0.3)' },
  'Peças Técnicas & Funcionais': { bg: 'rgba(76, 168, 184, 0.2)', text: '#67C5D6', border: 'rgba(76, 168, 184, 0.4)' },
  'Litofanias & Luminárias': { bg: 'rgba(234, 179, 8, 0.15)', text: '#FDE047', border: 'rgba(234, 179, 8, 0.3)' },
  'Troféus & Colecionáveis': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
  'PLA Premium': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93C5FD', border: 'rgba(59, 130, 246, 0.3)' },
  'Resina 8K Ultra-Detalhe': { bg: 'rgba(139, 92, 246, 0.2)', text: '#C4B5FD', border: 'rgba(139, 92, 246, 0.4)' },
  'PETG Técnico': { bg: 'rgba(20, 184, 166, 0.2)', text: '#5EEAD4', border: 'rgba(20, 184, 166, 0.4)' },
  'PLA Silk (Metalizado)': { bg: 'rgba(245, 158, 11, 0.15)', text: '#FCD34D', border: 'rgba(245, 158, 11, 0.3)' },
};

export function TypeBadge({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) {
  const style = BADGE_COLORS[type] || {
    bg: 'rgba(51, 65, 85, 0.4)',
    text: '#94A3B8',
    border: 'rgba(71, 85, 105, 0.4)',
  };

  const pad = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border backdrop-blur-xs ${pad}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {type}
    </span>
  );
}
