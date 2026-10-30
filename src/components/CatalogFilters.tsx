import React from 'react';
import { THEME_PRESET_CONFIGS, type SeasonalCampaign } from '@/services/campaigns';

export interface Filters {
  categories: string[];
  types: string[];
  scales: string[];
  finishes: string[];
}

export interface CatalogFiltersProps {
  activeCampaign?: SeasonalCampaign | null;
  masterTab: 'CAMPAIGN' | 'ALL' | 'PRINT_3D' | 'TCG';
  onSelectMasterTab: (tab: 'CAMPAIGN' | 'ALL' | 'PRINT_3D' | 'TCG') => void;
  filters: Filters;
  onChangeFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onOpenFilterDrawer: () => void;
  activeFiltersCount: number;
}

export function CatalogFilters({
  activeCampaign,
  masterTab,
  onSelectMasterTab,
  filters,
  onChangeFilters,
  onOpenFilterDrawer,
  activeFiltersCount,
}: CatalogFiltersProps) {
  const isCampaignActive = Boolean(activeCampaign && activeCampaign.isActive);

  return (
    <div className="sticky top-16 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-b border-gray-800 py-3">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Categorias - Quick Nav */}
        <div className="flex-1 flex flex-col gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 bg-gray-800/50 p-1 rounded-xl w-fit border border-gray-700/50">
            {/* Aba do Evento / Campanha Sazonal Ativa */}
            {isCampaignActive && activeCampaign && (
              <button
                type="button"
                onClick={() => {
                  onSelectMasterTab('CAMPAIGN');
                  onChangeFilters(prev => ({ ...prev, categories: [], types: [] }));
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-extrabold transition-all border flex items-center gap-2 cursor-pointer ${
                  THEME_PRESET_CONFIGS[activeCampaign.themePreset]?.tabClasses ||
                  'border-purple-500/80 bg-purple-950/40 text-purple-200'
                } ${
                  masterTab === 'CAMPAIGN'
                    ? 'ring-2 ring-orange-500/60 scale-[1.02]'
                    : 'opacity-90 hover:opacity-100'
                }`}
                style={{
                  borderColor: activeCampaign.accentColor,
                  backgroundColor: `${activeCampaign.secondaryColor}33`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: activeCampaign.accentColor }}
                />
                <span>{activeCampaign.tagLabel}</span>
              </button>
            )}

            {/* Abas Padrão de Navegação */}
            {[
              { id: 'ALL', label: '🔥 Todas as Criações' },
              { id: 'PRINT_3D', label: '🖨️ Oficina 3D' },
              { id: 'TCG', label: '🃏 Pokémon' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectMasterTab(tab.id as any);
                  onChangeFilters(prev => ({ ...prev, categories: [], types: [] }));
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  masterTab === tab.id
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subcategorias quando não está na aba da campanha */}
          {masterTab !== 'CAMPAIGN' && (
            <div className="flex items-center gap-2 pb-1 -mb-1 w-max">
              <button
                onClick={() => onChangeFilters(prev => ({ ...prev, categories: [] }))}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  filters.categories.length === 0
                    ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                Todas
              </button>
              {(masterTab === 'TCG'
                ? [
                    'Booster Avulso',
                    'Booster Box',
                    'ETB',
                    'Blister',
                    'Deck',
                    'Acessório Oficial',
                  ]
                : [
                    'Figures Pokémon',
                    'Dioramas e Cenários',
                    'Chibis / Miniaturas',
                    'Acessórios Geek 3D',
                    'Acessórios TCG (3D)',
                  ]
              ).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    onChangeFilters(prev => {
                      let newTypes = prev.types;
                      if (cat !== 'Figures Pokémon' && cat !== 'Chibis / Miniaturas') newTypes = [];
                      return { ...prev, categories: [cat], types: newTypes };
                    });
                  }}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    filters.categories.includes(cat as any)
                      ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Filtros */}
        <button
          onClick={onOpenFilterDrawer}
          className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-full text-sm font-semibold transition-colors border border-gray-700"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filtros{' '}
          {activeFiltersCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-md">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default CatalogFilters;
