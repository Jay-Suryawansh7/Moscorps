const { generateSaasTemplate } = require("./saas");
const { generateEcommerceTemplate } = require("./ecommerce");
const { generateAgencyTemplate } = require("./agency");
const { generateLandingTemplate } = require("./landing");
const { generateMarketplaceTemplate } = require("./marketplace");
const { generateLMSTemplate } = require("./lms");

async function generateTemplate(projectDir, template, options) {
  switch (template) {
    case "saas":
      await generateSaasTemplate(projectDir, options);
      break;
    case "ecommerce":
      await generateEcommerceTemplate(projectDir, options);
      break;
    case "agency":
      await generateAgencyTemplate(projectDir, options);
      break;
    case "landing":
      await generateLandingTemplate(projectDir, options);
      break;
    case "marketplace":
      await generateMarketplaceTemplate(projectDir, options);
      break;
    case "lms":
      await generateLMSTemplate(projectDir, options);
      break;
    default:
      console.log(`⚠️  Unknown template: ${template}`);
  }
}

module.exports = { generateTemplate };
