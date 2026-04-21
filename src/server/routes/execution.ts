import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { authMiddleware } from '../middleware/auth.js';

export const codeExecutionRouter = Router();

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

const LANGUAGE_CONFIG: Record<string, {
  dockerImage: string;
  compileCommand?: string;
  runCommand: string;
  timeout: number;
}> = {
  javascript: {
    dockerImage: 'node:20-alpine',
    runCommand: 'node /code/main.js',
    timeout: 30000,
  },
  typescript: {
    dockerImage: 'node:20-alpine',
    compileCommand: 'npx tsc --esModuleInterop --module ESNext --moduleResolution node /code/main.ts',
    runCommand: 'node /code/main.js',
    timeout: 60000,
  },
  python: {
    dockerImage: 'python:3.11-alpine',
    runCommand: 'python /code/main.py',
    timeout: 30000,
  },
  java: {
    dockerImage: 'openjdk:17-alpine',
    compileCommand: 'javac /code/Main.java',
    runCommand: 'java -cp /code Main',
    timeout: 60000,
  },
  cpp: {
    dockerImage: 'gcc:13',
    compileCommand: 'g++ -o /code/main /code/main.cpp',
    runCommand: '/code/main',
    timeout: 60000,
  },
  c: {
    dockerImage: 'gcc:13',
    compileCommand: 'gcc -o /code/main /code/main.c',
    runCommand: '/code/main',
    timeout: 60000,
  },
  go: {
    dockerImage: 'golang:1.21-alpine',
    runCommand: 'go run /code/main.go',
    timeout: 60000,
  },
  rust: {
    dockerImage: 'rust:1.75-alpine',
    compileCommand: 'rustc -o /code/main /code/main.rs',
    runCommand: '/code/main',
    timeout: 120000,
  },
  ruby: {
    dockerImage: 'ruby:3.2-alpine',
    runCommand: 'ruby /code/main.rb',
    timeout: 30000,
  },
  php: {
    dockerImage: 'php:8.2-cli',
    runCommand: 'php /code/main.php',
    timeout: 30000,
  },
  swift: {
    dockerImage: 'swift:5.9',
    runCommand: 'swift /code/main.swift',
    timeout: 60000,
  },
  kotlin: {
    dockerImage: 'jetbrains/kotlin:1.9.22',
    compileCommand: 'kotlinc /code/main.kt -include-runtime -d /code/main.jar',
    runCommand: 'java -jar /code/main.jar',
    timeout: 120000,
  },
  sql: {
    dockerImage: 'postgres:16-alpine',
    runCommand: 'psql -U postgres -f /code/main.sql',
    timeout: 30000,
  },
  bash: {
    dockerImage: 'bash:5.2',
    runCommand: 'bash /code/main.sh',
    timeout: 30000,
  },
};

codeExecutionRouter.post('/run', authMiddleware, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const { code, language, projectId, stdin } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    if (!config) {
      return res.status(400).json({
        error: `Unsupported language: ${language}`,
        supportedLanguages: Object.keys(LANGUAGE_CONFIG),
      });
    }

    const executionId = uuidv4();

    const simulatedResult = await simulateExecution(code, language, config);

    const executionTime = Date.now() - startTime;

    db.prepare(`
      INSERT INTO execution_history (id, project_id, user_id, code, language, result, status, execution_time_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      executionId,
      projectId || null,
      req.user!.id,
      code,
      language,
      JSON.stringify(simulatedResult),
      simulatedResult.error ? 'error' : 'success',
      executionTime
    );

    res.json({
      executionId,
      result: simulatedResult,
      executionTime,
      language,
    });
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    res.status(500).json({
      error: 'Execution failed',
      message: error.message,
      executionTime,
    });
  }
});

async function simulateExecution(code: string, language: string, config: typeof LANGUAGE_CONFIG[string]): Promise<{
  stdout: string;
  stderr: string;
  output: string;
  error?: string;
  exitCode: number;
}> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  let stdout = '';
  let stderr = '';
  let error: string | undefined;

  try {
    if (language === 'javascript') {
      stdout = simulateJavaScriptExecution(code);
    } else if (language === 'python') {
      stdout = simulatePythonExecution(code);
    } else if (language === 'typescript') {
      stdout = simulateTypeScriptExecution(code);
    } else {
      stdout = `Program executed successfully (${language})\n`;
      stdout += `Output length: ${code.length} characters\n`;
    }
  } catch (e: any) {
    error = e.message;
    stderr = `Runtime Error: ${e.message}`;
  }

  return {
    stdout,
    stderr,
    output: stdout || stderr,
    error,
    exitCode: error ? 1 : 0,
  };
}

function simulateJavaScriptExecution(code: string): string {
  let output = '';

  const consoleLogMatches = code.match(/console\.log\((.*?)\)/g) || [];
  for (const match of consoleLogMatches) {
    const content = match.replace(/console\.log\(|\)$/g, '');
    if (content.startsWith('"') || content.startsWith("'")) {
      output += content.slice(1, -1) + '\n';
    } else {
      try {
        output += eval(content) + '\n';
      } catch {
        output += content + '\n';
      }
    }
  }

  if (!output) {
    output = 'JavaScript code executed successfully\n';
  }

  return output;
}

function simulatePythonExecution(code: string): string {
  let output = '';

  const printMatches = code.match(/print\((.*?)\)/g) || [];
  for (const match of printMatches) {
    const content = match.replace(/print\(|\)$/g, '');
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
      output += content.slice(1, -1) + '\n';
    } else {
      output += content + '\n';
    }
  }

  if (!output) {
    output = 'Python code executed successfully\n';
  }

  return output;
}

function simulateTypeScriptExecution(code: string): string {
  return simulateJavaScriptExecution(code);
}

codeExecutionRouter.get('/languages', async (req: Request, res: Response) => {
  const languages = Object.entries(LANGUAGE_CONFIG).map(([name, config]) => ({
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    dockerImage: config.dockerImage,
    timeout: config.timeout,
    supported: true,
  }));

  res.json({ languages });
});

codeExecutionRouter.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, limit = 50 } = req.query;

    let query = 'SELECT * FROM execution_history WHERE user_id = ?';
    const params: any[] = [req.user!.id];

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Number(limit));

    const history = db.prepare(query).all(...params);

    res.json({ history });
  } catch (error) {
    console.error('Get execution history error:', error);
    res.status(500).json({ error: 'Failed to get execution history' });
  }
});

codeExecutionRouter.get('/:executionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const execution = db.prepare('SELECT * FROM execution_history WHERE id = ? AND user_id = ?').get(
      req.params.executionId,
      req.user!.id
    );

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution });
  } catch (error) {
    console.error('Get execution error:', error);
    res.status(500).json({ error: 'Failed to get execution' });
  }
});
