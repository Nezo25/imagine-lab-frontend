import { ALL_CATEGORIES, ALL_FINISHES, ALL_SCALES, ALL_TYPES, type Category, type Finish, type PokemonType, type Scale, TYPE_COLORS } from '@/data/products';
import { useLanguagePreference } from './LanguageContext';

export interface Filters {
  categories: Category[];
  types: PokemonType[];
  scales: Scale[];
  finishes: Finish[];
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
  open: boolean;
  masterTab?: 'ALL' | 'PRINT_3D' | 'TCG';
}

export function FilterDrawer({ filters, onChange, onClose, open, masterTab = 'ALL' }: Props) {
  const { translateType } = useLanguagePreference();

  const toggleIn = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const hasFilters =
    filters.categories.length > 0 ||
    filters.types.length > 0 ||
    filters.scales.length > 0 ||
    filters.finishes.length > 0;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#111827] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtros
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* CATEGORIAS */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Categoria</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(c => {
                const active = filters.categories.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => onChange({ ...filters, categories: toggleIn(filters.categories, c) })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      active
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                        : 'bg-[#1F2937] border-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIPOS */}
          {(!filters.categories.length || filters.categories.includes('Figures Pokémon') || filters.categories.includes('FIGURE_POKEMON')) && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tipo Pokémon</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_TYPES.map(t => {
                  const active = filters.types.includes(t);
                  const col = (TYPE_COLORS as any)[t];
                  return (
                    <button
                      key={t}
                      onClick={() => onChange({ ...filters, types: toggleIn(filters.types, t) })}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                      style={active
                        ? { background: col?.bg || 'rgba(249,115,22,0.15)', color: col?.text || '#F97316', borderColor: col?.text || '#F97316' }
                        : { background: '#1F2937', color: '#9CA3AF', borderColor: '#374151' }
                      }
                    >
                      {translateType(t)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ESCALAS */}
          {(!filters.categories.length || filters.categories.includes('Figures Pokémon') || filters.categories.includes('FIGURE_POKEMON') || filters.categories.includes('Figures')) && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Escala / Tamanho</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_SCALES.map(s => {
                  const active = filters.scales.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => onChange({ ...filters, scales: toggleIn(filters.scales, s) })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        active
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                          : 'bg-[#1F2937] border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3 bg-[#111827]">
          {hasFilters && (
            <button
              onClick={() => onChange({ categories: [], types: [], scales: [], finishes: [] })}
              className="flex-1 py-3 rounded-lg font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-[2] py-3 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            Ver Resultados
          </button>
        </div>
      </div>
    </>
  );
}
