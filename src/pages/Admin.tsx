import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Product, Category, PokemonType, ProductCategory, ProductUniverse } from '@/data/products';
import { ALL_TYPES, ALL_CATEGORIES, ALL_SCALES, CATEGORY_LABELS, toProductCategory, UNIVERSE_CONFIG, toProductUniverse } from '@/data/products';
import { NewTcgProductModal } from '../components/NewTcgProductModal';
import { KanbanBoard } from '../components/KanbanBoard';
import { TypeBadge } from '@/components/TypeBadge';
import { toast } from '@/components/Toast';
import { fetchApi } from '@/api/client';
import { ShowcaseManager } from '@/components/ShowcaseManager';
import { CouponManagement } from '@/components/admin/CouponManagement';
import { SeasonalCampaignsManager } from '@/components/SeasonalCampaignsManager';
import { WorkshopVideosManager } from '@/components/WorkshopVideosManager';
import {
  getStoredProducts,
  fetchRemoteProducts,
  saveProduct,
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
  setFeaturedProduct,
  incrementProductStock,
  updateProductPrice,
  getStoredFilaments,
  fetchRemoteFilaments,
  saveFilament,
  updateFilamentStock,
  deleteFilament,
  getStoredOrders,
  fetchRemoteOrders,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  getStoredQuotes,
  fetchRemoteQuotes,
  updateQuote,
  deleteQuote,
  fileToBase64,
  calculateMonthlySales,
  isConfirmedSale,
  isLeadProposal,
  parsePrice,
  formatPrice,
  type Order,
  type Quote,
  type Filament
} from '@/services/storage';
import {
  fetchAdminReviews,
  toggleReviewApproval,
  updateCustomerReview,
  deleteReview as deleteReviewService,
  type CustomerReview
} from '@/services/reviews';

type Section = 'catalogo' | 'destaques' | 'kanban' | 'pedidos' | 'avaliacoes' | 'cupons' | 'campanhas' | 'bastidores' | 'orcamentos' | 'estoque' | 'precos';

