const VALID_DB_TYPES = ["sqlite", "postgres", "mysql", "mongo"];
const VALID_AUTH_TYPES = ["jwt", "oauth", "none"];

function isValidProjectName(name) {
  if (!name || typeof name !== "string") return false;
  if (name.length === 0 || name.length > 214) return false;
  if (name.startsWith(".") || name.startsWith("_")) return false;
  if (!/^[a-z0-9-_]+$/i.test(name)) return false;
  return true;
}

function isValidDbType(db) {
  return VALID_DB_TYPES.includes(db);
}

function isValidAuthType(auth) {
  return VALID_AUTH_TYPES.includes(auth);
}

function validateOptions(options) {
  const errors = [];

  if (options.db && !isValidDbType(options.db)) {
    errors.push(
      `Invalid database type: ${options.db}. Valid options: ${VALID_DB_TYPES.join(", ")}`,
    );
  }

  if (options.auth && !isValidAuthType(options.auth)) {
    errors.push(
      `Invalid auth type: ${options.auth}. Valid options: ${VALID_AUTH_TYPES.join(", ")}`,
    );
  }

  if (options.entities) {
    const entities = options.entities
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e);
    entities.forEach((entity) => {
      if (!isValidProjectName(entity)) {
        errors.push(`Invalid entity name: ${entity}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  isValidProjectName,
  isValidDbType,
  isValidAuthType,
  validateOptions,
};
