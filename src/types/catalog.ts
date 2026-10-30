export type ProductCategory = 'FIGURE_POKEMON' | 'DIORAMA' | 'CHIBI' | 'ACCESSORY_3D';

export type ProductUniverse = 
  | 'POKEMON_TCG'       // Pokémon figures e cartas
  | 'ANIME_MANGA'       // Dragon Ball, One Piece, etc.
  | 'POP_CULTURE_GEEK'  // Games, Filmes, Sanrio, Heróis
  | 'DIORAMA_ACCESSORY';// Luminárias, cenários, suportes

export interface UniverseInfo {
  id: ProductUniverse;
  label: string;
  icon: string;
  badge: string;
  shortBadge: string;
  description: string;
}

export const UNIVERSE_CONFIG: Record<ProductUniverse, UniverseInfo> = {
  POKEMON_TCG: {
    id: 'POKEMON_TCG',
    label: 'Pokémon',
    icon: '⚡',
    badge: '⚡ POKÉMON',
    shortBadge: '⚡ Pokémon',
    description: 'Figures exclusivas, colecionáveis e miniaturas de Pokémon'
  },
  ANIME_MANGA: {
    id: 'ANIME_MANGA',
    label: 'Animes & Mangás',
    icon: '⚔️',
    badge: '⚔️ ANIME',
    shortBadge: '⚔️ Anime & Mangá',
    description: 'Guts, Berserk, Dragon Ball, One Piece e clássicos japoneses'
  },
  POP_CULTURE_GEEK: {
    id: 'POP_CULTURE_GEEK',
    label: 'Pop Culture & Games',
    icon: '🎮',
    badge: '🎮 GEEK',
    shortBadge: '🎮 Pop & Games',
    description: 'Heróis, games icônicos, cinema e cultura pop retrô'
  },
  DIORAMA_ACCESSORY: {
    id: 'DIORAMA_ACCESSORY',
    label: 'Dioramas & Cenários',
    icon: '🏛️',
    badge: '🏛️ DIORAMA',
    shortBadge: '🏛️ Cenários & Suportes',
    description: 'Cenários imersivos, luminárias e expositores temáticos'
  }
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  FIGURE_POKEMON: 'Figures Pokémon',
  DIORAMA: 'Dioramas e Cenários',
  CHIBI: 'Chibis / Miniaturas',
  ACCESSORY_3D: 'Acessórios Geek 3D'
};

export const ENUM_BY_LABEL: Record<string, ProductCategory> = {
  'Figures Pokémon': 'FIGURE_POKEMON',
  'Figures': 'FIGURE_POKEMON',
  'Dioramas e Cenários': 'DIORAMA',
  'Chibis / Miniaturas': 'CHIBI',
  'Acessórios Geek 3D': 'ACCESSORY_3D',
  'Acessórios & Colecionáveis': 'ACCESSORY_3D',
  'Acessórios TCG (3D)': 'ACCESSORY_3D'
};

export function toProductCategory(val?: string | null): ProductCategory {
  if (!val) return 'FIGURE_POKEMON';
  if (val in CATEGORY_LABELS) return val as ProductCategory;
  if (val in ENUM_BY_LABEL) return ENUM_BY_LABEL[val];
  return 'FIGURE_POKEMON';
}

export function toProductUniverse(val?: string | null, name?: string, category?: string): ProductUniverse {
  if (val && val in UNIVERSE_CONFIG) {
    return val as ProductUniverse;
  }
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('guts') || n.includes('berserk') || n.includes('goku') || n.includes('dragon ball') || n.includes('one piece') || n.includes('naruto') || n.includes('demon slayer') || n.includes('luffy') || n.includes('zoro') || n.includes('manga') || n.includes('anime')) {
    return 'ANIME_MANGA';
  }
  if (c.includes('diorama') || n.includes('cenário') || n.includes('cenario') || n.includes('luminária') || n.includes('luminaria') || n.includes('suporte')) {
    return 'DIORAMA_ACCESSORY';
  }
  if (n.includes('mario') || n.includes('zelda') || n.includes('sonic') || n.includes('sanrio') || n.includes('hello kitty') || n.includes('batman') || n.includes('marvel') || n.includes('spider')) {
    return 'POP_CULTURE_GEEK';
  }
  return 'POKEMON_TCG';
}

