import React from 'react';
import { ModelViewer3D } from './ModelViewer3D';

interface Props {
  onOrcamento: () => void;
  onExploreCatalog: () => void;
  onHowItWorks: () => void;
}

export function Hero({ onOrcamento, onExploreCatalog, onHowItWorks }: Props) {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-20 px-4 md:px-8 border-b border-[#1A2336]/60 tech-grid">
      {/* Dynamic Background Glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25"
        style={{ background: 'radial-gradient(circle, #5E488C 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-10 right-10 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
        style={{ background: 'radial-gradient(circle, #4CA8B8 0%, transparent 70%)' }}
      />

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Column: Headlines & CTA (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 bg-purple-950/60 border border-purple-500/40 text-purple-300 backdrop-blur-md glow-purple">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Impressão 3D de Precisão • Pinhalzinho-SP</span>
          </div>

          {/* Slogan & Title */}
          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-4">
            Onde a imaginação{' '}
            <span className="bg-gradient-to-r from-[#4CA8B8] via-[#7E63B8] to-purple-400 bg-clip-text text-transparent">
              vira realidade
            </span>{' '}
            em 3D.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-6">
            Fabricação sob demanda em <strong>PLA</strong>, <strong>PETG Técnico</strong> e{' '}
            <strong>Resina 8K Ultra-Detalhe</strong>. Do arquivo digital à peça física com acabamento
            profissional e envio para todo o Brasil.
          </p>

          {/* Highlights Pills */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {[
              '⚙️ Orçamento 3D em Segundos',
              '🎨 Pintura & Acabamento Manual',
              '📍 Sede em Pinhalzinho-SP',
              '🚀 Retirada Local ou Envio Seguro',
            ].map((pill) => (
              <span
                key={pill}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#111726]/80 text-slate-300 border border-[#222D42] backdrop-blur-sm"
              >
                {pill}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOrcamento}
              className="h-12 px-7 rounded-xl font-black text-sm uppercase tracking-wide bg-[#5E488C] hover:bg-[#4D3974] text-white flex items-center justify-center gap-2.5 shadow-xl glow-purple transition-all transform hover:-translate-y-0.5"
            >
              <span>📐</span>
              <span>Fazer Orçamento Instantâneo</span>
            </button>

            <button
              type="button"
              onClick={onExploreCatalog}
              className="h-12 px-6 rounded-xl font-bold text-sm bg-[#131B2D] hover:bg-[#1B253D] text-slate-200 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 flex items-center justify-center gap-2 transition-all"
            >
              <span>📦</span>
              <span>Explorar Catálogo</span>
            </button>

            <button
              type="button"
              onClick={onHowItWorks}
              className="h-12 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>❓ Como Funciona</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#1E2638] w-full max-w-lg">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">0.05<span className="text-cyan-400 text-sm">mm</span></div>
              <div className="text-[11px] text-slate-400 font-medium">Resolução Máxima</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">100<span className="text-purple-400 text-sm">%</span></div>
              <div className="text-[11px] text-slate-400 font-medium">Personalizável</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">24<span className="text-cyan-400 text-sm">h</span></div>
              <div className="text-[11px] text-slate-400 font-medium">Retorno Ágil</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Interactive Showroom Widget (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full relative rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 p-2 shadow-2xl">
            {/* Top Interactive Indicator */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#222D42] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Visualizador 3D Interativo</span>
              </div>
              <span className="text-[11px] text-cyan-300 font-mono">Three.js WebGL</span>
            </div>

            {/* 3D Model Canvas */}
            <div className="h-[320px] sm:h-[380px] w-full rounded-2xl overflow-hidden relative">
              <ModelViewer3D file={null} materialColor="#5E488C" />
            </div>

            {/* Bottom Quick Callout */}
            <div className="p-3 bg-[#0E131F]/90 rounded-b-2xl flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                💡 Teste a rotação 3D com o mouse ou toque
              </span>
              <button
                type="button"
                onClick={onOrcamento}
                className="text-[11px] font-bold text-cyan-300 hover:underline flex items-center gap-1"
              >
                Enviar meu STL →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
