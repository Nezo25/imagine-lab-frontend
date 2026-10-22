import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { ProductCustomizeModal } from '@/components/ProductCustomizeModal';
import { CartDrawer } from '@/components/CartDrawer';
import { OrcamentoModal } from '@/components/OrcamentoModal';
import { FilterDrawer, type FilterState } from '@/components/FilterDrawer';
import { HowItWorks } from '@/components/HowItWorks';
import { BrandTrust } from '@/components/BrandTrust';
import { ALL_CATEGORIES, type CartItem, type Category, type Product } from '@/data/products';
import { getStoredProducts, fetchRemoteProducts } from '@/services/storage';

export default function Home() {
  const [products, setProducts] = useState<Product[]>(getStoredProducts());
  const [isLoading, setIsLoading] = useState(false);

  // Load products (local + remote)
  useEffect(() => {
    let mounted = true;
    fetchRemoteProducts()
      .then((res) => {
        if (mounted && res && res.length > 0) setProducts(res);
      })
      .catch(() => {
        if (mounted) setProducts(getStoredProducts());
      });

    const handleUpdate = () => {
      if (mounted) setProducts(getStoredProducts());
    };
    window.addEventListener('imaginelab_products_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('imaginelab_products_updated', handleUpdate);
    };
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({ categories: [], materials: [], scales: [] });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Modals & Drawers
  const [configProduct, setConfigProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orcamentoOpen, setOrcamentoOpen] = useState(false);

  // Filter Logic
  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;

      // Category tab
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchTag = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchTag) return false;
      }

      // Advanced filters from drawer
      if (filters.categories.length > 0 && !filters.categories.includes(p.category)) {
        return false;
      }
      if (filters.materials.length > 0 && !filters.materials.some((m) => p.materials.includes(m))) {
        return false;
      }
      if (filters.scales.length > 0 && !filters.scales.some((s) => p.scales.includes(s))) {
        return false;
      }

      return true;
    });
  }, [products, selectedCategory, search, filters]);

  function addToCart(item: CartItem) {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.product.id === item.product.id &&
          i.scale === item.scale &&
          i.finish === item.finish &&
          i.material === item.material &&
          i.color === item.color &&
          i.isCustom3D === item.isCustom3D
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [item, ...prev];
    });
    setCartOpen(true);
  }

  function handleBuyNow(product: Product) {
    addToCart({
      product,
      scale: product.scales[0] || 'Padrão (12 a 15 cm)',
      finish: 'Peça Crua (Padrão)',
      material: product.materials[0] || 'PLA Premium',
      color: 'Roxo ImagineLab',
      qty: 1,
      unitPrice: product.basePrice,
      customized: false,
    });
  }

  const activeFiltersCount =
    filters.categories.length + filters.materials.length + filters.scales.length;

  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col selection:bg-purple-900/50 selection:text-cyan-300">
      <Header
        cart={cart}
        onCartOpen={() => setCartOpen(true)}
        onOrcamento={() => setOrcamentoOpen(true)}
        search={search}
        onSearch={setSearch}
      />

      <main className="flex-1">
        <Hero
          onOrcamento={() => setOrcamentoOpen(true)}
          onExploreCatalog={() => {
            const el = document.getElementById('catalogo');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onHowItWorks={() => {
            const el = document.getElementById('como-funciona');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Catalog Section */}
        <section id="catalogo" className="py-12 md:py-16 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#4CA8B8] mb-1.5 block">
                Catálogo Exclusivo
              </span>
              <h2 className="font-heading text-2xl md:text-4xl font-black text-white tracking-tight">
                Peças Prontas & Sob Encomenda
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Todas as peças podem ser customizadas em escala, cor e material diretamente com a gente.
              </p>
            </div>

            {/* Quick Action: Orçador Direto */}
            <button
              type="button"
              onClick={() => setOrcamentoOpen(true)}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-[#141C2E] hover:bg-[#1E2942] border border-cyan-500/40 text-cyan-300 flex items-center gap-2 self-start md:self-auto shadow-sm"
            >
              <span>📐 Tem um modelo próprio? Envie o STL</span>
            </button>
          </div>

          {/* Quick Categories Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === 'ALL'
                  ? 'bg-[#5E488C] border-purple-500 text-white shadow-lg glow-purple'
                  : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
              }`}
            >
              ✨ Todos ({products.filter((p) => p.active).length})
            </button>

            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-[#5E488C] border-purple-500 text-white shadow-lg glow-purple'
                    : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#121828] border border-[#2A3752] text-slate-300 hover:text-white shrink-0 ml-auto flex items-center gap-1.5"
            >
              <span>⚡ Filtros Avançados</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Product Grid */}
          {activeProducts.length === 0 ? (
            <div className="p-16 rounded-3xl glass-card text-center flex flex-col items-center gap-3">
              <span className="text-5xl opacity-40">🔍</span>
              <h3 className="text-base font-bold text-white">Nenhum produto encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Tente ajustar os termos da busca ou limpar os filtros para ver mais criações da ImagineLab.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setFilters({ categories: [], materials: [], scales: [] });
                }}
                className="mt-2 h-9 px-4 rounded-xl text-xs font-bold bg-[#5E488C] text-white"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onConfigure={setConfigProduct}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
          )}
        </section>

        {/* How It Works Workflow Section */}
        <HowItWorks onOrcamento={() => setOrcamentoOpen(true)} />

        {/* Brand Trust Section */}
        <BrandTrust />
      </main>

      {/* Footer */}
      <footer className="bg-[#070A10] border-t border-[#1E2638] py-12 px-4 md:px-8 text-slate-400 text-xs">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Coluna 1: Logo & Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-purple-500/40 bg-[#111726] p-0.5 flex items-center justify-center">
                <img src="/images/logo.png" alt="ImagineLab" className="w-full h-full object-contain" />
              </div>
              <span className="font-heading font-black text-lg text-white">
                Imagine<span className="text-cyan-400">Lab</span> 3D
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Onde a imaginação vira realidade em 3D. Impressão personalizada, peças funcionais e colecionáveis com acabamento premium.
            </p>
            <div className="flex items-center gap-2 text-slate-300 font-semibold mt-1">
              <span>📍 Pinhalzinho - SP</span>
              <span>•</span>
              <span className="text-cyan-300">CEP 13990-000</span>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">Navegação</h4>
            <a href="#catalogo" className="hover:text-cyan-300 transition-colors">Catálogo de Produtos</a>
            <button onClick={() => setOrcamentoOpen(true)} className="text-left hover:text-cyan-300 transition-colors">
              Simulador STL / Orçamento 3D
            </button>
            <a href="#como-funciona" className="hover:text-cyan-300 transition-colors">Como Produzimos</a>
            <a href="/admin" className="hover:text-purple-300 transition-colors">Área do Administrador</a>
          </div>

          {/* Coluna 3: Materiais e Tecnologia */}
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">Tecnologias</h4>
            <span>• PLA Premium & PLA Silk Metalizado</span>
            <span>• PETG Técnico de Alta Resistência</span>
            <span>• Resina 8K Ultra-Detalhe Fotopolimérica</span>
            <span>• Fatiamento Micrométrico em Camadas</span>
          </div>

          {/* Coluna 4: Contato & Redes */}
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">Contato</h4>
            <a
              href="https://instagram.com/imaginelab.3d"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-pink-400 transition-colors"
            >
              <span>📸</span>
              <span>@imaginelab.3d</span>
            </a>
            <a
              href="https://wa.me/5519998214411"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <span>💬</span>
              <span>(19) 99821-4411 (WhatsApp)</span>
            </a>
            <span className="text-[11px] text-slate-400 mt-1">
              Atendimento de Segunda a Sábado • Pinhalzinho-SP para todo o Brasil
            </span>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto pt-6 border-t border-[#151C2C] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} ImagineLab 3D. Todos os direitos reservados.</span>
          <span>Desenvolvido com tecnologia de ponta • Pinhalzinho-SP</span>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <OrcamentoModal
        open={orcamentoOpen}
        onClose={() => setOrcamentoOpen(false)}
        onAddToCart={addToCart}
      />

      <ProductCustomizeModal
        product={configProduct}
        onClose={() => setConfigProduct(null)}
        onAdd={addToCart}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onRemove={(idx) => setCart((prev) => prev.filter((_, i) => i !== idx))}
        onClear={() => setCart([])}
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onClear={() => setFilters({ categories: [], materials: [], scales: [] })}
      />
    </div>
  );
}
