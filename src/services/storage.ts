import { type Product, type PokemonType, type Category, products } from '@/data/products';
import { toProductCategory, toProductUniverse, type ProductCategory, type ProductUniverse } from '@/types/catalog';
import { fetchApi } from '@/api/client';

export function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  try {
    const normalized = typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')
      ? dateStr.replace(' ', 'T')
      : dateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? new Date().toLocaleDateString('pt-BR') : d.toLocaleDateString('pt-BR');
  } catch {
    return new Date().toLocaleDateString('pt-BR');
  }
}

export interface Order {
  id: string;
  cliente: string;
  produto: string;
  data: string;
  valor: string;
  status: string;
  email?: string;
  telefone?: string;
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
  PRODUCTS: 'forja_prod_products',
  ORDERS: 'forja_prod_orders',
  QUOTES: 'forja_prod_quotes',
  FILAMENTS: 'forja_prod_filaments',
  INITIALIZED: 'forja_prod_initialized_v4',
  FEATURED_ID: 'forja_featured_product_id'
};

export function getFeaturedProductId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.FEATURED_ID);
  } catch {
    return null;
  }
}

export function setFeaturedProductId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.FEATURED_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.FEATURED_ID);
    }
  } catch (e) {
    console.error('Erro ao salvar destaque:', e);
  }
}

export function parsePrice(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatPrice(num: number): string {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Utilitário seguro para compactar imagem local para Base64 persistente */
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
    reader.onerror = () => resolve('https://placehold.co/600x700/1F2937/F97316?text=Figure');
    reader.readAsDataURL(file);
  });
}

// ------------------- PRODUTOS (REAL DATA ONLY - SEM MOCKS) -------------------

function sanitizeProduct(p: any): Product {
  const isTcg = p?.category === 'TCG' || p?.department === 'TCG';
  const category = isTcg ? 'TCG' : toProductCategory(p?.category);
  const universe = toProductUniverse(p?.universe, p?.name, p?.category);
  const featuredId = getFeaturedProductId();
  const isFeatured = featuredId ? p?.id?.toString() === featuredId : Boolean(p?.featured);
  const stock = typeof p?.stock === 'number' ? p.stock : ((p as any)?.stockQuantity ?? 1);
  const rawPromo = p?.promoPrice ?? p?.promotionalPrice;
  const promoPrice = typeof rawPromo === 'number' && rawPromo > 0 
    ? rawPromo 
    : (rawPromo ? parsePrice(rawPromo) : undefined);

  return {
    id: p?.id ? p.id.toString() : 'prod_' + Math.random().toString(36).substring(2, 8),
    name: p?.name || 'Figure',
    category,
    universe,
    types: Array.isArray(p?.types) && p.types.length > 0 ? p.types : [p?.primaryType || 'Normal', p?.secondaryType].filter(Boolean),
    scales: Array.isArray(p?.scales) && p.scales.length ? p.scales : [p?.scale || '1:10'],
    materials: Array.isArray(p?.materials) && p.materials.length ? p.materials : ['PLA'],
    basePrice: typeof p?.basePrice === 'number' ? p.basePrice : parsePrice(p?.basePrice) || 0,
    promoPrice: promoPrice && promoPrice > 0 ? promoPrice : undefined,
    finishOptions: p?.finishOptions || [],
    image: p?.image || p?.imageUrl || 'https://placehold.co/600x700/1F2937/F97316?text=Figure',
    printTimeH: typeof p?.printTimeH === 'number' ? p.printTimeH : Math.floor((p?.basePrintTimeMinutes || 0) / 60),
    filamentG: typeof p?.filamentG === 'number' ? p.filamentG : (p?.defaultFilamentGrams || 0),
    active: p?.active !== false && p?.isActive !== false,
    featured: isFeatured,
    stock,
    department: isTcg ? 'TCG' : 'PRINT_3D',
  };
}

/**
 * Consolida e deduplica produtos com o mesmo nome:
 * Em vez de criar duplicatas no catálogo, soma as unidades em estoque!
 */
