import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getTopTheories,
  voteTheory,
  getContributionLeaderboard,
  type ContributionLeaderboardResponse,
} from '../services/api';
import './LandingPage.css';

type LeaderboardSectionProps = {
  data?: ContributionLeaderboardResponse;
  isLoading: boolean;
  error: unknown;
};

function ContributionLeaderboardSection({ data, isLoading, error }: LeaderboardSectionProps) {
  const entries = data?.leaderboard ?? [];
  const currentUser = data?.currentUser;
  const hasError = Boolean(error);

  const formatName = (entry: { username?: string | null; name?: string | null; email?: string | null }) =>
    entry.username || entry.name || entry.email || 'Unknown';

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: '#ef4444', margin: 0, fontSize: '28px' }}>Contributor Leaderboard</h2>
        <p style={{ color: '#fff', opacity: 0.75, marginTop: 6 }}>
          Tracking approved theories and votes. Total contributions logged: {data?.totalContributions ?? 0}
        </p>
      </div>

      {isLoading && (
        <div style={{ color: '#fff', padding: 20, textAlign: 'center' }}>Loading leaderboard...</div>
      )}

      {hasError && !isLoading && (
        <div style={{ color: '#f87171', padding: 20, textAlign: 'center' }}>
          Failed to load leaderboard. Please refresh.
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #ef4444', borderRadius: 6, overflowX: 'auto' }}>
            {entries.length === 0 ? (
              <div style={{ color: '#fff', opacity: 0.7, padding: 24, textAlign: 'center' }}>
                No contributions yet. Be the first to submit or vote!
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'rgba(239,68,68,0.2)', color: '#fff' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Contributions</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Approved Posts</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isCurrentUser =
                      currentUser?.userId === entry.userId && (currentUser?.rank ?? entry.rank) === entry.rank;
                    return (
                      <tr
                        key={entry.userId}
                        style={{
                          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                          background: isCurrentUser ? 'rgba(239,68,68,0.15)' : 'transparent',
                          color: '#fff',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>#{entry.rank}</td>
                        <td style={{ padding: '12px 16px' }}>{formatName(entry)}</td>
                        <td style={{ padding: '12px 16px' }}>{entry.contributions}</td>
                        <td style={{ padding: '12px 16px' }}>{entry.approvals}</td>
                        <td style={{ padding: '12px 16px' }}>{entry.votes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {currentUser && (
            <div
              style={{
                marginTop: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 16,
                border: '1px dashed #f87171',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
              }}
            >
              <strong style={{ color: '#f87171' }}>Your stats</strong>
              <span>Rank: {currentUser.rank ? `#${currentUser.rank}` : 'Not ranked yet'}</span>
              <span>Total contributions: {currentUser.contributions}</span>
              <span>Approved posts: {currentUser.approvals}</span>
              <span>Votes cast: {currentUser.votes}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TheoryItem({ theory }: { theory: any }) {
  const { isAuthenticated, needsUsername } = useAuth();
  const qc = useQueryClient();

  const voteMut = useMutation({
    mutationFn: (value: 1 | -1) => voteTheory(theory.id, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['top-theories'] });
    },
  });

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) {
      alert('Please log in to vote');
      return;
    }
    if (needsUsername) {
      alert('Please pick a username before voting');
      return;
    }
    voteMut.mutate(value);
  };

  const score = theory.score || 0;
  const userVote = theory.userVote;

  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(239, 68, 68, 0.3)' }}>
      {/* Voting section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <button
          onClick={() => handleVote(1)}
          disabled={voteMut.isPending || !isAuthenticated || needsUsername}
          style={{
            background: userVote === 1 ? '#059669' : 'transparent',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: isAuthenticated && !needsUsername ? 'pointer' : 'not-allowed',
            padding: '4px 8px',
            fontSize: '14px',
            opacity: !isAuthenticated || needsUsername ? 0.5 : 1,
          }}
          title={
            !isAuthenticated
              ? 'Log in to vote'
              : needsUsername
              ? 'Choose a username to vote'
              : 'Upvote'
          }
        >
          ▲
        </button>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', margin: '4px 0' }}>
          {score}
        </span>
        <button
          onClick={() => handleVote(-1)}
          disabled={voteMut.isPending || !isAuthenticated || needsUsername}
          style={{
            background: userVote === -1 ? '#dc2626' : 'transparent',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: isAuthenticated && !needsUsername ? 'pointer' : 'not-allowed',
            padding: '4px 8px',
            fontSize: '14px',
            opacity: !isAuthenticated || needsUsername ? 0.5 : 1,
          }}
          title={
            !isAuthenticated
              ? 'Log in to vote'
              : needsUsername
              ? 'Choose a username to vote'
              : 'Downvote'
          }
        >
          ▼
        </button>
      </div>

      {/* Content section */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '14px', lineHeight: 1.6 }}>
          {theory.content}
        </p>
        <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#ef4444', opacity: 0.8 }}>
            {theory.createdBy?.username || theory.createdBy?.name || theory.createdBy?.email || 'Unknown'}
          </span>
          <span style={{ fontSize: '12px', color: '#fff', opacity: 0.6 }}>
            {new Date(theory.createdAt).toLocaleDateString()}
          </span>
          {theory.tags && theory.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {theory.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    borderRadius: 3,
                    color: '#ef4444',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopTheoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['top-theories'],
    queryFn: () => getTopTheories(),
  });
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useQuery({
    queryKey: ['contribution-leaderboard'],
    queryFn: () => getContributionLeaderboard(),
  });

  const theories = data?.theories ?? [];

  return (
    <div className="landing-page">
      <div className="background-image" />
      
      <div className="main-content" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ color: '#ef4444', margin: 0, fontSize: '32px' }}>Top Theories</h1>
          <p style={{ color: '#fff', opacity: 0.8, marginTop: 8 }}>
            The most popular theories from the community, sorted by votes.
          </p>
        </div>

        {isLoading && (
          <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>Loading theories...</div>
        )}

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>
            Error loading theories. Please try again.
          </div>
        )}

        {!isLoading && !error && (
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: 20, borderRadius: 6, border: '1px solid #ef4444' }}>
            {theories.length === 0 ? (
              <div style={{ color: '#fff', opacity: 0.7, textAlign: 'center', padding: 40 }}>
                No approved theories yet. Be the first to submit one!
              </div>
            ) : (
              theories.map((theory: any) => (
                <TheoryItem key={theory.id} theory={theory} />
              ))
            )}
          </div>
        )}

        <ContributionLeaderboardSection
          data={leaderboardData}
          isLoading={leaderboardLoading}
          error={leaderboardError}
        />

        {/* Directory section */}
        <div className="directory-section">
          <h2 className="directory-title">DIRECTORY</h2>
          <ul className="directory-list">
            <li className="directory-item">
              &gt; <Link to="/canon" style={{ color: '#dc2626', textDecoration: 'none' }}>BROWSE CANON</Link>
            </li>
            <li className="directory-item">
              &gt; <Link to="/theories" style={{ color: '#dc2626', textDecoration: 'none' }}>TOP THEORIES FOR S5</Link>
            </li>
            <li className="directory-item">&gt; CONTRIBUTOR LEADERBOARD</li>
            <li className="directory-item">
              &gt; <Link to="/admin" style={{ color: '#dc2626', textDecoration: 'none' }}>ADMIN</Link>
            </li>
            <li className="directory-item">
              &gt; <Link to="https://discord.gg/MB3ZTGth" style={{ color: '#dc2626', textDecoration: 'none' }}>JOIN OUR DISCORD</Link>
            </li>
          </ul>
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
      </div>
    </div>
  );
}

export default TopTheoriesPage;
