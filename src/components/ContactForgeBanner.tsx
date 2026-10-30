import React from 'react';

interface ContactForgeBannerProps {
  whatsappNumber?: string;
  defaultMessage?: string;
}

export function ContactForgeBanner({
  whatsappNumber = '5511999999999',
  defaultMessage = 'Olá, ImagineLab! Gostaria de tirar uma dúvida sobre impressão 3D ou solicitar um projeto personalizado.'
}: ContactForgeBannerProps) {
  const envNumber = 
    (typeof import.meta !== 'undefined' && (import.meta.env.VITE_WHATSAPP_NUMBER || (import.meta.env as any).NEXT_PUBLIC_WHATSAPP_NUMBER)) ||
    whatsappNumber;

  const cleanNumber = String(envNumber).replace(/\D/g, '');
  const encodedText = encodeURIComponent(defaultMessage);
  const wppUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  return (
    <div className="w-full max-w-md mt-4 rounded-xl p-3.5 bg-[#131722] border border-[#2E384D] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
      <div className="flex-1 flex flex-col gap-1">
        {/* Indicador de presença online */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            Atendimento Ativo • Pinhalzinho-SP
          </span>
        </div>

        {/* Texto curto explicativo */}
        <p className="text-xs text-slate-300 leading-snug">
          Precisa de projeto personalizado, arquivo próprio ou tirar dúvidas sobre impressão 3D?
        </p>
      </div>

      {/* Botão de Ação Rápida WhatsApp */}
      <a
        href={wppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 h-9 px-4 rounded-lg bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all whitespace-nowrap cursor-pointer ring-1 ring-emerald-400/40"
      >
        <span className="text-sm">💬</span>
        <span>Fale Conosco no WhatsApp</span>
      </a>
    </div>
  );
}
