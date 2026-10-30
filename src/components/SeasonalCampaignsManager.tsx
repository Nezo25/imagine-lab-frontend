import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/data/products';
import { fetchRemoteProducts, getStoredProducts } from '@/services/storage';
import {
  THEME_PRESET_CONFIGS,
  createSeasonalCampaign,
  deleteSeasonalCampaign,
  fetchAdminCampaigns,
  toggleSeasonalCampaign,
  updateSeasonalCampaign,
  type CampaignProductItem,
  type SeasonalCampaign,
  type ThemePreset
} from '@/services/campaigns';
import { toast } from '@/components/Toast';

const EMPTY_FORM: SeasonalCampaign = {
  name: '',
  slug: '',
  tagLabel: '🎃 ESPECIAL HALLOWEEN',
  themePreset: 'HALLOWEEN',
  accentColor: '#F97316',
  secondaryColor: '#7C3AED',
  bannerTitle: 'Especial Temporada na ImagineLab',
  bannerSubtitle: 'Colecionáveis exclusivos e edições limitadas impressas especialmente para a temporada.',
  isActive: true,
  products: []
};

interface SeasonalCampaignsManagerProps {
  products?: Product[];
}

export function SeasonalCampaignsManager({ products }: SeasonalCampaignsManagerProps = {}) {
  const [campaigns, setCampaigns] = useState<SeasonalCampaign[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(() => products || getStoredProducts());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SeasonalCampaign>(EMPTY_FORM);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchAdminCampaigns(), fetchRemoteProducts().catch(() => getStoredProducts())])
      .then(([loadedCampaigns, loadedProducts]) => {
        if (!mounted) return;
        setCampaigns(loadedCampaigns);
        setCatalog(loadedProducts);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCatalog = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return catalog.filter(p => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.id).toLowerCase().includes(q)
      );
    });
  }, [catalog, productSearch]);

  function handleOpenNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, products: [] });
    setShowForm(true);
  }

  function handleOpenEdit(campaign: SeasonalCampaign) {
    setEditingId(campaign.id ?? null);
    setForm({
      ...campaign,
      products: (campaign.products || []).map(p => ({ ...p }))
    });
    setShowForm(true);
  }

  function handleSelectPreset(presetId: ThemePreset) {
    const preset = THEME_PRESET_CONFIGS[presetId];
    setForm(prev => ({
      ...prev,
      themePreset: presetId,
      tagLabel: preset.defaultTag,
      accentColor: preset.accentColor,
      secondaryColor: preset.secondaryColor
    }));
  }

  function toNumericProductId(rawId: string): number {
    const cleaned = String(rawId).replace(/\D/g, '');
    return cleaned ? Number(cleaned) : 1;
  }

  function handleAddProductToCampaign(product: Product) {
    const numericId = toNumericProductId(product.id);
    setForm(prev => {
      if (prev.products.some(item => item.productId === numericId)) {
        return prev;
      }
      const nextItem: CampaignProductItem = {
        productId: numericId,
        productName: product.name,
        productImage: product.image,
        productCategory: product.category,
        originalPrice: product.basePrice,
        eventPrice: product.basePrice,
        customBadge: `${THEME_PRESET_CONFIGS[prev.themePreset].emoji} Edição Especial`,
        displayOrder: prev.products.length
      };
      return {
        ...prev,
        products: [...prev.products, nextItem]
      };
    });
  }

  function handleRemoveCampaignProduct(productId: number) {
    setForm(prev => ({
      ...prev,
      products: prev.products
        .filter(item => item.productId !== productId)
        .map((item, idx) => ({ ...item, displayOrder: idx }))
    }));
  }

  function handleUpdateCampaignProduct(
    productId: number,
    field: 'eventPrice' | 'customBadge',
    value: string
  ) {
    setForm(prev => ({
      ...prev,
      products: prev.products.map(item => {
        if (item.productId !== productId) return item;
        if (field === 'eventPrice') {
          const num = value === '' ? null : Number(value);
          return { ...item, eventPrice: num };
        }
        return { ...item, customBadge: value };
      })
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.tagLabel.trim() || !form.bannerTitle.trim()) {
      toast.show({
        title: 'Campos obrigatórios',
        message: 'Preencha o Nome do Evento, Tag da Aba e Título do Banner.',
        type: 'error',
        icon: '⚠️'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateSeasonalCampaign(editingId, form);
        toast.show({
          title: 'Campanha atualizada!',
          message: `"${form.name}" foi salva com sucesso.`,
          type: 'success',
          icon: '🎃'
        });
      } else {
        await createSeasonalCampaign(form);
        toast.show({
          title: 'Nova campanha criada!',
          message: `"${form.name}" já está pronta para a vitrine.`,
          type: 'success',
          icon: '🎉'
        });
      }
      const refreshed = await fetchAdminCampaigns();
      setCampaigns(refreshed);
      setShowForm(false);
    } catch (err: any) {
      toast.show({
        title: 'Erro ao salvar campanha',
        message: err?.message || 'Verifique os dados informados.',
        type: 'error',
        icon: '⚠️'
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(campaign: SeasonalCampaign) {
    if (!campaign.id) return;
    const toggled = await toggleSeasonalCampaign(campaign.id);
    const refreshed = await fetchAdminCampaigns();
    setCampaigns(refreshed);
    toast.show({
      title: toggled.isActive ? 'Campanha ativada na vitrine!' : 'Campanha pausada',
      message: toggled.isActive
        ? `A aba "${toggled.tagLabel}" já está visível para os clientes.`
        : `A campanha "${toggled.name}" foi ocultada da vitrine.`,
      type: 'success',
      icon: toggled.isActive ? '🔥' : '⏸️'
    });
  }

  async function handleDelete(campaign: SeasonalCampaign) {
    if (!campaign.id) return;
    if (!confirm(`Remover a campanha "${campaign.name}"?`)) return;
    await deleteSeasonalCampaign(campaign.id);
    setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    toast.show({
      title: 'Campanha excluída',
      message: `"${campaign.name}" foi removida.`,
      type: 'info',
      icon: '🗑️'
    });
  }

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-950/60 text-[#F97316] border border-orange-800/40 mb-2">
            🎃 Eventos Sazonais & Datas Comemorativas
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Campanhas & Eventos Especiais
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ative eventos temporários (Halloween, Natal, Pokémon Day, Anime Fest) com estilização dinâmica e seleção curada de peças.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="h-10 px-5 rounded-xl text-xs font-extrabold bg-[#F97316] hover:bg-orange-600 text-white shadow-lg shadow-orange-950/50 transition-all cursor-pointer shrink-0"
        >
          + Nova Campanha
        </button>
      </div>

      {/* Formulário de Criação / Edição */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-[#0F172A] border border-orange-500/40 shadow-2xl flex flex-col gap-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-white">
                {editingId ? '✏️ Editar Campanha Sazonal' : '✨ Configurar Nova Campanha Sazonal'}
              </h3>
              <p className="text-xs text-slate-400">
                Escolha um preset temático rápido ou personalize as cores, textos e peças participantes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 cursor-pointer"
            >
              ✕ Fechar
            </button>
          </div>

          {/* 1. Seletor de Presets Temáticos Rápidos */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1. Preset Temático Rápido
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(THEME_PRESET_CONFIGS) as ThemePreset[]).map(presetKey => {
                const p = THEME_PRESET_CONFIGS[presetKey];
                const isSelected = form.themePreset === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => handleSelectPreset(presetKey)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#090D16] border-[#F97316] text-white shadow-md'
                        : 'bg-[#090D16]/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: p.accentColor }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: p.secondaryColor }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Identidade da Campanha e Cores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Nome Interno do Evento
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Halloween dos Fantasmas 2026"
                className="w-full h-10 px-3.5 rounded-xl text-sm bg-[#090D16] border border-slate-800 focus:border-[#F97316] text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tag da Aba na Vitrine (com Emoji)
              </label>
              <input
                type="text"
                required
                value={form.tagLabel}
                onChange={e => setForm(prev => ({ ...prev, tagLabel: e.target.value }))}
                placeholder="Ex: 🎃 Especial Halloween"
                className="w-full h-10 px-3.5 rounded-xl text-sm bg-[#090D16] border border-slate-800 focus:border-[#F97316] text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Título Principal do Banner
              </label>
              <input
                type="text"
                required
                value={form.bannerTitle}
                onChange={e => setForm(prev => ({ ...prev, bannerTitle: e.target.value }))}
                placeholder="Ex: Colecionáveis de Destaque na ImagineLab"
                className="w-full h-10 px-3.5 rounded-xl text-sm bg-[#090D16] border border-slate-800 focus:border-[#7C3AED] text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Cor Destaque (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={e => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-[#090D16] border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={e => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl text-xs font-mono bg-[#090D16] border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Cor Atmosfera (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg bg-[#090D16] border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.secondaryColor}
                    onChange={e => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl text-xs font-mono bg-[#090D16] border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Frase / Subtítulo do Banner
              </label>
              <input
                type="text"
                value={form.bannerSubtitle}
                onChange={e => setForm(prev => ({ ...prev, bannerSubtitle: e.target.value }))}
                placeholder="Ex: Edições sombrias pintadas à mão com preço especial por tempo limitado."
                className="w-full h-10 px-3.5 rounded-xl text-sm bg-[#090D16] border border-slate-800 focus:border-[#F97316] text-white outline-none"
              />
            </div>
          </div>

          {/* 3. Seletor de Peças Participantes */}
          <div className="p-4 rounded-2xl bg-[#090D16] border border-slate-800 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  3. Peças Participantes da Campanha ({form.products.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Adicione figures do catálogo e configure o Preço Promocional do Evento (opcional) e a Badge exclusiva.
                </p>
              </div>
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="🔍 Buscar peça no catálogo..."
                className="h-9 px-3 rounded-xl text-xs bg-[#0F172A] border border-slate-700 text-white outline-none w-full sm:w-64"
              />
            </div>

            {/* Lista rápida para adicionar peças */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {filteredCatalog.slice(0, 12).map(prod => {
                const numId = toNumericProductId(prod.id);
                const alreadyAdded = form.products.some(item => item.productId === numId);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleAddProductToCampaign(prod)}
                    className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                      alreadyAdded
                        ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-400 cursor-default'
                        : 'bg-[#0F172A] border-slate-800 hover:border-[#F97316] text-slate-200 cursor-pointer'
                    }`}
                  >
                    <span>{alreadyAdded ? '✓' : '+'}</span>
                    <span>{prod.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">R${prod.basePrice}</span>
                  </button>
                );
              })}
            </div>

            {/* Tabela de Peças Selecionadas */}
            {form.products.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase">
                      <th className="px-3 py-2.5 text-left">Peça</th>
                      <th className="px-3 py-2.5 text-left">Preço Base</th>
                      <th className="px-3 py-2.5 text-left">Preço no Evento (R$)</th>
                      <th className="px-3 py-2.5 text-left">Badge Customizada da Peça</th>
                      <th className="px-3 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.products.map(item => (
                      <tr key={item.productId} className="border-b border-slate-800/70 bg-[#090D16]">
                        <td className="px-3 py-2.5 font-bold text-white">
                          {item.productName || `Peça #${item.productId}`}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-400">
                          R$ {Number(item.originalPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.eventPrice ?? ''}
                            onChange={e =>
                              handleUpdateCampaignProduct(item.productId, 'eventPrice', e.target.value)
                            }
                            placeholder="Ex: 55.00"
                            className="w-28 h-8 px-2.5 rounded-lg bg-[#0F172A] border border-slate-700 text-orange-400 font-bold outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={item.customBadge ?? ''}
                            onChange={e =>
                              handleUpdateCampaignProduct(item.productId, 'customBadge', e.target.value)
                            }
                            placeholder="Ex: 👻 Peça Assombrada"
                            className="w-full min-w-[180px] h-8 px-2.5 rounded-lg bg-[#0F172A] border border-slate-700 text-white outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveCampaignProduct(item.productId)}
                            className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/50 cursor-pointer"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Switch Principal: Ativar na Loja Agora + Salvar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="accent-[#F97316] w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-extrabold text-white">
                Ativar na Loja Agora
              </span>
              <span className="text-xs text-slate-400">
                (Injeta a aba temática na vitrine e pausa outras campanhas ativas)
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-10 px-6 rounded-xl text-xs font-extrabold bg-[#F97316] hover:bg-orange-600 text-white shadow-lg cursor-pointer disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : '💾 Salvar Campanha'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Listagem de Campanhas Criadas */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-xs text-slate-400">
          Carregando campanhas sazonais...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center flex flex-col items-center gap-3">
          <div className="text-4xl">🎃</div>
          <div className="text-sm font-bold text-white">Nenhuma campanha sazonal cadastrada</div>
          <p className="text-xs text-slate-400 max-w-md">
            Crie eventos como Halloween, Natal ou Pokémon Day para destacar figures temáticas com preço especial e visual próprio na vitrine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map(c => (
            <div
              key={c.id || c.slug}
              className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={
                c.isActive
                  ? { borderColor: c.accentColor, boxShadow: `0 0 22px -6px ${c.secondaryColor}55` }
                  : undefined
              }
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border"
                  style={{
                    backgroundColor: `${c.secondaryColor}25`,
                    borderColor: `${c.accentColor}66`
                  }}
                >
                  {THEME_PRESET_CONFIGS[c.themePreset]?.emoji || '🎃'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-white">{c.name}</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                      style={{
                        backgroundColor: `${c.secondaryColor}30`,
                        borderColor: c.accentColor,
                        color: '#FFF'
                      }}
                    >
                      {c.tagLabel}
                    </span>
                    {c.isActive && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                        ● Ativa na Vitrine
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {c.bannerTitle} • <strong>{c.products?.length || 0}</strong> peças vinculadas
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggle(c)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    c.isActive
                      ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-[#F97316]'
                  }`}
                >
                  {c.isActive ? '⏸ Pausar Evento' : '▶ Ativar na Vitrine'}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(c)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 cursor-pointer"
                >
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 cursor-pointer"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SeasonalCampaignsManager;
