import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./permissions";

const receiptStatus = v.union(
  v.literal("pending"),
  v.literal("awaiting_receipt"),
  v.literal("awaiting_verification"),
  v.literal("verified"),
  v.literal("rejected"),
  v.literal("completed")
);

export const list = query({
  args: {
    adminId: v.id("admins"),
    type: v.optional(v.union(v.literal("donation"), v.literal("kafala"))),
    status: v.optional(receiptStatus),
    paymentMethod: v.optional(v.union(v.literal("bank_transfer"), v.literal("cash_agency"), v.literal("card_whop"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    search: v.optional(v.string()),
    verifiedBy: v.optional(v.id("admins")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "admin:read");
    const rows: any[] = [];
    const includeDonation = !args.type || args.type === "donation";
    const includeKafala = !args.type || args.type === "kafala";
    const inRange = (ts: number) => {
      if (args.startDate && ts < args.startDate) return false;
      if (args.endDate && ts > args.endDate) return false;
      return true;
    };
    const matchesCommon = (r: any) => {
      if (args.status && r.status !== args.status) return false;
      if (args.paymentMethod && r.paymentMethod !== args.paymentMethod) return false;
      if (args.verifiedBy && r.verifiedBy !== args.verifiedBy) return false;
      if (!inRange(r.createdAt)) return false;
      const search = args.search?.toLowerCase().trim();
      if (search && !`${r.donorName} ${r.donorPhone} ${r.entityTitle} ${r.transactionReference ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    };

    if (includeDonation) {
      const donations = await ctx.db.query("donations").order("desc").take(500);
      for (const d of donations) {
        if (d.status === "cancelled") continue;
        const user = await ctx.db.get(d.userId);
        const project = await ctx.db.get(d.projectId);
        const receiptUrl = d.receiptUrl ? await ctx.storage.getUrl(d.receiptUrl as any) : null;
        rows.push({
          id: String(d._id),
          type: "donation",
          entityId: String(d.projectId),
          entityTitle: project?.title?.ar ?? project?.title?.fr ?? project?.title?.en ?? "Project",
          donorName: user?.fullName ?? "Unknown",
          donorPhone: user?.phoneNumber ?? "",
          amount: d.amount,
          currency: d.currency,
          paymentMethod: d.paymentMethod,
          status: d.status,
          receiptStorageId: d.receiptUrl,
          receiptUrl: receiptUrl ?? undefined,
          bankName: d.bankName,
          transactionReference: d.transactionReference ?? d.whopPaymentId,
          verifiedBy: d.verifiedBy,
          verifiedAt: d.verifiedAt,
          createdAt: d.createdAt,
        });
      }
    }

    if (includeKafala) {
      const donations = await ctx.db.query("kafalaDonations").order("desc").take(500);
      for (const d of donations) {
        const user = await ctx.db.get(d.userId);
        const kafala = await ctx.db.get(d.kafalaId);
        const receiptUrl = d.receiptUrl ? await ctx.storage.getUrl(d.receiptUrl as any) : null;
        rows.push({
          id: String(d._id),
          type: "kafala",
          entityId: String(d.kafalaId),
          entityTitle: kafala?.name ?? "Kafala",
          donorName: user?.fullName ?? "Unknown",
          donorPhone: user?.phoneNumber ?? "",
          amount: d.amount,
          currency: d.currency,
          paymentMethod: d.paymentMethod,
          status: d.status,
          receiptStorageId: d.receiptUrl,
          receiptUrl: receiptUrl ?? undefined,
          bankName: d.bankName,
          transactionReference: d.transactionReference,
          verifiedBy: d.verifiedBy,
          verifiedAt: d.verifiedAt,
          createdAt: d.createdAt,
        });
      }
    }

    const filtered = rows.filter(matchesCommon).sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit ?? 250);
    return {
      rows: filtered,
      totals: {
        count: filtered.length,
        amount: filtered.reduce((sum, r) => sum + (r.amount ?? 0), 0),
        missingReceipts: filtered.filter((r) => !r.receiptUrl && r.paymentMethod !== "card_whop").length,
      },
    };
  },
});

export const logExport = mutation({
  args: {
    adminId: v.id("admins"),
    count: v.number(),
    exportType: v.union(v.literal("csv"), v.literal("zip"), v.literal("package")),
    filters: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminId, "receipts:export");
    await ctx.db.insert("activities", {
      actorId: args.adminId,
      actorType: "admin",
      action: "receipt.export",
      entityType: "receipt",
      entityId: args.exportType,
      metadata: { count: args.count, exportType: args.exportType, filters: args.filters },
      createdAt: Date.now(),
    });
  },
});
