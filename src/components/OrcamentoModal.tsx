import React, { useState, useMemo } from 'react';
import { ModelViewer3D } from './ModelViewer3D';
import { COLOR_PALETTE, type CartItem } from '@/data/products';
import { addQuote } from '@/services/storage';
import { toast } from './Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onAddToCart?: (item: CartItem) => void;
}

const MATERIAL_CONFIGS: Record<
  string,
  { name: string; density: number; pricePerGram: number; machineHourRate: number; baseFee: number }
> = {
  'PLA Premium': { name: 'PLA Premium', density: 1.24, pricePerGram: 0.16, machineHourRate: 4.5, baseFee: 15 },
  'PLA Silk (Metalizado)': { name: 'PLA Silk (Metalizado)', density: 1.24, pricePerGram: 0.20, machineHourRate: 5.0, baseFee: 18 },
  'PETG Técnico': { name: 'PETG Técnico', density: 1.27, pricePerGram: 0.20, machineHourRate: 5.5, baseFee: 20 },
  'Resina 8K Ultra-Detalhe': { name: 'Resina 8K Ultra-Detalhe', density: 1.15, pricePerGram: 0.38, machineHourRate: 9.0, baseFee: 30 },
  'ABS High-Temp': { name: 'ABS High-Temp', density: 1.05, pricePerGram: 0.19, machineHourRate: 6.0, baseFee: 22 },
};

