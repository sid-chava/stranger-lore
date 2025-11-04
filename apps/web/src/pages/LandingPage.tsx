import './LandingPage.css';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function AuthButton() {
  const { isAuthenticated, isLoading, login, logout, user, roleIndicator } = useAuth();

  if (isLoading) {
    return <span className="auth-link">Loading...</span>;
  }

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span className="auth-link" style={{ color: '#ffffff' }}>
          {user.name || user.email || 'User'}
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
      onClick={login}
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
  return (
    <div className="landing-page">
      {/* Background image */}
      <div className="background-image" />
      
      {/* Red header bar */}
      <header className="header-bar">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">Stranger Lore</h1>
            <p className="description">
              A fan project on a mission to become the first-ever 100% fan-sourced library for all canon and fanon related to Netflix's{' '}
              <span className="highlight">'Stranger Things'</span>
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
            placeholder="Contribute a 'Stranger Things' fact, easter egg, or theory to contribute to our library..."
          />
          <div className="input-actions">
            <button className="submit-button">
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
            <button className="help-button">
              <img 
                src="/assets/FAQ.png" 
                alt="FAQ" 
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

        {/* Directory section */}
        <div className="directory-section">
          <h2 className="directory-title">DIRECTORY</h2>
          <ul className="directory-list">
            <li className="directory-item">
              &gt; <Link to="/canon" style={{ color: '#dc2626', textDecoration: 'none' }}>BROWSE CANON</Link>
            </li>
            <li className="directory-item">&gt; TOP THEORIES FOR S5</li>
            <li className="directory-item">&gt; CONTRIBUTOR LEADERBOARD</li>
            <li className="directory-item">&gt; JOIN OUR DISCORD</li>
          </ul>
        </div>

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
              <a href="#" className="social-link">
                <img src="/assets/social-tiktok.png" alt="TikTok" className="social-icon" />
              </a>
            </div>
            <p className="contributions-count">1,987 verified contributions</p>
            <p className="built-by">Built by Lore.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;
