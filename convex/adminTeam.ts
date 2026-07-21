import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./auth";
import { revokeAdminSessionRecord } from "./adminSessions";
import {
  adminRole,
  canChangeRole,
  canInviteRole,
  effectiveRole,
  invitationRole,
  requireAdminSession,
} from "./permissions";

export const createAdminInvitation = mutation({
  args: {
    email: v.string(),
    phone: v.string(),
    role: invitationRole,
    sessionToken: v.string(),
    siteUrl: v.string(),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const inviter = await requireAdminSession(ctx, args.sessionToken, "admin:invite");
    if (!canInviteRole(inviter.role, args.role)) {
      throw new Error("You cannot invite a member with this role.");
    }

    const token = crypto.randomUUID();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const invitationId = await ctx.db.insert("adminInvitations", {
      email: args.email,
      phone: args.phone,
      token,
      invitedBy: inviter._id,
      role: args.role,
      status: "pending",
      expiresAt,
      createdAt: now,
    });

    await ctx.db.insert("activities", {
      actorId: inviter._id,
      actorType: "admin",
      action: "admin.invitation_created",
      entityType: "admin",
      entityId: String(invitationId),
      metadata: { email: args.email, role: args.role },
      createdAt: now,
    });

    const inviteUrl = `${args.siteUrl}/admin/register/${token}`;
    const message = `مرحبا! تمت دعوتك للانضمام إلى فريق الإدارة في منصة جمعية الأمل.\n\nاضغط على الرابط التالي لإنشاء حسابك:\n${inviteUrl}\n\nالرابط صالح لمدة 7 أيام.`;

    try {
      await ctx.scheduler.runAfter(0, internal.notifications.sendWhatsAppInternal, {
        to: args.phone,
        text: message,
      });
    } catch (e) {
      console.error("Failed to schedule invitation WhatsApp:", e);
    }

    return { token };
  },
});

export const validateInvitationToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({ valid: v.literal(true), email: v.string(), role: invitationRole }),
    v.object({ valid: v.literal(false), reason: v.string() })
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("adminInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return { valid: false, reason: "Invitation not found." } as const;
    }
    if (invitation.status !== "pending") {
      return { valid: false, reason: "Invitation already used." } as const;
    }
    if (Date.now() > invitation.expiresAt) {
      return { valid: false, reason: "Invitation has expired." } as const;
    }
    return { valid: true, email: invitation.email, role: invitation.role ?? "viewer" } as const;
  },
});

export const acceptAdminInvitation = mutation({
  args: {
    token: v.string(),
    fullName: v.string(),
    password: v.string(),
    phoneNumber: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ success: v.literal(true), adminId: v.id("admins") }),
    v.object({ success: v.literal(false), message: v.string() })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    const invitation = await ctx.db
      .query("adminInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) return { success: false, message: "Invalid invitation." } as const;
    if (invitation.status !== "pending") return { success: false, message: "Invitation already used." } as const;
    if (now > invitation.expiresAt) return { success: false, message: "Invitation has expired." } as const;

    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", invitation.email))
      .first();
    if (existing) return { success: false, message: "Email already registered as admin." } as const;

    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: invitation.email,
      phoneNumber: args.phoneNumber || invitation.phone,
      isVerified: true,
      preferredLanguage: "ar",
      notificationsEnabled: true,
      totalDonated: 0,
      donationCount: 0,
      dataRetentionConsent: true,
      consentGivenAt: now,
      createdAt: now,
      lastLoginAt: now,
    });

    const passwordHash = await hashPassword(args.password);
    const adminId = await ctx.db.insert("admins", {
      userId,
      email: invitation.email,
      passwordHash,
      role: invitation.role ?? "viewer",
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      createdBy: invitation.invitedBy,
    });

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
    });

    return { success: true, adminId } as const;
  },
});

export const verifyAdminSession = query({
  args: { sessionToken: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      await requireAdminSession(ctx, args.sessionToken, "admin:read");
      return true;
    } catch {
      return false;
    }
  },
});

