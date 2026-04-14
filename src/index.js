const { program } = require("commander");
const fs = require("fs-extra");
const path = require("path");

program
  .name("create-backend")
  .description("One-command backend scaffolding tool")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new backend project")
  .argument("[projectName]", "Name of the project")
  .option("--db <type>", "Database type (sqlite|postgres|mysql|mongo)")
  .option("--auth <type>", "Auth type (jwt|oauth|none)")
  .option("--with-admin", "Include AdminJS panel")
  .option("--with-storage", "Include file storage")
  .option("--with-ai", "Include AI hooks")
  .option("--with-realtime", "Include Socket.io realtime")
  .option("--with-email", "Include email service")
  .option("--with-queue", "Include job queue")
  .option("--entities <list>", "Comma-separated entity names")
  .option("--output <dir>", "Output directory", process.cwd())
  .option("--silent", "Suppress terminal output")
  .action(require("./generators/project").generateProject);

// Programmatic API
const { generateProject } = require("./generators/project");
const { generateAuth } = require("./generators/auth");
const { generateApi } = require("./generators/api");
const { generateDatabase } = require("./generators/database");
const { generateAdmin } = require("./generators/admin");
const { generateStorage } = require("./generators/storage");
const {
  generateAIHooks,
  generateRealtime,
  generateEmail,
  generateQueue,
} = require("./plugins/index");

/**
 * Initialize a new backend project programmatically
 * @param {Object} options - Configuration options
 * @param {string} options.name - Project name
 * @param {'sqlite'|'postgres'|'mysql'|'mongo'} options.db - Database type
 * @param {'jwt'|'oauth'|'none'} options.auth - Authentication type
 * @param {string} [options.outputDir] - Output directory
 * @param {string[]} [options.entities] - Entity names to generate
 * @param {boolean} [options.withAdmin] - Include admin panel
 * @param {boolean} [options.withStorage] - Include file storage
 * @param {boolean} [options.silent] - Suppress output
 */
async function initBackend(options) {
  const mergedOptions = {
    output: options.outputDir || process.cwd(),
    entities: options.entities ? options.entities.join(",") : undefined,
    ...options,
  };

  return generateProject(options.name || "my-backend", mergedOptions);
}

/**
 * Register a new entity to an existing project
 * @param {string} projectDir - Path to the project directory
 * @param {string} name - Entity name (e.g., 'Product')
 * @param {Object} schema - Entity schema definition
 * @param {Object<string, 'string'|'number'|'boolean'|'date'|string>} schema.fields - Field definitions
 */
async function registerEntity(projectDir, name, schema) {
  const { generateApi } = require("./generators/api");

  // Convert schema to simple format
  const schemaFields = {};
  Object.entries(schema.fields || schema).forEach(([key, value]) => {
    schemaFields[key] =
      typeof value === "string" ? value : value.type || "string";
  });

  // Generate entity files
  await generateApi(projectDir, {
    entities: name,
    db: "postgres", // default, will be overridden by existing project
  });

  console.log(`✅ Entity "${name}" registered successfully`);
}

/**
 * Enable a feature plugin in an existing project
 * @param {string} projectDir - Path to the project directory
 * @param {'ai'|'realtime'|'email'|'queue'} feature - Feature to enable
 */
async function enableFeature(projectDir, feature) {
  const plugins = {
    ai: generateAIHooks,
    realtime: generateRealtime,
    email: generateEmail,
    queue: generateQueue,
  };

  const generator = plugins[feature];
  if (!generator) {
    throw new Error(
      `Unknown feature: ${feature}. Available: ${Object.keys(plugins).join(", ")}`,
    );
  }

  await generator(projectDir, {});
  console.log(`✅ Feature "${feature}" enabled successfully`);
}

module.exports = {
  initBackend,
  registerEntity,
  enableFeature,
  generateAuth,
  generateApi,
  generateDatabase,
  generateAdmin,
  generateStorage,
  generateAIHooks,
  generateRealtime,
  generateEmail,
  generateQueue,
};

if (require.main === module) {
  program.parse();
}
