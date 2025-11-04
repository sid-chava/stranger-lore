import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCanonFolders, listCanonFolderPages } from '../services/api';
import './LandingPage.css';

function FolderItem({ folder, isExpanded, onToggle }: { folder: any; isExpanded: boolean; onToggle: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['canon-folder-pages', folder.id],
    queryFn: () => listCanonFolderPages(folder.id),
    enabled: isExpanded,
  });
  const pages = data?.pages ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          color: '#dc2626',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '14px', opacity: 0.8 }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span style={{ fontWeight: 'bold' }}>{folder.name}</span>
      </div>
      {isExpanded && (
        <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isLoading ? (
            <div style={{ opacity: 0.7, fontSize: '14px' }}>Loading pages...</div>
          ) : pages.length > 0 ? (
            pages.map((p: any) => (
              <Link
                key={p.id}
                to={`/canon/page/${p.id}`}
                style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
              >
                • {p.title}
              </Link>
            ))
          ) : (
            <div style={{ opacity: 0.7, fontSize: '14px' }}>No pages</div>
          )}
        </div>
      )}
    </div>
  );
}

function CanonBrowsePage() {
  const { data } = useQuery({ queryKey: ['canon-folders'], queryFn: () => getCanonFolders() });
  const folders = data?.folders ?? [];
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const rootId = useMemo(() => folders.find((f: any) => f.slug === 'root')?.id as string | undefined, [folders]);
  const children = useMemo(() => {
    // Prefer children of root; if folder wasn't created under root, show top-level canon folders (excluding root)
    if (rootId) {
      const underRoot = folders.filter((f: any) => f.parentId === rootId);
      if (underRoot.length > 0) return underRoot;
    }
    return folders.filter((f: any) => !f.parentId && f.slug !== 'root');
  }, [folders, rootId]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="landing-page">
      <div className="background-image" />
      <div className="main-content" style={{ padding: 20, color: '#fff', fontFamily: 'Roboto Mono, monospace' }}>
        <div style={{ borderBottom: '2px solid #b91c1c', paddingBottom: 8, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>Browse Canon</h2>
          <p style={{ marginTop: 8, opacity: 0.8 }}>Folders inside root</p>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {children.map((f: any) => (
            <FolderItem
              key={f.id}
              folder={f}
              isExpanded={expandedFolders.has(f.id)}
              onToggle={() => toggleFolder(f.id)}
            />
          ))}
          {children.length === 0 && <div style={{ opacity: 0.7 }}>No folders</div>}
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
            <li className="directory-item">&gt; <Link to= "/admin" style={{ color: '#dc2626', textDecoration: 'none' }}>ADMIN</Link></li>
            <li className="directory-item">&gt; <Link to="https://discord.gg/MB3ZTGth" style={{ color: '#dc2626', textDecoration: 'none' }}>JOIN OUR DISCORD</Link></li>
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

export default CanonBrowsePage;


