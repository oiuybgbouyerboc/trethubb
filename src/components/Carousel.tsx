import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
  '/bg1.jpg',
  '/bg2.jpg',
  '/bg3.jpg',
  '/bg4.jpg'
];

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((curr) => (curr === 0 ? images.length - 1 : curr - 1));
  };
  const nextSlide = () => {
    setCurrentIndex((curr) => (curr === images.length - 1 ? 0 : curr + 1));
  };

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl shadow-sm mb-8">
      <div 
        className="flex transition-transform ease-out duration-500" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, idx) => (
          <img key={idx} src={src} alt={`Product ${idx + 1}`} className="w-full object-cover flex-shrink-0" />
        ))}
      </div>
      
      <button 
        onClick={prevSlide} 
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white transition-colors"
      >
        <ChevronLeft size={20} className="text-gray-800" />
      </button>
      
      <button 
        onClick={nextSlide} 
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow hover:bg-white transition-colors"
      >
        <ChevronRight size={20} className="text-gray-800" />
      </button>
    </div>
  );
}
