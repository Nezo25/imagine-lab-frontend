export type KanbanColumn = 'NEW_LEAD' | 'NEGOTIATING_APPROVED' | 'SLICING_QUEUE' | 'PRINTING' | 'POST_PROCESSING' | 'READY_SHIPPED';

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

export const KANBAN_STORAGE_KEY = 'imaginelab_kanban_board_v2';

export const EMPTY_KANBAN_BOARD: Record<KanbanColumn, OrderKanbanDTO[]> = {
  NEW_LEAD: [],
  NEGOTIATING_APPROVED: [],
  SLICING_QUEUE: [],
  PRINTING: [],
  POST_PROCESSING: [],
  READY_SHIPPED: [],
};

export function isForeignChicoKanban(card: any): boolean {
  if (!card) return false;
  const str = JSON.stringify(card).toLowerCase();
  return (
    str.includes('chico') ||
    str.includes('scorbunny') ||
    str.includes('padrão da forja') ||
    str.includes('padrao da forja') ||
    str.includes('guilherme cataldi') ||
    str.includes('zorua') ||
    str.includes('tepig') ||
    str.includes('mimikyu') ||
    str.includes('berserk')
  );
}

export function getStoredKanban(): Record<KanbanColumn, OrderKanbanDTO[]> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('imaginelab_kanban_board_v1');
      const raw = localStorage.getItem(KANBAN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const cleanBoard: Record<KanbanColumn, OrderKanbanDTO[]> = {
            NEW_LEAD: [],
            NEGOTIATING_APPROVED: [],
            SLICING_QUEUE: [],
            PRINTING: [],
            POST_PROCESSING: [],
            READY_SHIPPED: [],
          };
          for (const col of Object.keys(cleanBoard) as KanbanColumn[]) {
            const list = Array.isArray(parsed[col]) ? parsed[col] : [];
            cleanBoard[col] = list.filter(card => !isForeignChicoKanban(card));
          }
          return cleanBoard;
        }
      }
    }
  } catch (e) {
    console.error('Erro ao ler kanban do localStorage:', e);
  }
  return {
    NEW_LEAD: [],
    NEGOTIATING_APPROVED: [],
    SLICING_QUEUE: [],
    PRINTING: [],
    POST_PROCESSING: [],
    READY_SHIPPED: [],
  };
}

export function saveStoredKanban(board: Record<KanbanColumn, OrderKanbanDTO[]>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(board));
      window.dispatchEvent(new Event('imaginelab_orders_updated'));
    }
  } catch (e) {}
}

export function deleteKanbanCard(orderId: number): void {
  const board = getStoredKanban();
  for (const col of Object.keys(board) as KanbanColumn[]) {
    board[col] = board[col].filter(c => c.id !== orderId);
  }
  saveStoredKanban(board);
}

export function moveKanbanCard(orderId: number, targetColumn: KanbanColumn): void {
  const board = getStoredKanban();
  let foundCard: OrderKanbanDTO | null = null;
  for (const col of Object.keys(board) as KanbanColumn[]) {
    const idx = board[col].findIndex(c => c.id === orderId);
    if (idx !== -1) {
      const [removed] = board[col].splice(idx, 1);
      foundCard = removed;
      break;
    }
  }
  if (foundCard) {
    foundCard.kanbanColumn = targetColumn;
    board[targetColumn].push(foundCard);
    saveStoredKanban(board);
  }
}
