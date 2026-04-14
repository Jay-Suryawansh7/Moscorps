const fs = require("fs-extra");
const path = require("path");

/**
 * Generate SaaS template with multi-tenancy, subscriptions, and team management
 */
async function generateSaasTemplate(projectDir, options) {
  console.log("📦 Generating SaaS template...");

  // Generate SaaS-specific models
  await generateSaaSSchemas(projectDir, options);

  // Generate SaaS-specific routes
  await generateSaaSRoutes(projectDir, options);

  // Generate SaaS-specific controllers
  await generateSaaSControllers(projectDir, options);

  // Generate SaaS-specific services
  await generateSaaSServices(projectDir, options);

  // Update package.json with additional dependencies
  await updateSaaSDependencies(projectDir);

  console.log("✅ SaaS template generated successfully!");
  console.log("   Added: Organizations, Subscriptions, Invites, Team Members");
}

async function generateSaaSSchemas(projectDir, options) {
  const modelsDir = path.join(projectDir, "src/models");

  // Organization model
  const organizationModel = `import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database';

interface OrganizationAttributes {
  id: number;
  name: string;
  slug: string;
  ownerId: number;
  plan: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
}

interface OrganizationCreationAttributes {
  name: string;
  slug: string;
  ownerId: number;
  plan?: 'free' | 'pro' | 'enterprise';
  isActive?: boolean;
}

class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> {
  public id!: number;
  public name!: string;
  public slug!: string;
  public ownerId!: number;
  public plan!: 'free' | 'pro' | 'enterprise';
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Organization.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      }
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    plan: {
      type: DataTypes.ENUM('free', 'pro', 'enterprise'),
      defaultValue: 'free'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'organizations',
    timestamps: true
  }
);

export default Organization;
`;

  // Subscription model
  const subscriptionModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface SubscriptionAttributes {
  id: number;
  organizationId: number;
  stripeSubscriptionId?: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodEnd: Date;
}

interface SubscriptionCreationAttributes {
  organizationId: number;
  stripeSubscriptionId?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  status?: 'active' | 'cancelled' | 'past_due';
}

class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> {
  public id!: number;
  public organizationId!: number;
  public stripeSubscriptionId?: string;
  public plan!: 'free' | 'pro' | 'enterprise';
  public status!: 'active' | 'cancelled' | 'past_due';
  public currentPeriodEnd!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    plan: {
      type: DataTypes.ENUM('free', 'pro', 'enterprise'),
      defaultValue: 'free'
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'past_due'),
      defaultValue: 'active'
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      defaultValue: () => new Date()
    }
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true
  }
);

export default Subscription;
`;

  // TeamMember model
  const teamMemberModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface TeamMemberAttributes {
  id: number;
  organizationId: number;
  userId: number;
  role: 'owner' | 'admin' | 'member';
  isActive: boolean;
}

interface TeamMemberCreationAttributes {
  organizationId: number;
  userId: number;
  role?: 'owner' | 'admin' | 'member';
  isActive?: boolean;
}

class TeamMember extends Model<TeamMemberAttributes, TeamMemberCreationAttributes> {
  public id!: number;
  public organizationId!: number;
  public userId!: number;
  public role!: 'owner' | 'admin' | 'member';
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member'),
      defaultValue: 'member'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'team_members',
    timestamps: true
  }
);

export default TeamMember;
`;

  // Invite model
  const inviteModel = `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface InviteAttributes {
  id: number;
  organizationId: number;
  email: string;
  role: 'admin' | 'member';
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
}

interface InviteCreationAttributes {
  organizationId: number;
  email: string;
  role?: 'admin' | 'member';
  token: string;
  status?: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
}

class Invite extends Model<InviteAttributes, InviteCreationAttributes> {
  public id!: number;
  public organizationId!: number;
  public email!: string;
  public role!: 'admin' | 'member';
  public token!: string;
  public status!: 'pending' | 'accepted' | 'expired';
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invite.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member'
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired'),
      defaultValue: 'pending'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'invites',
    timestamps: true
  }
);

export default Invite;
`;

  await fs.writeFile(
    path.join(modelsDir, "Organization.ts"),
    organizationModel,
  );
  await fs.writeFile(
    path.join(modelsDir, "Subscription.ts"),
    subscriptionModel,
  );
  await fs.writeFile(path.join(modelsDir, "TeamMember.ts"), teamMemberModel);
  await fs.writeFile(path.join(modelsDir, "Invite.ts"), inviteModel);
}

