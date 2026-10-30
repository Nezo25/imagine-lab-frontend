import React from 'react';
import type { Product, ProductUniverse } from '@/data/products';
import { UNIVERSE_CONFIG, toProductUniverse } from '@/types/catalog';
import { THEME_PRESET_CONFIGS, type SeasonalCampaign } from '@/services/campaigns';

export type StorefrontTab = 'ALL' | 'CAMPAIGN' | ProductUniverse;

export interface StorefrontHubProps {
  activeTab: StorefrontTab;
  onTabChange: (tab: StorefrontTab) => void;
  products: Product[];
  totalProductsCount: number;
  activeCampaign?: SeasonalCampaign | null;
}

export function StorefrontHub({
  activeTab,
  onTabChange,
  products,
  totalProductsCount,
  activeCampaign,
}: StorefrontHubProps) {
  // Helper para obter o universo garantido do produto
  const getUniverse = (p: Product) => p.universe || toProductUniverse(p.universe, p.name, p.category);

  const campaignProductsCount = activeCampaign?.products?.length || 0;

  // Contagem dinâmica por universo
  const counts: Record<StorefrontTab, number> = {
    ALL: totalProductsCount,
    CAMPAIGN: campaignProductsCount,
    ANIME_MANGA: products.filter(p => getUniverse(p) === 'ANIME_MANGA').length,
    POKEMON_TCG: products.filter(p => getUniverse(p) === 'POKEMON_TCG' || (!p.universe && p.department === 'TCG')).length,
    POP_CULTURE_GEEK: products.filter(p => getUniverse(p) === 'POP_CULTURE_GEEK').length,
    DIORAMA_ACCESSORY: products.filter(p => getUniverse(p) === 'DIORAMA_ACCESSORY').length,
  };

  const preset = activeCampaign?.themePreset
    ? THEME_PRESET_CONFIGS[activeCampaign.themePreset] || THEME_PRESET_CONFIGS.CUSTOM
    : null;
  const accent = activeCampaign?.accentColor || preset?.accentColor || '#F97316';
  const secondary = activeCampaign?.secondaryColor || preset?.secondaryColor || '#7C3AED';
  const campaignIcon = preset?.emoji || '✨';

  const baseTabs: Array<{
    id: StorefrontTab;
    label: string;
    icon: string;
    description: string;
    isCampaign?: boolean;
  }> = [];

  if (activeCampaign && activeCampaign.isActive) {
    baseTabs.push({
      id: 'CAMPAIGN',
      label: activeCampaign.tagLabel,
      icon: campaignIcon,
      description: activeCampaign.bannerTitle || 'Edição especial e peças exclusivas por tempo limitado.',
      isCampaign: true,
    });
  }

  baseTabs.push(
    {
      id: 'ALL',
      label: 'Todos os Colecionáveis',
      icon: '✨',
      description: 'Explore todo o acervo exclusivo de impressão 3D da ImagineLab',
    },
    {
      id: 'ANIME_MANGA',
      label: 'Animes & Mangás',
      icon: '⚔️',
      description: UNIVERSE_CONFIG.ANIME_MANGA.description,
    },
    {
      id: 'POKEMON_TCG',
      label: 'Pokémon',
      icon: '⚡',
      description: UNIVERSE_CONFIG.POKEMON_TCG.description,
    },
    {
      id: 'POP_CULTURE_GEEK',
      label: 'Pop Culture & Games',
      icon: '🎮',
      description: UNIVERSE_CONFIG.POP_CULTURE_GEEK.description,
    },
    {
      id: 'DIORAMA_ACCESSORY',
      label: 'Dioramas & Cenários',
      icon: '🏛️',
      description: UNIVERSE_CONFIG.DIORAMA_ACCESSORY.description,
    }
  );

  const currentTabInfo = baseTabs.find(t => t.id === activeTab) || baseTabs[0];

  return (
    <div className="w-full max-w-full overflow-hidden bg-[#111722] border-y border-[#222E3F] py-6 px-4 md:px-8 select-none">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-4">
        {/* Header do Hub com Tagline e Contador Geral */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2838]">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: activeTab === 'CAMPAIGN' ? accent : '#7C3AED',
                boxShadow: `0 0 8px ${activeTab === 'CAMPAIGN' ? accent : 'rgba(124,58,237,0.8)'}`,
              }}
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#38BDF8] block">
                {activeTab === 'CAMPAIGN' ? 'EVENTO TEMPORÁRIO EM DESTAQUE' : 'JANELAS TEMÁTICAS IMAGINELAB'}
              </span>
              <h3 className="font-display text-lg sm:text-xl text-white uppercase tracking-wider">
                {activeTab === 'CAMPAIGN' ? activeCampaign?.name || 'Campanha Sazonal' : 'Navegue por Universo'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-[#16202E] px-3 py-1 rounded-full border border-slate-700/60">
              <strong className="text-white font-bold">{counts[activeTab]}</strong> {counts[activeTab] === 1 ? 'item disponível' : 'itens disponíveis'}
            </span>
          </div>
        </div>

        {/* Barra de Controle Segmentado (Tabs) */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-2 w-full max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          {baseTabs.map(tab => {
            const isActive = activeTab === tab.id;
            const count = counts[tab.id];

            if (tab.isCampaign) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'text-white shadow-xl scale-[1.03]'
                      : 'text-slate-200 hover:text-white border shadow-md'
                  }`}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${accent}, ${secondary})`
                      : `${secondary}25`,
                    borderColor: `${accent}88`,
                    boxShadow: isActive
                      ? `0 0 20px ${accent}60`
                      : `0 0 10px ${secondary}30`,
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: accent }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: accent }}
                    />
                  </span>
                  <span className="text-base leading-none transition-transform group-hover:scale-110">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      borderColor: `${accent}50`,
                      color: '#F9FAFB',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-lg shadow-purple-950/60 ring-2 ring-purple-500/50 scale-[1.02]'
                    : 'bg-[#18212F] text-slate-300 hover:text-white hover:bg-[#202C3D] border border-slate-700/50'
                }`}
              >
                <span className="text-base leading-none transition-transform group-hover:scale-110">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-black/40 text-amber-200 border border-white/20'
                      : 'bg-black/40 text-slate-400 border border-white/5 group-hover:text-slate-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legenda Contextual da Janela Ativa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pt-1 text-xs text-slate-400">
          <p className="flex items-start sm:items-center gap-2 text-slate-300 break-words leading-relaxed text-[11px] sm:text-xs">
            <span
              className="font-bold shrink-0"
              style={{ color: activeTab === 'CAMPAIGN' ? accent : '#EA580C' }}
            >
              ✦
            </span>
            <span>{currentTabInfo.description}</span>
          </p>
          <span className="text-[10px] font-mono uppercase text-slate-500 hidden md:inline-block shrink-0">
            Filtragem em tempo real • Sem recarregar
          </span>
        </div>
      </div>
    </div>
  );
}
