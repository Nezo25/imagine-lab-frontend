export type Category = 
  | 'Decoração & Geek'
  | 'Action Figures & Anime'
  | 'Peças Técnicas & Funcionais'
  | 'Litofanias & Luminárias'
  | 'Troféus & Colecionáveis';

export type Scale = 
  | 'Mini (5 a 8 cm)'
  | 'Padrão (12 a 15 cm)'
  | 'Grande (20 a 25 cm)'
  | 'Colecionador (30+ cm)'
  | 'Sob Medida';

export type Finish = 
  | 'Peça Crua (Padrão)'
  | 'Com Primer Cinza'
  | 'Pintado à Mão Profissional';

export type Material = 
  | 'PLA Premium'
  | 'PLA Silk (Metalizado)'
  | 'PETG Técnico'
  | 'Resina 8K Ultra-Detalhe'
  | 'ABS High-Temp';

export interface FinishOption {
  label: Finish;
  extra: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  tags: string[];
  scales: Scale[];
  materials: Material[];
  basePrice: number;
  finishOptions: FinishOption[];
  image: string;
  printTimeH: number;
  filamentG: number;
  active: boolean;
  featured?: boolean;
  department?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  scale: Scale | string;
  finish: Finish | string;
  material: Material | string;
  color?: string;
  qty: number;
  unitPrice: number;
  observations?: string;
  customized?: boolean;
  // Propriedades específicas de orçamento STL personalizado
  isCustom3D?: boolean;
  stlFileName?: string;
  infillPercent?: number;
  layerHeightMm?: number;
  estimatedWeightG?: number;
  dimensionsMm?: { x: number; y: number; z: number };
}

export const ALL_CATEGORIES: Category[] = [
  'Decoração & Geek',
  'Action Figures & Anime',
  'Peças Técnicas & Funcionais',
  'Litofanias & Luminárias',
  'Troféus & Colecionáveis'
];

export const ALL_MATERIALS: Material[] = [
  'PLA Premium',
  'PLA Silk (Metalizado)',
  'PETG Técnico',
  'Resina 8K Ultra-Detalhe',
  'ABS High-Temp'
];

export const ALL_SCALES: Scale[] = [
  'Mini (5 a 8 cm)',
  'Padrão (12 a 15 cm)',
  'Grande (20 a 25 cm)',
  'Colecionador (30+ cm)',
  'Sob Medida'
];

