import React, { useState } from 'react';
import type { CartItem } from '../data/products';
import { fetchApi } from '../api/client';
import { validateCoupon } from '../services/coupons';
import { toast } from './Toast';

interface Props {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
}

export function CartDrawer({ open, cart, onClose, onRemove, onClear }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const total = Math.max(0, subtotal - couponDiscount);

  async function handleApplyCoupon() {
    if (!coupon.trim()) return;
    setCouponError(null);
    
    // Validação preventiva de anti-stacking
    const nonStackableItem = cart.find(i => i.origin === 'HERO_SHOWCASE' && i.allowCouponStacking === false);
    if (nonStackableItem) {
      const msg = `O item ${nonStackableItem.product.name} já possui desconto promocional de bancada e não acumula com cupom.`;
      setCouponError(msg);
      toast.error(msg);
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await validateCoupon(coupon, subtotal, email, phone);
      if (res.valid) {
        setAppliedCoupon(res.code);
        setCouponDiscount(res.discountAmount);
        toast.success(`Cupom ${res.code} aplicado! Economia de R$ ${res.discountAmount.toFixed(2).replace('.', ',')}`);
      } else {
        setCouponError(res.message);
        toast.error(res.message);
      }
    } catch (e: any) {
      setCouponError('Não foi possível validar o cupom.');
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCoupon('');
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponError(null);
  }

  async function handleCheckout() {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      alert('Por favor, preencha nome, e-mail e WhatsApp.');
      return;
    }

    setIsLoading(true);

    try {
      const items = cart.map(item => ({
        pokemonModelId: item.product.category !== 'TCG' ? Number(item.product.id) || 1 : null,
        tcgProductId: item.product.category === 'TCG' ? Number(item.product.id) || null : null,
        quantity: item.qty,
        finishType: item.finish === 'Pintado à Mão' || item.finish === 'Pintado' ? 'PAINTED' : 'RAW',
        customScale: item.scale,
        origin: item.origin || 'CATALOG',
        promoPrice: item.promoPrice,
        promoBadge: item.promoBadge,
      }));

      const observations = cart.map(i => i.observations ? `${i.product.name}: ${i.observations}` : null).filter(Boolean).join(' | ');

      const activeCoupon = (appliedCoupon || coupon).trim().toUpperCase();
      const payload = {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        couponCode: activeCoupon ? activeCoupon : null,
        observations: observations || '',
        shippingAddressLine: 'A combinar',
        shippingCity: 'A combinar',
        shippingState: 'A combinar',
        shippingZipCode: '00000000',
        items
      };

      const resp: any = await fetchApi('/orders/lead-capture', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (resp && resp.shortCode) {
        toast.success(`Pedido ${resp.shortCode} registrado com sucesso! Redirecionando...`);
        
        let text = `🔮 *Pedido ${resp.shortCode} - ImagineLab 3D* 🔮\n\n`;
        text += `👤 *Cliente:* ${resp.customerName}\n`;
        text += `📱 *Contato:* ${phone}\n`;
        
        if (resp.discountAmount > 0) {
          text += `🏷️ *Cupom:* ${appliedCoupon} (-R$ ${resp.discountAmount.toFixed(2).replace('.', ',')})\n`;
        }
        
        text += `\n📦 *Itens:*\n`;
        cart.forEach((item) => {
          let promoTag = '';
          if (item.origin === 'HERO_SHOWCASE') {
            promoTag = ' [Destaque Aplicado]';
          } else if (item.origin === 'SEASONAL_CAMPAIGN' || item.campaignTag) {
            promoTag = ` [${item.campaignTag || item.promoBadge || 'Edição Especial'}]`;
          }
          const priceStr = item.unitPrice ? ` - R$ ${item.unitPrice.toFixed(2).replace('.', ',')}` : '';
          text += `• ${item.qty}x ${item.product.name} (${item.scale}, ${item.finish})${priceStr}${promoTag}\n`;
        });
        
        text += `\n💰 *Total Estimado:* R$ ${resp.totalAmount.toFixed(2).replace('.', ',')}\n`;
        
        const envWpp = import.meta.env.VITE_WHATSAPP_NUMBER || (import.meta.env as any).NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999';
        const wppNumber = String(envWpp).replace(/\D/g, '') || '5511999999999';
        const encoded = encodeURIComponent(text);
        
        window.open(`https://wa.me/${wppNumber}?text=${encoded}`, '_blank');
        onClear();
        onClose();
      } else {
        throw new Error('Falha ao registrar pedido');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao registrar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />}
      <aside
        className={`fixed top-0 right-0 h-full z-[90] flex flex-col bg-[#111827] border-l border-gray-800 shadow-2xl transition-transform duration-300 w-full max-w-full sm:max-w-[420px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-extrabold text-lg text-white">🛒 Carrinho</h2>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4 opacity-50">🛒</div>
              <div className="text-sm font-medium">Sua sacola está vazia.</div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-800 border border-gray-700 relative group">
                    <img src={item.product.image} alt={item.product.name} className="w-20 h-24 object-cover rounded-lg shrink-0 bg-gray-900" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-white leading-tight pr-6">{item.product.name}</div>
                        <button onClick={() => onRemove(i)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-400 line-clamp-1">{item.scale} • {item.finish}</div>
                      
                      {item.origin === 'HERO_SHOWCASE' && item.promoPrice && item.product.basePrice > item.promoPrice && (
                        <div className="mt-1">
                          <span className="inline-block text-[10px] font-black text-[#38BDF8] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                            🏷️ [Destaque Aplicado] (-R$ {(item.product.basePrice - item.promoPrice).toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-end justify-between mt-auto">
                        <div className="text-xs text-gray-400">Qtd: {item.qty}</div>
                        <div className="font-extrabold text-sm text-[#38BDF8]">
                          R$ {(item.unitPrice * item.qty).toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informações do Cliente */}
              <div className="mt-4 flex flex-col gap-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <h3 className="font-semibold text-sm text-gray-300">Seus Dados</h3>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp com DDD"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Cupom */}
              <div className="flex flex-col gap-2 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <h3 className="font-semibold text-sm text-gray-300">Possui um cupom de desconto?</h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-500/20 border border-green-500/50 p-3 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-green-400 text-sm font-bold">🏷️ {appliedCoupon} aplicado</span>
                      {couponDiscount > 0 && (
                        <span className="text-xs text-green-300 font-semibold">Economia de R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                      )}
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-green-400 hover:text-green-200 text-xs font-bold underline cursor-pointer">Remover</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Código do Cupom"
                        value={coupon}
                        onChange={e => {
                          setCoupon(e.target.value);
                          if (couponError) setCouponError(null);
                        }}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white uppercase placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <button 
                        onClick={handleApplyCoupon} 
                        disabled={isValidatingCoupon}
                        className="px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer"
                      >
                        {isValidatingCoupon ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <span className="text-xs text-red-400 font-medium pl-1">
                        ⚠️ {couponError}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-gray-800 bg-[#111827] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-400">Subtotal</span>
              <span className="text-gray-300">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {appliedCoupon && couponDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-400 text-sm font-bold">
                <span>Desconto Cupom ({appliedCoupon})</span>
                <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-200">Total Estimado</span>
              <span className="text-xl font-extrabold text-white">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-extrabold text-sm text-white bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-gray-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Registrando pedido...' : 'Finalizar pelo WhatsApp'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
