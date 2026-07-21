import { describe, expect, it } from "vitest";
import { buildProjectCreateDoc, buildProjectUpdatePatch, sortByFeaturedOrder } from "./projectsHelpers";

describe("projectsHelpers", () => {
  it("builds a create document with derived slug and metadata defaults", () => {
    const doc = buildProjectCreateDoc(
      {
        title: { ar: "مشروع تعليم", fr: "Projet", en: "Project" },
        description: { ar: "وصف طويل للمشروع", fr: "Description", en: "Description" },
        category: "education",
        goalAmount: 1000,
        mainImageStorageId: "img1",
      },
      "admin1",
      123456789,
      3,
    );

    expect(doc.raisedAmount).toBe(0);
    expect(doc.currency).toBe("MAD");
    expect(doc.featuredOrder).toBe(3);
    expect(doc.slug).toBe("مشروع-تعليم");
    expect(doc.canonicalPath).toBe("/projects/مشروع-تعليم");
    expect(doc.metaTitle).toBe("مشروع تعليم");
  });

  it("maps update storage ids to stored fields and derives metadata when needed", () => {
    const patch = buildProjectUpdatePatch(
      { slug: "", metaDescription: "" },
      {
        title: { ar: "عنوان جديد", fr: "Titre", en: "Title" },
        description: { ar: "هذا وصف جديد", fr: "Description", en: "Description" },
        mainImageStorageId: "img2",
        galleryStorageIds: ["g1", "g2"],
      },
      5,
    );

    expect(patch.mainImage).toBe("img2");
    expect(patch.gallery).toEqual(["g1", "g2"]);
    expect(patch.mainImageStorageId).toBeUndefined();
    expect(patch.galleryStorageIds).toBeUndefined();
    expect(patch.slug).toBe("عنوان-جديد");
    expect(patch.featuredOrder).toBe(5);
  });

  it("sorts featured projects with undefined orders last", () => {
    const sorted = sortByFeaturedOrder([
      { _id: "c", featuredOrder: undefined },
      { _id: "a", featuredOrder: 2 },
      { _id: "b", featuredOrder: 1 },
    ]);

    expect(sorted.map((item) => item._id)).toEqual(["b", "a", "c"]);
  });
});
