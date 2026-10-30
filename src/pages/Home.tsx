import { useState, useMemo, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { ProductCustomizeModal } from '@/components/ProductCustomizeModal';
import { CartDrawer } from '@/components/CartDrawer';
import { OrcamentoModal } from '@/components/OrcamentoModal';
import { WorkshopProcessModal } from '@/components/WorkshopProcessModal';
import { WorkshopVideoPlayer } from '@/components/WorkshopVideoPlayer';
import { ReviewsSection } from '@/components/ReviewsSection';
import { SubmitReviewModal } from '@/components/SubmitReviewModal';
import { StorefrontHub, type StorefrontTab } from '@/components/StorefrontHub';
import { CustomSTLBanner } from '@/components/CustomSTLBanner';
import { CampaignShowcase } from '@/components/CampaignShowcase';
import { fetchActiveCampaign, type SeasonalCampaign } from '@/services/campaigns';
import { type CartItem, type Product, CATEGORY_LABELS, toProductCategory, toProductUniverse } from '@/data/products';
import { getStoredProducts, fetchRemoteProducts, getFeaturedProductId } from '@/services/storage';

export default function Home() {
  const [products, setProducts] = useState<Product[]>(getStoredProducts());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Busca assíncrona com fallback resiliente
  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchRemoteProducts();
      if (res && res.length > 0) {
        setProducts(res);
      } else {
        const stored = getStoredProducts();
        setProducts(stored);
        if (stored.length === 0) {
          setLoadError('O catálogo está sendo atualizado.');
        }
      }
    } catch (err: any) {
      console.warn('Falha na sincronização do catálogo:', err);
      const stored = getStoredProducts();
      setProducts(stored);
      if (stored.length === 0) {
        setLoadError('O catálogo está sendo atualizado.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadCatalog();
    const handleUpdate = () => {
      if (mounted) setProducts(getStoredProducts());
    };
    window.addEventListener('forja_products_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('forja_products_updated', handleUpdate);
    };
  }, [loadCatalog]);

  const [activeUniverse, setActiveUniverse] = useState<StorefrontTab>('ALL');
  const [activeCampaign, setActiveCampaign] = useState<SeasonalCampaign | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [configProduct, setConfigProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orcamentoOpen, setOrcamentoOpen] = useState(false);
  const [workshopModalOpen, setWorkshopModalOpen] = useState(false);
  const [submitReviewOpen, setSubmitReviewOpen] = useState(false);

  useEffect(() => {
    fetchActiveCampaign()
      .then(campaign => {
        if (campaign && campaign.isActive) {
          setActiveCampaign(campaign);
        }
      })
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      if (search) {
        const q = search.toLowerCase();
        const pCatLabel = (CATEGORY_LABELS as Record<string, string>)[p.category] || p.category;
        const matches = 
          p.name.toLowerCase().includes(q) || 
          p.category.toLowerCase().includes(q) || 
          pCatLabel.toLowerCase().includes(q) ||
          p.types.some(t => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 1. Filtragem por Janela/Universo Temático
      if (activeUniverse !== 'ALL') {
        const itemUniverse = p.universe || toProductUniverse(p.universe, p.name, p.category);
        if (activeUniverse === 'ANIME_MANGA') {
          if (itemUniverse !== 'ANIME_MANGA') return false;
        } else if (activeUniverse === 'POKEMON_TCG') {
          const isPokemon = itemUniverse === 'POKEMON_TCG' || (!p.universe && p.department === 'TCG');
          if (!isPokemon) return false;
        } else if (activeUniverse === 'POP_CULTURE_GEEK') {
          if (itemUniverse !== 'POP_CULTURE_GEEK') return false;
        } else if (activeUniverse === 'DIORAMA_ACCESSORY') {
          if (itemUniverse !== 'DIORAMA_ACCESSORY') return false;
        }
      }

      // 2. Sub-filtro de Categoria
      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'TCG') return p.department === 'TCG' || p.category === 'TCG';

      const pEnum = toProductCategory(p.category);
      const catEnum = toProductCategory(activeCategory);
      return p.category === activeCategory || pEnum === activeCategory || pEnum === catEnum;
    });
  }, [products, search, activeUniverse, activeCategory]);

  const featuredProduct = useMemo(() => {
    const fid = getFeaturedProductId();
    if (fid) {
      const match = products.find(p => p.id === fid && p.active) || products.find(p => p.id === fid);
      if (match) return match;
    }
    return products.find(p => p.featured && p.active) || products.find(p => p.featured) || null;
  }, [products]);

  function addToCart(item: CartItem) {
    setCart(prev => {
      const idx = prev.findIndex(i => 
        i.product.id === item.product.id && 
        i.scale === item.scale && 
        i.finish === item.finish && 
        i.material === item.material &&
        i.observations === item.observations
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
    setCartOpen(true);
  }

  function handleBuyNow(product: Product) {
    addToCart({
      product,
      scale: product.scales[0] || '1:10',
      finish: 'Peça Crua',
      material: product.materials[0] || 'PLA',
      qty: 1,
      unitPrice: product.basePrice,
      customized: false
    });
  }

  function handleBuyCampaignItem(product: Product, effectivePrice: number, campaignTag: string, customBadge?: string) {
    addToCart({
      product,
      scale: product.scales?.[0] || 'Escala 1:10 (~15 cm)',
      finish: 'Peça Crua',
      material: product.materials?.[0] || 'Resina',
      qty: 1,
      unitPrice: effectivePrice,
      promoPrice: effectivePrice,
      promoBadge: customBadge || campaignTag,
      campaignTag,
      origin: 'SEASONAL_CAMPAIGN',
      customized: false
    });
  }

  function handleCustomizeCampaignItem(product: Product, effectivePrice: number, campaignTag: string) {
    setConfigProduct({
      ...product,
      basePrice: effectivePrice,
      promoPrice: effectivePrice,
      campaignTag,
      origin: 'SEASONAL_CAMPAIGN'
    } as any);
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B0D13] text-white flex flex-col font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* Header com Logo ImagineLab */}
      <Header
        cart={cart}
        onCartOpen={() => setCartOpen(true)}
        onOrcamento={() => setOrcamentoOpen(true)}
        onOpenWorkshopModal={() => setWorkshopModalOpen(true)}
        search={search}
        onSearch={setSearch}
      />

      {/* Hero Editorial com Headline Roxo/Ciano */}
      <Hero 
        onOrcamento={() => setOrcamentoOpen(true)} 
        featuredProduct={featuredProduct}
        products={products}
        onConfigure={setConfigProduct}
        onOpenWorkshopModal={() => setWorkshopModalOpen(true)}
      />

      {/* Janelas / Universos Temáticos na Vitrine */}
      <StorefrontHub
        activeTab={activeUniverse}
        onTabChange={(tab) => {
          setActiveUniverse(tab);
          const el = document.getElementById('catalogo');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        products={products}
        totalProductsCount={products.filter(p => p.active).length}
        activeCampaign={activeCampaign}
      />

      {/* SECTION 01 — Faixa de Destaque / Manifesto ImagineLab (Fundo Roxo) */}
      <section className="w-full max-w-full bg-gradient-to-r from-[#6C4AB6] via-[#7C3AED] to-[#4F46E5] text-white py-12 md:py-20 px-4 md:px-8 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
          <div className="md:col-span-3 text-[11px] font-bold tracking-[0.25em] uppercase text-purple-200/90 pt-2">
            IMAGINELAB • 3D STUDIO
          </div>
          <div className="md:col-span-9 flex flex-col">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-cyan-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
              <span>01 — SOB MEDIDA</span>
            </span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-white uppercase tracking-tight">
              01 — SOB MEDIDA | SUA IDEIA FORA DA TELA. CRIAMOS PROJETOS PERSONALIZADOS DO ZERO.
            </h2>
          </div>
        </div>
      </section>

      {/* SECTION 02 — Catálogo de Produtos */}
      <section id="catalogo" className="w-full max-w-full bg-[#ECE8DE] text-[#171717] py-12 md:py-24 px-4 md:px-8 overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10 pb-6 border-b border-[#D6D0C2]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#737373] block mb-2">
                02 — Catálogo ImagineLab
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-[#171717] uppercase tracking-wide leading-none">
                {activeUniverse === 'CAMPAIGN' && activeCampaign ? activeCampaign.name : 'Escolha a sua próxima peça.'}
              </h2>
            </div>
            <button
              onClick={() => {
                setActiveUniverse('ALL');
                setActiveCategory('ALL');
              }}
              className="text-xs font-bold tracking-wider uppercase text-[#171717] hover:text-[#7C3AED] transition-colors flex items-center gap-1.5 self-start md:self-end cursor-pointer"
            >
              <span>Ver catálogo completo</span>
              <span>→</span>
            </button>
          </div>

          {activeUniverse === 'CAMPAIGN' && activeCampaign ? (
            <CampaignShowcase
              campaign={activeCampaign}
              catalogProducts={products}
              onBuyCampaignItem={handleBuyCampaignItem}
              onCustomizeCampaignItem={handleCustomizeCampaignItem}
            />
          ) : (
            <>
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 w-full max-w-full pb-6 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'FIGURE_POKEMON', label: 'Figures Pokémon' },
                  { id: 'DIORAMA', label: 'Dioramas' },
                  { id: 'CHIBI', label: 'Colecionáveis' },
                  { id: 'ACCESSORY_3D', label: 'Geek 3D' },
                  { id: 'TCG', label: 'TCG & Selados' },
                ].map(tab => {
                  const active = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        active 
                          ? 'bg-[#171717] text-white shadow-md ring-2 ring-[#7C3AED]/40' 
                          : 'bg-[#DCD6C8] text-[#525252] hover:bg-[#D0C9B8] hover:text-[#171717]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Product Grid */}
              {isLoading && filteredProducts.length === 0 ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-full bg-[#DCD6C8] border border-[#D0C9B8] text-xs font-bold uppercase tracking-wider text-[#525252] max-w-sm mx-auto shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] animate-ping" />
                    <span>Conectando ao catálogo ImagineLab...</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="flex flex-col animate-pulse select-none">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#D8D2C4] border border-black/5">
                          <div className="absolute top-3 left-3 w-8 h-3.5 rounded bg-[#C9C2B2]" />
                          <div className="absolute top-3 right-3 w-20 h-4 rounded bg-[#C9C2B2]" />
                          <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#C9C2B2]" />
                        </div>
                        <div className="pt-3 pb-1 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="w-20 h-3 rounded bg-[#D0C9B8]" />
                            <div className="w-12 h-3 rounded bg-[#D0C9B8]" />
                          </div>
                          <div className="w-3/4 h-6 rounded bg-[#D0C9B8]" />
                          <div className="mt-1 pt-2 border-t border-black/5 flex items-end justify-between">
                            <div className="flex flex-col gap-1">
                              <div className="w-14 h-2.5 rounded bg-[#D0C9B8]" />
                              <div className="w-20 h-6 rounded bg-[#D0C9B8]" />
                            </div>
                            <div className="w-16 h-4 rounded bg-[#D0C9B8]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : loadError && filteredProducts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
                  <div className="text-3xl">🔮</div>
                  <h3 className="font-display text-2xl uppercase">Catálogo em atualização</h3>
                  <p className="text-xs text-[#737373]">
                    As peças estão sendo organizadas no laboratório. Toque no botão abaixo para atualizar a vitrine.
                  </p>
                  <button
                    onClick={() => loadCatalog()}
                    className="px-6 py-2.5 rounded-full bg-[#171717] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#7C3AED] transition-colors cursor-pointer"
                  >
                    Atualizar Vitrine
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-3xl opacity-40">🔍</span>
                  <h3 className="font-display text-2xl uppercase text-[#171717]">Nenhum item nesta categoria</h3>
                  <button
                    onClick={() => {
                      setActiveUniverse('ALL');
                      setActiveCategory('ALL');
                    }}
                    className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider mt-2 hover:underline cursor-pointer"
                  >
                    Voltar a todos os produtos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
                  {filteredProducts.map((p, idx) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={idx + 1}
                      onConfigure={setConfigProduct}
                      onBuyNow={handleBuyNow}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* BANNER / JANELA FIXA: Oficina Sob Medida (CustomSTLBanner) */}
      <CustomSTLBanner onOrcamento={() => setOrcamentoOpen(true)} />

      {/* SECTION 03 — Como Funciona / Bastidores do Laboratório */}
      <section id="como-funciona" className="w-full max-w-full bg-[#0B0D13] text-white py-16 md:py-24 px-4 md:px-8 border-t border-[#1E2433] overflow-hidden scroll-mt-20">
        <div id="oficina" className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Player de Vídeo dos Bastidores */}
          <div className="lg:col-span-6 w-full">
            <WorkshopVideoPlayer />
          </div>

          {/* Right Process Explanation */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#38BDF8]">
                03 — COMO FUNCIONA • BASTIDORES
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight leading-[0.95] mb-6">
              Da modelagem digital ao acabamento final.
            </h2>
            <p className="text-sm md:text-base text-[#94A3B8] mb-8 leading-relaxed max-w-xl">
              A impressão 3D é só o início. No laboratório ImagineLab realizamos lavagem, cura UV, lixamento fino, pintura artística manual e embalagem reforçada — tudo com atenção milimétrica a cada detalhe.
            </p>

            <div className="flex flex-col border-t border-[#1E2433]">
              <div className="py-4 border-b border-[#1E2433] flex items-start gap-4">
                <span className="font-mono text-xs text-[#7C3AED] font-bold pt-0.5">01</span>
                <div>
                  <h4 className="font-display text-xl text-white uppercase tracking-wide">Impressão 3D de Alta Resolução</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Tecnologias FDM e Resina 8K configuradas especificamente para cada geometria e escala.</p>
                </div>
              </div>

              <div className="py-4 border-b border-[#1E2433] flex items-start gap-4">
                <span className="font-mono text-xs text-[#7C3AED] font-bold pt-0.5">02</span>
                <div>
                  <h4 className="font-display text-xl text-white uppercase tracking-wide">Pós-Processamento e Pintura Manual</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Remoção cuidadosa de suportes, cura UV, primer e aplicação artesanal de tintas.</p>
                </div>
              </div>

              <div className="py-4 border-b border-[#1E2433] flex items-start gap-4">
                <span className="font-mono text-xs text-[#7C3AED] font-bold pt-0.5">03</span>
                <div>
                  <h4 className="font-display text-xl text-white uppercase tracking-wide">Envio Protegido para Todo o Brasil</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Embalagem multicamada antichoque direta de Pinhalzinho-SP com rastreio total.</p>
                </div>
              </div>
            </div>

            {/* Botão de destaque para abrir o modal completo de processo */}
            <button
              onClick={() => setWorkshopModalOpen(true)}
              className="mt-8 self-start px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-950/80 to-purple-900/60 hover:from-purple-900 hover:to-purple-800 border border-purple-500/40 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-purple-950/50 hover:shadow-purple-700/30 transition-all cursor-pointer ring-1 ring-purple-400/30"
            >
              <span className="text-[#38BDF8]">⚡</span>
              <span>Conhecer as 4 Etapas Detalhadas</span>
              <span className="text-[#38BDF8]">→</span>
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 04 — Sob Medida: Chamada Direta WhatsApp */}
      <section className="w-full max-w-full bg-[#ECE8DE] text-[#171717] py-16 md:py-24 px-4 md:px-8 border-t border-[#D6D0C2] overflow-hidden">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 flex flex-col">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#7C3AED] mb-2">
              NÃO ENCONTROU O QUE PROCURAVA?
            </span>
            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[#171717] uppercase tracking-tight leading-[0.92]">
              Você imagina. <br />
              A ImagineLab cria.
            </h2>
          </div>

          <div className="md:col-span-5 flex flex-col items-start md:items-end gap-5">
            <p className="text-sm md:text-base text-[#525252] leading-relaxed max-w-sm md:text-right">
              Produzimos sob encomenda. Envie a referência, o link do modelo (Thingiverse, Printables, Drive) ou a sua ideia.
            </p>
            <button
              onClick={() => setOrcamentoOpen(true)}
              className="h-12 px-7 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-xl cursor-pointer ring-1 ring-purple-400/40"
            >
              <span>SOLICITAR ORÇAMENTO NO WHATSAPP</span>
              <span>💬</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 05 — Avaliações Autênticas */}
      <ReviewsSection onOpenSubmitReview={() => setSubmitReviewOpen(true)} />

      {/* Footer ImagineLab */}
      <footer className="w-full max-w-full bg-[#0B0D13] text-white py-12 px-4 md:px-8 border-t border-[#1E2433] overflow-hidden">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-[#1E2433]">
          {/* Logo ImagineLab */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#6C4AB6] to-[#38BDF8] p-[1.5px] shadow-lg shadow-purple-900/40">
              <div className="w-full h-full bg-[#0B0D13] rounded-[10px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#38BDF8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.9 8.4A2 2 0 0 0 2 10.1v7.8a2 2 0 0 0 1.05 1.76l6.05 3.94a2 2 0 0 0 2.17.05l9.95-6.11A2 2 0 0 0 22 15.8V8a2 2 0 0 0-.88-1.6Z"/>
                  <path d="m10 22 10-6"/>
                  <path d="M10 22V10"/>
                  <path d="m2 10 10-6"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl tracking-wide uppercase text-white">
                ImagineLab<span className="text-[#38BDF8]">.3D</span>
              </span>
              <span className="text-[10px] text-[#94A3B8] font-mono">
                Pinhalzinho - SP • @imaginelab.3d
              </span>
            </div>
          </div>

          {/* Slogan */}
          <div className="font-display text-2xl md:text-3xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#38BDF8]">
            Onde a imaginação vira realidade em 3D
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex flex-wrap items-center gap-6">
            <a href="#catalogo" className="hover:text-white transition-colors">Catálogo</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <button onClick={() => setWorkshopModalOpen(true)} className="hover:text-[#38BDF8] transition-colors cursor-pointer">Bastidores</button>
            <a href="#avaliacoes" className="hover:text-white transition-colors">Avaliações</a>
            <button onClick={() => setOrcamentoOpen(true)} className="hover:text-white transition-colors cursor-pointer">Orçamentos</button>
            <a href="https://instagram.com/imaginelab.3d" target="_blank" rel="noopener noreferrer" className="hover:text-[#38BDF8] transition-colors">
              Instagram @imaginelab.3d
            </a>
          </div>
          <div>
            © 2026 IMAGINELAB • PINHALZINHO-SP • TODOS OS DIREITOS RESERVADOS
          </div>
        </div>
      </footer>

      {/* Modais de Interação */}
      <ProductCustomizeModal
        product={configProduct}
        onClose={() => setConfigProduct(null)}
        onAdd={addToCart}
      />
      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onClear={() => setCart([])}
      />
      <OrcamentoModal
        open={orcamentoOpen}
        onClose={() => setOrcamentoOpen(false)}
      />
      <WorkshopProcessModal
        isOpen={workshopModalOpen}
        onClose={() => setWorkshopModalOpen(false)}
        onRequestCustomQuote={() => {
          setWorkshopModalOpen(false);
          setOrcamentoOpen(true);
        }}
      />
      <SubmitReviewModal
        open={submitReviewOpen}
        onClose={() => setSubmitReviewOpen(false)}
      />
    </div>
  );
}