async function generateSaaSRoutes(projectDir, options) {
  const routesDir = path.join(projectDir, "src/routes");

  // Organizations routes
  const orgRoutes = `import { Router } from 'express';
import * as orgController from '../controllers/organization.controller';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All org routes require authentication
router.use(authenticate);

router.get('/', orgController.list);
router.get('/:id', orgController.getOne);
router.post('/', orgController.create);
router.put('/:id', orgController.update);
router.delete('/:id', orgController.deleteOne);

// Team management
router.get('/:id/team', orgController.getTeam);
router.post('/:id/team', orgController.addTeamMember);
router.delete('/:id/team/:userId', orgController.removeTeamMember);

// Invites
router.get('/:id/invites', orgController.listInvites);
router.post('/:id/invites', orgController.createInvite);
router.delete('/:id/invites/:inviteId', orgController.cancelInvite);

export default router;
`;

  // Subscriptions routes
  const subscriptionRoutes = `import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/organization/:orgId', subscriptionController.getByOrg);
router.post('/checkout', subscriptionController.createCheckout);
router.post('/webhook', subscriptionController.handleWebhook);

export default router;
`;

  // Invites routes (public for accepting invites)
  const inviteRoutes = `import { Router } from 'express';
import * as inviteController from '../controllers/invite.controller';

const router = Router();

router.get('/:token', inviteController.accept);
router.post('/:token/accept', inviteController.confirmAccept);
router.post('/:token/decline', inviteController.decline);

export default router;
`;

  await fs.writeFile(path.join(routesDir, "organization.routes.ts"), orgRoutes);
  await fs.writeFile(
    path.join(routesDir, "subscription.routes.ts"),
    subscriptionRoutes,
  );
  await fs.writeFile(path.join(routesDir, "invite.routes.ts"), inviteRoutes);
}

async function generateSaaSControllers(projectDir, options) {
  const controllersDir = path.join(projectDir, 'src/controllers');
  const srcDir = path.join(__dirname, '../../../src/templates/saas');
  
  // Copy pre-written organization controller
  await fs.copy(
    path.join(srcDir, 'organization.controller.ts'),
    path.join(controllersDir, 'organization.controller.ts')
  );
  
  // Organization controller (old code removed)

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const organizations = await Organization.findAll({
      where: { ownerId: userId }
    });
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    res.json({ organization });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, slug } = req.body;
    const userId = req.user?.userId;
    
    const organization = await Organization.create({
      name,
      slug,
      ownerId: userId!,
      plan: 'free'
    });
    
    res.status(201).json({ organization });
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    
    await organization.update(req.body);
    res.json({ organization });
  } catch (error) {
    next(error);
  }
}

export async function deleteOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    
    await organization.destroy();
    res.json({ message: 'Organization deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getTeam(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const TeamMember = (await import('../models/TeamMember.js')).default;
    const team = await TeamMember.findAll({
      where: { organizationId: req.params.id }
    });
    res.json({ team });
  } catch (error) {
    next(error);
  }
}

export async function addTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { TeamMember } = await import('../models');
    const { userId, role } = req.body;
    
    const member = await TeamMember.create({
      organizationId: req.params.id,
      userId,
      role: role || 'member'
    });
    
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
}

export async function removeTeamMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { TeamMember } = await import('../models');
    await TeamMember.destroy({
      where: {
        organizationId: req.params.id,
        userId: req.params.userId
      }
    });
    res.json({ message: 'Team member removed' });
  } catch (error) {
    next(error);
  }
}

