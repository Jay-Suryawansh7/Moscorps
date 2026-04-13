# Implementation Plan: `create-backend` CLI Tool

> A one-command npm scaffolding tool that spins up a fully wired backend — JWT auth, CRUD APIs, admin panel, file storage, and configurable databases.

---

## 1. Project Overview

| Attribute        | Detail                                               |
|------------------|------------------------------------------------------|
| Package Name     | `create-backend`                                     |
| Type             | npm CLI + programmatic API                           |
| Target Runtime   | Node.js 18+                                          |
| MVP Timeline     | ~10–12 weeks (solo) / 6–8 weeks (2-person team)     |
| License          | MIT                                                  |

### Core Command

```bash
npx create-backend my-app --db postgres --auth jwt
npx create-backend my-app --db sqlite --auth oauth --with-admin --with-storage
```

---

## 2. Architecture at a Glance

```
create-backend/
├── bin/
│   └── create-backend.js        # CLI entry point
├── src/
│   ├── cli/
│   │   ├── index.js             # Commander/Inquirer setup
│   │   ├── prompts.js           # Interactive prompts fallback
│   │   └── validate.js          # Input validation
│   ├── generators/
│   │   ├── project.js           # Root scaffolder
│   │   ├── auth.js              # JWT / OAuth generator
│   │   ├── api.js               # CRUD route generator
│   │   ├── admin.js             # AdminJS panel generator
│   │   ├── storage.js           # File storage (local/S3)
│   │   └── database.js          # ORM + DB config generator
│   ├── templates/               # EJS/Handlebars template files
│   │   ├── express/
│   │   ├── auth/
│   │   ├── models/
│   │   └── admin/
│   ├── plugins/                 # Optional feature plugins
│   │   ├── chat.js
│   │   ├── ai-hooks.js
│   │   └── realtime.js
│   └── utils/
│       ├── fs.js                # File write helpers
│       ├── installer.js         # npm install runner
│       └── logger.js            # Chalk-based logging
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── README.md
```

---

## 3. Tech Stack Choices

### CLI Layer
| Concern         | Library               | Why                                   |
|-----------------|-----------------------|---------------------------------------|
| Argument parsing | `commander`          | Mature, minimal, widely used          |
| Interactive prompts | `inquirer`        | Fallback when flags are omitted       |
| Terminal output | `koolur` + `ora`       | Colors + spinners for DX              |
| Template engine | `ejs`                 | Simple, zero-learning-curve rendering |

### Generated Project Stack
| Concern         | Library               | Notes                                 |
|-----------------|-----------------------|---------------------------------------|
| HTTP framework  | `express`             | Familiar to most Node devs; Fastify as alt |
| Auth (JWT)      | `jsonwebtoken` + `bcrypt` | Standard combo                    |
| Auth (OAuth)    | `passport` + `passport-google-oauth20` | Extensible       |
| ORM             | `sequelize` (SQL) / `mongoose` (Mongo) | Based on `--db` flag |
| Database        | `pg`, `mysql2`, `sqlite3` | Driver loaded by flag              |
| Admin UI        | `adminjs` + `@adminjs/express` | Auto-generates CRUD panel     |
| File storage    | `multer` + `multer-s3` | Local or S3 depending on config    |
| Validation      | `zod` or `joi`        | Schema validation on routes           |
| Environment     | `dotenv`              | .env file auto-generated              |

---

## 4. Phase-by-Phase Implementation Plan

### Phase 1 — CLI Skeleton (Weeks 1–2)

**Goal:** `npx create-backend my-app` creates a valid Express project.

**Tasks:**
1. Initialize the npm package with `bin` field pointing to `bin/create-backend.js`
2. Set up `commander` for flags: `--db`, `--auth`, `--with-admin`, `--with-storage`, `--with-ai`
3. Add `inquirer` prompts as interactive fallback when flags are missing
4. Create the base Express project template:
   - `src/app.js` — Express setup, middleware (cors, helmet, morgan, express.json)
   - `src/config/index.js` — Reads from `.env`
   - `.env.example`, `.gitignore`, `package.json`, `README.md`
5. Run `npm install` programmatically using `child_process.spawn` with a spinner

