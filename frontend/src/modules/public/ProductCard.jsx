import React, { useState } from "react";

export default function ProductCard({
  p,
  onAddToCart,
  onWishlistToggle,
  isInWishlist = false,
  onProductClick,
  dark = false,
}) {
  const product = p;
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  const handleAddToCart = () => onAddToCart?.(product, selectedSize);
  const handleWishlistToggle = (e) => { e.stopPropagation(); onWishlistToggle?.(product); };
  const handleProductClick = () => onProductClick?.(product);

  const fallbackImg =
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80";

  return (
    <div
      className={`group rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border ${
        dark ? "bg-gray-800 border-gray-700 hover:border-orange-400" : "bg-white border-gray-100 hover:border-orange-200"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleProductClick}
    >
      <div className="relative aspect-square overflow-hidden cursor-pointer">
        <img
          src={product.image}
          alt={`${product.name} - ${product.brand}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = fallbackImg; }}
        />

        <button
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 ${
            dark
              ? "bg-gray-900/90 text-orange-400 hover:bg-orange-400 hover:text-gray-900"
              : "bg-white/90 text-orange-600 hover:bg-orange-600 hover:text-white"
          } text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm flex items-center gap-1`}
          onClick={(e) => { e.stopPropagation(); handleProductClick(); }}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Quick View
        </button>

        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
            product.quantity <= (product.reorderThreshold ?? 5) ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          {product.quantity <= (product.reorderThreshold ?? 5) ? "Low Stock" : "In Stock"}
        </div>

        {Number(product.discount) > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-orange-600 text-white text-xs font-bold shadow-sm">
            -{product.discount}%
          </div>
        )}
      </div>

      <div className={`p-4 ${dark ? "text-white" : "text-gray-900"}`}>
        <div className="flex justify-between items-start">
          <div className="w-full">
            <h3 className={`font-bold line-clamp-1 ${dark ? "text-white" : "text-gray-900"}`}>{product.name}</h3>
            <p className={`text-sm mt-1 line-clamp-1 ${dark ? "text-gray-300" : "text-gray-500"}`}>{product.brand}</p>
          </div>

          <button
            className={`shrink-0 ml-2 transition-colors ${
              isInWishlist ? "text-red-500 fill-current" : dark ? "text-gray-400 hover:text-red-500" : "text-gray-300 hover:text-red-500"
            }`}
            onClick={handleWishlistToggle}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="mt-2 flex items-center">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-4 w-4 flex-shrink-0 ${star <= Math.floor(product.rating || 0) ? "text-yellow-400" : dark ? "text-gray-600" : "text-gray-300"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                  clipRule="evenodd"
                />
              </svg>
            ))}
          </div>
          <span className={`ml-1 text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>({product.reviews})</span>
        </div>

        {isHovered && product.sizes?.length > 0 && (
          <div className="mt-3">
            <div className={`text-xs mb-1 ${dark ? "text-gray-300" : "text-gray-500"}`}>Select size:</div>
            <div className="flex flex-wrap gap-1">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`text-xs px-2 py-1 rounded-md border ${
                    selectedSize === size
                      ? "bg-orange-600 border-orange-600 text-white"
                      : dark
                      ? "border-gray-600 hover:border-orange-400"
                      : "border-gray-300 hover:border-orange-400"
                  }`}
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-end gap-2">
            {Number(product.discount) > 0 ? (
              <>
                <span className={`text-lg font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}>
                  Rs. {Number(product.discountedPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-sm line-through ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  Rs. {Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </>
            ) : (
              <span className={`text-lg font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}>
                Rs. {Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        <button
          className={`mt-4 w-full ${dark ? "bg-orange-500 hover:bg-orange-600" : "bg-orange-600 hover:bg-orange-700"} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2`}
          onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 0 1 4 0z" />
          </svg>
          Add to Cart
        </button>

        <div className={`mt-2 text-xs ${dark ? "text-gray-400" : "text-gray-500"} opacity-0 group-hover:opacity-100 transition-opacity space-y-1`}>
          <div>Color: {product.color}</div>
          <div>Material: {product.material}</div>
          {Number(product.discount) > 0 && (
            <div className={`text-xs ${dark ? "bg-orange-900/30 text-orange-300" : "bg-orange-100 text-orange-800"} inline-block px-2 py-0.5 rounded`}>
              Save Rs. {(Number(product.price) - Number(product.discountedPrice)).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
