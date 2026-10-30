import React from 'react';
import { FeaturedPromotionsCarousel } from './FeaturedPromotionsCarousel';
import type { Product } from '@/data/products';

export interface HeroShowcaseSliderProps {
  featuredProduct?: Product | null;
  products?: Product[];
  onConfigure?: (p: Product) => void;
  whatsappNumber?: string;
}

export function HeroShowcaseSlider({
  products = [],
  onConfigure,
  whatsappNumber = '5511982563005'
}: HeroShowcaseSliderProps) {
  return (
    <FeaturedPromotionsCarousel
      products={products}
      onConfigure={onConfigure}
      whatsappNumber={whatsappNumber}
    />
  );
}

export { FeaturedPromotionsCarousel };
