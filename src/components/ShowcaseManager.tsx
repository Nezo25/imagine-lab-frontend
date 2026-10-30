import React, { useState, useEffect } from 'react';
import type { Product } from '@/data/products';
import { toast } from './Toast';
import {
  fetchAdminShowcase,
  updateShowcaseSlot,
  getDefaultPublicShowcase,
  type AdminShowcaseSlot,
} from '@/services/showcase';
import { fileToBase64 } from '@/services/storage';

interface ShowcaseManagerProps {
  products: Product[];
}

const ADMIN_SHOWCASE_CACHE_KEY = 'forja_showcase_admin_cache_v1';

function buildInitialSlots(products: Product[]): AdminShowcaseSlot[] {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(ADMIN_SHOWCASE_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      } catch {}
    }
  }

  const fallback = getDefaultPublicShowcase(products);
  return [
    ...fallback.slots.map(s => ({
      slotNumber: s.slotNumber,
      productId: s.productId,
      productName: s.name,
      productCategory: s.category,
      productImageUrl: s.imageUrl,
      originalPrice: s.originalPrice,
      promotionalPrice: s.promotionalPrice,
      discountAmount: s.discountAmount,
      discountPercentage: s.discountPercentage,
      badgeLabel: s.badgeLabel || '🔥 OFERTA DESTAQUE DA OFICINA',
      allowCouponStacking: s.allowCouponStacking ?? false,
      isActive: true,
    })),
    {
      slotNumber: 4,
      isActive: true,
      badgeLabel: '❓ DROP MISTERIOSO',
      mysteryTitle: fallback.mysteryDrop.title,
      mysterySubtitle: fallback.mysteryDrop.subtitle,
      mysteryCategory: fallback.mysteryDrop.category,
      mysteryImageUrl: fallback.mysteryDrop.imageUrl,
      mysteryWhatsappText: fallback.mysteryDrop.whatsappText,
    },
  ];
}