export function consolidateProducts(rawList: Product[]): Product[] {
  const map = new Map<string, Product>();
  const activeFeaturedId = getFeaturedProductId();

  for (const item of rawList) {
    if (!item || !item.name) continue;
    const normKey = item.name.trim().toLowerCase();
    const itemStock = typeof item.stock === 'number' ? item.stock : ((item as any).stockQuantity ?? 1);

    if (!map.has(normKey)) {
      map.set(normKey, {
        ...item,
        universe: item.universe || toProductUniverse(undefined, item.name, item.category),
        stock: itemStock,
        featured: activeFeaturedId ? item.id === activeFeaturedId : Boolean(item.featured),
        promoPrice: item.promoPrice
      });
    } else {
      const existing = map.get(normKey)!;
      // Incorpora unidades no estoque existente
      existing.stock = (existing.stock || 1) + itemStock;
      if (item.universe) existing.universe = item.universe;

      // Se um deles tem ID real do banco (numérico), prioriza o ID do banco
      if (item.id && !item.id.toString().startsWith('prod_') && existing.id.startsWith('prod_')) {
        existing.id = item.id.toString();
      }
      // Se um deles tem imagem real (não placeholder), preserva a imagem real
      if (item.image && (!existing.image || existing.image.includes('placehold.co'))) {
        existing.image = item.image;
      }
      if (item.promoPrice) existing.promoPrice = item.promoPrice;
      if (item.active) existing.active = true;
      if (item.featured || (activeFeaturedId && (item.id === activeFeaturedId || existing.id === activeFeaturedId))) {
        existing.featured = true;
      }
    }
  }

  return Array.from(map.values());
}

export function isFakeMockProduct(p: any): boolean {
  if (!p || !p.name) return true;
  const idStr = String(p.id || '');
  if (/^p\d+$/.test(idStr)) return true; // p1, p2, p3...
  const nameLower = p.name.trim().toLowerCase();
  const fakeNames = [
    'charizard stance',
    'gengar sorridente',
    'gyarados emergindo',
    'pikachu thunder',
    'mewtwo armadura',
    'bulbasaur chibi',
    'garchomp diorama',
    'suporte pokébola',
    'suporte pokebola',
    'dialga lendário',
    'dialga lendario'
  ];
  if (fakeNames.includes(nameLower)) return true;
  return false;
}

export function getStoredProducts(): Product[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.filter(p => !isFakeMockProduct(p));
        if (clean.length > 0) {
          return consolidateProducts(clean.map(sanitizeProduct));
        }
      }
    }
  } catch (e) {
    console.error('Erro ao ler produtos:', e);
  }
  // Se o cache local estiver vazio (primeiro acesso, Safari privado, etc), usa o catálogo real da oficina
  return products.length > 0 ? consolidateProducts(products.map(sanitizeProduct)) : [];
}

export function saveProductsToStorage(productsList: Product[]): void {
  try {
    const cleanList = productsList.filter(p => !isFakeMockProduct(p));
    const consolidated = consolidateProducts(cleanList.map(sanitizeProduct));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(consolidated));
    window.dispatchEvent(new Event('forja_products_updated'));
  } catch (e) {
    console.error('Erro ao salvar produtos:', e);
  }
}

export function incrementProductStock(id: string, delta: number = 1): number {
  const current = getStoredProducts();
  let finalStock = 1;
  const updated = current.map(p => {
    if (p.id === id) {
      const currentStock = typeof p.stock === 'number' ? p.stock : ((p as any).stockQuantity ?? 1);
      finalStock = Math.max(0, currentStock + delta);
      return { ...p, stock: finalStock };
    }
    return p;
  });
  saveProductsToStorage(updated);
  return finalStock;
}

