import { fetchApi } from '@/api/client';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIXED_VALUE';

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number | null;
  currentUses: number;
  isFirstPurchaseOnly: boolean;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number | null;
  isFirstPurchaseOnly?: boolean;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: string;
  discountAmount: number;
  finalSubtotal: number;
  message: string;
}

const LOCAL_STORAGE_COUPONS = 'forja_admin_coupons_cache';

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 1,
    code: 'BEMVINDO10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 50,
    maxUses: null,
    currentUses: 4,
    isFirstPurchaseOnly: true,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'IMAGINE15',
    discountType: 'FIXED_AMOUNT',
    discountValue: 15,
    minOrderValue: 100,
    maxUses: 50,
    currentUses: 12,
    isFirstPurchaseOnly: false,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

function getLocalCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COUPONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler cupons do localStorage:', e);
  }
  return DEFAULT_COUPONS;
}

function saveLocalCoupons(coupons: Coupon[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_COUPONS, JSON.stringify(coupons));
  } catch (e) {
    console.warn('Erro ao salvar cupons localmente:', e);
  }
}

export async function fetchAdminCoupons(): Promise<Coupon[]> {
  try {
    const data = await fetchApi<Coupon[]>('/admin/coupons');
    if (Array.isArray(data) && data.length > 0) {
      saveLocalCoupons(data);
      return data;
    }
  } catch (err) {
    console.warn('Falha ao buscar cupons na API, usando cache local:', err);
  }
  return getLocalCoupons();
}

export async function createCoupon(couponData: CouponRequest): Promise<Coupon> {
  const cleanCode = couponData.code.trim().toUpperCase();
  const payload = {
    ...couponData,
    code: cleanCode,
    minOrderValue: couponData.minOrderValue || 0,
    isFirstPurchaseOnly: Boolean(couponData.isFirstPurchaseOnly),
    isActive: couponData.isActive !== false
  };

  try {
    const created = await fetchApi<Coupon>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (created && created.id) {
      const current = getLocalCoupons().filter(c => c.id !== created.id);
      saveLocalCoupons([created, ...current]);
      return created;
    }
  } catch (err) {
    console.warn('Falha na API ao criar cupom, persistindo localmente:', err);
  }

  // Fallback local se a API estiver indisponível
  const current = getLocalCoupons();
  if (current.some(c => c.code.toUpperCase() === cleanCode)) {
    throw new Error(`Já existe um cupom cadastrado com o código ${cleanCode}`);
  }

  const fallbackCoupon: Coupon = {
    id: Date.now(),
    code: cleanCode,
    discountType: payload.discountType,
    discountValue: Number(payload.discountValue),
    minOrderValue: Number(payload.minOrderValue),
    maxUses: payload.maxUses ? Number(payload.maxUses) : null,
    currentUses: 0,
    isFirstPurchaseOnly: payload.isFirstPurchaseOnly,
    expiresAt: payload.expiresAt || null,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  saveLocalCoupons([fallbackCoupon, ...current]);
  return fallbackCoupon;
}

export async function toggleCouponActive(id: number): Promise<Coupon> {
  try {
    const updated = await fetchApi<Coupon>(`/admin/coupons/${id}/toggle`, {
      method: 'PATCH'
    });
    if (updated) {
      const current = getLocalCoupons().map(c => c.id === id ? updated : c);
      saveLocalCoupons(current);
      return updated;
    }
  } catch (err) {
    console.warn('Falha na API ao alternar status do cupom, atualizando localmente:', err);
  }

  const current = getLocalCoupons();
  const match = current.find(c => c.id === id);
  if (!match) throw new Error('Cupom não encontrado');
  match.isActive = !match.isActive;
  saveLocalCoupons([...current]);
  return match;
}

export async function deleteCoupon(id: number): Promise<void> {
  try {
    await fetchApi(`/admin/coupons/${id}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Falha na API ao deletar cupom, removendo localmente:', err);
  }

  const current = getLocalCoupons().filter(c => c.id !== id);
  saveLocalCoupons(current);
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  customerEmail?: string,
  customerPhone?: string
): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return {
      valid: false,
      code: '',
      discountType: '',
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Informe o código do cupom.'
    };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const result = await fetchApi<CouponValidationResult>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({
        code: cleanCode,
        subtotal,
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || ''
      })
    });
    if (result && typeof result.valid === 'boolean') {
      return result;
    }
  } catch (err) {
    console.warn('Falha na validação remota de cupom, validando com regras locais:', err);
  }

  // Fallback offline / resilience check
  const localList = getLocalCoupons();
  const found = localList.find(c => c.code.toUpperCase() === cleanCode);

  if (!found) {
    return {
      valid: false,
      code: cleanCode,
      discountType: '',
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Cupom inválido ou não encontrado.'
    };
  }

  if (!found.isActive) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Este cupom está pausado ou inativo.'
    };
  }

  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'Este cupom já expirou.'
    };
  }

  if (found.maxUses && found.currentUses >= found.maxUses) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: 'O limite de utilizações deste cupom foi atingido.'
    };
  }

  const min = found.minOrderValue || 0;
  if (subtotal < min) {
    return {
      valid: false,
      code: cleanCode,
      discountType: found.discountType,
      discountAmount: 0,
      finalSubtotal: subtotal,
      message: `Válido apenas para compras acima de R$ ${min.toFixed(2).replace('.', ',')}.`
    };
  }

  let discount = 0;
  if (found.discountType === 'PERCENTAGE') {
    discount = (subtotal * found.discountValue) / 100;
  } else {
    discount = found.discountValue;
  }
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    code: found.code,
    discountType: found.discountType,
    discountAmount: Number(discount.toFixed(2)),
    finalSubtotal: Number(Math.max(0, subtotal - discount).toFixed(2)),
    message: 'Cupom aplicado com sucesso!'
  };
}
