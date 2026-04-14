import { Request, Response, NextFunction } from "express";
import Organization from "../models/Organization.js";
import TeamMember from "../models/TeamMember.js";
import Invite from "../models/Invite.js";
import { AuthRequest } from "../middleware/auth";

export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.userId;
    const organizations = await Organization.findAll({
      where: { ownerId: userId },
    });
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    res.json({ organization });
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, slug } = req.body;
    const userId = req.user?.userId;

    const organization = await Organization.create({
      name,
      slug,
      ownerId: userId!,
      plan: "free",
    });

    res.status(201).json({ organization });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    await organization.update(req.body);
    res.json({ organization });
  } catch (error) {
    next(error);
  }
}

export async function deleteOne(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    await organization.destroy();
    res.json({ message: "Organization deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getTeam(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const team = await TeamMember.findAll({
      where: { organizationId: req.params.id },
    });
    res.json({ team });
  } catch (error) {
    next(error);
  }
}

export async function addTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, role } = req.body;

    const member = await TeamMember.create({
      organizationId: req.params.id,
      userId,
      role: role || "member",
    });

    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
}

export async function removeTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await TeamMember.destroy({
      where: {
        organizationId: req.params.id,
        userId: req.params.userId,
      },
    });
    res.json({ message: "Team member removed" });
  } catch (error) {
    next(error);
  }
}

export async function listInvites(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const invites = await Invite.findAll({
      where: { organizationId: req.params.id },
    });
    res.json({ invites });
  } catch (error) {
    next(error);
  }
}

export async function createInvite(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, role } = req.body;
    const token = require("crypto").randomBytes(32).toString("hex");

    const invite = await Invite.create({
      organizationId: req.params.id,
      email,
      role: role || "member",
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ invite });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvite(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await Invite.destroy({
      where: {
        id: req.params.inviteId,
        organizationId: req.params.id,
      },
    });
    res.json({ message: "Invite cancelled" });
  } catch (error) {
    next(error);
  }
}
