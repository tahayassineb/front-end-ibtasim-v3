export function updatePageSeo({ title, description, canonicalPath, image, schema }) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title;
  setMeta('description', description || 'Association Espoir donation and kafala platform.');
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  if (image) setMeta('og:image', image, 'property');
  if (canonicalPath) {
    const href = `${window.location.origin}${canonicalPath}`;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
  }
  let script = document.getElementById('page-json-ld');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-json-ld';
    document.head.appendChild(script);
  }
  script.textContent = schema ? JSON.stringify(schema) : '';
}

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let meta = document.querySelector(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function publishingChecks({ title, description, image, slug, metaDescription, imageAlt }) {
  return [
    { key: 'title', label: 'العنوان مكتمل', passed: Boolean(title) },
    { key: 'description', label: 'الوصف مكتمل', passed: Boolean(description) },
    { key: 'image', label: 'الصورة موجودة', passed: Boolean(image) },
    { key: 'slug', label: 'الرابط جاهز', passed: Boolean(slug) },
    { key: 'meta', label: 'وصف SEO موجود', passed: Boolean(metaDescription) },
    { key: 'alt', label: 'وصف الصورة موجود', passed: Boolean(imageAlt) },
  ];
}

