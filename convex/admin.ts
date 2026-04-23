import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { hashPassword } from "./auth";
import { adminRole, invitationRole, canInviteRole, canChangeRole, effectiveRole, requireAdmin } from "./permissions";

// ============================================
// ADMIN DASHBOARD QUERIES
// ============================================

export const getDashboardStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    // ── Legacy fields (backward compat) ──────────────────────────────────────
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
    activeKafala: v.number(),
    donationCount: v.number(),
    pendingKafalaVerifications: v.number(),
    monthlyKafala: v.array(v.object({
      month: v.string(),
      amount: v.number(),
      count: v.number(),
    })),
    // ── New extended stats ────────────────────────────────────────────────────
    projectStats: v.object({
      collected: v.number(),
      donationCount: v.number(),
      uniqueDonors: v.number(),
      activeProjects: v.number(),
      pendingVerifications: v.number(),
    }),
    kafalaStats: v.object({
      collected: v.number(),
      activeSponsorships: v.number(),
      availableKafala: v.number(),
      waitingPublished: v.number(),
      pendingVerifications: v.number(),
    }),
    contactStats: v.object({
      newCount: v.number(),
      recentNew: v.array(v.object({
        _id: v.id("contactMessages"),
        name: v.string(),
        subject: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        createdAt: v.number(),
      })),
    }),
    series: v.object({
      donations: v.array(v.object({ label: v.string(), amount: v.number(), count: v.number() })),
      kafala: v.array(v.object({ label: v.string(), amount: v.number(), count: v.number() })),
    }),
  }),
  handler: async (ctx, args) => {
    const { startDate, endDate } = args;
    const hasDateFilter = startDate !== undefined || endDate !== undefined;

    // ── Helper: check if a timestamp falls within the requested date range ────
    const inRange = (ts: number): boolean => {
      if (!hasDateFilter) return true;
      if (startDate !== undefined && ts < startDate) return false;
      if (endDate !== undefined && ts > endDate) return false;
      return true;
    };

    // ── Helper: effective timestamp for a donation (verifiedAt ?? createdAt) ─
    const effectiveTs = (d: { verifiedAt?: number; createdAt: number }): number =>
      d.verifiedAt ?? d.createdAt;

    // ── Bucket helper for series ──────────────────────────────────────────────
    const getRangeMs = (): number => {
      if (!hasDateFilter) return 45 * 24 * 60 * 60 * 1000 + 1; // default → month buckets
      const s = startDate ?? 0;
      const e = endDate ?? Date.now();
      return e - s;
    };
    const rangeMs = getRangeMs();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const bucketType: "hour" | "day" | "month" =
      rangeMs <= oneDayMs ? "hour" : rangeMs <= 45 * oneDayMs ? "day" : "month";

    const getBucketStart = (ts: number): number => {
      const d = new Date(ts);
      if (bucketType === "hour") {
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours());
      }
      if (bucketType === "day") {
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    };

    const getBucketLabel = (bucketStart: number): string => {
      const d = new Date(bucketStart);
      if (bucketType === "hour") return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
      if (bucketType === "day") return d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    };

    // ── All donations ─────────────────────────────────────────────────────────
    const allDonations = await ctx.db.query("donations").collect();
    const verifiedDonationsAll = allDonations.filter(
      (d) => d.status === "verified" || d.status === "completed"
    );
    const rejectedDonations = allDonations.filter((d) => d.status === "rejected");

    // Date-filtered verified donations
    const verifiedDonationsFiltered = verifiedDonationsAll.filter((d) =>
      inRange(effectiveTs(d))
    );

    // Legacy totalRaised — all time (no date filter) to avoid breaking legacy consumers
    const totalRaised = verifiedDonationsAll.reduce((sum, d) => sum + d.amount, 0);

    // ── Active projects ───────────────────────────────────────────────────────
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // ── Pending verifications (never date-filtered) ───────────────────────────
    const pendingVerificationsData = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .collect();

    // ── Unique donors (date-filtered) ─────────────────────────────────────────
    const uniqueDonorIds = new Set(verifiedDonationsFiltered.map((d) => d.userId));

    // ── Monthly donation stats (last 6 months — legacy field, always all-time) ─
    const monthlyStats: Record<string, { amount: number; count: number }> = {};
    const nowDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthlyStats[monthKey] = { amount: 0, count: 0 };
    }
    verifiedDonationsAll.forEach((donation) => {
      const date = new Date(donation.createdAt);
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "numeric" });
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

    // ── Kafala sponsorships ───────────────────────────────────────────────────
    const activeSponsorships = await ctx.db
      .query("kafalaSponsorship")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const pendingKafalaVerif = await ctx.db
      .query("kafalaDonations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .collect();

    const allKafalaDonations = await ctx.db.query("kafalaDonations").collect();
    const verifiedKafalaDonationsAll = allKafalaDonations.filter(
      (d) => d.status === "verified"
    );

    // Monthly kafala stats (legacy — all-time)
    const monthlyKafalaStats: Record<string, { amount: number; count: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthlyKafalaStats[monthKey] = { amount: 0, count: 0 };
    }
    verifiedKafalaDonationsAll.forEach((d) => {
      const key = new Date(d.createdAt).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (monthlyKafalaStats[key]) {
        monthlyKafalaStats[key].amount += d.amount;
        monthlyKafalaStats[key].count += 1;
      }
    });
    const monthlyKafala = Object.entries(monthlyKafalaStats).map(([month, s]) => ({
      month,
      amount: s.amount,
      count: s.count,
    }));

    // ── Kafala profile counts (not date-filtered) ─────────────────────────────
    const allKafalaProfiles = await ctx.db.query("kafala").collect();
    const sponsoredKafala = allKafalaProfiles.filter((k) => k.status === "sponsored");
    const availableKafala = allKafalaProfiles.filter(
      (k) => k.status === "active"
    );
    // "waitingPublished" = active kafala that are published (status=active counts as published)
    const waitingPublished = availableKafala.length;

    // Kafala donations collected in date range (status=verified or paid)
    const verifiedKafalaDonationsFiltered = verifiedKafalaDonationsAll.filter((d) =>
      inRange(effectiveTs(d))
    );
    const kafalaCollected = verifiedKafalaDonationsFiltered.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // ── Contact messages ──────────────────────────────────────────────────────
    const newContactMessages = await ctx.db
      .query("contactMessages")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .order("desc")
      .collect();

    const recentNew = newContactMessages.slice(0, 3).map((m) => ({
      _id: m._id,
      name: m.name,
      subject: m.subject,
      phone: m.phone,
      email: m.email,
      createdAt: m.createdAt,
    }));

    // ── Series (chart buckets) ────────────────────────────────────────────────
    const donationSeriesMap: Record<string, { ts: number; amount: number; count: number }> = {};
    verifiedDonationsFiltered.forEach((d) => {
      const bucketStart = getBucketStart(effectiveTs(d));
      const key = String(bucketStart);
      if (!donationSeriesMap[key]) donationSeriesMap[key] = { ts: bucketStart, amount: 0, count: 0 };
      donationSeriesMap[key].amount += d.amount;
      donationSeriesMap[key].count += 1;
    });

    const kafalaSeriesMap: Record<string, { ts: number; amount: number; count: number }> = {};
    verifiedKafalaDonationsFiltered.forEach((d) => {
      const bucketStart = getBucketStart(effectiveTs(d));
      const key = String(bucketStart);
      if (!kafalaSeriesMap[key]) kafalaSeriesMap[key] = { ts: bucketStart, amount: 0, count: 0 };
      kafalaSeriesMap[key].amount += d.amount;
      kafalaSeriesMap[key].count += 1;
    });

    const donationSeries = Object.values(donationSeriesMap)
      .sort((a, b) => a.ts - b.ts)
      .map((v) => ({ label: getBucketLabel(v.ts), amount: v.amount, count: v.count }));
    const kafalaSeries = Object.values(kafalaSeriesMap)
      .sort((a, b) => a.ts - b.ts)
      .map((v) => ({ label: getBucketLabel(v.ts), amount: v.amount, count: v.count }));

    return {
      // Legacy fields
      totalDonations: verifiedDonationsAll.length,
      totalRaised,
      activeProjects: projects.length,
      totalDonors: uniqueDonorIds.size,
      pendingVerifications: pendingVerificationsData.length,
      rejectedDonations: rejectedDonations.length,
      monthlyDonations,
      activeKafala: activeSponsorships.length,
      donationCount: verifiedDonationsAll.length,
      pendingKafalaVerifications: pendingKafalaVerif.length,
      monthlyKafala,
      // Extended stats
      projectStats: {
        collected: verifiedDonationsFiltered.reduce((sum, d) => sum + d.amount, 0),
        donationCount: verifiedDonationsFiltered.length,
        uniqueDonors: uniqueDonorIds.size,
        activeProjects: projects.length,
        pendingVerifications: pendingVerificationsData.length,
      },
      kafalaStats: {
        collected: kafalaCollected,
        activeSponsorships: sponsoredKafala.length,
        availableKafala: availableKafala.length,
        waitingPublished,
        pendingVerifications: pendingKafalaVerif.length,
      },
      contactStats: {
        newCount: newContactMessages.length,
        recentNew,
      },
      series: {
        donations: donationSeries,
        kafala: kafalaSeries,
      },
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
      .filter((q) => q.eq(q.field("paymentMethod"), "bank_transfer"))
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
    role: v.optional(adminRole),
    createdBy: v.optional(v.id("admins")),
  },
  returns: v.id("admins"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const adminId = await ctx.db.insert("admins", {
      userId: args.userId,
      email: args.email,
      passwordHash: args.passwordHash,
      role: args.role ?? "manager",
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
      role: adminRole,
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
      role: effectiveRole(admin.role),
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
      role: "owner",
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
    role: invitationRole,
    invitedBy: v.id("admins"),
    siteUrl: v.string(),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const inviter = await requireAdmin(ctx, args.invitedBy, "admin:invite");
    if (!canInviteRole(inviter.role, args.role)) {
      throw new Error("You cannot invite a member with this role.");
    }

    // Generate a UUID token using Web Crypto
    const token = crypto.randomUUID();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitationId = await ctx.db.insert("adminInvitations", {
      email: args.email,
      phone: args.phone,
      token,
      invitedBy: args.invitedBy,
      role: args.role,
      status: "pending",
      expiresAt,
      createdAt: now,
    });
    await ctx.db.insert("activities", {
      actorId: args.invitedBy,
      actorType: "admin",
      action: "admin.invitation_created",
      entityType: "admin",
      entityId: String(invitationId),
      metadata: { email: args.email, role: args.role },
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
    v.object({ valid: v.literal(true), email: v.string(), role: invitationRole }),
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
    return { valid: true, email: inv.email, role: inv.role ?? "viewer" } as const;
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
      role: inv.role ?? "viewer",
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

export const verifyAdminSession = query({
  args: { adminId: v.id("admins") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    return !!(admin && admin.isActive);
  },
});

export const getAdminSession = query({
  args: { adminId: v.id("admins") },
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
    const admin = await ctx.db.get(args.adminId);
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

export const migrateExistingAdminsToOwner = mutation({
  args: { adminId: v.id("admins") },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "admin:manage_team");
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
  args: { adminId: v.id("admins") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "admin:read");
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
        .filter((i) => i.status === "pending")
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((i) => ({
          _id: i._id,
          email: i.email,
          phone: i.phone,
          role: i.role ?? "viewer",
          invitedBy: i.invitedBy,
          status: i.status,
          expiresAt: i.expiresAt,
          createdAt: i.createdAt,
          token: i.token,
        })),
    };
  },
});

export const updateAdminRole = mutation({
  args: {
    actorAdminId: v.id("admins"),
    targetAdminId: v.id("admins"),
    role: invitationRole,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx, args.actorAdminId, "admin:manage_team");
    if (!canChangeRole(actor.role, args.role)) throw new Error("You cannot assign this role.");
    if (args.actorAdminId === args.targetAdminId) throw new Error("You cannot change your own role.");
    await ctx.db.patch(args.targetAdminId, { role: args.role });
    await ctx.db.insert("activities", {
      actorId: args.actorAdminId,
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
    actorAdminId: v.id("admins"),
    targetAdminId: v.id("admins"),
    isActive: v.boolean(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.actorAdminId, "admin:manage_team");
    if (args.actorAdminId === args.targetAdminId && !args.isActive) {
      throw new Error("You cannot deactivate your own account.");
    }
    await ctx.db.patch(args.targetAdminId, { isActive: args.isActive });
    await ctx.db.insert("activities", {
      actorId: args.actorAdminId,
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
    actorAdminId: v.id("admins"),
    invitationId: v.id("adminInvitations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.actorAdminId, "admin:invite");
    const inv = await ctx.db.get(args.invitationId);
    if (!inv || inv.status !== "pending") return false;
    await ctx.db.patch(args.invitationId, { status: "expired" });
    await ctx.db.insert("activities", {
      actorId: args.actorAdminId,
      actorType: "admin",
      action: "admin.invitation_cancelled",
      entityType: "admin",
      entityId: String(args.invitationId),
      metadata: { email: inv.email },
      createdAt: Date.now(),
    });
    return true;
  },
});
