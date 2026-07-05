import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Target } from 'lucide-react';

export default function Home() {
  useEffect(() => {
    document.title = "Nick's Pride Print Shop - Dashboard";
  }, []);
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Nick's Pride Print Shop</h1>
        <p>Select a tool below to get started</p>
      </header>

      <div className="tools-grid">
        <Link to="/poster-optimizer" className="tool-card glass-panel">
          <div className="tool-icon-wrapper">
            <Copy size={48} className="tool-icon" />
          </div>
          <h3>Poster Optimizer</h3>
          <p>Perfectly scale your Canva exports for regular printing. Features 1-up and 2-up Side-by-Side layouts.</p>
        </Link>

        <Link to="/button-printer" className="tool-card glass-panel">
          <div className="tool-icon-wrapper">
            <Target size={48} className="tool-icon" />
          </div>
          <h3>Button Printer</h3>
          <p>Upload images to generate perfectly sized PDFs for manual button making.</p>
        </Link>
      </div>
    </div>
  );
}
