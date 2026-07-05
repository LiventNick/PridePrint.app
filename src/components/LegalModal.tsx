import { useState, useEffect } from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'tos' | 'privacy';
}

export default function LegalModal({ isOpen, onClose, defaultTab = 'tos' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>(defaultTab);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setIsClosing(false);
    }
  }, [isOpen, defaultTab]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // match animation duration
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`error-modal-overlay ${isClosing ? 'closing' : ''}`} 
      onClick={handleClose} 
      style={{ zIndex: 3000 }}
    >
      <div 
        className={`error-modal-content glass-panel ${isClosing ? 'closing' : ''}`} 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '600px', maxHeight: '80vh' }}
      >
        <div className="error-modal-header" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className={`nav-link ${activeTab === 'tos' ? 'active' : ''}`} 
              onClick={() => setActiveTab('tos')}
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'tos' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={18} />
              Terms of Service
            </button>
            <button 
              className={`nav-link ${activeTab === 'privacy' ? 'active' : ''}`} 
              onClick={() => setActiveTab('privacy')}
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'privacy' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Shield size={18} />
              Privacy Policy
            </button>
          </div>
          <button className="close-modal-btn" onClick={handleClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        
        <div className="error-modal-body" style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, fontSize: '0.95rem' }}>
          {activeTab === 'tos' ? (
            <div>
              <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Terms of Service</h2>
              <p>Welcome to PridePrint.app. By using this tool, you agree to these terms.</p>
              
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#fff' }}>1. Provided "As Is"</h4>
              <p>PridePrint is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the accuracy, reliability, or availability of the tool. Use it at your own risk.</p>
              
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#fff' }}>2. Use of Service</h4>
              <p>This service is designed to optimize PDFs and arrange images for printing. You agree not to abuse, exploit, or attempt to reverse engineer any server-side infrastructure (e.g. proxy functions) associated with the app.</p>
              
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#fff' }}>3. Limitation of Liability</h4>
              <p>In no event shall the creator of PridePrint be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the tool.</p>
            </div>
          ) : (
            <div>
              <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Privacy Policy</h2>
              <p>Your privacy is extremely important to us. Because PridePrint is primarily a client-side tool, your data remains safely on your device.</p>
              
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#fff' }}>1. Local Processing</h4>
              <p>All core PDF generation, cropping, and poster optimization is done directly in your web browser using JavaScript. When you upload a file from your computer, it is <strong>never uploaded to a central server</strong>. It stays on your device.</p>
              
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#fff' }}>2. Image Proxy</h4>
              <p>If you use the "Paste URL" feature in the Button Printer, the app requests the image through a secure, transient Cloudflare proxy to bypass CORS restrictions. The image passes through the proxy to your browser, but is <strong>never stored, logged, or saved</strong> by PridePrint.</p>
              
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#fff' }}>3. Local Storage Memory</h4>
              <p>Your print settings (like button sizes and layout preferences) are saved using your browser's Local Storage so they are remembered for your next visit. This data never leaves your device.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
