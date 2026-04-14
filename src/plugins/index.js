const fs = require("fs-extra");
const path = require("path");

async function generateAIHooks(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/services"));
  await fs.ensureDir(path.join(projectDir, "src/routes"));

  // AI service TypeScript
  const aiService = `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: messages
  });

  return response.choices[0].message.content || '';
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });

  return response.data[0].embedding;
}`;

  await fs.writeFile(
    path.join(projectDir, "src/services/ai.service.ts"),
    aiService,
  );

  // AI routes TypeScript
  const aiRoutes = `import { Router } from 'express';
import { chat } from '../services/ai.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/chat', authenticate, async (req: AuthRequest, res) => {
  try {
    const { messages } = req.body;
    const response = await chat(messages);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'AI chat failed' });
  }
});

export default router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/ai.routes.ts"),
    aiRoutes,
  );

  // Update package.json
  await updatePackageJson(projectDir, { openai: "^4.20.0" });

  // Update .env.example
  await updateEnvExample(
    projectDir,
    "\n# AI\nOPENAI_API_KEY=your-openai-api-key\n",
  );
}

async function generateRealtime(projectDir, options) {
  // Socket.io setup
  const socketConfig = `import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('chat message', (msg: string) => {
      io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}`;

  await fs.writeFile(
    path.join(projectDir, "src/config/socket.ts"),
    socketConfig,
  );

  await updatePackageJson(projectDir, { "socket.io": "^4.7.2" });
}

async function generateEmail(projectDir, options) {
  const emailService = `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html: body
  });
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  await sendEmail(
    email,
    'Welcome!',
    \`<h1>Welcome \${username}!</h1><p>Thanks for joining us.</p>\`
  );
}`;

  await fs.writeFile(
    path.join(projectDir, "src/services/email.service.ts"),
    emailService,
  );

  await updatePackageJson(projectDir, { nodemailer: "^6.9.7" });
  await updateEnvExample(
    projectDir,
    "\n# Email\nSMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=your-email@gmail.com\nSMTP_PASSWORD=your-app-password\n",
  );
}

async function generateQueue(projectDir, options) {
  const queueService = `import Queue from 'bull';

export const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

emailQueue.process(async (job) => {
  console.log('Processing job:', job.id);
  // Add job processing logic here
  return Promise.resolve();
});

export async function addJob(data: any): Promise<void> {
  await emailQueue.add(data);
}`;

  await fs.writeFile(
    path.join(projectDir, "src/services/queue.service.ts"),
    queueService,
  );

  await updatePackageJson(projectDir, { bull: "^4.12.0" });
  await updateEnvExample(
    projectDir,
    "\n# Queue (Redis)\nREDIS_HOST=localhost\nREDIS_PORT=6379\n",
  );
}

async function updatePackageJson(projectDir, deps) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.dependencies = { ...packageJson.dependencies, ...deps };
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function updateEnvExample(projectDir, content) {
  const envPath = path.join(projectDir, ".env.example");
  const existing = await fs.readFile(envPath, "utf-8");
  await fs.writeFile(envPath, existing + content);
}

module.exports = {
  generateAIHooks,
  generateRealtime,
  generateEmail,
  generateQueue,
};
