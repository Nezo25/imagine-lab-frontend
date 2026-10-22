import React, { useState } from 'react';
import type { Product } from '@/data/products';
import { TypeBadge } from './TypeBadge';
import { formatPrice } from '@/services/storage';

interface Props {
  product: Product;
  onConfigure: (p: Product) => void;
  onBuyNow: (p: Product) => void;
}

export function ProductCard({ product, onConfigure, onBuyNow }: Props) {
  const [hovered, setHovered] = useState(false);

  const extraMin =
    product.finishOptions && product.finishOptions.length > 0
      ? Math.min(...product.finishOptions.map((f) => f.extra))
      : 0;
  const lowestPrice = (product.basePrice || 0) + (isFinite(extraMin) ? extraMin : 0);

  return (
    <article
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 relative glass-card"
      style={{
        borderColor: hovered ? 'rgba(76, 168, 184, 0.45)' : 'rgba(34, 45, 66, 0.8)',
        boxShadow: hovered ? '0 12px 35px -8px rgba(94, 72, 140, 0.35)' : 'none',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onConfigure(product)}
    >
      {/* Top Banner Tag if Featured */}
      {product.featured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md glow-purple">
            ⭐ Destaque
          </span>
        </div>
      )}

      {/* Image Viewport */}
      <div className="relative overflow-hidden aspect-4/3 bg-[#0A0E17]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#151C2C] via-transparent to-black/20 pointer-events-none" />

        {/* Material Tag Pill Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {product.materials.slice(0, 2).map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A0D14]/85 text-cyan-300 border border-[#222D42] backdrop-blur-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 md:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Category Tag */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              {product.category}
            </span>
          </div>

          <h3 className="font-extrabold text-[15px] md:text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Description preview */}
          {product.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Tags list */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {product.tags.slice(0, 3).map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>

        {/* Footer with Price and Quick Actions */}
        <div className="pt-3 border-t border-[#222D42] mt-auto">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">A partir de</span>
              <div className="text-lg md:text-xl font-black text-white">
                R$ {formatPrice(lowestPrice)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Impressão Sob Demanda</span>
              <div className="text-xs font-semibold text-slate-300">
                ~{product.printTimeH}h produção
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(product);
              }}
              className="h-9 px-3 rounded-xl text-xs font-bold bg-[#1B2336] hover:bg-[#25304A] text-slate-200 border border-[#2A3752] transition-colors flex items-center justify-center gap-1"
            >
              <span>⚙️ Detalhes</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBuyNow(product);
              }}
              className="h-9 px-3 rounded-xl text-xs font-black bg-[#5E488C] hover:bg-[#4D3974] text-white transition-all flex items-center justify-center gap-1 glow-purple"
            >
              <span>🛒 Comprar</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
