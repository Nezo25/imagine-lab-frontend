import { useEffect, useState } from 'react';
import { WorkshopVideoPlayer } from './WorkshopVideoPlayer';

interface WorkshopProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCustomQuote?: () => void;
}

export function WorkshopProcessModal({
  isOpen,
  onClose,
  onRequestCustomQuote
}: WorkshopProcessModalProps) {
  const [videoError, setVideoError] = useState(false);
  const [isPlayingFallback, setIsPlayingFallback] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Previne scroll de fundo quando modal estiver aberto
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleActionClick() {
    onClose();
    if (onRequestCustomQuote) {
      onRequestCustomQuote();
    } else {
      const el = document.getElementById('catalogo');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  const steps = [
    {
      num: '01',
      icon: '📐',
      title: 'Modelagem & Fatiamento Digital',
      desc: 'Ajuste milimétrico de escalas, suportes orgânicos e orientação da malha para máxima fidelidade aos detalhes.'
    },
    {
      num: '02',
      icon: '🖨️',
      title: 'Impressão 3D de Alta Resolução',
      desc: 'Construção camada por camada em resina ou PLA premium, com tolerâncias mínimas e estrutura reforçada.'
    },
    {
      num: '03',
      icon: '🎨',
      title: 'Pós-Processamento & Pintura Manual',
      desc: 'Cura UV controlada, remoção de suportes, lixamento fino e acabamento artístico com verniz de proteção de alta durabilidade.'
    },
    {
      num: '04',
      icon: '📦',
      title: 'Embalagem Blindada & Envio Nacional',
      desc: 'Cada figure passa por inspeção visual detalhada antes de receber embalagem multicamada antichoque, garantindo que o colecionável chegue 100% perfeito à sua estante em qualquer lugar do Brasil.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090D16] border border-slate-800 text-slate-100 shadow-2xl flex flex-col custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(124, 58, 237, 0.15)'
        }}
      >
        {/* Cabeçalho */}
        <div className="relative px-6 pt-7 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-[#0F172A]/80 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Badge superior */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-wider uppercase bg-purple-950/70 border border-purple-500/40 text-[#A855F7] mb-3 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                <span>⚡ ARTE & TECNOLOGIA SOB MEDIDA</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Como sua peça ganha vida na ImagineLab
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Da modelagem digital ao acabamento artesanal: conheça cada etapa do nosso processo cuidadoso em Monte Alegre-SP.
              </p>
            </div>

            {/* Botão Fechar (ESC) */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60 shrink-0"
              title="Fechar (ESC)"
              aria-label="Fechar modal"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 md:p-8 flex flex-col gap-8">
          {/* Player Dinâmico dos Vídeos de Bastidores da Oficina */}
          <div className="w-full">
            <WorkshopVideoPlayer />
          </div>

          {/* Timeline dos 4 Passos do Processo Artesanal */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <span className="text-[#38BDF8]">❖</span>
                <span>As 4 Etapas da Produção Artesanal</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Controle de qualidade etapa por etapa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map(step => (
                <div
                  key={step.num}
                  className="relative p-5 rounded-2xl bg-[#0F172A]/70 border border-slate-800/90 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:bg-[#0F172A] transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Step + Icon */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                        {step.icon}
                      </div>
                      <span className="font-mono text-xs font-extrabold text-purple-400/80 group-hover:text-[#38BDF8]">
                        {step.num}
                      </span>
                    </div>

                    {/* Step Title */}
                    <h4 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-[#38BDF8] transition-colors">
                      {step.title}
                    </h4>

                    {/* Step Description */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Fase {step.num}</span>
                    <span className="text-cyan-400 font-bold">100% supervisionada</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-5 border-t border-slate-800/80 bg-[#0F172A]/60 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Badge e Texto de Garantia */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 border border-slate-700/80 text-slate-300 shadow-sm">
              <span>📦</span>
              <span>Envios rastreados para todo o território nacional</span>
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-emerald-400 text-base">🛡️</span>
              <span>
                <strong>Garantia de Qualidade:</strong> Nenhuma peça sai da oficina sem inspeção visual completa.
              </span>
            </div>
          </div>

          {/* Botão de Ação Primária */}
          <button
            onClick={handleActionClick}
            className="w-full sm:w-auto h-11 px-6 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-lg shadow-purple-950/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap ring-1 ring-purple-400/40"
          >
            <span>Quero um Projeto Personalizado</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
