import React from "react";

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
  return (
    <div className={`overflow-hidden ${containerClassName}`} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full block ${className}`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder.png'; // Fallback
        }}
      />
    </div>
  );
}
