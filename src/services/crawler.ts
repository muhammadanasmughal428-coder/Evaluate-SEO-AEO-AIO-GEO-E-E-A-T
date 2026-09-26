import * as cheerio from 'cheerio';

export interface CrawledPageData {
  url: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsMeta: string;
  viewport: string;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  structuredData: any[];
  images: {
    total: number;
    withAlt: number;
    missingAlt: number;
    sampleMissing: string[];
  };
  links: {
    internal: string[];
    external: string[];
    hasContact: boolean;
    hasAbout: boolean;
    hasPrivacy: boolean;
    hasTerms: boolean;
  };
  semantics: {
    hasMain: boolean;
    hasHeader: boolean;
    hasNav: boolean;
    hasFooter: boolean;
    hasArticle: boolean;
  };
  content: {
    wordCount: number;
    textSample: string;
    hasFaq: boolean;
    hasAuthor: boolean;
  };
  discoveredUrls: string[];
}

// SSRF Protection: Deny local, private, and internal addresses
export function validateUrlSafety(inputUrl: string): { valid: boolean; normalizedUrl?: string; error?: string } {
  try {
    let clean = (inputUrl || '').trim();
    if (!clean) {
      return { valid: false, error: 'URL cannot be empty.' };
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    const parsed = new URL(clean);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http and https protocols are supported.' };
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host === '169.254.169.254' ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return { valid: false, error: 'Private or local IP addresses are blocked for security (SSRF protection).' };
    }

    // Ensure trailing slash or clean normalization
    return { valid: true, normalizedUrl: parsed.origin + parsed.pathname + parsed.search };
  } catch (err: any) {
    return { valid: false, error: 'Invalid URL format: ' + (err.message || 'Malformed') };
  }
}

const STATIC_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.pdf', '.zip', '.tar', '.gz', '.mp3', '.mp4', '.avi', '.mov',
  '.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.xml'
]);

export async function crawlSingleUrl(targetUrl: string, baseUrl: string): Promise<CrawledPageData> {
  const startTime = Date.now();
  const baseHostname = new URL(baseUrl).hostname;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIVisibilityAuditor/1.0; +https://aivisibilityauditor.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;
    const html = await response.text();

    const $ = cheerio.load(html);
    const parsedTarget = new URL(targetUrl);

    // Meta & Title
    const title = $('title').first().text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || '';
    const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || '';
    const viewport = $('meta[name="viewport"]').attr('content')?.trim() || '';

    // OpenGraph
    const ogTags: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const prop = $(el).attr('property');
      const content = $(el).attr('content');
      if (prop && content) ogTags[prop] = content;
    });

    // Twitter
    const twitterTags: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) twitterTags[name] = content;
    });

    // Headings
    const h1: string[] = [];
    const h2: string[] = [];
    const h3: string[] = [];
    $('h1').each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ');
      if (t) h1.push(t);
    });
    $('h2').each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ');
      if (t) h2.push(t);
    });
    $('h3').each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, ' ');
      if (t) h3.push(t);
    });

    // Structured Data (JSON-LD)
    const structuredData: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html();
        if (raw) {
          const parsed = JSON.parse(raw);
          structuredData.push(parsed);
        }
      } catch (_e) {
        // Skip invalid JSON-LD
      }
    });

    // Images
    let totalImages = 0;
    let imagesWithAlt = 0;
    const sampleMissingAlt: string[] = [];
    $('img').each((_, el) => {
      totalImages++;
      const alt = $(el).attr('alt');
      const src = $(el).attr('src') || $(el).attr('data-src') || 'image';
      if (alt && alt.trim().length > 0) {
        imagesWithAlt++;
      } else {
        if (sampleMissingAlt.length < 5) {
          sampleMissingAlt.push(src);
        }
      }
    });

    // Links & Discovery
    const internalLinksSet = new Set<string>();
    const externalLinksSet = new Set<string>();
    const discoveredUrlsSet = new Set<string>();

    let hasContact = false;
    let hasAbout = false;
    let hasPrivacy = false;
    let hasTerms = false;

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      try {
        const resolved = new URL(href, targetUrl);
        const resolvedHostname = resolved.hostname;
        const pathname = resolved.pathname.toLowerCase();

        // Check for extension
        const hasExtension = Array.from(STATIC_EXTENSIONS).some(ext => pathname.endsWith(ext));
        if (hasExtension) return;

        // Check key page markers
        if (pathname.includes('contact') || pathname.includes('support')) hasContact = true;
        if (pathname.includes('about') || pathname.includes('team') || pathname.includes('who-we-are')) hasAbout = true;
        if (pathname.includes('privacy')) hasPrivacy = true;
        if (pathname.includes('terms') || pathname.includes('tos')) hasTerms = true;

        if (resolvedHostname === baseHostname) {
          const cleanUrl = resolved.origin + resolved.pathname;
          internalLinksSet.add(cleanUrl);
          if (cleanUrl !== targetUrl) {
            discoveredUrlsSet.add(cleanUrl);
          }
        } else {
          externalLinksSet.add(resolved.origin + resolved.pathname);
        }
      } catch (_err) {
        // Ignore unparseable link
      }
    });

    // Semantics
    const hasMain = $('main').length > 0;
    const hasHeader = $('header').length > 0;
    const hasNav = $('nav').length > 0;
    const hasFooter = $('footer').length > 0;
    const hasArticle = $('article').length > 0;

    // Body text & FAQ/Author markers
    $('script, style, noscript, svg, nav, footer').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    const textSample = bodyText.slice(0, 1000);

    const hasFaq =
      $('details').length > 0 ||
      $('.faq, #faq, [class*="faq"], [id*="faq"]').length > 0 ||
      html.toLowerCase().includes('frequently asked questions') ||
      structuredData.some(item => {
        const type = item['@type'] || (Array.isArray(item['@graph']) && item['@graph'].map((g: any) => g['@type']));
        return String(type).includes('FAQPage') || String(type).includes('QAPage');
      });

    const hasAuthor =
      $('[rel="author"], .author, [class*="author"], [itemprop="author"]').length > 0 ||
      structuredData.some(item => {
        const type = item['@type'] || (Array.isArray(item['@graph']) && item['@graph'].map((g: any) => g['@type']));
        return String(type).includes('Person') || String(type).includes('author');
      });

    return {
      url: targetUrl,
      path: parsedTarget.pathname || '/',
      statusCode,
      responseTimeMs,
      title,
      metaDescription,
      canonicalUrl,
      robotsMeta,
      viewport,
      ogTags,
      twitterTags,
      headings: { h1, h2, h3 },
      structuredData,
      images: {
        total: totalImages,
        withAlt: imagesWithAlt,
        missingAlt: totalImages - imagesWithAlt,
        sampleMissing: sampleMissingAlt,
      },
      links: {
        internal: Array.from(internalLinksSet),
        external: Array.from(externalLinksSet),
        hasContact,
        hasAbout,
        hasPrivacy,
        hasTerms,
      },
      semantics: {
        hasMain,
        hasHeader,
        hasNav,
        hasFooter,
        hasArticle,
      },
      content: {
        wordCount,
        textSample,
        hasFaq,
        hasAuthor,
      },
      discoveredUrls: Array.from(discoveredUrlsSet),
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw new Error(`Failed to crawl ${targetUrl}: ${error.message || 'Network timeout or unreachable'}`);
  }
}
