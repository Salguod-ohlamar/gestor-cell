import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader

const BannerCarousel = ({ banners }) => {
    if (!banners || banners.length === 0) {
        return null; // Don't render anything if there are no banners
    }

    return (
        <Carousel
            autoPlay
            infiniteLoop
            showThumbs={false}
            showStatus={false}
            interval={5000}
            className="rounded-2xl overflow-hidden shadow-2xl"
        >
            {banners.map(banner => (
                <div key={banner.id} className="relative h-64 md:h-96">
                    <img src={banner.image_url} alt={banner.title || 'Banner promocional'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="text-center text-white max-w-2xl">
                            {banner.title && <h2 className="text-2xl md:text-4xl font-bold mb-2">{banner.title}</h2>}
                            {banner.text && <p className="text-md md:text-xl">{banner.text}</p>}
                            {banner.link_url && (
                                <a href={banner.link_url} className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition-colors">
                                    Saiba Mais
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </Carousel>
    );
};

export default BannerCarousel;