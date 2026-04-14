const {
  validateOptions,
  isValidProjectName,
  isValidDbType,
  isValidAuthType,
} = require("../../src/cli/validate");

describe("CLI Validation", () => {
  describe("isValidProjectName", () => {
    it("should accept valid project names", () => {
      expect(isValidProjectName("my-project")).toBe(true);
      expect(isValidProjectName("my_project")).toBe(true);
      expect(isValidProjectName("myproject123")).toBe(true);
      expect(isValidProjectName("MyProject")).toBe(true);
    });

    it("should reject invalid project names", () => {
      expect(isValidProjectName("")).toBe(false);
      expect(isValidProjectName(".hidden")).toBe(false);
      expect(isValidProjectName("_leading")).toBe(false);
      expect(isValidProjectName("has space")).toBe(false);
      expect(isValidProjectName("has/slash")).toBe(false);
    });

    it("should reject names that are too long", () => {
      const longName = "a".repeat(215);
      expect(isValidProjectName(longName)).toBe(false);
    });
  });

  describe("isValidDbType", () => {
    it("should accept valid database types", () => {
      expect(isValidDbType("sqlite")).toBe(true);
      expect(isValidDbType("postgres")).toBe(true);
      expect(isValidDbType("mysql")).toBe(true);
      expect(isValidDbType("mongo")).toBe(true);
    });

    it("should reject invalid database types", () => {
      expect(isValidDbType("invalid")).toBe(false);
      expect(isValidDbType("")).toBe(false);
    });
  });

  describe("isValidAuthType", () => {
    it("should accept valid auth types", () => {
      expect(isValidAuthType("jwt")).toBe(true);
      expect(isValidAuthType("oauth")).toBe(true);
      expect(isValidAuthType("none")).toBe(true);
    });

    it("should reject invalid auth types", () => {
      expect(isValidAuthType("invalid")).toBe(false);
    });
  });

  describe("validateOptions", () => {
    it("should return valid for correct options", () => {
      const result = validateOptions({
        db: "postgres",
        auth: "jwt",
        entities: "Post,Comment",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid options", () => {
      const result = validateOptions({
        db: "invalid",
        auth: "invalid",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
