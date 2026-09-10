import { HERO_FOOD_IMG } from '../../utils/images';

export function FoodImage({ src, alt, className = '' }) {
  return (
    <img
      src={src || HERO_FOOD_IMG}
      alt={alt || 'Food product'}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = '/nexora.svg';
        e.currentTarget.classList.add('object-contain', 'p-6', 'opacity-40');
      }}
    />
  );
}