const NAV: { id: Section; icon: string; label: string }[] = [
  { id: 'catalogo', icon: '📦', label: 'Catálogo' },
  { id: 'destaques', icon: '⭐', label: 'Destaques & Vitrine' },
  { id: 'campanhas', icon: '🎃', label: 'Campanhas & Eventos' },
  { id: 'bastidores', icon: '🎬', label: 'Vídeos da Oficina' },
  { id: 'kanban', icon: '📋', label: 'Kanban de Produção' },
  { id: 'pedidos', icon: '🛒', label: 'Pedidos e Finanças' },
  { id: 'avaliacoes', icon: '💬', label: 'Avaliações' },
  { id: 'cupons', icon: '🏷️', label: 'Cupons de Desconto' },
  { id: 'orcamentos', icon: '📐', label: 'Orçamentos STL' },
  { id: 'estoque', icon: '🎨', label: 'Cores Disponíveis' },
  { id: 'precos', icon: '💰', label: 'Ajuste de Preços' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Em impressão':      { bg: 'rgba(234,179,8,0.15)', text: '#EAB308' },
  'Aguardando pgto':   { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
  'Entregue':          { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  'Enviado':           { bg: 'rgba(96,165,250,0.15)', text: '#60A5FA' },
  'Aguardando análise':{ bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
  'Orçamento enviado': { bg: 'rgba(96,165,250,0.15)', text: '#60A5FA' },
  'Aprovado':          { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  'Recusado':          { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#1F2937', text: '#9CA3AF' };
  return <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={{ background: c.bg, color: c.text }}>{status}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1 text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-9 px-3 rounded-lg text-sm outline-none transition-colors"
      style={{ background: '#111827', border: '1px solid #374151', color: '#F9FAFB' }}
      onFocus={e => (e.target.style.borderColor = '#F97316')}
      onBlur={e => (e.target.style.borderColor = '#374151')}
    />
  );
}

// ------------------- MODAL: CONFIGURAÇÃO DE CONEXÃO COM O BANCO -------------------
function ApiConfigModal({ onClose }: { onClose: () => void }) {
  const currentUrl = localStorage.getItem('imaginelab_api_url') || localStorage.getItem('forja_api_url') || import.meta.env.VITE_API_URL || (import.meta.env as any).NEXT_PUBLIC_API_URL || 'https://api.imaginelab.seudominio.com.br/api/v1';
  const [url, setUrl] = useState(currentUrl);
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);

  async function handleTest() {
    setTesting(true);
    setStatusResult(null);
    try {
      const clean = url.replace(/\/+$/, '');
      const res = await fetch(`${clean}/models`);
      if (res.ok) {
        setStatusResult('🟢 Conexão com o banco de dados realizada com sucesso!');
      } else if (res.status === 503) {
        setStatusResult('🔴 Erro 503: O serviço da API está temporariamente suspenso ou desligado. Verifique o container ImagineLab.');
      } else if (res.status === 404) {
        setStatusResult('🔴 Erro 404: Rota não encontrada. Verifique se a URL termina com /api/v1');
      } else {
        setStatusResult(`⚠️ Servidor respondeu com código ${res.status}`);
      }
    } catch (e: any) {
      setStatusResult(`🔴 Falha ao conectar: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    localStorage.setItem('imaginelab_api_url', url.trim());
    localStorage.setItem('forja_api_url', url.trim());
    toast.show({
      title: 'URL da API atualizada!',
      message: 'A nova URL será utilizada para todas as chamadas ao banco.',
      type: 'success',
      icon: '⚙️',
    });
    onClose();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl p-6" style={{ background: '#111827', border: '1px solid #374151' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div>
            <h3 className="font-extrabold text-base text-gray-100">⚙️ Configuração da API do Banco de Dados</h3>
            <p className="text-xs text-gray-400">Ambiente de Produção (Java Spring Boot + MySQL)</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="py-4 flex flex-col gap-4">
          <Field label="URL do Backend / API">
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.imaginelab.seudominio.com.br/api/v1" />
          </Field>

          {statusResult && (
            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono">
              {statusResult}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={handleTest}
              className="flex-1 h-10 rounded-lg text-xs font-bold border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 cursor-pointer"
            >
              {testing ? 'Testando Conexão...' : '🔍 Testar Conexão'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 h-10 rounded-lg text-xs font-bold text-white cursor-pointer"
              style={{ background: '#F97316' }}
            >
              💾 Salvar URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------- MODAL: NOVO PEDIDO MANUAL -------------------
function OrderModal({ onClose, onSave }: { onClose: () => void; onSave: (o: Order) => void }) {
  const [form, setForm] = useState({ cliente: '', produto: '', valor: '149,00', status: 'Em impressão' });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente.trim()) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 350));

    const saved = await addOrder({
      cliente: form.cliente.trim(),
      produto: form.produto.trim() || 'Figure Personalizada',
      valor: form.valor,
      status: form.status,
    });

    toast.show({
      title: 'Pedido registrado com sucesso!',
      message: `Pedido para "${saved.cliente}" no valor de R$ ${saved.valor} foi cadastrado.`,
      type: 'success',
      icon: '🛒',
    });

    onSave(saved);
    onClose();
    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm overflow-y-auto rounded-2xl shadow-2xl p-5" style={{ background: '#111827', border: '1px solid #374151' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="font-extrabold text-base text-gray-100">Registrar Novo Pedido</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <Field label="Nome do Cliente *">
            <Input required placeholder="Ex: Ash Ketchum" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
          </Field>
          <Field label="Produto ou Figure *">
            <Input required placeholder="Ex: Rayquaza Shiny 1:10" value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))} />
          </Field>
          <Field label="Valor da Venda (R$) *">
            <Input required placeholder="149,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
          </Field>
          <Field label="Status Inicial">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100">
              {['Em impressão', 'Aguardando pgto', 'Enviado', 'Entregue'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <button 
            disabled={isSaving} 
            type="submit" 
            className="w-full h-11 rounded-xl font-extrabold text-sm mt-1 transition-all flex items-center justify-center gap-2 cursor-pointer" 
            style={{ background: '#F97316', color: '#fff' }}
          >
            {isSaving ? (
              <>
                <span className="animate-spin text-sm">⏳</span> Salvando no Banco de Dados...
              </>
            ) : (
              <>Salvar Pedido 💾</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ------------------- MODAL: EDITAR AVALIAÇÃO DO CLIENTE -------------------
function EditReviewModal({
  review,
  onClose,
  onSave
}: {
  review: CustomerReview;
  onClose: () => void;
  onSave: (updated: CustomerReview) => void;
}) {
  const [form, setForm] = useState({
    customerName: review.customerName,
    rating: review.rating,
    comment: review.comment,
    productName: review.productName,
    customerCity: review.customerCity || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.comment.trim() || !form.productName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateCustomerReview(review.id, {
        customerName: form.customerName.trim(),
        rating: Number(form.rating),
        comment: form.comment.trim(),
        productName: form.productName.trim(),
        customerCity: form.customerCity.trim() || undefined
      });
      toast.show({
        title: 'Avaliação atualizada!',
        message: `Depoimento de "${updated.customerName}" foi salvo no banco de dados.`,
        type: 'success',
        icon: '✏️'
      });
      onSave(updated);
      onClose();
    } catch (err) {
      toast.show({
        title: 'Erro ao salvar',
        message: 'Não foi possível atualizar a avaliação.',
        type: 'error',
        icon: '⚠️'
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md overflow-y-auto rounded-2xl shadow-2xl p-6" style={{ background: '#111827', border: '1px solid #374151' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="font-extrabold text-base text-gray-100 flex items-center gap-2">
                <span>✏️</span>
                <span>Editar Avaliação do Cliente</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Atualize a nota, nome, peça ou texto do depoimento</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome do Cliente *">
              <Input
                required
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="Ex: Lucas M."
              />
            </Field>

            <Field label="Cidade / Estado (opcional)">
              <Input
                value={form.customerCity}
                onChange={e => setForm(f => ({ ...f, customerCity: e.target.value }))}
                placeholder="Ex: Curitiba - PR"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Peça Adquirida *">
              <Input
                required
                value={form.productName}
                onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                placeholder="Ex: Zorua (Pintado à Mão)"
              />
            </Field>

            <Field label="Classificação (Estrelas) *">
              <select
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100"
              >
                <option value={5}>★★★★★ (5 Estrelas - Excelente)</option>
                <option value={4}>★★★★☆ (4 Estrelas - Muito Bom)</option>
                <option value={3}>★★★☆☆ (3 Estrelas - Bom)</option>
                <option value={2}>★★☆☆☆ (2 Estrelas - Regular)</option>
                <option value={1}>★☆☆☆☆ (1 Estrela - Ruim)</option>
              </select>
            </Field>
          </div>

          <Field label="Texto do Depoimento *">
            <textarea
              required
              rows={4}
              maxLength={500}
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Escreva ou edite o depoimento do cliente..."
              className="w-full p-3 rounded-lg text-xs leading-relaxed outline-none resize-none bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-orange-500 transition-colors"
            />
            <span className="text-[10px] text-gray-500 text-right block mt-0.5">
              {form.comment.length}/500 caracteres
            </span>
          </Field>

          <div className="flex gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              disabled={isSaving}
              type="submit"
              className="flex-1 h-10 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-orange-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: '#EA580C' }}
            >
              {isSaving ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------- MODAL: PRODUTO -------------------
function ProductModal({ onClose, onSave, initialData }: { onClose: () => void; onSave: (p: Product) => void; initialData?: Product }) {
  const [form, setForm] = useState({
    name: initialData?.name || '', 
    category: (initialData?.category ? toProductCategory(initialData.category) : 'FIGURE_POKEMON') as ProductCategory, 
    universe: (initialData?.universe || toProductUniverse(undefined, initialData?.name, initialData?.category)) as ProductUniverse,
    types: initialData?.types?.join(', ') || '',
    scale: initialData?.scales?.[0] || '1:10', 
    material: initialData?.materials?.[0] || 'PLA', 
    printTimeH: (initialData?.printTimeH ?? 14).toString(), 
    filamentG: (initialData?.filamentG ?? 320).toString(), 
    basePrice: (initialData?.basePrice ?? 149).toString(), 
    promoPrice: initialData?.promoPrice ? initialData.promoPrice.toString() : '',
    image: initialData?.image || '', 
    active: initialData ? initialData.active : true,
    featured: initialData ? Boolean(initialData.featured) : false,
    stock: (initialData?.stock ?? 1).toString(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      try {
        setIsProcessingImage(true);
        const b64 = await fileToBase64(e.target.files[0]);
        setForm(f => ({ ...f, image: b64 }));
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      } finally {
        setIsProcessingImage(false);
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 450));

    try {
      const parsedTypes = form.types
        .split(',')
        .map(t => t.trim())
        .filter(Boolean) as PokemonType[];

      const parsedPromo = parseFloat(form.promoPrice);

      const saved = await saveProduct({
        id: initialData?.id,
        name: form.name.trim(),
        category: form.category,
        universe: form.universe,
        types: parsedTypes.length > 0 ? parsedTypes : ['Normal' as PokemonType],
        scales: [form.scale as any],
        materials: [form.material as any],
        basePrice: parseFloat(form.basePrice) || 0,
        promoPrice: (!isNaN(parsedPromo) && parsedPromo > 0) ? parsedPromo : undefined,
        printTimeH: parseInt(form.printTimeH, 10) || 0,
        filamentG: parseInt(form.filamentG, 10) || 0,
        image: form.image.trim() || 'https://placehold.co/600x700/1F2937/F97316?text=Figure',
        active: form.active,
        featured: form.featured,
        stock: parseInt(form.stock, 10) || 1,
      }, initialData?.id);

      toast.show({
        title: initialData ? 'Produto atualizado!' : 'Produto cadastrado com sucesso!',
        message: `"${saved.name}" foi salvo com sucesso no catálogo.`,
        type: 'success',
        icon: '💾',
      });

      onSave(saved);
      onClose(); // Fecha automaticamente
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: '#111827', border: '1px solid #374151' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSave}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#111827]/95 backdrop-blur-md" style={{ borderBottom: '1px solid #374151' }}>
            <div>
              <h2 className="font-extrabold text-lg text-gray-100">{initialData ? 'Editar Produto' : 'Nova Figure / Produto'}</h2>
              <p className="text-xs text-gray-400">Preencha as especificações da peça</p>
            </div>
            <button type="button" onClick={onClose} className="text-sm px-3 py-1 rounded-lg text-gray-400 hover:text-white" style={{ background: '#1F2937' }}>✕</button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <Field label="Nome do produto *">
              <Input required placeholder="Ex: Figure Fuecoco 1:10" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Universo Temático">
                <select 
                  value={form.universe} 
                  onChange={e => setForm(f => ({ ...f, universe: e.target.value as ProductUniverse }))} 
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100 font-semibold"
                >
                  {(Object.keys(UNIVERSE_CONFIG) as ProductUniverse[]).map(key => (
                    <option key={key} value={key}>
                      {UNIVERSE_CONFIG[key].badge} ({UNIVERSE_CONFIG[key].label})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Categoria">
                <select 
                  value={form.category} 
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))} 
                  className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100"
                >
                  {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(key => (
                    <option key={key} value={key}>
                      {CATEGORY_LABELS[key]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {form.category === 'FIGURE_POKEMON' && (<Field label="Tipos de Pokémon (Múltipla escolha)">
  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-700 rounded-lg bg-gray-900">
    {ALL_TYPES.map(t => (
      <label key={t} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 p-1 rounded transition-colors">
        <input type="checkbox" className="accent-orange-500 w-3.5 h-3.5" 
          checked={form.types.split(',').map(x=>x.trim()).includes(t)}
          onChange={(e) => {
            const curr = form.types.split(',').map(x=>x.trim()).filter(Boolean);
            if (e.target.checked) curr.push(t);
            else curr.splice(curr.indexOf(t), 1);
            setForm(f => ({ ...f, types: curr.join(', ') }));
          }}
        />
        <span className="text-[11px] text-gray-300 font-medium">{t}</span>
      </label>
    ))}
  </div>
</Field>)}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Escala">
                <select value={form.scale} onChange={e => setForm(f => ({ ...f, scale: e.target.value as any }))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100">
                  {ALL_SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Material">
                <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value as any }))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100">
                  {['PLA','Resina'].map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Preço base normal (R$) *">
                <Input required type="number" step="0.01" placeholder="149.00" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} />
              </Field>
              <Field label="Preço Promocional (R$ - Opcional)">
                <Input type="number" step="0.01" placeholder="Ex: 119.00 (deixe vazio se sem promo)" value={form.promoPrice} onChange={e => setForm(f => ({ ...f, promoPrice: e.target.value }))} />
              </Field>
            </div>

            {form.promoPrice && parseFloat(form.promoPrice) > 0 && parseFloat(form.basePrice) > parseFloat(form.promoPrice) && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between text-xs text-orange-400">
                <span className="font-bold">🔥 Oferta Ativa: Preço riscado de R$ {parseFloat(form.basePrice).toFixed(2)}</span>
                <span className="font-extrabold font-mono text-emerald-400">
                  Economia de R$ {(parseFloat(form.basePrice) - parseFloat(form.promoPrice)).toFixed(2)} ({Math.round((1 - parseFloat(form.promoPrice)/parseFloat(form.basePrice))*100)}% OFF)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tempo impressão (h)"><Input type="number" placeholder="18" value={form.printTimeH} onChange={e => setForm(f => ({ ...f, printTimeH: e.target.value }))} /></Field>
              <Field label="Filamento (g)"><Input type="number" placeholder="320" value={form.filamentG} onChange={e => setForm(f => ({ ...f, filamentG: e.target.value }))} /></Field>
            </div>

            <Field label="URL da Imagem">
              <Input 
                placeholder="https://exemplo.com/imagem.jpg" 
                value={form.image.startsWith('data:') ? '' : form.image} 
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))} 
              />
            </Field>

            <Field label="Ou selecione um arquivo do computador">
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1F2937] file:text-[#F9FAFB] hover:file:bg-[#374151] cursor-pointer"
                />
                {isProcessingImage && <span className="text-xs text-orange-400 animate-pulse">Processando imagem...</span>}
              </div>
            </Field>

            {form.image && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1F2937]/60 border border-[#374151]">
                <img src={form.image} alt="Preview" className="w-14 h-14 object-cover rounded-md border border-gray-700 bg-black/40" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-200">Prévia da imagem</span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[280px]">Pronta para ser salva</span>
                </div>
              </div>
            )}

            <Field label="Unidades em Estoque">
              <Input 
                type="number" 
                min="0" 
                placeholder="1" 
                value={form.stock} 
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} 
              />
            </Field>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
              <span className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                ⭐ Destacar esta peça no topo da vitrine da loja
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
              <span className="text-sm font-semibold text-gray-300">Produto ativo na vitrine da loja</span>
            </label>

            <button 
              disabled={isSaving || isProcessingImage} 
              type="submit" 
              className="w-full h-12 rounded-xl font-extrabold text-sm mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 hover:opacity-90 active:scale-[0.99] cursor-pointer" 
              style={{ background: '#F97316', color: '#fff' }}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin text-lg">⏳</span> Salvando no Banco de Dados...
                </>
              ) : (
                <>{initialData ? "Atualizar Produto" : "Salvar Produto"} 💾</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------- MODAL: FILAMENTO -------------------
function FilamentModal({ onClose, onSave }: { onClose: () => void; onSave: (f: Filament) => void }) {
  const [form, setForm] = useState({ color: '', material: 'PLA', stockG: '1000', minStockG: '300', hexCode: '#f97316' });
  const presetColors = [
    // Básicos
    { label: 'Preto Fosco', hex: '#18181B' },
    { label: 'Branco Seda', hex: '#FAFAFA' },
    { label: 'Cinza Prata', hex: '#94A3B8' },
    { label: 'Grafite', hex: '#334155' },
    // Fogo & Quentes
    { label: 'Vermelho Charizard', hex: '#DC2626' },
    { label: 'Laranja Charmander', hex: '#F97316' },
    { label: 'Dourado/Amarelo', hex: '#EAB308' },
    { label: 'Cobre Metálico', hex: '#B45309' },
    // Água & Frio
    { label: 'Azul Gyarados', hex: '#2563EB' },
    { label: 'Ciano Ártico', hex: '#06B6D4' },
    { label: 'Azul Marinho', hex: '#1E3A8A' },
    // Natureza
    { label: 'Verde Bulbasaur', hex: '#16A34A' },
    { label: 'Verde Oliva', hex: '#4D7C0F' },
    { label: 'Esmeralda', hex: '#059669' },
    // Especiais / Místicos
    { label: 'Roxo Gengar', hex: '#7C3AED' },
    { label: 'Rosa Fada', hex: '#EC4899' },
    { label: 'Bege/Nude Primer', hex: '#D4B996' },
    { label: 'Marrom Madeira', hex: '#78350F' }
  ];
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.color.trim()) return;

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));

    try {
      const saved = await saveFilament({
        color: form.color.trim(),
        material: form.material.trim(),
        stockGrams: 1000,
        minStockGrams: 0,
        hexCode: form.hexCode
      });

      toast.show({
        title: 'Cor adicionada com sucesso!',
        message: `A cor "${saved.color} (${saved.material})" foi disponibilizada na vitrine da loja.`,
        type: 'success',
        icon: '🎨',
      });

      onSave(saved);
      onClose(); // Fecha tela automaticamente
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm overflow-y-auto rounded-2xl shadow-2xl" style={{ background: '#111827', border: '1px solid #374151' }} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSave}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div>
              <h2 className="font-extrabold text-lg text-gray-100">Nova Cor de Filamento</h2>
              <p className="text-xs text-gray-400">Cadastrar cor visível na loja</p>
            </div>
            <button type="button" onClick={onClose} className="text-sm px-3 py-1 rounded-lg text-gray-400 hover:text-white" style={{ background: '#1F2937' }}>✕</button>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <Field label="Nome da Cor *"><Input required placeholder="Ex: Vermelho Charizard" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></Field>
            <Field label="Cor Visual (Hex)">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.hexCode} onChange={e => setForm(f => ({ ...f, hexCode: e.target.value }))} className="w-12 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                  <Input placeholder="#f97316" value={form.hexCode} onChange={e => setForm(f => ({ ...f, hexCode: e.target.value }))} className="flex-1 font-mono uppercase" />
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {presetColors.map(c => (
                    <button key={c.hex} type="button" onClick={() => setForm(f => ({ ...f, hexCode: c.hex }))} className="w-6 h-6 rounded-full border border-gray-600 transition-transform hover:scale-110" style={{ backgroundColor: c.hex }} title={c.label} />
                  ))}
                </div>
              </div>
            </Field>
            <Field label="Material *">
              <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className="w-full h-9 px-3 rounded-lg text-sm outline-none bg-gray-900 border border-gray-700 text-gray-100">
                {['PLA','Resina','PETG','ABS'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            
            <button 
              disabled={isSaving} 
              type="submit" 
              className="w-full h-11 rounded-xl font-extrabold text-sm mt-1 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-950/40" 
              style={{ background: '#F97316', color: '#fff' }}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Salvando no Catálogo...
                </>
              ) : (
                <>Salvar Cor 🎨</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------- MODAL: RESPONDER ORÇAMENTO -------------------
function QuoteModal({ quote, onClose, onSave }: { quote: Quote; onClose: () => void; onSave: (updated: Quote) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleReject() {
    setIsProcessing(true);
    try {
      await fetchApi(`/admin/quotes/${quote.id}/reject`, { method: 'PATCH' });
      toast.show({ title: 'Rejeitado', message: 'Orçamento rejeitado.', type: 'success' });
      onSave({ ...quote, status: 'Recusado' });
      onClose();
    } catch(e) {
      toast.show({ title: 'Erro', message: 'Falha ao rejeitar.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApproveAndZap() {
    setIsProcessing(true);
    try {
      const zapLink = `https://wa.me/${quote.contato?.replace(/\D/g, '')}?text=Olá! Seu orçamento foi aprovado.`;
      window.open(zapLink, '_blank');
      toast.show({ title: 'Sucesso', message: 'Orçamento aprovado e WhatsApp aberto.', type: 'success' });
      onSave({ ...quote, status: 'Aprovado' });
      onClose();
    } catch(e) {
      toast.show({ title: 'Erro', message: 'Falha ao aprovar.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConvertToOS() {
    setIsProcessing(true);
    try {
      await fetchApi(`/admin/quotes/${quote.id}/convert-to-kanban`, { method: 'POST' });
      toast.show({ title: 'Convertido!', message: 'OS criada no Kanban.', type: 'success' });
      onSave({ ...quote, status: 'Convertido' });
      onClose();
    } catch(e) {
      toast.show({ title: 'Erro', message: 'Falha ao converter.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md overflow-y-auto rounded-2xl shadow-2xl p-5 flex flex-col gap-4" style={{ background: '#111827', border: '1px solid #374151' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h2 className="font-extrabold text-lg text-gray-100">Analisar Orçamento STL</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-sm flex flex-col gap-2">
          <div><strong className="text-gray-300">ID:</strong> {quote.id}</div>
          <div><strong className="text-gray-300">Cliente:</strong> {quote.cliente}</div>
          <div><strong className="text-gray-300">Arquivo:</strong> {quote.arquivo}</div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button disabled={isProcessing} onClick={handleReject} className="w-full h-10 rounded-xl bg-red-900/50 text-red-400 font-bold hover:bg-red-900 border border-red-500/30 transition-colors cursor-pointer">
            Rejeitar STL ❌
          </button>
          <button disabled={isProcessing} onClick={handleApproveAndZap} className="w-full h-10 rounded-xl bg-green-700 text-white font-bold hover:bg-green-600 transition-colors cursor-pointer">
            Aprovar & WhatsApp 💬
          </button>
          <button disabled={isProcessing} onClick={handleConvertToOS} className="w-full h-10 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-colors cursor-pointer">
            Converter em OS no Kanban 📥
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------- PRINCIPAL: ADMIN DASHBOARD -------------------
export default function Admin({ defaultSection = 'catalogo' }: { defaultSection?: Section } = {}) {
  const [section, setSection] = useState<Section>(defaultSection);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orcamentos, setOrcamentos] = useState<Quote[]>([]);
  const [filamentos, setFilamentos] = useState<Filament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isTcgModalOpen, setIsTcgModalOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'3d' | 'tcg'>('3d');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showNewFilamentModal, setShowNewFilamentModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [answeringQuote, setAnsweringQuote] = useState<Quote | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSaveTcg() {
    const updated = await fetchRemoteProducts();
    setCatalog(updated);
    setIsTcgModalOpen(false);
    setEditingProduct(null);
  }


  // Carrega diretamente da API em produção
  
  

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchRemoteProducts(),
      fetchRemoteOrders(),
      fetchRemoteFilaments(),
      fetchRemoteQuotes(),
    ]).then(([p, o, f, q]) => {
      setCatalog(p);
      setOrders(o);
      setFilamentos(f);
      setOrcamentos(q);
    }).finally(() => {
      setIsLoading(false);
    });

    const handleStorageUpdate = () => {
      setCatalog(getStoredProducts());
      setOrders(getStoredOrders());
      setOrcamentos(getStoredQuotes());
      setFilamentos(getStoredFilaments());
    };

    window.addEventListener('forja_products_updated', handleStorageUpdate);
    window.addEventListener('forja_orders_updated', handleStorageUpdate);
    window.addEventListener('forja_quotes_updated', handleStorageUpdate);
    window.addEventListener('forja_filaments_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('forja_products_updated', handleStorageUpdate);
      window.removeEventListener('forja_orders_updated', handleStorageUpdate);
      window.removeEventListener('forja_quotes_updated', handleStorageUpdate);
      window.removeEventListener('forja_filaments_updated', handleStorageUpdate);
    };
  }, []);

  // Separação estrita: Vendas confirmadas vs Propostas/Leads no WhatsApp
  const confirmedOrders = useMemo(() => {
    return orders.filter(o => isConfirmedSale(o.status));
  }, [orders]);

  const leadOrders = useMemo(() => {
    return orders.filter(o => isLeadProposal(o.status));
  }, [orders]);

  // Gráfico financeiro 100% dinâmico baseado exclusivamente em pedidos confirmados
  const chartData = useMemo(() => {
    return calculateMonthlySales(orders);
  }, [orders]);

  // KPIs dinâmicos locais
  const totalRealRevenue = useMemo(() => {
    return confirmedOrders.reduce((sum, o) => sum + parsePrice(o.valor), 0);
  }, [confirmedOrders]);

  const totalConfirmedOrders = confirmedOrders.length;

  const pipelinePotentialRevenue = useMemo(() => {
    return leadOrders.reduce((sum, o) => sum + parsePrice(o.valor), 0);
  }, [leadOrders]);

  const activeLeadsCount = leadOrders.length;

  const ticketMedioReal = useMemo(() => {
    if (totalConfirmedOrders === 0) return 0;
    return totalRealRevenue / totalConfirmedOrders;
  }, [totalRealRevenue, totalConfirmedOrders]);

  // Sincronização opcional com backend (/api/v1/admin/finances/summary)
  const [remoteFinances, setRemoteFinances] = useState<{
    totalRealRevenue?: number;
    totalConfirmedOrders?: number;
    pipelinePotentialRevenue?: number;
    activeLeadsCount?: number;
    averageTicket?: number;
    monthlySales?: { mes: string; vendas: number }[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetchApi('/admin/finances/summary')
      .then((data: any) => {
        if (active && data) {
          setRemoteFinances({
            totalRealRevenue: typeof data.totalRealRevenue === 'number' ? data.totalRealRevenue : undefined,
            totalConfirmedOrders: typeof data.totalConfirmedOrders === 'number' ? data.totalConfirmedOrders : undefined,
            pipelinePotentialRevenue: typeof data.pipelinePotentialRevenue === 'number' ? data.pipelinePotentialRevenue : undefined,
            activeLeadsCount: typeof data.activeLeadsCount === 'number' ? data.activeLeadsCount : undefined,
            averageTicket: typeof data.averageTicket === 'number' ? data.averageTicket : undefined,
            monthlySales: Array.isArray(data.monthlySales) ? data.monthlySales : undefined,
          });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [orders]);

  const displayRealRevenue = remoteFinances?.totalRealRevenue !== undefined && remoteFinances.totalRealRevenue > 0
    ? remoteFinances.totalRealRevenue
    : totalRealRevenue;

  const displayConfirmedCount = remoteFinances?.totalConfirmedOrders !== undefined && remoteFinances.totalConfirmedOrders > 0
    ? remoteFinances.totalConfirmedOrders
    : totalConfirmedOrders;

  const displayPipelineRevenue = remoteFinances?.pipelinePotentialRevenue !== undefined && remoteFinances.pipelinePotentialRevenue > 0
    ? remoteFinances.pipelinePotentialRevenue
    : pipelinePotentialRevenue;

  const displayLeadsCount = remoteFinances?.activeLeadsCount !== undefined && remoteFinances.activeLeadsCount > 0
    ? remoteFinances.activeLeadsCount
    : activeLeadsCount;

  const displayTicketMedio = remoteFinances?.averageTicket !== undefined && remoteFinances.averageTicket > 0
    ? remoteFinances.averageTicket
    : ticketMedioReal;

  const displayChartData = remoteFinances?.monthlySales && remoteFinances.monthlySales.length > 0
    ? remoteFinances.monthlySales
    : chartData;

  // Avaliações & Depoimentos Reais
  const [adminReviews, setAdminReviews] = useState<CustomerReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);

  const loadAdminReviews = useCallback(async (filter?: string) => {
    setIsLoadingReviews(true);
    try {
      const data = await fetchAdminReviews(filter || reviewFilter);
      setAdminReviews(data);
    } catch (e) {
      console.warn('Erro ao carregar avaliações no admin:', e);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [reviewFilter]);

  useEffect(() => {
    loadAdminReviews(reviewFilter);
    const handleReviewUpdate = () => {
      loadAdminReviews(reviewFilter);
    };
    window.addEventListener('forja_reviews_updated', handleReviewUpdate);
    return () => {
      window.removeEventListener('forja_reviews_updated', handleReviewUpdate);
    };
  }, [loadAdminReviews, reviewFilter]);

  async function handleToggleReviewApproval(r: CustomerReview) {
    const updated = await toggleReviewApproval(r.id);
    setAdminReviews(prev => prev.map(item => item.id === r.id ? { ...item, isApproved: updated.isApproved } : item));
    toast.show({
      title: updated.isApproved ? 'Avaliação aprovada para a vitrine!' : 'Avaliação ocultada da vitrine',
      message: updated.isApproved 
        ? `A avaliação de "${r.customerName}" agora está visível no site.`
        : `A avaliação de "${r.customerName}" foi ocultada do site.`,
      type: updated.isApproved ? 'success' : 'info',
      icon: updated.isApproved ? '⭐' : '👁️'
    });
  }

  async function handleDeleteReview(r: CustomerReview) {
    if (confirm(`Tem certeza que deseja excluir a avaliação de "${r.customerName}"?`)) {
      await deleteReviewService(r.id);
      setAdminReviews(prev => prev.filter(item => item.id !== r.id));
      toast.show({
        title: 'Avaliação excluída!',
        message: `Depoimento de "${r.customerName}" foi removido com sucesso.`,
        type: 'info',
        icon: '🗑️'
      });
    }
  }

  function handleCopyReviewLink() {
    const link = `${window.location.origin}/#avaliacoes`;
    const message = `Olá! Sua encomenda da ImagineLab chegou? Adoraríamos saber o que achou da peça! Você pode deixar sua avaliação rápida aqui: ${link}`;
    navigator.clipboard.writeText(message);
    toast.show({
      title: 'Mensagem e link copiados!',
      message: 'Texto pronto para colar no WhatsApp do cliente após a entrega do pacote.',
      type: 'success',
      icon: '📱'
    });
  }

  // Catálogo: Alternar Peça em Destaque da Loja
  function handleToggleFeatured(p: Product) {
    const isNowFeatured = toggleProductFeatured(p.id);
    setCatalog(getStoredProducts());
    toast.show({
      title: isNowFeatured ? 'Peça colocada em destaque!' : 'Destaque removido',
      message: isNowFeatured ? `"${p.name}" agora é a peça exibida no topo da loja.` : `"${p.name}" não está mais no topo da loja.`,
      type: 'success',
      icon: '⭐'
    });
  }

  // Catálogo: Ajuste Rápido de Unidades em Estoque
  function handleAdjustStock(p: Product, delta: number) {
    const newStock = incrementProductStock(p.id, delta);
    setCatalog(getStoredProducts());
    toast.show({
      title: 'Estoque atualizado!',
      message: `${delta > 0 ? `+${delta}` : delta} unidade(s) de "${p.name}". Total em estoque: ${newStock} un.`,
      type: 'success',
      icon: '📦'
    });
  }

  // Catálogo: Ativar ou Pausar Produto
  async function handleToggleActive(p: Product) {
    const isNowActive = await toggleProductActive(p.id);
    setCatalog(prev => prev.map(x => x.id === p.id ? { ...x, active: isNowActive } : x));
    toast.show({
      title: isNowActive ? 'Produto ativado!' : 'Produto pausado',
      message: `"${p.name}" ${isNowActive ? 'já está visível na vitrine da loja' : 'foi pausado e ocultado'}.`,
      type: 'info',
      icon: isNowActive ? '▶️' : '⏸️'
    });
  }

  // Catálogo: Deletar Figure
  async function handleDeleteProduct(p: Product) {
    if (confirm(`Tem certeza que deseja remover "${p.name}" do catálogo?`)) {
      await deleteProduct(p.id);
      setCatalog(prev => prev.filter(x => x.id !== p.id));
      toast.show({
        title: 'Produto excluído!',
        message: `"${p.name}" foi removido do catálogo.`,
        type: 'info',
        icon: '🗑️'
      });
    }
  }

  // Pedidos: Alterar Status
  async function handleOrderStatusChange(o: Order, newStatus: string) {
    await updateOrderStatus(o.id, newStatus);
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: newStatus } : x));
    toast.show({
      title: 'Status do Pedido atualizado!',
      message: `Pedido ${o.id} alterado para "${newStatus}".`,
      type: 'success',
      icon: '🛒'
    });
  }

  // Pedidos: Deletar
  async function handleDeleteOrder(o: Order) {
    if (confirm(`Deletar pedido ${o.id}?`)) {
      await deleteOrder(o.id);
      setOrders(prev => prev.filter(x => x.id !== o.id));
      toast.show({
        title: 'Pedido removido!',
        message: `Pedido ${o.id} foi removido com sucesso.`,
        type: 'info',
        icon: '🗑️'
      });
    }
  }

  // Orçamentos: Deletar
  async function handleDeleteQuote(q: Quote) {
    if (confirm(`Deletar orçamento ${q.id}?`)) {
      await deleteQuote(q.id);
      setOrcamentos(prev => prev.filter(x => x.id !== q.id));
      toast.show({
        title: 'Orçamento removido!',
        message: `Orçamento ${q.id} foi excluído.`,
        type: 'info',
        icon: '🗑️'
      });
    }
  }

  // Estoque: Ajuste Rápido de Filamento
  async function handleFilamentStockChange(f: Filament, delta: number) {
    const newStock = Math.max(0, (f.stockGrams || 0) + delta);
    await updateFilamentStock(f.id, newStock);
    setFilamentos(prev => prev.map(x => x.id === f.id ? { ...x, stockGrams: newStock } : x));
    toast.show({
      title: 'Estoque atualizado!',
      message: `Bobina "${f.color}" ajustada para ${newStock}g.`,
      type: 'info',
      icon: '🧵'
    });
  }

  // Estoque: Deletar Bobina
  async function handleDeleteFilament(f: Filament) {
    if (confirm(`Deletar bobina "${f.color}" do estoque?`)) {
      await deleteFilament(f.id);
      setFilamentos(prev => prev.filter(x => x.id !== f.id));
      toast.show({
        title: 'Bobina removida!',
        message: `Filamento ${f.color} removido do estoque.`,
        type: 'info',
        icon: '🗑️'
      });
    }
  }

  // Preços: Salvar Preço
  async function handleSavePrice(p: Product, newPrice: number, newPromoPrice?: number | null) {
    await updateProductPrice(p.id, newPrice, newPromoPrice);
    setCatalog(prev => prev.map(x => x.id === p.id ? { 
      ...x, 
      basePrice: newPrice, 
      promoPrice: newPromoPrice === null ? undefined : (newPromoPrice !== undefined ? newPromoPrice : x.promoPrice) 
    } : x));
    toast.show({
      title: 'Preço atualizado com sucesso!',
      message: `Preço de "${p.name}" alterado para R$ ${newPrice.toFixed(2)}${newPromoPrice ? ` (Promo: R$ ${newPromoPrice.toFixed(2)})` : ''}.`,
      type: 'success',
      icon: '💰'
    });
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0B0F19' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 md:hidden bg-black/60" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 md:z-auto flex-shrink-0 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ width: 220, background: '#111827', borderRight: '1px solid #1F2937' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <img src="/images/logo.png" alt="ImagineLab Admin" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-extrabold text-[14px] text-gray-100">ImagineLab Admin</div>
            <button 
              onClick={() => setShowApiModal(true)} 
              className="text-[10px] text-orange-400 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Banco de Dados ⚙️
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1.5">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => { setSection(n.id); setSidebarOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-all w-full cursor-pointer"
              style={section === n.id
                ? { background: 'rgba(249,115,22,0.14)', color: '#F97316', border: '1px solid rgba(249,115,22,0.25)' }
                : { color: '#9CA3AF', background: 'transparent', border: '1px solid transparent' }
              }
            >
              <span className="text-base">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 flex flex-col gap-2">
          <button 
            onClick={() => setShowApiModal(true)} 
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-orange-400 hover:bg-gray-800/60 transition-all cursor-pointer"
          >⚙️ Configurações da Loja</button>
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-orange-400 hover:bg-gray-800/60 transition-all">
            ← Ver Vitrine da Loja
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 md:px-8 py-4 sticky top-0 z-30 shadow-md backdrop-blur-md bg-gray-900/95 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-gray-800 text-gray-400">☰</button>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{NAV.find(n => n.id === section)?.icon}</span>
            <h1 className="font-extrabold text-lg text-gray-100">
              {NAV.find(n => n.id === section)?.label}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {section === 'catalogo' && catalogTab === '3d' && (
              <button 
                onClick={() => setIs3DModalOpen(true)} 
                className="h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 shadow-md shadow-orange-950/40 cursor-pointer" 
                style={{ background: '#F97316', color: '#fff' }}
              >
                + Nova Figure
              </button>
            )}
            {section === 'catalogo' && catalogTab === 'tcg' && (
              <button 
                onClick={() => setIsTcgModalOpen(true)} 
                className="h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 shadow-md shadow-orange-950/40 cursor-pointer" 
                style={{ background: '#F97316', color: '#fff' }}
              >
                + Novo Produto TCG
              </button>
            )}
            {section === 'pedidos' && (
              <button 
                onClick={() => setShowNewOrderModal(true)} 
                className="h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 shadow-md shadow-orange-950/40 cursor-pointer" 
                style={{ background: '#F97316', color: '#fff' }}
              >
                + Novo Pedido
              </button>
            )}
            {section === 'estoque' && (
              <button 
                onClick={() => setShowNewFilamentModal(true)} 
                className="h-9 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 shadow-md shadow-orange-950/40 cursor-pointer" 
                style={{ background: '#F97316', color: '#fff' }}
              >
                + Nova Cor
              </button>
            )}
            {section === 'avaliacoes' && (
              <button 
                onClick={handleCopyReviewLink} 
                className="h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90 shadow-md shadow-emerald-950/40 cursor-pointer" 
                style={{ background: '#059669', color: '#fff' }}
                title="Copiar mensagem com link de avaliação"
              >
                <span>📱</span>
                <span>Copiar Link p/ WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-auto">

          {/* ── CATÁLOGO ── */}
          {section === 'catalogo' && (
            <div className="flex flex-col gap-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                {[
                  { label: 'Total no banco', value: catalog.length, icon: '📦' },
                  { label: 'Ativos na vitrine', value: catalog.filter(p => p.active).length, icon: '✅' },
                  { label: 'Pausados', value: catalog.filter(p => !p.active).length, icon: '⏸️' },
                  { label: 'Categorias', value: new Set(catalog.map(p => p.category)).size, icon: '🗂️' },
                ].map(k => (
                  <div key={k.label} className="p-4 rounded-xl flex flex-col gap-1 bg-gray-800/80 border border-gray-700/60">
                    <div className="text-xl">{k.icon}</div>
                    <div className="text-2xl font-extrabold text-gray-100">{k.value}</div>
                    <div className="text-[11px] text-gray-400">{k.label}</div>
                  </div>

    
                ))}
              </div>
              {/* TABS */}
              <div className="flex gap-4 border-b border-gray-700 mb-4">
                <button 
                  onClick={() => setCatalogTab('3d')}
                  className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${catalogTab === '3d' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  Impressões 3D
                </button>
                <button 
                  onClick={() => setCatalogTab('tcg')}
                  className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${catalogTab === 'tcg' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  TCG & Selados
                </button>
              </div>

              {/* Table */}
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-700/80">
                {catalog.filter(p => catalogTab === 'tcg' ? p.category === 'TCG' : p.category !== 'TCG').length === 0 ? (
                  <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3 bg-[#111827]">
                    <div className="text-4xl">📦</div>
                    <h3 className="font-extrabold text-base text-gray-200">Nenhum produto cadastrado no banco</h3>
                    <p className="text-xs text-gray-400 max-w-md">Todos os dados mockados foram limpos. Seu banco está vazio e pronto para receber dados reais de produção.</p>
                    <button
                      onClick={() => catalogTab === 'tcg' ? setIsTcgModalOpen(true) : setIs3DModalOpen(true)}
                        className="mt-2 h-9 px-4 rounded-lg text-xs font-bold text-white cursor-pointer"
                      style={{ background: '#F97316' }}
                    >
                      + Cadastrar Primeiro Produto
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800 border-b border-gray-700">
                          {(catalogTab === '3d' ? ['Produto','Categoria','Tipos','Escalas','Preço','Estoque','Status','Ações'] : ['Produto','Coleção','Idioma','Preço','Estoque','Status','Ações']).map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.filter(p => catalogTab === 'tcg' ? p.category === 'TCG' : p.category !== 'TCG').map((p, i) => (
                          <tr key={p.id} style={{ background: i % 2 === 0 ? '#111827' : '#161B24', borderBottom: '1px solid #1F2937' }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={p.image || 'https://placehold.co/600x700/1F2937/F97316?text=Figure'} alt={p.name} className="w-10 h-12 object-cover rounded-lg shrink-0 border border-gray-700 bg-black/40" />
                                <div>
                                  <div className="font-semibold text-sm text-gray-100 flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.featured && (
                                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        ⭐ Destaque da Loja
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-gray-500">{p.id}</div>
                                </div>
                              </div>
                            </td>
                            {catalogTab === '3d' ? (
                                <>
                                  <td className="px-4 py-3 text-[12px] text-gray-300">
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/30">
                                        {UNIVERSE_CONFIG[p.universe || toProductUniverse(p.universe, p.name, p.category)]?.badge || '⚡ POKÉMON'}
                                      </span>
                                      <span>{CATEGORY_LABELS[p.category as ProductCategory] || p.category}</span>
                                    </div>
                                  </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(p.types || []).map((t, idx) => <TypeBadge key={t + idx} type={t} />)}
                                {(!p.types || p.types.length === 0) && <span className="text-[11px] text-gray-500">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(p.scales || ['1:10']).map((s, idx) => (
                                  <span key={s + idx} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">{s}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-sm text-orange-400">R$ {formatPrice(p.basePrice ?? 0)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(p, -1)}
                                  disabled={(p.stock ?? 1) <= 0}
                                  className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center font-bold text-xs border border-gray-700 disabled:opacity-30 cursor-pointer"
                                  title="Remover 1 unidade"
                                >
                                  −
                                </button>
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-100 border border-gray-700 font-mono min-w-[38px] text-center">
                                  {p.stock ?? 1} un
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(p, 1)}
                                  className="w-6 h-6 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-700/60 cursor-pointer"
                                  title="Adicionar +1 unidade"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-3 text-[12px] text-gray-300">{p.expansionName || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
                                      {p.materials && p.materials[0] ? p.materials[0] : '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-sm text-orange-400">R$ {formatPrice(p.basePrice ?? 0)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAdjustStock(p, -1)}
                                        disabled={(p.stock ?? 1) <= 0}
                                        className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center font-bold text-xs border border-gray-700 disabled:opacity-30 cursor-pointer"
                                        title="Remover 1 unidade"
                                      >
                                        −
                                      </button>
                                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-100 border border-gray-700 font-mono min-w-[38px] text-center">
                                        {p.stock ?? 1} un
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleAdjustStock(p, 1)}
                                        className="w-6 h-6 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-700/60 cursor-pointer"
                                        title="Adicionar +1 unidade"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={p.active ? { background: 'rgba(34,197,94,0.15)', color: '#22C55E' } : { background: '#1F2937', color: '#6B7280' }}>
                                {p.active ? 'Ativo' : 'Pausado'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(p, 1)}
                                  title="Adicionar +1 unidade pronta ao estoque"
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all bg-emerald-950/40 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900/60 active:scale-95 cursor-pointer flex items-center gap-1"
                                >
                                  +1 Unidade
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeatured(p)}
                                  title={p.featured ? "Remover do destaque principal" : "Destacar esta peça no topo da loja"}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                                    p.featured 
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' 
                                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-amber-400 hover:bg-gray-700'
                                  }`}
                                >
                                  {p.featured ? '⭐ Em Destaque' : '☆ Destacar'}
                                </button>
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-gray-700 bg-gray-800 border border-gray-700 text-blue-400 cursor-pointer"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => handleToggleActive(p)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-gray-800 bg-gray-800 border border-gray-700 text-gray-400 cursor-pointer"
                                >
                                  {p.active ? '⏸ Pausar' : '▶ Ativar'}
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-red-900/50 cursor-pointer"
                                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#EF4444' }}
                                >
                                  🗑 Deletar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PEDIDOS E FINANÇAS ── */}
          {section === 'pedidos' && (
            <div className="flex flex-col gap-5">
              {/* KPIs com Regras Estritas de Faturamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Card 1: Faturamento Real Confirmado */}
                <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700/70 shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">💰</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                      Confirmado
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-orange-400">
                      R$ {formatPrice(displayRealRevenue)}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-300 mt-0.5">
                      Faturamento Real Confirmado
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Apenas vendas aprovadas e em produção
                    </div>
                  </div>
                </div>

                {/* Card 2: Vendas Concluídas */}
                <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700/70 shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">✅</span>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-full">
                      Fechados
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-100">
                      {displayConfirmedCount}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-300 mt-0.5">
                      Vendas Concluídas
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Pedidos com pagamento confirmado
                    </div>
                  </div>
                </div>

                {/* Card 3: Pipeline em Negociação */}
                <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700/70 shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">⏳</span>
                    <span className="text-[10px] font-bold text-sky-300 bg-slate-700/60 border border-sky-800/40 px-2 py-0.5 rounded-full">
                      {displayLeadsCount} {displayLeadsCount === 1 ? 'proposta aberta' : 'propostas abertas'}
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-sky-200">
                      R$ {formatPrice(displayPipelineRevenue)}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-300 mt-0.5">
                      Pipeline em Negociação
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Leads WhatsApp e propostas em análise
                    </div>
                  </div>
                </div>

                {/* Card 4: Ticket Médio Real */}
                <div className="p-4 rounded-xl bg-gray-800/90 border border-gray-700/70 shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">📊</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                      Média Real
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-100">
                      R$ {formatPrice(displayTicketMedio)}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-300 mt-0.5">
                      Ticket Médio Real
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Calculado exclusivamente sobre vendas pagas
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico Dinâmico */}
              <div className="p-5 rounded-xl shadow-xl bg-gray-800/90 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-100">Vendas Mensais Dinâmicas (R$)</h3>
                    <p className="text-xs text-gray-400">Plotando apenas vendas confirmadas e liquidadas. Leads em negociação não afetam este gráfico.</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40">
                    ● Faturamento Liquidado
                  </span>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayChartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                      <Tooltip
                        contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#F9FAFB' }}
                        itemStyle={{ color: '#F97316' }}
                        formatter={(v) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Faturamento Confirmado']}
                      />
                      <Bar dataKey="vendas" fill="#F97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabela de Pedidos Antiga (Oculta ou mantida aqui caso queira) */}
            </div>
          )}
          {/* ⭐⭐ GESTÃO DE DESTAQUES & VITRINE PRINCIPAL ⭐⭐ */}
          {section === 'destaques' && (
            <ShowcaseManager products={catalog} />
          )}
          {section === 'kanban' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl mb-2">
                <span className="font-bold text-sm text-gray-200">Quadro Kanban de Produção</span>
                <button onClick={() => setShowNewOrderModal(true)} className="text-xs text-orange-400 hover:underline font-bold cursor-pointer">+ Novo Pedido</button>
              </div>
              <KanbanBoard />
            </div>
          )}
          {/* ⭐💬 AVALIAÇÕES E DEPOIMENTOS AUTÊNTICOS 💬⭐ */}
          {section === 'avaliacoes' && (
            <div className="flex flex-col gap-5">
              {/* Barra superior com botão do WhatsApp */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
                <div>
                  <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
                    <span>💬</span>
                    <span>Avaliações & Depoimentos Autênticos</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Modere os depoimentos reais enviados pelos clientes para exibir na vitrine da loja.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyReviewLink}
                    className="h-10 px-4 rounded-lg text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    title="Copiar mensagem pronta com link para enviar pelo WhatsApp após a entrega"
                  >
                    <span>📱</span>
                    <span>Copiar Link para WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Filtros por Status */}
              <div className="flex items-center gap-2">
                {[
                  { key: 'ALL', label: 'Todas', count: adminReviews.length },
                  { key: 'PENDING', label: 'Pendentes de Revisão', count: adminReviews.filter(r => !r.isApproved).length },
                  { key: 'APPROVED', label: 'Aprovadas na Vitrine', count: adminReviews.filter(r => r.isApproved).length },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setReviewFilter(f.key as any);
                      loadAdminReviews(f.key);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      reviewFilter === f.key
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-950/30'
                        : 'bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      reviewFilter === f.key ? 'bg-orange-700 text-white' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tabela de Avaliações */}
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-700">
                {isLoadingReviews ? (
                  <div className="py-12 text-center text-xs text-gray-400 bg-[#111827]">
                    Carregando avaliações...
                  </div>
                ) : adminReviews.length === 0 ? (
                  <div className="py-14 text-center px-6 text-xs text-gray-400 bg-[#111827] flex flex-col items-center gap-3">
                    <span className="text-3xl">⭐</span>
                    <span className="font-bold text-gray-300 text-sm">
                      Nenhuma avaliação encontrada neste filtro
                    </span>
                    <p className="max-w-md text-gray-400 leading-relaxed">
                      Clique em <strong>"Copiar Link para WhatsApp"</strong> acima e envie para seus clientes quando eles receberem as figures em casa para coletar seus primeiros depoimentos autênticos!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800 border-b border-gray-700 text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                          <th className="px-4 py-3 text-left">Data</th>
                          <th className="px-4 py-3 text-left">Cliente</th>
                          <th className="px-4 py-3 text-left">Estrelas</th>
                          <th className="px-4 py-3 text-left">Peça Encomendada</th>
                          <th className="px-4 py-3 text-left max-w-xs">Depoimento</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Ações Rápidas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminReviews.map((r, i) => (
                          <tr
                            key={r.id}
                            style={{
                              background: i % 2 === 0 ? '#111827' : '#161B24',
                              borderBottom: '1px solid #1F2937'
                            }}
                            className="hover:bg-gray-800/40 transition-colors"
                          >
                            {/* Data */}
                            <td className="px-4 py-3 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                              {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                            </td>

                            {/* Cliente */}
                            <td className="px-4 py-3 font-medium text-gray-100 whitespace-nowrap">
                              <div>{r.customerName}</div>
                              {r.customerCity && (
                                <div className="text-[10px] text-gray-500 font-normal">
                                  📍 {r.customerCity}
                                </div>
                              )}
                            </td>

                            {/* Estrelas */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span
                                    key={star}
                                    className={`text-xs ${star <= r.rating ? 'text-orange-400' : 'text-gray-600'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="font-mono text-[11px] text-gray-400 ml-1">
                                  ({r.rating})
                                </span>
                              </div>
                            </td>

                            {/* Peça */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-xs font-semibold text-orange-400 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded-md">
                                {r.productName}
                              </span>
                            </td>

                            {/* Depoimento */}
                            <td className="px-4 py-3 text-xs text-gray-300 italic max-w-xs leading-relaxed">
                              "{r.comment}"
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {r.isApproved ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                                  <span>●</span> Aprovada na Vitrine
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
                                  <span>●</span> Pendente de Revisão
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingReview(r)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-950/50 hover:bg-blue-900/70 text-blue-400 border border-blue-800/40 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Editar nota, nome ou comentário do depoimento"
                                >
                                  <span>✏️</span>
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => handleToggleReviewApproval(r)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    r.isApproved
                                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                                  }`}
                                  title={r.isApproved ? 'Ocultar esta avaliação do site' : 'Aprovar para ser exibida na vitrine'}
                                >
                                  {r.isApproved ? '👁️ Ocultar' : '⭐ Aprovar'}
                                </button>

                                <button
                                  onClick={() => handleDeleteReview(r)}
                                  className="p-1.5 rounded-lg text-xs font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors cursor-pointer"
                                  title="Excluir avaliação definitivamente"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* 🎟️🎟️ CUPONS DE DESCONTO 🎟️🎟️ */}
          {section === 'cupons' && (
            <CouponManagement />
          )}



          {/* ── ORÇAMENTOS STL ── */}
          {section === 'orcamentos' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-700">
                {orcamentos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 bg-[#111827]">
                    Nenhum orçamento STL pendente no banco de dados.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 border-b border-gray-700">
                        {['ID','Cliente','Arquivo STL','Data','Valor Estimado','Status','Ações'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orcamentos.map((s, i) => (
                        <tr key={s.id} style={{ background: i % 2 === 0 ? '#111827' : '#161B24', borderBottom: '1px solid #1F2937' }}>
                          <td className="px-4 py-3 font-mono text-[12px] font-bold text-orange-400">{s.id}</td>
                          <td className="px-4 py-3 font-medium text-gray-100">{s.cliente}</td>
                          <td className="px-4 py-3 font-mono text-[12px] text-gray-300">
                            📁 {s.arquivo}
                          </td>
                          <td className="px-4 py-3 font-mono text-[12px] text-gray-400">{s.data}</td>
                          <td className="px-4 py-3 font-semibold text-sm" style={{ color: s.precoEstimado ? '#22C55E' : '#9CA3AF' }}>
                            {s.precoEstimado ? `R$ ${formatPrice(s.precoEstimado)}` : 'A definir'}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setAnsweringQuote(s)}
                                className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-orange-500/20 cursor-pointer bg-gray-800 border border-orange-500/30 text-orange-400" 
                              >
                                💬 Analisar
                              </button>
                              <button
                                onClick={() => handleDeleteQuote(s)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:bg-red-900/50 cursor-pointer"
                                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#EF4444' }}
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── CORES DISPONÍVEIS ── */}
          {section === 'estoque' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-100 flex items-center gap-2">
                    🎨 Cores de Filamento Disponíveis na Loja
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Defina quais cores de filamento aparecem como opções selecionáveis para os clientes na vitrine e encomendas 3D.
                  </p>
                </div>
              </div>

              {filamentos.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 bg-[#111827] rounded-xl border border-gray-800">
                  Nenhuma cor cadastrada. Clique em "+ Nova Cor" no topo para adicionar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filamentos.map(f => (
                    <div 
                      key={f.id || f.color} 
                      className="p-4 rounded-xl flex items-center justify-between shadow-lg bg-gray-800/80 border border-gray-700/80 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-6 h-6 rounded-full border border-gray-600 shadow-md shrink-0" 
                          style={{ backgroundColor: f.hexCode || '#f97316' }} 
                        />
                        <div>
                          <div className="font-bold text-sm text-gray-100">{f.color}</div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {f.material || 'PLA'} • <span className="text-green-400 font-semibold">Ativo na vitrine</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteFilament(f)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/60 text-xs font-semibold text-red-400 border border-red-800/40 transition-colors cursor-pointer"
                        title="Remover cor da loja"
                      >
                        🗑 Excluir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── AJUSTE DE PREÇOS ── */}
          {section === 'precos' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-100">💰 Tabela de Precificação Base</h3>
                  <p className="text-xs text-gray-400">Altere o preço base de qualquer figure e clique em Salvar para atualizar imediatamente no banco.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {catalog.filter(p => catalogTab === 'tcg' ? p.category === 'TCG' : p.category !== 'TCG').length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 bg-[#111827] rounded-xl border border-gray-800">
                    Nenhuma figure cadastrada para ajuste de preço.
                  </div>
                ) : (
                  catalog.map(p => (
                    <PriceRow key={p.id} product={p} onSave={(newPrice, promoPrice) => handleSavePrice(p, newPrice, promoPrice)} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── CAMPANHAS SAZONAIS & EVENTOS TEMÁTICOS ── */}
          {section === 'campanhas' && (
            <SeasonalCampaignsManager products={catalog} />
          )}

          {/* ── VÍDEOS DA OFICINA & BASTIDORES ── */}
          {section === 'bastidores' && (
            <WorkshopVideosManager />
          )}
        </div>
      </main>

      {/* Modais */}
      {isTcgModalOpen && (
        <NewTcgProductModal 
          onClose={() => setIsTcgModalOpen(false)} 
          onSave={handleSaveTcg} 
          initialData={editingProduct || undefined}
        />
      )}
      {is3DModalOpen && (
        <ProductModal 
          onClose={() => setIs3DModalOpen(false)} 
          onSave={() => {}} 
        />
      )}
      {editingProduct && catalogTab === 'tcg' ? (
        <NewTcgProductModal 
          initialData={editingProduct as any} 
          onClose={() => setEditingProduct(null)} 
          onSave={handleSaveTcg} 
        />
      ) : editingProduct ? (
        <ProductModal 
          initialData={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={() => {}} 
        />
      ) : null}
      {showNewOrderModal && (
        <OrderModal
          onClose={() => setShowNewOrderModal(false)}
          onSave={() => {}}
        />
      )}
      {showNewFilamentModal && (
        <FilamentModal 
          onClose={() => setShowNewFilamentModal(false)} 
          onSave={() => {}} 
        />
      )}
      {answeringQuote && (
        <QuoteModal
          quote={answeringQuote}
          onClose={() => setAnsweringQuote(null)}
          onSave={updatedQ => {
            setOrcamentos(prev => prev.map(x => x.id === updatedQ.id ? updatedQ : x));
          }}
        />
      )}
      {showApiModal && (
        <ApiConfigModal onClose={() => setShowApiModal(false)} />
      )}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSave={updatedReview => {
            setAdminReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
          }}
        />
      )}
    </div>
  );
}

// Linha de Preço
function PriceRow({ product, onSave }: { product: Product; onSave: (val: number, promoVal?: number | null) => void }) {
  const [val, setVal] = useState((product.basePrice ?? 0).toString());
  const [promoVal, setPromoVal] = useState((product.promoPrice ?? '').toString());
  const [isSaved, setIsSaved] = useState(false);

  function handleSave() {
    const num = parseFloat(val);
    const pNum = parseFloat(promoVal);
    const validPromo = (!isNaN(pNum) && pNum > 0) ? pNum : (promoVal === '' ? null : undefined);

    if (!isNaN(num) && num >= 0) {
      onSave(num, validPromo);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl shadow-sm transition-all bg-gray-800/80 border border-gray-700">
      <div className="flex items-center gap-3 min-w-0">
        <img src={product.image || 'https://placehold.co/600x700/1F2937/F97316?text=Figure'} alt={product.name} className="w-11 h-13 object-cover rounded-lg shrink-0 border border-gray-700 bg-black/40" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-100 flex items-center gap-2">
            <span>{product.name}</span>
            {product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.basePrice && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PROMO ATIVA
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-400">{(CATEGORY_LABELS as any)[product.category] || product.category} • {product.scales?.[0] || '1:10'}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-end sm:self-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Normal:</span>
          <span className="text-[11px] font-bold text-gray-400">R$</span>
          <input
            type="number"
            step="0.01"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            className="w-20 h-9 px-2 rounded-lg text-sm font-bold outline-none text-right transition-colors bg-gray-900 border border-gray-700 text-orange-400"
            title="Preço normal de tabela"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase">Promo:</span>
          <span className="text-[11px] font-bold text-gray-400">R$</span>
          <input
            type="number"
            step="0.01"
            placeholder="—"
            value={promoVal}
            onChange={e => setPromoVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            className="w-20 h-9 px-2 rounded-lg text-sm font-bold outline-none text-right transition-colors bg-gray-900 border border-orange-500/40 text-amber-400 placeholder-gray-600"
            title="Preço promocional com desconto (opcional)"
          />
        </div>

        <button
          onClick={handleSave}
          className="h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          style={{
            background: isSaved ? '#22C55E' : '#F97316',
            color: '#fff'
          }}
        >
          {isSaved ? '✅ Salvo' : '💾 Salvar'}
        </button>
      </div>
    </div>
  );
}
