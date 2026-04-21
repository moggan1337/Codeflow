import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password, displayName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, username, passwordHash, displayName || username, now, now);

    const token = jwt.sign(
      { id, email, username },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      user: { id, email, username, displayName: displayName || username },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, email, username, display_name, avatar_url, created_at FROM users WHERE id = ?').get(req.user!.id) as Omit<User, 'password_hash'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

authRouter.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const now = new Date().toISOString();

    if (displayName !== undefined || avatarUrl !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];

      if (displayName !== undefined) {
        updates.push('display_name = ?');
        values.push(displayName);
      }

      if (avatarUrl !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatarUrl);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(req.user!.id);

      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const user = db.prepare('SELECT id, email, username, display_name, avatar_url FROM users WHERE id = ?').get(req.user!.id);

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

authRouter.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as Pick<User, 'password_hash'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newPasswordHash, new Date().toISOString(), req.user!.id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});
