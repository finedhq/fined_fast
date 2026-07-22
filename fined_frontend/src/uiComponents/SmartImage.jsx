import React, { useState } from "react";

export default function SmartImage({
  src,
  alt,
  fill, // Ignore Next.js fill prop
  width,
  height,
  className = "",
  containerClassName = "",
  onClick
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div 
        className={`overflow-hidden flex items-center justify-center bg-gray-200 text-gray-400 ${containerClassName}`} 
        onClick={onClick}
      >
        <span className="text-sm font-medium">No Image</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${containerClassName}`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full block ${className}`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
