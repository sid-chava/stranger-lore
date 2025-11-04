import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listCanonFolderPages, getCanonFolders } from '../services/api';
import './LandingPage.css';

function CanonFolderPageList() {
  const { id } = useParams();
  const { data: pagesData } = useQuery({ queryKey: ['canon-folder-pages', id], queryFn: () => listCanonFolderPages(id!) });
  const { data: foldersData } = useQuery({ queryKey: ['canon-folders'], queryFn: () => getCanonFolders() });
  const folder = (foldersData?.folders || []).find((f: any) => f.id === id);
  const pages = pagesData?.pages ?? [];

  return (
    <div className="landing-page">
      <div className="background-image" />
      <div className="main-content" style={{ padding: 20, color: '#fff', fontFamily: 'Roboto Mono, monospace' }}>
        <div style={{ borderBottom: '2px solid #b91c1c', paddingBottom: 8, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>{folder?.name || 'Folder'}</h2>
          <p style={{ marginTop: 8 }}>
            <Link to="/canon" style={{ color: '#3b82f6', textDecoration: 'none' }}>&larr; Back to folders</Link>
          </p>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {pages.map((p: any) => (
            <Link key={p.id} to={`/canon/page/${p.id}`} style={{ color: '#dc2626', textDecoration: 'none' }}>
              {p.title}
            </Link>
          ))}
          {pages.length === 0 && <div style={{ opacity: 0.7 }}>No pages</div>}
        </div>
      </div>
    </div>
  );
}

export default CanonFolderPageList;


