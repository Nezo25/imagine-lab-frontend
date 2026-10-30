export type PokemonType =
  | 'Normal' | 'Fogo' | 'Água' | 'Elétrico' | 'Planta' | 'Gelo'
  | 'Lutador' | 'Veneno' | 'Terra' | 'Voador' | 'Psíquico' | 'Inseto'
  | 'Pedra' | 'Fantasma' | 'Dragão' | 'Escuridão' | 'Metálico' | 'Fada';

import { 
  type ProductCategory, 
  type ProductUniverse, 
  UNIVERSE_CONFIG, 
  CATEGORY_LABELS, 
  ENUM_BY_LABEL, 
  toProductCategory, 
  toProductUniverse 
} from '@/types/catalog';
export { 
  type ProductCategory, 
  type ProductUniverse, 
  UNIVERSE_CONFIG, 
  CATEGORY_LABELS, 
  ENUM_BY_LABEL, 
  toProductCategory, 
  toProductUniverse 
};

export type PrintCategory = 'Figures Pokémon' | 'Dioramas e Cenários' | 'Chibis / Miniaturas' | 'Acessórios Geek 3D' | 'Acessórios TCG (3D)';
export type TcgCategory = 'Booster Avulso' | 'Booster Box' | 'ETB' | 'Blister' | 'Deck' | 'Acessório Oficial';
export type Category = PrintCategory | TcgCategory | ProductCategory | 'Figures' | 'Acessórios & Colecionáveis' | 'TCG';
export type Scale = 'Mini (5 cm)' | 'Padrão (10 cm)' | 'Grande (20 cm)' | 'Escala 1:10 (~15 cm)' | 'Escala 1:1 (Real)';
export type Finish = 'Peça Crua' | 'Com Primer' | 'Pintado à Mão';
export type Material = 'PLA' | 'Resina' | string;

export interface FinishOption {
  label?: Finish | string;
  name?: string;
  extra: number;
  outOfStock?: boolean;
}

export interface Product {
  id: string;
  name: string;
  department?: 'PRINT_3D' | 'TCG';
  category: Category;
  universe?: ProductUniverse;
  types: PokemonType[];
  scales: Scale[];
  materials: Material[];
  basePrice: number;
  promoPrice?: number;
  finishOptions: FinishOption[];
  image: string;
  printTimeH: number;
  filamentG: number;
  active: boolean;
  featured?: boolean;
  expansionName?: string;
  stock?: number;
  stockQuantity?: number;
}

export const FINISH_OPTIONS: FinishOption[] = [
  { label: 'Peça Crua',       extra: 0 },
  { label: 'Com Primer',      extra: 25 },
  { label: 'Pintado à Mão',   extra: 85 },
];

export const products: Product[] = [];


export const TYPE_COLORS: Record<PokemonType, { text: string; bg: string; border?: string }> = {
  Normal:    { text: '#A8A29E', bg: 'rgba(168,162,158,0.15)' },
  Fogo:      { text: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  Água:      { text: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  Elétrico:  { text: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  Planta:    { text: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  Gelo:      { text: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
  Lutador:   { text: '#DC2626', bg: 'rgba(220,38,38,0.15)' },
  Veneno:    { text: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
  Terra:     { text: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  Voador:    { text: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  Psíquico:  { text: '#EC4899', bg: 'rgba(236,72,153,0.15)' },
  Inseto:    { text: '#84CC16', bg: 'rgba(132,204,22,0.15)' },
  Pedra:     { text: '#B45309', bg: 'rgba(180,83,9,0.15)' },
  Fantasma:  { text: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
  Dragão:    { text: '#4F46E5', bg: 'rgba(79,70,229,0.15)' },
  Escuridão: { text: '#C7D2FE', bg: '#312E81', border: '#4338CA' },
  Metálico:  { text: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  Fada:      { text: '#F472B6', bg: 'rgba(244,114,182,0.15)' },
};

export const ALL_TYPES: PokemonType[] = [
  'Normal', 'Fogo', 'Água', 'Elétrico', 'Planta', 'Gelo',
  'Lutador', 'Veneno', 'Terra', 'Voador', 'Psíquico', 'Inseto',
  'Pedra', 'Fantasma', 'Dragão', 'Escuridão', 'Metálico', 'Fada'
];

export const ALL_CATEGORIES: Category[] = ['Figures Pokémon', 'Dioramas e Cenários', 'Chibis / Miniaturas', 'Acessórios Geek 3D', 'Acessórios TCG (3D)'];
export const ALL_SCALES: Scale[] = ['Mini (5 cm)', 'Padrão (10 cm)', 'Grande (20 cm)', 'Escala 1:10 (~15 cm)', 'Escala 1:1 (Real)'];
export const ALL_FINISHES: Finish[] = ['Peça Crua','Com Primer','Pintado à Mão'];

export interface CartItem {
  product: Product;
  scale: Scale | string;
  finish: Finish | string;
  material: Material;
  qty: number;
  unitPrice: number;
  observations?: string;
  customized?: boolean;
  origin?: 'HERO_SHOWCASE' | 'CATALOG' | 'SEASONAL_CAMPAIGN' | string;
  promoPrice?: number;
  promoBadge?: string;
  campaignTag?: string;
  allowCouponStacking?: boolean;
}
