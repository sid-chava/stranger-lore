import './LandingPage.css';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { createTheory } from '../services/api';
import AnimatedCounter from '../components/AnimatedCounter';
import { useContributionStats } from '../hooks/useContributionStats';
import DirectoryLinks from '../components/DirectoryLinks';
import { useAuthModal } from '../components/AuthModal';

function AuthButton() {
  const { isAuthenticated, isLoading, logout, user, roleIndicator } = useAuth();
  const { open: openAuthModal } = useAuthModal();

  if (isLoading) {
    return <span className="auth-link">Loading...</span>;
  }

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span className="auth-link" style={{ color: '#ffffff' }}>
          {user.username || user.name || user.email || 'User'}
          {roleIndicator && (
            <span style={{ marginLeft: '6px', opacity: 0.8, fontSize: '0.9em' }}>
              ({roleIndicator})
            </span>
          )}
        </span>
        <button
          onClick={logout}
          className="auth-link"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'none',
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => openAuthModal()}
      className="auth-link"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        textDecoration: 'none',
      }}
    >
      Log In / Sign Up
    </button>
  );
}

function LandingPage() {
  const { isAuthenticated, needsUsername } = useAuth();
  const [theoryContent, setTheoryContent] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { data: contributionStats } = useContributionStats();
  const totalContributions = contributionStats?.totalContributions ?? 0;
  const { open: openAuthModal } = useAuthModal();

  const submitTheory = useMutation({
    mutationFn: (content: string) => createTheory(content),
    onSuccess: () => {
      setTheoryContent('');
      alert(
        'Your theory has been submitted for review. In the meantime you can submit more theories or join the #StrangerThings channel in our Discord to discuss your theories with fellow fans!'
      );
    },
    onError: (error: any) => {
      alert('Failed to submit theory: ' + (error.message || 'Please log in'));
    },
  });

  const handleSubmit = () => {
    if (!theoryContent.trim()) {
      alert('Please enter a theory');
      return;
    }
    if (!isAuthenticated) {
      openAuthModal('Sign in to submit a Stranger Things 5 theory.');
      return;
    }
    if (needsUsername) {
      alert('Please pick a username before contributing');
      return;
    }
    submitTheory.mutate(theoryContent.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
    <div className="landing-page">
      {/* Background image */}
      <div className="background-image" />
      
      {/* Red header bar */}
      <header className="header-bar">
        <div className="header-content">
          <div className="header-left">
            <img
              src="/assets/stranger-lore-logo.png"
              alt="Stranger Lore"
              className="brand-logo"
              loading="lazy"
            />
            <p className="description">
              The first-ever 100% fan-sourced library for theories and fanon related to Season 5 of Netflix's{' '}
              <a
                href="https://www.netflix.com/title/80057281"
                className="highlight"
                target="_blank"
                rel="noreferrer"
              >
                'Stranger Things'
              </a>
              .
            </p>
          </div>
          <div className="header-right">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="main-content">
        <div className="input-section">
          <input
            type="text"
            className="contribution-input"
            value={theoryContent}
            onChange={(e) => setTheoryContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Submit a Stranger Things 5 easter egg, prediction, or theory to contribute to our library..."
            disabled={submitTheory.isPending}
          />
          {needsUsername && isAuthenticated && (
            <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>
              Pick a username to start contributing.
            </p>
          )}
          <div className="input-actions">
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={submitTheory.isPending || needsUsername}
            >
              <img 
                src="/assets/submit.png" 
                alt="Submit" 
                className="submit-button-image"
                loading="lazy"
                onError={(e) => {
                  console.error('Failed to load submit image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </button>
            <button
              type="button"
              className="help-button"
              onClick={() => setIsHelpOpen(true)}
              aria-label="Learn more about Stranger Lore"
            >
              <img 
                src="/assets/FAQ.png" 
                alt="Help" 
                className="help-button-image"
                loading="lazy"
                onError={(e) => {
                  console.error('Failed to load FAQ image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </button>
          </div>
        </div>

        <DirectoryLinks active="home" />

        {/* Demogorgon section - bottom center */}
        <div className="demogorgon-section">
          <div className="demogorgon-wrapper">
            <img 
              src="/assets/demogorgon.png" 
              alt="Demogorgon" 
              className="demogorgon-image"
              loading="lazy"
              onError={(e) => {
                console.error('Failed to load demogorgon image');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

      {/* Footer section */}
      <footer className="footer-section">
        <div className="footer-left">
          <div className="social-links">
            <a href="https://x.com/loreobsessed" className="social-link">
              <img src="/assets/social-x.png" alt="X/Twitter" className="social-icon" />
            </a>
              <a href="https://instagram.com/loreobsessed" className="social-link">
                <img src="/assets/social-instagram.png" alt="Instagram" className="social-icon" />
              </a>
              <a href="https://tiktok.com/@lore" className="social-link">
                <img src="/assets/social-tiktok.png" alt="TikTok" className="social-icon" />
              </a>
            </div>
            <p className="contributions-count">
              <AnimatedCounter value={totalContributions} /> verified contributions
            </p>
            <p className="built-by">
              Built by <a href="https://loreobsessed.com" target="_blank" rel="noreferrer">Lore</a>.
            </p>
          </div>
        </footer>
      </main>
    </div>

    {isHelpOpen && (
      <div
        className="about-modal"
        role="dialog"
        aria-modal="true"
        aria-label="About Stranger Lore"
        onClick={() => setIsHelpOpen(false)}
      >
        <div className="about-modal-content" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="modal-close"
            aria-label="Close about modal"
            onClick={() => setIsHelpOpen(false)}
          >
            X
          </button>
          <p>
            Stranger Lore is a fan-made experiment in audience participation. Lore is on a mission to map, preserve, and play
            with the ways fans shape the mythology around massive cultural moments like the release of Stranger Things 5.
          </p>
          <p>
            Submit your theory, upvote what feels right, downvote what doesn't, and watch the leaderboard evolve as the gate opens
            one last time. This site is an unofficial fan project and is not affiliated with, sponsored, or endorsed by Netflix or
            the creators of Stranger Things.
          </p>
        </div>
      </div>
    )}
    </>
  );
}

export default LandingPage;
