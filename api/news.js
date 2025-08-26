import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Verny-Istochnik/1.0' }
});

const FEEDS = [
  'https://rssexport.rbc.ru/rbcnews/news/30/full.rss',
  'https://static.feed.rbc.ru/rbc/internal/rss.rbc.ru/rbc.ru/mainnews.rss'
];

function extractImageFromContent(html = '') {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m ? m[1] : null;
}

function normalize(item, feed) {
  return {
    id: String(item.guid || item.link || item.title || '').slice(0, 200),
    sourceTitle: feed?.title || 'РБК',
    title: item.title || '',
    link: item.link || '',
    isoDate: item.isoDate || item.pubDate || null,
    contentSnippet: item.contentSnippet || '',
    categories: Array.isArray(item.categories) ? item.categories : [],
    enclosureUrl: item.enclosure?.url || extractImageFromContent(item['content:encoded'] || item.content || '')
  };
}

export default async function handler(req, res) {
  try {
    const all = [];
    for (const url of FEEDS) {
      try {
        const feed = await parser.parseURL(url);
        const items = (feed.items || []).map(i => normalize(i, feed));
        all.push(...items);
      } catch (e) {
        console.error('RSS error for', url, e.message);
      }
    }
    const seen = new Set();
    const dedup = [];
    for (const it of all) {
      if (it.link && !seen.has(it.link)) {
        seen.add(it.link);
        dedup.push(it);
      }
    }
    dedup.sort((a, b) => (new Date(b.isoDate || 0)) - (new Date(a.isoDate || 0)));
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({ updatedAt: new Date().toISOString(), items: dedup.slice(0, 100) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