**Output:**
```
my-app/
├── src/
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

### Phase 2 — Database & ORM Generation (Weeks 2–3)

**Goal:** `--db sqlite|postgres|mysql|mongo` creates the right config and ORM setup.

**Tasks:**
1. Generate `src/config/database.js` based on chosen DB
2. For SQL (Sequelize): generate `src/models/index.js`, migration folder, `sequelize-cli` config
3. For Mongo (Mongoose): generate `src/models/index.js` with connection logic
4. Generate a sample `User` model automatically (needed for auth in Phase 3)
5. Write a `seed.js` with a default admin user
6. Add DB connection health-check to `app.js` startup

**Key decision:** Abstract DB calls behind a `db` module so routes don't import Sequelize/Mongoose directly — this keeps generated code cleaner.

---

### Phase 3 — Authentication (Weeks 3–4)

**Goal:** `--auth jwt` or `--auth oauth` scaffolds complete auth routes.

**JWT Flow:**
1. `POST /auth/register` → hash password with bcrypt, save User, return JWT
2. `POST /auth/login` → verify password, return signed JWT + refresh token
3. `POST /auth/refresh` → validate refresh token, return new JWT
4. `POST /auth/logout` → blacklist refresh token (stored in DB or Redis)
5. `src/middleware/auth.js` → `verifyToken` middleware exported for route protection

**OAuth Flow:**
1. `GET /auth/google` → redirect to Google
2. `GET /auth/google/callback` → handle callback, upsert user, return JWT
3. Strategy configured from `.env` (CLIENT_ID, CLIENT_SECRET)

**Generated files:**
```
src/
├── routes/auth.routes.js
├── controllers/auth.controller.js
├── middleware/auth.js
└── services/auth.service.js
```

**Security defaults baked in:**
- Passwords hashed with bcrypt (salt rounds = 12)
- JWT secret loaded from `.env` (not hardcoded)
- Refresh tokens stored in DB, not just cookies
- Rate limiting on auth routes via `express-rate-limit`

---

### Phase 4 — CRUD API Generator (Weeks 4–5)

**Goal:** Developers can add entities; generator creates routes/controller/model for each.

**CLI usage:**
```bash
# At scaffold time
npx create-backend my-app --entities "Post,Comment,Product"

# Or post-scaffold via programmatic API
const { registerEntity } = require('./src/api');
registerEntity('Product', {
  name: 'string',
  price: 'number',
  inStock: 'boolean'
});
```

**What gets generated per entity:**
- `src/models/Product.model.js` — Sequelize model or Mongoose schema
- `src/routes/product.routes.js` — GET all, GET by ID, POST, PUT, DELETE
- `src/controllers/product.controller.js` — Logic with try/catch error handling
- Auto-registers route in `src/routes/index.js`
- Full input validation using `zod`

**Standard route shape:**
```
GET    /api/products         → list (with pagination)
GET    /api/products/:id     → single record
POST   /api/products         → create (auth required)
PUT    /api/products/:id     → update (auth required)
DELETE /api/products/:id     → delete (auth required, admin only)
```

---

### Phase 5 — Admin Panel (Weeks 5–6)

**Goal:** `--with-admin` adds a web-based admin UI, accessible at `/admin`.

**Implementation:**
1. Install `adminjs`, `@adminjs/express`, `@adminjs/sequelize` (or mongoose adapter)
2. Auto-discover all generated models and register them with AdminJS
3. Generate `src/admin/index.js` that mounts AdminJS on `/admin`
4. Protect `/admin` behind admin-role check using the generated auth middleware
5. Generate a default admin user in `seed.js` (credentials printed to terminal on first run)

**AdminJS gives for free:**
- CRUD UI for every model
- Relationship navigation
- File upload support (if storage is enabled)
- Customizable dashboard

---

### Phase 6 — File Storage (Weeks 6–7)

**Goal:** `--with-storage` scaffolds file upload routes with local or S3 backing.

**Tasks:**
1. Generate `src/middleware/upload.js` using `multer`
2. If `--storage s3`: configure `multer-s3` with S3 credentials from `.env`
3. If `--storage local`: save to `uploads/` folder, serve via `express.static`
4. Generate `POST /api/upload` and `GET /api/files/:filename` routes
5. Add `File` model to track uploaded files (owner, path, mimetype, size)

---

### Phase 7 — Plugin System (Weeks 7–8)

**Goal:** Allow opt-in features without bloating the base scaffold.

**Plugin flag → what it does:**

| Flag | What's scaffolded |
|------|-------------------|
| `--with-ai` | OpenAI client setup, `/api/ai/chat` route, `.env` entries for API key |
| `--with-realtime` | Socket.io setup in `app.js`, example chat namespace |
| `--with-email` | Nodemailer service, `sendWelcomeEmail` hook in auth controller |
| `--with-queue` | BullMQ setup, example job processor |

Each plugin is a self-contained generator in `src/plugins/` that injects into the project without breaking other generated code.

---

### Phase 8 — Programmatic API (Week 8)

**Goal:** Allow use as a Node module, not just a CLI.

```js
const { initBackend, registerEntity, enableFeature } = require('create-backend');

