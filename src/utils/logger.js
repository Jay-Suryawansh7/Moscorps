const chalk = require("chalk");

function info(message) {
  console.log(chalk.blue("ℹ"), message);
}

function success(message) {
  console.log(chalk.green("✔"), message);
}

function error(message) {
  console.log(chalk.red("✖"), message);
}

function warning(message) {
  console.log(chalk.yellow("⚠"), message);
}

function debug(message) {
  if (process.env.DEBUG) {
    console.log(chalk.gray("🔍"), message);
  }
}

module.exports = {
  info,
  success,
  error,
  warning,
  debug,
};
