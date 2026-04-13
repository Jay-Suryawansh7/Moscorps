const { program } = require("commander");

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
  .action(require("../src/generators/project").generateProject);

// Programmatic API
const { generateProject } = require("../src/generators/project");
const { generateAuth } = require("../src/generators/auth");
const { generateApi } = require("../src/generators/api");
const { generateDatabase } = require("../src/generators/database");
const { generateAdmin } = require("../src/generators/admin");
const { generateStorage } = require("../src/generators/storage");

module.exports = {
  initBackend: async (options) => {
    return generateProject(options.name || "my-backend", options);
  },
  registerEntity: async (name, schema) => {
    // Placeholder for programmatic entity registration
    console.log(`Entity ${name} registered with schema:`, schema);
  },
  enableFeature: async (feature) => {
    // Placeholder for programmatic feature enabling
    console.log(`Feature ${feature} enabled`);
  },
  generateAuth,
  generateApi,
  generateDatabase,
  generateAdmin,
  generateStorage,
};

if (require.main === module) {
  program.parse();
}
