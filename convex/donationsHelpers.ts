import { api } from "./_generated/api";
import { requireAdminSession } from "./permissions";

export async function requireDonationAdminActor(ctx: any, args: { sessionToken?: string }, permission: "verification:write") {
  if (args.sessionToken) return await requireAdminSession(ctx, args.sessionToken, permission);
  throw new Error("Admin session required.");
}

export async function storageObjectExists(ctx: any, storageId: string) {
  if (!storageId || storageId.length < 16) return false;
  try {
    const url = await ctx.storage.getUrl(storageId as any);
    return Boolean(url);
  } catch {
    return false;
  }
}

export function getDonationInitialStatus(paymentMethod: "bank_transfer" | "cash_agency") {
  if (paymentMethod === "bank_transfer" || paymentMethod === "cash_agency") {
    return "awaiting_receipt" as const;
  }
  return "pending" as const;
}

export function resolveDonationDonor(donation: any, user: any) {
  return {
    donorName: donation.donorName && donation.donorName.length > 0 ? donation.donorName : user?.fullName ?? "Unknown",
    donorPhone: donation.donorPhone && donation.donorPhone.length > 0 ? donation.donorPhone : user?.phoneNumber ?? "",
  };
}

export async function applyVerifiedDonationEffects(ctx: any, donation: any, now: number) {
  const project = await ctx.db.get(donation.projectId);
  if (project) {
    await ctx.db.patch(donation.projectId, {
      raisedAmount: project.raisedAmount + donation.amount,
      updatedAt: now,
    });
  }

  const user = donation.userId ? await ctx.db.get(donation.userId) : null;
  if (user && donation.userId) {
    await ctx.db.patch(donation.userId, {
      totalDonated: (user.totalDonated ?? 0) + donation.amount,
      donationCount: (user.donationCount ?? 0) + 1,
    });
  }

  return { project, user };
}

export async function logDonationVerification(ctx: any, args: { donationId: any; adminId?: any; action: "verify" | "reject"; notes?: string; checklist?: string[]; createdAt: number }) {
  await ctx.db.insert("verificationLogs", {
    donationId: args.donationId,
    adminId: args.adminId,
    action: args.action,
    notes: args.notes,
    checklist: args.checklist,
    createdAt: args.createdAt,
  });
}

export async function logDonationActivity(ctx: any, args: { actorId: any; action: string; entityId: string; metadata?: any; createdAt: number }) {
  await ctx.db.insert("activities", {
    actorId: args.actorId,
    actorType: "admin",
    action: args.action,
    entityType: "donation",
    entityId: args.entityId,
    metadata: args.metadata,
    createdAt: args.createdAt,
  });
}

export async function scheduleDonationVerifiedNotification(ctx: any, donation: any, project: any, donationId: any) {
  if (project && donation.userId) {
    await ctx.scheduler.runAfter(0, api.notifications.sendDonationVerificationNotification, {
      userId: donation.userId,
      donationId,
      amount: donation.amount,
      projectTitle: project.title.ar,
    });
  }
}

export async function scheduleDonationRejectedNotification(ctx: any, donation: any, donationId: any, notes?: string) {
  if (donation.userId) {
    await ctx.scheduler.runAfter(0, api.notifications.sendDonationRejectionNotification, {
      userId: donation.userId,
      donationId,
      notes,
    });
  }
}
