import React, { useState } from "react";
import { 
  FiX, 
  FiCopy, 
  FiCheck, 
  FiMail, 
  FiShare2, 
  FiExternalLink 
} from "react-icons/fi";
import { 
  FaWhatsapp, 
  FaXTwitter, 
  FaLinkedinIn, 
  FaTelegram, 
  FaRedditAlien 
} from "react-icons/fa6";
import toast from "react-hot-toast";

/**
 * ShareModal
 * Displays a live preview card with article thumbnail, title, and description,
 * along with 1-click sharing buttons for all major platforms.
 */
export default function ShareModal({ isOpen, onClose, article, description }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !article) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const articleTitle = article.title || "FinEd Article";
  const articleExcerpt = description || article.description || "Read this insightful financial guide on FinEd.";
  const articleImage = article.image_url || "/assets/images/fined_card_banner.png";
  const articleTag = article.tag || "Finance";

  // Pre-formatted share text for social platforms
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(articleTitle);
  const encodedSummary = encodeURIComponent(
    `📈 ${articleTitle}\n\n${articleExcerpt.length > 140 ? articleExcerpt.substring(0, 137) + "..." : articleExcerpt}\n\nRead more on FinEd:`
  );

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={20} />,
      color: "#25D366",
      bg: "rgba(37, 211, 102, 0.12)",
      url: `https://api.whatsapp.com/send?text=${encodedSummary}%20${encodedUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: <FaXTwitter size={18} />,
      color: "#000000",
      bg: "rgba(0, 0, 0, 0.08)",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(articleTitle)}&url=${encodedUrl}&via=FinEd`,
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn size={18} />,
      color: "#0A66C2",
      bg: "rgba(10, 102, 194, 0.12)",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: <FaTelegram size={19} />,
      color: "#229ED9",
      bg: "rgba(34, 158, 217, 0.12)",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(articleTitle + " — " + articleExcerpt)}`,
    },
    {
      name: "Reddit",
      icon: <FaRedditAlien size={20} />,
      color: "#FF4500",
      bg: "rgba(255, 69, 0, 0.12)",
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      name: "Email",
      icon: <FiMail size={19} />,
      color: "#4B5563",
      bg: "rgba(75, 85, 99, 0.12)",
      url: `mailto:?subject=${encodeURIComponent("Interesting Article: " + articleTitle)}&body=${encodedSummary}%0A%0A${encodedUrl}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = currentUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Link copied to clipboard!", {
        duration: 3000,
        position: "bottom-center",
        style: {
          borderRadius: "10px",
          background: "#1F2937",
          color: "#fff",
          fontSize: "14px",
          fontWeight: "500",
        },
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: articleTitle,
          text: `${articleTitle} — ${articleExcerpt}`,
          url: currentUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }
  };

  return (
    <div 
      className="share-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div 
        className="share-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "480px",
          maxHeight: "92vh",
          overflowY: "auto",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px 12px 24px",
          borderBottom: "1px solid #f1f5f9",
          position: "sticky",
          top: 0,
          backgroundColor: "#ffffff",
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#EEF2FF",
              color: "#4A3AFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px"
            }}>
              <FiShare2 />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0F172A" }}>
                Share this Article
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                Spread financial knowledge with friends & colleagues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            style={{
              background: "#F8FAFC",
              border: "none",
              cursor: "pointer",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F1F5F9";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFC";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Live Preview Card */}
          <div style={{
            backgroundColor: "#F8FAFC",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.2s ease",
          }}>
            {articleImage && (
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                backgroundColor: "#E2E8F0",
                overflow: "hidden",
              }}>
                <img 
                  src={articleImage} 
                  alt={articleTitle}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    // Fallback to a gradient pattern if the image fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(4px)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}>
                  {articleTag}
                </span>
              </div>
            )}
            <div style={{ padding: "14px 16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#4A3AFF", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                myfined.com
              </span>
              <h4 style={{
                margin: "4px 0 6px 0",
                fontSize: "15px",
                fontWeight: "700",
                color: "#0F172A",
                lineHeight: "1.35",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {articleTitle}
              </h4>
              <p style={{
                margin: 0,
                fontSize: "12.5px",
                color: "#64748B",
                lineHeight: "1.4",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {articleExcerpt}
              </p>
            </div>
          </div>

          {/* Social Platform Grid */}
          <div>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "600", 
              color: "#64748B", 
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.03em"
            }}>
              Share to
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}>
              {shareLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    backgroundColor: item.bg,
                    color: item.color,
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Copy Link Bar */}
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#F1F5F9",
              padding: "6px 6px 6px 14px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
            }}>
              <input
                type="text"
                readOnly
                value={currentUrl}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  color: "#475569",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: copied ? "#10B981" : "#4A3AFF",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                {copied ? <FiCheck size={16} /> : <FiCopy size={15} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Native Mobile Share Button (if supported) */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: "10px",
                color: "#475569",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
            >
              <FiExternalLink size={15} />
              <span>Open Device Share Menu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