export async function listInvites(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { Invite } = await import('../models');
    const invites = await Invite.findAll({
      where: { organizationId: req.params.id }
    });
    res.json({ invites });
  } catch (error) {
    next(error);
  }
}

export async function createInvite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { Invite } = await import('../models');
    const { email, role } = req.body;
    const token = require('crypto').randomBytes(32).toString('hex');
    
    const invite = await Invite.create({
      organizationId: req.params.id,
      email,
      role: role || 'member',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    res.status(201).json({ invite });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { Invite } = await import('../models');
    await Invite.destroy({
      where: {
        id: req.params.inviteId,
        organizationId: req.params.id
      }
    });
    res.json({ message: 'Invite cancelled' });
  } catch (error) {
    next(error);
  }
}
`;

  // Subscription controller (simplified)
  const subscriptionController = `import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

export async function getByOrg(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { Subscription } = await import('../models');
    const subscription = await Subscription.findOne({
      where: { organizationId: req.params.orgId }
    });
    res.json({ subscription });
  } catch (error) {
    next(error);
  }
}

export async function createCheckout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Placeholder for Stripe checkout session creation
    res.json({ 
      message: 'Checkout session would be created here',
      url: 'https://checkout.stripe.com/...'
    });
  } catch (error) {
    next(error);
  }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    // Placeholder for Stripe webhook handling
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}
`;

  // Invite controller
  const inviteController = `import { Request, Response, NextFunction } from 'express';

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const { Invite } = await import('../models');
    const invite = await Invite.findOne({
      where: { token: req.params.token }
    });
    
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }
    
    res.json({ invite });
  } catch (error) {
    next(error);
  }
}

export async function confirmAccept(req: Request, res: Response, next: NextFunction) {
  try {
    const { Invite, TeamMember } = await import('../models');
    const invite = await Invite.findOne({
      where: { token: req.params.token }
    });
    
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }
    
    // Add user to organization
    await TeamMember.create({
      organizationId: invite.organizationId,
      userId: req.body.userId,
      role: invite.role
    });
    
    // Mark invite as accepted
    await invite.update({ status: 'accepted' });
    
    res.json({ message: 'Invite accepted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function decline(req: Request, res: Response, next: NextFunction) {
  try {
    const { Invite } = await import('../models');
    const invite = await Invite.findOne({
      where: { token: req.params.token }
    });
    
    if (invite) {
      await invite.update({ status: 'expired' });
    }
    
    res.json({ message: 'Invite declined' });
  } catch (error) {
    next(error);
  }
}
`;

  await fs.writeFile(
    path.join(controllersDir, "organization.controller.ts"),
    orgController,
  );
  await fs.writeFile(
    path.join(controllersDir, "subscription.controller.ts"),
    subscriptionController,
  );
  await fs.writeFile(
    path.join(controllersDir, "invite.controller.ts"),
    inviteController,
  );
}

async function generateSaaSServices(projectDir, options) {
  const servicesDir = path.join(projectDir, "src/services");

  // Organization service
  const orgService = `import Organization from '../models/Organization';
import TeamMember from '../models/TeamMember';
import Invite from '../models/Invite';

export async function createOrganization(name: string, slug: string, ownerId: number) {
  const organization = await Organization.create({
    name,
    slug,
    ownerId,
    plan: 'free'
  });
  
  // Create owner as team member
  await TeamMember.create({
    organizationId: organization.id,
    userId: ownerId,
    role: 'owner'
  });
  
  return organization;
}

export async function getUserOrganizations(userId: number) {
  return Organization.findAll({
    where: { ownerId: userId }
  });
}
`;

  await fs.writeFile(
    path.join(servicesDir, "organization.service.ts"),
    orgService,
  );
}

async function updateSaaSDependencies(projectDir) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = await fs.readJson(packageJsonPath);

  // Add Stripe for payments
  packageJson.dependencies.stripe = "^14.0.0";
  packageJson.dependencies["@types/stripe"] = "^8.0.0";

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

module.exports = { generateSaasTemplate };
