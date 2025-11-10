import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SignIn } from '@stackframe/react';
import { useAuth } from '../contexts/AuthContext';

type AuthModalContextValue = {
  open: (message?: string) => void;
  close: () => void;
  isOpen: boolean;
  message?: string;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const open = useCallback((nextMessage?: string) => {
    setMessage(nextMessage);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMessage(undefined);
  }, []);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      setIsOpen(false);
      setMessage(undefined);
    }
  }, [isAuthenticated, isOpen]);

  return (
    <AuthModalContext.Provider value={{ open, close, isOpen, message }}>
      {children}
      {isOpen && (
        <div className="auth-modal-backdrop" role="dialog" aria-modal="true" onClick={close}>
          <div className="auth-modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" type="button" aria-label="Close sign-in form" onClick={close}>
              ✕
            </button>
            <div className="auth-modal-body">
              <p className="auth-modal-message">
                {message || 'Sign in to keep contributing theories and votes.'}
              </p>
              <SignIn fullPage={false} automaticRedirect />
            </div>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return ctx;
}
