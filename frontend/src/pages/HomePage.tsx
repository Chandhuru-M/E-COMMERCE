import { HeroHighlight } from '../sections/HeroHighlight';
import { ProductGallery } from '../sections/ProductGallery';
import { ExperienceHighlights } from '../sections/ExperienceHighlights';

export const HomePage = () => {
  return (
    <div className="space-y-16">
      <HeroHighlight />
      <ProductGallery />
      <ExperienceHighlights />
    </div>
  );
};
