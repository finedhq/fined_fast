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

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="cert-offscreen-container">
      <div className="cert-container" ref={certificateRef}>
        <div className="cert-inner">
          <div className="cert-header">
            <h1 className="cert-logo">FinEd</h1>
            <div className="cert-title">Certificate of Completion</div>
          </div>
          
          <div className="cert-body">
            <p className="cert-presented">This is to certify that</p>
            <h2 className="cert-name">{userName || "Student Name"}</h2>
            <p className="cert-completed">has successfully completed the course</p>
            <h3 className="cert-course">{courseName || "Course Name"}</h3>
          </div>
          
          <div className="cert-footer">
            <div className="cert-signature-block">
              <div className="cert-date">{today}</div>
              <div className="cert-line"></div>
              <div className="cert-signature-label">Date</div>
            </div>
            
            <div className="cert-seal">
              <div className="cert-seal-inner">Official</div>
            </div>
            
            <div className="cert-signature-block">
              <div className="cert-signature">FinEd Team</div>
              <div className="cert-line"></div>
              <div className="cert-signature-label">Instructors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateGenerator;
