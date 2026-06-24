import { useState, useEffect } from "react";

export default function SmartImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  onLoad,
  onError,
  ...rest
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset states if the source URL changes (e.g. inside a carousel)
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  // Handle case where src is explicitly null, undefined, or empty string
  const hasValidSrc = src && src.trim() !== "";
  return (
    <div className={`relative overflow-hidden isolate ${containerClassName}`}>
      {/* 1. LOADING SKELETON */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-200 animate-pulse">
        </div>
      )}

      {/* 2. ERROR / EMPTY STATE */}
      {(!hasValidSrc || error) && !loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
          <span className="text-2xl mb-1">📷</span>
          <span className="text-xs font-medium">No Image</span>
        </div>
      )}

      {/* 3. ACTUAL STANDARD IMAGE */}
      {hasValidSrc && !error && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"} ${className}`}
          onLoad={(e) => {
            if (onLoad) { onLoad(e) }
            setLoading(false);
          }}
          onError={(e) => {
            if (onError) { onError(e) }
            setLoading(false);
            setError(true);
          }}
          {...rest}
        />
      )}
    </div>
  );
}