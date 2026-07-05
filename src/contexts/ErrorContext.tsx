import { createContext, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorContextType {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (message: string) => {
    setErrorMessage(message);
  };

  const closeError = () => {
    setErrorMessage(null);
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      
      {errorMessage && (
        <div className="error-modal-overlay" onClick={closeError}>
          <div className="error-modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="error-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle className="error-icon" size={24} />
                <h3>Something went wrong</h3>
              </div>
              <button className="close-modal-btn" onClick={closeError} aria-label="Close error message">
                <X size={20} />
              </button>
            </div>
            <div className="error-modal-body">
              <p>{errorMessage}</p>
            </div>
            <div className="error-modal-footer">
              <button className="dismiss-btn" onClick={closeError}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
