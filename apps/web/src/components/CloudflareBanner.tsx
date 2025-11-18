import { useState, useEffect } from 'react';

const DISMISS_KEY = 'cloudflare-outage-banner-dismissed';

export function CloudflareBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
    // Debug: log banner state
    console.log('CloudflareBanner: dismissed =', dismissed, 'isDismissed =', dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        background: 'rgba(220, 38, 38, 0.95)',
        borderBottom: '2px solid #dc2626',
        color: '#fff',
        padding: '12px 40px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'Roboto Mono', monospace",
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <span style={{ flex: 1, textAlign: 'center' }}>
        We are currently affected by a Cloudflare outage. Some features may be unavailable.
      </span>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold',
          padding: '0 12px',
          marginLeft: '16px',
          lineHeight: 1,
          opacity: 0.9,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
        aria-label="Dismiss banner"
      >
        ×
      </button>
    </div>
  );
}