export function ShowcaseManager({ products }: ShowcaseManagerProps) {
  const [slots, setSlots] = useState<AdminShowcaseSlot[]>(() => buildInitialSlots(products));
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<Record<number, string>>({ 1: '', 2: '', 3: '' });
  const [promoInputs, setPromoInputs] = useState<Record<number, string>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      try {
        const data = await fetchAdminShowcase(products);
        if (!isMounted || !data || data.length === 0) return;

        const slotMap = new Map<number, AdminShowcaseSlot>();
        data.forEach(s => slotMap.set(s.slotNumber, s));

        const finalSlots: AdminShowcaseSlot[] = [1, 2, 3, 4].map(num => {
          if (slotMap.has(num)) return slotMap.get(num)!;
          return {
            slotNumber: num,
            isActive: true,
            badgeLabel: num === 4 ? '❓ DROP MISTERIOSO' : '🔥 DESTAQUE IMAGINELAB',
            allowCouponStacking: false,
            mysteryCategory: 'FIGURE_POKEMON',
            mysteryTitle: 'Quem é esse Pokémon?',
            mysterySubtitle: 'Próximo lançamento exclusivo em 3D',
            mysteryWhatsappText: 'Olá, ImagineLab! Vi o drop misterioso da semana no site e quero garantir com desconto exclusivo!',
          };
        });

        setSlots(finalSlots);
      } catch (err) {
        console.warn('Erro ao carregar slots da vitrine em segundo plano:', err);
      }
    }

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSlotChange(slotNumber: number, updates: Partial<AdminShowcaseSlot>) {
    setSlots(prev => prev.map(s => (s.slotNumber === slotNumber ? { ...s, ...updates } : s)));
  }

  function handleProductSelect(slotNumber: number, product: Product) {
    const origPrice = product.basePrice || 0;
    const currentSlot = slots.find(s => s.slotNumber === slotNumber);
    const promo = currentSlot?.promotionalPrice;
    const diff = promo && promo > 0 && promo < origPrice ? origPrice - promo : 0;
    const pct = origPrice > 0 && diff > 0 ? Math.round((diff / origPrice) * 100) : 0;

    // Sincroniza campos de digitação para o produto selecionado
    if (promo && diff > 0) {
      setPromoInputs(prev => ({ ...prev, [slotNumber]: (promo % 1 === 0 ? promo.toString() : promo.toFixed(2)).replace('.', ',') }));
      setDiscountInputs(prev => ({ ...prev, [slotNumber]: (diff % 1 === 0 ? diff.toString() : diff.toFixed(2)).replace('.', ',') }));
    } else {
      setPromoInputs(prev => ({ ...prev, [slotNumber]: '' }));
      setDiscountInputs(prev => ({ ...prev, [slotNumber]: '' }));
    }

    handleSlotChange(slotNumber, {
      productId: Number(product.id) || null,
      productName: product.name,
      productCategory: product.category,
      productImageUrl: product.image,
      originalPrice: origPrice,
      discountAmount: diff,
      discountPercentage: pct,
    });

    setSearchTerm(prev => ({ ...prev, [slotNumber]: '' }));
  }

  function handlePromoPriceChange(slotNumber: number, valStr: string) {
    // Guarda o texto cru digitado pelo usuário para permitir apagar e digitar livremente
    setPromoInputs(prev => ({ ...prev, [slotNumber]: valStr }));

    const currentSlot = slots.find(s => s.slotNumber === slotNumber);
    const orig = currentSlot?.originalPrice || 0;

    if (!valStr.trim()) {
      setDiscountInputs(prev => ({ ...prev, [slotNumber]: '' }));
      handleSlotChange(slotNumber, {
        promotionalPrice: null,
        discountAmount: 0,
        discountPercentage: 0,
      });
      return;
    }

    const clean = valStr.replace(',', '.');
    const val = parseFloat(clean);

    if (isNaN(val) || val <= 0) {
      setDiscountInputs(prev => ({ ...prev, [slotNumber]: '' }));
      handleSlotChange(slotNumber, {
        promotionalPrice: null,
        discountAmount: 0,
        discountPercentage: 0,
      });
      return;
    }

    const diff = orig > val ? orig - val : 0;
    const pct = orig > 0 && diff > 0 ? Math.round((diff / orig) * 100) : 0;

    if (diff > 0) {
      const diffFormatted = diff % 1 === 0 ? diff.toString() : diff.toFixed(2).replace('.', ',');
      setDiscountInputs(prev => ({ ...prev, [slotNumber]: diffFormatted }));
    } else {
      setDiscountInputs(prev => ({ ...prev, [slotNumber]: '' }));
    }

    handleSlotChange(slotNumber, {
      promotionalPrice: val,
      discountAmount: diff,
      discountPercentage: pct,
    });
  }

  function handleDiscountAmountChange(slotNumber: number, discountStr: string) {
    // Guarda o texto cru digitado pelo usuário (sem pular cursor nem forçar vírgulas)
    setDiscountInputs(prev => ({ ...prev, [slotNumber]: discountStr }));

    const currentSlot = slots.find(s => s.slotNumber === slotNumber);
    const orig = currentSlot?.originalPrice || 0;

    if (!discountStr.trim()) {
      setPromoInputs(prev => ({ ...prev, [slotNumber]: '' }));
      handleSlotChange(slotNumber, {
        promotionalPrice: null,
        discountAmount: 0,
        discountPercentage: 0,
      });
      return;
    }

    const clean = discountStr.replace(',', '.');
    const discountVal = parseFloat(clean);

    if (isNaN(discountVal) || discountVal <= 0) {
      setPromoInputs(prev => ({ ...prev, [slotNumber]: '' }));
      handleSlotChange(slotNumber, {
        promotionalPrice: null,
        discountAmount: 0,
        discountPercentage: 0,
      });
      return;
    }

    const newPromoPrice = Math.max(1, orig - discountVal);
    const pct = orig > 0 ? Math.round((discountVal / orig) * 100) : 0;

    const promoFormatted = newPromoPrice % 1 === 0 ? newPromoPrice.toString() : newPromoPrice.toFixed(2).replace('.', ',');
    setPromoInputs(prev => ({ ...prev, [slotNumber]: promoFormatted }));

    handleSlotChange(slotNumber, {
      promotionalPrice: newPromoPrice,
      discountAmount: discountVal,
      discountPercentage: pct,
    });
  }

  function applyQuickDiscount(slotNumber: number, type: 'reais' | 'percent', amount: number) {
    const currentSlot = slots.find(s => s.slotNumber === slotNumber);
    const orig = currentSlot?.originalPrice || 0;
    if (orig <= 0) return;

    let discount = 0;
    if (type === 'reais') {
      discount = amount;
    } else if (type === 'percent') {
      discount = Math.round(orig * (amount / 100));
    }

    const newPromoPrice = Math.max(1, orig - discount);
    const promoStr = (newPromoPrice % 1 === 0 ? newPromoPrice.toString() : newPromoPrice.toFixed(2)).replace('.', ',');
    const discStr = (discount % 1 === 0 ? discount.toString() : discount.toFixed(2)).replace('.', ',');

    setPromoInputs(prev => ({ ...prev, [slotNumber]: promoStr }));
    setDiscountInputs(prev => ({ ...prev, [slotNumber]: discStr }));

    const pct = orig > 0 ? Math.round((discount / orig) * 100) : 0;
    handleSlotChange(slotNumber, {
      promotionalPrice: newPromoPrice,
      discountAmount: discount,
      discountPercentage: pct,
    });
  }

  function handleRemovePromo(slotNumber: number) {
    setPromoInputs(prev => ({ ...prev, [slotNumber]: '' }));
    setDiscountInputs(prev => ({ ...prev, [slotNumber]: '' }));
    handleSlotChange(slotNumber, {
      promotionalPrice: null,
      discountAmount: 0,
      discountPercentage: 0,
    });
  }

  async function handleMysteryImageUpload(slotNumber: number, file: File) {
    try {
      const base64 = await fileToBase64(file);
      handleSlotChange(slotNumber, { mysteryImageUrl: base64 });
    } catch (e) {
      console.error(e);
      toast.show({ title: 'Erro', message: 'Falha ao processar imagem.', type: 'error' });
    }
  }

  async function saveSingleSlot(slot: AdminShowcaseSlot) {
    setSavingSlot(slot.slotNumber);
    try {
      await updateShowcaseSlot(slot.slotNumber, {
        productId: slot.productId,
        promotionalPrice: slot.promotionalPrice,
        badgeLabel: slot.badgeLabel,
        allowCouponStacking: slot.allowCouponStacking ?? false,
        isActive: slot.isActive ?? true,
        mysteryTitle: slot.mysteryTitle,
        mysterySubtitle: slot.mysterySubtitle,
        mysteryCategory: slot.mysteryCategory,
        mysteryImageUrl: slot.mysteryImageUrl,
        mysteryWhatsappText: slot.mysteryWhatsappText,
      });

      toast.show({
        title: `Slot ${slot.slotNumber} Atualizado!`,
        message: slot.slotNumber === 4 ? 'Configurações do Drop Misterioso salvas.' : `Oferta da peça "${slot.productName || 'selecionada'}" salva na vitrine.`,
        type: 'success',
        icon: '⭐',
      });
    } catch (err: any) {
      console.error(err);
      toast.show({
        title: 'Falha ao salvar',
        message: err.message || 'Verifique sua conexão.',
        type: 'error',
      });
    } finally {
      setSavingSlot(null);
    }
  }

  async function saveAllSlots() {
    setSavingSlot(999);
    let successCount = 0;
    for (const slot of slots) {
      try {
        await updateShowcaseSlot(slot.slotNumber, {
          productId: slot.productId,
          promotionalPrice: slot.promotionalPrice,
          badgeLabel: slot.badgeLabel,
          allowCouponStacking: slot.allowCouponStacking ?? false,
          isActive: slot.isActive ?? true,
          mysteryTitle: slot.mysteryTitle,
          mysterySubtitle: slot.mysterySubtitle,
          mysteryCategory: slot.mysteryCategory,
          mysteryImageUrl: slot.mysteryImageUrl,
          mysteryWhatsappText: slot.mysteryWhatsappText,
        });
        successCount++;
      } catch (err) {
        console.error(`Erro ao salvar slot ${slot.slotNumber}:`, err);
      }
    }
    setSavingSlot(null);

    if (successCount === slots.length) {
      toast.show({
        title: 'Vitrine Completa Atualizada!',
        message: 'Os 4 slots foram sincronizados com sucesso na vitrine principal.',
        type: 'success',
        icon: '🚀',
      });
    } else {
      toast.show({
        title: 'Sincronização parcial',
        message: `${successCount} de ${slots.length} slots salvos.`,
        type: 'warning',
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <h2 className="font-extrabold text-base text-white">Gestão de Destaques & Vitrine Principal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure as 3 peças em oferta e o 4º card misterioso da vitrine no topo da loja. 
            <strong className="text-slate-200 ml-1">O catálogo geral permanece com preços normais intactos.</strong>
          </p>
        </div>

        <button
          type="button"
          disabled={savingSlot !== null}
          onClick={saveAllSlots}
          className="h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          {savingSlot === 999 ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvando Todos...</span>
            </>
          ) : (
            <>
              <span>Salvar Todos os Slots</span>
              <span>💾</span>
            </>
          )}
        </button>
      </div>

      {/* Grid com os 4 Slots da Vitrine */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {slots.map(slot => {
          const isMystery = slot.slotNumber === 4;
          const isSaving = savingSlot === slot.slotNumber;

          if (isMystery) {
            // CARD DO SLOT 4 (DROP MISTERIOSO UNIVERSAL)
            return (
              <div
                key={slot.slotNumber}
                className="flex flex-col rounded-2xl bg-[#0B1120] border-2 border-amber-500/30 shadow-2xl p-5 relative overflow-hidden group"
              >
                {/* Header do Card */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SLOT 04
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Drop Misterioso
                    </span>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.isActive ?? true}
                      onChange={e => handleSlotChange(slot.slotNumber, { isActive: e.target.checked })}
                      className="rounded accent-amber-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-300">Ativo</span>
                  </label>
                </div>

                {/* Seletor de Categoria do Segredo */}
                <div className="flex flex-col gap-1 mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Categoria do Segredo
                  </label>
                  <select
                    value={slot.mysteryCategory || 'FIGURE_POKEMON'}
                    onChange={e => {
                      const cat = e.target.value;
                      let defaultTitle = 'Quem é esse Pokémon?';
                      let defaultSub = 'Próximo lançamento exclusivo em 3D';
                      let defaultBadge = '❓ Pokémon Secreto';
                      let defaultWpp = 'Olá, ImagineLab! Vi o Pokémon misterioso em destaque no site e quero saber qual é a peça antes de todo mundo!';

                      if (cat === 'GEEK_GENERAL') {
                        defaultTitle = 'Quem é esse Personagem?';
                        defaultSub = 'Colecionável exclusivo em produção';
                        defaultBadge = '❓ Drop Geek Misterioso';
                        defaultWpp = 'Olá, ImagineLab! Vi o personagem misterioso em destaque no site e quero saber qual é o colecionável!';
                      } else if (cat === 'TCG_SPECIAL' || cat === 'DIORAMA') {
                        defaultTitle = 'Drop Secreto ImagineLab';
                        defaultSub = 'Lançamento especial com desconto de estreia';
                        defaultBadge = '✨ Edição Especial';
                        defaultWpp = 'Olá, ImagineLab! Vi o drop secreto em destaque no site e quero garantir as condições de estreia!';
                      }

                      handleSlotChange(slot.slotNumber, {
                        mysteryCategory: cat,
                        mysteryTitle: defaultTitle,
                        mysterySubtitle: defaultSub,
                        badgeLabel: defaultBadge,
                        mysteryWhatsappText: defaultWpp,
                      });
                    }}
                    className="h-9 px-3 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FIGURE_POKEMON">Figures Pokémon (Quem é esse Pokémon?)</option>
                    <option value="GEEK_GENERAL">Geek / Anime Geral (Quem é esse Personagem?)</option>
                    <option value="DIORAMA">Dioramas e Cenários (Drop Secreto)</option>
                    <option value="TCG_SPECIAL">Colecionáveis & TCG (Edição Especial)</option>
                  </select>
                </div>

                {/* Preview Automático da Silhueta Escurecida com ? Dourada */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-amber-500/20 my-2 flex items-center justify-center">
                  <img
                    src={slot.mysteryImageUrl || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop'}
                    alt="Preview Silhueta"
                    className="w-full h-full object-contain p-2 filter brightness-0 contrast-200 opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="font-display text-4xl text-amber-400 font-black drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse">
                      ?
                    </span>
                  </div>
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-300 bg-black/70 px-1.5 py-0.5 rounded">
                    Silhueta 100%
                  </span>
                </div>

                {/* Upload ou URL da Foto da Peça */}
                <div className="flex flex-col gap-1 mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Foto da Peça Segredo (URL ou Arquivo)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... ou faça upload abaixo"
                    value={slot.mysteryImageUrl || ''}
                    onChange={e => handleSlotChange(slot.slotNumber, { mysteryImageUrl: e.target.value })}
                    className="h-8 px-3 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <label className="mt-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 cursor-pointer transition-colors">
                    <span>📁 Enviar foto do arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleMysteryImageUpload(slot.slotNumber, file);
                      }}
                    />
                  </label>
                </div>

                {/* Título & Subtítulo */}
                <div className="flex flex-col gap-2 mb-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Título</label>
                    <input
                      type="text"
                      value={slot.mysteryTitle || ''}
                      onChange={e => handleSlotChange(slot.slotNumber, { mysteryTitle: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtítulo</label>
                    <input
                      type="text"
                      value={slot.mysterySubtitle || ''}
                      onChange={e => handleSlotChange(slot.slotNumber, { mysterySubtitle: e.target.value })}
                      className="w-full h-8 px-3 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Mensagem WhatsApp */}
                <div className="flex flex-col gap-1 mb-4 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mensagem de Lead WhatsApp
                  </label>
                  <textarea
                    rows={2}
                    value={slot.mysteryWhatsappText || ''}
                    onChange={e => handleSlotChange(slot.slotNumber, { mysteryWhatsappText: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Botão Salvar Slot */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => saveSingleSlot(slot)}
                  className="w-full h-9 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer mt-auto"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Salvar Slot 04 💾</span>
                  )}
                </button>
              </div>
            );
          }

          // CARDS DOS SLOTS 1, 2 E 3 (OFERTAS DE BANCADA)
          const activeProducts = products.filter(p => p.active);
          const filterTerm = searchTerm[slot.slotNumber]?.toLowerCase() || '';
          const matchedProducts = filterTerm
            ? activeProducts.filter(p => p.name.toLowerCase().includes(filterTerm))
            : activeProducts.slice(0, 15);

          const hasPromo = typeof slot.promotionalPrice === 'number' && slot.promotionalPrice > 0;
          const origPrice = slot.originalPrice || 0;
          const promoPrice = slot.promotionalPrice || 0;
          const savings = hasPromo && origPrice > promoPrice ? origPrice - promoPrice : 0;
          const pct = origPrice > 0 && savings > 0 ? Math.round((savings / origPrice) * 100) : 0;

          return (
            <div
              key={slot.slotNumber}
              className="flex flex-col rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl p-5 relative overflow-hidden group hover:border-orange-500/40 transition-colors"
            >
              {/* Header do Card */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    SLOT 0{slot.slotNumber}
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Oferta de Bancada
                  </span>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.isActive ?? true}
                    onChange={e => handleSlotChange(slot.slotNumber, { isActive: e.target.checked })}
                    className="rounded accent-orange-500 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-slate-400">Ativo</span>
                </label>
              </div>

              {/* Seletor com Busca Rápida de Produtos */}
              <div className="flex flex-col gap-1 mb-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Vincular Produto da ImagineLab
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Buscar peça por nome..."
                    value={searchTerm[slot.slotNumber] || ''}
                    onChange={e => setSearchTerm(prev => ({ ...prev, [slot.slotNumber]: e.target.value }))}
                    className="w-full h-8 px-3 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {searchTerm[slot.slotNumber] && (
                    <div className="absolute top-9 inset-x-0 z-30 max-h-48 overflow-y-auto rounded-lg bg-[#1E293B] border border-slate-700 shadow-2xl p-1 flex flex-col gap-1">
                      {matchedProducts.length === 0 ? (
                        <div className="p-2 text-xs text-slate-400 text-center">Nenhum produto encontrado</div>
                      ) : (
                        matchedProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProductSelect(slot.slotNumber, p)}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-orange-500/20 text-left transition-colors cursor-pointer"
                          >
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover bg-slate-900" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-400">R$ {p.basePrice?.toFixed(2)}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Exibição em Tempo Real: Foto, Nome e Preço Base Atual */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-3">
                <img
                  src={slot.productImageUrl || 'https://placehold.co/600x700/1F2937/F97316?text=Figure'}
                  alt={slot.productName || 'Figure'}
                  className="w-14 h-16 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-800"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="text-xs font-extrabold text-white truncate">
                    {slot.productName || 'Nenhum produto selecionado'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Preço Base do Catálogo:
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    R$ {(slot.originalPrice || 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* Bloco de Preço da Oferta */}
              <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 mb-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <span>🔥</span>
                    <span>Novo Preço da Peça na Vitrine</span>
                  </label>
                  {hasPromo && (
                    <button
                      type="button"
                      onClick={() => handleRemovePromo(slot.slotNumber)}
                      className="text-[10px] text-slate-400 hover:text-red-400 transition-colors font-medium cursor-pointer"
                    >
                      ✕ Remover desconto
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  Preencha o <strong className="text-slate-200">valor final com desconto</strong> que o cliente vai pagar no site:
                </p>

                {/* Dois campos sincronizados: Preço Final vs Desconto */}
                {(() => {
                  const promoDisplay = promoInputs[slot.slotNumber] !== undefined
                    ? promoInputs[slot.slotNumber]
                    : (slot.promotionalPrice ? (slot.promotionalPrice % 1 === 0 ? slot.promotionalPrice.toString() : slot.promotionalPrice.toFixed(2)).replace('.', ',') : '');

                  const discountDisplay = discountInputs[slot.slotNumber] !== undefined
                    ? discountInputs[slot.slotNumber]
                    : (savings > 0 ? (savings % 1 === 0 ? savings.toString() : savings.toFixed(2)).replace('.', ',') : '');

                  return (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-300 block mb-1">
                          Preço Final da Peça (R$)
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={origPrice > 0 ? `Ex: ${(origPrice - 10).toFixed(0)}` : 'Ex: 45'}
                          value={promoDisplay}
                          onChange={e => handlePromoPriceChange(slot.slotNumber, e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#1E293B] border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[9px] text-slate-400 block mt-1 leading-tight">
                          Quanto ele paga no site
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-300 block mb-1">
                          Ou Dê um Desconto de (-R$)
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 10"
                          value={discountDisplay}
                          onChange={e => handleDiscountAmountChange(slot.slotNumber, e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#1E293B] border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[9px] text-slate-400 block mt-1 leading-tight">
                          Valor abatido do catálogo
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Atalhos Rápidos de Desconto */}
                {origPrice > 0 && (
                  <div className="pt-1.5 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Atalhos Rápidos de Desconto:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(slot.slotNumber, 'reais', 5)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-orange-600 text-[11px] font-bold text-slate-200 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                      >
                        -R$ 5
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(slot.slotNumber, 'reais', 10)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-orange-600 text-[11px] font-bold text-slate-200 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                      >
                        -R$ 10
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(slot.slotNumber, 'reais', 15)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-orange-600 text-[11px] font-bold text-slate-200 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                      >
                        -R$ 15
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(slot.slotNumber, 'percent', 10)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-orange-600 text-[11px] font-bold text-slate-200 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(slot.slotNumber, 'percent', 20)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-orange-600 text-[11px] font-bold text-slate-200 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                      >
                        -20%
                      </button>
                    </div>
                  </div>
                )}

                {/* Resumo Visual Claro do Cálculo */}
                <div className="p-2.5 rounded-lg bg-[#0B1120] border border-slate-800 text-xs flex flex-col gap-1">
                  {savings > 0 && slot.promotionalPrice && slot.promotionalPrice < origPrice ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Resumo da Oferta:</span>
                        <span className="font-extrabold text-emerald-400">
                          Economia de R$ {savings.toFixed(2).replace('.', ',')} (-{pct}% OFF)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-slate-300">
                        <span>De <span className="line-through text-slate-500 font-semibold">R$ {origPrice.toFixed(2).replace('.', ',')}</span></span>
                        <span>➔</span>
                        <span className="text-orange-400 font-extrabold text-sm">
                          Por R$ {slot.promotionalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {/* Alerta inteligente caso tenha digitado um valor muito baixo achando que era o desconto */}
                      {slot.promotionalPrice <= 15 && origPrice >= 35 && (
                        <div className="mt-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-tight">
                          💡 <strong>Atenção:</strong> Você definiu que a peça vai custar <span className="font-bold underline">R$ {slot.promotionalPrice.toFixed(2).replace('.', ',')}</span> no total. Se a sua intenção era dar R$ {slot.promotionalPrice.toFixed(2).replace('.', ',')} de desconto, preencha <span className="font-bold text-white underline">R$ {(origPrice - slot.promotionalPrice).toFixed(2).replace('.', ',')}</span> no campo "Preço Final".
                        </div>
                      )}
                    </>
                  ) : slot.promotionalPrice && slot.promotionalPrice >= origPrice ? (
                    <div className="text-amber-400 text-[11px] leading-tight flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>O valor digitado (R$ {slot.promotionalPrice.toFixed(2).replace('.', ',')}) é igual ou maior que o preço normal do catálogo (R$ {origPrice.toFixed(2).replace('.', ',')}). Para ter promoção, coloque um valor menor ou use os botões rápidos.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Preço atual:</span>
                      <span className="font-bold text-slate-200">
                        R$ {origPrice.toFixed(2).replace('.', ',')} (sem desconto)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Input: Etiqueta / Badge */}
              <div className="flex flex-col gap-1 mb-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Etiqueta / Badge Superior
                </label>
                <input
                  type="text"
                  value={slot.badgeLabel || '🔥 OFERTA DESTAQUE DA OFICINA'}
                  onChange={e => handleSlotChange(slot.slotNumber, { badgeLabel: e.target.value })}
                  placeholder="Ex: 🔥 OFERTA DESTAQUE DA OFICINA"
                  className="h-8 px-3 rounded-lg bg-[#1E293B] border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Checkbox de Segurança: Stacking com Cupons */}
              <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slot.allowCouponStacking ?? false}
                  onChange={e => handleSlotChange(slot.slotNumber, { allowCouponStacking: e.target.checked })}
                  className="mt-0.5 rounded accent-orange-500 w-3.5 h-3.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-300">
                    Permitir acumular com cupons
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Se desmarcado, pedidos rejeitarão cupons para esta peça em promoção.
                  </span>
                </div>
              </label>

              {/* Botão Salvar Slot */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveSingleSlot(slot)}
                className="w-full h-9 rounded-xl font-bold text-xs uppercase tracking-wider bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer mt-auto"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Salvar Slot 0{slot.slotNumber} 💾</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
