import { CrawledPageData } from './crawler.ts';

export interface FindingItem {
  category: 'SEO' | 'AEO' | 'AIO' | 'GEO' | 'EEAT';
  severity: 'critical' | 'warning' | 'info' | 'good';
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
}

export interface AnalyzedUrlResult {
  url: string;
  title: string;
  overallScore: number;
  seoScore: number;
  aeoScore: number;
  aioScore: number;
  geoScore: number;
  eeatScore: number;
  findings: FindingItem[];
  metaData: Record<string, any>;
  headings: Record<string, any>;
  structuredData: any[];
  performanceData: {
    responseTimeMs: number;
    statusCode: number;
    wordCount: number;
  };
  aeoFindings: Record<string, any>;
  aioFindings: Record<string, any>;
  geoFindings: Record<string, any>;
  eeatFindings: Record<string, any>;
}

export function analyzePage(data: CrawledPageData): AnalyzedUrlResult {
  const findings: FindingItem[] = [];

  // ================= 1. SEO ANALYSIS =================
  let seoScore = 100;

  // Title tag check
  if (!data.title) {
    seoScore -= 25;
    findings.push({
      category: 'SEO',
      severity: 'critical',
      title: 'Missing Page Title Tag',
      description: 'The page has no <title> element, severely damaging search engine indexing.',
      evidence: 'No title tag found in <head>',
      recommendation: 'Add a descriptive <title> between 50 and 65 characters containing primary keywords.',
    });
  } else if (data.title.length < 25) {
    seoScore -= 8;
    findings.push({
      category: 'SEO',
      severity: 'warning',
      title: 'Short Page Title',
      description: `Title tag is only ${data.title.length} characters long. Search engines may not understand full intent.`,
      evidence: `Current title: "${data.title}"`,
      recommendation: 'Expand the title to 50-65 characters to include branding and context.',
    });
  } else if (data.title.length > 70) {
    seoScore -= 5;
    findings.push({
      category: 'SEO',
      severity: 'warning',
      title: 'Title Tag Truncation Risk',
      description: `Title tag is ${data.title.length} characters long and may be truncated on SERPs.`,
      evidence: `Current title: "${data.title}"`,
      recommendation: 'Keep titles under 65 characters to avoid truncation in Google search results.',
    });
  } else {
    findings.push({
      category: 'SEO',
      severity: 'good',
      title: 'Optimal Title Tag Length',
      description: 'The title tag length is within the recommended 50-65 character range.',
      evidence: `"${data.title}" (${data.title.length} chars)`,
      recommendation: 'Maintain this high-relevance title structure.',
    });
  }

  // Meta Description check
  if (!data.metaDescription) {
    seoScore -= 18;
    findings.push({
      category: 'SEO',
      severity: 'critical',
      title: 'Missing Meta Description',
      description: 'Search engines must generate snippet text dynamically without author guidance.',
      evidence: '<meta name="description"> tag is absent',
      recommendation: 'Craft a compelling 140-160 character meta description with a clear call-to-action.',
    });
  } else if (data.metaDescription.length < 70) {
    seoScore -= 6;
    findings.push({
      category: 'SEO',
      severity: 'warning',
      title: 'Short Meta Description',
      description: `Meta description is only ${data.metaDescription.length} characters.`,
      evidence: `Current description: "${data.metaDescription}"`,
      recommendation: 'Expand to 130-160 characters for maximum SERP click-through rate.',
    });
  } else {
    findings.push({
      category: 'SEO',
      severity: 'good',
      title: 'Meta Description Present',
      description: 'A dedicated meta description provides context to search crawlers.',
      evidence: `${data.metaDescription.slice(0, 80)}... (${data.metaDescription.length} chars)`,
      recommendation: 'Ensure it matches search intent and includes a persuasive call to action.',
    });
  }

  // H1 Check
  if (data.headings.h1.length === 0) {
    seoScore -= 15;
    findings.push({
      category: 'SEO',
      severity: 'critical',
      title: 'Missing H1 Heading',
      description: 'Page lacks an <h1> heading, which establishes the primary topic for crawlers.',
      evidence: '0 <h1> elements detected',
      recommendation: 'Add a single, authoritative <h1> heading describing the core topic.',
    });
  } else if (data.headings.h1.length > 1) {
    seoScore -= 6;
    findings.push({
      category: 'SEO',
      severity: 'warning',
      title: 'Multiple H1 Headings Detected',
      description: `Page has ${data.headings.h1.length} <h1> tags, which can dilute semantic focus.`,
      evidence: `Detected: ${data.headings.h1.map(h => `"${h}"`).slice(0, 3).join(', ')}`,
      recommendation: 'Reserve <h1> for the page title and use <h2> and <h3> for sub-sections.',
    });
  } else {
    findings.push({
      category: 'SEO',
      severity: 'good',
      title: 'Single H1 Heading Configured',
      description: 'The primary page heading is clearly defined with one <h1> tag.',
      evidence: `<h1>: "${data.headings.h1[0]}"`,
      recommendation: 'Align primary keywords naturally with this heading.',
    });
  }

  // Images Alt Check
  if (data.images.total > 0) {
    const missingRate = data.images.missingAlt / data.images.total;
    if (missingRate > 0.5) {
      seoScore -= 12;
      findings.push({
        category: 'SEO',
        severity: 'critical',
        title: 'High Ratio of Images Missing Alt Text',
        description: `${data.images.missingAlt} out of ${data.images.total} images (${Math.round(missingRate * 100)}%) are missing alt attributes, impairing accessibility and image search ranking.`,
        evidence: `Samples missing alt: ${data.images.sampleMissing.slice(0, 3).join(', ')}`,
        recommendation: 'Add concise, descriptive alt text to all informative images.',
      });
    } else if (data.images.missingAlt > 0) {
      seoScore -= 5;
      findings.push({
        category: 'SEO',
        severity: 'warning',
        title: 'Some Images Missing Alt Text',
        description: `${data.images.missingAlt} images lack alt attributes.`,
        evidence: `Sample: ${data.images.sampleMissing[0] || 'img without alt'}`,
        recommendation: 'Provide descriptive alt tags for all visual assets.',
      });
    } else {
      findings.push({
        category: 'SEO',
        severity: 'good',
        title: 'All Images Have Alt Attributes',
        description: `All ${data.images.total} images on this page have descriptive alt text.`,
        evidence: `${data.images.withAlt} / ${data.images.total} with alt tags`,
        recommendation: 'Keep maintaining descriptive alt tags for future imagery.',
      });
    }
  }

  // Canonical tag check
  if (!data.canonicalUrl) {
    seoScore -= 8;
    findings.push({
      category: 'SEO',
      severity: 'warning',
      title: 'Missing Canonical Tag',
      description: 'Without a canonical tag, search engines may index duplicate URL variations.',
      evidence: 'No <link rel="canonical"> tag found',
      recommendation: `Add <link rel="canonical" href="${data.url}" /> to protect link equity.`,
    });
  } else {
    findings.push({
      category: 'SEO',
      severity: 'good',
      title: 'Canonical Tag Implemented',
      description: 'The page specifies its canonical address to avoid duplicate content penalties.',
      evidence: `Canonical: ${data.canonicalUrl}`,
      recommendation: 'Verify canonical URL matches the production HTTPS domain exactly.',
    });
  }

  // Open Graph & Social Cards
  if (!data.ogTags['og:title'] || !data.ogTags['og:image']) {
    seoScore -= 6;
    findings.push({
      category: 'SEO',
      severity: 'info',
      title: 'Incomplete Open Graph Metadata',
      description: 'Missing og:title or og:image reduces visibility and CTR when shared across social platforms and messaging apps.',
      evidence: `og:title: ${data.ogTags['og:title'] ? 'Present' : 'Missing'}, og:image: ${data.ogTags['og:image'] ? 'Present' : 'Missing'}`,
      recommendation: 'Include og:title, og:description, and high-resolution og:image (1200x630px).',
    });
  }

  // ================= 2. AEO (Answer Engine Optimization) =================
  // Evaluates readiness for Perplexity, ChatGPT Search, Gemini, Claude, Copilot
  let aeoScore = 100;

  const hasFaqSchema = data.structuredData.some(item => {
    const type = item['@type'] || (Array.isArray(item['@graph']) && item['@graph'].map((g: any) => g['@type']));
    return String(type).includes('FAQPage') || String(type).includes('QAPage') || String(type).includes('HowTo');
  });

  if (!data.content.hasFaq && !hasFaqSchema) {
    aeoScore -= 22;
    findings.push({
      category: 'AEO',
      severity: 'critical',
      title: 'Lack of Direct Q&A / FAQ Structure',
      description: 'Answer engines prioritize pages with explicit questions followed immediately by direct factual answers.',
      evidence: 'No FAQ markup or recognizable Q&A structure detected',
      recommendation: 'Incorporate an FAQ section using clear Question headings (H2/H3) with concise 2-3 sentence answers.',
    });
  } else if (!hasFaqSchema && data.content.hasFaq) {
    aeoScore -= 10;
    findings.push({
      category: 'AEO',
      severity: 'warning',
      title: 'FAQ Content Present Without Schema.org Markup',
      description: 'FAQ questions were detected in text, but without structured Schema.org FAQPage JSON-LD.',
      evidence: 'HTML contains FAQ terms, but no FAQPage schema found',
      recommendation: 'Implement FAQPage structured data so AI search engines can ingest question-answer pairs seamlessly.',
    });
  } else {
    findings.push({
      category: 'AEO',
      severity: 'good',
      title: 'AEO-Ready FAQ Architecture',
      description: 'Structured Q&A format identified, ready for conversational search indexing.',
      evidence: 'FAQ schema or structure identified in page source',
      recommendation: 'Keep answers updated with authoritative, quantifiable figures.',
    });
  }

  // List elements (bullets / numbers) for extractability
  if (data.content.wordCount > 300 && data.headings.h2.length === 0) {
    aeoScore -= 15;
    findings.push({
      category: 'AEO',
      severity: 'warning',
      title: 'Low Subheading Granularity',
      description: 'Answer engines require semantic subheadings (H2) to segment content into discrete, bite-sized answers.',
      evidence: '0 <h2> headings in long content block',
      recommendation: 'Break content into distinct sub-topics with informative <h2> subheadings.',
    });
  }

  // Definitional sentences
  if (data.content.wordCount < 180) {
    aeoScore -= 20;
    findings.push({
      category: 'AEO',
      severity: 'warning',
      title: 'Thin Content for Answer Extraction',
      description: `Page has only ${data.content.wordCount} words, giving AI models minimal factual depth to cite.`,
      evidence: `Word count: ${data.content.wordCount}`,
      recommendation: 'Expand content with clear definitions, practical examples, and step-by-step guides.',
    });
  }

  // ================= 3. AIO (Google AI Overviews Optimization) =================
  let aioScore = 100;

  // Information density and semantic structuring
  if (!data.semantics.hasMain || !data.semantics.hasArticle) {
    aioScore -= 12;
    findings.push({
      category: 'AIO',
      severity: 'info',
      title: 'Limited Semantic HTML Landmarks',
      description: 'AI crawlers leverage <main> and <article> tags to discard navigation chrome and isolate core knowledge.',
      evidence: `<main>: ${data.semantics.hasMain ? 'Found' : 'Missing'}, <article>: ${data.semantics.hasArticle ? 'Found' : 'Missing'}`,
      recommendation: 'Wrap primary informational content in <main> and dedicated <article> or <section> elements.',
    });
  }

  // Headings hierarchy for AI synthesis
  if (data.headings.h2.length >= 2 && data.headings.h3.length >= 2) {
    findings.push({
      category: 'AIO',
      severity: 'good',
      title: 'Hierarchical Heading Architecture',
      description: 'Structured H2 and H3 hierarchies assist Google AI Overviews in multi-step topic synthesis.',
      evidence: `${data.headings.h2.length} H2s, ${data.headings.h3.length} H3s`,
      recommendation: 'Ensure each section opens with an executive summary sentence.',
    });
  } else if (data.headings.h2.length < 2) {
    aioScore -= 16;
    findings.push({
      category: 'AIO',
      severity: 'warning',
      title: 'Insufficient Topical Segmentation for AI Overviews',
      description: 'Google AI Overviews favors pages with distinct modular headings answering sub-intents.',
      evidence: `Only ${data.headings.h2.length} H2 headings detected`,
      recommendation: 'Add sub-headings addressing related questions ("How it works", "Key benefits", "Pricing breakdown").',
    });
  }

  // Data / tabular / citability check
  if (data.content.wordCount >= 400) {
    findings.push({
      category: 'AIO',
      severity: 'good',
      title: 'Sufficient Content Depth for Citation',
      description: 'Depth allows AI crawlers to extract citations, statistics, and verifiable claims.',
      evidence: `${data.content.wordCount} words analyzed`,
      recommendation: 'Embed bold statistics and source citations to increase AI citation probability.',
    });
  } else {
    aioScore -= 14;
    findings.push({
      category: 'AIO',
      severity: 'warning',
      title: 'Low Citability Density',
      description: 'Sparse informational density reduces the probability of being selected as an AI Overview source.',
      evidence: `${data.content.wordCount} words detected`,
      recommendation: 'Incorporate quantitative metrics, research data, and direct definitions.',
    });
  }

  // ================= 4. GEO (Generative Engine Optimization) =================
  let geoScore = 100;

  const hasEntitySchema = data.structuredData.some(item => {
    const type = String(item['@type'] || (Array.isArray(item['@graph']) && item['@graph'].map((g: any) => g['@type'])));
    return (
      type.includes('Organization') ||
      type.includes('Corporation') ||
      type.includes('LocalBusiness') ||
      type.includes('Product') ||
      type.includes('Article') ||
      type.includes('SoftwareApplication')
    );
  });

  if (!hasEntitySchema) {
    geoScore -= 24;
    findings.push({
      category: 'GEO',
      severity: 'critical',
      title: 'Missing Brand / Entity Schema.org Markup',
      description: 'Generative engines rely on knowledge graph schemas to link your brand, products, and services to named entities.',
      evidence: 'No Organization, LocalBusiness, Product, or SoftwareApplication schema found',
      recommendation: 'Implement Organization or Product JSON-LD schema with sameAs links to official social profiles.',
    });
  } else {
    findings.push({
      category: 'GEO',
      severity: 'good',
      title: 'Entity Schema Identified',
      description: 'Named entity markup helps LLMs connect domain context to global knowledge graphs.',
      evidence: 'Entity schema detected in JSON-LD',
      recommendation: 'Expand schema with sameAs properties referencing Wikipedia, Wikidata, and verified socials.',
    });
  }

  if (data.links.external.length === 0) {
    geoScore -= 12;
    findings.push({
      category: 'GEO',
      severity: 'warning',
      title: 'Absence of External Authority Citations',
      description: 'Generative AI models reward content that references reputable external sources and industry standards.',
      evidence: '0 external reference links found',
      recommendation: 'Cite authoritative industry sources, official specifications, or peer-reviewed research.',
    });
  } else {
    findings.push({
      category: 'GEO',
      severity: 'good',
      title: 'External Authoritative Citations Present',
      description: `The page connects to ${data.links.external.length} external sources.`,
      evidence: `${data.links.external.length} external links`,
      recommendation: 'Ensure all external citations point to secure, trustworthy domains.',
    });
  }

  // ================= 5. E-E-A-T ANALYSIS =================
  let eeatScore = 100;

  // Author byline & Person schema
  const hasPersonSchema = data.structuredData.some(item => {
    const type = String(item['@type'] || (Array.isArray(item['@graph']) && item['@graph'].map((g: any) => g['@type'])));
    return type.includes('Person') || type.includes('author');
  });

  if (!data.content.hasAuthor && !hasPersonSchema) {
    eeatScore -= 20;
    findings.push({
      category: 'EEAT',
      severity: 'critical',
      title: 'Missing Verifiable Author Attribution',
      description: 'Google Quality Rater Guidelines heavily weight verifiable author expertise and credentials.',
      evidence: 'No author byline or Person schema detected on page',
      recommendation: 'Add author name, bio, credentials, and link to an author profile page with Person schema.',
    });
  } else {
    findings.push({
      category: 'EEAT',
      severity: 'good',
      title: 'Author Attribution Identified',
      description: 'Author attribution signals human accountability and subject matter expertise.',
      evidence: 'Author marker / Person schema found',
      recommendation: 'Include links to author social profiles (LinkedIn, X, GitHub) and relevant credentials.',
    });
  }

  // Trust pages: Contact, About, Privacy, Terms
  const trustSignals = [
    { name: 'About Us / Team', present: data.links.hasAbout },
    { name: 'Contact / Support', present: data.links.hasContact },
    { name: 'Privacy Policy', present: data.links.hasPrivacy },
    { name: 'Terms of Service', present: data.links.hasTerms },
  ];

  const missingTrustSignals = trustSignals.filter(t => !t.present);
  if (missingTrustSignals.length > 2) {
    eeatScore -= 18;
    findings.push({
      category: 'EEAT',
      severity: 'warning',
      title: 'Missing Essential Trust Signals',
      description: `Missing prominent links to: ${missingTrustSignals.map(t => t.name).join(', ')}. This hurts site-wide Trustworthiness evaluation.`,
      evidence: `Missing: ${missingTrustSignals.map(t => t.name).join(', ')}`,
      recommendation: 'Place links to About Us, Contact, Privacy Policy, and Terms of Service in the footer across all pages.',
    });
  } else {
    findings.push({
      category: 'EEAT',
      severity: 'good',
      title: 'Core Trust Navigation Verified',
      description: 'Essential trust pages (About, Contact, Privacy, Terms) are linked.',
      evidence: `Found ${4 - missingTrustSignals.length} of 4 core trust links`,
      recommendation: 'Ensure company registration number, office address, and direct email are prominently stated.',
    });
  }

  // HTTPS security check
  if (!data.url.startsWith('https://')) {
    eeatScore -= 25;
    findings.push({
      category: 'EEAT',
      severity: 'critical',
      title: 'Insecure Connection (HTTP)',
      description: 'The page is served over unencrypted HTTP, severely compromising user trustworthiness.',
      evidence: `Protocol is http: (${data.url})`,
      recommendation: 'Migrate immediately to HTTPS with an active SSL/TLS certificate.',
    });
  }

  // Clamping scores between 0 and 100
  seoScore = Math.max(0, Math.min(100, Math.round(seoScore)));
  aeoScore = Math.max(0, Math.min(100, Math.round(aeoScore)));
  aioScore = Math.max(0, Math.min(100, Math.round(aioScore)));
  geoScore = Math.max(0, Math.min(100, Math.round(geoScore)));
  eeatScore = Math.max(0, Math.min(100, Math.round(eeatScore)));

  // Weighted Overall Visibility Score
  const overallScore = Math.round(
    seoScore * 0.30 +
    aeoScore * 0.20 +
    aioScore * 0.15 +
    geoScore * 0.15 +
    eeatScore * 0.20
  );

  return {
    url: data.url,
    title: data.title || 'Untitled Page',
    overallScore,
    seoScore,
    aeoScore,
    aioScore,
    geoScore,
    eeatScore,
    findings,
    metaData: {
      title: data.title,
      description: data.metaDescription,
      canonical: data.canonicalUrl,
      robots: data.robotsMeta,
      viewport: data.viewport,
      og: data.ogTags,
      twitter: data.twitterTags,
    },
    headings: data.headings,
    structuredData: data.structuredData,
    performanceData: {
      responseTimeMs: data.responseTimeMs,
      statusCode: data.statusCode,
      wordCount: data.content.wordCount,
    },
    aeoFindings: {
      hasFaq: data.content.hasFaq,
      hasFaqSchema,
      wordCount: data.content.wordCount,
      h2Count: data.headings.h2.length,
    },
    aioFindings: {
      hasMain: data.semantics.hasMain,
      hasArticle: data.semantics.hasArticle,
      headingHierarchy: data.headings.h1.length === 1 && data.headings.h2.length > 0,
      wordCount: data.content.wordCount,
    },
    geoFindings: {
      hasEntitySchema,
      externalLinksCount: data.links.external.length,
      entityTypes: data.structuredData.map(s => s['@type']).filter(Boolean),
    },
    eeatFindings: {
      hasAuthor: data.content.hasAuthor,
      hasPersonSchema,
      isHttps: data.url.startsWith('https://'),
      hasAbout: data.links.hasAbout,
      hasContact: data.links.hasContact,
      hasPrivacy: data.links.hasPrivacy,
      hasTerms: data.links.hasTerms,
    },
  };
}
