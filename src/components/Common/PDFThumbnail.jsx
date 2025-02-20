import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { RiFileListLine } from 'react-icons/ri';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Initialize PDF.js worker with local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFThumbnail = ({ url, width = 48, height = 48 }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderPDF = async () => {
      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');

        // Calculate scale to fit the thumbnail size while maintaining aspect ratio
        const scale = Math.min(width / viewport.width, height / viewport.height) * 2; // Increase scale for better quality
        const scaledViewport = page.getViewport({ scale });

        // Set canvas size to double the display size for better quality
        canvas.width = width * 2;
        canvas.height = height * 2;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          enableWebGL: true
        };

        await page.render(renderContext).promise;
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF thumbnail:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderPDF();

    return () => {
      isMounted = false;
    };
  }, [url, width, height]);

  if (error || loading) {
    return (
      <div className="pdf-thumbnail fallback">
        <RiFileListLine size={24} />
        <span className="pdf-label">PDF</span>
      </div>
    );
  }

  return (
    <div className="pdf-thumbnail">
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'contain',
          borderRadius: '6px'
        }}
      />
      <span className="pdf-label">PDF</span>
    </div>
  );
};

export default PDFThumbnail;