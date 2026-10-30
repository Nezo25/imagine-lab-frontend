import React from 'react';

interface CustomSTLBannerProps {
  onOrcamento: () => void;
}

export function CustomSTLBanner({ onOrcamento }: CustomSTLBannerProps) {
  return (
    <section className="w-full max-w-full bg-[#0B0D13] text-white py-12 md:py-16 px-4 md:px-8 border-y border-[#1E2433] relative overflow-hidden select-none">
      {/* Luzes atmosféricas (Roxo e Ciano) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid sutil de blueprint / mesa de impressão */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#7C3AED_1px,transparent_1px)] [background-size:24px_24px]" 
      />

      <div className="max-w-[1440px] mx-auto relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#131722] via-[#1E2433] to-[#131722] border border-purple-500/30 hover:border-purple-500/50 shadow-2xl p-5 sm:p-10 md:p-12 transition-all duration-300 w-full max-w-full overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Lado Esquerdo: Textos & Proposta de Valor */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              {/* Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] bg-purple-500/25 text-[#A855F7] border border-purple-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-sm max-w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping shrink-0" />
                  <span className="break-words">IMAGINELAB SOB MEDIDA • PROJETOS 3D EXCLUSIVOS</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30 hidden sm:inline-block shrink-0">
                  FDM & Resina de Alta Resolução
                </span>
              </div>

              {/* Chamada Principal (Exatamente conforme diretriz do usuário) */}
              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight leading-[0.95] mt-1">
                NÃO ENCONTROU O QUE PROCURAVA?
              </h3>

              {/* Descrição */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Produzimos sob encomenda. Envie a referência, o link do modelo (Thingiverse, Printables, Drive) ou a sua ideia.
              </p>

              {/* Destaques / Tags de Confiança */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 bg-[#0B0D13] px-3 py-1.5 rounded-lg border border-[#2E384D] font-medium">
                  <span className="text-[#38BDF8]">📐</span>
                  <span>Qualquer Escala ou Dimensão</span>
                </span>
                <span className="flex items-center gap-1.5 bg-[#0B0D13] px-3 py-1.5 rounded-lg border border-[#2E384D] font-medium">
                  <span className="text-[#A855F7]">🎨</span>
                  <span>Pintura Artesanal ou Peça Bruta</span>
                </span>
                <span className="flex items-center gap-1.5 bg-[#0B0D13] px-3 py-1.5 rounded-lg border border-[#2E384D] font-medium">
                  <span className="text-[#22c55e]">⚡</span>
                  <span>Orçamento Rápido no WhatsApp</span>
                </span>
              </div>
            </div>

            {/* Lado Direito: Card de Ação Rápida */}
            <div className="lg:col-span-4 flex flex-col items-stretch lg:items-end justify-center">
              <div className="w-full max-w-md bg-[#0B0D13]/90 rounded-2xl p-6 border border-purple-500/25 shadow-xl flex flex-col gap-4 text-center lg:text-left">
                <div>
                  <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                    ✦ PROJETO PERSONALIZADO
                  </span>
                  <h4 className="font-display text-xl text-white uppercase tracking-wide">
                    Tire sua ideia da tela
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Analisamos viabilidade técnica, peso de material e tempo de impressão sem compromisso.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOrcamento}
                  className="w-full py-3.5 px-6 rounded-xl font-display text-sm uppercase tracking-wider font-bold bg-gradient-to-r from-[#7C3AED] via-[#6C4AB6] to-[#38BDF8] hover:from-[#6D28D9] hover:to-[#0284C7] text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-950/80 hover:shadow-cyan-600/30 active:scale-[0.98] transition-all cursor-pointer ring-1 ring-purple-400/50"
                >
                  <span>SOLICITAR ORÇAMENTO NO WHATSAPP</span>
                  <span className="text-base leading-none">💬</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
