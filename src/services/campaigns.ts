import { fetchApi } from '@/api/client';

export type ThemePreset =
  | 'HALLOWEEN'
  | 'CHRISTMAS'
  | 'POKEMON_DAY'
  | 'MARIO_DAY'
  | 'ANIME_EVENT'
  | 'CUSTOM';

export interface ThemePresetConfig {
  id: ThemePreset;
  label: string;
  emoji: string;
  defaultTag: string;
  accentColor: string;
  secondaryColor: string;
  tabClasses: string;
  badgeClasses: string;
}

export const THEME_PRESET_CONFIGS: Record<ThemePreset, ThemePresetConfig> = {
  HALLOWEEN: {
    id: 'HALLOWEEN',
    label: '🎃 Halloween (Laranja Abóbora + Roxo Névoa)',
    emoji: '🎃',
    defaultTag: '🎃 ESPECIAL HALLOWEEN',
    accentColor: '#F97316',
    secondaryColor: '#7C3AED',
    tabClasses: 'border-purple-500/80 bg-purple-950/40 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.3)]',
    badgeClasses: 'bg-purple-950/80 border-purple-500/60 text-orange-300'
  },
  CHRISTMAS: {
    id: 'CHRISTMAS',
    label: '🎄 Natal (Vermelho Natalino + Dourado)',
    emoji: '🎄',
    defaultTag: '🎄 ESPECIAL DE NATAL',
    accentColor: '#EF4444',
    secondaryColor: '#EAB308',
    tabClasses: 'border-red-500/80 bg-red-950/40 text-amber-200 shadow-[0_0_16px_rgba(239,68,68,0.3)]',
    badgeClasses: 'bg-red-950/80 border-amber-500/60 text-amber-300'
  },
  POKEMON_DAY: {
    id: 'POKEMON_DAY',
    label: '⚡ Pokémon Day (Azul Safira + Amarelo Elétrico)',
    emoji: '⚡',
    defaultTag: '⚡ POKÉMON DAY',
    accentColor: '#EAB308',
    secondaryColor: '#2563EB',
    tabClasses: 'border-yellow-400/80 bg-blue-950/50 text-yellow-200 shadow-[0_0_16px_rgba(234,179,8,0.3)]',
    badgeClasses: 'bg-blue-950/80 border-yellow-400/60 text-yellow-300'
  },
  MARIO_DAY: {
    id: 'MARIO_DAY',
    label: '🍄 Mario Day (Vermelho Encanador + Verde Cogumelo)',
    emoji: '🍄',
    defaultTag: '🍄 MAR10 DAY',
    accentColor: '#EF4444',
    secondaryColor: '#22C55E',
    tabClasses: 'border-emerald-500/80 bg-red-950/40 text-emerald-200 shadow-[0_0_16px_rgba(34,197,94,0.3)]',
    badgeClasses: 'bg-emerald-950/80 border-red-500/60 text-emerald-300'
  },
  ANIME_EVENT: {
    id: 'ANIME_EVENT',
    label: '⚔️ Anime Fest (Carmesim + Índigo)',
    emoji: '⚔️',
    defaultTag: '⚔️ SEMANA ANIME',
    accentColor: '#EC4899',
    secondaryColor: '#6366F1',
    tabClasses: 'border-pink-500/80 bg-indigo-950/50 text-pink-200 shadow-[0_0_16px_rgba(236,72,153,0.3)]',
    badgeClasses: 'bg-indigo-950/80 border-pink-500/60 text-pink-300'
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: '✨ Customizado (Cor Hex Livre)',
    emoji: '✨',
    defaultTag: '✨ EVENTO ESPECIAL',
    accentColor: '#F97316',
    secondaryColor: '#7C3AED',
    tabClasses: 'border-orange-500/80 bg-orange-950/40 text-orange-200 shadow-[0_0_16px_rgba(249,115,22,0.3)]',
    badgeClasses: 'bg-slate-900/90 border-orange-500/60 text-orange-300'
  }
};

export interface CampaignProductItem {
  id?: number;
  productId: number;
  productName?: string;
  productImage?: string;
  productCategory?: string;
  productScale?: string;
  primaryType?: string;
  secondaryType?: string;
  originalPrice?: number;
  eventPrice?: number | null;
  effectivePrice?: number;
  customBadge?: string;
  displayOrder: number;
}

