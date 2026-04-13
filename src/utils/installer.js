const { spawn } = require("child_process");
const path = require("path");

function run(projectDir) {
  return new Promise((resolve, reject) => {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";

    const install = spawn(npm, ["install"], {
      cwd: projectDir,
      stdio: "pipe",
    });

    install.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });

    install.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = { run };
