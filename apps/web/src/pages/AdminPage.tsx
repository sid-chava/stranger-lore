import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getUnmoderatedTheories,
  moderateTheory,
  getTags,
  createTag,
  getIncompleteTheories,
  getApprovedTheories,
  updateTheoryTitle,
  splitTheory,
  updateTheoryContent,
  deleteTag,
} from '../services/api';
import './LandingPage.css';
import AnimatedCounter from '../components/AnimatedCounter';
import { useContributionStats } from '../hooks/useContributionStats';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DirectoryLinks from '../components/DirectoryLinks';

type TheoryModerationItemProps = {
  theory: any;
  tags: any[];
  onModerate: (data: {
    id: string;
    status: 'approved' | 'denied';
    title?: string;
    tagIds?: string[];
    denialReason?: string;
  }) => void;
  onCreateTag: (name: string) => void;
  onSplit: (data: { id: string; parts: { title: string; content: string; tagIds?: string[] }[] }) => void;
  onUpdateContent: (data: { id: string; content: string }) => void;
  isModerating: boolean;
  isCreatingTag: boolean;
  isSplitting: boolean;
};

function TheoryModerationItem({
  theory,
  tags,
  onModerate,
  onCreateTag,
  onSplit,
  onUpdateContent,
  isModerating,
  isCreatingTag,
  isSplitting,
}: TheoryModerationItemProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    theory.tags?.map((t: any) => t.tag.id) ?? []
  );
  const [title, setTitle] = useState(theory.title || '');
  const [contentDraft, setContentDraft] = useState(theory.content);
  const [newTagName, setNewTagName] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [showDenialInput, setShowDenialInput] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);

  useEffect(() => {
    setSelectedTags(theory.tags?.map((t: any) => t.tag.id) ?? []);
    setTitle(theory.title || '');
    setContentDraft(theory.content);
    setIsExpanded(false);
    setIsEditingContent(false);
  }, [theory.id, theory.title, theory.tags, theory.content]);

  useEffect(() => {
    setSelectedTags((prev) => prev.filter((id) => tags.some((tag: any) => tag.id === id)));
  }, [tags]);

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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Title is required before approving');
      return;
    }
    onModerate({
      id: theory.id,
      status: 'approved',
      title: trimmedTitle,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    });
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              border: 'none',
              background: 'none',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 12,
              padding: 0,
            }}
          >
            {isExpanded ? 'Collapse Text' : 'Expand Text'}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              border: 'none',
              background: 'none',
              color: '#fbbf24',
              cursor: 'pointer',
              fontSize: 12,
              padding: 0,
            }}
          >
            Preview Markdown
          </button>
          <button
            onClick={() => setIsEditingContent((prev) => !prev)}
            style={{
              border: 'none',
              background: 'none',
              color: '#4ade80',
              cursor: 'pointer',
              fontSize: 12,
              padding: 0,
            }}
          >
            {isEditingContent ? 'Cancel Edit' : 'Edit Content'}
          </button>
        </div>
        {isEditingContent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #ef4444',
                background: '#0f172a',
                color: '#fff',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  onUpdateContent({ id: theory.id, content: contentDraft });
                  setIsEditingContent(false);
                }}
                style={{
                  padding: '6px 12px',
                  background: '#059669',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Save Content
              </button>
              <button
                onClick={() => {
                  setContentDraft(theory.content);
                  setIsEditingContent(false);
                }}
                style={{
                  padding: '6px 12px',
                  background: '#111827',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              maxHeight: isExpanded ? 'none' : 140,
              overflow: isExpanded ? 'auto' : 'hidden',
              paddingRight: isExpanded ? 0 : 4,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              padding: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '14px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {contentDraft}
            </p>
            {!isExpanded && contentDraft.length > 400 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: 'linear-gradient(to bottom, rgba(11,18,32,0) 0%, rgba(11,18,32,0.9) 60%, rgba(11,18,32,1) 100%)',
                }}
              />
            )}
          </div>
        )}
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7, color: '#fff' }}>
          By: {theory.createdBy?.name || theory.createdBy?.email || 'Unknown'} • {new Date(theory.createdAt).toLocaleDateString()}
        </p>
      </div>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '12px', color: '#ef4444' }}>
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title for this theory"
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0b1220',
              color: '#fff',
              border: '1px solid #ef4444',
              borderRadius: 4,
              fontSize: '13px',
            }}
          />
        </div>
      
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '12px', color: '#ef4444' }}>Select Tags:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#fff', opacity: 0.7 }}>No tags yet. Create one below.</span>
            ) : (
              tags.map((tag: any) => (
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
              ))
            )}
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleApprove}
            disabled={isModerating}
            style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: '1px solid #ef4444', borderRadius: 4, cursor: 'pointer', fontSize: '12px' }}
          >
            {isModerating ? 'Approving...' : 'Approve'}
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
          <button
            onClick={() => setShowSplitModal(true)}
            disabled={isSplitting}
            style={{
              padding: '6px 12px',
              background: '#1d4ed8',
              color: '#fff',
              border: '1px solid #ef4444',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {isSplitting ? 'Splitting...' : 'Split into parts'}
          </button>
        </div>
      </div>

      {showSplitModal && (
        <SplitTheoryModal
          theory={theory}
          tags={tags}
          isSubmitting={isSplitting}
          onClose={() => setShowSplitModal(false)}
          onSubmit={(parts) => {
            onSplit({ id: theory.id, parts });
            setShowSplitModal(false);
          }}
        />
      )}

      {showPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: 800,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#0b1220',
              border: '1px solid #ef4444',
              borderRadius: 8,
              padding: 24,
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#f87171' }}>Markdown preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{theory.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type SplitTheoryModalProps = {
  theory: any;
  tags: any[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (parts: { title: string; content: string; tagIds?: string[] }[]) => void;
};

function SplitTheoryModal({ theory, tags, isSubmitting, onClose, onSubmit }: SplitTheoryModalProps) {
  const [parts, setParts] = useState<{ title: string; content: string; tagIds: string[] }[]>(() => [
    {
      title: theory.title || '',
      content: theory.content,
      tagIds: [],
    },
  ]);

  useEffect(() => {
    setParts((prev) =>
      prev.map((part) => ({
        ...part,
        tagIds: part.tagIds.filter((tagId) => tags.some((tag: any) => tag.id === tagId)),
      }))
    );
  }, [tags]);

  const updatePart = (index: number, field: 'title' | 'content', value: string) => {
    setParts((prev) =>
      prev.map((part, i) => (i === index ? { ...part, [field]: value } : part))
    );
  };

  const togglePartTag = (index: number, tagId: string) => {
    setParts((prev) =>
      prev.map((part, i) => {
        if (i !== index) return part;
        const exists = part.tagIds.includes(tagId);
        return {
          ...part,
          tagIds: exists ? part.tagIds.filter((id) => id !== tagId) : [...part.tagIds, tagId],
        };
      })
    );
  };

  const addPart = () => {
    setParts((prev) => [
      ...prev,
      {
        title: '',
        content: '',
        tagIds: [],
      },
    ]);
  };

  const removePart = (index: number) => {
    if (parts.length <= 1) return;
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const normalized = parts.map((part) => ({
      ...part,
      title: part.title.trim(),
      content: part.content.trim(),
    }));

    if (normalized.some((part) => !part.title || !part.content)) {
      alert('All parts need a title and content');
      return;
    }

    onSubmit(normalized);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 1200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0b1220',
          border: '1px solid #ef4444',
          borderRadius: 8,
          padding: 20,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#ef4444' }}>Split Theory</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
          Break this submission into multiple theories. Each part needs its own title, content, and optional tags.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {parts.map((part, index) => (
            <div
              key={index}
              style={{
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: 6,
                padding: 12,
                background: '#111827',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#f87171' }}>Part {index + 1}</h4>
                {parts.length > 1 && (
                  <button
                    onClick={() => removePart(index)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#f87171' }}>
                Title
              </label>
              <input
                value={part.title}
                onChange={(e) => updatePart(index, 'title', e.target.value)}
                placeholder="Title"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: '#0b1220',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />

              <label style={{ display: 'block', marginTop: 12, fontSize: 12, color: '#f87171' }}>
                Content
              </label>
              <textarea
                value={part.content}
                onChange={(e) => updatePart(index, 'content', e.target.value)}
                rows={4}
                placeholder="Theory text"
                style={{
                  width: '100%',
                  padding: 8,
                  background: '#0b1220',
                  color: '#fff',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  resize: 'vertical',
                }}
              />

              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#f87171' }}>
                  Tags (optional)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((tag: any) => {
                    const selected = part.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => togglePartTag(index, tag.id)}
                        type="button"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid #ef4444',
                          background: selected ? '#047857' : '#111827',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                  {tags.length === 0 && (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>No tags available</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button
            onClick={addPart}
            style={{
              padding: '8px 12px',
              border: '1px dashed #ef4444',
              background: 'transparent',
              color: '#fff',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + Add part
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                border: '1px solid #ef4444',
                background: 'transparent',
                color: '#fff',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Splitting...' : 'Split'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type IncompleteTheoryItemProps = {
  theory: any;
  onSave: (data: { id: string; title: string; tagIds?: string[] }) => void;
  isSaving: boolean;
};

function IncompleteTheoryItem({ theory, onSave, isSaving }: IncompleteTheoryItemProps) {
  const [title, setTitle] = useState(theory.title || '');

  useEffect(() => {
    setTitle(theory.title || '');
  }, [theory.id, theory.title]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      alert('Title cannot be empty');
      return;
    }
    onSave({ id: theory.id, title: trimmed });
  };

  return (
    <div style={{ border: '1px solid #ef4444', borderRadius: 6, padding: 12, background: 'rgba(0,0,0,0.35)' }}>
      <p style={{ margin: 0, fontSize: 13, color: '#fff', whiteSpace: 'pre-wrap' }}>{theory.content}</p>
      <p style={{ margin: '4px 0 0 0', fontSize: 11, opacity: 0.7 }}>
        Approved {theory.moderatedAt ? new Date(theory.moderatedAt).toLocaleDateString() : ''}
      </p>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#f87171' }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a title"
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 4,
            border: '1px solid #ef4444',
            background: '#0b1220',
            color: '#fff',
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          marginTop: 10,
          padding: '6px 12px',
          borderRadius: 4,
          border: 'none',
          background: '#059669',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        {isSaving ? 'Saving...' : 'Save title'}
      </button>
    </div>
  );
}

type ApprovedTheoryItemProps = {
  theory: any;
  tags: any[];
  onSaveMeta: (data: { id: string; title: string; tagIds?: string[] }) => void;
  onSaveContent: (data: { id: string; content: string }) => void;
  onRemove: (data: { id: string; reason?: string }) => void;
  isSavingMeta: boolean;
  isSavingContent: boolean;
  isRemoving: boolean;
};

function ApprovedTheoryItem({
  theory,
  tags,
  onSaveMeta,
  onSaveContent,
  onRemove,
  isSavingMeta,
  isSavingContent,
  isRemoving,
}: ApprovedTheoryItemProps) {
  const [title, setTitle] = useState(theory.title || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(theory.tags?.map((tag: any) => tag.id) ?? []);
  const [contentDraft, setContentDraft] = useState(theory.content);
  const [isEditingContent, setIsEditingContent] = useState(false);

  useEffect(() => {
    setTitle(theory.title || '');
    setSelectedTags(theory.tags?.map((tag: any) => tag.id) ?? []);
    setContentDraft(theory.content);
    setIsEditingContent(false);
  }, [theory.id, theory.title, theory.tags, theory.content]);

  useEffect(() => {
    setSelectedTags((prev) => prev.filter((id) => tags.some((tag: any) => tag.id === id)));
  }, [tags]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleSaveMeta = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      alert('Title is required');
      return;
    }
    onSaveMeta({ id: theory.id, title: trimmed, tagIds: selectedTags });
  };

  const handleSaveContent = () => {
    if (!contentDraft.trim()) {
      alert('Content cannot be empty');
      return;
    }
    onSaveContent({ id: theory.id, content: contentDraft });
    setIsEditingContent(false);
  };

  const handleRemove = () => {
    if (!window.confirm('Remove this theory from the public list?')) {
      return;
    }
    const reason = window.prompt('Optional: share a short reason for removing this theory.');
    onRemove({ id: theory.id, reason: reason || undefined });
  };

  return (
    <div style={{ border: '1px solid rgba(59,130,246,0.5)', borderRadius: 8, padding: 16, background: 'rgba(15,23,42,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h4 style={{ margin: 0, color: '#f87171' }}>{theory.title}</h4>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#9ca3af' }}>
            By {theory.createdBy?.username || theory.createdBy?.name || theory.createdBy?.email || 'Unknown'} •{' '}
            {theory.moderatedAt ? new Date(theory.moderatedAt).toLocaleDateString() : 'Unknown date'}
          </p>
        </div>
        <div style={{ fontSize: 12, color: '#93c5fd', textAlign: 'right' }}>
          <div>Score: {theory.score ?? 0}</div>
          <div>▲ {theory.upvotes ?? 0} / ▼ {theory.downvotes ?? 0}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#ef4444' }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 4,
            border: '1px solid #ef4444',
            background: '#0b1220',
            color: '#fff',
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#ef4444' }}>Tags</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.length === 0 && <span style={{ fontSize: 12, opacity: 0.7 }}>No tags available</span>}
          {tags.map((tag: any) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #ef4444',
                background: selectedTags.includes(tag.id) ? '#059669' : '#111827',
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {isEditingContent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #ef4444',
                background: '#0f172a',
                color: '#fff',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveContent}
                disabled={isSavingContent}
                style={{
                  padding: '6px 12px',
                  background: '#059669',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {isSavingContent ? 'Saving...' : 'Save Content'}
              </button>
              <button
                onClick={() => {
                  setContentDraft(theory.content);
                  setIsEditingContent(false);
                }}
                style={{
                  padding: '6px 12px',
                  background: '#111827',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              padding: 8,
              color: '#fff',
              fontSize: 14,
              whiteSpace: 'pre-wrap',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            {theory.content}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleSaveMeta}
          disabled={isSavingMeta}
          style={{
            padding: '6px 12px',
            background: '#2563eb',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {isSavingMeta ? 'Saving...' : 'Save Title & Tags'}
        </button>
        <button
          onClick={() => setIsEditingContent((prev) => !prev)}
          style={{
            padding: '6px 12px',
            background: '#0ea5e9',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {isEditingContent ? 'Cancel Edit' : 'Edit Content'}
        </button>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          style={{
            padding: '6px 12px',
            background: '#991b1b',
            border: '1px solid #ef4444',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {isRemoving ? 'Removing...' : 'Remove from list'}
        </button>
      </div>
    </div>
  );
}

function AdminPage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = !!user?.roles?.includes('admin');
  const qc = useQueryClient();

  const { data: theoriesData, refetch: refetchTheories } = useQuery({
    queryKey: ['unmoderated-theories'],
    queryFn: () => getUnmoderatedTheories(),
    enabled: isAdmin,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags(),
    enabled: isAdmin,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: incompleteData, refetch: refetchIncomplete } = useQuery({
    queryKey: ['incomplete-theories'],
    queryFn: () => getIncompleteTheories(),
    enabled: isAdmin,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  const [approvedSearchInput, setApprovedSearchInput] = useState('');
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('');
  const [approvedPage, setApprovedPage] = useState(1);
  const approvedPageSize = 25;

  useEffect(() => {
    const handler = setTimeout(() => {
      setApprovedSearchQuery(approvedSearchInput.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [approvedSearchInput]);

  useEffect(() => {
    setApprovedPage(1);
  }, [approvedSearchQuery]);

  const {
    data: approvedData,
    refetch: refetchApproved,
    isFetching: isFetchingApproved,
  } = useQuery<{ theories: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>({
    queryKey: ['approved-theories', { search: approvedSearchQuery, page: approvedPage }],
    queryFn: () =>
      getApprovedTheories({
        search: approvedSearchQuery || undefined,
        page: approvedPage,
        pageSize: approvedPageSize,
      }),
    enabled: isAdmin,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
  const { data: contributionStats } = useContributionStats();
  const totalContributions = contributionStats?.totalContributions ?? 0;

  const theories = theoriesData?.theories ?? [];
  const tags = tagsData?.tags ?? [];
  const incompleteTheories = incompleteData?.theories ?? [];
  const approvedTheories = approvedData?.theories ?? [];
  const approvedTotal = approvedData?.total ?? 0;
  const hasMoreApproved = approvedData?.hasMore ?? false;
  const approvedRangeStart = approvedTheories.length > 0 ? (approvedPage - 1) * approvedPageSize + 1 : 0;
  const approvedRangeEnd = approvedTheories.length > 0 ? approvedRangeStart + approvedTheories.length - 1 : 0;

  // Commented out for now - folder/page creation disabled
  // const [folderName, setFolderName] = useState('');
  // const [folderSlug, setFolderSlug] = useState('');
  // const [folderParent, setFolderParent] = useState<string | ''>('');

  // const [pageTitle, setPageTitle] = useState('');
  // const [pageSlug, setPageSlug] = useState('');
  // const [pageFolder, setPageFolder] = useState<string | ''>('');
  // const [pageMarkdown, setPageMarkdown] = useState('');
  // const [useFileUpload, setUseFileUpload] = useState(false);
  // const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // const createFolderMut = useMutation({
  //   mutationFn: (input: {
  //     name: string; slug?: string; parentId?: string | null;
  //   }) => createCanonFolder(input),
  //   onSuccess: () => {
  //     setFolderName(''); setFolderSlug(''); setFolderParent('');
  //     qc.invalidateQueries({ queryKey: ['canon-folders'] });
  //   },
  // });

  // const createPageMut = useMutation({
  //   mutationFn: (input: { title: string; slug?: string; folderId: string; markdown: string; }) => createCanonPage(input),
  //   onSuccess: () => {
  //     setPageTitle(''); setPageSlug(''); setPageFolder(''); setPageMarkdown('');
  //     setUseFileUpload(false); setUploadedFileName(null);
  //   },
  // });

  // const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   if (!file.name.endsWith('.md')) {
  //     alert('Please upload a .md file');
  //     return;
  //   }

  //   setUploadedFileName(file.name);
  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     const content = event.target?.result as string;
  //     setPageMarkdown(content);
  //   };
  //   reader.readAsText(file);
  // };

  const moderateTheoryMut = useMutation({
    mutationFn: ({
      id,
      status,
      title,
      tagIds,
      denialReason,
    }: {
      id: string;
      status: 'approved' | 'denied';
      title?: string;
      tagIds?: string[];
      denialReason?: string;
    }) => moderateTheory(id, { status, title, tagIds, denialReason }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['unmoderated-theories'] });
      const previous = qc.getQueryData(['unmoderated-theories']);
      qc.setQueryData(['unmoderated-theories'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          theories: old.theories?.filter((theory: any) => theory.id !== id) ?? [],
        };
      });
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        qc.setQueryData(['unmoderated-theories'], context.previous);
      }
      console.error('Failed to moderate theory:', error);
      alert('Failed to moderate theory: ' + (error.message || 'Unknown error'));
    },
    onSettled: () => {
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

  const deleteTagMut = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag: ' + (error.message || 'Unknown error'));
    },
  });

  const handleDeleteTag = (tag: any) => {
    if (deleteTagMut.isPending) {
      return;
    }
    const confirmed = window.confirm(`Remove the tag "${tag.name}" from the bank?`);
    if (!confirmed) return;
    deleteTagMut.mutate(tag.id);
  };

  const splitTheoryMut = useMutation({
    mutationFn: ({ id, parts }: { id: string; parts: { title: string; content: string; tagIds?: string[] }[] }) =>
      splitTheory(id, parts),
    onMutate: async ({ id, parts }) => {
      await qc.cancelQueries({ queryKey: ['unmoderated-theories'] });
      const previous = qc.getQueryData(['unmoderated-theories']);
      const tempIdPrefix = `temp-${Date.now()}`;
      qc.setQueryData(['unmoderated-theories'], (old: any) => {
        if (!old) return old;
        const remaining = old.theories?.filter((theory: any) => theory.id !== id) ?? [];
        const template = old.theories?.find((theory: any) => theory.id === id);
        const provisional = parts.map((part, index) => ({
          ...(template || {}),
          id: `${tempIdPrefix}-${index}`,
          title: part.title,
          content: part.content,
          tags: [],
        }));
        return { ...old, theories: [...provisional, ...remaining] };
      });
      return { previous, tempIdPrefix };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        qc.setQueryData(['unmoderated-theories'], context.previous);
      }
      console.error('Failed to split theory:', error);
      alert('Failed to split theory: ' + (error.message || 'Unknown error'));
    },
    onSuccess: (data, variables, context) => {
      qc.setQueryData(['unmoderated-theories'], (old: any) => {
        if (!old) return old;
        const filtered = old.theories?.filter(
          (theory: any) =>
            theory.id !== variables.id && !(context?.tempIdPrefix && theory.id.startsWith(context.tempIdPrefix))
        ) ?? [];
        return { ...old, theories: [...data.theories, ...filtered] };
      });
    },
    onSettled: () => {
      refetchTheories();
    },
  });

  const updateTitleMut = useMutation({
    mutationFn: ({ id, title, tagIds }: { id: string; title: string; tagIds?: string[] }) =>
      updateTheoryTitle(id, { title, tagIds }),
    onSuccess: () => {
      refetchIncomplete();
      refetchApproved();
      qc.invalidateQueries({ queryKey: ['top-theories'] });
    },
    onError: (error: any) => {
      console.error('Failed to update title:', error);
      alert('Failed to update title: ' + (error.message || 'Unknown error'));
    },
  });

  const updateContentMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateTheoryContent(id, content),
    onMutate: async ({ id, content }) => {
      await qc.cancelQueries({ queryKey: ['unmoderated-theories'] });
      const previous = qc.getQueryData(['unmoderated-theories']);
      qc.setQueryData(['unmoderated-theories'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          theories:
            old.theories?.map((theory: any) => (theory.id === id ? { ...theory, content } : theory)) ?? [],
        };
      });
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        qc.setQueryData(['unmoderated-theories'], context.previous);
      }
      console.error('Failed to update content:', error);
      alert('Failed to update content: ' + (error.message || 'Unknown error'));
    },
    onSettled: () => {
      refetchTheories();
    },
  });

  const updateApprovedContentMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateTheoryContent(id, content),
    onSuccess: () => {
      refetchApproved();
      qc.invalidateQueries({ queryKey: ['top-theories'] });
    },
    onError: (error: any) => {
      console.error('Failed to update content:', error);
      alert('Failed to update content: ' + (error.message || 'Unknown error'));
    },
  });

  const removeApprovedMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      moderateTheory(id, { status: 'denied', denialReason: reason }),
    onSuccess: () => {
      setApprovedPage((prev) => {
        if (approvedData && approvedData.theories.length <= 1 && prev > 1 && !approvedData.hasMore) {
          return prev - 1;
        }
        return prev;
      });
      refetchApproved();
      qc.invalidateQueries({ queryKey: ['top-theories'] });
    },
    onError: (error: any) => {
      console.error('Failed to remove theory:', error);
      alert('Failed to remove theory: ' + (error.message || 'Unknown error'));
    },
  });

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="landing-page admin-view">
        <div className="background-image" />
        <div className="main-content" style={{ padding: 20, color: '#fff' }}>
          <h2 style={{ margin: 0, color: '#ef4444' }}>Admin</h2>
          <p style={{ marginTop: 8 }}>You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page admin-view">
      <div className="background-image" />
      <div
        className="main-content"
        style={{
          padding: 20,
          color: '#fff',
          fontFamily: 'Roboto Mono, monospace',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ borderBottom: '2px solid #b91c1c', paddingBottom: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#ef4444' }}>Admin — Browse Canon</h2>
      </div>

      {/* Create Folder and Page sections - commented out for now */}
      {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
      </div> */}

      {/* Needs Title section */}
      <div style={{ marginTop: 30, background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
        <h3 style={{ marginTop: 0, color: '#ef4444' }}>Approved Theories Missing Titles</h3>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>
          These theories are hidden from the public list until a title is added.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {incompleteTheories.map((theory: any) => (
            <IncompleteTheoryItem
              key={theory.id}
              theory={theory}
              onSave={({ id, title }) => updateTitleMut.mutate({ id, title })}
              isSaving={updateTitleMut.isPending}
            />
          ))}
          {incompleteTheories.length === 0 && (
            <div style={{ opacity: 0.7, textAlign: 'center', padding: 20 }}>
              All approved theories have titles. Nice work!
            </div>
          )}
      </div>
    </div>

      {/* Approved Theories */}
      <div style={{ marginTop: 30, background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, color: '#ef4444' }}>Approved Theories</h3>
          <input
            value={approvedSearchInput}
            onChange={(e) => setApprovedSearchInput(e.target.value)}
            placeholder="Search title, author, or tag"
            style={{
              flex: 1,
              minWidth: 220,
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid #ef4444',
              background: '#0b1220',
              color: '#fff',
            }}
          />
        </div>
        <p style={{ fontSize: 12, opacity: 0.8, margin: '12px 0 16px 0' }}>
          Edit approved theories, tune their tags, or remove them from the public feed if needed.
        </p>
        {isFetchingApproved && !approvedData ? (
          <div style={{ opacity: 0.7, textAlign: 'center', padding: 20 }}>Loading approved theories...</div>
        ) : approvedTheories.length === 0 ? (
          <div style={{ opacity: 0.7, textAlign: 'center', padding: 20 }}>No approved theories match this search.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 16 }}>
              {approvedTheories.map((theory: any) => (
                <ApprovedTheoryItem
                  key={theory.id}
                  theory={theory}
                  tags={tags}
                  onSaveMeta={(payload) => updateTitleMut.mutate(payload)}
                  onSaveContent={(payload) => updateApprovedContentMut.mutate(payload)}
                  onRemove={(payload) => removeApprovedMut.mutate(payload)}
                  isSavingMeta={updateTitleMut.isPending}
                  isSavingContent={updateApprovedContentMut.isPending}
                  isRemoving={removeApprovedMut.isPending}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                Showing {approvedRangeStart}-{approvedRangeEnd} of {approvedTotal}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setApprovedPage((prev) => Math.max(1, prev - 1))}
                  disabled={approvedPage === 1 || isFetchingApproved}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #ef4444',
                    background: approvedPage === 1 ? 'rgba(239,68,68,0.2)' : '#111827',
                    color: '#fff',
                    cursor: approvedPage === 1 || isFetchingApproved ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setApprovedPage((prev) => prev + 1)}
                  disabled={!hasMoreApproved || isFetchingApproved}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #ef4444',
                    background: !hasMoreApproved ? 'rgba(239,68,68,0.2)' : '#111827',
                    color: '#fff',
                    cursor: !hasMoreApproved || isFetchingApproved ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tag Bank */}
      <div style={{ marginTop: 30, background: 'rgba(0,0,0,0.35)', padding: 16, border: '1px solid #ef4444', borderRadius: 6 }}>
        <h3 style={{ marginTop: 0, color: '#ef4444' }}>Tag Bank</h3>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>
          Remove tags from circulation if they are no longer needed. Approved theories that relied on a removed tag will stay published.
        </p>
        {tags.length === 0 ? (
          <div style={{ opacity: 0.7, textAlign: 'center', padding: 20 }}>No tags yet. Create one while moderating.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((tag: any) => (
              <div
                key={tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  border: '1px solid rgba(239,68,68,0.6)',
                  borderRadius: 4,
                  background: 'rgba(15,23,42,0.6)',
                }}
              >
                <span style={{ fontSize: 12, color: '#fff' }}>{tag.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag)}
                  disabled={deleteTagMut.isPending}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: deleteTagMut.isPending ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  {deleteTagMut.isPending ? '...' : 'X'}
                </button>
              </div>
            ))}
          </div>
        )}
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
              onSplit={(payload) => splitTheoryMut.mutate(payload)}
              onUpdateContent={({ id, content }) => updateContentMut.mutate({ id, content })}
              isModerating={moderateTheoryMut.isPending}
              isCreatingTag={createTagMut.isPending}
              isSplitting={splitTheoryMut.isPending}
            />
          ))}
          {theories.length === 0 && (
            <div style={{ opacity: 0.7, padding: 20, textAlign: 'center' }}>No unmoderated theories</div>
          )}
        </div>
      </div>

        </div>

        <DirectoryLinks active="admin" />

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
              <a href="https://tiktok.com/@lore" className="social-link">
                <img src="/assets/social-tiktok.png" alt="TikTok" className="social-icon" />
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

export default AdminPage;
