import React, { useEffect, useState, useMemo } from 'react';
import { fetchApi } from '../api/client';
import { toast } from './Toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useSearchParams } from 'react-router-dom';
import { OrderDetailModal } from './OrderDetailModal';

type KanbanColumn = 'NEW_LEAD' | 'NEGOTIATING_APPROVED' | 'SLICING_QUEUE' | 'PRINTING' | 'POST_PROCESSING' | 'READY_SHIPPED';

const COLUMNS: { id: KanbanColumn, label: string, icon: string }[] = [
  { id: 'NEW_LEAD', label: 'Novos Leads', icon: '📥' },
  { id: 'NEGOTIATING_APPROVED', label: 'Negociação/Aprovado', icon: '💬' },
  { id: 'SLICING_QUEUE', label: 'Fila 3D', icon: '⚙️' },
  { id: 'PRINTING', label: 'Imprimindo', icon: '🖨️' },
  { id: 'POST_PROCESSING', label: 'Pintura', icon: '🎨' },
  { id: 'READY_SHIPPED', label: 'Enviados', icon: '🚀' },
];

export interface OrderKanbanItemDTO {
  itemName: string;
  quantity: number;
  finishType: string;
  filamentColor?: string;
  scale?: string;
  printTimeMinutes?: number;
}

export interface OrderKanbanDTO {
  id: number;
  shortCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalAmount: number;
  kanbanColumn: KanbanColumn;
  tags: string[];
  items?: OrderKanbanItemDTO[];
  customerNotes?: string;
  internalNotes?: string;
}

export function KanbanBoard() {
  const [board, setBoard] = useState<Record<KanbanColumn, OrderKanbanDTO[]>>({} as any);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('email') || searchParams.get('os') || searchParams.get('phone') || '');
  const [selectedOrder, setSelectedOrder] = useState<OrderKanbanDTO | null>(null);

    const fetchKanban = async () => {
    try {
      setLoading(true);
      const res: any = await fetchApi(`/admin/orders/kanban?t=${Date.now()}`);
      setBoard(res);
    } catch (err) {
      toast.error('Erro ao carregar Kanban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanban();
    const handleUpdate = () => {
      fetchKanban();
    };
    window.addEventListener('forja_orders_updated', handleUpdate);
    return () => window.removeEventListener('forja_orders_updated', handleUpdate);
  }, []);

  const filteredBoard = useMemo(() => {
    if (!searchTerm) return board;
    const lower = searchTerm.toLowerCase();
    const result: Record<KanbanColumn, OrderKanbanDTO[]> = {} as any;
    for (const key in board) {
      const k = key as KanbanColumn;
      result[k] = board[k].filter(c => 
        (c.shortCode && c.shortCode.toLowerCase().includes(lower)) || 
        (c.customerName && c.customerName.toLowerCase().includes(lower)) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(lower)) ||
        (c.customerPhone && c.customerPhone.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [board, searchTerm]);

  const totalFilteredCards = useMemo(() => Object.values(filteredBoard).flat(), [filteredBoard]);
  const hasSingleResult = totalFilteredCards.length === 1;
  const singleResultCard = hasSingleResult ? totalFilteredCards[0] : null;

  useEffect(() => {
    const osParam = searchParams.get('os');
    if (osParam && Object.keys(board).length > 0) {
      for (const col of Object.values(board)) {
        const card = col.find(c => c.shortCode === osParam);
        if (card) {
          setSelectedOrder(card);
          break;
        }
      }
    }
  }, [board, searchParams]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceColId = result.source.droppableId as KanbanColumn;
    const destColId = result.destination.droppableId as KanbanColumn;
    
    if (sourceColId === destColId && result.source.index === result.destination.index) {
      return;
    }

    const sourceCol = [...board[sourceColId]];
    const destCol = sourceColId === destColId ? sourceCol : [...board[destColId]];
    const [moved] = sourceCol.splice(result.source.index, 1);
    
    moved.kanbanColumn = destColId;
    destCol.splice(result.destination.index, 0, moved);

    setBoard({
      ...board,
      [sourceColId]: sourceCol,
      [destColId]: destCol
    });

    if (sourceColId !== destColId) {
      try {
        await fetchApi(`/admin/orders/${moved.id}/kanban-column?column=${destColId}`, {
          method: 'PATCH'
        });
        toast.success(`Pedido ${moved.shortCode} movido`);
      } catch (err) {
        toast.error('Erro ao mover pedido');
        fetchKanban();
      }
    }
  };

  if (loading) {
    return <div className="text-gray-400 p-8 text-center text-sm">Carregando Kanban...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="mb-4 flex items-center gap-3">
        <input 
          type="text" 
          placeholder="Buscar por e-mail, OS ou cliente..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value) {
              setSearchParams({ email: e.target.value });
            } else {
              setSearchParams({});
            }
          }}
          className="w-full md:w-1/3 h-10 px-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 outline-none focus:border-orange-500 transition-colors shadow-inner"
        />
        {hasSingleResult && singleResultCard && (
          <button 
            onClick={() => { setSearchParams({ os: singleResultCard.shortCode }); setSelectedOrder(singleResultCard); }}
            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            Abrir OS Direto 🚀
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(col => (
              <div key={col.id} className="w-72 flex flex-col bg-gray-800/60 rounded-xl border border-gray-700/50 flex-shrink-0">
                
                <div className="p-3 border-b border-gray-700/50 bg-gray-800/80 rounded-t-xl flex items-center gap-2">
                  <span className="text-lg">{col.icon}</span>
                  <h3 className="font-bold text-sm text-gray-200">{col.label}</h3>
                  <span className="ml-auto bg-gray-900 text-xs text-gray-400 font-bold px-2 py-0.5 rounded-full border border-gray-700">
                    {filteredBoard[col.id]?.length || 0}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className="flex-1 p-2 flex flex-col gap-2 min-h-[150px]"
                    >
                      {filteredBoard[col.id]?.map((card, idx) => (
                        <Draggable key={card.id.toString()} draggableId={card.id.toString()} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => { setSearchParams({ os: card.shortCode }); setSelectedOrder(card); }}
                              className={`bg-gray-900 p-3 rounded-lg border cursor-pointer transition-shadow ${
                                snapshot.isDragging ? 'border-orange-500 shadow-lg shadow-orange-500/20 scale-105' : 'border-gray-700 hover:border-gray-500 hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/30 px-1.5 py-0.5 rounded">
                                  {card.shortCode}
                                </span>
                                <span className="text-[10px] text-gray-500">Há 10 min</span>
                              </div>
                              
                              <div className="flex flex-col gap-0.5">
                                <span className="text-gray-300 text-sm font-medium">{card.customerName}</span>
                                {card.customerPhone && (
                                  <a 
                                    href={`https://wa.me/${card.customerPhone.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-green-400 hover:underline flex items-center gap-1"
                                  >
                                    📱 {card.customerPhone}
                                  </a>
                                )}
                                {card.customerEmail && (
                                  <span className="text-[11px] text-gray-500">📧 {card.customerEmail}</span>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {card.tags?.map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                                    {t}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="mt-3 pt-2 border-t border-gray-800 flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-semibold">Total</span>
                                <span className="text-sm font-bold text-gray-100">
                                  R$ {card.totalAmount.toFixed(2).replace('.', ',')}
                                </span>
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
            ))}
          </div>
        </DragDropContext>
      </div>

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => { 
            setSelectedOrder(null); 
            searchParams.delete('os'); 
            setSearchParams(searchParams); 
          }} 
        />
      )}
    </div>
  );
}
