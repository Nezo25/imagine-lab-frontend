import React from 'react';
import type { OrderKanbanDTO } from './KanbanBoard';
import { formatPrice } from '@/services/storage';

interface Props {
  order: OrderKanbanDTO | null;
  onClose: () => void;
  onStatusChange: (id: number, newStatus: any) => void;
}

export function OrderDetailModal({ order, onClose, onStatusChange }: Props) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl glass-panel border border-[#222D42] shadow-2xl p-6 flex flex-col gap-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222D42]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="text-base font-bold">Pedido {order.shortCode}</h3>
              <p className="text-xs text-slate-400">ID #{order.id} • ImagineLab Pinhalzinho-SP</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#121828] border border-[#222D42] flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-bold text-white">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WhatsApp:</span>
              <a
                href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-cyan-300 hover:underline"
              >
                {order.customerPhone || 'Não informado'}
              </a>
            </div>
            {order.customerEmail && (
              <div className="flex justify-between">
                <span className="text-slate-400">E-mail:</span>
                <span className="text-slate-300">{order.customerEmail}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-[#1C2638]">
              <span className="text-slate-400">Valor Total:</span>
              <span className="font-black text-cyan-300 text-sm">
                R$ {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Status da Fila de Produção
            </label>
            <select
              value={order.kanbanColumn}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#121828] border border-[#222D42] text-xs font-semibold text-white outline-none focus:border-cyan-400"
            >
              <option value="NEW_LEAD">📥 Novos Leads</option>
              <option value="NEGOTIATING_APPROVED">💬 Negociação / Aprovado</option>
              <option value="SLICING_QUEUE">⚙️ Fila 3D (Aguardando Fatiamento)</option>
              <option value="PRINTING">🖨️ Em Impressão</option>
              <option value="POST_PROCESSING">🎨 Pós-processamento / Pintura</option>
              <option value="READY_SHIPPED">🚀 Enviado / Pronto para Retirada</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <a
            href={`https://wa.me/55${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá ${order.customerName}! Aqui é da ImagineLab sobre o seu pedido ${order.shortCode}.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 h-10 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
          >
            <span>💬 Abrir WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-xl text-xs font-bold bg-[#141A28] border border-[#222D42] text-slate-300 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
