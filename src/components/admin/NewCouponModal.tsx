import React, { useState } from 'react';
import type { CouponRequest, DiscountType } from '@/services/coupons';

interface Props {
  onClose: () => void;
  onSave: (data: CouponRequest) => Promise<void>;
}

export function NewCouponModal({ onClose, onSave }: Props) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [isUnlimitedUses, setIsUnlimitedUses] = useState(true);
  const [maxUses, setMaxUses] = useState('');
  const [isFirstPurchaseOnly, setIsFirstPurchaseOnly] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Por favor, informe o código do cupom.');
      return;
    }

    const val = parseFloat(discountValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setError('Informe um valor de desconto válido e positivo.');
      return;
    }

    if (discountType === 'PERCENTAGE' && val > 100) {
      setError('O desconto em porcentagem não pode ultrapassar 100%.');
      return;
    }

    const minOrder = minOrderValue ? parseFloat(minOrderValue.replace(',', '.')) : 0;
    const uses = isUnlimitedUses ? null : (parseInt(maxUses, 10) || null);

    setIsSubmitting(true);
    try {
      await onSave({
        code: cleanCode,
        discountType,
        discountValue: val,
        minOrderValue: isNaN(minOrder) ? 0 : minOrder,
        maxUses: uses,
        isFirstPurchaseOnly,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive: true
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar cupom. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl bg-[#111827] border border-gray-700 text-gray-100"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#111827]/95 backdrop-blur-md border-b border-gray-700">
            <div>
              <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
                <span>🏷️</span> Novo Cupom Promocional
              </h2>
              <p className="text-xs text-gray-400">Configure as regras de abatimento e restrições</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Código do Cupom */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Código do Cupom *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: IMAGINE10 ou BEMVINDO"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                className="w-full h-11 px-4 rounded-xl text-base font-mono font-bold tracking-widest uppercase bg-gray-900 border border-gray-700 text-purple-300 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">O código é formatado automaticamente em maiúsculas sem espaços.</span>
            </div>

            {/* Tipo de Desconto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Tipo de Desconto *
                </label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as DiscountType)}
                  className="w-full h-10 px-3 rounded-xl text-sm font-semibold bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="PERCENTAGE">Porcentagem (%)</option>
                  <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
                </select>
              </div>

              {/* Valor do Desconto */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Valor do Desconto *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">
                    {discountType === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={discountType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 15.00'}
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-sm font-bold bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Valor Mínimo do Pedido */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Valor Mínimo do Pedido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00 (Sem valor mínimo)"
                value={minOrderValue}
                onChange={e => setMinOrderValue(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Limite de Usos */}
            <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Limite Máximo de Usos
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-orange-400 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={isUnlimitedUses}
                    onChange={e => setIsUnlimitedUses(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Ilimitado</span>
                </label>
              </div>

              {!isUnlimitedUses && (
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 50 utilizações"
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
                />
              )}
            </div>

            {/* Apenas 1ª Compra */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200">Exclusivo para 1ª compra</span>
                <span className="text-[11px] text-gray-500">Válido apenas para clientes sem pedidos anteriores</span>
              </div>
              <input
                type="checkbox"
                checked={isFirstPurchaseOnly}
                onChange={e => setIsFirstPurchaseOnly(e.target.checked)}
                className="accent-orange-500 w-5 h-5 rounded cursor-pointer"
              />
            </div>

            {/* Data de Validade */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Data de Validade (Opcional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full h-10 px-3 rounded-xl text-sm bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-orange-500"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">Deixe em branco para cupom por tempo indeterminado.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 bg-[#111827]/95 backdrop-blur-md border-t border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 shadow-lg shadow-orange-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>{isSubmitting ? 'Salvando...' : 'Salvar e Ativar Cupom 🏷️'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
