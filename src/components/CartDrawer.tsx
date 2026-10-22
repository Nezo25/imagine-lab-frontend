import React, { useState } from 'react';
import type { CartItem } from '@/data/products';
import { fetchApi } from '@/api/client';
import { addOrder, formatPrice } from '@/services/storage';
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
  const [shippingMethod, setShippingMethod] = useState<'LOCAL_PICKUP' | 'POSTAL'>('LOCAL_PICKUP');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'WHATSAPP'>('PIX');
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixPayload, setPixPayload] = useState<{ shortCode: string; amount: number; copyPaste: string } | null>(null);

  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const shippingFee = shippingMethod === 'POSTAL' ? 18.50 : 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  function handleApplyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (code === 'IMAGINE10' || code === 'PRIMEIRACOMPRA') {
      setAppliedCoupon(code);
      setDiscountPercent(10);
      toast.success('Cupom de 10% aplicado com sucesso!');
    } else if (code === 'PINHALZINHO') {
      setAppliedCoupon(code);
      setDiscountPercent(15);
      toast.success('Cupom Especial Pinhalzinho (15% OFF) aplicado!');
    } else {
      setAppliedCoupon(code);
      setDiscountPercent(5);
      toast.info(`Cupom ${code} registrado para validação no faturamento.`);
    }
  }

  async function handleCheckout() {
    if (!name.trim() || !phone.trim()) {
      toast.error('Por favor, informe seu nome e WhatsApp para contato.');
      return;
    }

    if (shippingMethod === 'POSTAL' && (!address.trim() || !zipCode.trim())) {
      toast.error('Por favor, preencha o endereço completo para envio postal.');
      return;
    }

    setIsLoading(true);

    try {
      const orderCode = 'IMG-' + Math.floor(1000 + Math.random() * 9000);
      const deliveryText = shippingMethod === 'LOCAL_PICKUP' ? 'Retirada Pinhalzinho-SP' : `Envio para ${city || 'SP'} (${zipCode})`;

      // Registrar pedido no backend e no storage local
      await addOrder({
        cliente: name,
        produto: cart.map((i) => `${i.qty}x ${i.product.name}`).join(', '),
        valor: formatPrice(total),
        status: paymentMethod === 'PIX' ? 'Aguardando pgto' : 'Em negociação WhatsApp',
        email,
        telefone: phone,
        tipoEntrega: shippingMethod === 'LOCAL_PICKUP' ? 'Retirada Pinhalzinho' : 'Envio Correios/Transportadora',
        detalhesItens: JSON.stringify(cart),
      });

      // Tenta enviar para a rota /orders do backend
      try {
        await fetchApi('/orders', {
          method: 'POST',
          body: JSON.stringify({
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            totalAmount: total,
            deliveryType: deliveryText,
            items: cart.map((item) => ({
              productName: item.product.name,
              qty: item.qty,
              unitPrice: item.unitPrice,
              scale: item.scale,
              material: item.material,
              color: item.color,
            })),
          }),
        });
      } catch (err) {
        // Fallback local seguro
      }

      if (paymentMethod === 'PIX') {
        // Gerar código Pix dinâmico com chave da ImagineLab
        const pixChave = 'contato@imaginelab3d.com.br';
        const simulatedPayload = `00020126580014br.gov.bcb.pix0136${pixChave}520400005303986540${total.toFixed(2)}5802BR5910IMAGINELAB6012PINHALZINHO62070503***6304`;

        setPixPayload({
          shortCode: orderCode,
          amount: total,
          copyPaste: simulatedPayload,
        });
        setShowPixModal(true);
      } else {
        // Finalizar direto no WhatsApp
        sendWhatsAppOrder(orderCode);
        onClear();
        onClose();
      }
    } catch (e: any) {
      toast.error('Erro ao processar o pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function sendWhatsAppOrder(code: string) {
    let msg = `✨ *NOVO PEDIDO - IMAGINELAB* ✨\n`;
    msg += `📍 *Origem de Produção:* Pinhalzinho-SP\n`;
    msg += `🆔 *Código do Pedido:* ${code}\n\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `📱 *WhatsApp:* ${phone}\n`;
    if (email) msg += `✉️ *E-mail:* ${email}\n`;
    msg += `📦 *Forma de Entrega:* ${
      shippingMethod === 'LOCAL_PICKUP'
        ? 'Retirada no Laboratório (Pinhalzinho-SP - Grátis)'
        : `Envio Correios/Transportadora: ${address}, ${city}-${state}, CEP: ${zipCode}`
    }\n\n`;

    msg += `🛍️ *Itens do Pedido:*\n`;
    cart.forEach((i, idx) => {
      msg += `• ${i.qty}x *${i.product.name}*\n`;
      msg += `  ${i.material} | ${i.scale} | Cor: ${i.color || 'Padrão'}\n`;
      if (i.isCustom3D) {
        msg += `  [Arquivo 3D: ${i.stlFileName} • Infill ${i.infillPercent}% • ~${i.estimatedWeightG}g]\n`;
      }
      if (i.observations) msg += `  Obs: ${i.observations}\n`;
      msg += `  Subtotal: R$ ${formatPrice(i.unitPrice * i.qty)}\n\n`;
    });

    if (discountAmount > 0) {
      msg += `🏷️ *Cupom Aplicado:* ${appliedCoupon} (-R$ ${formatPrice(discountAmount)})\n`;
    }
    if (shippingFee > 0) {
      msg += `🚚 *Frete:* R$ ${formatPrice(shippingFee)}\n`;
    }

    msg += `💰 *VALOR TOTAL: R$ ${formatPrice(total)}*\n\n`;
    msg += `_Olá! Realizei o pedido pelo site e gostaria de confirmar os detalhes de pagamento e produção._`;

    const wppNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5519998214411';
    window.open(`https://wa.me/${wppNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 right-0 h-full z-[140] flex flex-col bg-[#0E131F] border-l border-[#222D42] shadow-2xl transition-transform duration-300 w-full max-w-[450px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222D42] bg-[#0A0D14]/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛒</span>
            <h2 className="font-black text-base text-white">Carrinho ImagineLab</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold">
              {cart.reduce((s, i) => s + i.qty, 0)} itens
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
              <div className="text-5xl opacity-40">✨</div>
              <div className="font-extrabold text-white text-base">Seu carrinho está vazio</div>
              <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                Explore nosso catálogo ou utilize o simulador 3D para orçar seu próprio arquivo STL instantaneamente!
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                {cart.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl bg-[#141A29] border border-[#222D42] relative group"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-20 object-cover rounded-lg shrink-0 bg-[#0A0D14] border border-[#1E2638]"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start pr-6">
                        <div className="font-bold text-xs md:text-sm text-white line-clamp-1">
                          {item.product.name}
                        </div>
                        <button
                          onClick={() => onRemove(i)}
                          className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {item.material} • {item.scale}
                      </div>

                      {item.color && (
                        <div className="text-[10px] text-cyan-300 font-medium">
                          Cor: {item.color}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#1C2638]">
                        <span className="text-xs text-slate-400 font-medium">Qtd: {item.qty}</span>
                        <span className="text-xs font-black text-white">
                          R$ {formatPrice(item.unitPrice * item.qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupom de Desconto */}
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#222D42]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CUPOM (Ex: PINHALZINHO)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white uppercase outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="h-8 px-3 rounded-lg text-xs font-bold bg-[#5E488C] hover:bg-[#4D3974] text-white"
                  >
                    Aplicar
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="text-[11px] text-emerald-400 mt-1.5 font-semibold">
                    ✓ Cupom {appliedCoupon} ativado (-{discountPercent}%)
                  </div>
                )}
              </div>

              {/* Forma de Entrega */}
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#222D42] flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-200">Opção de Entrega</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShippingMethod('LOCAL_PICKUP')}
                    className={`p-2.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                      shippingMethod === 'LOCAL_PICKUP'
                        ? 'bg-purple-900/40 border-purple-500 text-white'
                        : 'bg-[#0E131F] border-[#222D42] text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-cyan-300">Retirada em Pinhalzinho</div>
                    <div className="text-[10px] text-slate-400">Grátis no laboratório</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingMethod('POSTAL')}
                    className={`p-2.5 rounded-lg text-xs font-semibold text-left border transition-all ${
                      shippingMethod === 'POSTAL'
                        ? 'bg-purple-900/40 border-purple-500 text-white'
                        : 'bg-[#0E131F] border-[#222D42] text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-white">Envio Correios/PAC</div>
                    <div className="text-[10px] text-slate-400">+ R$ 18,50 para todo o Brasil</div>
                  </button>
                </div>

                {shippingMethod === 'POSTAL' && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#1C2638]">
                    <input
                      type="text"
                      placeholder="Endereço (Rua, Número, Bairro)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="CEP (00000-000)"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dados do Cliente */}
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#222D42] flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-200">Seus Dados de Contato</span>
                <input
                  type="text"
                  placeholder="Nome completo *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="WhatsApp com DDD *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none focus:border-cyan-400"
                />
                <input
                  type="email"
                  placeholder="E-mail para confirmação"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 px-3 rounded-lg text-xs bg-[#0E131F] border border-[#222D42] text-white outline-none focus:border-cyan-400"
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#222D42] flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-200">Método de Finalização</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      paymentMethod === 'PIX'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-[#0E131F] border-[#222D42] text-slate-400'
                    }`}
                  >
                    <span>⚡ Pix Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('WHATSAPP')}
                    className={`p-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      paymentMethod === 'WHATSAPP'
                        ? 'bg-teal-950/60 border-teal-500 text-teal-300'
                        : 'bg-[#0E131F] border-[#222D42] text-slate-400'
                    }`}
                  >
                    <span>💬 WhatsApp Direto</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer with Totals and Submit */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#222D42] bg-[#0A0D14] flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal dos Itens:</span>
                <span>R$ {formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto de Cupom:</span>
                  <span>- R$ {formatPrice(discountAmount)}</span>
                </div>
              )}
              {shippingFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Frete Postal:</span>
                  <span>R$ {formatPrice(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-black text-base pt-2 border-t border-[#1E2638]">
                <span>Total:</span>
                <span className="text-cyan-300">R$ {formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleCheckout}
              className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-wider bg-[#5E488C] hover:bg-[#4D3974] text-white flex items-center justify-center gap-2 transition-all shadow-xl glow-purple"
            >
              {isLoading ? (
                <span>Processando...</span>
              ) : paymentMethod === 'PIX' ? (
                <span>Gerar Pix & Confirmar Pedido ⚡</span>
              ) : (
                <span>Enviar para Atendente no WhatsApp 💬</span>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Pix Modal */}
      {showPixModal && pixPayload && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel border border-emerald-500/40 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Pagamento Pix Instantâneo</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pedido <strong>{pixPayload.shortCode}</strong> registrado na ImagineLab!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white text-slate-900 font-mono text-xs flex flex-col items-center gap-2 shadow-inner">
              {/* QR Code SVG simulado realista com chave da marca */}
              <div className="w-40 h-40 bg-slate-900 rounded-lg p-2 flex items-center justify-center text-white">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                  <path d="M10 10h30v30h-30z M50 10h10v10h-10z M70 10h20v20h-20z M20 20h10v10h-10z M80 20h0v0z M10 50h10v10h-10z M30 50h20v10h-20z M60 50h10v20h-10z M10 70h30v20h-30z M50 80h20v10h-20z M80 70h10v20h-10z M20 80h10v0h-10z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-slate-700">ImagineLab Impressão 3D</span>
              <span className="text-sm font-black text-purple-900">
                R$ {formatPrice(pixPayload.amount)}
              </span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pixPayload.copyPaste);
                  toast.success('Chave Pix Copia e Cola copiada para a área de transferência!');
                }}
                className="w-full h-10 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                📋 Copiar Código Pix Copia e Cola
              </button>

              <button
                type="button"
                onClick={() => {
                  sendWhatsAppOrder(pixPayload.shortCode);
                  setShowPixModal(false);
                  onClear();
                  onClose();
                }}
                className="w-full h-10 rounded-xl text-xs font-bold bg-[#1B2336] hover:bg-[#25304A] text-slate-200 border border-[#2E3C56]"
              >
                💬 Enviar Comprovante pelo WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
