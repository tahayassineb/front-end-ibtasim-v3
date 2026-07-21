declare const process: {
  env: {
    CONVEX_SITE_URL?: string;
    FRONTEND_URL?: string;
  };
};

function isLikelyStorageId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("data:") &&
    !value.includes("/")
  );
}

function toOrigin(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getConfiguredStorageOrigins() {
  return new Set(
    [toOrigin(process.env.CONVEX_SITE_URL), toOrigin(process.env.FRONTEND_URL)].filter(Boolean) as string[]
  );
}

function extractStorageIdFromUrl(urlValue: string, allowedOrigins: Set<string>) {
  if (!urlValue) return null;
  if (urlValue.startsWith("/storage/")) {
    const candidate = urlValue.slice("/storage/".length).split(/[?#]/)[0]?.trim();
    return isLikelyStorageId(candidate) ? candidate : null;
  }

  try {
    const parsed = new URL(urlValue);
    if (!allowedOrigins.has(parsed.origin) || !parsed.pathname.startsWith("/storage/")) {
      return null;
    }
    const candidate = parsed.pathname.slice("/storage/".length).split(/[?#]/)[0]?.trim();
    return isLikelyStorageId(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function extractStorageIdsFromHtml(html?: string, allowedOrigins = getConfiguredStorageOrigins()): string[] {
  if (!html) return [];

  const matches = new Set<string>();
  const dataStoragePattern = /data-storage-id=["']([^"']+)["']/g;
  const mediaUrlPattern = /(?:src|href)=["']([^"']+)["']/g;

  let match: RegExpExecArray | null;
  while ((match = dataStoragePattern.exec(html)) !== null) {
    const candidate = match[1]?.trim();
    if (isLikelyStorageId(candidate)) {
      matches.add(candidate);
    }
  }

  while ((match = mediaUrlPattern.exec(html)) !== null) {
    const candidate = extractStorageIdFromUrl(match[1]?.trim(), allowedOrigins);
    if (candidate) {
      matches.add(candidate);
    }
  }

  return Array.from(matches);
}

export function collectReferencedStorageIds({
  projects = [],
  stories = [],
  kafalaRecords = [],
  donations = [],
  kafalaDonations = [],
  allowedOrigins,
}: {
  projects?: Array<{ mainImage?: string; gallery?: string[] }>;
  stories?: Array<{ coverImage?: string; body?: string }>;
  kafalaRecords?: Array<{ photo?: string }>;
  donations?: Array<{ receiptUrl?: string }>;
  kafalaDonations?: Array<{ receiptUrl?: string }>;
  allowedOrigins?: Set<string>;
}) {
  const referenced = new Set<string>();
  const storyOrigins = allowedOrigins ?? getConfiguredStorageOrigins();

  for (const project of projects) {
    if (isLikelyStorageId(project.mainImage)) referenced.add(project.mainImage);
    for (const image of project.gallery ?? []) {
      if (isLikelyStorageId(image)) referenced.add(image);
    }
  }

  for (const story of stories) {
    if (isLikelyStorageId(story.coverImage)) referenced.add(story.coverImage);
    for (const image of extractStorageIdsFromHtml(story.body, storyOrigins)) {
      referenced.add(image);
    }
  }

  for (const item of kafalaRecords) {
    if (isLikelyStorageId(item.photo)) referenced.add(item.photo);
  }

  for (const donation of donations) {
    if (isLikelyStorageId(donation.receiptUrl)) referenced.add(donation.receiptUrl);
  }

  for (const donation of kafalaDonations) {
    if (isLikelyStorageId(donation.receiptUrl)) referenced.add(donation.receiptUrl);
  }

  return referenced;
}

export async function isStorageIdReferenced(ctx: any, storageId: string) {
  if (!isLikelyStorageId(storageId)) return false;

  const [projects, stories, kafalaRecords, donations, kafalaDonations] = await Promise.all([
    ctx.db.query("projects").collect(),
    ctx.db.query("stories").collect(),
    ctx.db.query("kafala").collect(),
    ctx.db.query("donations").collect(),
    ctx.db.query("kafalaDonations").collect(),
  ]);

  const referenced = collectReferencedStorageIds({
    projects,
    stories,
    kafalaRecords,
    donations,
    kafalaDonations,
  });

  return referenced.has(storageId);
}
