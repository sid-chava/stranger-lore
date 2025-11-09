import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTopTheories, voteTheory } from '../services/api';
import './LandingPage.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnimatedCounter from '../components/AnimatedCounter';
import { useContributionStats } from '../hooks/useContributionStats';


function TheoryItem({ theory }: { theory: any }) {
  const { isAuthenticated, needsUsername } = useAuth();
  const qc = useQueryClient();

  const voteMut = useMutation({
    mutationFn: (value: 1 | -1) => voteTheory(theory.id, value),
    onMutate: async (value: 1 | -1) => {
      await qc.cancelQueries({ queryKey: ['top-theories'] });
      const previous = qc.getQueryData<{ theories: any[] }>(['top-theories']);

      qc.setQueryData<{ theories: any[] } | undefined>(['top-theories'], (old) => {
        if (!old) return old;
        return {
          ...old,
          theories: old.theories.map((t) => {
            if (t.id !== theory.id) return t;
            const prevVote = t.userVote as -1 | 0 | 1 | null;
            if (prevVote === value) {
              return t;
            }
            let upvotes = t.upvotes ?? 0;
            let downvotes = t.downvotes ?? 0;

            if (prevVote === 1) upvotes = Math.max(0, upvotes - 1);
            if (prevVote === -1) downvotes = Math.max(0, downvotes - 1);

            if (value === 1) upvotes += 1;
            if (value === -1) downvotes += 1;

            return {
              ...t,
              userVote: value,
              upvotes,
              downvotes,
              score: upvotes - downvotes,
            };
          }),
        };
      });

      return { previous };
    },
    onError: (_err, _value, context) => {
      if (context?.previous) {
        qc.setQueryData(['top-theories'], context.previous);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData<{ theories: any[] } | undefined>(['top-theories'], (old) => {
        if (!old) return old;
        return {
          ...old,
          theories: old.theories.map((t) =>
            t.id === theory.id
              ? {
                  ...t,
                  userVote: data.userVote,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  score: data.score,
                }
              : t
          ),
        };
      });
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
        {theory.title && (
          <h3 style={{ margin: '0 0 6px 0', color: '#f87171', fontSize: '16px' }}>{theory.title}</h3>
        )}
        <div style={{ color: '#fff', fontSize: '14px', lineHeight: 1.6 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{theory.content}</ReactMarkdown>
        </div>
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
  const { data: contributionStats } = useContributionStats();
  const totalContributions = contributionStats?.totalContributions ?? 0;
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

        {/* Directory section */}
        <div className="directory-section">
          <h2 className="directory-title">DIRECTORY</h2>
          <ul className="directory-list">
            <li className="directory-item">
              &gt; <Link to="/" style={{ color: '#dc2626', textDecoration: 'none' }}>RETURN HOME</Link>
            </li>
            <li className="directory-item">
              &gt; <Link to="/theories" style={{ color: '#dc2626', textDecoration: 'none' }}>TOP THEORIES FOR S5</Link>
            </li>
            <li className="directory-item">
              &gt; <Link to="/leaderboard" style={{ color: '#dc2626', textDecoration: 'none' }}>CONTRIBUTOR LEADERBOARD</Link>
            </li>
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

export default TopTheoriesPage;
