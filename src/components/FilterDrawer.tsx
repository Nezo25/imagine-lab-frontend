import React from 'react';
import { ALL_CATEGORIES, ALL_MATERIALS, ALL_SCALES, type Category, type Material, type Scale } from '@/data/products';

export interface FilterState {
  categories: Category[];
  materials: Material[];
  scales: Scale[];
  maxPrice?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
}

export function FilterDrawer({ open, onClose, filters, onFilterChange, onClear }: Props) {
  if (!open) return null;

  function toggleCategory(cat: Category) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: next });
  }

  function toggleMaterial(mat: Material) {
    const next = filters.materials.includes(mat)
      ? filters.materials.filter((m) => m !== mat)
      : [...filters.materials, mat];
    onFilterChange({ ...filters, materials: next });
  }

  function toggleScale(scale: Scale) {
    const next = filters.scales.includes(scale)
      ? filters.scales.filter((s) => s !== scale)
      : [...filters.scales, scale];
    onFilterChange({ ...filters, scales: next });
  }

  const activeCount = filters.categories.length + filters.materials.length + filters.scales.length;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl glass-panel border border-[#222D42] shadow-2xl p-5 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222D42]">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-base font-bold text-white">Filtros do Catálogo</h3>
            {activeCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>

        {/* Categorias */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Categorias
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filters.categories.includes(cat)
                    ? 'bg-purple-900/40 border-purple-500 text-white'
                    : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Materiais */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Materiais de Impressão
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_MATERIALS.map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => toggleMaterial(mat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filters.materials.includes(mat)
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>

        {/* Escalas */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Escalas e Dimensões
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SCALES.map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => toggleScale(scale)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filters.scales.includes(scale)
                    ? 'bg-purple-900/40 border-purple-500 text-white'
                    : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#222D42] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="h-10 px-4 rounded-xl text-xs font-bold bg-[#141A28] text-slate-400 hover:text-white border border-[#222D42]"
          >
            Limpar Filtros
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#5E488C] hover:bg-[#4D3974] text-white"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
