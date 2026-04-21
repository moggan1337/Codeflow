import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { authMiddleware } from '../middleware/auth.js';

export const gitRouter = Router();

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

gitRouter.post('/:projectId/init', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const gitData = {
      repositoryId: uuidv4(),
      branches: ['main'],
      currentBranch: 'main',
      commits: [],
      initialized: true,
      initializedAt: new Date().toISOString(),
    };

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    settings.git = gitData;

    db.prepare('UPDATE projects SET settings = ? WHERE id = ?').run(JSON.stringify(settings), projectId);

    res.json({ git: gitData });
  } catch (error) {
    console.error('Git init error:', error);
    res.status(500).json({ error: 'Failed to initialize git' });
  }
});

gitRouter.get('/:projectId/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    const files = db.prepare('SELECT id, path, updated_at FROM files WHERE project_id = ?',).all(projectId);

    const status = {
      branch: gitData.currentBranch,
      ahead: 0,
      behind: 0,
      modified: [] as string[],
      staged: [] as string[],
      untracked: [] as string[],
      clean: files.length === 0,
    };

    res.json({ status });
  } catch (error) {
    console.error('Git status error:', error);
    res.status(500).json({ error: 'Failed to get git status' });
  }
});

gitRouter.post('/:projectId/commit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { message, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Commit message is required' });
    }

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    const commit = {
      id: uuidv4(),
      message,
      author: {
        id: req.user!.id,
        username: req.user!.username,
      },
      timestamp: new Date().toISOString(),
      branch: gitData.currentBranch,
      files: files || [],
      parent: gitData.commits.length > 0 ? gitData.commits[gitData.commits.length - 1].id : null,
    };

    gitData.commits.push(commit);

    db.prepare('UPDATE projects SET settings = ? WHERE id = ?').run(JSON.stringify(settings), projectId);

    res.json({ commit });
  } catch (error) {
    console.error('Git commit error:', error);
    res.status(500).json({ error: 'Failed to create commit' });
  }
});

gitRouter.get('/:projectId/branches', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    res.json({
      branches: gitData.branches,
      currentBranch: gitData.currentBranch,
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Failed to get branches' });
  }
});

gitRouter.post('/:projectId/branches', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, fromBranch } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    if (gitData.branches.includes(name)) {
      return res.status(409).json({ error: 'Branch already exists' });
    }

    gitData.branches.push(name);

    db.prepare('UPDATE projects SET settings = ? WHERE id = ?').run(JSON.stringify(settings), projectId);

    res.json({ branch: name, branches: gitData.branches });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

gitRouter.post('/:projectId/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { branch } = req.body;

    if (!branch) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    if (!gitData.branches.includes(branch)) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    gitData.currentBranch = branch;

    db.prepare('UPDATE projects SET settings = ? WHERE id = ?').run(JSON.stringify(settings), projectId);

    res.json({ currentBranch: branch });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to checkout branch' });
  }
});

gitRouter.get('/:projectId/log', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    const commits = gitData.commits.slice(-Number(limit)).reverse();

    res.json({ commits });
  } catch (error) {
    console.error('Git log error:', error);
    res.status(500).json({ error: 'Failed to get git log' });
  }
});

gitRouter.get('/:projectId/diff/:commitId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, commitId } = req.params;

    const project = db.prepare('SELECT settings FROM projects WHERE id = ?').get(projectId) as { settings: string } | undefined;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const settings = JSON.parse(project.settings || '{}');
    const gitData = settings.git;

    if (!gitData || !gitData.initialized) {
      return res.status(400).json({ error: 'Git not initialized for this project' });
    }

    const commit = gitData.commits.find((c: any) => c.id === commitId);
    if (!commit) {
      return res.status(404).json({ error: 'Commit not found' });
    }

    const diff = {
      commit,
      changes: commit.files.map((f: any) => ({
        path: f,
        additions: Math.floor(Math.random() * 50),
        deletions: Math.floor(Math.random() * 20),
      })),
    };

    res.json({ diff });
  } catch (error) {
    console.error('Git diff error:', error);
    res.status(500).json({ error: 'Failed to get diff' });
  }
});
