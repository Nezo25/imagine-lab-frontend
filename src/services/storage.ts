import { type Product, initialProducts } from '@/data/products';
import { fetchApi } from '@/api/client';

export interface Order {
  id: string;
  cliente: string;
  produto: string;
  data: string;
  valor: string;
  status: string;
  email?: string;
  telefone?: string;
  tipoEntrega?: 'Retirada Pinhalzinho' | 'Envio Correios/Transportadora';
  detalhesItens?: string;
}

export interface Quote {
  id: string;
  realId?: number;
  cliente: string;
  arquivo: string;
  status: string;
  data: string;
  contato?: string;
  escala?: string;
  material?: string;
  infill?: string;
  resolucao?: string;
  cor?: string;
  volumeCm3?: number;
  pesoGramas?: number;
  acabamento?: string;
  detalhes?: string;
  precoEstimado?: number;
}

export interface Filament {
  id: string;
  color: string;
  material: string;
  stockGrams: number;
  minStockGrams: number;
  hexCode?: string;
}

const STORAGE_KEYS = {
  PRODUCTS: 'imaginelab_products',
  ORDERS: 'imaginelab_orders',
  QUOTES: 'imaginelab_quotes',
  FILAMENTS: 'imaginelab_filaments',
  INITIALIZED: 'imaginelab_initialized_v1',
};

export function parsePrice(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatPrice(num: number): string {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width || 400;
        canvas.height = height || 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80');
    reader.readAsDataURL(file);
  });
}

// ------------------- PRODUTOS -------------------

function sanitizeProduct(p: any): Product {
  return {
    id: p?.id ? p.id.toString() : 'prod_' + Math.random().toString(36).substring(2, 8),
    name: p?.name || 'Peça 3D Personalizada',
    category: p?.category || 'Decoração & Geek',
    tags: Array.isArray(p?.tags) && p.tags.length > 0 ? p.tags : [p?.primaryType || '3D', p?.secondaryType].filter(Boolean),
    scales: Array.isArray(p?.scales) && p.scales.length ? p.scales : [p?.scale || 'Padrão (12 a 15 cm)'],
    materials: Array.isArray(p?.materials) && p.materials.length ? p.materials : ['PLA Premium'],
    basePrice: typeof p?.basePrice === 'number' ? p.basePrice : parsePrice(p?.basePrice) || 0,
    finishOptions: p?.finishOptions || [
      { label: 'Peça Crua (Padrão)', extra: 0 },
      { label: 'Com Primer Cinza', extra: 25 },
      { label: 'Pintado à Mão Profissional', extra: 90 },
    ],
    image: p?.image || p?.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    printTimeH: typeof p?.printTimeH === 'number' ? p.printTimeH : Math.floor((p?.basePrintTimeMinutes || 0) / 60) || 8,
    filamentG: typeof p?.filamentG === 'number' ? p.filamentG : (p?.defaultFilamentGrams || 150),
    active: p?.active !== false && p?.isActive !== false,
    featured: Boolean(p?.featured),
    description: p?.description || 'Item produzido sob demanda com tecnologia de ponta ImagineLab.',
  };
}

export function getStoredProducts(): Product[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeProduct);
      }
    }
  } catch (e) {
    console.error('Erro ao ler produtos:', e);
  }
  // Se ainda não inicializado, salva o catálogo inicial da ImagineLab
  saveProductsToStorage(initialProducts);
  return initialProducts;
}

export function saveProductsToStorage(products: Product[]): void {
  try {
    const sanitized = products.map(sanitizeProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('imaginelab_products_updated'));
  } catch (e) {
    console.error('Erro ao salvar produtos:', e);
  }
}

