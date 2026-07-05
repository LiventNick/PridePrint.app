import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  GripVertical, 
  Printer, 
  Info,
  Loader2,
  Plus,
  AlertTriangle,
  Link as LinkIcon,
  Crop as CropIcon,
  X,
  Check,
  ZoomIn
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
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
import Cropper from 'react-easy-crop';
import '../App.css';

interface ImageFile {
  id: string;
  file: globalThis.File;
  previewUrl: string;
  isLowQuality?: boolean;
}

const PAPER_SIZES = {
  'Letter': { width: 612, height: 792, name: 'Letter (8.5" x 11")' },
  'Legal': { width: 612, height: 1008, name: 'Legal (8.5" x 14")' },
  'A4': { width: 595.28, height: 841.89, name: 'A4 (210 x 297mm)' },
};

function SortableImageItem({ item, onRemove, onCrop }: { item: ImageFile; onRemove: (id: string) => void; onCrop: (id: string) => void }) {
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
        <img src={item.previewUrl} alt="preview" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
        <span className="file-name" title={item.file.name}>{item.file.name}</span>
        {item.isLowQuality && (
           <span title="Low resolution. Print may look pixelated." style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', cursor: 'help' }}>
             <AlertTriangle size={16} />
           </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button 
          className="crop-btn" 
          onClick={() => onCrop(item.id)}
          aria-label="Crop image"
        >
          <CropIcon size={18} />
        </button>
        <button 
          className="remove-btn" 
          onClick={() => onRemove(item.id)}
          aria-label="Remove image"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

// Helper to crop image to a perfect square using canvas
async function cropImageToSquareBytes(file: globalThis.File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("No canvas context"));
        
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
        
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        }, 'image/jpeg', 0.95);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ButtonPrinter() {
  useEffect(() => {
    document.title = "Button Printer - Nick's Pride Print Shop";
  }, []);

  const [images, setImages] = useState<ImageFile[]>([]);
  const [buttonSize, setButtonSize] = useState<number>(1.25);
  const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('Letter');
  const [copies, setCopies] = useState<number>(1);
  const [imgUrl, setImgUrl] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  
  // Crop states
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
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
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFilesAdded = async (newFiles: globalThis.File[]) => {
    const validImages = newFiles.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) return;
    
    for (const file of validImages) {
      const url = URL.createObjectURL(file);
      
      const img = new Image();
      img.src = url;
      await new Promise(r => {
        img.onload = r;
        img.onerror = r;
      });
      
      const isLowQuality = Math.min(img.width, img.height) < 400;
      
      setImages(prev => [...prev, {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: url,
        isLowQuality
      }]);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgUrl) return;
    setIsUrlLoading(true);
    try {
       const proxyUrl = import.meta.env.DEV 
         ? `https://corsproxy.io/?${encodeURIComponent(imgUrl)}`
         : `/api/proxy?url=${encodeURIComponent(imgUrl)}`;
       const res = await fetch(proxyUrl);
       if (!res.ok) throw new Error("Failed to fetch");
       const blob = await res.blob();
       if (!blob.type.startsWith('image/')) throw new Error("Not an image");
       
       const file = new File([blob], "url-image.jpg", { type: blob.type });
       await handleFilesAdded([file]);
       setImgUrl('');
    } catch (err) {
       alert("Could not load image from that URL. It might be protected or invalid.");
    } finally {
       setIsUrlLoading(false);
    }
  };

  const handleSaveCrop = async () => {
    if (!croppingImageId || !croppedAreaPixels) return;
    
    const imageToCrop = images.find(i => i.id === croppingImageId);
    if (!imageToCrop) return;
    
    try {
       const img = new Image();
       img.src = imageToCrop.previewUrl;
       await new Promise(r => {
         img.onload = r;
         img.onerror = r;
       });
       
       const canvas = document.createElement('canvas');
       canvas.width = croppedAreaPixels.width;
       canvas.height = croppedAreaPixels.height;
       const ctx = canvas.getContext('2d');
       if (!ctx) throw new Error("No canvas");
       
       ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
       );
       
       const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
       if (!blob) throw new Error("Failed to create blob");
       
       const newFile = new File([blob], imageToCrop.file.name, { type: 'image/jpeg' });
       const newPreviewUrl = URL.createObjectURL(blob);
       
       setImages(prev => prev.map(imgItem => {
         if (imgItem.id === croppingImageId) {
           return { ...imgItem, file: newFile, previewUrl: newPreviewUrl };
         }
         return imgItem;
       }));
       
       closeCropModal();
    } catch (e) {
       console.error(e);
       alert("Failed to crop image.");
    }
  };

  const closeCropModal = () => {
    setCroppingImageId(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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
    setImages(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const generatePdfBytes = useCallback(async () => {
    if (images.length === 0) return null;
    
    const finalPdf = await PDFDocument.create();
    const paper = PAPER_SIZES[paperSize];
    const MARGIN = 36;
    const GAP = 18;
    
    const buttonSizePts = buttonSize * 72;
    const slotSize = buttonSizePts + GAP;
    
    const usableWidth = paper.width - (MARGIN * 2);
    const usableHeight = paper.height - (MARGIN * 2);
    
    const cols = Math.max(1, Math.floor((usableWidth + GAP) / slotSize));
    const rows = Math.max(1, Math.floor((usableHeight + GAP) / slotSize));
    
    const itemsPerPage = cols * rows;
    
    const imageBytesArray: Uint8Array[] = [];
    for (const img of images) {
      const bytes = await cropImageToSquareBytes(img.file);
      for (let i = 0; i < copies; i++) {
        imageBytesArray.push(bytes);
      }
    }
    
    const embeddedImagesCache = new Map<Uint8Array, any>();
    
    let currentPage = finalPdf.addPage([paper.width, paper.height]);
    let currentItemOnPage = 0;
    
    for (const bytes of imageBytesArray) {
      if (currentItemOnPage >= itemsPerPage) {
        currentPage = finalPdf.addPage([paper.width, paper.height]);
        currentItemOnPage = 0;
      }
      
      let pdfImage = embeddedImagesCache.get(bytes);
      if (!pdfImage) {
        pdfImage = await finalPdf.embedJpg(bytes);
        embeddedImagesCache.set(bytes, pdfImage);
      }
      
      const col = currentItemOnPage % cols;
      const row = Math.floor(currentItemOnPage / cols);
      
      const x = MARGIN + (col * slotSize);
      const y = paper.height - MARGIN - buttonSizePts - (row * slotSize);
      
      currentPage.drawImage(pdfImage, {
        x,
        y,
        width: buttonSizePts,
        height: buttonSizePts,
      });
      
      const centerX = x + (buttonSizePts / 2);
      const centerY = y + (buttonSizePts / 2);
      const radius = buttonSizePts / 2;
      
      currentPage.drawCircle({
        x: centerX,
        y: centerY,
        size: radius,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0),
        color: undefined,
      });
      
      currentPage.drawCircle({
        x: centerX,
        y: centerY,
        size: radius - 1,
        borderWidth: 1,
        borderColor: rgb(1, 1, 1),
        color: undefined,
      });
      
      currentItemOnPage++;
    }

    return await finalPdf.save();
  }, [images, buttonSize, paperSize, copies]);

  useEffect(() => {
    let isMounted = true;
    let urlToRevoke: string | null = null;
    
    const updatePreview = async () => {
      if (images.length === 0) {
        setPreviewPdfUrl(null);
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
        setPreviewPdfUrl(url);
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
  }, [generatePdfBytes, images.length]); 

  const downloadPDF = async () => {
    if (images.length === 0) return;
    setIsGeneratingDownload(true);
    
    try {
      const pdfBytes = await generatePdfBytes();
      if (!pdfBytes) return;
      
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buttons_${buttonSize}in_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGeneratingDownload(false);
    }
  };

  return (
    <div className="app-container">
      {croppingImageId && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content glass-panel">
            <div className="crop-modal-header">
              <h3>Adjust Image</h3>
              <button onClick={closeCropModal} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            <div className="crop-container">
               <Cropper
                  image={images.find(i => i.id === croppingImageId)?.previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_croppedArea, croppedAreaPixels) => {
                     setCroppedAreaPixels(croppedAreaPixels);
                  }}
               />
            </div>
            <div className="crop-controls">
              <ZoomIn size={18} className="zoom-icon" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="zoom-slider"
              />
            </div>
            <div className="crop-modal-footer">
              <button className="save-crop-btn" onClick={handleSaveCrop}>
                 <Check size={18} /> Save Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <h1>Button Printer</h1>
        <p>Upload images or paste URLs to perfectly arrange them on a print-ready sheet</p>
      </header>

      <main className="main-content">
        <div className="left-column">
          <div className="instructions-banner glass-panel">
            <Info size={24} className="info-icon" />
            <div className="instructions-text">
              <strong>How to use</strong>
              <p>Upload your button artwork (JPG/PNG). The app will automatically crop them to squares, arrange them in a grid, and draw a high-visibility circular cut line over each one! Use the Crop tool on any image to adjust it.</p>
            </div>
          </div>

          <div className="preview-container glass-panel">
            <h2 className="panel-title">Live Preview</h2>
            <div className="preview-frame-wrapper">
              {images.length === 0 && !isPreviewGenerating && (
                <div className="preview-empty">
                  <ImageIcon size={48} className="preview-empty-icon" />
                  <p>Upload images to see preview</p>
                </div>
              )}
              
              {previewPdfUrl && (
                <iframe 
                  src={`${previewPdfUrl}#view=FitH&toolbar=0&navpanes=0`} 
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
          {/* Step 1: Upload Images */}
          <div 
            className={`panel-section glass-panel step-panel ${isDragActive ? 'drag-active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="step-header">
              <span className="step-number">1</span>
              <h2 className="panel-title">Upload Artwork</h2>
            </div>

            <form onSubmit={handleAddUrl} className="url-upload-form">
              <div className="url-input-wrapper">
                <LinkIcon size={16} className="url-icon" />
                <input 
                  type="url" 
                  className="url-input" 
                  placeholder="Paste an image URL here..." 
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  disabled={isUrlLoading}
                />
              </div>
              <button type="submit" className="url-submit-btn" disabled={isUrlLoading || !imgUrl}>
                {isUrlLoading ? <Loader2 size={16} className="spinning-icon" /> : 'Add'}
              </button>
            </form>

            <div className="upload-divider">
              <span>OR</span>
            </div>

            {images.length === 0 ? (
              <div 
                className="upload-placeholder"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="upload-icon" />
                <p>Click or drag Images here (JPG/PNG)</p>
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
                      items={images.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {images.map(img => (
                        <SortableImageItem 
                          key={img.id} 
                          item={img} 
                          onRemove={removeFile}
                          onCrop={setCroppingImageId}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
                <button 
                  className="add-more-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={18} /> Add more Images
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="file-input" 
              multiple 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
          </div>

          {/* Step 2: Settings */}
          <div className="panel-section glass-panel step-panel">
            <div className="step-header">
              <span className="step-number">2</span>
              <h2 className="panel-title">Print Settings</h2>
            </div>
            
            <div className="settings-group">
              <label className="settings-label">
                <strong>Button Cut Size (Inches)</strong>
                <input 
                  type="number" 
                  className="settings-input" 
                  value={buttonSize} 
                  onChange={(e) => setButtonSize(Number(e.target.value) || 1)}
                  step="0.25"
                  min="0.5"
                />
              </label>

              <label className="settings-label">
                <strong>Paper Size</strong>
                <select 
                  className="settings-input"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as keyof typeof PAPER_SIZES)}
                >
                  {Object.entries(PAPER_SIZES).map(([key, data]) => (
                    <option key={key} value={key}>{data.name}</option>
                  ))}
                </select>
              </label>
              
              <label className="settings-label">
                <strong>Copies per Image</strong>
                <input 
                  type="number" 
                  className="settings-input" 
                  value={copies} 
                  onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
                  min="1"
                  max="100"
                />
              </label>
            </div>
          </div>

          <button 
            className="generate-btn" 
            onClick={downloadPDF}
            disabled={images.length === 0 || isGeneratingDownload || isPreviewGenerating}
          >
            <Printer size={20} />
            {isGeneratingDownload ? 'Generating...' : 'Download Final PDF'}
          </button>
        </aside>
      </main>
    </div>
  );
}
