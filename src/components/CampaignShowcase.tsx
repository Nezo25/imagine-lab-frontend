import type { Product } from '@/data/products';
import {
  THEME_PRESET_CONFIGS,
  type CampaignProductItem,
  type SeasonalCampaign
} from '@/services/campaigns';

interface CampaignShowcaseProps {
  campaign: SeasonalCampaign;
  catalogProducts: Product[];
  onBuyCampaignItem: (product: Product, effectivePrice: number, campaignTag: string, customBadge?: string) => void;
  onCustomizeCampaignItem: (product: Product, effectivePrice: number, campaignTag: string) => void;
}

export function CampaignShowcase({
  campaign,
  catalogProducts,
  onBuyCampaignItem,
  onCustomizeCampaignItem
}: CampaignShowcaseProps) {
  const preset = THEME_PRESET_CONFIGS[campaign.themePreset] || THEME_PRESET_CONFIGS.HALLOWEEN;
  const accent = campaign.accentColor || preset.accentColor;
  const secondary = campaign.secondaryColor || preset.secondaryColor;

  // Vincula os produtos da campanha com os dados do catálogo local/remoto
  const resolvedItems = (campaign.products || [])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((cp: CampaignProductItem) => {
      const matched = catalogProducts.find(
        p => String(p.id) === String(cp.productId) || String(p.id) === `p${cp.productId}`
      );

      const fallbackProduct: Product = matched || {
        id: String(cp.productId),
        name: cp.productName || `Peça #${cp.productId}`,
        category: (cp.productCategory as any) || 'Figures Pokémon',
        types: cp.primaryType ? [cp.primaryType as any] : ['Fantasma'],
        scales: [((cp.productScale as any) || 'Escala 1:10 (~15 cm)')],
        materials: ['Resina', 'PLA'],
        basePrice: Number(cp.originalPrice ?? cp.effectivePrice ?? 99),
        finishOptions: [
          { label: 'Peça Crua', extra: 0 },
          { label: 'Com Primer', extra: 25 },
          { label: 'Pintado à Mão', extra: 85 }
        ],
        image: cp.productImage || 'https://placehold.co/600x700/1F2937/F97316?text=Figure',
        printTimeH: 12,
        filamentG: 200,
        active: true
      };

      const originalPrice = Number(cp.originalPrice ?? fallbackProduct.basePrice ?? 0);
      const effectivePrice =
        cp.eventPrice !== null && cp.eventPrice !== undefined && Number(cp.eventPrice) > 0
          ? Number(cp.eventPrice)
          : originalPrice;

      return {
        cp,
        product: fallbackProduct,
        originalPrice,
        effectivePrice,
        hasDiscount: effectivePrice < originalPrice
      };
    });

  return (
    <section className="flex flex-col gap-8 py-2">
      {/* Banner Temático da Campanha */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 border shadow-2xl"
        style={{
          background: `linear-gradient(135deg, #090D16 0%, #0F172A 55%, ${secondary}28 100%)`,
          borderColor: `${accent}66`,
          boxShadow: `0 0 40px -10px ${secondary}40`
        }}
      >
        {/* Glows atmosféricos */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ background: secondary }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 border animate-pulse"
              style={{
                backgroundColor: `${secondary}30`,
                borderColor: `${accent}80`,
                color: '#F9FAFB'
              }}
            >
              <span>{campaign.tagLabel}</span>
              <span className="text-[10px] opacity-80">• Edição Temporária</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {campaign.bannerTitle}
            </h2>

            {campaign.bannerSubtitle && (
              <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed">
                {campaign.bannerSubtitle}
              </p>
            )}
          </div>

          <div
            className="shrink-0 px-5 py-4 rounded-2xl border backdrop-blur-md flex flex-col items-start md:items-end justify-center"
            style={{
              backgroundColor: 'rgba(9, 13, 22, 0.78)',
              borderColor: `${secondary}55`
            }}
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Seleção Curada da Bancada
            </span>
            <span className="text-2xl font-extrabold mt-0.5" style={{ color: accent }}>
              {resolvedItems.length} {resolvedItems.length === 1 ? 'Peça Exclusiva' : 'Peças Exclusivas'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Preços especiais válidos durante o evento
            </span>
          </div>
        </div>
      </div>

      {/* Grade Exclusiva de Produtos do Evento */}
      {resolvedItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-sm text-slate-400">
          Nenhuma peça vinculada a esta campanha ainda. Adicione figures em <code>/admin/campanhas</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {resolvedItems.map(({ cp, product, originalPrice, effectivePrice, hasDiscount }) => (
            <div
              key={`${campaign.id}-${cp.productId}`}
              className="group relative rounded-2xl bg-[#0F172A] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              style={{
                border: `1px solid ${accent}55`,
                boxShadow: `0 8px 28px -8px ${secondary}35`
              }}
            >
              {/* Imagem + Badge Customizada da Peça */}
              <div className="relative aspect-[4/4.5] bg-[#090D16] overflow-hidden">
                <img
                  src={product.image || 'https://placehold.co/600x700/1F2937/F97316?text=Figure'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badge do Evento / Peça */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-extrabold shadow-lg backdrop-blur-md border"
                    style={{
                      backgroundColor: 'rgba(9, 13, 22, 0.88)',
                      borderColor: accent,
                      color: '#FFFFFF'
                    }}
                  >
                    {cp.customBadge || campaign.tagLabel}
                  </span>

                  {hasDiscount && (
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md"
                      style={{ backgroundColor: accent }}
                    >
                      Oferta Evento
                    </span>
                  )}
                </div>
              </div>

              {/* Informações da Peça */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {product.category}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-0.5 leading-snug">
                    {product.name}
                  </h3>
                </div>

                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    {hasDiscount && (
                      <span className="text-xs text-slate-500 line-through font-mono">
                        R$ {originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className="text-xl font-extrabold" style={{ color: accent }}>
                      R$ {effectivePrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onCustomizeCampaignItem(
                          { ...product, basePrice: effectivePrice },
                          effectivePrice,
                          campaign.tagLabel
                        )
                      }
                      className="h-10 px-3 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Personalizar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onBuyCampaignItem(
                          product,
                          effectivePrice,
                          campaign.tagLabel,
                          cp.customBadge
                        )
                      }
                      className="h-10 px-3 rounded-xl text-xs font-extrabold text-white transition-transform active:scale-95 cursor-pointer shadow-md"
                      style={{ backgroundColor: accent }}
                    >
                      Comprar Agora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CampaignShowcase;
