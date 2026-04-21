import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { authMiddleware } from '../middleware/auth.js';

export const projectRouter = Router();

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  visibility: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

interface File {
  id: string;
  project_id: string;
  path: string;
  content: string | null;
  language: string | null;
  is_directory: number;
  created_at: string;
  updated_at: string;
}

projectRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, visibility, settings } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, description, owner_id, visibility, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, req.user!.id, visibility || 'private', settings || '{}', now, now);

    db.prepare(`
      INSERT INTO files (id, project_id, path, content, language, is_directory, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, '/', null, null, 1, now, now);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

projectRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      WHERE p.owner_id = ? OR p.visibility = 'public'
         OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      ORDER BY p.updated_at DESC
    `).all(req.user!.id, req.user!.id);

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

projectRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = db.prepare(`
      SELECT p.*, u.username as owner_username
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(req.params.id) as (Project & { owner_username: string }) | undefined;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.owner_id === req.user!.id;
    const isMember = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user!.id);

    if (!isOwner && !isMember && project.visibility !== 'public') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = db.prepare(`
      SELECT u.id, u.username, u.email, u.avatar_url, pm.role, pm.invited_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    res.json({ project, members, isOwner });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

projectRouter.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Project | undefined;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only owner can update project' });
    }

    const { name, description, visibility, settings } = req.body;
    const now = new Date().toISOString();

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (visibility !== undefined) {
      updates.push('visibility = ?');
      values.push(visibility);
    }
    if (settings !== undefined) {
      updates.push('settings = ?');
      values.push(JSON.stringify(settings));
    }

    values.push(req.params.id);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    res.json({ project: updatedProject });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

projectRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Project | undefined;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only owner can delete project' });
    }

    db.prepare('DELETE FROM project_members WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM documents WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM files WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

projectRouter.post('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Project | undefined;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only owner can add members' });
    }

    const { email, role } = req.body;
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
    if (existing) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    db.prepare(`
      INSERT INTO project_members (id, project_id, user_id, role, invited_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.params.id, user.id, role || 'editor', new Date().toISOString());

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

projectRouter.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Project | undefined;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only owner can remove members' });
    }

    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

projectRouter.get('/:id/files', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const files = db.prepare(`
      SELECT * FROM files WHERE project_id = ? ORDER BY path
    `).all(req.params.id);

    res.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

projectRouter.post('/:id/files', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { path: filePath, content, language, isDirectory } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO files (id, project_id, path, content, language, is_directory, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, filePath, content || null, language || null, isDirectory ? 1 : 0, now, now);

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);

    res.status(201).json({ file });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

projectRouter.get('/:id/files/:fileId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND project_id = ?').get(req.params.fileId, req.params.id) as File | undefined;

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

projectRouter.put('/:id/files/:fileId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content, language } = req.body;
    const now = new Date().toISOString();

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (language !== undefined) {
      updates.push('language = ?');
      values.push(language);
    }

    values.push(req.params.fileId);
    db.prepare(`UPDATE files SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, req.params.id);

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);

    res.json({ file });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

projectRouter.delete('/:id/files/:fileId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM files WHERE id = ? AND project_id = ?').run(req.params.fileId, req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});
