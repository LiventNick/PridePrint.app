import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UploadCloud, 
  File as FileIcon, 
  Trash2, 
  GripVertical, 
  Printer, 
  Copy,
  Info,
  Loader2,
  Plus
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useError } from '../contexts/ErrorContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfFile {
  id: string;
  file: globalThis.File;
}

function SortableFileItem({ item, onRemove }: { item: PdfFile; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="file-item">
      <div className="file-info">
        <div {...attributes} {...listeners} className="drag-handle">
          <GripVertical size={18} />
        </div>
        <FileIcon size={18} className="layout-icon" />
        <span className="file-name" title={item.file.name}>{item.file.name}</span>
      </div>
      <button 
        className="remove-btn" 
        onClick={() => onRemove(item.id)}
        aria-label="Remove file"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

async function rasterizePageToImageBytes(file: globalThis.File, pageIndex: number): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageIndex + 1);
  
  const viewport = page.getViewport({ scale: 4.0 }); 
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  if (context) {
    context.fillStyle = 'white'; 
    context.fillRect(0, 0, canvas.width, canvas.height);
    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
  }
  
  return new Promise((resolve, reject) => {
     canvas.toBlob((blob) => {
        if (blob) {
           blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
        } else {
           reject(new Error("Canvas toBlob failed"));
        }
     }, 'image/jpeg', 0.95);
  });
}