export async function fetchRemoteProducts(maxAttempts = 5): Promise<Product[]> {
  const executeFetch = async (): Promise<Product[]> => {
    let allProducts: Product[] = [];

    // Fetch 3D Models reais cadastrados na oficina
    try {
      const data3d: any = await fetchApi('/models?size=100');
      const items3d = data3d?.content || (Array.isArray(data3d) ? data3d : []);
      if (Array.isArray(items3d) && items3d.length > 0) {
        allProducts = [...items3d.map(sanitizeProduct)];
      }
    } catch (err) {
      console.warn('Tentativa na API de modelos:', err);
    }

    // Fetch TCG Products reais cadastrados na oficina
    try {
      const isAdmin = Boolean(typeof window !== 'undefined' && sessionStorage.getItem('__adm_token'));
      const tcgEndpoint = isAdmin ? '/admin/tcg-products?size=100' : '/tcg-products?size=100';
      const dataTcg: any = await fetchApi(tcgEndpoint);
      const itemsTcg = dataTcg?.content || (Array.isArray(dataTcg) ? dataTcg : []);
      if (Array.isArray(itemsTcg) && itemsTcg.length > 0) {
        const mappedTcg = itemsTcg.map((tcg: any) => ({
          id: tcg.id.toString(),
          name: tcg.name,
          category: 'TCG',
          types: [],
          scales: [tcg.itemType],
          materials: [tcg.language],
          basePrice: tcg.price,
          finishOptions: [],
          image: tcg.imageUrl || 'https://placehold.co/600x700/1F2937/F97316?text=TCG',
          printTimeH: 0,
          filamentG: 0,
          active: tcg.isActive,
          featured: false,
          expansionName: tcg.expansionName,
          stock: tcg.stockQuantity || 1,
          department: 'TCG'
        } as any));
        allProducts = [...allProducts, ...mappedTcg];
      }
    } catch (err) {
      console.warn('Tentativa na API de TCG:', err);
    }

    return allProducts.filter(p => !isFakeMockProduct(p));
  };

  const delays = [2500, 3500, 5000, 6000, 8000];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const results = await executeFetch();
      if (results.length > 0) {
        const consolidated = consolidateProducts(results);
        saveProductsToStorage(consolidated);
        return consolidated;
      }
    } catch (err) {
      console.warn(`Tentativa ${attempt + 1}/${maxAttempts} falhou:`, err);
    }

    if (attempt < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, delays[attempt] || 4000));
    }
  }

  return getStoredProducts();
}

export function toggleProductFeatured(id: string): boolean {
  const currentFeaturedId = getFeaturedProductId();
  const willBeFeatured = currentFeaturedId !== id;
  
  setFeaturedProductId(willBeFeatured ? id : null);

  const current = getStoredProducts();
  const updated = current.map(p => ({
    ...p,
    featured: willBeFeatured && p.id === id
  }));
  saveProductsToStorage(updated);
  return willBeFeatured;
}

export function setFeaturedProduct(id: string | null): void {
  setFeaturedProductId(id);
  const current = getStoredProducts();
  const updated = current.map(p => ({
    ...p,
    featured: p.id === id
  }));
  saveProductsToStorage(updated);
}

