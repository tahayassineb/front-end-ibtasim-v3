import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { hashPassword } from "./auth";

// ============================================
// ADMIN DASHBOARD QUERIES
// ============================================

export const getDashboardStats = query({
  args: {},
  returns: v.object({
    totalDonations: v.number(),
    totalRaised: v.number(),
    activeProjects: v.number(),
    totalDonors: v.number(),
    pendingVerifications: v.number(),
    rejectedDonations: v.number(),
    monthlyDonations: v.array(v.object({
      month: v.string(),
      amount: v.number(),
      count: v.number(),
    })),
  }),
  handler: async (ctx) => {
    // Get all donations
    const donations = await ctx.db.query("donations").collect();
    const verifiedDonations = donations.filter(d => d.status === "verified" || d.status === "completed");
    const rejectedDonations = donations.filter(d => d.status === "rejected");

    // Calculate totals
    const totalRaised = verifiedDonations.reduce((sum, d) => sum + d.amount, 0);

    // Get active projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Get pending verifications
    const pendingVerificationsData = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .collect();

    // Get unique donors
    const uniqueDonorIds = new Set(verifiedDonations.map(d => d.userId));

    // Calculate monthly stats (last 6 months)
    const monthlyStats: Record<string, { amount: number; count: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyStats[monthKey] = { amount: 0, count: 0 };
    }

    verifiedDonations.forEach(donation => {
      const date = new Date(donation.createdAt);
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].amount += donation.amount;
        monthlyStats[monthKey].count += 1;
      }
    });

    const monthlyDonations = Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      amount: stats.amount,
      count: stats.count,
    }));

    return {
      totalDonations: verifiedDonations.length,
      totalRaised,
      activeProjects: projects.length,
      totalDonors: uniqueDonorIds.size,
      pendingVerifications: pendingVerificationsData.length,
      rejectedDonations: rejectedDonations.length,
      monthlyDonations,
    };
  },
});

export const getDonors = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    donors: v.array(v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      totalDonated: v.number(),
      donationCount: v.number(),
      lastLoginAt: v.number(),
      isVerified: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let users;
    
    // Apply search filter if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      // Fetch all and filter in memory (for small datasets)
      // In production with large datasets, use a search index
      const allUsers = await ctx.db.query("users").take(200);
      users = allUsers.filter(u =>
        u.fullName.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phoneNumber.includes(searchLower)
      ).slice(0, args.limit || 50);
    } else {
      users = await ctx.db.query("users").order("desc").take(args.limit || 50);
    }
    
    const donors = users.map(u => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      totalDonated: u.totalDonated,
      donationCount: u.donationCount,
      lastLoginAt: u.lastLoginAt,
      isVerified: u.isVerified,
    }));
    
    // Simple cursor pagination (last item ID)
    const nextCursor = donors.length === (args.limit || 50) 
      ? donors[donors.length - 1]._id 
      : undefined;
    
    return {
      donors,
      nextCursor,
    };
  },
});

export const getDonorById = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      fullName: v.string(),
      email: v.string(),
      phoneNumber: v.string(),
      isVerified: v.boolean(),
      preferredLanguage: v.string(),
      notificationsEnabled: v.boolean(),
      totalDonated: v.number(),
      donationCount: v.number(),
      createdAt: v.number(),
      lastLoginAt: v.number(),
      donations: v.array(v.object({
        _id: v.id("donations"),
        amount: v.number(),
        status: v.string(),
        createdAt: v.number(),
        projectTitle: v.string(),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    // Get user's donations with project titles
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
    
    const donationsWithTitles = await Promise.all(
      donations.map(async (d) => {
        const project = await ctx.db.get(d.projectId);
        return {
          _id: d._id,
          amount: d.amount,
          status: d.status,
          createdAt: d.createdAt,
          projectTitle: project?.title?.en || "Unknown Project",
        };
      })
    );
    
    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      preferredLanguage: user.preferredLanguage,
      notificationsEnabled: user.notificationsEnabled,
      totalDonated: user.totalDonated,
      donationCount: user.donationCount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      donations: donationsWithTitles,
    };
  },
});

