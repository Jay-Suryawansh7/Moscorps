# create-backend

A one-command npm scaffolding tool that spins up a fully wired TypeScript backend — JWT auth, CRUD APIs, admin panel, file storage, and configurable databases.

[![npm version](https://badge.fury.io/js/create-backend.svg)](https://badge.fury.io/js/create-backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Using npx (recommended)
npx create-backend my-app --db postgres --auth jwt

# Or install globally
npm install -g create-backend
create-backend my-app --db postgres --auth jwt
```

### Interactive Mode

If you don't specify flags, you'll be prompted interactively:

```bash
npx create-backend
```

## 📋 Features

- **TypeScript by default** - Full type safety out of the box
- **Multiple databases** - PostgreSQL, MySQL, SQLite, MongoDB
- **Authentication** - JWT or OAuth (Google, GitHub)
- **Admin Panel** - Auto-generated AdminJS interface
- **File Storage** - Local or S3-compatible storage
- **Plugin System** - AI hooks, realtime, email, job queues
- **Production Ready** - Security middleware, error handling, validation

## 🎯 CLI Flags

### Required

- `[projectName]` - Name of your project

### Options

| Flag              | Description                  | Choices                                | Default  |
| ----------------- | ---------------------------- | -------------------------------------- | -------- |
| `--db`            | Database type                | `sqlite`, `postgres`, `mysql`, `mongo` | `sqlite` |
| `--auth`          | Authentication method        | `jwt`, `oauth`, `none`                 | `jwt`    |
| `--with-admin`    | Include AdminJS panel        | -                                      | -        |
| `--with-storage`  | Include file upload          | -                                      | -        |
| `--with-ai`       | Include AI/OpenAI hooks      | -                                      | -        |
| `--with-realtime` | Include Socket.io            | -                                      | -        |
| `--with-email`    | Include email service        | -                                      | -        |
| `--with-queue`    | Include job queue (Redis)    | -                                      | -        |
| `--entities`      | Comma-separated entity names | -                                      | `Post`   |
| `--output`        | Output directory             | Path                                   | `./`     |
| `--silent`        | Suppress output              | -                                      | -        |

## 📚 Usage Examples

### Basic Setup

```bash
# SQLite + JWT auth (default)
npx create-backend my-app

# PostgreSQL with admin panel
npx create-backend my-app --db postgres --with-admin

# Full stack with all features
npx create-backend my-app \
  --db postgres \
  --auth jwt \
  --with-admin \
  --with-storage \
  --with-ai \
  --with-realtime \
  --entities Post,Comment,User
```

### Generated Project Structure

```
my-app/
├── src/
│   ├── admin/           # AdminJS configuration
│   ├── config/          # Database, passport config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, upload middleware
│   ├── models/          # Sequelize/Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/               # Test files
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json        # TypeScript config
└── README.md
```

## 🔧 Programmatic API

Use `create-backend` as a Node.js module:

```javascript
const {
  initBackend,
  registerEntity,
  enableFeature,
} = require("create-backend");

// Initialize a new project
await initBackend({
  name: "my-app",
  db: "postgres",
  auth: "jwt",
  outputDir: "./generated",
  entities: ["Post", "Comment"],
  withAdmin: true,
  withStorage: true,
});

// Add a new entity to existing project
await registerEntity("./my-app", "Product", {
  fields: {
    name: "string",
    price: "number",
    inStock: "boolean",
  },
});

// Enable additional features
await enableFeature("./my-app", "ai");
await enableFeature("./my-app", "realtime");
```

## 🎨 Generated Code Examples

### TypeScript Express App

```typescript
// src/app.ts
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

export default app;
```

### Database Config (PostgreSQL)

```typescript
// src/config/database.ts
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "mydb",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "password",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
  },
);

export default sequelize;
```

### Auth Middleware

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid token" });
      return;
    }
    req.user = user;
    next();
  });
}
```

## 🚦 Development Workflow

### 1. Generate Project

```bash
npx create-backend my-app --db postgres --with-admin
```

### 2. Setup Database

```bash
cd my-app
cp .env.example .env
# Edit .env with your database credentials
npm install
```

### 3. Run Migrations

```bash
# For SQL databases
npx sequelize-cli db:migrate
```

### 4. Start Development

```bash
npm run dev
```

### 5. Access Admin Panel

``
http://localhost:3000/admin
Default credentials are printed on first run

````

## 🔌 Plugin System

### Available Plugins

| Plugin | Description | Flag |
|--------|-------------|------|
| AI Hooks | OpenAI integration | `--with-ai` |
| Realtime | Socket.io WebSocket | `--with-realtime` |
| Email | Nodemailer service | `--with-email` |
| Queue | Bull job queue | `--with-queue` |

### Adding Plugins After Generation

```javascript
const { enableFeature } = require('create-backend');

await enableFeature('./my-app', 'ai');
await enableFeature('./my-app', 'realtime');
````

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🛡️ Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- JWT secrets from environment variables
- Helmet.js security headers
- CORS configuration
- SQL injection prevention (parameterized queries)
- Rate limiting ready
- Input validation with Zod/Joi

## 📦 Deployment

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=your-password

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Optional: S3 Storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_BUCKET=your-bucket
```

### Deploy to Railway/Render

1. Push to Git
2. Connect repository to Railway/Render
3. Add environment variables
4. Deploy!

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🙏 Acknowledgments

- Express.js team
- Sequelize/Mongoose teams
- AdminJS team
- All contributors

---

**Built with ❤️ using create-backend**