export async function saveProduct(productData: Partial<Product>, initialId?: string): Promise<Product> {
  const current = getStoredProducts();
  const isEditing = Boolean(initialId);
  const id = initialId || (productData.id ? productData.id : 'prod_' + Date.now());

  const fullProduct: Product = sanitizeProduct({
    ...productData,
    id,
  });

  // Se já existe um produto com o mesmo nome registrado e não estamos editando o mesmo:
  // Em vez de criar duplicatas no catálogo, incorpora as unidades no produto existente!
  const existingSameName = current.find(p => 
    p.name.trim().toLowerCase() === fullProduct.name.trim().toLowerCase() && p.id !== id
  );

  if (existingSameName && !isEditing) {
    existingSameName.stock = (existingSameName.stock || 1) + (fullProduct.stock || 1);
    if (productData.featured) {
      setFeaturedProductId(existingSameName.id);
      existingSameName.featured = true;
    }
    saveProductsToStorage(current);
    return existingSameName;
  }

  // Se este produto foi marcado como destaque, sincroniza o ID persistente do destaque
  if (productData.featured) {
    setFeaturedProductId(id);
    current.forEach(p => {
      if (p.id !== id) p.featured = false;
    });
  }

  let updatedList: Product[];
  if (isEditing) {
    updatedList = current.map(p => (p.id === id ? fullProduct : p));
  } else {
    updatedList = [fullProduct, ...current.filter(p => p.id !== id)];
  }

  saveProductsToStorage(updatedList);

  const categoryEnum: ProductCategory = fullProduct.category === 'TCG' ? 'FIGURE_POKEMON' : toProductCategory(fullProduct.category);

  // Payload exatamente mapeado para o DTO do Spring Boot
  const payload = {
    pokedexNumber: 0,
    name: fullProduct.name,
    category: categoryEnum,
    universe: fullProduct.universe,
    generation: 1,
    primaryType: fullProduct.types[0] || 'Normal',
    secondaryType: fullProduct.types[1] || null,
    scale: fullProduct.scales[0] || '1:10',
    basePrintTimeMinutes: (fullProduct.printTimeH || 0) * 60,
    defaultFilamentGrams: fullProduct.filamentG || 0,
    imageUrl: fullProduct.image,
    basePrice: fullProduct.basePrice
  };

  const method = isEditing && !id.startsWith('prod_') ? 'PUT' : 'POST';
  const url = isEditing && !id.startsWith('prod_') ? `/models/${id}` : '/models';

  try {
    const savedFromApi: any = await fetchApi(url, { method, body: JSON.stringify(payload) });
    if (savedFromApi?.id) {
      const realId = savedFromApi.id.toString();
      const updatedWithRealId = getStoredProducts().map(p => p.id === id ? { ...p, id: realId } : p);
      saveProductsToStorage(updatedWithRealId);
      fullProduct.id = realId;
    }
  } catch (apiErr) {
    console.warn('Tentativa na API falhou, dados mantidos:', apiErr);
  }

  return fullProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const current = getStoredProducts();
  const product = current.find(p => p.id === id);
  if (!product) return;
  const isTcg = product.category === 'TCG';

  const updated = current.filter(p => p.id !== id);
  saveProductsToStorage(updated);

  try {
    if (isTcg) {
      await fetchApi(`/admin/tcg-products/${id}`, { method: 'DELETE' });
    } else {
      await fetchApi(`/models/${id}`, { method: 'DELETE' });
    }
  } catch (err) {
    console.warn('Erro ao deletar na API:', err);
  }
}

