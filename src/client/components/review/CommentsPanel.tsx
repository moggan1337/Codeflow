import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth';

interface Comment {
  id: string;
  fileId: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  resolved: boolean;
  createdAt: string;
}

interface CommentsPanelProps {
  projectId: string;
  fileId?: string;
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  projectId,
  fileId,
  onClose,
}) => {
  const { token, user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [lineStart, setLineStart] = useState<number | undefined>();
  const [lineEnd, setLineEnd] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [projectId, fileId]);

  const loadComments = async () => {
    try {
      let url = `/api/collaboration/${projectId}/comments`;
      if (fileId) {
        url += `?fileId=${fileId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !fileId) return;

    try {
      const response = await fetch(`/api/collaboration/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileId,
          content: newComment,
          lineStart,
          lineEnd,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
        setLineStart(undefined);
        setLineEnd(undefined);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/collaboration/${projectId}/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolved }),
      });

      if (response.ok) {
        setComments(comments.map(c =>
          c.id === commentId ? { ...c, resolved } : c
        ));
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/collaboration/${projectId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="comments-panel">
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: '1rem' }}>Comments</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          ×
        </button>
      </div>

      {fileId && (
        <form onSubmit={addComment} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border-light)' }}>
          <textarea
            className="form-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={{ resize: 'none', marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="number"
              className="form-input"
              value={lineStart || ''}
              onChange={(e) => setLineStart(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Line"
              min={1}
              style={{ width: '80px', fontSize: '0.85rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
            Add Comment
          </button>
        </form>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div className="spinner" />
          </div>
        ) : comments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No comments yet
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="comment"
              style={{ opacity: comment.resolved ? 0.6 : 1 }}
            >
              <div className="comment-header">
                <div
                  className="comment-avatar"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {comment.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="comment-meta">
                  <div className="comment-author">{comment.username}</div>
                  <div className="comment-time">{formatTime(comment.createdAt)}</div>
                </div>
              </div>

              <div className="comment-content">{comment.content}</div>

              {comment.lineStart && (
                <div className="comment-line">
                  Line {comment.lineStart}
                  {comment.lineEnd && ` - ${comment.lineEnd}`}
                </div>
              )}

              <div className="comment-actions">
                <button onClick={() => resolveComment(comment.id, !comment.resolved)}>
                  {comment.resolved ? 'Unresolve' : 'Resolve'}
                </button>
                {comment.userId === user?.id && (
                  <button onClick={() => deleteComment(comment.id)} style={{ color: 'var(--color-error)' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
