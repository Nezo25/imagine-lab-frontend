import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { KanbanBoard } from '@/components/KanbanBoard';
import { toast } from '@/components/Toast';
import {
  getStoredProducts,
  saveProduct,
  deleteProduct,
  toggleProductActive,
  updateProductPrice,
  getStoredFilaments,
  saveFilament,
  updateFilamentStock,
  deleteFilament,
  getStoredOrders,
  updateOrderStatus,
  deleteOrder,
  getStoredQuotes,
  updateQuote,
  deleteQuote,
  fileToBase64,
  calculateMonthlySales,
  formatPrice,
  parsePrice,
  type Order,
  type Quote,
  type Filament,
} from '@/services/storage';
import { ALL_CATEGORIES, ALL_MATERIALS, ALL_SCALES, type Product } from '@/data/products';

type AdminTab = 'kanban' | 'catalogo' | 'orcamentos' | 'pedidos' | 'estoque' | 'configuracao';

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'kanban', label: 'Kanban de Produção', icon: '📋' },
  { id: 'orcamentos', label: 'Orçamentos STL (3D)', icon: '📐' },
  { id: 'catalogo', label: 'Gestão do Catálogo', icon: '📦' },
  { id: 'pedidos', label: 'Pedidos & Métricas', icon: '🛒' },
  { id: 'estoque', label: 'Estoque de Filamentos', icon: '🧵' },
  { id: 'configuracao', label: 'Conexão VPS / API', icon: '⚙️' },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('kanban');
  const navigate = useNavigate();

  // State collections
  const [products, setProducts] = useState<Product[]>(getStoredProducts());
  const [quotes, setQuotes] = useState<Quote[]>(getStoredQuotes());
  const [orders, setOrders] = useState<Order[]>(getStoredOrders());
  const [filaments, setFilaments] = useState<Filament[]>(getStoredFilaments());

  // Editing Product Modal / Form
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // New Filament Form
  const [newFilament, setNewFilament] = useState({ color: '', material: 'PLA Premium', stockGrams: 1000, minStockGrams: 300, hexCode: '#5E488C' });

  // VPS API Config
  const [vpsApiUrl, setVpsApiUrl] = useState(
    localStorage.getItem('imaginelab_api_url') || import.meta.env.VITE_API_URL || 'https://forja-backend-1.onrender.com/api/v1'
  );
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Monthly Sales Chart Data
  const salesChartData = useMemo(() => calculateMonthlySales(orders), [orders]);

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getStoredProducts());
      setQuotes(getStoredQuotes());
      setOrders(getStoredOrders());
      setFilaments(getStoredFilaments());
    };
    window.addEventListener('imaginelab_products_updated', handleUpdate);
    window.addEventListener('imaginelab_quotes_updated', handleUpdate);
    window.addEventListener('imaginelab_orders_updated', handleUpdate);
    window.addEventListener('imaginelab_filaments_updated', handleUpdate);
    return () => {
      window.removeEventListener('imaginelab_products_updated', handleUpdate);
      window.removeEventListener('imaginelab_quotes_updated', handleUpdate);
      window.removeEventListener('imaginelab_orders_updated', handleUpdate);
      window.removeEventListener('imaginelab_filaments_updated', handleUpdate);
    };
  }, []);

  function handleLogout() {
    sessionStorage.removeItem('__adm_token');
    toast.info('Sessão encerrada com segurança.');
    navigate('/admin/login');
  }

  // Product Actions
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.basePrice) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    await saveProduct(editingProduct, isNewProduct ? undefined : editingProduct.id);
    toast.success(isNewProduct ? 'Produto criado no catálogo!' : 'Produto atualizado com sucesso!');
    setEditingProduct(null);
    setProducts(getStoredProducts());
  }

  async function handleDeleteProduct(id: string) {
    if (confirm('Tem certeza que deseja excluir este item do catálogo?')) {
      await deleteProduct(id);
      toast.info('Produto removido.');
      setProducts(getStoredProducts());
    }
  }

  // Filament Actions
  async function handleAddFilament(e: React.FormEvent) {
    e.preventDefault();
    if (!newFilament.color) return;
    await saveFilament(newFilament);
    toast.success('Carretel adicionado ao estoque!');
    setNewFilament({ color: '', material: 'PLA Premium', stockGrams: 1000, minStockGrams: 300, hexCode: '#5E488C' });
    setFilaments(getStoredFilaments());
  }

  // Test Connection to VPS Backend
  async function testBackendConnection() {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const clean = vpsApiUrl.replace(/\/+$/, '');
      const res = await fetch(`${clean}/models`);
      if (res.ok) {
        setConnectionStatus('🟢 Conexão com o backend estabelecida com sucesso!');
      } else {
        setConnectionStatus(`⚠️ Servidor respondeu com HTTP ${res.status}`);
      }
    } catch (err: any) {
      setConnectionStatus(`🔴 Falha ao conectar: ${err.message}. Verifique a URL da VPS.`);
    } finally {
      setTestingConnection(false);
    }
  }

  function handleSaveVpsConfig() {
    localStorage.setItem('imaginelab_api_url', vpsApiUrl.trim());
    toast.success('Configuração da URL salva com sucesso!');
  }

  return (
    <div className="min-h-screen bg-[#090D15] flex flex-col text-slate-100 selection:bg-purple-900/50 selection:text-cyan-300">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-[#0E131F] border-b border-[#1E2638] flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-500/40 bg-[#111726] p-0.5 flex items-center justify-center">
            <img src="/images/logo.png" alt="ImagineLab" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-heading font-black text-sm text-white flex items-center gap-1.5">
              ImagineLab 3D <span className="text-cyan-400 font-normal text-xs">• Painel Operacional</span>
            </div>
            <div className="text-[10px] text-slate-400">Pinhalzinho-SP • Multi-Instance Ready</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#141C2E] border border-[#222D42] text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <span>🌐 Ver Loja Pública</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="h-8 px-3 rounded-lg text-xs font-bold bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/50"
          >
            Sair 🚪
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto p-4 md:p-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-11 px-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#5E488C] text-white shadow-lg glow-purple'
                  : 'bg-[#101524] text-slate-400 hover:bg-[#161D30] hover:text-white border border-[#1E2638]'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Tab Content Body */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: KANBAN DE PRODUÇÃO */}
          {activeTab === 'kanban' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-xl text-white">Kanban de Produção</h2>
                  <p className="text-xs text-slate-400">
                    Acompanhe cada etapa dos pedidos: fatiamento, impressão 3D, pós-processamento e despacho.
                  </p>
                </div>
              </div>
              <KanbanBoard />
            </div>
          )}

          {/* TAB 2: ORÇAMENTOS STL */}
          {activeTab === 'orcamentos' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-xl text-white">Fila de Orçamentos 3D (STL / OBJ)</h2>
                  <p className="text-xs text-slate-400">
                    Modelos enviados pelos clientes via simulador com análise geométrica de volume e peso.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl glass-panel border border-[#222D42] overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121828] text-slate-400 text-[11px] uppercase font-bold border-b border-[#222D42]">
                    <tr>
                      <th className="p-3.5">Código / Data</th>
                      <th className="p-3.5">Cliente & Contato</th>
                      <th className="p-3.5">Arquivo 3D</th>
                      <th className="p-3.5">Material & Cor</th>
                      <th className="p-3.5">Peso / Vol.</th>
                      <th className="p-3.5">Valor Estimado</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-[#151C2C]/50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-cyan-300">{q.id}</div>
                          <div className="text-[10px] text-slate-400">{q.data}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{q.cliente}</div>
                          <div className="text-[10px] text-slate-400">{q.contato || 'Sem contato'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono text-slate-200 line-clamp-1">📄 {q.arquivo}</div>
                          {q.detalhes && <div className="text-[10px] text-slate-400 mt-0.5">{q.detalhes}</div>}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-white">{q.material || 'PLA'}</div>
                          <div className="text-[10px] text-purple-300">{q.cor || 'Roxo ImagineLab'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-200">~{q.pesoGramas || 80}g</div>
                          <div className="text-[10px] text-slate-400">{q.volumeCm3 || 65} cm³</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-black text-cyan-300 text-sm">
                            R$ {formatPrice(q.precoEstimado || 0)}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={q.status}
                            onChange={(e) => {
                              updateQuote(q.id, { status: e.target.value });
                              setQuotes(getStoredQuotes());
                            }}
                            className="h-7 px-2 rounded-lg bg-[#0E131F] border border-[#222D42] text-[11px] text-white outline-none"
                          >
                            <option value="Aguardando análise">Aguardando análise</option>
                            <option value="Orçamento enviado">Orçamento enviado</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Em impressão">Em impressão</option>
                            <option value="Recusado">Recusado</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {q.contato && (
                              <a
                                href={`https://wa.me/55${q.contato.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Olá ${q.cliente}! Aqui é da ImagineLab sobre o orçamento do seu modelo 3D (${q.arquivo}).`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                                title="Falar no WhatsApp"
                              >
                                💬
                              </a>
                            )}
                            <button
                              onClick={() => {
                                deleteQuote(q.id);
                                setQuotes(getStoredQuotes());
                              }}
                              className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900"
                              title="Excluir"
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
            </div>
          )}

          {/* TAB 3: CATÁLOGO */}
          {activeTab === 'catalogo' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-xl text-white">Catálogo de Produtos</h2>
                  <p className="text-xs text-slate-400">
                    Gerencie produtos, adicione fotos em alta definição e ajuste preços instantaneamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewProduct(true);
                    setEditingProduct({
                      name: '',
                      category: 'Decoração & Geek',
                      tags: ['Novo', '3D'],
                      scales: ['Padrão (12 a 15 cm)'],
                      materials: ['PLA Premium'],
                      basePrice: 89.0,
                      finishOptions: [
                        { label: 'Peça Crua (Padrão)', extra: 0 },
                        { label: 'Com Primer Cinza', extra: 25 },
                      ],
                      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                      printTimeH: 8,
                      filamentG: 140,
                      active: true,
                    });
                  }}
                  className="h-10 px-4 rounded-xl text-xs font-bold bg-[#5E488C] hover:bg-[#4D3974] text-white flex items-center gap-1.5 shadow-md glow-purple"
                >
                  <span>+ Adicionar Produto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl glass-card border border-[#222D42] flex gap-4 items-start relative group"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-20 h-24 object-cover rounded-xl bg-slate-900 border border-[#222D42] shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-cyan-400">{p.category}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-red-400'}`}
                            title={p.active ? 'Ativo na loja' : 'Inativo'}
                          />
                        </div>
                        <h4 className="font-bold text-sm text-white line-clamp-1 mt-0.5">{p.name}</h4>
                        <div className="text-xs font-black text-cyan-300 mt-1">
                          R$ {formatPrice(p.basePrice)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#1C2638] mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewProduct(false);
                            setEditingProduct(p);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#141C2E] border border-[#2A3752] text-slate-300 hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleProductActive(p.id);
                            setProducts(getStoredProducts());
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            p.active ? 'bg-amber-950/60 text-amber-300' : 'bg-emerald-950/60 text-emerald-300'
                          }`}
                        >
                          {p.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-950/60 text-red-400 hover:bg-red-900 ml-auto"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PEDIDOS & MÉTRICAS */}
          {activeTab === 'pedidos' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-xl text-white">Pedidos & Finanças</h2>
                  <p className="text-xs text-slate-400">
                    Histórico consolidado e gráfico dinâmico de faturamento dos últimos 6 meses.
                  </p>
                </div>
              </div>

              {/* Sales Chart Card */}
              <div className="p-5 rounded-2xl glass-card border border-[#222D42] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">📈 Faturamento Mensal (R$)</h3>
                  <span className="text-xs text-cyan-300 font-mono">Total Calculado em Tempo Real</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2638" />
                      <XAxis dataKey="mes" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0E131F', borderColor: '#222D42', borderRadius: '12px' }}
                        itemStyle={{ color: '#4CA8B8' }}
                      />
                      <Bar dataKey="vendas" fill="#5E488C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl glass-panel border border-[#222D42] overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121828] text-slate-400 text-[11px] uppercase font-bold border-b border-[#222D42]">
                    <tr>
                      <th className="p-3.5">ID / Data</th>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">Itens</th>
                      <th className="p-3.5">Entrega</th>
                      <th className="p-3.5">Valor Total</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#151C2C]/50 transition-colors">
                        <td className="p-3.5 font-mono text-cyan-300 font-bold">{o.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{o.cliente}</div>
                          <div className="text-[10px] text-slate-400">{o.telefone}</div>
                        </td>
                        <td className="p-3.5 max-w-xs truncate">{o.produto}</td>
                        <td className="p-3.5">{o.tipoEntrega || 'Pinhalzinho'}</td>
                        <td className="p-3.5 font-black text-white">R$ {o.valor}</td>
                        <td className="p-3.5">
                          <select
                            value={o.status}
                            onChange={async (e) => {
                              await updateOrderStatus(o.id, e.target.value);
                              setOrders(getStoredOrders());
                            }}
                            className="h-7 px-2 rounded-lg bg-[#0E131F] border border-[#222D42] text-[11px] text-white outline-none"
                          >
                            <option value="Aguardando pgto">Aguardando pgto</option>
                            <option value="Em impressão">Em impressão</option>
                            <option value="Acabamento">Acabamento</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Entregue">Entregue</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={async () => {
                              if (confirm('Excluir este pedido?')) {
                                await deleteOrder(o.id);
                                setOrders(getStoredOrders());
                              }
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ESTOQUE DE FILAMENTOS */}
          {activeTab === 'estoque' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-black text-xl text-white">Estoque de Filamentos & Resina</h2>
                  <p className="text-xs text-slate-400">
                    Controle de carretéis, gramatura restante e alerta de reposição.
                  </p>
                </div>
              </div>

              {/* Form Novo Carretel */}
              <form onSubmit={handleAddFilament} className="p-4 rounded-2xl glass-card border border-[#222D42] flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Cor / Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roxo Neon"
                    value={newFilament.color}
                    onChange={(e) => setNewFilament({ ...newFilament, color: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none"
                  />
                </div>

                <div className="w-40">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Material</label>
                  <select
                    value={newFilament.material}
                    onChange={(e) => setNewFilament({ ...newFilament, material: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none"
                  >
                    {ALL_MATERIALS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="w-32">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Gramas (g)</label>
                  <input
                    type="number"
                    value={newFilament.stockGrams}
                    onChange={(e) => setNewFilament({ ...newFilament, stockGrams: parseInt(e.target.value, 10) || 0 })}
                    className="w-full h-9 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-[#5E488C] text-white hover:bg-[#4D3974]"
                >
                  + Adicionar Carretel
                </button>
              </form>

              {/* Grid Filamentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filaments.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl glass-card border border-[#222D42] flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: f.hexCode || '#5E488C' }} />
                        <span className="font-bold text-sm text-white">{f.color}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-semibold">
                        {f.material}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-[#1C2638]">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
                        <div className="text-xl font-mono font-black text-white">{f.stockGrams}g</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            updateFilamentStock(f.id, Math.max(0, f.stockGrams - 100));
                            setFilaments(getStoredFilaments());
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                        >
                          -100
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateFilamentStock(f.id, f.stockGrams + 500);
                            setFilaments(getStoredFilaments());
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                        >
                          +500
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteFilament(f.id);
                            setFilaments(getStoredFilaments());
                          }}
                          className="w-7 h-7 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900 text-xs font-bold ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONFIGURAÇÃO VPS / MULTI-INSTANCE */}
          {activeTab === 'configuracao' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div>
                <h2 className="font-heading font-black text-xl text-white">Configuração da Instância VPS</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Reaproveitamento integral das rotas do backend ("Chico"). Quando você subir a nova instância na sua VPS, basta informar a URL aqui para conectar imediatamente sem precisar rebuildar o front-end!
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-[#222D42] flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    URL da API do Backend (Ex: https://api.imaginelab3d.com.br/api/v1 ou IP da VPS)
                  </label>
                  <input
                    type="text"
                    value={vpsApiUrl}
                    onChange={(e) => setVpsApiUrl(e.target.value)}
                    placeholder="http://seu-ip-da-vps:8080/api/v1"
                    className="w-full h-11 px-4 rounded-xl text-xs font-mono bg-[#0E131F] border border-[#222D42] text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {connectionStatus && (
                  <div className="p-3 rounded-xl bg-[#0E1422] border border-[#222D42] text-xs font-semibold">
                    {connectionStatus}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={testBackendConnection}
                    className="h-10 px-4 rounded-xl text-xs font-bold bg-[#141C2E] border border-cyan-500/40 text-cyan-300 hover:border-cyan-400"
                  >
                    {testingConnection ? 'Testando...' : '🔍 Testar Conexão'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveVpsConfig}
                    className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#5E488C] hover:bg-[#4D3974] text-white shadow-md glow-purple"
                  >
                    Salvar Configuração 💾
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Editar/Criar Produto */}
      {editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <form
            onSubmit={handleSaveProduct}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-[#222D42] p-6 flex flex-col gap-4 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222D42]">
              <h3 className="font-bold text-base">
                {isNewProduct ? 'Criar Novo Produto' : 'Editar Produto'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-[#0E131F] border border-[#222D42] text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Categoria</label>
                  <select
                    value={editingProduct.category || ALL_CATEGORIES[0]}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg bg-[#0E131F] border border-[#222D42] text-white outline-none"
                  >
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Preço Base (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.basePrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-lg bg-[#0E131F] border border-[#222D42] text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">URL da Imagem ou Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 h-9 px-3 rounded-lg bg-[#0E131F] border border-[#222D42] text-white outline-none"
                  />
                  <label className="h-9 px-3 rounded-lg bg-[#141C2E] border border-[#222D42] text-cyan-300 font-bold flex items-center justify-center cursor-pointer hover:border-cyan-400">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await fileToBase64(file);
                          setEditingProduct({ ...editingProduct, image: base64 });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#0E131F] border border-[#222D42] text-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#222D42] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="h-10 px-4 rounded-xl text-xs font-bold bg-[#141C2E] border border-[#222D42] text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#5E488C] text-white hover:bg-[#4D3974]"
              >
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
