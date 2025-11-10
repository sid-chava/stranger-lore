import { useQuery } from '@tanstack/react-query';
import { getContributionLeaderboard, type ContributionLeaderboardResponse } from '../services/api';
import './LandingPage.css';
import AnimatedCounter from '../components/AnimatedCounter';
import DirectoryLinks from '../components/DirectoryLinks';

type LeaderboardSectionProps = {
  data?: ContributionLeaderboardResponse;
  isLoading: boolean;
  error: unknown;
};

function LeaderboardTable({ data, isLoading, error }: LeaderboardSectionProps) {
  const entries = data?.leaderboard ?? [];
  const currentUser = data?.currentUser;
  const hasError = Boolean(error);

  const formatName = (entry: { username?: string | null; name?: string | null; email?: string | null }) =>
    entry.username || entry.name || entry.email || 'Unknown';

  if (isLoading) {
    return <div style={{ color: '#fff', padding: 20, textAlign: 'center' }}>Loading leaderboard...</div>;
  }

  if (hasError) {
    return (
      <div style={{ color: '#f87171', padding: 20, textAlign: 'center' }}>
        Failed to load leaderboard. Please refresh.
      </div>
    );
  }

  return (
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
  );
}

function ContributorLeaderboardPage() {
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useQuery({
    queryKey: ['contribution-leaderboard'],
    queryFn: () => getContributionLeaderboard(),
  });
  const totalContributions = leaderboardData?.totalContributions ?? 0;

  return (
    <div className="landing-page">
      <div className="background-image" />

      <div className="main-content" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ color: '#ef4444', margin: 0, fontSize: '32px' }}>Contributor Leaderboard</h1>
          <p style={{ color: '#fff', opacity: 0.8, marginTop: 8 }}>
            Honoring every approved theory and vote in the community.
          </p>
        </div>

        <LeaderboardTable data={leaderboardData} isLoading={leaderboardLoading} error={leaderboardError} />

        <DirectoryLinks active="leaderboard" />

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
            <p className="built-by">Built by Lore.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default ContributorLeaderboardPage;
