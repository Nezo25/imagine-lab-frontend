import type { Product } from '@/data/products';
import { HeroShowcaseSlider } from './HeroShowcaseSlider';
import { ContactForgeBanner } from './ContactForgeBanner';

interface Props {
  onOrcamento: () => void;
  featuredProduct?: Product | null;
  products?: Product[];
  onConfigure?: (p: Product) => void;
  onOpenWorkshopModal?: () => void;
}

export function Hero({ onOrcamento, featuredProduct, products = [], onConfigure, onOpenWorkshopModal }: Props) {
  return (
    <section id="destaques" className="relative overflow-hidden bg-[#0B0D13] text-white pt-10 pb-16 md:py-20 px-4 md:px-8 border-b border-[#1E2433]">
      {/* Background ambient lighting (Purple & Cyan Glow) */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Editorial Content */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Subtitle tag */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-[#38BDF8]" />
            <span className="text-[11px] md:text-xs font-bold tracking-[0.2em] text-[#38BDF8] uppercase">
              IMPRESSÃO 3D PERSONALIZADA • MONTE ALEGRE-SP
            </span>
          </div>

          {/* Main Huge Headline com "REALIDADE" destacado no degradê roxo/ciano */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide text-white uppercase mb-6 flex flex-col gap-1 sm:gap-2 leading-[0.92]">
            <span className="block">ONDE A IMAGINAÇÃO</span>
            <span className="block bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#38BDF8] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(124,58,237,0.35)]">
              VIRA REALIDADE.
            </span>
          </h1>

          {/* Paragraph */}
          <p className="text-sm md:text-base text-[#94A3B8] max-w-lg mb-8 leading-relaxed font-normal">
            Peças impressas sob encomenda, colecionáveis exclusivos e projetos personalizados. Traga sua ideia ou arquivo para a bancada.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-14">
            <a
              href="#catalogo"
              className="h-12 px-7 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-lg shadow-purple-950/50 hover:shadow-purple-700/40 active:scale-95 cursor-pointer ring-1 ring-purple-400/40"
            >
              <span>Explorar a coleção</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>

            <button
              onClick={onOrcamento}
              className="h-12 px-6 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all bg-[#131722] hover:bg-[#1E2433] text-white border border-[#2E384D] hover:border-[#38BDF8] cursor-pointer shadow-md"
            >
              <span className="text-[#38BDF8]">📐</span>
              <span>Solicitar Orçamento</span>
            </button>

            {onOpenWorkshopModal && (
              <button
                onClick={onOpenWorkshopModal}
                className="h-12 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all bg-[#131722] hover:bg-[#1E2433] text-slate-200 hover:text-white border border-[#2E384D] hover:border-purple-500/60 cursor-pointer shadow-md"
                title="Ver bastidores do laboratório ImagineLab"
              >
                <span className="text-[#38BDF8]">▶</span>
                <span>Como Funciona</span>
              </button>
            )}
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-[#1E2433] max-w-xl lg:max-w-2xl">
            <a
              href="#catalogo"
              className="group rounded-xl p-2 -m-2 transition-all cursor-pointer hover:border-purple-500/40 hover:bg-purple-950/20 border border-transparent block"
              title="Explorar peças entregues no catálogo"
            >
              <div className="font-display text-3xl md:text-4xl text-white group-hover:text-[#38BDF8] transition-colors">
                100+
              </div>
              <div className="text-[11px] text-[#64748B] group-hover:text-slate-300 transition-colors mt-0.5">
                projetos impressos
              </div>
            </a>

            <a
              href="#avaliacoes"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('avaliacoes');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group rounded-xl p-2 -m-2 transition-all cursor-pointer hover:border-purple-500/40 hover:bg-purple-950/20 border border-transparent block"
              title="Ver depoimentos e avaliações de colecionadores"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                <span className="font-display text-3xl md:text-4xl text-white group-hover:text-[#38BDF8] transition-colors flex items-center gap-1">
                  4,9 <span className="text-[#38BDF8] text-xl leading-none group-hover:scale-110 transition-transform">★</span>
                </span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm group-hover:border-cyan-400 group-hover:bg-cyan-900/90 transition-all inline-flex items-center gap-0.5 self-start sm:self-auto">
                  <span>Avaliações</span>
                  <span className="text-[11px] leading-none">↓</span>
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] group-hover:text-slate-300 transition-colors mt-0.5">
                avaliação média
              </div>
            </a>

            <div
              onClick={onOpenWorkshopModal}
              className={`group rounded-xl p-2 -m-2 transition-all ${
                onOpenWorkshopModal
                  ? 'cursor-pointer hover:border-purple-500/40 hover:bg-purple-950/20 border border-transparent'
                  : ''
              }`}
              title="Conheça o processo da ImagineLab"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                <span className="font-display text-3xl md:text-4xl text-white group-hover:text-[#38BDF8] transition-colors">
                  100%
                </span>
                {onOpenWorkshopModal && (
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/70 border border-purple-500/40 px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm group-hover:border-purple-400 group-hover:bg-purple-900/90 transition-all inline-flex items-center gap-0.5 self-start sm:self-auto">
                    <span>Bastidores</span>
                    <span className="text-[9px] leading-none">▶</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#64748B] group-hover:text-slate-300 transition-colors mt-0.5">
                acabamento artesanal
              </div>
            </div>
          </div>
        </div>

        {/* Right Studio Showcase Card */}
        <div className="lg:col-span-5 relative flex flex-col items-center">
          <HeroShowcaseSlider
            featuredProduct={featuredProduct}
            products={products}
            onConfigure={onConfigure}
          />
          <ContactForgeBanner />

          {/* Right vertical text */}
          <div className="hidden xl:flex absolute -right-10 top-1/2 -translate-y-1/2 rotate-90 origin-center text-[10px] tracking-[0.3em] font-semibold text-[#475569] uppercase pointer-events-none">
            IMAGINELAB • 3D STUDIO • MONTE ALEGRE-SP
          </div>
        </div>

      </div>
    </section>
  );
}
