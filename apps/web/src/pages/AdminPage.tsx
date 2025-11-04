import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getCanonFolders,
  createCanonFolder,
  createCanonPage,
  getUnmoderatedTheories,
  moderateTheory,
  getTags,
  createTag,
} from '../services/api';
import './LandingPage.css';

function TheoryModerationItem({ theory, tags, onModerate, onCreateTag, isModerating, isCreatingTag }: {
  theory: any;
  tags: any[];
  onModerate: (data: { id: string; status: 'approved' | 'denied'; tagIds?: string[]; denialReason?: string }) => void;
  onCreateTag: (name: string) => void;
  isModerating: boolean;
  isCreatingTag: boolean;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [showDenialInput, setShowDenialInput] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    onCreateTag(newTagName.trim());
    setNewTagName('');
  };

  const handleApprove = () => {
    if (selectedTags.length === 0) {
      alert('Please select at least one tag to approve');
      return;
    }
    onModerate({ id: theory.id, status: 'approved', tagIds: selectedTags });
    setSelectedTags([]);
  };

  const handleDeny = () => {
    if (showDenialInput && !denialReason.trim()) {
      alert('Please provide a denial reason');
      return;
    }
    onModerate({ id: theory.id, status: 'denied', denialReason: denialReason || undefined });
    setDenialReason('');
    setShowDenialInput(false);
  };

  return (
    <div style={{ border: '1px solid #ef4444', padding: 12, borderRadius: 4, background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ marginBottom: 8 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '14px', lineHeight: 1.5 }}>{theory.content}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7, color: '#fff' }}>
          By: {theory.createdBy?.name || theory.createdBy?.email || 'Unknown'} • {new Date(theory.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '12px', color: '#ef4444' }}>Select Tags:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                style={{
                  padding: '4px 8px',
                  background: selectedTags.includes(tag.id) ? '#059669' : '#111827',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
              placeholder="New tag name"
              style={{ padding: '4px 8px', background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, fontSize: '12px', flex: 1 }}
            />
            <button
              onClick={handleCreateTag}
              disabled={isCreatingTag}
              style={{ padding: '4px 8px', background: '#2563eb', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}
            >
              + Tag
            </button>
          </div>
        </div>

        {showDenialInput && (
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px', color: '#ef4444' }}>Denial Reason:</label>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Reason for denial..."
              rows={2}
              style={{ padding: 6, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, fontSize: '12px', width: '100%' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleApprove}
            disabled={isModerating || selectedTags.length === 0}
            style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}
          >
            Approve
          </button>
          <button
            onClick={() => {
              if (!showDenialInput) {
                setShowDenialInput(true);
              } else {
                handleDeny();
              }
            }}
            disabled={isModerating}
            style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}
          >
            {showDenialInput ? 'Confirm Deny' : 'Deny'}
          </button>
          {showDenialInput && (
            <button
              onClick={() => {
                setShowDenialInput(false);
                setDenialReason('');
              }}
              style={{ padding: '6px 12px', background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = !!user?.roles?.includes('admin');
  const qc = useQueryClient();

  const { data: foldersData } = useQuery({
    queryKey: ['canon-folders'],
    queryFn: () => getCanonFolders(),
  });

  const { data: theoriesData, refetch: refetchTheories } = useQuery({
    queryKey: ['unmoderated-theories'],
    queryFn: () => getUnmoderatedTheories(),
    enabled: isAdmin,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags(),
    enabled: isAdmin,
  });

  const folders = foldersData?.folders ?? [];
  const theories = theoriesData?.theories ?? [];
  const tags = tagsData?.tags ?? [];

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

  const moderateTheoryMut = useMutation({
    mutationFn: ({ id, status, tagIds, denialReason }: { id: string; status: 'approved' | 'denied'; tagIds?: string[]; denialReason?: string }) =>
      moderateTheory(id, { status, tagIds, denialReason }),
    onSuccess: () => {
      refetchTheories();
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const createTagMut = useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });

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
              style={{ padding: 8, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            />
            <input
              value={folderSlug}
              onChange={(e) => setFolderSlug(e.target.value)}
              placeholder="Slug (optional)"
              style={{ padding: 8, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
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
              style={{ padding: 8, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
            />
            <input
              value={pageSlug}
              onChange={(e) => setPageSlug(e.target.value)}
              placeholder="Slug (optional)"
              style={{ padding: 8, background: '#111827', color: '#fff', border: '1px solid #ef4444', borderRadius: 4 }}
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

      {/* Theory Moderation */}
      <div style={{ marginTop: 30, background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
        <h3 style={{ marginTop: 0, color: '#ef4444' }}>Moderate Theories</h3>
        <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'grid', gap: 12 }}>
          {theories.map((theory: any) => (
            <TheoryModerationItem
              key={theory.id}
              theory={theory}
              tags={tags}
              onModerate={moderateTheoryMut.mutate}
              onCreateTag={createTagMut.mutate}
              isModerating={moderateTheoryMut.isPending}
              isCreatingTag={createTagMut.isPending}
            />
          ))}
          {theories.length === 0 && (
            <div style={{ opacity: 0.7, padding: 20, textAlign: 'center' }}>No unmoderated theories</div>
          )}
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

export default AdminPage;

