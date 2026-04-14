const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

describe("Integration: Project Generation", () => {
  const testDir = path.join(__dirname, "../../test-output");

  beforeAll(async () => {
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it("should generate a basic Express project", async () => {
    const projectName = "test-basic";
    const projectPath = path.join(testDir, projectName);
    const { generateProject } = require("../src/generators/project");

    await generateProject(projectName, {
      db: "sqlite",
      auth: "jwt",
      output: testDir,
      silent: true,
    });

    // Check if key files exist
    expect(await fs.pathExists(path.join(projectPath, "package.json"))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(projectPath, "tsconfig.json"))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(projectPath, "src/app.ts"))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(projectPath, "src/server.ts"))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(projectPath, ".env.example"))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(projectPath, ".gitignore"))).toBe(
      true,
    );
  });

  it("should generate TypeScript files", async () => {
    const projectName = "test-ts";
    const projectPath = path.join(testDir, projectName);
    const { generateProject } = require("../src/generators/project");

    await generateProject(projectName, {
      db: "postgres",
      auth: "jwt",
      output: testDir,
      silent: true,
    });

    // Check TypeScript files exist
    expect(await fs.pathExists(path.join(projectPath, "src/app.ts"))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(projectPath, "src/server.ts"))).toBe(
      true,
    );
    expect(
      await fs.pathExists(path.join(projectPath, "src/config/database.ts")),
    ).toBe(true);
    expect(
      await fs.pathExists(path.join(projectPath, "src/middleware/auth.ts")),
    ).toBe(true);
  });

  it("should include admin panel when withAdmin flag is set", async () => {
    const projectName = "test-admin";
    const projectPath = path.join(testDir, projectName);
    const { generateProject } = require("../src/generators/project");

    await generateProject(projectName, {
      db: "sqlite",
      auth: "jwt",
      withAdmin: true,
      output: testDir,
      silent: true,
    });

    expect(
      await fs.pathExists(path.join(projectPath, "src/admin/index.ts")),
    ).toBe(true);
  });

  it("should include storage when withStorage flag is set", async () => {
    const projectName = "test-storage";
    const projectPath = path.join(testDir, projectName);
    const { generateProject } = require("../src/generators/project");

    await generateProject(projectName, {
      db: "sqlite",
      auth: "jwt",
      withStorage: true,
      output: testDir,
      silent: true,
    });

    expect(
      await fs.pathExists(path.join(projectPath, "src/middleware/upload.ts")),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(projectPath, "src/routes/upload.routes.ts"),
      ),
    ).toBe(true);
  });

  it("should generate entities", async () => {
    const projectName = "test-entities";
    const projectPath = path.join(testDir, projectName);
    const { generateProject } = require("../src/generators/project");

    await generateProject(projectName, {
      db: "sqlite",
      auth: "jwt",
      entities: "Product,Comment",
      output: testDir,
      silent: true,
    });

    // Check entity files
    expect(
      await fs.pathExists(path.join(projectPath, "src/models/Product.ts")),
    ).toBe(true);
    expect(
      await fs.pathExists(path.join(projectPath, "src/models/Comment.ts")),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(projectPath, "src/controllers/product.controller.ts"),
      ),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(projectPath, "src/routes/product.routes.ts"),
      ),
    ).toBe(true);
  });
});
