import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CertificateGenerator.css';
import footerLogo from '../../assets/fined-footer-logo.png';

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
        
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
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
      <div className="certificate" ref={certificateRef}>

        {/* Decorative background */}
        <div className="top-left-purple"></div>
        <div className="top-left-yellow-line"></div>
        <div className="top-right-circle"></div>
        
        <div className="gold-lines">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>

        <div className="bottom-left-light"></div>
        <div className="bottom-right-yellow"></div>
        <div className="bottom-right-curve"></div>

        {/* Dots */}
        <div className="dot-grid dots-top-left">
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
        </div>

        <div className="dot-grid dots-bottom-right">
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
        </div>

        <div className="dot-grid dots-bottom-left">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
        </div>

        {/* Inner border */}
        <div className="inner-border"></div>

        {/* Logo */}
        <div className="logo">
            <img src={footerLogo} alt="FinEd Logo" style={{ height: "100px", width: "auto", margin: "0 auto" }} />
        </div>

        {/* Main certificate content */}
        <div className="content">
            <div className="certificate-title">CERTIFICATE</div>
            <div className="subtitle">OF COMPLETION</div>
            
            <div className="certify-text" style={{ marginTop: "60px" }}>This is to certify that</div>
            
            <div className="name">
                {userName ? userName.toUpperCase() : "STUDENT NAME"}
            </div>
            
            <div className="course-prefix">
                has successfully completed the course
            </div>
            
            <div className="course">
                {courseName ? courseName.toUpperCase() : "COURSE NAME"}
            </div>

            {/* Date */}
            <div className="date-section">
                <div className="separator"></div>
                <div className="date">
                    {formattedDate}
                </div>
                <div className="date-caption">
                    DATE OF COMPLETION
                </div>
            </div>
        </div>

      </div>
    </div>
  );
});

export default CertificateGenerator;
