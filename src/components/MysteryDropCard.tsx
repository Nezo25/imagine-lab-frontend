import React from 'react';

export type MysteryCategory = 'FIGURE_POKEMON' | 'GEEK_GENERAL' | 'TCG_SPECIAL' | 'DIORAMA';

interface MysteryDropCardProps {
  category?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  whatsappText?: string;
  whatsappNumber?: string;
  slotNumber?: number;
  totalSlides?: number;
}

export function MysteryDropCard({
  category = 'FIGURE_POKEMON',
  title,
  subtitle,
  imageUrl,
  whatsappText,
  whatsappNumber = '5511982563005',
  slotNumber = 4,
  totalSlides = 4,
}: MysteryDropCardProps) {
  // Título e subtítulo dinâmicos da bancada agnósticos a franquias
  const displayTitle = title && !title.toLowerCase().includes('quem é esse pokémon')
    ? title 
    : 'Drop Secreto da Bancada';

  const displaySubtitle = subtitle && !subtitle.toLowerCase().includes('lançamento saindo da bancada')
    ? subtitle 
    : 'Próximo Lançamento Misterioso';

  const displayBadge = '❓ Misterioso / Edição Especial';

  const defaultWpp = `Olá, ImagineLab! Vi o "${displayTitle}" em destaque no site e quero garantir as condições e descontos de estreia!`;

  const finalWppText = whatsappText && whatsappText.trim() && !whatsappText.includes('Pokémon') ? whatsappText : defaultWpp;
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const wppUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(finalWppText)}`;

  const silhouetteImg = imageUrl || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop';

  return (
    <div className="w-full h-full shrink-0 relative bg-gradient-to-b from-[#1E2433] via-[#131722] to-[#0B0D13] flex flex-col justify-between p-5 sm:p-6 overflow-hidden border border-purple-500/30 rounded-2xl select-none">
      {/* Luz radial roxa/ciano de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22)_0,transparent_70%)] pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Badges */}
      <div className="flex items-center justify-between gap-2 z-10">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/25 text-[#38BDF8] border border-cyan-500/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
          <span>{displayBadge}</span>
        </span>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
          {slotNumber.toString().padStart(2, '0')} / {totalSlides.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Silhueta Escura com Ponto de Interrogação Vibrante */}
      <div className="relative flex-1 my-2 rounded-xl overflow-hidden flex items-center justify-center">
        {/* Silhueta 100% preta com alto contraste */}
        <img
          src={silhouetteImg}
          alt="Drop Misterioso"
          className="w-full h-full object-contain p-4 filter brightness-0 contrast-200 opacity-90 transition-transform duration-700 hover:scale-105"
        />

        {/* Interrogação Ciano Luminosa */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-display text-7xl sm:text-8xl text-[#38BDF8] font-black drop-shadow-[0_0_25px_rgba(56,189,248,0.95)] animate-pulse">
            ?
          </span>
        </div>

        {/* Tag de Vantagem Flutuante */}
        <div className="absolute bottom-1 inset-x-2 text-center pointer-events-none">
          <span className="inline-block px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-black/85 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-lg">
            ⚡ Desconto Exclusivo p/ Primeiros Pedidos
          </span>
        </div>
      </div>

      {/* Bottom Callout & Botão WhatsApp */}
      <div className="z-10 flex flex-col gap-2 pt-1">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide leading-none line-clamp-1">
            {displayTitle}
          </h3>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
            {displaySubtitle}
          </p>
        </div>

        <a
          href={wppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 hover:shadow-cyan-600/30 active:scale-[0.98] transition-all cursor-pointer ring-1 ring-purple-400/40"
        >
          <span>Descobrir no WhatsApp</span>
          <span className="text-base">💬</span>
        </a>
      </div>
    </div>
  );
}
