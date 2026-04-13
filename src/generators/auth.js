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
  // Auth routes
  const authRoutes = `const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/auth.routes.js"),
    authRoutes,
  );

  // Auth controller
  const authController = `const authService = require('../services/auth.service');
const { User } = require('../models');

async function register(req, res, next) {
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

async function login(req, res, next) {
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

async function logout(req, res, next) {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
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
}

module.exports = { register, login, logout, refresh };`;

  await fs.writeFile(
    path.join(projectDir, "src/controllers/auth.controller.js"),
    authController,
  );

  // Auth service
  const authService = `const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function register(username, email, password) {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });
  
  const token = generateToken(user.id);
  
  return {
    user: { id: user.id, username: user.username, email: user.email },
    token
  };
}

async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken(user.id);
  
  return {
    user: { id: user.id, username: user.username, email: user.email },
    token
  };
}

async function refresh(oldToken) {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET);
    const token = generateToken(decoded.userId);
    return { token };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = { register, login, refresh, generateToken };`;

  await fs.writeFile(
    path.join(projectDir, "src/services/auth.service.js"),
    authService,
  );

  // Auth middleware
  const authMiddleware = `const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };`;

  await fs.writeFile(
    path.join(projectDir, "src/middleware/auth.js"),
    authMiddleware,
  );
}

async function generateOAuth(projectDir, options) {
  // OAuth routes
  const authRoutes = `const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  res.json({ user: req.user.user, token: req.user.token });
});

router.get('/github', passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  res.json({ user: req.user.user, token: req.user.token });
});

module.exports = router;`;

  await fs.writeFile(
    path.join(projectDir, "src/routes/auth.routes.js"),
    authRoutes,
  );

  // Passport config
  const passportConfig = `const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails[0].value } });
    
    if (!user) {
      user = await User.create({
        username: profile.displayName,
        email: profile.emails[0].value,
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
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ where: { email: profile.emails[0].value } });
    
    if (!user) {
      user = await User.create({
        username: profile.username,
        email: profile.emails[0].value,
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

module.exports = passport;`;

  await fs.writeFile(
    path.join(projectDir, "src/config/passport.js"),
    passportConfig,
  );

  // Auth middleware (same as JWT)
  const authMiddleware = `const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };`;

  await fs.writeFile(
    path.join(projectDir, "src/middleware/auth.js"),
    authMiddleware,
  );
}

module.exports = { generateAuth };
