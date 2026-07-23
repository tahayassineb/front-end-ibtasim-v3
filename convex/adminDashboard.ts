import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboardStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
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
    activeKafala: v.number(),
    donationCount: v.number(),
    pendingKafalaVerifications: v.number(),
    monthlyKafala: v.array(v.object({
      month: v.string(),
      amount: v.number(),
      count: v.number(),
    })),
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

    const inRange = (ts: number): boolean => {
      if (!hasDateFilter) return true;
      if (startDate !== undefined && ts < startDate) return false;
      if (endDate !== undefined && ts > endDate) return false;
      return true;
    };

    const effectiveTs = (d: { verifiedAt?: number; createdAt: number }): number =>
      d.verifiedAt ?? d.createdAt;

    const getRangeMs = (): number => {
      if (!hasDateFilter) return 45 * 24 * 60 * 60 * 1000 + 1;
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

    const allDonations = await ctx.db.query("donations").collect();
    const verifiedDonationsAll = allDonations.filter(
      (d) => d.status === "verified" || d.status === "completed"
    );
    const rejectedDonations = allDonations.filter((d) => d.status === "rejected");
    const verifiedDonationsFiltered = verifiedDonationsAll.filter((d) =>
      inRange(effectiveTs(d))
    );
    const totalRaised = verifiedDonationsAll.reduce((sum, d) => sum + d.amount, 0);

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const pendingVerificationsData = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_verification"))
      .collect();

    const uniqueDonorIds = new Set(verifiedDonationsFiltered.map((d) => d.userId));

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

    const allKafalaProfiles = await ctx.db.query("kafala").collect();
    const sponsoredKafala = allKafalaProfiles.filter((k) => k.status === "sponsored");
    const availableKafala = allKafalaProfiles.filter((k) => k.status === "active");
    const waitingPublished = availableKafala.length;

    const verifiedKafalaDonationsFiltered = verifiedKafalaDonationsAll.filter((d) =>
      inRange(effectiveTs(d))
    );
    const kafalaCollected = verifiedKafalaDonationsFiltered.reduce(
      (sum, d) => sum + d.amount,
      0
    );

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
      .map((value) => ({ label: getBucketLabel(value.ts), amount: value.amount, count: value.count }));
    const kafalaSeries = Object.values(kafalaSeriesMap)
      .sort((a, b) => a.ts - b.ts)
      .map((value) => ({ label: getBucketLabel(value.ts), amount: value.amount, count: value.count }));

    return {
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
