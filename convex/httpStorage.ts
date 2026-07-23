import { internal } from "./_generated/api";

export async function handleStorageRequest(ctx: any, request: Request) {
  const url = new URL(request.url);
  const storageId = decodeURIComponent(url.pathname.replace("/storage/", "").trim());

  if (!storageId) {
    return new Response("Missing storage ID", { status: 400 });
  }

  if (!(await ctx.runQuery(internal.storageAccess.isStorageReferenced, { storageId }))) {
    return new Response("File not found", { status: 404 });
  }

  const fileUrl = await ctx.storage.getUrl(storageId as any);
  if (!fileUrl) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: fileUrl,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
