const inquirer = require("inquirer");
const chalk = require("chalk");

async function run(projectName, options) {
  console.log(chalk.bold.blue("\n🚀 Create Backend - Interactive Setup\n"));

  const questions = [];

  // Project name
  if (!projectName) {
    questions.push({
      type: "input",
      name: "projectName",
      message: "What is your project name?",
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Project name is required";
        }
        if (!/^[a-z0-9-_]+$/i.test(input)) {
          return "Project name can only contain letters, numbers, hyphens, and underscores";
        }
        return true;
      },
    });
  }

  // Database choice
  if (!options.db) {
    questions.push({
      type: "list",
      name: "db",
      message: "Which database do you want to use?",
      choices: [
        { name: "SQLite (Recommended for development)", value: "sqlite" },
        { name: "PostgreSQL", value: "postgres" },
        { name: "MySQL", value: "mysql" },
        { name: "MongoDB", value: "mongo" },
      ],
      default: "sqlite",
    });
  }

  // Auth choice
  if (!options.auth) {
    questions.push({
      type: "list",
      name: "auth",
      message: "Which authentication method do you want?",
      choices: [
        { name: "JWT (Recommended)", value: "jwt" },
        { name: "OAuth (Google, GitHub, etc.)", value: "oauth" },
        { name: "None", value: "none" },
      ],
      default: "jwt",
    });
  }

  // Admin panel
  if (options.withAdmin === undefined) {
    questions.push({
      type: "confirm",
      name: "withAdmin",
      message: "Include AdminJS panel?",
      default: true,
    });
  }

  // File storage
  if (options.withStorage === undefined) {
    questions.push({
      type: "confirm",
      name: "withStorage",
      message: "Include file storage?",
      default: false,
    });
  }

  // Entities
  if (!options.entities) {
    questions.push({
      type: "input",
      name: "entities",
      message: "Entity names (comma-separated, e.g., Post,Comment):",
      default: "Post",
    });
  }

  const answers = await inquirer.prompt(questions);

  // Set defaults
  if (!projectName && !answers.projectName) {
    answers.projectName = "my-backend";
  }
  if (!answers.db) answers.db = options.db || "sqlite";
  if (!answers.auth) answers.auth = options.auth || "jwt";
  if (!answers.withAdmin) answers.withAdmin = options.withAdmin || false;
  if (!answers.withStorage) answers.withStorage = options.withStorage || false;
  if (!answers.entities) answers.entities = options.entities || "Post";

  return answers;
}

module.exports = { run };
