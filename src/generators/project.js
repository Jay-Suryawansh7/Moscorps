const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

const { generateAuth } = require("./auth");
const { generateApi } = require("./api");
const { generateAdmin } = require("./admin");
const { generateStorage } = require("./storage");
const { generateDatabase } = require("./database");
const installer = require("../utils/installer");
const logger = require("../utils/logger");

async function generateProject(projectName, options) {
  const projectDir = path.join(options.output || process.cwd(), projectName);

  // Check if directory already exists
  if (await fs.pathExists(projectDir)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }

  logger.info(`Creating project: ${chalk.cyan(projectName)}`);

  // Create project directory
  await fs.ensureDir(projectDir);

  // Generate base Express app
  await generateBaseApp(projectDir, options);

  // Generate database configuration
  await generateDatabase(projectDir, options);

  // Generate authentication if enabled
  if (options.auth !== "none") {
    await generateAuth(projectDir, options);
  }

  // Generate CRUD API for entities
  if (options.entities) {
    await generateApi(projectDir, options);
  }

  // Generate Admin panel if enabled
  if (options.withAdmin) {
    await generateAdmin(projectDir, options);
  }

  // Generate file storage if enabled
  if (options.withStorage) {
    await generateStorage(projectDir, options);
  }

  // Generate config files
  await generateConfigFiles(projectDir, projectName, options);

  // Install dependencies
  if (!options.silent) {
    const spinner = ora("Installing dependencies...").start();
    await installer.run(projectDir);
    spinner.succeed("Dependencies installed");
  }
}

async function generateBaseApp(projectDir, options) {
  // Create src directory
  await fs.ensureDir(path.join(projectDir, "src"));

  // Generate app.js
  const appTemplate = await fs.readFile(
    path.join(__dirname, "../templates/express/app.ejs"),
    "utf-8",
  );

  await fs.writeFile(path.join(projectDir, "src/app.js"), appTemplate);

  // Generate server.js
  const serverTemplate = await fs.readFile(
    path.join(__dirname, "../templates/express/server.ejs"),
    "utf-8",
  );

  await fs.writeFile(path.join(projectDir, "src/server.js"), serverTemplate);

  // Generate package.json
  await generatePackageJson(projectDir, options);
}

async function generatePackageJson(projectDir, options) {
  const packageJson = {
    name: path.basename(projectDir),
    version: "1.0.0",
    description: "A backend project scaffolded with create-backend",
    main: "src/server.js",
    scripts: {
      start: "node src/server.js",
      dev: "nodemon src/server.js",
      test: "jest",
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^7.0.0",
      morgan: "^1.10.0",
      dotenv: "^16.3.1",
    },
    devDependencies: {
      nodemon: "^3.0.1",
      jest: "^29.7.0",
    },
  };

  // Add database dependencies based on choice
  if (options.db === "postgres") {
    packageJson.dependencies.pg = "^8.11.3";
    packageJson.dependencies.sequelize = "^6.32.1";
  } else if (options.db === "mysql") {
    packageJson.dependencies.mysql2 = "^3.6.0";
    packageJson.dependencies.sequelize = "^6.32.1";
  } else if (options.db === "mongo") {
    packageJson.dependencies.mongoose = "^7.6.0";
  } else {
    packageJson.dependencies.sqlite3 = "^5.1.6";
    packageJson.dependencies.sequelize = "^6.32.1";
  }

  // Add auth dependencies
  if (options.auth === "jwt") {
    packageJson.dependencies.jsonwebtoken = "^9.0.2";
    packageJson.dependencies.bcryptjs = "^2.4.3";
  } else if (options.auth === "oauth") {
    packageJson.dependencies.passport = "^0.6.0";
    packageJson.dependencies["passport-google-oauth20"] = "^2.0.0";
    packageJson.dependencies["passport-github2"] = "^6.0.0";
  }

  // Add admin dependencies
  if (options.withAdmin) {
    packageJson.dependencies.adminjs = "^7.7.0";
    packageJson.dependencies["@adminjs/express"] = "^6.0.0";
    packageJson.dependencies["@adminjs/sequelize"] = "^4.0.0";
  }

  // Add storage dependencies
  if (options.withStorage) {
    packageJson.dependencies.multer = "^1.4.5-lts.1";
    packageJson.dependencies["multer-s3"] = "^3.0.0";
  }

  await fs.writeFile(
    path.join(projectDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

async function generateConfigFiles(projectDir, projectName, options) {
  // .env.example
  const envExample = `# Server
PORT=3000
NODE_ENV=development

# Database
DB_TYPE=${options.db}
${options.db === "postgres" ? "DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=" + projectName + "\nDB_USER=postgres\nDB_PASSWORD=password" : ""}
${options.db === "mongo" ? "MONGODB_URI=mongodb://localhost:27017/" + projectName : ""}

# Auth
${options.auth === "jwt" ? "JWT_SECRET=your-secret-key-change-this\nJWT_EXPIRES_IN=24h" : ""}
${options.auth === "oauth" ? "GOOGLE_CLIENT_ID=your-google-client-id\nGOOGLE_CLIENT_SECRET=your-google-client-secret\nGITHUB_CLIENT_ID=your-github-client-id\nGITHUB_CLIENT_SECRET=your-github-client-secret" : ""}

${options.withStorage ? "# Storage\nSTORAGE_TYPE=local\n# For S3 storage:\n# AWS_ACCESS_KEY_ID=your-access-key\n# AWS_SECRET_ACCESS_KEY=your-secret-key\n# AWS_REGION=us-east-1\n# AWS_BUCKET=your-bucket-name" : ""}
`;

  await fs.writeFile(path.join(projectDir, ".env.example"), envExample);

  // .gitignore
  const gitignore = `node_modules/
.env
*.log
.DS_Store
${options.db === "sqlite" ? "database.sqlite" : ""}
${options.withStorage ? "uploads/" : ""}
`;

  await fs.writeFile(path.join(projectDir, ".gitignore"), gitignore);

  // README.md
  const readme = `# ${projectName}

A backend project scaffolded with \`create-backend\`.

## Quick Start

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
${options.withAdmin ? "│   └── admin/" : ""}
${options.withStorage ? "│   └── uploads/" : ""}
├── .env.example
├── .gitignore
└── package.json
\`\`\`

## API Endpoints

### Auth
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - Login user
- \`POST /api/auth/logout\` - Logout user
- \`POST /api/auth/refresh\` - Refresh token

### Entities
${
  options.entities
    ? options.entities
        .split(",")
        .map(
          (e) =>
            `- \`GET /api/${e.toLowerCase()}s\` - List all ${e.toLowerCase()}s\n- \`GET /api/${e.toLowerCase()}s/:id\` - Get single ${e.toLowerCase()}\n- \`POST /api/${e.toLowerCase()}s\` - Create ${e.toLowerCase()}\n- \`PUT /api/${e.toLowerCase()}s/:id\` - Update ${e.toLowerCase()}\n- \`DELETE /api/${e.toLowerCase()}s/:id\` - Delete ${e.toLowerCase()}`,
        )
        .join("\n")
    : ""
}

${options.withAdmin ? `## Admin Panel\n\nAccess the admin panel at: \`http://localhost:3000/admin\`\n\n` : ""}${options.withStorage ? `## File Storage\n\nUpload files using \`POST /api/upload\` and access them at \`GET /api/files/:filename\`\n\n` : ""}## License

MIT
`;

  await fs.writeFile(path.join(projectDir, "README.md"), readme);
}

module.exports = { generateProject };
