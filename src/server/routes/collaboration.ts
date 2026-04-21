import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { authMiddleware } from '../middleware/auth.js';

export const collaborationRouter = Router();

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

interface Comment {
  id: string;
  project_id: string;
  file_id: string;
  user_id: string;
  content: string;
  line_start: number | null;
  line_end: number | null;
  resolved: number;
  parent_id: string | null;
  created_at: string;
}

collaborationRouter.get('/:projectId/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { fileId } = req.query;

    let query = `
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.project_id = ?
    `;
    const params: any[] = [projectId];

    if (fileId) {
      query += ' AND c.file_id = ?';
      params.push(fileId);
    }

    query += ' ORDER BY c.created_at DESC';

    const comments = db.prepare(query).all(...params);

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

collaborationRouter.post('/:projectId/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { fileId, content, lineStart, lineEnd, parentId } = req.body;

    if (!fileId || !content) {
      return res.status(400).json({ error: 'File ID and content are required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO comments (id, project_id, file_id, user_id, content, line_start, line_end, parent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, projectId, fileId, req.user!.id, content, lineStart || null, lineEnd || null, parentId || null, now);

    const comment = db.prepare(`
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

collaborationRouter.put('/:projectId/comments/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content, resolved } = req.body;

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as Comment | undefined;

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    if (resolved !== undefined) {
      updates.push('resolved = ?');
      values.push(resolved ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(commentId);
      db.prepare(`UPDATE comments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updatedComment = db.prepare(`
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

collaborationRouter.delete('/:projectId/comments/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as Comment | undefined;

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

collaborationRouter.post('/:projectId/comments/:commentId/resolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { resolved = true } = req.body;

    db.prepare('UPDATE comments SET resolved = ? WHERE id = ?').run(resolved ? 1 : 0, commentId);

    const comment = db.prepare(`
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.json({ comment });
  } catch (error) {
    console.error('Resolve comment error:', error);
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

collaborationRouter.post('/:projectId/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { fileId } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO sessions (id, user_id, project_id, file_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user!.id, projectId, fileId || null, now);

    res.status(201).json({ session: { id, projectId, fileId, createdAt: now } });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

collaborationRouter.get('/:projectId/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { active = true } = req.query;

    let query = `
      SELECT s.*, u.username, u.avatar_url
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.project_id = ?
    `;

    if (active === 'true') {
      query += ' AND s.ended_at IS NULL';
    }

    query += ' ORDER BY s.created_at DESC';

    const sessions = db.prepare(query).all(projectId);

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

collaborationRouter.post('/:projectId/presence', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, fileId } = req.body;

    res.json({
      presence: {
        userId: req.user!.id,
        projectId,
        fileId,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
});
