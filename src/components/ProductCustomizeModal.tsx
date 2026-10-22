import React, { useState, useEffect } from 'react';
import type { CartItem, Finish, Material, Product, Scale } from '@/data/products';
import { COLOR_PALETTE } from '@/data/products';
import { TypeBadge } from './TypeBadge';
import { formatPrice } from '@/services/storage';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

export function ProductCustomizeModal({ product, onClose, onAdd }: Props) {
  const [scale, setScale] = useState<Scale | string>('Padrão (12 a 15 cm)');
  const [finish, setFinish] = useState<Finish>('Peça Crua (Padrão)');
  const [material, setMaterial] = useState<Material>('PLA Premium');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [qty, setQty] = useState(1);
  const [observations, setObservations] = useState('');
  const [added, setAdded] = useState(false);

  // CEP Shipping simulation
  const [cep, setCep] = useState('');
  const [shippingResult, setShippingResult] = useState<{ type: string; price: number; time: string }[] | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  useEffect(() => {
    if (product) {
      setScale(product.scales[0] || 'Padrão (12 a 15 cm)');
      setFinish(product.finishOptions[0]?.label || 'Peça Crua (Padrão)');
      setMaterial(product.materials[0] || 'PLA Premium');
      setSelectedColor(COLOR_PALETTE[0]);
      setQty(1);
      setObservations('');
      setAdded(false);
      setShippingResult(null);
    }
  }, [product]);

  if (!product) return null;

  const finishExtra = product.finishOptions.find((f) => f.label === finish)?.extra ?? 0;
  const unitPrice = product.basePrice + finishExtra;
  const total = unitPrice * qty;

  function handleCalculateShipping() {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return;

    setCalculatingShipping(true);
    setTimeout(() => {
      // Simulação realista com base na origem Pinhalzinho-SP (CEP 13990-000)
      const isLocal = cleanCep.startsWith('13990') || cleanCep.startsWith('139');
      setShippingResult([
        {
          type: 'Retirada no Laboratório ImagineLab (Pinhalzinho-SP)',
          price: 0,
          time: 'Pronto após impressão',
        },
        {
          type: isLocal ? 'Entrega Local Express (Pinhalzinho/Região)' : 'SEDEX Expresso',
          price: isLocal ? 9.90 : 23.50,
          time: isLocal ? '1 a 2 dias úteis' : '2 a 4 dias úteis',
        },
        {
          type: 'PAC Encomenda Econômica',
          price: isLocal ? 12.00 : 16.80,
          time: '4 a 8 dias úteis',
        },
      ]);
      setCalculatingShipping(false);
    }, 450);
  }

  function handleAdd() {
    onAdd({
      product: product!,
      scale,
      finish,
      material,
      color: selectedColor.name,
      qty,
      unitPrice,
      observations: observations.trim() || undefined,
      customized: true,
    });
    setAdded(true);
    setTimeout(() => {
      onClose();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden glass-panel border border-[#2E3C56] shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222D42] bg-[#0E131F]/90">
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              {product.category}
            </span>
            <h2 className="text-lg md:text-xl font-black text-white">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Image & Details (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-[#0A0D14] border border-[#222D42]">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <div className="p-4 rounded-xl bg-[#0E1422] border border-[#222D42] flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300">Especificações Técnicas:</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {product.description || 'Produzido com polímeros de engenharia e inspeção de camadas individual.'}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1C2638]">
                <span>Tempo de Impressão:</span>
                <span className="font-semibold text-white">~{product.printTimeH} horas</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Consumo de Matéria:</span>
                <span className="font-semibold text-white">~{product.filamentG}g</span>
              </div>
            </div>

            {/* Simulador de Frete Pinhalzinho */}
            <div className="p-4 rounded-xl bg-[#0E1422] border border-[#222D42]">
              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                Calcular Frete & Prazo (Origem: Pinhalzinho-SP)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={9}
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg text-xs bg-[#151C2C] border border-[#2A3752] text-white outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  disabled={calculatingShipping}
                  onClick={handleCalculateShipping}
                  className="h-9 px-4 rounded-lg text-xs font-bold bg-[#5E488C] hover:bg-[#4D3974] text-white shrink-0"
                >
                  {calculatingShipping ? '...' : 'Calcular'}
                </button>
              </div>

              {shippingResult && (
                <div className="mt-3 flex flex-col gap-1.5 pt-2 border-t border-[#1C2638]">
                  {shippingResult.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[#151C2C]">
                      <div>
                        <div className="font-semibold text-slate-200">{s.type}</div>
                        <div className="text-[10px] text-slate-400">{s.time}</div>
                      </div>
                      <div className="font-bold text-cyan-300">
                        {s.price === 0 ? 'Grátis' : `R$ ${formatPrice(s.price)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customization Controls (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Scale */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Escala & Tamanho
              </label>
              <div className="flex flex-wrap gap-2">
                {product.scales.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      scale === s
                        ? 'bg-purple-900/40 border-purple-500 text-white glow-purple'
                        : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Material */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Material de Fabricação
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.materials.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMaterial(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                      material === m
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Cor da Peça
                </label>
                <span className="text-xs font-semibold text-cyan-300">{selectedColor.name}</span>
              </div>
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[#121828] border border-[#222D42]">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition-all border-2 ${
                      selectedColor.name === c.name
                        ? 'scale-125 border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'border-slate-700 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Finish */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Opções de Acabamento
              </label>
              <div className="flex flex-col gap-2">
                {product.finishOptions.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setFinish(f.label)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      finish === f.label
                        ? 'bg-purple-900/30 border-purple-500 text-white'
                        : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="font-bold text-cyan-300">
                      {f.extra === 0 ? 'Sem custo extra' : `+ R$ ${formatPrice(f.extra)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade e Observações */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Quantidade
                </label>
                <div className="flex items-center h-10 rounded-xl bg-[#121828] border border-[#222D42]">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-white text-sm">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Observação / Personalização
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gravar nome na base, cor específica..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-[#121828] border border-[#222D42] text-white focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* Bottom Total & Add to Cart Action */}
            <div className="mt-auto pt-4 border-t border-[#222D42] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total do Item</span>
                <div className="text-2xl font-black text-white">
                  R$ {formatPrice(total)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={added}
                className="h-12 px-6 rounded-xl font-black text-sm uppercase tracking-wide bg-[#5E488C] hover:bg-[#4D3974] text-white flex items-center gap-2 shadow-lg glow-purple transition-all"
              >
                <span>{added ? '✅ Adicionado!' : '🛒 Adicionar ao Carrinho'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