function PosterOptimizer() {
  const { showError } = useError();
  useEffect(() => {
    document.title = "Poster Optimizer - Nick's Pride Print Shop";
  }, []);

  const [files, setFiles] = useState<PdfFile[]>([]);
  const [layoutMode, setLayoutMode] = useState<'1-up' | '2-up'>('1-up');
  const [rasterize, setRasterize] = useState(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFilesAdded = (newFiles: globalThis.File[]) => {
    const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) return;
    
    const newItems = pdfs.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file
    }));
    setFiles(prev => [...prev, ...newItems]);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const generatePdfBytes = useCallback(async () => {
    if (files.length === 0) return null;
    
    const finalPdf = await PDFDocument.create();
    const LETTER_WIDTH = 612; 
    const LETTER_HEIGHT = 792; 
    const MARGIN = 18; 

    if (layoutMode === '1-up') {
      for (const item of files) {
        const fileBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const pagesCount = pdf.getPageCount();
        
        for (let i = 0; i < pagesCount; i++) {
          const page = finalPdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
          
          let drawSource: any;
          if (rasterize) {
             const imageBytes = await rasterizePageToImageBytes(item.file, i);
             drawSource = await finalPdf.embedJpg(imageBytes);
          } else {
             const [embeddedPage] = await finalPdf.embedPdf(pdf, [i]);
             drawSource = embeddedPage;
          }
          
          const scale = Math.min(
            (LETTER_WIDTH - 2 * MARGIN) / drawSource.width,
            (LETTER_HEIGHT - 2 * MARGIN) / drawSource.height
          );
          
          const scaledWidth = drawSource.width * scale;
          const scaledHeight = drawSource.height * scale;
          
          const drawOptions = {
            x: (LETTER_WIDTH - scaledWidth) / 2,
            y: (LETTER_HEIGHT - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
          };

          if (rasterize) {
             page.drawImage(drawSource, drawOptions);
          } else {
             page.drawPage(drawSource, drawOptions);
          }
        }
      }
    } else {
      const allSources: any[] = [];
      for (const item of files) {
        const fileBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const numPages = pdf.getPageCount();
        
        for (let i = 0; i < numPages; i++) {
           if (rasterize) {
              const imageBytes = await rasterizePageToImageBytes(item.file, i);
              const drawSource = await finalPdf.embedJpg(imageBytes);
              allSources.push({ type: 'image', source: drawSource });
           } else {
              const [embeddedPage] = await finalPdf.embedPdf(pdf, [i]);
              allSources.push({ type: 'page', source: embeddedPage });
           }
        }
      }
      
      for(let i = 0; i < allSources.length; i += 2) {
         const page = finalPdf.addPage([LETTER_HEIGHT, LETTER_WIDTH]); 
         const leftItem = allSources[i];
         const rightItem = allSources[i+1];
         
         const cellWidth = (LETTER_HEIGHT / 2) - (MARGIN * 1.5);
         const cellHeight = LETTER_WIDTH - (MARGIN * 2);
         
         if (leftItem) {
            const drawSource = leftItem.source;
            const scale = Math.min(cellWidth / drawSource.width, cellHeight / drawSource.height);
            const w = drawSource.width * scale;
            const h = drawSource.height * scale;
            const drawOptions = {
               x: MARGIN + (cellWidth - w) / 2,
               y: MARGIN + (cellHeight - h) / 2,
               width: w,
               height: h
            };
            if (leftItem.type === 'image') page.drawImage(drawSource, drawOptions);
            else page.drawPage(drawSource, drawOptions);
         }
         
         if (rightItem) {
            const drawSource = rightItem.source;
            const scale = Math.min(cellWidth / drawSource.width, cellHeight / drawSource.height);
            const w = drawSource.width * scale;
            const h = drawSource.height * scale;
            const drawOptions = {
               x: (LETTER_HEIGHT / 2) + (MARGIN / 2) + (cellWidth - w) / 2,
               y: MARGIN + (cellHeight - h) / 2,
               width: w,
               height: h
            };
            if (rightItem.type === 'image') page.drawImage(drawSource, drawOptions);
            else page.drawPage(drawSource, drawOptions);
         }
      }
    }

    return await finalPdf.save();
  }, [files, layoutMode, rasterize]);

  useEffect(() => {
    let isMounted = true;
    let urlToRevoke: string | null = null;
    
    const updatePreview = async () => {
      if (files.length === 0) {
        setPreviewUrl(null);
        setIsPreviewGenerating(false);
        return;
      }
      
      setIsPreviewGenerating(true);
      try {
        const bytes = await generatePdfBytes();
        if (!isMounted || !bytes) {
           setIsPreviewGenerating(false);
           return;
        }
        
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        urlToRevoke = url;
      } catch (err) {
        console.error("Error generating preview:", err);
      } finally {
        if (isMounted) setIsPreviewGenerating(false);
      }
    };
    
    const timeoutId = setTimeout(updatePreview, 600);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [generatePdfBytes, files.length]); 

  const downloadPDF = async () => {
    if (files.length === 0) return;
    setIsGeneratingDownload(true);
    
    try {
      const pdfBytes = await generatePdfBytes();
      if (!pdfBytes) return;
      
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `print_ready_${layoutMode}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showError('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>PDF Poster Optimizer</h1>
        <p>Perfectly scale your Canva exports for regular printing</p>
      </header>

      <main className="main-content">
        <div className="left-column">
          <div className="instructions-banner glass-panel">
            <Info size={24} className="info-icon" />
            <div className="instructions-text">
              <strong>How to use</strong>
              <p>Download your poster as a <strong>PDF Print</strong> in Canva (we highly recommend checking the <strong>"Flatten PDF"</strong> option). Follow the steps on the right to prepare your layout.</p>
            </div>
          </div>

          <div className="preview-container glass-panel">
            <h2 className="panel-title">
              Live Preview {rasterize && <span className="raster-badge">(Rasterized)</span>}
            </h2>
            <div className="preview-frame-wrapper">
              {files.length === 0 && !isPreviewGenerating && (
                <div className="preview-empty">
                  <FileIcon size={48} className="preview-empty-icon" />
                  <p>Upload PDFs to see preview</p>
                </div>
              )}
              
              {previewUrl && (
                <iframe 
                  src={`${previewUrl}#view=FitH&toolbar=0&navpanes=0`} 
                  className={`pdf-preview ${isPreviewGenerating ? 'faded' : ''}`}
                  title="PDF Preview"
                />
              )}

              {isPreviewGenerating && (
                <div className="preview-loading-overlay">
                  <Loader2 className="spinning-icon" size={48} />
                  <p>Crunching pixels...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="sidebar">
          {/* Step 1: Upload & Organize */}
          <div 
            className={`panel-section glass-panel step-panel ${isDragActive ? 'drag-active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="step-header">
              <span className="step-number">1</span>
              <h2 className="panel-title">Upload & Organize</h2>
            </div>

            {files.length === 0 ? (
              <div 
                className="upload-placeholder"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="upload-icon" />
                <p>Click or drag PDFs here</p>
              </div>
            ) : (
              <div className="file-manager">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="file-list">
                    <SortableContext 
                      items={files.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {files.map(file => (
                        <SortableFileItem 
                          key={file.id} 
                          item={file} 
                          onRemove={removeFile} 
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
                <button 
                  className="add-more-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={18} /> Add more PDFs
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="file-input" 
              multiple 
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
          </div>

          {/* Step 2: Choose Layout */}
          <div className="panel-section glass-panel step-panel">
            <div className="step-header">
              <span className="step-number">2</span>
              <h2 className="panel-title">Choose Layout</h2>
            </div>
            <div className="layout-options">
              <div 
                className={`layout-option ${layoutMode === '1-up' ? 'selected' : ''}`}
                onClick={() => setLayoutMode('1-up')}
              >
                <Copy size={24} className="layout-icon" />
                <div className="layout-info">
                  <h4>Standard (1 per page)</h4>
                  <p>Scales down to fit on a single letter page</p>
                </div>
              </div>
              <div 
                className={`layout-option ${layoutMode === '2-up' ? 'selected' : ''}`}
                onClick={() => setLayoutMode('2-up')}
              >
                <Printer size={24} className="layout-icon" />
                <div className="layout-info">
                  <h4>Side-by-Side (2 per page)</h4>
                  <p>Fits two posters on landscape letter paper</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Advanced Fixes */}
          <div className="panel-section glass-panel step-panel">
            <div className="step-header">
              <span className="step-number">3</span>
              <h2 className="panel-title">Advanced Settings</h2>
            </div>
            <label className="fix-toggle">
              <input 
                type="checkbox" 
                checked={rasterize} 
                onChange={(e) => setRasterize(e.target.checked)}
              />
              <div className="fix-info">
                <strong>Fix Rendering Glitches</strong>
                <p>Check this if your printed PDF has weird lines or glitches (slower generation, larger file size).</p>
              </div>
            </label>
          </div>

          <button 
            className="generate-btn" 
            onClick={downloadPDF}
            disabled={files.length === 0 || isGeneratingDownload || isPreviewGenerating}
          >
            <Printer size={20} />
            {isGeneratingDownload ? 'Generating...' : 'Download Final PDF'}
          </button>
        </aside>
      </main>
    </div>
  );
}

export default PosterOptimizer;