export const getVerifications = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("donations"),
    _creationTime: v.number(),
    user: v.object({
      _id: v.id("users"),
      fullName: v.string(),
      phoneNumber: v.string(),
    }),
    project: v.object({
      _id: v.id("projects"),
      title: v.string(),
    }),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    receiptUrl: v.optional(v.string()),
    bankName: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const targetStatus = args.status || "awaiting_verification";
    
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", targetStatus as any))
      .order("asc")
      .take(args.limit || 50);
    
    const enrichedDonations = await Promise.all(
      donations.map(async (d) => {
        const user = await ctx.db.get(d.userId);
        const project = await ctx.db.get(d.projectId);
        
        return {
          _id: d._id,
          _creationTime: d._creationTime,
          user: {
            _id: user?._id || d.userId,
            fullName: user?.fullName || "Unknown",
            phoneNumber: user?.phoneNumber || "",
          },
          project: {
            _id: project?._id || d.projectId,
            title: project?.title?.en || "Unknown Project",
          },
          amount: d.amount,
          paymentMethod: d.paymentMethod,
          status: d.status,
          receiptUrl: d.receiptUrl,
          bankName: d.bankName,
          transactionReference: d.transactionReference,
          createdAt: d.createdAt,
        };
      })
    );
    
    return enrichedDonations;
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

export const createAdmin = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    passwordHash: v.string(),
    createdBy: v.optional(v.id("admins")),
  },
  returns: v.id("admins"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const adminId = await ctx.db.insert("admins", {
      userId: args.userId,
      email: args.email,
      passwordHash: args.passwordHash,
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      createdBy: args.createdBy,
    });
    
    return adminId;
  },
});

export const getAdminByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("admins"),
      userId: v.id("users"),
      email: v.string(),
      passwordHash: v.string(),
      isActive: v.boolean(),
      lastLoginAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!admin) return null;
    
    return {
      _id: admin._id,
      userId: admin.userId,
      email: admin.email,
      passwordHash: admin.passwordHash,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
    };
  },
});

export const updateAdminLastLogin = mutation({
  args: { adminId: v.id("admins") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      lastLoginAt: Date.now(),
    });
    return true;
  },
});

// ============================================
// SUPER ADMIN SEED (idempotent)
// ============================================

export const createSuperAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  returns: v.union(
    v.object({ success: v.literal(true), adminId: v.id("admins") }),
    v.object({ success: v.literal(false), message: v.string() })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Idempotent: check if admin already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      return { success: false, message: "Admin already exists." } as const;
    }

    // Create the user record
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: args.email,
      phoneNumber: args.phoneNumber,
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
      email: args.email,
      passwordHash,
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
    });

    return { success: true, adminId } as const;
  },
});

// ============================================
// ADMIN INVITATIONS
// ============================================

export const createAdminInvitation = mutation({
  args: {
    email: v.string(),
    phone: v.string(),
    invitedBy: v.id("admins"),
    siteUrl: v.string(),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate a UUID token using Web Crypto
    const token = crypto.randomUUID();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("adminInvitations", {
      email: args.email,
      phone: args.phone,
      token,
      invitedBy: args.invitedBy,
      status: "pending",
      expiresAt,
      createdAt: now,
    });

    const inviteUrl = `${args.siteUrl}/admin/register/${token}`;
    const message = `مرحباً! تمت دعوتك للانضمام إلى فريق الإدارة في منصة جمعية الأمل.\n\nاضغط على الرابط التالي لإنشاء حسابك:\n${inviteUrl}\n\nالرابط صالح لمدة 7 أيام.`;

    try {
      await ctx.scheduler.runAfter(0, api.notifications.sendWhatsApp, {
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
    v.object({ valid: v.literal(true), email: v.string() }),
    v.object({ valid: v.literal(false), reason: v.string() })
  ),
  handler: async (ctx, args) => {
    const inv = await ctx.db
      .query("adminInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!inv) {
      return { valid: false, reason: "Invitation not found." } as const;
    }
    if (inv.status !== "pending") {
      return { valid: false, reason: "Invitation already used." } as const;
    }
    if (Date.now() > inv.expiresAt) {
      return { valid: false, reason: "Invitation has expired." } as const;
    }
    return { valid: true, email: inv.email } as const;
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

    const inv = await ctx.db
      .query("adminInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!inv) return { success: false, message: "Invalid invitation." } as const;
    if (inv.status !== "pending") return { success: false, message: "Invitation already used." } as const;
    if (now > inv.expiresAt) return { success: false, message: "Invitation has expired." } as const;

    // Check if email already used as admin
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", inv.email))
      .first();
    if (existing) return { success: false, message: "Email already registered as admin." } as const;

    // Create user record
    const userId = await ctx.db.insert("users", {
      fullName: args.fullName,
      email: inv.email,
      phoneNumber: args.phoneNumber || inv.phone,
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
      email: inv.email,
      passwordHash,
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      createdBy: inv.invitedBy,
    });

    // Mark invitation accepted
    await ctx.db.patch(inv._id, {
      status: "accepted",
      acceptedAt: now,
    });

    return { success: true, adminId } as const;
  },
});