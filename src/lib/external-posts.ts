import { XMLParser } from 'fast-xml-parser';
import { site } from '../site.config';

export type ExternalPost = {
  title: string;
  url: string;
  publishedAt: Date;
  updatedAt?: Date;
  source: 'Zenn' | 'Qiita';
};

const parser = new XMLParser({ ignoreAttributes: false });

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function validDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function validUrl(value: unknown, hostname: string): string | undefined {
  if (typeof value !== 'string') return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === hostname ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function fetchFeed(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return parser.parse(await response.text());
}

async function getZennPosts(): Promise<ExternalPost[]> {
  const feedUrl = `https://zenn.dev/${site.externalPosts.zenn}/feed`;
  const data = await fetchFeed(feedUrl) as {
    rss?: { channel?: { item?: Array<Record<string, unknown>> | Record<string, unknown> } };
  };

  return asArray(data.rss?.channel?.item).flatMap((item) => {
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const url = validUrl(item.link, 'zenn.dev');
    const publishedAt = validDate(item.pubDate);
    return title && url && publishedAt ? [{ title, url, publishedAt, source: 'Zenn' as const }] : [];
  });
}

async function getQiitaPosts(): Promise<ExternalPost[]> {
  const feedUrl = `https://qiita.com/${site.externalPosts.qiita}/feed`;
  const data = await fetchFeed(feedUrl) as {
    feed?: { entry?: Array<Record<string, unknown>> | Record<string, unknown> };
  };

  return asArray(data.feed?.entry).flatMap((entry) => {
    const links = asArray(entry.link as Record<string, unknown> | Array<Record<string, unknown>> | undefined);
    const alternate = links.find((link) => link['@_rel'] === 'alternate') ?? links[0];
    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    const url = validUrl(alternate?.['@_href'], 'qiita.com');
    const publishedAt = validDate(entry.published);
    const updatedAt = validDate(entry.updated);

    return title && url && publishedAt
      ? [{
          title,
          url,
          publishedAt,
          updatedAt: updatedAt?.valueOf() === publishedAt.valueOf() ? undefined : updatedAt,
          source: 'Qiita' as const,
        }]
      : [];
  });
}

export async function getExternalPosts(): Promise<ExternalPost[]> {
  const feeds = await Promise.all([
    getZennPosts().catch((error: unknown) => {
      console.warn(`Zennの記事を取得できませんでした: ${error instanceof Error ? error.message : error}`);
      return [];
    }),
    getQiitaPosts().catch((error: unknown) => {
      console.warn(`Qiitaの記事を取得できませんでした: ${error instanceof Error ? error.message : error}`);
      return [];
    }),
  ]);

  return feeds.flat();
}
