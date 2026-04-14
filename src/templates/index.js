const { generateSaasTemplate } = require("./saas");
const { generateEcommerceTemplate } = require("./ecommerce");

/**
 * Generate template-specific code
 */
async function generateTemplate(projectDir, template, options) {
  switch (template) {
    case "saas":
      await generateSaasTemplate(projectDir, options);
      break;
    case "ecommerce":
      await generateEcommerceTemplate(projectDir, options);
      break;
    case "agency":
      // TODO: Implement agency template
      console.log("⚠️  Agency template not yet implemented");
      break;
    case "landing":
      // TODO: Implement landing template
      console.log("⚠️  Landing template not yet implemented");
      break;
    case "marketplace":
      // TODO: Implement marketplace template
      console.log("⚠️  Marketplace template not yet implemented");
      break;
    case "lms":
      // TODO: Implement LMS template
      console.log("⚠️  LMS template not yet implemented");
      break;
    default:
      console.log(`⚠️  Unknown template: ${template}`);
  }
}

module.exports = { generateTemplate };
