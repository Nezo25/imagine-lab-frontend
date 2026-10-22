import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem } from '@/data/products';
import { formatPrice } from '@/services/storage';

interface Props {
  cart: CartItem[];
  onCartOpen: () => void;
  onOrcamento: () => void;
  search: string;
  onSearch: (v: string) => void;
}

export function Header({ cart, onCartOpen, onOrcamento, search, onSearch }: Props) {
  const [searchFocused, setSearchFocused] = useState(false);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalCartValue = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  return (
    <header className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-[#222D42]/80 transition-all">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-500/40 bg-[#111726] p-1 flex items-center justify-center glow-purple group-hover:border-cyan-400/60 transition-all">
            <img src="/images/logo.png" alt="ImagineLab Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-lg md:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Imagine<span className="text-[#4CA8B8]">Lab</span>
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                3D
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Onde a imaginação vira realidade • Pinhalzinho-SP
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className={`flex-1 transition-all ${searchFocused ? 'max-w-2xl' : 'max-w-md hidden md:block'}`}>
          <div className="relative w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar peças, colecionáveis, decorações..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-10 pl-10 pr-4 text-xs md:text-sm rounded-xl outline-none transition-all bg-[#121828] border border-[#222D42] text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Orçamento 3D Instantâneo CTA */}
          <button
            type="button"
            onClick={onOrcamento}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs md:text-sm font-bold bg-[#141C2E] hover:bg-[#1C263E] border border-cyan-500/40 text-cyan-300 transition-all hover:border-cyan-400 shadow-sm"
          >
            <span>📐</span>
            <span className="hidden sm:inline">Orçamento 3D STL</span>
            <span className="sm:hidden">Orçar</span>
          </button>

          {/* Carrinho Unificado */}
          <button
            type="button"
            onClick={onCartOpen}
            className="relative flex items-center gap-2.5 h-10 px-3.5 md:px-4 rounded-xl text-xs md:text-sm font-black bg-[#5E488C] hover:bg-[#4D3974] text-white shadow-lg glow-purple transition-all"
          >
            <span>🛒</span>
            <span className="hidden md:inline">Carrinho</span>
            {totalItems > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center bg-cyan-400 text-slate-950">
                  {totalItems}
                </span>
                <span className="hidden xl:inline text-xs font-normal text-purple-200">
                  • R$ {formatPrice(totalCartValue)}
                </span>
              </span>
            )}
          </button>

          {/* Link Admin */}
          <Link
            to="/admin"
            title="Painel Administrativo ImagineLab"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#121828] border border-[#222D42] text-slate-400 hover:text-white hover:border-purple-500 transition-colors"
          >
            <span className="text-sm">⚙️</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
