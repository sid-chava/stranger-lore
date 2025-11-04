import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCanonPage, getCanonFolders } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './LandingPage.css';

function CanonPageView() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ['canon-page', id], queryFn: () => getCanonPage(id!) });
  const page = data?.page;
  const markdown = page?.latestRevision?.content || '';

  return (
    <div className="landing-page">
      <div className="background-image" />
      <div className="main-content" style={{ padding: 20, color: '#fff', fontFamily: 'Roboto Mono, monospace' }}>
        <div style={{ borderBottom: '2px solid #b91c1c', paddingBottom: 8, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>{page?.title || 'Page'}</h2>
          <p style={{ marginTop: 8 }}>
            <Link to="/canon" style={{ color: '#3b82f6', textDecoration: 'none' }}>&larr; Back to folders</Link>
          </p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
          <div style={{ color: '#fff' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CanonPageView;


