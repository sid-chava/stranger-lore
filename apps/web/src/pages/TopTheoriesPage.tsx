import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getTopTheories, voteTheory } from '../services/api';
import './LandingPage.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnimatedCounter from '../components/AnimatedCounter';
import { useContributionStats } from '../hooks/useContributionStats';
import DirectoryLinks from '../components/DirectoryLinks';
import { useAuthModal } from '../components/AuthModal';


function TheoryItem({ theory }: { theory: any }) {
  const { isAuthenticated, needsUsername } = useAuth();
  const { open: openAuthModal } = useAuthModal();
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
      openAuthModal('Sign in to vote on theories.');
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
          disabled={voteMut.isPending || needsUsername}
          style={{
            background: userVote === 1 ? '#059669' : 'transparent',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: voteMut.isPending || needsUsername ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
            fontSize: '14px',
            opacity: needsUsername ? 0.5 : 1,
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
          disabled={voteMut.isPending || needsUsername}
          style={{
            background: userVote === -1 ? '#dc2626' : 'transparent',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: voteMut.isPending || needsUsername ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
            fontSize: '14px',
            opacity: needsUsername ? 0.5 : 1,
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

type SortOption = 'top' | 'new';

function TopTheoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['top-theories'],
    queryFn: () => getTopTheories(),
  });
  const { data: contributionStats } = useContributionStats();
  const totalContributions = contributionStats?.totalContributions ?? 0;
  const theories = data?.theories ?? [];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('top');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tagOptions = useMemo(() => {
    const map = new Map<string, string>();
    theories.forEach((theory: any) => {
      (theory.tags ?? []).forEach((tag: any) => {
        if (tag?.id && tag?.name) {
          map.set(tag.id, tag.name);
        }
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [theories]);

  const filteredAndSortedTheories = useMemo(() => {
    // First filter by tags
    let filtered = theories;
    if (selectedTags.length > 0) {
      filtered = theories.filter((theory: any) =>
        selectedTags.every((tagId) => theory.tags?.some((tag: any) => tag.id === tagId))
      );
    }

    // Then sort
    const sorted = [...filtered];
    if (sortBy === 'new') {
      sorted.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // 'top' - sort by score, then by date
      sorted.sort((a: any, b: any) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return sorted;
  }, [selectedTags, theories, sortBy]);

  useEffect(() => {
    setSelectedTags((prev) => prev.filter((id) => tagOptions.some((tag) => tag.id === id)));
  }, [tagOptions]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  return (
    <div className="landing-page">
      <div className="background-image" />
      
      <div className="main-content" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ color: '#ef4444', margin: 0, fontSize: '32px' }}>Top Theories</h1>
          <p style={{ color: '#fff', opacity: 0.8, marginTop: 8 }}>
            The most popular theories from the community. Sort by top or new.
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
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: 20, borderRadius: 6, border: '1px solid #ef4444', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ paddingTop: 8, paddingBottom: 8, position: 'relative' }}>
              <p style={{ margin: '0 0 12px 0', color: '#f87171', fontSize: 14 }}>Filter by tag</p>
              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 8, 
                    maxHeight: '110px', 
                    overflowY: 'scroll', 
                    paddingRight: 12,
                    paddingBottom: 8,
                  }}
                  className="tag-scroll-container"
                >
                  <button
                    onClick={() => setSelectedTags([])}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: '1px solid #ef4444',
                      background: selectedTags.length === 0 ? '#2563eb' : 'transparent',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    All Tags
                  </button>
                  {tagOptions.length === 0 && (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Tags will appear as moderators start applying them.</span>
                  )}
                  {tagOptions.map((tag) => {
                    const isActive = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1px solid #ef4444',
                          background: isActive ? '#2563eb' : 'transparent',
                          color: '#fff',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                {/* Gradient fade indicator at bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 12,
                    height: '20px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    borderRadius: '0 0 6px 6px',
                  }}
                />
              </div>
            </div>

            {/* Sort dropdown */}
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onTouchStart={(e) => {
                    // Prevent double-tap zoom on mobile
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    minHeight: '36px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid #ef4444',
                    borderRadius: 4,
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: "'Roboto Mono', monospace",
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span>{sortBy === 'top' ? 'Top' : 'New'}</span>
                  <span style={{ fontSize: 10, transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
                {isDropdownOpen && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1,
                      }}
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        background: 'rgba(0,0,0,0.9)',
                        border: '1px solid #ef4444',
                        borderRadius: 4,
                        zIndex: 2,
                        minWidth: 120,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      <button
                        onClick={() => {
                          setSortBy('top');
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '12px 14px',
                          minHeight: '44px',
                          background: sortBy === 'top' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#fff',
                          fontSize: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: "'Roboto Mono', monospace",
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (sortBy !== 'top') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          if (sortBy !== 'top') e.currentTarget.style.background = 'transparent';
                        }}
                        onTouchStart={(e) => {
                          if (sortBy !== 'top') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        }}
                        onTouchEnd={(e) => {
                          if (sortBy !== 'top') e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Top
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('new');
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '12px 14px',
                          minHeight: '44px',
                          background: sortBy === 'new' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: "'Roboto Mono', monospace",
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (sortBy !== 'new') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          if (sortBy !== 'new') e.currentTarget.style.background = 'transparent';
                        }}
                        onTouchStart={(e) => {
                          if (sortBy !== 'new') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        }}
                        onTouchEnd={(e) => {
                          if (sortBy !== 'new') e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        New
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {filteredAndSortedTheories.length === 0 ? (
              <div style={{ color: '#fff', opacity: 0.7, textAlign: 'center', padding: 40 }}>
                {selectedTags.length === 0
                  ? 'No approved theories yet. Be the first to submit one!'
                  : 'No theories have been tagged this way yet.'}
              </div>
            ) : (
              filteredAndSortedTheories.map((theory: any) => (
                <TheoryItem key={theory.id} theory={theory} />
              ))
            )}
          </div>
        )}

        <DirectoryLinks active="browse" />

        {/* Footer section */}
        <footer className="footer-section">
          <div className="footer-left">
            <div className="social-links">
              <a href="https://x.com/loreobsessed" className="social-link">
                <img
                  src="/assets/social-x.png"
                  alt="X/Twitter"
                  className="social-icon"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </a>
              <a href="https://instagram.com/loreobsessed" className="social-link">
                <img
                  src="/assets/social-instagram.png"
                  alt="Instagram"
                  className="social-icon"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </a>
              <a href="https://tiktok.com/@lore" className="social-link">
                <img
                  src="/assets/social-tiktok.png"
                  alt="TikTok"
                  className="social-icon"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
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
      </div>
    </div>
  );
}

export default TopTheoriesPage;