export async function toggleProductActive(id: string): Promise<boolean> {
  const current = getStoredProducts();
  let newStatus = true;
  let isTcg = false;
  
  const updated = current.map(p => {
    if (p.id === id) {
      newStatus = !p.active;
      if (p.category === 'TCG') isTcg = true;
      return { ...p, active: newStatus };
    }
    return p;
  });
  saveProductsToStorage(updated);

  try {
    if (isTcg) {
      await fetchApi(`/admin/tcg-products/${id}/toggle-active`, { method: 'PATCH' });
    } else {
      const p = updated.find(x => x.id === id);
      if (p) {
        await fetchApi(`/models/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: p.name,
            generation: 1,
            primaryType: p.types[0] || 'Normal',
            scale: p.scales[0] || '1:10',
            basePrintTimeMinutes: (p.printTimeH || 0) * 60,
            defaultFilamentGrams: p.filamentG || 0,
            isActive: newStatus
          })
        });
      }
    }
  } catch (err) {}
  return newStatus;
}

export async function updateProductPrice(id: string, newPrice: number, newPromoPrice?: number | null): Promise<void> {
  const current = getStoredProducts();
  const product = current.find(p => p.id === id);
  if (!product) return;
  const isTcg = product.category === 'TCG';

  const updated = current.map(p => {
    if (p.id !== id) return p;
    return {
      ...p,
      basePrice: newPrice,
      promoPrice: newPromoPrice === null ? undefined : (newPromoPrice !== undefined ? newPromoPrice : p.promoPrice)
    };
  });
  saveProductsToStorage(updated);

  try {
    if (isTcg) {
      // For TCG, we need to send the whole object since we added PUT /admin/tcg-products/{id}
      // But it's easier to just fetch it and update, or we can leave it since TCG has its own modal for editing
      // Actually, Admin.tsx calls handleSavePrice for both. We should support it!
      const tcgPayload = {
        name: product.name,
        itemType: product.scales[0], // it's stored in scales
        expansionName: product.expansionName,
        language: product.materials[0], // it's stored in materials
        price: newPrice,
        stockQuantity: (product as any).stockQuantity || (product as any).stock || 0,
        imageUrl: product.image,
        isActive: product.active
      };
      await fetchApi(`/admin/tcg-products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tcgPayload)
      });
    } else {
      await fetchApi(`/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ basePrice: newPrice })
      });
    }
  } catch (err) {}
}

// ------------------- FILAMENTOS (SEM MOCKS) -------------------

export function getStoredFilaments(): Filament[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.FILAMENTS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.map(f => ({
          id: f.id || 'fil_' + Math.random().toString(36).substring(2, 6),
          color: f.color || f.colorName || 'Filamento',
          material: f.material || f.materialType || 'PLA',
          stockGrams: typeof f.stockGrams === 'number' ? f.stockGrams : (parseFloat(f.stockGrams) || 0),
          minStockGrams: typeof f.minStockGrams === 'number' ? f.minStockGrams : 300,
          hexCode: f.hexCode,
        }));
      }
    }
  } catch (e) {}
  return []; // NUNCA restaura mock!
}

export function saveFilamentsToStorage(filaments: Filament[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FILAMENTS, JSON.stringify(filaments));
    window.dispatchEvent(new Event('forja_filaments_updated'));
  } catch (e) {}
}

export async function fetchRemoteFilaments(): Promise<Filament[]> {
  try {
    const data: any = await fetchApi('/admin/filaments');
    if (Array.isArray(data)) {
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
    console.warn('API /admin/filaments não respondeu:', err);
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
    hexCode: data.hexCode,
  };

  const updated = [newFilament, ...current];
  saveFilamentsToStorage(updated);

  try {
    const saved: any = await fetchApi('/admin/filaments', {
      method: 'POST',
      body: JSON.stringify({
        color: data.color.trim(),
        material: data.material.trim(),
        stockGrams: data.stockGrams || 0,
        minStockGrams: data.minStockGrams || 300,
          hexCode: data.hexCode
        })
    });
    if (saved?.id) {
      newFilament.id = saved.id.toString();
      saveFilamentsToStorage(getStoredFilaments().map(f => f.id === newFilament.id ? newFilament : f));
    }
  } catch (err) {}
  return newFilament;
}

export async function updateFilamentStock(id: string, newStock: number): Promise<void> {
  const current = getStoredFilaments();
  const updated = current.map(f => f.id === id ? { ...f, stockGrams: Math.max(0, newStock) } : f);
  saveFilamentsToStorage(updated);

  try {
    await fetchApi(`/admin/filaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stockGrams: newStock })
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

// ------------------- PEDIDOS (SEM MOCKS) -------------------

export function getStoredOrders(): Order[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return []; // NUNCA restaura mock!
}

export function saveOrdersToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('forja_orders_updated'));
  } catch (e) {}
}

