import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getCanonFolders,
  createCanonFolder,
  createCanonPage,
} from '../services/api';
import './LandingPage.css';

function AdminPage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = !!user?.roles?.includes('admin');
  const qc = useQueryClient();

  const { data: foldersData } = useQuery({
    queryKey: ['canon-folders'],
    queryFn: () => getCanonFolders(),
  });

  const folders = foldersData?.folders ?? [];

  const [folderName, setFolderName] = useState('');
  const [folderSlug, setFolderSlug] = useState('');
  const [folderParent, setFolderParent] = useState<string | ''>('');

  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageFolder, setPageFolder] = useState<string | ''>('');
  const [pageMarkdown, setPageMarkdown] = useState('');
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const createFolderMut = useMutation({
    mutationFn: (input: {
      name: string; slug?: string; parentId?: string | null;
    }) => createCanonFolder(input),
    onSuccess: () => {
      setFolderName(''); setFolderSlug(''); setFolderParent('');
      qc.invalidateQueries({ queryKey: ['canon-folders'] });
    },
  });

  const createPageMut = useMutation({
    mutationFn: (input: { title: string; slug?: string; folderId: string; markdown: string; }) => createCanonPage(input),
    onSuccess: () => {
      setPageTitle(''); setPageSlug(''); setPageFolder(''); setPageMarkdown('');
      setUseFileUpload(false); setUploadedFileName(null);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      alert('Please upload a .md file');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPageMarkdown(content);
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="landing-page">
        <div className="background-image" />
        <div className="main-content" style={{ padding: 20, color: '#fff' }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>Admin</h2>
          <p style={{ marginTop: 8 }}>You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="background-image" />
      <div className="main-content" style={{ padding: 20, color: '#fff', fontFamily: 'Roboto Mono, monospace' }}>
      <div style={{ borderBottom: '2px solid #b91c1c', paddingBottom: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#ef4444' }}>Admin — Browse Canon</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Create Folder */}
        <div style={{ background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
          <h3 style={{ marginTop: 0, color: '#ef4444' }}>Create Folder</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              style={{ padding: 8, background: '#2563eb', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            />
            <input
              value={folderSlug}
              onChange={(e) => setFolderSlug(e.target.value)}
              placeholder="Slug (optional)"
              style={{ padding: 8, background: '#2563eb', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            />
            <select
              value={folderParent}
              onChange={(e) => setFolderParent(e.target.value)}
              style={{ padding: 8, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            >
              <option value="">No parent</option>
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button
              onClick={() => createFolderMut.mutate({ name: folderName, slug: folderSlug || undefined, parentId: folderParent || undefined })}
              disabled={!folderName || createFolderMut.isPending}
              style={{ padding: '8px 12px', background: '#b91c1c', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer' }}
            >
              {createFolderMut.isPending ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </div>

        {/* Create Page */}
        <div style={{ background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
          <h3 style={{ marginTop: 0, color: '#ef4444' }}>Create Page</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <input
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Page title"
              style={{ padding: 8, background: '#2563eb', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            />
            <input
              value={pageSlug}
              onChange={(e) => setPageSlug(e.target.value)}
              placeholder="Slug (optional)"
              style={{ padding: 8, background: '#2563eb', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            />
            <select
              value={pageFolder}
              onChange={(e) => setPageFolder(e.target.value)}
              style={{ padding: 8, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            >
              <option value="">Select folder</option>
              {folders.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setUseFileUpload(!useFileUpload);
                  if (useFileUpload) {
                    setPageMarkdown('');
                    setUploadedFileName(null);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: useFileUpload ? '#059669' : '#111827',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {useFileUpload ? '✓ Using File' : 'Upload .md File'}
              </button>
              {uploadedFileName && (
                <span style={{ fontSize: '12px', opacity: 0.8, color: '#22c55e' }}>
                  {uploadedFileName}
                </span>
              )}
            </div>
            {useFileUpload ? (
              <input
                type="file"
                accept=".md"
                onChange={handleFileUpload}
                style={{
                  padding: 8,
                  background: '#111827',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
            ) : (
              <textarea
                value={pageMarkdown}
                onChange={(e) => setPageMarkdown(e.target.value)}
                placeholder="Markdown content"
                rows={8}
                style={{ padding: 8, background: '#0b2459', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, resize: 'vertical' }}
              />
            )}
            <button
              onClick={() => pageFolder && createPageMut.mutate({ title: pageTitle, slug: pageSlug || undefined, folderId: pageFolder, markdown: pageMarkdown })}
              disabled={!pageTitle || !pageFolder || !pageMarkdown || createPageMut.isPending}
              style={{ padding: '8px 12px', background: '#b91c1c', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer' }}
            >
              {createPageMut.isPending ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </div>
      </div>

      {/* Folder list */}
      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0, color: '#ef4444' }}>Folders</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {folders.map((f: any) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#ef4444' }}>•</span>
              <span>{f.name}</span>
              <span style={{ opacity: 0.7 }}>({f.slug})</span>
            </div>
          ))}
          {folders.length === 0 && (
            <div style={{ opacity: 0.7 }}>No folders yet</div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default AdminPage;

