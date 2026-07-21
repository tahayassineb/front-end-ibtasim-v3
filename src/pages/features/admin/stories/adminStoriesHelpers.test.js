import { describe, expect, it } from "vitest";
import { buildStoryForm, buildStoryPayload, EMPTY_FORM, POST_TYPE_DEFAULTS, slugifyStoryTitle } from "./adminStoriesHelpers";

describe("adminStoriesHelpers", () => {
  it("slugifies Arabic and Latin titles into a stable story slug", () => {
    expect(slugifyStoryTitle("  Hello World 2026! ")).toBe("hello-world-2026");
    expect(slugifyStoryTitle("قصة نجاح رائعة!")).toBe("قصة-نجاح-رائعة");
  });

  it("builds a form model from an existing story record", () => {
    const form = buildStoryForm({
      title: "Story title",
      excerpt: "Excerpt",
      postType: "activity",
      isPublished: true,
      isFeatured: true,
      coverImage: "cover123",
      body: "<p>Body</p>",
      slug: "story-title",
      metaDescription: "desc",
      metaTitle: "meta",
      imageAlt: "alt",
    });

    expect(form.postType).toBe("activity");
    expect(form.gradient).toBe(POST_TYPE_DEFAULTS.activity.gradient);
    expect(form.coverImage).toBe("cover123");
    expect(form.metaTitle).toBe("meta");
  });

  it("builds a mutation payload without empty optional fields", () => {
    const payload = buildStoryPayload({
      ...EMPTY_FORM,
      title: "My story",
      excerpt: "Summary",
    });

    expect(payload.title).toEqual({ ar: "My story", fr: "", en: "" });
    expect(payload.coverImage).toBeUndefined();
    expect(payload.body).toBeUndefined();
    expect(payload.slug).toBeUndefined();
    expect(payload.postType).toBe("story");
  });
});
