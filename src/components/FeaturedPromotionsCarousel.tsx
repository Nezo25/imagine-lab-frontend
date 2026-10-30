import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Product, UNIVERSE_CONFIG, toProductUniverse, type ProductUniverse } from '@/data/products';
import { TypeBadge } from './TypeBadge';
import { MysteryDropCard } from './MysteryDropCard';
import {
  fetchPublicShowcase,
  getDefaultPublicShowcase,
  type PublicShowcaseResponse,
  type PublicShowcaseSlot,
} from '@/services/showcase';

interface FeaturedPromotionsCarouselProps {
  products?: Product[];
  onConfigure?: (p: Product) => void;
  whatsappNumber?: string;
}

export function FeaturedPromotionsCarousel({
  products = [],
  onConfigure,
  whatsappNumber = '5511982563005',
}: FeaturedPromotionsCarouselProps) {
  const [showcase, setShowcase] = useState<PublicShowcaseResponse>(() => getDefaultPublicShowcase(products));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const loadShowcase = useCallback(async () => {
    try {
      const data = await fetchPublicShowcase(products);
      setShowcase(data);
    } catch (err) {
      console.warn('Erro ao carregar dados da vitrine Hero:', err);
    }
  }, [products]);

  useEffect(() => {
    loadShowcase();
    const handleUpdate = () => loadShowcase();
    window.addEventListener('forja_showcase_updated', handleUpdate);
    return () => {
      window.removeEventListener('forja_showcase_updated', handleUpdate);
    };
  }, [loadShowcase]);

  // Slots de produtos (até 3)
  const productSlots = showcase?.slots || [];
  const mysteryDrop = showcase?.mysteryDrop;

  // Total de slides: slots de produtos + 1 Mystery Drop
  const totalSlides = productSlots.length + 1;
  const mysteryIndex = productSlots.length;
  const isMysteryActive = currentSlide === mysteryIndex;

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play a cada 5.5s (pausa quando o mouse está sobre o carrossel)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Touch Swipe para Mobile (iOS/WebKit)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  function handleProductAction(slot: PublicShowcaseSlot) {
    if (!onConfigure) return;

    // Localiza o produto real no catálogo pelo productId ou nome para opções de materiais/escalas
    const matched = products.find(p => p.id === slot.productId?.toString() || p.name.toLowerCase() === slot.name?.toLowerCase());

    const origPrice = slot.originalPrice || matched?.basePrice || 75;
    const defaultDiscount = origPrice >= 80 ? 16 : (origPrice >= 50 ? 10 : 8);
    const hasCustomPromo = typeof slot.promotionalPrice === 'number' && slot.promotionalPrice > 0 && slot.promotionalPrice < origPrice;
    const promoPrice = hasCustomPromo ? slot.promotionalPrice! : Math.max(15, origPrice - defaultDiscount);

    const universeKey = toProductUniverse(slot.universe, slot.name || matched?.name, slot.category || (matched?.category as any));

    const productPayload: Product = {
      id: slot.productId ? slot.productId.toString() : (matched?.id || 'slot_' + slot.slotNumber),
      name: slot.name || matched?.name || 'Peça ImagineLab',
      category: (slot.category as any) || matched?.category || 'Colecionáveis 3D',
      universe: universeKey,
      types: slot.primaryType ? [slot.primaryType as any, slot.secondaryType as any].filter(Boolean) : (matched?.types || ['Normal']),
      scales: matched?.scales && matched.scales.length > 0 ? matched.scales : [(slot.scale as any) || '1:10 (~15 cm)'],
      materials: matched?.materials || ['PLA'],
      basePrice: origPrice,
      promoPrice: promoPrice,
      finishOptions: matched?.finishOptions || [],
      image: slot.imageUrl || matched?.image || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop',
      printTimeH: matched?.printTimeH || 8,
      filamentG: matched?.filamentG || 120,
      active: true,
      // Metadata especial para o pedido e carrinho
      origin: 'HERO_SHOWCASE',
      promoBadge: '[Oferta do Destaque Aplicada]',
      isHeroPromo: true,
      allowCouponStacking: slot.allowCouponStacking ?? false,
    } as any;

    onConfigure(productPayload);
  }

  if (productSlots.length === 0 && products.length === 0) {
    return (
      <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden bg-[#1E1E1E] border border-[#2E2E2E] shadow-2xl flex flex-col justify-between p-6 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="w-28 h-5 rounded-full bg-purple-500/20 border border-purple-500/30" />
          <div className="w-12 h-5 rounded-full bg-white/10" />
        </div>
        <div className="flex flex-col items-center justify-center text-center my-auto py-6">
          <div className="w-9 h-9 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#38BDF8] mb-1">
            IMAGINELAB 3D
          </span>
          <h4 className="font-display text-2xl text-white uppercase tracking-wider mb-2">
            Carregando Destaques
          </h4>
          <p className="text-xs text-[#94A3B8] max-w-xs">
            Buscando projetos e colecionáveis exclusivos...
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-24 h-4 rounded bg-white/10" />
          <div className="w-40 h-7 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden bg-[#1E1E1E] border border-[#2E2E2E] hover:border-orange-500/40 shadow-2xl transition-all duration-300 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container de Slides Deslizantes Horizontais (Efeito Carrossel com Scroll-Snap / Transform) */}
      <div
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {/* SLIDES DE PRODUTOS EM DESTAQUE (SLOTS 01 a 03) */}
        {productSlots.map((slot, idx) => {
          const origPrice = slot.originalPrice || 75;
          // Se ainda não houver preço de promoção customizado salvo no painel, aplica a oferta especial de bancada
          const defaultDiscount = origPrice >= 80 ? 16 : (origPrice >= 50 ? 10 : 8);
          const hasCustomPromo = typeof slot.promotionalPrice === 'number' && slot.promotionalPrice > 0 && slot.promotionalPrice < origPrice;
          const promoPrice = hasCustomPromo ? slot.promotionalPrice! : Math.max(15, origPrice - defaultDiscount);
          const discountDiff = origPrice - promoPrice;
          const discountPct = Math.round((discountDiff / origPrice) * 100);
          const badgeText = slot.badgeLabel && slot.badgeLabel !== '⚡ OFERTA DE BANCADA' && slot.badgeLabel !== '⭐ PEÇA DA SEMANA'
            ? slot.badgeLabel
            : '🔥 OFERTA DESTAQUE DA OFICINA';

          const universeKey = toProductUniverse(slot.universe, slot.name || undefined, slot.category || undefined);
          const universeInfo = UNIVERSE_CONFIG[universeKey];

          return (
            <div
              key={slot.slotNumber}
              onClick={() => handleProductAction({ ...slot, promotionalPrice: promoPrice, badgeLabel: badgeText })}
              className="w-full h-full shrink-0 relative cursor-pointer"
            >
              {/* Foto da Figure em Alta Resolução */}
              <img
                src={slot.imageUrl || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop'}
                alt={slot.name || 'Figure'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Degradê Editorial Dark */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 pointer-events-none" />

              {/* Top Badges do Slide com Universo e Oferta */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-md">
                    <span>{universeInfo.badge}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/35 text-orange-200 border border-orange-500/60 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                    <span>{badgeText}</span>
                    <span className="font-extrabold text-white">(-R$ {discountDiff.toFixed(0)})</span>
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 shrink-0">
                  {(idx + 1).toString().padStart(2, '0')} / {totalSlides.toString().padStart(2, '0')}
                </span>
              </div>

              {/* Informações Inferiores */}
              <div className="absolute bottom-5 left-5 right-24 z-10 flex flex-col gap-1.5">
                {/* Element Badges & Escala */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-full border border-amber-500/30">
                    {universeInfo.shortBadge}
                  </span>
                  {slot.primaryType && universeKey === 'POKEMON_TCG' && <TypeBadge type={slot.primaryType as any} />}
                  {slot.secondaryType && universeKey === 'POKEMON_TCG' && <TypeBadge type={slot.secondaryType as any} />}
                  {slot.scale && (
                    <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                      {slot.scale}
                    </span>
                  )}
                </div>

                {/* Preço Visual: Normal Riscado vs Promoção de Destaque */}
                <div className="flex items-center gap-2">
                  <span className="text-xs line-through text-slate-500 font-semibold">
                    R$ {origPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xl font-extrabold text-orange-500 bg-orange-950/90 px-2.5 py-0.5 rounded-lg border border-orange-500/50 shadow-md">
                    R$ {promoPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    ({discountPct}% OFF)
                  </span>
                </div>

                {/* Nome da Peça */}
                <h3 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide line-clamp-1 group-hover:text-orange-300 transition-colors">
                  {slot.name}
                </h3>

                {/* Justificativa Explícita da Oferta de Bancada */}
                <p className="text-[10px] text-amber-300/90 font-medium leading-tight flex items-center gap-1">
                  <span className="text-orange-400">⚡</span>
                  <span>Preço especial válido exclusivamente para esta unidade da bancada</span>
                </p>

                {/* Botão de Ação do Card */}
                <div className="pt-1">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 group-hover:text-orange-300 transition-colors">
                    <span>Garantir Oferta de Destaque</span>
                    <span className="text-sm">→</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* SLIDE 04: O CARD MISTERIOSO DINÂMICO (MYSTERY DROP) */}
        <MysteryDropCard
          category={mysteryDrop?.category}
          title={mysteryDrop?.title}
          subtitle={mysteryDrop?.subtitle}
          imageUrl={mysteryDrop?.imageUrl || undefined}
          whatsappText={mysteryDrop?.whatsappText}
          whatsappNumber={whatsappNumber}
          slotNumber={mysteryDrop?.slotNumber || 4}
          totalSlides={totalSlides}
        />
      </div>

      {/* Setas de Navegação Compactas (Hover no Desktop) */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#EA580C] text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 active:scale-90 z-20 cursor-pointer shadow-md"
        aria-label="Slide anterior"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#EA580C] text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 active:scale-90 z-20 cursor-pointer shadow-md"
        aria-label="Próximo slide"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Indicadores de Bolinhas / Dots no Rodapé do Card */}
      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
        {Array.from({ length: totalSlides }).map((_, dotIdx) => (
          <div
            key={dotIdx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === dotIdx
                ? dotIdx === mysteryIndex
                  ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'w-6 bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.8)]'
                : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Selo Redondo Oficial ImagineLab */}
      {!isMysteryActive && (
        <div className="absolute -bottom-3 -right-3 md:bottom-6 md:-right-6 z-30 w-24 h-24 rounded-full bg-[#1E2433] text-white p-2 flex flex-col items-center justify-center text-center shadow-2xl border-2 border-purple-500/50 transform rotate-12 group-hover:rotate-0 transition-transform pointer-events-none">
          <span className="text-base leading-none mb-0.5 text-[#38BDF8]">✦</span>
          <span className="font-display text-xs font-bold leading-tight uppercase text-white">IMAGINELAB</span>
          <span className="text-[8px] font-bold text-slate-400 leading-none">MONTE ALEGRE</span>
        </div>
      )}
    </div>
  );
}
