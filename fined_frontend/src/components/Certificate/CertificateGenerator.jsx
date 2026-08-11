import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CertificateGenerator.css';

const CertificateGenerator = forwardRef(({ userName, courseName }, ref) => {
  const certificateRef = useRef(null);

  useImperativeHandle(ref, () => ({
    downloadPDF: async () => {
      const element = certificateRef.current;
      if (!element) return;
      
      try {
        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`FinEd_Certificate_${courseName.replace(/\s+/g, '_')}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  }));

  const dateObj = new Date();
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
  const year = dateObj.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;

  return (
    <div className="cert-offscreen-container">
      <div className="cert-container" ref={certificateRef}>
        <div className="cert-inner">
          {/* Background Decorations */}
          <div className="bg-shape top-left-blob"></div>
          <div className="bg-shape top-left-blob-outline"></div>
          <div className="bg-shape top-right-blob"></div>
          <div className="bg-shape top-right-hatching"></div>
          <div className="bg-shape bottom-left-blob"></div>
          <div className="bg-shape bottom-left-line"></div>
          <div className="bg-shape bottom-right-blob"></div>
          <div className="bg-shape bottom-right-line"></div>
          
          {/* Dot grids */}
          <div className="bg-dots top-left-dots"></div>
          <div className="bg-dots bottom-left-dots"></div>
          <div className="bg-dots bottom-right-dots"></div>

          <div className="cert-content">
            <div className="cert-logo-container">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Graduation cap */}
                <path d="M50 15L15 32.5L50 50L85 32.5L50 15Z" fill="#312270"/>
                <path d="M25 37.5V60C25 68 35 75 50 75C65 75 75 68 75 60V37.5" fill="#312270"/>
                <path d="M85 32.5V55" stroke="#312270" strokeWidth="4"/>
                <path d="M85 55L90 65H80L85 55Z" fill="#312270"/>
                
                {/* Document with Rupee */}
                <rect x="40" y="35" width="35" height="40" rx="2" fill="#F5A623"/>
                <rect x="35" y="30" width="35" height="40" rx="2" fill="#FFFFFF"/>
                <path d="M45 42H58M45 48H58M49 42V56M52 48L57 56" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="cert-brand">Fin<span className="brand-highlight">Ed</span></div>
            </div>
            
            <div className="cert-title-primary">CERTIFICATE</div>
            <div className="cert-title-secondary">OF COMPLETION</div>
            <div className="cert-separator-small"></div>
            
            <p className="cert-presented">This is to certify that</p>
            <h2 className="cert-name">{userName ? userName.toUpperCase() : "STUDENT NAME"}</h2>
            
            <p className="cert-completed">has successfully completed the course</p>
            <h3 className="cert-course">{courseName ? courseName.toUpperCase() : "COURSE NAME"}</h3>
            
            <div className="cert-footer-new">
              <div className="cert-date">{formattedDate}</div>
              <div className="cert-date-label">DATE OF COMPLETION</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateGenerator;
