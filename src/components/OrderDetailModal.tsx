import React, { useState } from 'react';
import { OrderKanbanDTO } from './KanbanBoard';
import { toast } from '@/components/Toast';
import { fetchApi } from '@/api/client';

interface OrderDetailModalProps {
  order: OrderKanbanDTO;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [internalNotes, setInternalNotes] = useState(
    order.internalNotes || localStorage.getItem(`forja_notes_${order.id}`) || ''
  );
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Formata o acabamento para exibição amigável
  function formatFinish(finish?: string): string {
    if (!finish) return 'Cru / RAW';
    const upper = finish.toUpperCase();
    if (upper.includes('PAINT') || upper.includes('PINT')) return '🎨 Pintura à Mão';
    if (upper.includes('PRIMER')) return '🖌️ Primer';
    return '⚙️ Cru / RAW';
  }

  // Extrai as observações enviadas pelo cliente
  const customerNotes = order.customerNotes || 
    order.tags?.find(t => t.startsWith('OBS:'))?.replace(/^OBS:/, '').trim();

  // WhatsApp link formatado com mensagem inicial
  const rawPhone = order.customerPhone ? order.customerPhone.replace(/\D/g, '') : '';
  const cleanPhone = rawPhone.length === 10 || rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
  const wppMessage = `Olá ${order.customerName}! Aqui é da equipe ImagineLab 3D sobre sua encomenda ${order.shortCode}.`;
  const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(wppMessage)}`;

  // Salva anotações internas da equipe (backend + fallback localStorage)
  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      localStorage.setItem(`imaginelab_notes_${order.id}`, internalNotes);
      localStorage.setItem(`forja_notes_${order.id}`, internalNotes);
      await fetchApi(`/admin/orders/${order.id}/internal-notes`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes })
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch {
      // Mesmo com erro de rede ou backend off, persistência local garantida
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } finally {
      setSavingNotes(false);
    }
  }

  // Excluir OS
  async function handleDelete() {
    if (!confirm(`Deseja realmente excluir a OS ${order.shortCode}?`)) return;
    try {
      await fetchApi(`/admin/orders/${order.id}`, { method: 'DELETE' });
      toast.show({ title: 'Sucesso', message: `OS ${order.shortCode} excluída.`, type: 'success' });
      window.dispatchEvent(new Event('forja_orders_updated'));
      onClose();
    } catch (e: any) {
      toast.show({ title: 'Erro', message: e.message || 'Falha ao excluir.', type: 'error' });
    }
  }

  // Rejeitar / Cancelar Pedido com justificativa
  async function handleReject() {
    const reason = window.prompt("Motivo da rejeição/cancelamento do pedido:");
    if (reason === null) return;
    setRejecting(true);
    try {
      await fetchApi(`/admin/orders/${order.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason: reason || 'Cancelado pelo operador' })
      });
      toast.show({ 
        title: 'Pedido Rejeitado', 
        message: `OS ${order.shortCode} movida para Cancelados.`, 
        type: 'info' 
      });
      window.dispatchEvent(new Event('forja_orders_updated'));
      onClose();
    } catch (e: any) {
      toast.show({ title: 'Erro', message: e.message || 'Falha ao rejeitar.', type: 'error' });
    } finally {
      setRejecting(false);
    }
  }

  // Aprovar e Enviar para Fila 3D (Sem travas de pesagem/filamento)
  async function handleApprove() {
    setApproving(true);
    try {
      await fetchApi(`/admin/orders/${order.id}/approve`, { method: 'PATCH' });
      toast.show({ 
        title: 'Pedido Aprovado! 🚀', 
        message: `OS ${order.shortCode} enviada diretamente para a Fila 3D!`, 
        type: 'success',
        icon: '⚙️'
      });
      window.dispatchEvent(new Event('forja_orders_updated'));
      onClose();
    } catch (e: any) {
      toast.show({ title: 'Erro', message: e.message || 'Falha ao aprovar pedido.', type: 'error' });
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-100 flex items-center gap-2">
                🔥 Ordem de Serviço <span className="text-orange-400 font-mono">{order.shortCode}</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-gray-400">
                  Total: <strong className="text-gray-200 font-mono">R$ {order.totalAmount.toFixed(2).replace('.', ',')}</strong>
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-800 text-orange-400 border border-gray-700">
                  {order.kanbanColumn}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          
          {/* Cliente Info */}
          <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">👤 Dados do Cliente</span>
              <div className="text-sm text-gray-100 font-bold">{order.customerName}</div>
              {order.customerEmail && <div className="text-xs text-gray-400">📧 {order.customerEmail}</div>}
            </div>

            {order.customerPhone && (
              <a 
                href={whatsAppUrl}
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30 transition-all self-start sm:self-auto"
              >
                <span>📱</span> {order.customerPhone}
              </a>
            )}
          </div>

          {/* Gestão de Produção & Especificações */}
          <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  ⚙️ Especificações da Peça & Impressão
                </h3>
                <p className="text-[11px] text-gray-400">
                  Parâmetros de fabricação ágeis (Aprovação direta sem bloqueio por pesagem)
                </p>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="flex flex-col gap-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-100 text-sm flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-gray-800 text-orange-400 border border-gray-700 text-xs font-mono font-bold">
                          {item.quantity}x
                        </span>
                        {item.itemName}
                      </span>
                    </div>

                    {/* Grid de Especificações */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-800/70 p-2 rounded-lg border border-gray-700/40">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">📐 Escala</div>
                        <div className="font-semibold text-gray-200 truncate">{item.scale || '1:10 (Padrão)'}</div>
                      </div>
                      <div className="bg-gray-800/70 p-2 rounded-lg border border-gray-700/40">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">🎨 Acabamento</div>
                        <div className="font-semibold text-gray-200 truncate">{formatFinish(item.finishType)}</div>
                      </div>
                      <div className="bg-gray-800/70 p-2 rounded-lg border border-gray-700/40">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">🧵 Cor Solicitada</div>
                        <div className="font-semibold text-gray-200 truncate">{item.filamentColor || 'Padrão ImagineLab'}</div>
                      </div>
                      <div className="bg-gray-800/70 p-2 rounded-lg border border-gray-700/40">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">⏱️ Tempo Estimado</div>
                        <div className="font-semibold text-gray-200 truncate">
                          {item.printTimeMinutes && item.printTimeMinutes > 0 
                            ? `${item.printTimeMinutes} min (~${(item.printTimeMinutes / 60).toFixed(1)}h)` 
                            : 'Sob análise'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-dashed border-gray-700 rounded-xl text-center text-xs text-gray-500">
                  Nenhum item alocado para esta OS.
                </div>
              )}
            </div>

            {/* Observações Enviadas pelo Cliente */}
            <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                💬 Observações do Cliente
              </span>
              {customerNotes ? (
                <p className="text-xs text-amber-300/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-800/40 leading-relaxed font-sans">
                  "{customerNotes}"
                </p>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Nenhuma observação informada pelo cliente.
                </p>
              )}
            </div>

            {/* Campo Opcional de Produção */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-700/40">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                  📝 Observações Internas de Impressão / Produção
                </label>
                {notesSaved && (
                  <span className="text-[11px] text-green-400 font-semibold animate-pulse">
                    ✓ Salvo
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Ex: Usar suporte em árvore no braço esquerdo, bico Bambu 0.4mm, infill 15%..."
                  rows={2}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-3 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                  {savingNotes ? '...' : 'Salvar'}
                </button>
              </div>
            </div>

          </div>

          {/* Rodapé com Ações Rápidas (Sem travas de estoque) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button 
                onClick={handleDelete}
                className="px-2.5 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                title="Excluir Ordem de Serviço"
              >
                🗑 Excluir OS
              </button>
              
              <button 
                onClick={handleReject}
                disabled={rejecting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-red-500/50 text-red-400 bg-red-950/20 hover:bg-red-900/40 transition-all flex items-center gap-1.5"
              >
                ✕ Rejeitar Pedido
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {order.customerPhone && (
                <a 
                  href={whatsAppUrl}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-950/30"
                >
                  <span>📱</span> Abrir no WhatsApp
                </a>
              )}
              
              <button 
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold bg-orange-500 hover:bg-orange-600 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {approving ? 'Aprovando...' : 'Aprovar e Enviar para Fila 3D 🚀'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
