import { describe, expect, it } from "vitest";
import { getDonationInitialStatus, resolveDonationDonor } from "./donationsHelpers";

describe("donationsHelpers", () => {
  it("assigns offline donation statuses that wait for a receipt", () => {
    expect(getDonationInitialStatus("bank_transfer")).toBe("awaiting_receipt");
    expect(getDonationInitialStatus("cash_agency")).toBe("awaiting_receipt");
  });

  it("prefers guest donor fields and falls back to the linked user", () => {
    expect(
      resolveDonationDonor(
        { donorName: "Guest Donor", donorPhone: "600000000" },
        { fullName: "Registered User", phoneNumber: "611111111" },
      ),
    ).toEqual({ donorName: "Guest Donor", donorPhone: "600000000" });

    expect(
      resolveDonationDonor(
        { donorName: "", donorPhone: "" },
        { fullName: "Registered User", phoneNumber: "611111111" },
      ),
    ).toEqual({ donorName: "Registered User", donorPhone: "611111111" });
  });
});
