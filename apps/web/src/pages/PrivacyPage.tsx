import './LandingPage.css';

function PrivacyPage() {
  return (
    <div className="landing-page">
      <div className="background-image" />
      <div
        className="main-content"
        style={{
          padding: '40px',
          maxWidth: '700px',
          margin: '0 auto',
          color: '#fff',
          lineHeight: 1.7,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <h1 style={{ color: '#ef4444', margin: 0, fontSize: '32px' }}>Privacy Policy</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>Effective February 1, 2025 • Last updated November 24, 2025</p>
          <p style={{ marginTop: 16, opacity: 0.85 }}>
            Lore respects your privacy. This policy explains how we collect and use your information when you join our
            waitlist or interact with our site.
          </p>
        </div>

        <section>
          <h2 style={{ color: '#f97316', marginBottom: 8 }}>1. What We Collect</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0, opacity: 0.85 }}>
            <li>Email address</li>
            <li>Username</li>
            <li>Any optional info you choose to share</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: '#f97316', marginBottom: 8 }}>2. How We Use It</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0, opacity: 0.85 }}>
            <li>Reserve your username</li>
            <li>Notify you when we launch</li>
            <li>Share occasional updates and invites</li>
          </ul>
          <p style={{ marginTop: 12, opacity: 0.85 }}>We never sell your information.</p>
        </section>

        <section>
          <h2 style={{ color: '#f97316', marginBottom: 8 }}>3. Tracking</h2>
          <p style={{ margin: 0, opacity: 0.85 }}>
            We may use analytics tools to understand how visitors use our site. This helps us improve the experience.
            These tools don’t collect personal data like your name or location.
          </p>
        </section>

        <section>
          <h2 style={{ color: '#f97316', marginBottom: 8 }}>4. Your Rights</h2>
          <p style={{ margin: 0, opacity: 0.85 }}>
            Want to opt out or delete your info? DM us on Instagram{' '}
            <a
              href="https://instagram.com/loreobsessed"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#3b82f6' }}
            >
              @loreobsessed
            </a>
            .
          </p>
        </section>

        <section>
          <h2 style={{ color: '#f97316', marginBottom: 8 }}>5. Updates</h2>
          <p style={{ margin: 0, opacity: 0.85 }}>
            We may make changes to this policy as needed. We’ll update this page if we do.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;

