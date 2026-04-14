const fs = require("fs-extra");
const path = require("path");

async function generateAuth(projectDir, options) {
  await fs.ensureDir(path.join(projectDir, "src/routes"));
  await fs.ensureDir(path.join(projectDir, "src/controllers"));
  await fs.ensureDir(path.join(projectDir, "src/middleware"));
  await fs.ensureDir(path.join(projectDir, "src/services"));

  if (options.auth === "jwt") {
    await generateJwtAuth(projectDir, options);
  } else if (options.auth === "oauth") {
    await generateOAuth(projectDir, options);
  }
}

async function generateJwtAuth(projectDir, options) {
  // Auth routes TypeScript
  const authRoutes = `import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

export default router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/auth.routes.ts"),
    authRoutes,
  );

  // Auth controller TypeScript
  const authController = `import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    const result = await authService.refresh(token);
    res.json({
      message: 'Token refreshed',
      token: result.token
    });
  } catch (error) {
    next(error);
  }
}`;

  await fs.writeFile(
    path.join(projectDir, "src/controllers/auth.controller.ts"),
    authController,
  );

  // Auth service TypeScript
  const authService = `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

interface UserResult {
  id: number;
  username: string;
  email: string;
}

interface AuthResult {
  user: UserResult;
  token: string;
}

export async function register(username: string, email: string, password: string): Promise<AuthResult> {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const hashedPassword: string = await bcrypt.hash(password, 12);
  
  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });
  
  const token: string = generateToken(user.id);
  
  return {
    user: { id: user.id, username: user.username, email: user.email },
    token
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isMatch: boolean = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  const token: string = generateToken(user.id);
  
  return {
    user: { id: user.id, username: user.username, email: user.email },
    token
  };
}

export async function refresh(oldToken: string): Promise<{ token: string }> {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET) as { userId: number };
    const token = generateToken(decoded.userId);
    return { token };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}`;

  await fs.writeFile(
    path.join(projectDir, "src/services/auth.service.ts"),
    authService,
  );

  // Auth middleware TypeScript
  const authMiddleware = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: { userId: number; role?: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user as { userId: number; role?: string };
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}`;

  await fs.writeFile(
    path.join(projectDir, "src/middleware/auth.ts"),
    authMiddleware,
  );
}

async function generateOAuth(projectDir, options) {
  // OAuth routes TypeScript
  const authRoutes = `import { Router } from 'express';
import passport from '../config/passport';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  res.json({ user: req.user.user, token: req.user.token });
});

router.get('/github', passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  res.json({ user: req.user.user, token: req.user.token });
});

export default router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/auth.routes.ts"),
    authRoutes,
  );

  // Passport config TypeScript
  const passportConfig = `import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails?.[0]?.value } });
    
    if (!user) {
      user = await User.create({
        username: profile.displayName,
        email: profile.emails?.[0]?.value || '',
        password: '',
        role: 'user'
      });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    done(null, { user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (error) {
    done(error);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackURL: '/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails?.[0]?.value } });
    
    if (!user) {
      user = await User.create({
        username: profile.username || '',
        email: profile.emails?.[0]?.value || '',
        password: '',
        role: 'user'
      });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    done(null, { user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (error) {
    done(error);
  }
}));

export default passport;`;

  await fs.writeFile(
    path.join(projectDir, "src/config/passport.ts"),
    passportConfig,
  );

  // Auth middleware (same as JWT)
  const authMiddleware = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: { userId: number; role?: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user as { userId: number; role?: string };
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}`;

  await fs.writeFile(
    path.join(projectDir, "src/middleware/auth.ts"),
    authMiddleware,
  );
}

module.exports = { generateAuth };
