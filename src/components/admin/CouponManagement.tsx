import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAdminCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
  type Coupon,
  type CouponRequest
} from '@/services/coupons';
import { NewCouponModal } from './NewCouponModal';
import { toast } from '@/components/Toast';

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadCoupons() {
    setIsLoading(true);
    try {
      const data = await fetchAdminCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
      toast.show({
        title: 'Erro ao carregar',
        message: 'Não foi possível carregar a lista de cupons.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleCreate(data: CouponRequest) {
    const created = await createCoupon(data);
    setCoupons(prev => [created, ...prev.filter(c => c.id !== created.id)]);
    toast.show({
      title: 'Cupom criado com sucesso!',
      message: `Código ${created.code} já está disponível para uso na loja.`,
      type: 'success',
      icon: '🏷️'
    });
  }

  async function handleToggle(id: number) {
    try {
      const updated = await toggleCouponActive(id);
      setCoupons(prev => prev.map(c => c.id === id ? updated : c));
      toast.show({
        title: updated.isActive ? 'Cupom ativado!' : 'Cupom pausado',
        message: `Status do cupom ${updated.code} atualizado com sucesso.`,
        type: updated.isActive ? 'success' : 'info'
      });
    } catch (err) {
      toast.show({
        title: 'Erro ao alterar status',
        message: 'Tente novamente.',
        type: 'error'
      });
    }
  }

  async function handleDelete(id: number, code: string) {
    if (!confirm(`Deseja realmente excluir o cupom "${code}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.show({
        title: 'Cupom excluído',
        message: `O cupom ${code} foi removido com sucesso.`,
        type: 'success'
      });
    } catch (err) {
      toast.show({
        title: 'Erro ao excluir',
        message: 'Não foi possível excluir o cupom.',
        type: 'error'
      });
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.show({
      title: 'Código copiado!',
      message: `${code} copiado para a área de transferência.`,
      type: 'info',
      icon: '📋'
    });
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Métricas Rápidas
  const metrics = useMemo(() => {
    const activeCount = coupons.filter(c => c.isActive).length;
    const totalUses = coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0);
    
    // Estimativa de economia gerada: soma dos descontos fixos * usos + média proporcional
    const estimatedSaved = coupons.reduce((sum, c) => {
      const uses = c.currentUses || 0;
      if (c.discountType === 'FIXED_AMOUNT' || c.discountType === 'FIXED_VALUE') {
        return sum + (c.discountValue * uses);
      } else {
        // Estima ticket médio de R$ 120 para cupons percentuais
        const avgOrder = Math.max(c.minOrderValue || 0, 120);
        return sum + ((avgOrder * c.discountValue / 100) * uses);
      }
    }, 0);

    return {
      activeCount,
      totalUses,
      estimatedSaved
    };
  }, [coupons]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🏷️</span> Gestão de Cupons
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Crie códigos promocionais para campanhas, influenciadores e primeiras compras
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <span>+</span> Novo Cupom
        </button>
      </div>

      {/* 3 Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Cupons Ativos */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-xl shrink-0">
            🏷️
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cupons Ativos</div>
            <div className="text-2xl font-black text-white mt-0.5">{metrics.activeCount}</div>
            <div className="text-[11px] text-gray-500">De {coupons.length} cadastrados no total</div>
          </div>
        </div>

        {/* Card 2: Total de Usos */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
            🛒
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Usos</div>
            <div className="text-2xl font-black text-white mt-0.5">{metrics.totalUses}</div>
            <div className="text-[11px] text-emerald-400/80 font-medium">Pedidos com cupom aplicado</div>
          </div>
        </div>

        {/* Card 3: Economia Gerada */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
            💰
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Economizado</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">
              R$ {metrics.estimatedSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-500">Estimativa acumulada de abatimentos</div>
          </div>
        </div>
      </div>

      {/* Tabela de Cupons */}
      <div className="rounded-2xl overflow-hidden bg-[#111827] border border-gray-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Tipo & Valor</th>
                <th className="py-3.5 px-4">Regras de Ativação</th>
                <th className="py-3.5 px-4">Utilizações</th>
                <th className="py-3.5 px-4">Validade</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin text-xl mb-2">⏳</div>
                    <div>Carregando cupons da oficina...</div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="text-4xl mb-3 opacity-60">🏷️</div>
                    <div className="font-bold text-sm text-gray-400">Nenhum cupom cadastrado</div>
                    <div className="text-xs mt-1">Clique em "+ Novo Cupom" acima para criar sua primeira promoção.</div>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                  const isMaxedOut = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
                  const usagePercent = coupon.maxUses ? Math.min(100, Math.round((coupon.currentUses / coupon.maxUses) * 100)) : 0;

                  return (
                    <tr
                      key={coupon.id}
                      className={`hover:bg-gray-800/40 transition-colors ${!coupon.isActive ? 'opacity-60 bg-gray-950/20' : ''}`}
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-wider text-amber-300 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            title="Copiar código"
                            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedCode === coupon.code ? '✓' : '📋'}
                          </button>
                        </div>
                      </td>

                      {/* Tipo & Valor */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm text-white">
                            {coupon.discountType === 'PERCENTAGE'
                              ? `${coupon.discountValue}% OFF`
                              : `R$ ${coupon.discountValue.toFixed(2).replace('.', ',')} OFF`}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {coupon.discountType === 'PERCENTAGE' ? 'Abatimento percentual' : 'Desconto fixo no pedido'}
                          </span>
                        </div>
                      </td>

                      {/* Regras */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {coupon.minOrderValue && coupon.minOrderValue > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 text-[10px] font-semibold">
                              Mínimo R$ {coupon.minOrderValue.toFixed(2).replace('.', ',')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">Sem valor mínimo</span>
                          )}

                          {coupon.isFirstPurchaseOnly && (
                            <span className="px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-500/40 text-[10px] font-bold">
                              ⭐ 1ª Compra
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usos */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-gray-200">{coupon.currentUses}</span>
                            <span className="text-gray-500">
                              {coupon.maxUses ? `/ ${coupon.maxUses}` : '(ilimitado)'}
                            </span>
                          </div>
                          {coupon.maxUses ? (
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isMaxedOut ? 'bg-red-500' : usagePercent > 75 ? 'bg-amber-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Validade */}
                      <td className="py-3.5 px-4">
                        {coupon.expiresAt ? (
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-medium ${isExpired ? 'text-red-400 line-through' : 'text-gray-300'}`}>
                              {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                            </span>
                            {isExpired && (
                              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">
                                Expirado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Sem expiração</span>
                        )}
                      </td>

                      {/* Status (Toggle Switch) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(coupon.id)}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                            coupon.isActive ? 'bg-emerald-500' : 'bg-gray-700'
                          }`}
                          title={coupon.isActive ? 'Clique para pausar' : 'Clique para ativar'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              coupon.isActive ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          disabled={deletingId === coupon.id}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-950/40 border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Excluir cupom"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação */}
      {isModalOpen && (
        <NewCouponModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
