import { useState } from 'react';
import { type Product, CATEGORY_LABELS, UNIVERSE_CONFIG, toProductUniverse } from '@/data/products';

interface Props {
  product: Product;
  index?: number;
  onConfigure: (p: Product) => void;
  onBuyNow: (p: Product) => void;
}

export function ProductCard({ product, index = 1, onConfigure, onBuyNow }: Props) {
  const [hovered, setHovered] = useState(false);

  const basePrice = product.basePrice || 0;
  const extraMin = product.finishOptions && product.finishOptions.length > 0
    ? Math.min(...product.finishOptions.map(f => f.extra))
    : 0;
  const lowestPrice = basePrice + (isFinite(extraMin) ? extraMin : 0);
  const categoryLabel = (CATEGORY_LABELS as Record<string, string>)[product.category] || product.category;
  const stock = typeof product.stock === 'number' ? product.stock : ((product as any).stockQuantity ?? 1);

  const universeKey = toProductUniverse(product.universe, product.name, product.category);
  const universeInfo = UNIVERSE_CONFIG[universeKey];

  // Badge label (unidades em estoque, escala ou expansão TCG)
  const badgeText = product.department === 'TCG' 
    ? (product.expansionName || 'PRONTA ENTREGA') 
    : (stock > 1 ? `${stock} UNIDADES` : (product.scales?.[0] || 'PADRÃO (10 CM)'));

  return (
    <article
      className="flex flex-col justify-between h-full w-full max-w-full min-w-0 cursor-pointer group select-none transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onConfigure(product)}
    >
      {/* Dark Image Container com Glow Suave nas Bordas (Diretriz 2) */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#131722] border border-[#2E384D] shadow-md group-hover:border-purple-500/50 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all duration-500">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges: Universe + Stock/Scale */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase pointer-events-none z-10 gap-1">
          <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[#38BDF8] border border-cyan-500/40 text-[8px] sm:text-[9px] font-extrabold flex items-center gap-1 shadow-sm truncate max-w-[55%]">
            <span className="truncate">{universeInfo.badge}</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[#F1F5F9] border border-white/15 text-[8px] sm:text-[9px] truncate max-w-[45%]">
            {badgeText}
          </span>
        </div>

        {/* Floating Round Cart/Buy Button (bottom right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBuyNow(product);
          }}
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-black hover:bg-[#7C3AED] hover:text-white flex items-center justify-center shadow-xl transition-all active:scale-90 z-20 cursor-pointer ring-1 ring-black/10 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          title="Comprar direto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>

      {/* Info Below Image */}
      <div className="pt-3 pb-1 flex flex-col gap-1 flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] text-[#737373] uppercase truncate">
              {categoryLabel}
            </span>
            {product.types && product.types.length > 0 && universeKey === 'POKEMON_TCG' && (
              <span className="text-[9px] sm:text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider shrink-0">
                {product.types.slice(0, 2).join(' • ')}
              </span>
            )}
          </div>

          <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-[#171717] uppercase tracking-wide group-hover:text-[#7C3AED] transition-colors line-clamp-1 mt-0.5">
            {product.name}
          </h3>
        </div>

        {/* Grounded & Prominent Price Container with Action Buttons */}
        <div className="mt-2 pt-2 border-t border-black/10 flex flex-col gap-2 w-full">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.16em] text-[#8C8C8C] uppercase">
                A partir de
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-black text-[#7C3AED]">R$</span>
                <span className="font-display text-xl sm:text-2xl font-black text-[#171717] tracking-tight leading-none">
                  {lowestPrice.toLocaleString('pt-BR', { minimumFractionDigits: lowestPrice % 1 === 0 ? 0 : 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(product);
              }}
              className="w-full py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#DDD7C8] hover:bg-[#D0C9B8] text-[#262626] transition-colors cursor-pointer text-center truncate"
            >
              Personalizar
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBuyNow(product);
              }}
              className="w-full py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer truncate"
            >
              <span>Comprar</span>
              <span className="text-[10px]">⚡</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