export const getAdminSession = query({
  args: { sessionToken: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("admins"),
      userId: v.id("users"),
      email: v.string(),
      role: adminRole,
      isActive: v.boolean(),
      fullName: v.string(),
      phoneNumber: v.string(),
      lastLoginAt: v.number(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let admin = null;
    try {
      admin = await requireAdminSession(ctx, args.sessionToken, "admin:read");
    } catch {
      return null;
    }
    if (!admin || !admin.isActive) return null;
    const user = await ctx.db.get(admin.userId);
    return {
      _id: admin._id,
      userId: admin.userId,
      email: admin.email,
      role: effectiveRole(admin.role),
      isActive: admin.isActive,
      fullName: user?.fullName ?? admin.email,
      phoneNumber: user?.phoneNumber ?? "",
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    };
  },
});

export const logoutAdminSession = mutation({
  args: { sessionToken: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await revokeAdminSessionRecord(ctx, args.sessionToken);
  },
});

export const migrateExistingAdminsToOwner = mutation({
  args: { sessionToken: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:manage_team");
    const admins = await ctx.db.query("admins").collect();
    let updated = 0;
    for (const admin of admins) {
      if (!admin.role) {
        await ctx.db.patch(admin._id, { role: "owner" });
        updated++;
      }
    }
    return updated;
  },
});

export const listTeamMembers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken, "admin:read");
    const admins = await ctx.db.query("admins").collect();
    const members = await Promise.all(admins.map(async (admin) => {
      const user = await ctx.db.get(admin.userId);
      const createdBy = admin.createdBy ? await ctx.db.get(admin.createdBy) : null;
      return {
        _id: admin._id,
        userId: admin.userId,
        email: admin.email,
        role: effectiveRole(admin.role),
        isActive: admin.isActive,
        fullName: user?.fullName ?? admin.email,
        phoneNumber: user?.phoneNumber ?? "",
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        createdBy: admin.createdBy,
        createdByEmail: createdBy?.email,
      };
    }));

    const invitations = await ctx.db.query("adminInvitations").collect();
    return {
      members: members.sort((a, b) => b.createdAt - a.createdAt),
      invitations: invitations
        .filter((invitation) => invitation.status === "pending")
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((invitation) => ({
          _id: invitation._id,
          email: invitation.email,
          phone: invitation.phone,
          role: invitation.role ?? "viewer",
          invitedBy: invitation.invitedBy,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          token: invitation.token,
        })),
    };
  },
});

export const updateAdminRole = mutation({
  args: {
    sessionToken: v.string(),
    targetAdminId: v.id("admins"),
    role: invitationRole,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireAdminSession(ctx, args.sessionToken, "admin:manage_team");
    if (!canChangeRole(actor.role, args.role)) throw new Error("You cannot assign this role.");
    if (actor._id === args.targetAdminId) throw new Error("You cannot change your own role.");
    await ctx.db.patch(args.targetAdminId, { role: args.role });
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "admin.role_changed",
      entityType: "admin",
      entityId: String(args.targetAdminId),
      metadata: { role: args.role },
      createdAt: Date.now(),
    });
    return true;
  },
});

export const setAdminActive = mutation({
  args: {
    sessionToken: v.string(),
    targetAdminId: v.id("admins"),
    isActive: v.boolean(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireAdminSession(ctx, args.sessionToken, "admin:manage_team");
    if (actor._id === args.targetAdminId && !args.isActive) {
      throw new Error("You cannot deactivate your own account.");
    }
    await ctx.db.patch(args.targetAdminId, { isActive: args.isActive });
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: args.isActive ? "admin.reactivated" : "admin.deactivated",
      entityType: "admin",
      entityId: String(args.targetAdminId),
      createdAt: Date.now(),
    });
    return true;
  },
});

export const cancelInvitation = mutation({
  args: {
    sessionToken: v.string(),
    invitationId: v.id("adminInvitations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireAdminSession(ctx, args.sessionToken, "admin:invite");
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.status !== "pending") return false;
    await ctx.db.patch(args.invitationId, { status: "expired" });
    await ctx.db.insert("activities", {
      actorId: actor._id,
      actorType: "admin",
      action: "admin.invitation_cancelled",
      entityType: "admin",
      entityId: String(args.invitationId),
      metadata: { email: invitation.email },
      createdAt: Date.now(),
    });
    return true;
  },
});
