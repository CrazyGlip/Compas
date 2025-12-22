
import React from 'react';

interface ImageCarouselProps {
    images?: string[];
    title?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title = "Фотогалерея" }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="space-y-3 py-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">{title}</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 px-1 no-scrollbar snap-x">
                {images.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0 snap-center">
                        <img 
                            src={img} 
                            alt={`Gallery ${idx}`} 
                            className="h-48 w-72 object-cover rounded-2xl shadow-md border border-slate-200 dark:border-white/10"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageCarousel;
