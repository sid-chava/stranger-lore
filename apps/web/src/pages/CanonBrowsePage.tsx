import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCanonFolders } from '../services/api';
import './LandingPage.css';

function CanonBrowsePage() {
  const { data } = useQuery({ queryKey: ['canon-folders'], queryFn: () => getCanonFolders() });
  const folders = data?.folders ?? [];

  const rootId = useMemo(() => folders.find((f: any) => f.slug === 'root')?.id as string | undefined, [folders]);
  const children = useMemo(() => {
    // Prefer children of root; if folder wasn't created under root, show top-level canon folders (excluding root)
    if (rootId) {
      const underRoot = folders.filter((f: any) => f.parentId === rootId);
      if (underRoot.length > 0) return underRoot;
    }
    return folders.filter((f: any) => !f.parentId && f.slug !== 'root');
  }, [folders, rootId]);

  return (
    <div className="landing-page">
      <div className="background-image" />
      <div className="main-content" style={{ padding: 20, color: '#fff', fontFamily: 'Roboto Mono, monospace' }}>
        <div style={{ borderBottom: '2px solid #b91c1c', paddingBottom: 8, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>Browse Canon</h2>
          <p style={{ marginTop: 8, opacity: 0.8 }}>Folders inside root</p>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {children.map((f: any) => (
            <Link key={f.id} to={`/canon/folder/${f.id}`} style={{ color: '#dc2626', textDecoration: 'none' }}>
              {f.name}
            </Link>
          ))}
          {children.length === 0 && <div style={{ opacity: 0.7 }}>No folders</div>}
        </div>
      </div>
    </div>
  );
}

export default CanonBrowsePage;


