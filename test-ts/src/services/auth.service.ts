import jwt from 'jsonwebtoken';
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
}