export async function fetchRemoteProducts(): Promise<Product[]> {
  try {
    const data3d: any = await fetchApi('/models');
    const items3d = data3d?.content || (Array.isArray(data3d) ? data3d : []);
    if (Array.isArray(items3d) && items3d.length > 0) {
      const mapped = items3d.map(sanitizeProduct);
      saveProductsToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('API /models não respondeu ou indisponível:', err);
  }
  return getStoredProducts();
}

export async function saveProduct(productData: Partial<Product>, initialId?: string): Promise<Product> {
  const current = getStoredProducts();
  const isEditing = Boolean(initialId);
  const id = initialId || (productData.id ? productData.id : 'prod_' + Date.now());

  const fullProduct: Product = sanitizeProduct({
    ...productData,
    id,
  });

  let updatedList: Product[];
  if (isEditing) {
    updatedList = current.map(p => (p.id === id ? fullProduct : p));
  } else {
    updatedList = [fullProduct, ...current.filter(p => p.id !== id)];
  }

  saveProductsToStorage(updatedList);

  const payload = {
    pokedexNumber: 0,
    name: fullProduct.name,
    generation: 1,
    primaryType: fullProduct.tags[0] || '3D',
    secondaryType: fullProduct.tags[1] || null,
    scale: fullProduct.scales[0] || 'Padrão (12 a 15 cm)',
    basePrintTimeMinutes: (fullProduct.printTimeH || 0) * 60,
    defaultFilamentGrams: fullProduct.filamentG || 0,
    imageUrl: fullProduct.image,
    basePrice: fullProduct.basePrice,
  };

  const method = isEditing && !id.startsWith('prod_') ? 'PUT' : 'POST';
  const url = isEditing && !id.startsWith('prod_') ? `/models/${id}` : '/models';

  try {
    const savedFromApi: any = await fetchApi(url, { method, body: JSON.stringify(payload) });
    if (savedFromApi?.id) {
      const realId = savedFromApi.id.toString();
      const updatedWithRealId = getStoredProducts().map(p => (p.id === id ? { ...p, id: realId } : p));
      saveProductsToStorage(updatedWithRealId);
      fullProduct.id = realId;
    }
  } catch (apiErr) {
    console.warn('API sync pendente, dados salvos localmente:', apiErr);
  }

  return fullProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const current = getStoredProducts();
  const updated = current.filter(p => p.id !== id);
  saveProductsToStorage(updated);

  try {
    await fetchApi(`/models/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Erro ao deletar na API:', err);
  }
}

export async function toggleProductActive(id: string): Promise<boolean> {
  const current = getStoredProducts();
  let newStatus = true;

  const updated = current.map(p => {
    if (p.id === id) {
      newStatus = !p.active;
      return { ...p, active: newStatus };
    }
    return p;
  });
  saveProductsToStorage(updated);

  try {
    const p = updated.find(x => x.id === id);
    if (p) {
      await fetchApi(`/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: p.name,
          basePrintTimeMinutes: (p.printTimeH || 0) * 60,
          defaultFilamentGrams: p.filamentG || 0,
          isActive: newStatus,
        }),
      });
    }
  } catch (err) {}
  return newStatus;
}

export async function updateProductPrice(id: string, newPrice: number): Promise<void> {
  const current = getStoredProducts();
  const updated = current.map(p => (p.id === id ? { ...p, basePrice: newPrice } : p));
  saveProductsToStorage(updated);

  try {
    await fetchApi(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ basePrice: newPrice }),
    });
  } catch (err) {}
}

// ------------------- FILAMENTOS & ESTOQUE -------------------

const defaultFilaments: Filament[] = [
  { id: 'fil_1', color: 'Roxo ImagineLab', material: 'PLA Premium', stockGrams: 2850, minStockGrams: 500, hexCode: '#5E488C' },
  { id: 'fil_2', color: 'Ciano Neon', material: 'PLA Premium', stockGrams: 1900, minStockGrams: 400, hexCode: '#4CA8B8' },
  { id: 'fil_3', color: 'Preto Fosco Stealth', material: 'PETG Técnico', stockGrams: 4200, minStockGrams: 800, hexCode: '#1E232B' },
  { id: 'fil_4', color: 'Branco Neve Puro', material: 'PLA Premium', stockGrams: 3100, minStockGrams: 600, hexCode: '#F1F5F9' },
  { id: 'fil_5', color: 'Dourado Seda (Silk Gold)', material: 'PLA Silk', stockGrams: 1450, minStockGrams: 500, hexCode: '#D4AF37' },
  { id: 'fil_6', color: 'Cinza Ultra-Detalhe', material: 'Resina 8K', stockGrams: 2000, minStockGrams: 500, hexCode: '#64748B' },
];

