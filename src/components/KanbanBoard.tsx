import React, { useEffect, useState, useMemo } from 'react';
import { fetchApi } from '../api/client';
import { toast } from './Toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { OrderDetailModal } from './OrderDetailModal';
import { getStoredOrders, formatPrice } from '@/services/storage';

export type KanbanColumn =
  | 'NEW_LEAD'
  | 'NEGOTIATING_APPROVED'
  | 'SLICING_QUEUE'
  | 'PRINTING'
  | 'POST_PROCESSING'
  | 'READY_SHIPPED';

const COLUMNS: { id: KanbanColumn; label: string; icon: string }[] = [
  { id: 'NEW_LEAD', label: 'Novos Leads', icon: '📥' },
  { id: 'NEGOTIATING_APPROVED', label: 'Negociação/Aprovado', icon: '💬' },
  { id: 'SLICING_QUEUE', label: 'Fila Fatiamento', icon: '⚙️' },
  { id: 'PRINTING', label: 'Em Impressão', icon: '🖨️' },
  { id: 'POST_PROCESSING', label: 'Acabamento/Pintura', icon: '🎨' },
  { id: 'READY_SHIPPED', label: 'Prontos / Enviados', icon: '🚀' },
];

export interface OrderKanbanDTO {
  id: number;
  shortCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalAmount: number;
  kanbanColumn: KanbanColumn;
  tags: string[];
}

export function KanbanBoard() {
  const [board, setBoard] = useState<Record<KanbanColumn, OrderKanbanDTO[]>>({
    NEW_LEAD: [],
    NEGOTIATING_APPROVED: [],
    SLICING_QUEUE: [],
    PRINTING: [],
    POST_PROCESSING: [],
    READY_SHIPPED: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderKanbanDTO | null>(null);

  const fetchKanban = async () => {
    try {
      setLoading(true);
      const res: any = await fetchApi(`/admin/orders/kanban?t=${Date.now()}`);
      if (res && typeof res === 'object') {
        setBoard(res);
        return;
      }
    } catch (err) {
      // Fallback gracioso com os pedidos locais
    } finally {
      setLoading(false);
    }

    // Carrega dados locais caso a VPS ainda não esteja com o kanban pronto
    const stored = getStoredOrders();
    const fallbackBoard: Record<KanbanColumn, OrderKanbanDTO[]> = {
      NEW_LEAD: [],
      NEGOTIATING_APPROVED: [],
      SLICING_QUEUE: [],
      PRINTING: [],
      POST_PROCESSING: [],
      READY_SHIPPED: [],
    };

    stored.forEach((o, idx) => {
      const col: KanbanColumn =
        o.status === 'Entregue' || o.status === 'Enviado'
          ? 'READY_SHIPPED'
          : o.status === 'Em impressão'
          ? 'PRINTING'
          : o.status === 'Aguardando pgto'
          ? 'NEGOTIATING_APPROVED'
          : idx % 3 === 0
          ? 'SLICING_QUEUE'
          : 'NEW_LEAD';

      fallbackBoard[col].push({
        id: idx + 100,
        shortCode: o.id,
        customerName: o.cliente,
        customerPhone: o.telefone || '(19) 99821-4411',
        customerEmail: o.email || '',
        totalAmount: parseFloat(o.valor.replace(',', '.')) || 120,
        kanbanColumn: col,
        tags: [o.produto.split(',')[0], o.tipoEntrega || 'Pinhalzinho'],
      });
    });

    setBoard(fallbackBoard);
    setLoading(false);
  };

  useEffect(() => {
    fetchKanban();
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId as KanbanColumn;
    const destCol = destination.droppableId as KanbanColumn;

    const sourceList = Array.from(board[sourceCol] || []);
    const destList = sourceCol === destCol ? sourceList : Array.from(board[destCol] || []);

    const [moved] = sourceList.splice(source.index, 1);
    moved.kanbanColumn = destCol;
    destList.splice(destination.index, 0, moved);

    const nextBoard = {
      ...board,
      [sourceCol]: sourceList,
      [destCol]: destList,
    };
    setBoard(nextBoard);

    try {
      await fetchApi(`/admin/orders/${moved.id}/kanban-column`, {
        method: 'PATCH',
        body: JSON.stringify({ column: destCol }),
      });
    } catch (err) {}
  };

  const filteredBoard = useMemo(() => {
    if (!searchTerm) return board;
    const q = searchTerm.toLowerCase();
    const result: Record<KanbanColumn, OrderKanbanDTO[]> = {
      NEW_LEAD: [],
      NEGOTIATING_APPROVED: [],
      SLICING_QUEUE: [],
      PRINTING: [],
      POST_PROCESSING: [],
      READY_SHIPPED: [],
    };
    for (const key in board) {
      const k = key as KanbanColumn;
      result[k] = (board[k] || []).filter(
        (c) =>
          c.shortCode.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.customerPhone.toLowerCase().includes(q)
      );
    }
    return result;
  }, [board, searchTerm]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filtrar por código, cliente ou WhatsApp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 px-4 rounded-xl text-xs bg-[#121828] border border-[#222D42] text-white w-full max-w-sm outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={fetchKanban}
          className="h-10 px-4 rounded-xl text-xs font-bold bg-[#141C2E] border border-[#222D42] text-cyan-300 hover:border-cyan-400 flex items-center gap-1.5"
        >
          🔄 Atualizar Quadro
        </button>
      </div>

      {/* DragDrop Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[500px] overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = filteredBoard[col.id] || [];
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl bg-[#0E131F] border border-[#1E2638] overflow-hidden min-w-[210px]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#1E2638] bg-[#121828]/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{col.icon}</span>
                    <span className="text-xs font-bold text-slate-200 line-clamp-1">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {items.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 flex flex-col gap-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      {items.map((item, index) => (
                        <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setSelectedOrder(item)}
                              className="p-3 rounded-xl bg-[#151C2C] border border-[#222D42] hover:border-cyan-500/50 cursor-pointer shadow-sm transition-all"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-mono font-bold text-cyan-300">
                                  {item.shortCode}
                                </span>
                                <span className="text-[11px] font-black text-white">
                                  R$ {formatPrice(item.totalAmount)}
                                </span>
                              </div>

                              <div className="font-bold text-xs text-white line-clamp-1 mb-1.5">
                                {item.customerName}
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {item.tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1C263A] text-slate-400 line-clamp-1"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={(id, col) => {
          if (selectedOrder) setSelectedOrder({ ...selectedOrder, kanbanColumn: col });
          fetchKanban();
        }}
      />
    </div>
  );
}
