import { getCollection } from 'astro:content';
import { site } from '../site.config';

const encode = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const paths = ['/', '/about/', ...posts.map((p) => `/blog/${p.id}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${encode(new URL(path, site.url).toString())}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