export async function fetchRemoteOrders(): Promise<Order[]> {
  try {
    const data: any = await fetchApi('/orders');
    if (Array.isArray(data)) {
      const mapped = data.map((o: any) => ({
        id: o.id ? '#PED-' + o.id.toString() : '#PED-' + Math.floor(1000 + Math.random() * 9000),
        cliente: o.customerName || o.cliente || 'Cliente',
        produto: o.productName || o.produto || 'Figure',
        data: safeFormatDate(o.createdAt),
        valor: typeof o.totalAmount === 'number' ? formatPrice(o.totalAmount) : (o.valor || '0,00'),
        status: o.status || 'Aguardando pgto',
      }));
      saveOrdersToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('API /orders não respondeu:', err);
  }
  return getStoredOrders();
}

export async function addOrder(order: Partial<Order>): Promise<Order> {
  const current = getStoredOrders();
  const newOrder: Order = {
    id: '#PED-' + Math.floor(1000 + Math.random() * 9000),
    cliente: order.cliente || 'Cliente',
    produto: order.produto || 'Peça ImagineLab',
    data: safeFormatDate(),
    valor: order.valor || '149,00',
    status: order.status || 'Em impressão',
    email: order.email,
    telefone: order.telefone
  };
  saveOrdersToStorage([newOrder, ...current]);

  try {
    await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: newOrder.cliente,
        totalAmount: parsePrice(newOrder.valor),
        status: newOrder.status,
      })
    });
  } catch (err) {}
  return newOrder;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const current = getStoredOrders();
  const updated = current.map(o => o.id === id ? { ...o, status } : o);
  saveOrdersToStorage(updated);

  try {
    const cleanId = id.replace('#PED-', '');
    await fetchApi(`/orders/${cleanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
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

export function isConfirmedSale(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  // Leads, propostas iniciais e orçamentos aguardando NUNCA entram em faturamento real
  if (
    s === 'LEAD_WHATSAPP' ||
    s === 'NEW_LEAD' ||
    s === 'PENDING_PAYMENT' ||
    s.includes('AGUARDANDO') ||
    s.includes('PROPOSTA') ||
    s.includes('LEAD') ||
    s.includes('WHATSAPP')
  ) {
    return false;
  }
  // Cancelados e rejeitados
  if (s.includes('CANCEL') || s.includes('REJEIT') || s === 'REJECTED') {
    return false;
  }
  // Vendas reais em produção, finalizadas ou pagas
  return true;
}

export function isLeadProposal(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  if (s.includes('CANCEL') || s.includes('REJEIT') || s === 'REJECTED') {
    return false;
  }
  return !isConfirmedSale(status);
}

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

  // Apenas pedidos confirmados entram no gráfico contábil
  const confirmed = orders.filter(o => isConfirmedSale(o.status));

  confirmed.forEach(o => {
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

// ------------------- ORÇAMENTOS STL (SEM MOCKS) -------------------

export function getStoredQuotes(): Quote[] {
  try {
    const local = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return []; // NUNCA restaura mock!
}

export function saveQuotesToStorage(quotes: Quote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    window.dispatchEvent(new Event('forja_quotes_updated'));
  } catch (e) {}
}

export async function fetchRemoteQuotes(): Promise<Quote[]> {
  try {
    const data: any = await fetchApi('/quotes');
    if (Array.isArray(data)) {
      const mapped = data.map((q: any) => ({
        id: '#S' + (q.id || Math.floor(10 + Math.random() * 900)).toString().padStart(3, '0'),
        realId: q.id,
        cliente: q.customerName || 'Cliente',
        arquivo: q.fileName || q.stlUrl || 'modelo.stl',
        status: q.status || 'Aguardando análise',
        data: safeFormatDate(q.createdAt),
        contato: q.contact,
        precoEstimado: q.finalPrice,
      }));
      saveQuotesToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('API /quotes não respondeu:', err);
  }
  return getStoredQuotes();
}

export async function addQuote(quote: Partial<Quote>): Promise<Quote> {
  const current = getStoredQuotes();
  const newQuote: Quote = {
    id: '#S' + Math.floor(10 + Math.random() * 900).toString().padStart(3, '0'),
    cliente: quote.cliente || 'Cliente',
    arquivo: quote.arquivo || 'modelo.stl',
    status: quote.status || 'Aguardando análise',
    data: safeFormatDate(),
    contato: quote.contato,
    escala: quote.escala,
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
      })
    });
  } catch (err) {}
  return newQuote;
}

export async function updateQuote(id: string, updates: Partial<Quote>): Promise<void> {
  const current = getStoredQuotes();
  const updated = current.map(q => q.id === id ? { ...q, ...updates } : q);
  saveQuotesToStorage(updated);

  try {
    const realId = updates.realId || id.replace('#S', '').replace(/^0+/, '');
    await fetchApi(`/quotes/${realId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (err) {}
}

export async function deleteQuote(id: string): Promise<void> {
  const current = getStoredQuotes();
  const target = current.find(q => q.id === id);
  const updated = current.filter(q => q.id !== id);
  saveQuotesToStorage(updated);

  try {
    const realId = target?.realId || id.replace('#S', '').replace(/^0+/, '');
    await fetchApi(`/quotes/${realId}`, { method: 'DELETE' });
  } catch (err) {}
}