await initBackend({
  name: 'my-app',
  db: 'postgres',
  auth: 'jwt',
  outputDir: './generated'
});

registerEntity('Invoice', {
  amount: 'number',
  status: 'enum:draft,sent,paid',
  dueDate: 'date'
});

enableFeature('realtime');
```

This makes the tool usable in automated pipelines, CI environments, or as part of other scaffolding tools.

---

### Phase 9 — Testing & Hardening (Weeks 9–10)

**Unit tests** (Jest):
- Each generator function tested in isolation
- Template rendering verified for all flag combinations
- Validation logic for project names, DB choices, etc.

**Integration tests:**
- Spin up a real scaffolded project in a temp directory
- Run `npm install` and `npm start` on the output
- Hit generated endpoints (register, login, CRUD) via supertest

**Security audit checklist:**
- No hardcoded secrets in templates
- `.env` always in `.gitignore`
- Auth middleware applied by default to mutation routes
- SQL injection impossible (ORM parameterized queries)
- Password never returned in API responses

---

### Phase 10 — Documentation & Publishing (Weeks 10–12)

**README sections:**
1. Quick start (30-second demo GIF)
2. All CLI flags documented with examples
3. Generated project structure walkthrough
4. How to add new entities post-scaffold
5. Plugin guide
6. Environment variables reference
7. Deployment guide (Railway, Render, Fly.io)

**npm publishing checklist:**
- Semantic versioning from v0.1.0
- `files` field in package.json (only ship `bin/`, `src/`, `templates/`)
- `engines` field requiring Node 18+
- GitHub Actions CI: lint + test on push, publish on tag

---

## 5. Programmatic API Reference

```js
// Initialize project
initBackend(options: InitOptions): Promise<void>

interface InitOptions {
  name: string;              // Project directory name
  db: 'sqlite' | 'postgres' | 'mysql' | 'mongo';
  auth: 'jwt' | 'oauth' | 'none';
  outputDir?: string;        // Default: process.cwd()
  entities?: string[];       // e.g. ['Post', 'Comment']
  plugins?: PluginName[];
  silent?: boolean;          // Suppress terminal output
}

// Add a new data model to a scaffolded project
registerEntity(name: string, schema: Record<string, FieldType>): void

// Toggle optional features
enableFeature(feature: PluginName): void

type PluginName = 'ai' | 'realtime' | 'email' | 'queue' | 'admin' | 'storage';
type FieldType = 'string' | 'number' | 'boolean' | 'date' | `enum:${string}`;
```

---

## 6. Generated Project Boot Experience

When a developer runs `npx create-backend my-app --db postgres --auth jwt --with-admin`:

```
✔ Created project directory: my-app
✔ Scaffolded Express app with helmet, cors, morgan
✔ Generated JWT auth (register, login, refresh, logout)
✔ Connected Sequelize to PostgreSQL
✔ Generated User model + migrations
✔ Mounted AdminJS at /admin
✔ Seeded default admin: admin@myapp.com / (printed once)
✔ Installed dependencies (42 packages)

✨ Backend ready in 8.3s

Next steps:
  cd my-app
  cp .env.example .env   # add your DB credentials
  npx sequelize db:migrate
  npm run dev

Admin panel:  http://localhost:3000/admin
API docs:     http://localhost:3000/api-docs  (if --with-swagger)
```

---

## 7. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Dependency updates break generated output | High | Pin generated project deps to known-good ranges; integration test on every release |
| Security flaw in generated auth code | Medium | Security review before v1.0; follow OWASP checklist |
| Plugin conflicts (e.g. realtime + queue) | Low | Test all plugin combinations in CI matrix |
| npm name squatting on `create-backend` | Medium | Register name early; have `@yourorg/create-backend` as fallback |
| Template bloat as features grow | Medium | Keep each plugin in isolated generator; use feature flags strictly |

---

## 8. MVP vs Post-MVP Scope

### MVP (v0.1 — first public release)
- [x] CLI with `--db`, `--auth`, `--with-admin`, `--with-storage`
- [x] SQLite + PostgreSQL support
- [x] JWT auth only
- [x] Static entity list at scaffold time
- [x] AdminJS panel
- [x] Local file storage

### v1.0 (post-validation)
- [ ] OAuth support
- [ ] `registerEntity()` programmatic API
- [ ] MySQL + MongoDB support
- [ ] S3 storage plugin
- [ ] `--with-ai` plugin
- [ ] Swagger/OpenAPI docs auto-generated

### v2.0 (if adopted)
- [ ] Web-based project configurator (GUI alternative to CLI)
- [ ] One-click deploy to Railway/Render
- [ ] Plugin marketplace
- [ ] TypeScript output option