import React from "react";

export const PageLoader = () => {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100vw",
      backgroundColor: "#f9fafb",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px"
      }}>
        {/* Simple CSS Spinner */}
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(74, 58, 255, 0.2)",
          borderTopColor: "#4A3AFF",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
      </div>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
