import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Image as ImageIcon } from 'lucide-react';
import { GalleryItem } from '../types';

interface GallerySectionProps {
  galleryItems: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ galleryItems }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['all', 'Treatment Environment', 'Reception', 'Clinic', 'Dental Equipment'];

  const filteredItems = selectedCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === selectedCategory);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const prevLightbox = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  const nextLightbox = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  };

  return (
    <section id="gallery" className="py-16 lg:py-24 bg-neutral-50/70 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
              Visual Tour
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Clinic & Facilities
            </h2>
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            Tour our clinic space in Ganagi Complex, designed for patient tranquility, sterile hygiene, and clinical comfort.
          </p>
        </div>

        {/* Category Controls (Functional Segmented Buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Spaces' : cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openLightbox(idx)}
              className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src={item.image_url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-xs">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block mb-1">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  {item.is_verified ? 'Verified Clinic Photograph' : 'Clinical Space Overview'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={prevLightbox}
              className="absolute left-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextLightbox}
              className="absolute right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
              <img
                src={filteredItems[lightboxIndex].image_url}
                alt={filteredItems[lightboxIndex].title}
                className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
              <div className="mt-4 text-center text-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                  {filteredItems[lightboxIndex].category}
                </span>
                <h3 className="text-lg font-bold">
                  {filteredItems[lightboxIndex].title}
                </h3>
                <p className="text-xs text-white/70 mt-1 max-w-md mx-auto">
                  {filteredItems[lightboxIndex].caption}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
