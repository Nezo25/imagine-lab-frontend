import { type PokemonType, TYPE_COLORS } from '@/data/products';
import { useLanguagePreference } from './LanguageContext';

const DEFAULT_TYPE_COLOR = {
  text: '#F97316',
  bg: 'rgba(249, 115, 22, 0.15)',
};

export function TypeBadge({ type }: { type: PokemonType | string }) {
  if (!type) return null;
  const { translateType } = useLanguagePreference();
  const c = TYPE_COLORS[type as PokemonType] || DEFAULT_TYPE_COLOR;
  
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase"
      style={{ color: c?.text || '#F97316', background: c?.bg || 'rgba(249, 115, 22, 0.15)', border: c?.border ? `1px solid ${c.border}` : '1px solid transparent' }}
    >
      {translateType(type)}
    </span>
  );
}
