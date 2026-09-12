import React from 'react';

const GiftBoxIllustration = ({ className = "rewards-gift-svg", size = 180 }) => {
  return (
    <div 
      className={`gift-box-illustration-wrapper ${className}`} 
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="gift-box-svg-element"
      >
        <defs>
          {/* Gradients for 3D Purple Gift Box */}
          <linearGradient id="boxTopGrad" x1="60" y1="70" x2="160" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>

          <linearGradient id="boxLeftGrad" x1="45" y1="110" x2="110" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5b21b6" />
            <stop offset="100%" stopColor="#431407" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>

          <linearGradient id="boxRightGrad" x1="110" y1="110" x2="175" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>

          {/* Golden Ribbon Gradients */}
          <linearGradient id="ribbonGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="ribbonGoldDark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Gold Star Coin Gradients */}
          <radialGradient id="coinFace" cx="60%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          <linearGradient id="coinRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          <linearGradient id="starEmbross" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Soft Shadow Filter */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#3b0764" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* --- Ambient Floor Shadow --- */}
        <ellipse cx="115" cy="202" rx="72" ry="18" fill="#1e1b4b" opacity="0.18" filter="blur(8px)" />

        {/* --- Floating Confetti Particles (Animated with CSS) --- */}
        <g className="gift-confetti-group">
          {/* Gold Spirals */}
          <path 
            d="M38 65 C32 58 45 48 38 40 C32 32 44 24 38 18" 
            stroke="#f59e0b" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
            className="confetti-spiral-1"
          />
          <path 
            d="M175 45 C182 38 172 28 180 20 C186 14 176 8 182 2" 
            stroke="#f59e0b" 
            strokeWidth="3" 
            strokeLinecap="round" 
            fill="none" 
            className="confetti-spiral-2"
          />

          {/* Purple / Blue Diamonds */}
          <polygon points="52,90 58,84 64,90 58,96" fill="#8b5cf6" className="confetti-particle-1" />
          <polygon points="195,85 201,79 207,85 201,91" fill="#6366f1" className="confetti-particle-2" />
          <polygon points="148,42 153,37 158,42 153,47" fill="#a855f7" className="confetti-particle-3" />
          <polygon points="30,120 35,115 40,120 35,125" fill="#a855f7" className="confetti-particle-4" />

          {/* Gold Sparkle Stars */}
          <path d="M72 35 L74 41 L80 43 L74 45 L72 51 L70 45 L64 43 L70 41 Z" fill="#fbbf24" className="sparkle-star-1" />
          <path d="M198 120 L200 124 L204 125 L200 126 L198 130 L196 126 L192 125 L196 124 Z" fill="#fbbf24" className="sparkle-star-2" />
          <path d="M162 70 L163 73 L166 74 L163 75 L162 78 L161 75 L158 74 L161 73 Z" fill="#fde047" className="sparkle-star-3" />

          {/* Dots / Small Confetti */}
          <circle cx="48" cy="142" r="3.5" fill="#fbbf24" />
          <circle cx="188" cy="62" r="3" fill="#ec4899" />
          <circle cx="95" cy="30" r="2.5" fill="#60a5fa" />
          <circle cx="168" cy="180" r="3" fill="#a78bfa" />
        </g>

        {/* --- 3D Main Gift Box Body --- */}
        <g className="gift-box-main" filter="url(#softShadow)">
          {/* Left Face */}
          <path d="M48 112 L112 148 V200 L48 164 Z" fill="url(#boxLeftGrad)" />

          {/* Right Face */}
          <path d="M112 148 L176 112 V164 L112 200 Z" fill="url(#boxRightGrad)" />

          {/* Top Face */}
          <path d="M112 76 L176 112 L112 148 L48 112 Z" fill="url(#boxTopGrad)" />

          {/* --- Box Lid Edge (Adds extra 3D lip) --- */}
          <path d="M44 110 L112 148 L180 110 L112 72 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

          {/* --- Gold Ribbons on Box --- */}
          {/* Top Face Ribbon (Vertical) */}
          <polygon points="104,80 120,72 120,144 104,148" fill="url(#ribbonGold)" opacity="0.95" />
          {/* Top Face Ribbon (Horizontal) */}
          <polygon points="76,96 148,136 140,140 68,100" fill="url(#ribbonGold)" opacity="0.9" />

          {/* Left Face Vertical Ribbon */}
          <polygon points="76,128 88,135 88,187 76,180" fill="url(#ribbonGoldDark)" />

          {/* Right Face Vertical Ribbon */}
          <polygon points="140,132 152,126 152,178 140,184" fill="url(#ribbonGold)" />

          {/* --- 3D Gold Ribbon Bow Loops on Top --- */}
          {/* Left Bow Loop */}
          <path 
            d="M112 80 C92 56 68 62 76 80 C82 92 104 88 112 82 Z" 
            fill="url(#ribbonGold)" 
            stroke="#b45309" 
            strokeWidth="0.8"
          />
          <path 
            d="M106 80 C95 65 78 70 82 80 C85 86 98 84 106 80 Z" 
            fill="#d97706" 
            opacity="0.6"
          />

          {/* Right Bow Loop */}
          <path 
            d="M112 80 C132 56 156 62 148 80 C142 92 120 88 112 82 Z" 
            fill="url(#ribbonGold)" 
            stroke="#b45309" 
            strokeWidth="0.8"
          />
          <path 
            d="M118 80 C129 65 146 70 142 80 C139 86 126 84 118 80 Z" 
            fill="#d97706" 
            opacity="0.6"
          />

          {/* Bow Center Knot */}
          <ellipse cx="112" cy="80" rx="9" ry="7" fill="url(#ribbonGold)" stroke="#b45309" strokeWidth="0.8" />
          <ellipse cx="112" cy="78" rx="5" ry="3" fill="#fef08a" opacity="0.8" />

          {/* Ribbon Tails */}
          <path d="M108 84 C100 95 90 98 85 106 C92 104 102 98 110 88 Z" fill="url(#ribbonGoldDark)" />
          <path d="M116 84 C124 95 134 98 139 106 C132 104 122 98 114 88 Z" fill="url(#ribbonGold)" />
        </g>

        {/* --- 3D Gold Star Coin (Standing at Right) --- */}
        <g className="gift-gold-coin" filter="url(#softShadow)">
          {/* Coin 3D Rim / Thickness */}
          <ellipse cx="180" cy="158" rx="34" ry="34" fill="url(#coinRim)" />
          <ellipse cx="178" cy="156" rx="33" ry="33" fill="#92400e" />

          {/* Coin Front Face */}
          <ellipse cx="176" cy="154" rx="32" ry="32" fill="url(#coinFace)" stroke="#fef08a" strokeWidth="1.5" />

          {/* Inner Inset Ring */}
          <ellipse cx="176" cy="154" rx="26" ry="26" fill="none" stroke="#ca8a04" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* 3D Embossed Star on Coin */}
          <g transform="translate(176, 154) scale(0.95)">
            <polygon 
              points="0,-18 5,-5 18,-5 8,4 12,17 0,9 -12,17 -8,4 -18,-5 -5,-5" 
              fill="url(#starEmbross)" 
              stroke="#b45309" 
              strokeWidth="1"
            />
            {/* Star Bevel Highlights */}
            <polygon points="0,-18 0,9 -12,17 -8,4" fill="#fbbf24" opacity="0.5" />
            <polygon points="0,-18 0,9 12,17 8,4" fill="#fef08a" opacity="0.7" />
          </g>

          {/* Coin Specular Glint */}
          <ellipse cx="164" cy="136" rx="6" ry="3" fill="#ffffff" opacity="0.6" transform="rotate(-30 164 136)" />
        </g>
      </svg>
    </div>
  );
};

export default GiftBoxIllustration;