export interface SeasonalCampaign {
  id?: number;
  name: string;
  slug: string;
  tagLabel: string;
  themePreset: ThemePreset;
  accentColor: string;
  secondaryColor: string;
  bannerTitle: string;
  bannerSubtitle: string;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  products: CampaignProductItem[];
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'forja_seasonal_campaigns_v1';

function getLocalCampaigns(): SeasonalCampaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeasonalCampaign[]) : [];
  } catch {
    return [];
  }
}

function saveLocalCampaigns(list: SeasonalCampaign[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('forja-campaigns-updated'));
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchActiveCampaign(): Promise<SeasonalCampaign | null> {
  try {
    const res = await fetchApi<{ hasActiveCampaign: boolean; campaign?: SeasonalCampaign }>('/campaigns/active');
    if (res && res.hasActiveCampaign && res.campaign) {
      return res.campaign;
    }
    if (res && res.hasActiveCampaign === false) {
      const localActive = getLocalCampaigns().find(c => c.isActive);
      return localActive || null;
    }
  } catch {
    const localActive = getLocalCampaigns().find(c => c.isActive);
    return localActive || null;
  }
  return null;
}

export async function fetchAdminCampaigns(): Promise<SeasonalCampaign[]> {
  try {
    const res = await fetchApi<SeasonalCampaign[]>('/admin/campaigns');
    if (Array.isArray(res)) {
      if (res.length > 0) {
        saveLocalCampaigns(res);
        return res;
      }
      return getLocalCampaigns();
    }
  } catch {
    // fallback local
  }
  return getLocalCampaigns();
}

export async function createSeasonalCampaign(payload: SeasonalCampaign): Promise<SeasonalCampaign> {
  try {
    const created = await fetchApi<SeasonalCampaign>('/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const current = getLocalCampaigns().map(c =>
      payload.isActive ? { ...c, isActive: false } : c
    );
    saveLocalCampaigns([created, ...current]);
    return created;
  } catch {
    const localId = Date.now();
    const createdLocal: SeasonalCampaign = { ...payload, id: localId };
    const current = getLocalCampaigns().map(c =>
      payload.isActive ? { ...c, isActive: false } : c
    );
    saveLocalCampaigns([createdLocal, ...current]);
    return createdLocal;
  }
}

export async function updateSeasonalCampaign(id: number, payload: SeasonalCampaign): Promise<SeasonalCampaign> {
  try {
    const updated = await fetchApi<SeasonalCampaign>(`/admin/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const nextList = getLocalCampaigns().map(c => {
      if (c.id === id) return updated;
      return payload.isActive ? { ...c, isActive: false } : c;
    });
    saveLocalCampaigns(nextList);
    return updated;
  } catch {
    const updatedLocal: SeasonalCampaign = { ...payload, id };
    const nextList = getLocalCampaigns().map(c => {
      if (c.id === id) return updatedLocal;
      return payload.isActive ? { ...c, isActive: false } : c;
    });
    saveLocalCampaigns(nextList);
    return updatedLocal;
  }
}

export async function toggleSeasonalCampaign(id: number): Promise<SeasonalCampaign> {
  try {
    const toggled = await fetchApi<SeasonalCampaign>(`/admin/campaigns/${id}/toggle`, {
      method: 'PATCH'
    });
    const nextList = getLocalCampaigns().map(c => {
      if (c.id === id) return toggled;
      return toggled.isActive ? { ...c, isActive: false } : c;
    });
    saveLocalCampaigns(nextList);
    return toggled;
  } catch {
    const list = getLocalCampaigns();
    const target = list.find(c => c.id === id);
    const nextState = !(target?.isActive);
    const nextList = list.map(c => {
      if (c.id === id) return { ...c, isActive: nextState };
      return nextState ? { ...c, isActive: false } : c;
    });
    saveLocalCampaigns(nextList);
    return nextList.find(c => c.id === id)!;
  }
}

export async function deleteSeasonalCampaign(id: number): Promise<void> {
  try {
    await fetchApi(`/admin/campaigns/${id}`, { method: 'DELETE' });
  } catch {
    // ignore remote error and remove locally
  }
  const nextList = getLocalCampaigns().filter(c => c.id !== id);
  saveLocalCampaigns(nextList);
}
