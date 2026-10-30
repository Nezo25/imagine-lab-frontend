import { useState, useEffect } from 'react';
import type { Product, CartItem } from '@/data/products';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

export function ProductCustomizeModal({ product, onClose, onAdd }: Props) {
  if (!product) return null;

  const isTcgItem = product.department === 'TCG' || product.category === 'TCG';

  const defaultScales = product.scales && product.scales.length > 0 
    ? product.scales 
    : [isTcgItem ? 'Padrão / Selado' : 'Escala 1:10 (~15 cm)'];
  
  const defaultMaterials = product.materials && product.materials.length > 0 
    ? product.materials 
    : [isTcgItem ? 'Original Copag' : 'PLA Alta Resolução'];

  const [scale, setScale] = useState(defaultScales[0] || '1:10');
  const [material, setMaterial] = useState(defaultMaterials[0] || 'PLA');
  const [finish, setFinish] = useState((product.finishOptions?.[0]?.name || product.finishOptions?.[0]?.label || 'Peça Crua') as string);
  const [observations, setObservations] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      const s = product.scales && product.scales.length > 0 
        ? product.scales[0] 
        : (isTcgItem ? 'Padrão / Selado' : 'Escala 1:10 (~15 cm)');
      const m = product.materials && product.materials.length > 0 
        ? product.materials[0] 
        : (isTcgItem ? 'Original Copag' : 'PLA Alta Resolução');
      const f = (product.finishOptions?.[0]?.name || product.finishOptions?.[0]?.label || (isTcgItem ? 'Novo / Lacrado' : 'Peça Crua')) as string;
      setScale(s);
      setMaterial(m);
      setFinish(f);
      setObservations('');
      setQty(1);
    }
  }, [product, isTcgItem]);

  const selectedFinishObj = product.finishOptions?.find(f => (f.name || f.label) === finish);
  const finishExtra = selectedFinishObj?.extra || 0;
  const isOutOfStock = Boolean(selectedFinishObj?.outOfStock);
  const basePrice = (product as any).promoPrice || product.basePrice;
  const unitPrice = basePrice + finishExtra;
  const totalPrice = unitPrice * qty;

  function handleConfirm() {
    if (!product || isOutOfStock) return;
    onAdd({
      product,
      scale,
      finish,
      material: material as any,
      observations: observations.trim() || undefined,
      qty,
      unitPrice,
      customized: true,
      promoPrice: (product as any).promoPrice,
      promoBadge: (product as any).promoBadge,
      campaignTag: (product as any).campaignTag,
      origin: (product as any).origin
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none" onClick={onClose}>
      <div 
        className="w-full sm:max-w-2xl bg-[#0B0D13] border border-[#2E384D] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Image Preview Banner */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-[#131722] border-b border-[#2E384D] overflow-hidden">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop'} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-transparent to-black/40" />
          
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-black/60 hover:bg-[#7C3AED] text-[#A3A3A3] hover:text-white transition-all border border-white/10 z-20 cursor-pointer"
          >
            ✕
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#38BDF8] uppercase">
                {product.category}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white uppercase leading-none mt-1">
                {product.name}
              </h2>
            </div>
            {product.department === 'TCG' && (
              <span className="px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold">
                {product.expansionName || 'TCG OFICIAL'}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Alerta de Prazo / Produção */}
          <div className="flex gap-3 bg-[#131722] border border-purple-500/30 rounded-xl p-3.5 text-xs text-[#D4D4D4] leading-relaxed">
            <span className="text-base leading-none text-[#7C3AED] shrink-0 mt-0.5">🔮</span>
            <p>
              {isTcgItem 
                ? 'Produto autêntico e lacrado. Envio rápido direto de Monte Alegre-SP com rastreio.'
                : 'As peças da ImagineLab são impressas e finalizadas artesanalmente com rigoroso controle de qualidade.'}
            </p>
          </div>

          {/* Seleção de Escala / Tamanho */}
          {!isTcgItem && defaultScales.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A3A3A3] mb-2">
                1. Dimensões / Escala
              </label>
              <div className="flex flex-wrap gap-2">
                {defaultScales.map(s => {
                  const active = scale === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        active 
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-purple-950/40' 
                          : 'bg-[#131722] text-[#A3A3A3] border-[#2E384D] hover:border-[#475569]'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seleção de Material */}
          {!isTcgItem && defaultMaterials.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A3A3A3] mb-2">
                2. Tecnologia / Material
              </label>
              <div className="flex flex-wrap gap-2">
                {defaultMaterials.map(m => {
                  const active = material === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMaterial(m)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        active 
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-purple-950/40' 
                          : 'bg-[#131722] text-[#A3A3A3] border-[#2E384D] hover:border-[#475569]'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seleção de Acabamento / Versão */}
          {product.finishOptions && product.finishOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
                  {isTcgItem ? 'Tipo de Produto' : '3. Nível de Acabamento'}
                </label>
                <span className="text-[11px] text-[#94A3B8]">Estúdio ImagineLab 3D</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.finishOptions.map((opt, i) => {
                  const optName = String(opt.name || opt.label || `Acabamento ${i + 1}`);
                  const active = finish === optName;
                  const optOutOfStock = Boolean(opt.outOfStock);
                  return (
                    <button
                      key={optName}
                      type="button"
                      disabled={optOutOfStock}
                      onClick={() => setFinish(optName)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        optOutOfStock 
                          ? 'opacity-40 bg-[#131722] border-[#2E384D] cursor-not-allowed'
                          : active 
                          ? 'bg-purple-950/30 border-[#7C3AED] shadow-md shadow-purple-950/30 ring-1 ring-[#7C3AED]' 
                          : 'bg-[#131722] border-[#2E384D] hover:border-[#475569]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{optName}</span>
                          {optOutOfStock && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                              Esgotado
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {opt.extra === 0 ? 'Sem custo adicional' : `+ R$ ${opt.extra.toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#38BDF8]">
                        R$ {(basePrice + opt.extra).toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">
              Quantidade
            </span>
            <div className="flex items-center gap-3 bg-[#131722] border border-[#2E384D] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-[#1E2433] hover:bg-[#2A3449] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-sm font-bold w-6 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="w-8 h-8 rounded-lg bg-[#1E2433] hover:bg-[#2A3449] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Observações / Notas do Cliente */}
          {!isTcgItem && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A3A3A3] mb-2">
                Instruções ou Detalhes Especiais (Opcional)
              </label>
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Ex: Prefiro base em tom preto fosco, escala personalizada, urgência para presente..."
                rows={2}
                className="w-full bg-[#131722] border border-[#2E384D] focus:border-[#7C3AED] rounded-xl p-3 text-xs text-white placeholder-[#64748B] outline-none transition-colors"
              />
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#0B0D13] border-t border-[#1E2433] flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">
              Subtotal da Peça
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-[#38BDF8]">R$</span>
              <span className="font-display text-3xl sm:text-4xl text-white tracking-tight leading-none">
                {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleConfirm}
            className={`h-12 px-7 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              isOutOfStock 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-purple-950/50 ring-1 ring-purple-400/40'
            }`}
          >
            <span>{isOutOfStock ? 'Versão Esgotada' : 'Adicionar à Sacola'}</span>
            {!isOutOfStock && <span>→</span>}
          </button>
        </div>

      </div>
    </div>
  );
}