export const COLOR_PALETTE = [
  { name: 'Roxo ImagineLab', hex: '#5E488C' },
  { name: 'Ciano Piscina Neon', hex: '#4CA8B8' },
  { name: 'Preto Fosco Stealth', hex: '#1E232B' },
  { name: 'Branco Neve Puro', hex: '#F1F5F9' },
  { name: 'Cinza Titânio', hex: '#64748B' },
  { name: 'Dourado Seda (Silk Gold)', hex: '#D4AF37' },
  { name: 'Cobre Metálico', hex: '#B87333' },
  { name: 'Vermelho Rubi', hex: '#E11D48' },
  { name: 'Azul Cósmico', hex: '#2563EB' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Laranja Elétrico', hex: '#F97316' },
  { name: 'Resina Cinza Ultra-High', hex: '#475569' },
];

export const DEFAULT_FINISH_OPTIONS: FinishOption[] = [
  { label: 'Peça Crua (Padrão)', extra: 0 },
  { label: 'Com Primer Cinza', extra: 25 },
  { label: 'Pintado à Mão Profissional', extra: 90 },
];

export const initialProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Luminária Litofania Cubo Personalizada',
    category: 'Litofanias & Luminárias',
    tags: ['Personalizado', 'Foto', 'LED', 'Decoração'],
    scales: ['Padrão (12 a 15 cm)', 'Grande (20 a 25 cm)'],
    materials: ['PLA Premium', 'PLA Silk (Metalizado)'],
    basePrice: 129.90,
    finishOptions: [
      { label: 'Peça Crua (Padrão)', extra: 0 },
      { label: 'Com Primer Cinza', extra: 15 },
    ],
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
    printTimeH: 14,
    filamentG: 220,
    active: true,
    featured: true,
    description: 'Transforme momentos especiais em arte iluminada em 3D. 4 fotos gravadas em relevo com base embutida para LED suave.'
  },
  {
    id: 'prod_2',
    name: 'Suporte de Headset Cyber Skull Geometric',
    category: 'Decoração & Geek',
    tags: ['Geek', 'Setup', 'Gamer', 'Design'],
    scales: ['Grande (20 a 25 cm)'],
    materials: ['PLA Silk (Metalizado)', 'PETG Técnico', 'PLA Premium'],
    basePrice: 149.00,
    finishOptions: DEFAULT_FINISH_OPTIONS,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    printTimeH: 18,
    filamentG: 340,
    active: true,
    featured: true,
    description: 'Design facetado poligonal moderno para compor setups gamers e profissionais com centro de gravidade perfeitamente balanceado.'
  },
  {
    id: 'prod_3',
    name: 'Estátua Cavaleiro Guerreiro Medieval 8K',
    category: 'Action Figures & Anime',
    tags: ['Figure', 'Colecionador', 'Resina', 'RPG'],
    scales: ['Padrão (12 a 15 cm)', 'Colecionador (30+ cm)'],
    materials: ['Resina 8K Ultra-Detalhe', 'PLA Premium'],
    basePrice: 219.00,
    finishOptions: DEFAULT_FINISH_OPTIONS,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    printTimeH: 22,
    filamentG: 280,
    active: true,
    featured: true,
    description: 'Detalhamento microscópico em armaduras, armas e texturas de tecido, impresso em resina fotopolimerizável de alta resolução.'
  },
  {
    id: 'prod_4',
    name: 'Suporte Articulado MagSafe & Smartphone',
    category: 'Peças Técnicas & Funcionais',
    tags: ['Mesa', 'Engenharia', 'Home Office', 'Útil'],
    scales: ['Padrão (12 a 15 cm)'],
    materials: ['PETG Técnico', 'ABS High-Temp'],
    basePrice: 69.90,
    finishOptions: [{ label: 'Peça Crua (Padrão)', extra: 0 }],
    image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80',
    printTimeH: 6,
    filamentG: 110,
    active: true,
    featured: false,
    description: 'Impresso em PETG resistente ao calor e esforço mecânico com canal para passagem de cabos e regulagem de inclinação.'
  },
  {
    id: 'prod_5',
    name: 'Vaso Fractal Origami em Espiral Silk',
    category: 'Decoração & Geek',
    tags: ['Decoração', 'Design', 'Minimalista', 'Silk'],
    scales: ['Padrão (12 a 15 cm)', 'Grande (20 a 25 cm)'],
    materials: ['PLA Silk (Metalizado)', 'PLA Premium'],
    basePrice: 89.00,
    finishOptions: [{ label: 'Peça Crua (Padrão)', extra: 0 }],
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80',
    printTimeH: 9,
    filamentG: 160,
    active: true,
    featured: true,
    description: 'Curvas hipnotizantes com reflexo metálico acetinado que transformam qualquer ambiente residencial ou corporativo.'
  },
  {
    id: 'prod_6',
    name: 'Troféu Hexagonal Corporativo com Logo 3D',
    category: 'Troféus & Colecionáveis',
    tags: ['Empresarial', 'Brinde', 'Troféu', 'Eventos'],
    scales: ['Padrão (12 a 15 cm)', 'Grande (20 a 25 cm)'],
    materials: ['PLA Silk (Metalizado)', 'Resina 8K Ultra-Detalhe', 'PETG Técnico'],
    basePrice: 110.00,
    finishOptions: DEFAULT_FINISH_OPTIONS,
    image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80',
    printTimeH: 11,
    filamentG: 190,
    active: true,
    featured: false,
    description: 'Desenvolvido sob encomenda para homenagens, campeonatos de e-Sports e premiações com personalização direta no modelo.'
  }
];