export function getStoredFilaments(): Filament[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.FILAMENTS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveFilamentsToStorage(defaultFilaments);
  return defaultFilaments;
}

export function saveFilamentsToStorage(filaments: Filament[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FILAMENTS, JSON.stringify(filaments));
    window.dispatchEvent(new Event('imaginelab_filaments_updated'));
  } catch (e) {}
}

export async function fetchRemoteFilaments(): Promise<Filament[]> {
  try {
    const data: any = await fetchApi('/admin/filaments');
    if (Array.isArray(data) && data.length > 0) {
      const mapped = data.map((f: any) => ({
        id: f.id ? f.id.toString() : 'fil_' + Math.random().toString(36).substring(2, 6),
        color: f.color || f.colorName || 'PLA',
        material: f.material || f.materialType || 'PLA',
        stockGrams: parseFloat(f.stockGrams) || 0,
        minStockGrams: parseFloat(f.minStockGrams) || 300,
        hexCode: f.hexCode,
      }));
      saveFilamentsToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('API /admin/filaments indisponível:', err);
  }
  return getStoredFilaments();
}

export async function saveFilament(data: { color: string; material: string; stockGrams: number; minStockGrams: number; hexCode?: string }): Promise<Filament> {
  const current = getStoredFilaments();
  const newFilament: Filament = {
    id: 'fil_' + Date.now(),
    color: data.color.trim(),
    material: data.material.trim(),
    stockGrams: data.stockGrams || 0,
    minStockGrams: data.minStockGrams || 300,
    hexCode: data.hexCode || '#4CA8B8',
  };

  const updated = [newFilament, ...current];
  saveFilamentsToStorage(updated);

  try {
    const saved: any = await fetchApi('/admin/filaments', {
      method: 'POST',
      body: JSON.stringify(newFilament),
    });
    if (saved?.id) {
      newFilament.id = saved.id.toString();
      saveFilamentsToStorage(getStoredFilaments().map(f => (f.id === newFilament.id ? newFilament : f)));
    }
  } catch (err) {}
  return newFilament;
}

export async function updateFilamentStock(id: string, newStock: number): Promise<void> {
  const current = getStoredFilaments();
  const updated = current.map(f => (f.id === id ? { ...f, stockGrams: Math.max(0, newStock) } : f));
  saveFilamentsToStorage(updated);

  try {
    await fetchApi(`/admin/filaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stockGrams: newStock }),
    });
  } catch (err) {}
}

export async function deleteFilament(id: string): Promise<void> {
  const current = getStoredFilaments();
  const updated = current.filter(f => f.id !== id);
  saveFilamentsToStorage(updated);

  try {
    await fetchApi(`/admin/filaments/${id}`, { method: 'DELETE' });
  } catch (err) {}
}

// ------------------- PEDIDOS & VENDAS -------------------

const defaultOrders: Order[] = [
  {
    id: '#PED-8401',
    cliente: 'Lucas Silveira',
    produto: 'Luminária Litofania Cubo + Suporte MagSafe',
    data: new Date(Date.now() - 86400000 * 2).toLocaleDateString('pt-BR'),
    valor: '199,80',
    status: 'Em impressão',
    email: 'lucas.silveira@gmail.com',
    telefone: '(19) 99821-4411',
    tipoEntrega: 'Retirada Pinhalzinho',
  },
  {
    id: '#PED-8402',
    cliente: 'Camila Andrade',
    produto: 'Estátua Cavaleiro Guerreiro Medieval 8K (Pintada)',
    data: new Date(Date.now() - 86400000 * 4).toLocaleDateString('pt-BR'),
    valor: '309,00',
    status: 'Aguardando pgto',
    email: 'camila.andrade@hotmail.com',
    telefone: '(11) 98452-9900',
    tipoEntrega: 'Envio Correios/Transportadora',
  },
  {
    id: '#PED-8403',
    cliente: 'Oficina Mecânica Pinhal',
    produto: '4x Engrenagens Helicoidais PETG Técnico',
    data: new Date(Date.now() - 86400000 * 7).toLocaleDateString('pt-BR'),
    valor: '240,00',
    status: 'Entregue',
    email: 'contato@mecanicapinhal.com.br',
    telefone: '(19) 3869-1200',
    tipoEntrega: 'Retirada Pinhalzinho',
  },
];

export function getStoredOrders(): Order[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveOrdersToStorage(defaultOrders);
  return defaultOrders;
}

export function saveOrdersToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('imaginelab_orders_updated'));
  } catch (e) {}
}

export async function fetchRemoteOrders(): Promise<Order[]> {
  try {
    const data: any = await fetchApi('/orders');
    if (Array.isArray(data) && data.length > 0) {
      const mapped = data.map((o: any) => ({
        id: o.id ? '#PED-' + o.id.toString() : '#PED-' + Math.floor(1000 + Math.random() * 9000),
        cliente: o.customerName || o.cliente || 'Cliente',
        produto: o.productName || o.produto || 'Item ImagineLab 3D',
        data: o.createdAt ? new Date(o.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        valor: typeof o.totalAmount === 'number' ? formatPrice(o.totalAmount) : o.valor || '0,00',
        status: o.status || 'Aguardando pgto',
      }));
      saveOrdersToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('API /orders indisponível:', err);
  }
  return getStoredOrders();
}

export async function addOrder(order: Partial<Order>): Promise<Order> {
  const current = getStoredOrders();
  const newOrder: Order = {
    id: '#PED-' + Math.floor(1000 + Math.random() * 9000),
    cliente: order.cliente || 'Cliente ImagineLab',
    produto: order.produto || 'Impressão 3D Personalizada',
    data: new Date().toLocaleDateString('pt-BR'),
    valor: order.valor || '149,00',
    status: order.status || 'Em impressão',
    email: order.email,
    telefone: order.telefone,
    tipoEntrega: order.tipoEntrega || 'Retirada Pinhalzinho',
    detalhesItens: order.detalhesItens,
  };
  saveOrdersToStorage([newOrder, ...current]);

  try {
    await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: newOrder.cliente,
        totalAmount: parsePrice(newOrder.valor),
        status: newOrder.status,
      }),
    });
  } catch (err) {}
  return newOrder;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => (o.id === id ? { ...o, status } : o));
  saveOrdersToStorage(updated);

  try {
    const cleanId = id.replace('#PED-', '');
    await fetchApi(`/orders/${cleanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (err) {}
}

export async function deleteOrder(id: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.filter(o => o.id !== id);
  saveOrdersToStorage(updated);

  try {
    const cleanId = id.replace('#PED-', '');
    await fetchApi(`/orders/${cleanId}`, { method: 'DELETE' });
  } catch (err) {}
}

// ------------------- CÁLCULO DINÂMICO DE VENDAS -------------------
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function calculateMonthlySales(orders: Order[]): { mes: string; vendas: number }[] {
  const currentMonthIdx = new Date().getMonth();
  const monthsWindow: { mes: string; monthNum: number; vendas: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const mIdx = (currentMonthIdx - i + 12) % 12;
    monthsWindow.push({
      mes: MONTH_NAMES[mIdx],
      monthNum: mIdx + 1,
      vendas: 0,
    });
  }

  orders.forEach(o => {
    let mNum = -1;
    if (o.data && o.data.includes('/')) {
      const parts = o.data.split('/');
      mNum = parseInt(parts[1], 10);
    }
    const val = parsePrice(o.valor);
    const found = monthsWindow.find(m => m.monthNum === mNum);
    if (found) {
      found.vendas += val;
    } else if (monthsWindow.length > 0) {
      monthsWindow[monthsWindow.length - 1].vendas += val;
    }
  });

  return monthsWindow.map(m => ({ mes: m.mes, vendas: Math.round(m.vendas) }));
}

// ------------------- ORÇAMENTOS STL / 3D UPLOAD -------------------

const defaultQuotes: Quote[] = [
  {
    id: '#ORC-101',
    cliente: 'Bruno Fagundes (Pinhalzinho)',
    arquivo: 'suporte_painel_solar_v2.stl',
    status: 'Aguardando análise',
    data: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR'),
    contato: '(19) 99123-8899',
    material: 'PETG Técnico',
    infill: '50%',
    resolucao: '0.20mm',
    cor: 'Preto Fosco Stealth',
    volumeCm3: 88,
    pesoGramas: 110,
    acabamento: 'Peça Crua (Padrão)',
    detalhes: 'Peça para suporte externo resistente à chuva e sol em Pinhalzinho.',
    precoEstimado: 75.0,
  },
  {
    id: '#ORC-102',
    cliente: 'Marina Vasconcelos',
    arquivo: 'busto_cyberpunk_girl_highpoly.obj',
    status: 'Orçamento enviado',
    data: new Date(Date.now() - 86400000 * 3).toLocaleDateString('pt-BR'),
    contato: '(11) 97722-1144',
    material: 'Resina 8K Ultra-Detalhe',
    infill: '100%',
    resolucao: '0.05mm',
    cor: 'Resina Cinza Ultra-High',
    volumeCm3: 135,
    pesoGramas: 162,
    acabamento: 'Com Primer Cinza',
    detalhes: 'Modelo rico em detalhes para pintura manual.',
    precoEstimado: 185.0,
  },
];

export function getStoredQuotes(): Quote[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveQuotesToStorage(defaultQuotes);
  return defaultQuotes;
}

export function saveQuotesToStorage(quotes: Quote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    window.dispatchEvent(new Event('imaginelab_quotes_updated'));
  } catch (e) {}
}

export async function fetchRemoteQuotes(): Promise<Quote[]> {
  try {
    const data: any = await fetchApi('/quotes');
    if (Array.isArray(data) && data.length > 0) {
      const mapped = data.map((q: any) => ({
        id: '#ORC-' + (q.id || Math.floor(100 + Math.random() * 900)),
        realId: q.id,
        cliente: q.customerName || 'Cliente',
        arquivo: q.fileName || q.stlUrl || 'modelo_3d.stl',
        status: q.status || 'Aguardando análise',
        data: q.createdAt ? new Date(q.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        contato: q.contact,
        precoEstimado: q.finalPrice,
        material: q.material || 'PLA Premium',
      }));
      saveQuotesToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('API /quotes indisponível:', err);
  }
  return getStoredQuotes();
}

export async function addQuote(quote: Partial<Quote>): Promise<Quote> {
  const current = getStoredQuotes();
  const newQuote: Quote = {
    id: '#ORC-' + Math.floor(100 + Math.random() * 900),
    cliente: quote.cliente || 'Cliente ImagineLab',
    arquivo: quote.arquivo || 'modelo_3d.stl',
    status: quote.status || 'Aguardando análise',
    data: new Date().toLocaleDateString('pt-BR'),
    contato: quote.contato,
    escala: quote.escala,
    material: quote.material || 'PLA Premium',
    infill: quote.infill || '30%',
    resolucao: quote.resolucao || '0.20mm',
    cor: quote.cor || 'Roxo ImagineLab',
    volumeCm3: quote.volumeCm3,
    pesoGramas: quote.pesoGramas,
    acabamento: quote.acabamento,
    detalhes: quote.detalhes,
    precoEstimado: quote.precoEstimado,
  };
  saveQuotesToStorage([newQuote, ...current]);

  try {
    await fetchApi('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        customerName: newQuote.cliente,
        stlUrl: newQuote.arquivo,
        status: newQuote.status,
        contact: newQuote.contato,
        details: newQuote.detalhes,
      }),
    });
  } catch (err) {}
  return newQuote;
}

export async function updateQuote(id: string, updates: Partial<Quote>): Promise<void> {
  const current = getStoredQuotes();
  const updated = current.map(q => (q.id === id ? { ...q, ...updates } : q));
  saveQuotesToStorage(updated);

  try {
    const realId = updates.realId || id.replace('#ORC-', '');
    await fetchApi(`/quotes/${realId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (err) {}
}

export async function deleteQuote(id: string): Promise<void> {
  const current = getStoredQuotes();
  const target = current.find(q => q.id === id);
  const updated = current.filter(q => q.id !== id);
  saveQuotesToStorage(updated);

  try {
    const realId = target?.realId || id.replace('#ORC-', '');
    await fetchApi(`/quotes/${realId}`, { method: 'DELETE' });
  } catch (err) {}
}
