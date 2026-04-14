#!/usr/bin/env node

const path = require("path");
const { program } = require("commander");
const chalk = require("chalk");
const ora = require("ora");

// Import modules
const prompts = require(path.join(__dirname, "../src/cli/prompts"));
const validate = require(path.join(__dirname, "../src/cli/validate"));
const { generateProject } = require(
  path.join(__dirname, "../src/generators/project"),
);

program
  .name("create-backend")
  .description("One-command backend scaffolding tool")
  .version("0.1.0");

program
  .argument("[projectName]", "Name of the project")
  .option("--db <type>", "Database type (sqlite|postgres|mysql|mongo)")
  .option("--auth <type>", "Auth type (jwt|oauth|none)")
  .option(
    "--template <name>",
    "App template (saas|ecommerce|agency|landing|marketplace|lms)",
  )
  .option("--with-admin", "Include AdminJS panel")
  .option("--with-storage", "Include file storage")
  .option("--with-ai", "Include AI hooks")
  .option("--with-realtime", "Include Socket.io realtime")
  .option("--with-email", "Include email service")
  .option("--with-queue", "Include job queue")
  .option("--entities <list>", "Comma-separated entity names")
  .option("--output <dir>", "Output directory", process.cwd())
  .option("--silent", "Suppress terminal output")
  .action(async (projectName, options) => {
    try {
      // Validate project name if provided
      if (projectName && !validate.isValidProjectName(projectName)) {
        console.error(
          chalk.red(`Error: Invalid project name "${projectName}"`),
        );
        process.exit(1);
      }

      // If any required flags are missing, run interactive prompts
      if (!projectName || !options.db || !options.auth) {
        const answers = await prompts.run(projectName, options);
        projectName = answers.projectName;
        options = { ...options, ...answers };
      }

      // Start generation
      const spinner = ora("Creating backend project...").start();

      await generateProject(projectName, options);

      spinner.succeed(chalk.green("Backend project created successfully!"));

      // Generate template if specified
      if (options.template) {
        const { generateTemplate } = require("../src/templates");
        const templateSpinner = ora(
          `Generating ${options.template} template...`,
        ).start();
        await generateTemplate(
          path.join(options.output || process.cwd(), projectName),
          options.template,
          options,
        );
        templateSpinner.succeed(
          chalk.green(`${options.template} template generated!`),
        );
      }

      // Print next steps
      console.log("\n" + chalk.bold("Next steps:"));
      console.log(chalk.cyan(`  cd ${projectName}`));
      console.log(chalk.cyan("  cp .env.example .env"));
      console.log(chalk.cyan("  npm install"));
      console.log(chalk.cyan("  npm run dev"));

      if (options.withAdmin) {
        console.log("\n" + chalk.bold("Admin panel:"));
        console.log(chalk.cyan("  http://localhost:3000/admin"));
      }

      console.log(chalk.bold("\nAPI endpoints:"));
      console.log(chalk.cyan("  POST /api/auth/register"));
      console.log(chalk.cyan("  POST /api/auth/login"));
      console.log(chalk.cyan("  GET  /api/posts"));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
