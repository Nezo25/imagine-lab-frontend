import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem } from '@/data/products';

interface Props {
  cart: CartItem[];
  onCartOpen: () => void;
  onOrcamento: () => void;
  onOpenWorkshopModal?: () => void;
  search: string;
  onSearch: (v: string) => void;
}

export function Header({ cart, onCartOpen, onOrcamento, onOpenWorkshopModal, search, onSearch }: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const total = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <header className="sticky top-0 z-50 bg-[#0B0D13]/95 backdrop-blur-md border-b border-[#1E2433]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Logo ImagineLab */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#6C4AB6] to-[#38BDF8] p-[1.5px] shadow-lg shadow-purple-900/30 group-hover:shadow-cyan-900/40 transition-all">
            <div className="w-full h-full bg-[#0B0D13] rounded-[10px] flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#38BDF8] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.9 8.4A2 2 0 0 0 2 10.1v7.8a2 2 0 0 0 1.05 1.76l6.05 3.94a2 2 0 0 0 2.17.05l9.95-6.11A2 2 0 0 0 22 15.8V8a2 2 0 0 0-.88-1.6Z"/>
                <path d="m10 22 10-6"/>
                <path d="M10 22V10"/>
                <path d="m2 10 10-6"/>
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wide text-white group-hover:text-[#38BDF8] transition-colors">
                ImagineLab
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-[#A855F7] border border-purple-500/30 uppercase">
                3D
              </span>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-[#94A3B8] uppercase -mt-0.5">
              MONTE ALEGRE-SP
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]">
          <a href="#destaques" className="hover:text-white transition-colors">Destaques</a>
          <a href="#catalogo" className="hover:text-white transition-colors">Coleção</a>
          
          {/* Link direto e em destaque para Como Funciona */}
          <button
            onClick={() => {
              if (onOpenWorkshopModal) {
                onOpenWorkshopModal();
              } else {
                const el = document.getElementById('como-funciona') || document.getElementById('oficina');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="hover:text-[#38BDF8] text-slate-200 transition-colors cursor-pointer text-sm font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-purple-950/30 border border-transparent hover:border-purple-500/30"
            title="Conheça nosso processo de impressão 3D e acabamento"
          >
            <span className="text-[#38BDF8] text-xs">▶</span>
            <span>Como Funciona</span>
          </button>

          <button onClick={onOrcamento} className="hover:text-[#38BDF8] transition-colors cursor-pointer font-semibold text-[#A855F7]">
            Sob medida
          </button>
          <a 
            href="https://instagram.com/imaginelab.3d" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-[#94A3B8] hover:text-[#38BDF8] transition-colors flex items-center gap-1"
            title="Siga no Instagram @imaginelab.3d"
          >
            <span>@imaginelab.3d</span>
          </a>
        </nav>

        {/* Right Actions: Search + Cart */}
        <div className="flex items-center gap-3">
          {/* Search Toggle / Input */}
          <div className="relative flex items-center">
            {showSearch ? (
              <div className="flex items-center bg-[#1E2433] border border-[#2E384D] rounded-full px-3 py-1.5 animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="Buscar peças..."
                  value={search}
                  onChange={e => onSearch(e.target.value)}
                  autoFocus
                  className="bg-transparent text-xs text-white placeholder-[#64748B] outline-none w-32 sm:w-48"
                />
                <button onClick={() => setShowSearch(false)} className="text-[#94A3B8] hover:text-white text-xs ml-1">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-full bg-[#131722] border border-[#2E384D] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#7C3AED] transition-colors cursor-pointer"
                title="Buscar"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
            )}
          </div>

          {/* Carrinho Pill */}
          <button
            onClick={onCartOpen}
            className="flex items-center gap-2.5 h-10 px-4 rounded-full bg-[#131722] border border-[#2E384D] hover:border-[#7C3AED] text-white text-xs font-semibold transition-all group cursor-pointer shadow-md"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Carrinho</span>
            <span className="w-5 h-5 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              {total}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
