import React from 'react';

const TESTIMONIALS = [
  {
    name: 'Carlos Mendes',
    role: 'Engenheiro & Maker',
    text: 'A precisão das peças em PETG que pedi para o meu projeto me impressionou. Furação perfeita e resistência mecânica top.',
    rating: '⭐⭐⭐⭐⭐',
  },
  {
    name: 'Juliana Castro',
    role: 'Colecionadora',
    text: 'Minha estátua em resina 8K com pintura manual ficou surreal de linda. Chegou super protegida aqui em SP!',
    rating: '⭐⭐⭐⭐⭐',
  },
  {
    name: 'Rafael Toledo (Pinhalzinho)',
    role: 'Cliente Local',
    text: 'Passei no laboratório pra retirar a litofania com as fotos do aniversário da minha mãe. Ficou emocionante!',
    rating: '⭐⭐⭐⭐⭐',
  },
];

export function BrandTrust() {
  return (
    <section className="py-14 md:py-20 px-4 md:px-8 border-b border-[#1E2638] bg-[#0B0F19]">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">
            Qualidade Comprovada
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-black text-white">
            Quem confia na ImagineLab
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl glass-card border border-[#222D42] flex flex-col justify-between gap-4"
            >
              <div>
                <div className="text-sm mb-2">{t.rating}</div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#1F273A] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-400">{t.role}</div>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold">✓ Verificado</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
