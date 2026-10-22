import React from 'react';

const STEPS = [
  {
    step: '01',
    icon: '📤',
    title: 'Envio ou Escolha',
    description: 'Faça upload do seu arquivo STL/OBJ no nosso visualizador 3D ou selecione um modelo exclusivo em nosso catálogo.',
  },
  {
    step: '02',
    icon: '⚙️',
    title: 'Configuração & Orçamento',
    description: 'Escolha material (PLA, PETG ou Resina 8K), cor e nível de acabamento. Nosso algoritmo calcula o orçamento na hora.',
  },
  {
    step: '03',
    icon: '🖨️',
    title: 'Impressão de Alta Precisão',
    description: 'Produzido em nosso laboratório com calibração micrométrica, controle de temperatura e inspeção minuciosa.',
  },
  {
    step: '04',
    icon: '📦',
    title: 'Retirada ou Entrega',
    description: 'Retire diretamente conosco em Pinhalzinho-SP ou receba com embalagem reforçada anti-impacto em qualquer lugar do Brasil.',
  },
];

export function HowItWorks({ onOrcamento }: { onOrcamento: () => void }) {
  return (
    <section id="como-funciona" className="py-16 md:py-24 px-4 md:px-8 border-b border-[#1E2638] bg-[#0A0D14] relative">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">
            Fluxo Simples & Transparente
          </span>
          <h2 className="font-heading text-2xl md:text-4xl font-black text-white tracking-tight">
            Como transformamos sua ideia em realidade
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-3 leading-relaxed">
            Do modelo 3D digital na sua tela até o objeto físico final em suas mãos, em 4 etapas diretas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="relative p-6 rounded-2xl glass-card flex flex-col justify-between border border-[#222D42] hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2.5 rounded-xl bg-[#121828] border border-[#222D42] group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                <span className="font-mono text-2xl font-black text-[#4CA8B8]/40 group-hover:text-cyan-400 transition-colors">
                  {s.step}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#5E488C]/30 to-transparent mt-6 group-hover:via-cyan-400/60 transition-all" />
            </div>
          ))}
        </div>

        {/* Local Spotlight Card */}
        <div className="mt-12 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/30 via-[#101626] to-cyan-950/20 border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#5E488C]/30 border border-purple-500/40 flex items-center justify-center text-3xl shrink-0">
              📍
            </div>
            <div>
              <h4 className="text-base md:text-lg font-black text-white">
                Atendimento Próximo & Personalizado em Pinhalzinho-SP
              </h4>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
                Oferecemos suporte local para prototipagem de peças industriais, reposição automotiva, lembranças e projetos autorais com retirada rápida sem custo de frete.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOrcamento}
            className="h-11 px-6 rounded-xl text-xs font-black uppercase tracking-wide bg-[#5E488C] hover:bg-[#4D3974] text-white shrink-0 shadow-lg glow-purple transition-all"
          >
            Iniciar Meu Projeto Agora 🚀
          </button>
        </div>
      </div>
    </section>
  );
}