export function OrcamentoModal({ open, onClose, onAddToCart }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Print Configuration States
  const [material, setMaterial] = useState('PLA Premium');
  const [layerHeight, setLayerHeight] = useState<'0.12' | '0.20' | '0.28'>('0.20');
  const [infill, setInfill] = useState<number>(30);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [scalePercent, setScalePercent] = useState<number>(100);

  // User details
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // 3D Analysis Data from Viewer
  const [analysis, setAnalysis] = useState<{
    dimensions: { x: number; y: number; z: number };
    volumeCm3: number;
    weightGrams: number;
    surfaceAreaCm2: number;
  }>({
    dimensions: { x: 75, y: 75, z: 90 },
    volumeCm3: 82,
    weightGrams: 95,
    surfaceAreaCm2: 120,
  });

  const [saving, setSaving] = useState(false);

  // Cálculo Dinâmico de Preço e Tempo
  const pricing = useMemo(() => {
    const config = MATERIAL_CONFIGS[material] || MATERIAL_CONFIGS['PLA Premium'];

    // Escala dimensional afeta o volume cubicamente: (scale/100)^3
    const scaleFactor = Math.pow(scalePercent / 100, 3);
    const scaledWeight = Math.max(analysis.weightGrams * scaleFactor, 8);

    // Ajuste de tempo de máquina baseado na altura de camada
    const layerFactor = layerHeight === '0.12' ? 1.6 : layerHeight === '0.28' ? 0.75 : 1.0;
    const estimatedHours = Math.max(Math.round((scaledWeight / 18) * layerFactor * 10) / 10, 1.5);

    // Preço do material + taxa de máquina + taxa de setup
    const materialCost = scaledWeight * config.pricePerGram;
    const machineCost = estimatedHours * config.machineHourRate;
    const subtotal = materialCost + machineCost + config.baseFee;

    // Margem mínima comercial
    const finalPrice = Math.max(Math.round(subtotal * 10) / 10, 35.0);

    return {
      price: finalPrice,
      weightGrams: Math.round(scaledWeight * 10) / 10,
      printHours: estimatedHours,
    };
  }, [material, layerHeight, infill, scalePercent, analysis]);

  if (!open) return null;

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj', '3mf'].includes(ext || '')) {
      toast.error('Formato inválido. Por favor envie arquivos .STL, .OBJ ou .3MF');
      return;
    }
    setFile(selected);
    toast.success(`Arquivo ${selected.name} carregado no visualizador 3D!`);
  }

  async function handleSaveQuote() {
    const quoteData = {
      cliente: clientName.trim() || 'Cliente ImagineLab',
      contato: clientContact.trim(),
      arquivo: file ? file.name : 'modelo_personalizado.stl',
      material,
      infill: `${infill}%`,
      resolucao: `${layerHeight}mm`,
      cor: selectedColor.name,
      volumeCm3: analysis.volumeCm3,
      pesoGramas: pricing.weightGrams,
      detalhes: clientNotes.trim(),
      precoEstimado: pricing.price,
    };
    return await addQuote(quoteData);
  }

  async function handleAddToCart() {
    setSaving(true);
    try {
      await handleSaveQuote();

      if (onAddToCart) {
        onAddToCart({
          product: {
            id: 'quote_' + Date.now(),
            name: file ? `3D: ${file.name}` : `Impressão 3D (${material})`,
            category: 'Peças Técnicas & Funcionais',
            tags: ['Orçamento STL', material, selectedColor.name],
            scales: [`Escala ${scalePercent}%`],
            materials: [material as any],
            basePrice: pricing.price,
            finishOptions: [{ label: 'Peça Crua (Padrão)', extra: 0 }],
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
            printTimeH: Math.ceil(pricing.printHours),
            filamentG: pricing.weightGrams,
            active: true,
          },
          scale: `Escala ${scalePercent}% (${Math.round(analysis.dimensions.x * scalePercent / 100)}x${Math.round(analysis.dimensions.y * scalePercent / 100)}x${Math.round(analysis.dimensions.z * scalePercent / 100)}mm)`,
          finish: 'Peça Crua (Padrão)',
          material: material,
          color: selectedColor.name,
          qty: 1,
          unitPrice: pricing.price,
          customized: true,
          isCustom3D: true,
          stlFileName: file?.name || 'modelo_custom.stl',
          infillPercent: infill,
          layerHeightMm: parseFloat(layerHeight),
          estimatedWeightG: pricing.weightGrams,
          dimensionsMm: {
            x: Math.round(analysis.dimensions.x * scalePercent / 100),
            y: Math.round(analysis.dimensions.y * scalePercent / 100),
            z: Math.round(analysis.dimensions.z * scalePercent / 100),
          },
        });
      }

      toast.success('Modelo 3D adicionado ao carrinho com sucesso!');
      onClose();
    } catch (e: any) {
      toast.error('Erro ao processar orçamento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleOrderWhatsApp() {
    setSaving(true);
    try {
      const saved = await handleSaveQuote();

      let msg = `✨ *ORÇAMENTO 3D - IMAGINELAB* ✨\n`;
      msg += `📍 *Origem:* Pinhalzinho-SP\n`;
      msg += `🆔 *Orçamento:* ${saved.id}\n\n`;
      if (clientName) msg += `👤 *Cliente:* ${clientName}\n`;
      if (clientContact) msg += `📱 *Contato:* ${clientContact}\n`;
      msg += `📁 *Arquivo:* ${file ? file.name : 'Modelo 3D Sob Encomenda'}\n`;
      msg += `🧵 *Material:* ${material}\n`;
      msg += `🎨 *Cor:* ${selectedColor.name}\n`;
      msg += `📐 *Infill:* ${infill}% | *Camada:* ${layerHeight}mm\n`;
      msg += `📏 *Dimensões:* ${Math.round(analysis.dimensions.x * scalePercent / 100)} x ${Math.round(analysis.dimensions.y * scalePercent / 100)} x ${Math.round(analysis.dimensions.z * scalePercent / 100)} mm (Escala ${scalePercent}%)\n`;
      msg += `⚖️ *Peso Estimado:* ~${pricing.weightGrams}g\n`;
      msg += `⏱️ *Tempo de Máquina:* ~${pricing.printHours}h\n`;
      msg += `💰 *Valor Estimado:* R$ ${pricing.price.toFixed(2).replace('.', ',')}\n`;
      if (clientNotes) msg += `\n📝 *Observações:* ${clientNotes}\n`;
      msg += `\n_Olá ImagineLab! Gostaria de confirmar este orçamento e prosseguir com a impressão._`;

      const wppNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5519998214411';
      window.open(`https://wa.me/${wppNumber}?text=${encodeURIComponent(msg)}`, '_blank');

      toast.success('Orçamento salvo! Redirecionando para o WhatsApp comercial...');
      onClose();
    } catch (e: any) {
      toast.error('Erro ao enviar pedido para o WhatsApp.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222D42] bg-[#0E131F]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-cyan-300 font-extrabold text-base glow-purple">
              📐
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Simulador & Orçador 3D Instantâneo
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  ImagineLab Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Renderização em tempo real, fatiamento volumétrico e cálculo reativo • Pinhalzinho-SP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Grid 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Visualizador 3D & Upload (7 colunas) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 3D Viewport Card */}
            <div className="h-[360px] md:h-[420px] w-full rounded-2xl overflow-hidden relative shadow-inner">
              <ModelViewer3D
                file={file}
                materialColor={selectedColor.hex}
                materialDensity={MATERIAL_CONFIGS[material]?.density || 1.24}
                infillPercent={infill}
                onAnalysisChange={setAnalysis}
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div
              className={`p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-between gap-4 cursor-pointer ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-[#2E3C56] hover:border-purple-500/60 bg-[#111726]/60'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.stl,.obj,.3mf';
                input.onchange = (e: any) => handleFileSelect(e.target.files?.[0]);
                input.click();
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{file ? '📦' : '📤'}</div>
                <div>
                  <div className="text-sm font-bold text-slate-200">
                    {file ? file.name : 'Clique ou arraste seu arquivo 3D (.STL, .OBJ, .3MF)'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {file
                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Carregado no visualizador`
                      : 'Análise automática de geometria e estimativa de insumos'}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#5E488C] text-white shrink-0 hover:bg-[#4D3974]">
                {file ? 'Trocar Arquivo' : 'Selecionar'}
              </span>
            </div>

            {/* Live Bounding Box & Dimensions Bar */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#0E1422] border border-[#222D42]">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Dimensões (X×Y×Z)</span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {Math.round(analysis.dimensions.x * scalePercent / 100)} × {Math.round(analysis.dimensions.y * scalePercent / 100)} × {Math.round(analysis.dimensions.z * scalePercent / 100)} mm
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Volume Fatiado</span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {Math.round(analysis.volumeCm3 * Math.pow(scalePercent / 100, 3) * 10) / 10} cm³
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Peso Estimado</span>
                <span className="text-xs font-mono font-bold text-white">
                  ~{pricing.weightGrams}g
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Configurador de Impressão & Orçamento (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Escolha do Material */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                1. Tipo de Material
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(MATERIAL_CONFIGS).map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => setMaterial(mat)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-bold transition-all border ${
                      material === mat
                        ? 'bg-purple-900/40 border-purple-500 text-white shadow-sm glow-purple'
                        : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-slate-200 hover:bg-[#182034]'
                    }`}
                  >
                    <div className="truncate">{mat}</div>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                      {mat.includes('Resina') ? 'Precisão Máxima' : mat.includes('PETG') ? 'Alta Resistência' : 'Versátil & Estético'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolução de Camada & Preenchimento (Infill) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  2. Altura de Camada
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: '0.12', label: 'Alta (0.12mm)' },
                    { id: '0.20', label: 'Padrão (0.20mm)' },
                    { id: '0.28', label: 'Rápida (0.28mm)' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setLayerHeight(res.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border ${
                        layerHeight === res.id
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  3. Infill: {infill}%
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { val: 15, label: '15% (Leve)' },
                    { val: 30, label: '30% (Padrão)' },
                    { val: 50, label: '50% (Robusto)' },
                    { val: 100, label: '100% (Maciço)' },
                  ].map((inf) => (
                    <button
                      key={inf.val}
                      type="button"
                      onClick={() => setInfill(inf.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-all border ${
                        infill === inf.val
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                          : 'bg-[#121828] border-[#222D42] text-slate-400 hover:text-white'
                      }`}
                    >
                      {inf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seletor de Cores Dinâmico */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  4. Cor do Filamento / Resina
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
                        ? 'scale-125 border-cyan-400 shadow-md ring-2 ring-cyan-400/40'
                        : 'border-slate-700 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Ajuste de Escala */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  5. Escala do Modelo
                </label>
                <span className="text-xs font-mono font-bold text-purple-300">{scalePercent}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={scalePercent}
                onChange={(e) => setScalePercent(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#5E488C]"
              />
            </div>

            {/* Dados do Solicitante */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#222D42]">
              <input
                type="text"
                placeholder="Seu nome"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs bg-[#121828] border border-[#222D42] text-white focus:border-cyan-400 outline-none"
              />
              <input
                type="text"
                placeholder="WhatsApp (com DDD)"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="h-9 px-3 rounded-lg text-xs bg-[#121828] border border-[#222D42] text-white focus:border-cyan-400 outline-none"
              />
            </div>

            {/* Card de Preço & Resumo */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-cyan-950/30 border border-purple-500/30 shadow-xl flex flex-col gap-2 mt-auto">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Estimado</span>
                  <div className="text-2xl font-black text-white tracking-tight">
                    R$ {pricing.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Prazo de Produção</span>
                  <div className="text-xs font-bold text-cyan-300">
                    ~{Math.ceil(pricing.printHours)}h máquina • Envio rápido
                  </div>
                </div>
              </div>

              {/* Botões de Ação Dupla */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleAddToCart}
                  className="h-11 px-3 rounded-xl font-black text-xs uppercase tracking-wide bg-[#5E488C] hover:bg-[#4D3974] text-white flex items-center justify-center gap-1.5 transition-all shadow-lg glow-purple"
                >
                  <span>🛒</span>
                  <span>Adicionar ao Carrinho</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleOrderWhatsApp}
                  className="h-11 px-3 rounded-xl font-black text-xs uppercase tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-lg"
                >
                  <span>💬</span>
                  <span>Pedir no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
