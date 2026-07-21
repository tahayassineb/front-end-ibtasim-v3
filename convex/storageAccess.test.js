import { describe, expect, it } from "vitest";
import { collectReferencedStorageIds, extractStorageIdsFromHtml } from "./storageAccess";

describe("storageAccess", () => {
  it("extracts inline story image storage ids from html", () => {
    const html = `
      <p>Hello</p>
      <img src="/storage/storyInline123" />
      <img src="https://example.com/storage/not-local" />
      <img src="https://ibtasim.test/storage/storyInline999" />
      <img data-storage-id="storyInline456" src="/storage/storyInline456" />
    `;

    expect(extractStorageIdsFromHtml(html, new Set(["https://ibtasim.test"])).sort()).toEqual([
      "storyInline123",
      "storyInline456",
      "storyInline999",
    ]);
  });

  it("collects referenced ids across public and receipt-bearing records", () => {
    const referenced = collectReferencedStorageIds({
      projects: [
        { mainImage: "projectMain1", gallery: ["gallery1", "gallery2"] },
      ],
      stories: [
        {
          coverImage: "storyCover1",
          body: '<p>Story</p><img src="https://ibtasim.test/storage/storyInline123" data-storage-id="storyInline456" />',
        },
      ],
      kafalaRecords: [{ photo: "kafalaPhoto1" }],
      donations: [{ receiptUrl: "receipt1" }],
      kafalaDonations: [{ receiptUrl: "kafalaReceipt1" }],
      allowedOrigins: new Set(["https://ibtasim.test"]),
    });

    expect(Array.from(referenced).sort()).toEqual([
      "gallery1",
      "gallery2",
      "kafalaPhoto1",
      "kafalaReceipt1",
      "projectMain1",
      "receipt1",
      "storyCover1",
      "storyInline123",
      "storyInline456",
    ]);
  });

  it("ignores external urls and empty values", () => {
    const referenced = collectReferencedStorageIds({
      projects: [{ mainImage: "https://cdn.example.com/project.png", gallery: ["", "gallery1"] }],
      stories: [{ coverImage: "data:image/png;base64,abc", body: '<img src="https://cdn.example.com/cover.png" />' }],
      donations: [{ receiptUrl: undefined }],
    });

    expect(Array.from(referenced).sort()).toEqual(["gallery1"]);
  });
});
