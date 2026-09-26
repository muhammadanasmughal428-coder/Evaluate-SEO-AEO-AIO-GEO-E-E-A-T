import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import {
  users,
  websites,
  audits,
  urls,
  urlReports,
  findings,
  recommendations,
  chats,
  chatMessages,
  studentQuestions,
  studyNotes,
  studySessions,
  flashcards,
} from './src/db/schema.ts';
import { eq, desc, and, count, avg, sql } from 'drizzle-orm';
import { validateUrlSafety, crawlSingleUrl } from './src/services/crawler.ts';
import { analyzePage } from './src/services/analyzer.ts';
import { askAiAssistant, generateAuditRecommendations } from './src/services/ai.ts';
import { optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { removeDollarSigns, sanitizeDeep } from './src/utils/mathSanitizer.ts';
import { scienceSanitizerMiddleware } from './src/middleware/scienceSanitizer.ts';
import { PHYSICS_SI_UNITS, PHYSICAL_CONSTANTS } from './src/data/physicsSiUnits.ts';

dotenv.config();

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = cliPort || Number(process.env.PORT) || 3000;

// Body parsing with support for image uploads (base64)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static assets from public directory (favicons, manifests, images)
app.use(express.static('public'));

// Global error logger & SEO/Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Automatic science & educational data sanitization middleware
// Guarantees all student learning, physics, math, and formula routes have currency symbols (e.g. '$') stripped/sanitized
app.use('/api/student', scienceSanitizerMiddleware);

// ================= SEO & CRAWLABILITY ENDPOINTS =================

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain').send(`# AI Visibility Auditor Robots Policy
User-agent: *
Allow: /
Disallow: /api/

# AI Search Engine Crawlers Explicit Access
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: /sitemap.xml
`);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.get('host') || 'ais-pre-6xqf2hxecwbmk2a4523u5s-49583678533.asia-east1.run.app';
  const proto = req.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>2026-09-24</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#audit</loc>
    <lastmod>2026-09-24</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#student</loc>
    <lastmod>2026-09-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/#resources</loc>
    <lastmod>2026-09-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/#faq</loc>
    <lastmod>2026-09-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`);
});

// ================= API ROUTES =================

// 0. Live Health & Deployment Diagnostics endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const testResult = await db.execute(sql`SELECT 1 as alive`);
    if (testResult) {
      dbStatus = 'connected';
    }
  } catch (err: any) {
    dbStatus = `unreachable: ${err.message || 'connection error'}`;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    deploymentTarget: process.env.VERCEL ? 'vercel' : 'node-standalone',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    version: '1.0.0',
    platform: 'AI Search Optimization & Multi-Grade Learning Hub',
  });
});

// 1. URL Validation endpoint
app.post('/api/validate-url', (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const result = validateUrlSafety(url);
  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ valid: true, normalizedUrl: result.normalizedUrl });
});

// 2. Start Audit Job
app.post('/api/audit/start', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const safety = validateUrlSafety(url);
    if (!safety.valid || !safety.normalizedUrl) {
      return res.status(400).json({ error: safety.error || 'Invalid or forbidden URL' });
    }

    const targetUrl = safety.normalizedUrl;
    const parsed = new URL(targetUrl);
    const domain = parsed.hostname;
    const rootUrl = parsed.origin;

    const userId = req.dbUser ? req.dbUser.id : null;

    // Check or create website
    let websiteRecord = (
      await db.select().from(websites).where(eq(websites.domain, domain)).limit(1)
    )[0];

    if (!websiteRecord) {
      const insertedWebsites = await db
        .insert(websites)
        .values({
          userId,
          domain,
          rootUrl,
          title: domain,
          status: 'active',
        })
        .returning();
      websiteRecord = insertedWebsites[0];
    }

    // Create Audit record
    const insertedAudits = await db
      .insert(audits)
      .values({
        websiteId: websiteRecord.id,
        userId,
        targetUrl,
        status: 'crawling',
        totalUrls: 1,
        analyzedUrls: 0,
        failedUrls: 0,
      })
      .returning();
    const auditRecord = insertedAudits[0];

    // Crawl Root URL immediately to seed discovery
    let rootCrawled;
    try {
      rootCrawled = await crawlSingleUrl(targetUrl, rootUrl);
    } catch (crawlErr: any) {
      await db
        .update(audits)
        .set({
          status: 'failed',
          errorReason: crawlErr.message || 'Unable to connect to target website',
        })
        .where(eq(audits.id, auditRecord.id));

      return res.status(422).json({
        error: `Could not crawl root page: ${crawlErr.message || 'Connection refused or timed out'}`,
        auditId: auditRecord.id,
      });
    }

    // Insert root URL into urls table
    const insertedRootUrls = await db
      .insert(urls)
      .values({
        auditId: auditRecord.id,
        websiteId: websiteRecord.id,
        url: targetUrl,
        path: rootCrawled.path || '/',
        status: 'analyzing',
        statusCode: rootCrawled.statusCode,
        depth: 0,
      })
      .returning();
    const rootUrlRecord = insertedRootUrls[0];

    // Analyze root page
    const rootAnalysis = analyzePage(rootCrawled);

    // Save root URL Report
    const insertedRootReports = await db
      .insert(urlReports)
      .values({
        urlId: rootUrlRecord.id,
        auditId: auditRecord.id,
        url: targetUrl,
        title: rootAnalysis.title,
        overallScore: rootAnalysis.overallScore,
        seoScore: rootAnalysis.seoScore,
        aeoScore: rootAnalysis.aeoScore,
        aioScore: rootAnalysis.aioScore,
        geoScore: rootAnalysis.geoScore,
        eeatScore: rootAnalysis.eeatScore,
        metaData: JSON.stringify(rootAnalysis.metaData),
        headings: JSON.stringify(rootAnalysis.headings),
        structuredData: JSON.stringify(rootAnalysis.structuredData),
        performanceData: JSON.stringify(rootAnalysis.performanceData),
        aeoFindings: JSON.stringify(rootAnalysis.aeoFindings),
        aioFindings: JSON.stringify(rootAnalysis.aioFindings),
        geoFindings: JSON.stringify(rootAnalysis.geoFindings),
        eeatFindings: JSON.stringify(rootAnalysis.eeatFindings),
      })
      .returning();
    const rootReport = insertedRootReports[0];

    // Insert findings
    for (const f of rootAnalysis.findings) {
      await db.insert(findings).values({
        urlReportId: rootReport.id,
        auditId: auditRecord.id,
        category: f.category,
        severity: f.severity,
        title: f.title,
        description: f.description,
        evidence: f.evidence,
        recommendation: f.recommendation,
      });
    }

    // Mark root URL as completed
    await db
      .update(urls)
      .set({ status: 'completed' })
      .where(eq(urls.id, rootUrlRecord.id));

    // Queue discovered internal URLs
    // Deduplicate and filter high-value internal paths
    const discovered = Array.from(new Set(rootCrawled.discoveredUrls)).slice(0, 15);
    for (const discUrl of discovered) {
      try {
        const u = new URL(discUrl);
        await db.insert(urls).values({
          auditId: auditRecord.id,
          websiteId: websiteRecord.id,
          url: discUrl,
          path: u.pathname,
          status: 'pending',
          depth: 1,
        });
      } catch (_e) {
        // skip malformed
      }
    }

    const totalUrlsCount = 1 + discovered.length;
    await db
      .update(audits)
      .set({
        status: discovered.length > 0 ? 'analyzing' : 'completed',
        totalUrls: totalUrlsCount,
        analyzedUrls: 1,
        overallScore: rootAnalysis.overallScore,
        seoScore: rootAnalysis.seoScore,
        aeoScore: rootAnalysis.aeoScore,
        aioScore: rootAnalysis.aioScore,
        geoScore: rootAnalysis.geoScore,
        eeatScore: rootAnalysis.eeatScore,
        completedAt: discovered.length === 0 ? new Date() : null,
      })
      .where(eq(audits.id, auditRecord.id));

    // Update website
    await db
      .update(websites)
      .set({
        lastAuditAt: new Date(),
        title: rootCrawled.title || domain,
      })
      .where(eq(websites.id, websiteRecord.id));

    // Trigger AI Recommendations for root immediately if no other URLs
    if (discovered.length === 0) {
      generateAuditRecommendations({
        targetUrl,
        overallScore: rootAnalysis.overallScore,
        seoScore: rootAnalysis.seoScore,
        aeoScore: rootAnalysis.aeoScore,
        aioScore: rootAnalysis.aioScore,
        geoScore: rootAnalysis.geoScore,
        eeatScore: rootAnalysis.eeatScore,
        keyFindings: rootAnalysis.findings,
      }).then(async (recs) => {
        for (const r of recs) {
          await db.insert(recommendations).values({
            auditId: auditRecord.id,
            category: r.category,
            priority: r.priority,
            title: r.title,
            actionableSteps: r.actionableSteps,
            impact: r.impact,
          });
        }
      }).catch(console.error);
    }

    res.json({
      auditId: auditRecord.id,
      websiteId: websiteRecord.id,
      targetUrl,
      status: discovered.length > 0 ? 'analyzing' : 'completed',
      totalUrls: totalUrlsCount,
      analyzedUrls: 1,
      discoveredUrlsCount: discovered.length,
    });
  } catch (err: any) {
    console.error('Audit initialization error:', err);
    res.status(500).json({ error: err.message || 'Failed to start audit job' });
  }
});

// 3. Process Batch of queued URLs for an audit (Background/Vercel compatible chunk execution)
app.post('/api/audit/:id/process-batch', async (req: Request, res: Response) => {
  const auditId = parseInt(req.params.id, 10);
  if (isNaN(auditId)) {
    return res.status(400).json({ error: 'Invalid audit ID' });
  }

  try {
    const auditRecord = (
      await db.select().from(audits).where(eq(audits.id, auditId)).limit(1)
    )[0];
    if (!auditRecord) {
      return res.status(404).json({ error: 'Audit job not found' });
    }

    if (auditRecord.status === 'completed' || auditRecord.status === 'failed') {
      return res.json({
        status: auditRecord.status,
        analyzedUrls: auditRecord.analyzedUrls,
        totalUrls: auditRecord.totalUrls,
        isFinished: true,
      });
    }

    // Get up to 2 pending URLs to process in this request
    const pendingUrls = await db
      .select()
      .from(urls)
      .where(and(eq(urls.auditId, auditId), eq(urls.status, 'pending')))
      .limit(2);

    if (pendingUrls.length === 0) {
      // All pending URLs finished! Aggregate final scores & mark completed
      const allReports = await db
        .select()
        .from(urlReports)
        .where(eq(urlReports.auditId, auditId));

      if (allReports.length > 0) {
        const avgOverall = Math.round(
          allReports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / allReports.length
        );
        const avgSeo = Math.round(
          allReports.reduce((acc, r) => acc + (r.seoScore || 0), 0) / allReports.length
        );
        const avgAeo = Math.round(
          allReports.reduce((acc, r) => acc + (r.aeoScore || 0), 0) / allReports.length
        );
        const avgAio = Math.round(
          allReports.reduce((acc, r) => acc + (r.aioScore || 0), 0) / allReports.length
        );
        const avgGeo = Math.round(
          allReports.reduce((acc, r) => acc + (r.geoScore || 0), 0) / allReports.length
        );
        const avgEeat = Math.round(
          allReports.reduce((acc, r) => acc + (r.eeatScore || 0), 0) / allReports.length
        );

        await db
          .update(audits)
          .set({
            status: 'completed',
            overallScore: avgOverall,
            seoScore: avgSeo,
            aeoScore: avgAeo,
            aioScore: avgAio,
            geoScore: avgGeo,
            eeatScore: avgEeat,
            completedAt: new Date(),
          })
          .where(eq(audits.id, auditId));

        // Generate AI Recommendations
        const allFindings = await db
          .select()
          .from(findings)
          .where(eq(findings.auditId, auditId))
          .limit(20);

        generateAuditRecommendations({
          targetUrl: auditRecord.targetUrl,
          overallScore: avgOverall,
          seoScore: avgSeo,
          aeoScore: avgAeo,
          aioScore: avgAio,
          geoScore: avgGeo,
          eeatScore: avgEeat,
          keyFindings: allFindings.map((f) => ({
            category: f.category,
            severity: f.severity,
            title: f.title,
            description: f.description,
            evidence: f.evidence || '',
          })),
        }).then(async (recs) => {
          for (const r of recs) {
            await db.insert(recommendations).values({
              auditId: auditRecord.id,
              category: r.category,
              priority: r.priority,
              title: r.title,
              actionableSteps: r.actionableSteps,
              impact: r.impact,
            });
          }
        }).catch(console.error);
      }

      return res.json({
        status: 'completed',
        analyzedUrls: auditRecord.analyzedUrls,
        totalUrls: auditRecord.totalUrls,
        isFinished: true,
      });
    }

    // Process each URL in this batch
    for (const urlItem of pendingUrls) {
      await db
        .update(urls)
        .set({ status: 'analyzing' })
        .where(eq(urls.id, urlItem.id));

      try {
        const pageData = await crawlSingleUrl(urlItem.url, auditRecord.targetUrl);
        const analysis = analyzePage(pageData);

        const insertedReport = await db
          .insert(urlReports)
          .values({
            urlId: urlItem.id,
            auditId: auditRecord.id,
            url: urlItem.url,
            title: analysis.title,
            overallScore: analysis.overallScore,
            seoScore: analysis.seoScore,
            aeoScore: analysis.aeoScore,
            aioScore: analysis.aioScore,
            geoScore: analysis.geoScore,
            eeatScore: analysis.eeatScore,
            metaData: JSON.stringify(analysis.metaData),
            headings: JSON.stringify(analysis.headings),
            structuredData: JSON.stringify(analysis.structuredData),
            performanceData: JSON.stringify(analysis.performanceData),
            aeoFindings: JSON.stringify(analysis.aeoFindings),
            aioFindings: JSON.stringify(analysis.aioFindings),
            geoFindings: JSON.stringify(analysis.geoFindings),
            eeatFindings: JSON.stringify(analysis.eeatFindings),
          })
          .returning();

        for (const f of analysis.findings) {
          await db.insert(findings).values({
            urlReportId: insertedReport[0].id,
            auditId: auditRecord.id,
            category: f.category,
            severity: f.severity,
            title: f.title,
            description: f.description,
            evidence: f.evidence,
            recommendation: f.recommendation,
          });
        }

        await db
          .update(urls)
          .set({
            status: 'completed',
            statusCode: pageData.statusCode,
          })
          .where(eq(urls.id, urlItem.id));

        await db
          .update(audits)
          .set({
            analyzedUrls: (auditRecord.analyzedUrls || 0) + 1,
          })
          .where(eq(audits.id, auditId));
      } catch (err: any) {
        console.error(`Error processing URL ${urlItem.url}:`, err.message);
        await db
          .update(urls)
          .set({
            status: 'failed',
            errorReason: err.message || 'Crawl failed or timed out',
          })
          .where(eq(urls.id, urlItem.id));

        await db
          .update(audits)
          .set({
            failedUrls: (auditRecord.failedUrls || 0) + 1,
          })
          .where(eq(audits.id, auditId));
      }
    }

    const updatedAudit = (
      await db.select().from(audits).where(eq(audits.id, auditId)).limit(1)
    )[0];

    const remainingCount = (
      await db
        .select({ count: count() })
        .from(urls)
        .where(and(eq(urls.auditId, auditId), eq(urls.status, 'pending')))
    )[0]?.count || 0;

    res.json({
      status: remainingCount === 0 ? 'completed' : 'analyzing',
      analyzedUrls: updatedAudit.analyzedUrls,
      failedUrls: updatedAudit.failedUrls,
      totalUrls: updatedAudit.totalUrls,
      remainingCount,
      isFinished: remainingCount === 0,
    });
  } catch (err: any) {
    console.error('Batch processing error:', err);
    res.status(500).json({ error: err.message || 'Batch execution failure' });
  }
});

// 4. Get Audit Status & Summary Report
app.get('/api/audit/:id', async (req: Request, res: Response) => {
  const auditId = parseInt(req.params.id, 10);
  if (isNaN(auditId)) {
    return res.status(400).json({ error: 'Invalid audit ID' });
  }

  try {
    const auditRecord = (
      await db.select().from(audits).where(eq(audits.id, auditId)).limit(1)
    )[0];
    if (!auditRecord) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const recs = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.auditId, auditId));

    const allFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.auditId, auditId));

    res.json({
      ...auditRecord,
      recommendations: recs,
      findingsCount: allFindings.length,
      criticalFindingsCount: allFindings.filter((f) => f.severity === 'critical').length,
      warningFindingsCount: allFindings.filter((f) => f.severity === 'warning').length,
    });
  } catch (err: any) {
    console.error('Fetch audit error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch audit' });
  }
});

// 5. Get All Discovered URLs for an Audit
app.get('/api/audit/:id/urls', async (req: Request, res: Response) => {
  const auditId = parseInt(req.params.id, 10);
  if (isNaN(auditId)) {
    return res.status(400).json({ error: 'Invalid audit ID' });
  }

  try {
    const urlList = await db
      .select({
        id: urls.id,
        url: urls.url,
        path: urls.path,
        status: urls.status,
        statusCode: urls.statusCode,
        depth: urls.depth,
        errorReason: urls.errorReason,
        reportId: urlReports.id,
        title: urlReports.title,
        overallScore: urlReports.overallScore,
        seoScore: urlReports.seoScore,
        aeoScore: urlReports.aeoScore,
        aioScore: urlReports.aioScore,
        geoScore: urlReports.geoScore,
        eeatScore: urlReports.eeatScore,
      })
      .from(urls)
      .leftJoin(urlReports, eq(urls.id, urlReports.urlId))
      .where(eq(urls.auditId, auditId))
      .orderBy(urls.id);

    res.json(urlList);
  } catch (err: any) {
    console.error('Fetch audit URLs error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch URLs' });
  }
});

// 6. Get Complete Separate Report for an Individual URL
app.get('/api/audit/:id/urls/:urlId', async (req: Request, res: Response) => {
  const auditId = parseInt(req.params.id, 10);
  const urlId = parseInt(req.params.urlId, 10);
  if (isNaN(auditId) || isNaN(urlId)) {
    return res.status(400).json({ error: 'Invalid audit or url ID' });
  }

  try {
    const report = (
      await db
        .select()
        .from(urlReports)
        .where(and(eq(urlReports.auditId, auditId), eq(urlReports.urlId, urlId)))
        .limit(1)
    )[0];

    if (!report) {
      return res.status(404).json({ error: 'URL Report not found' });
    }

    const urlItem = (
      await db.select().from(urls).where(eq(urls.id, urlId)).limit(1)
    )[0];

    const reportFindings = await db
      .select()
      .from(findings)
      .where(eq(findings.urlReportId, report.id));

    res.json({
      ...report,
      path: urlItem?.path || '/',
      statusCode: urlItem?.statusCode,
      metaData: report.metaData ? JSON.parse(report.metaData) : {},
      headings: report.headings ? JSON.parse(report.headings) : {},
      structuredData: report.structuredData ? JSON.parse(report.structuredData) : [],
      performanceData: report.performanceData ? JSON.parse(report.performanceData) : {},
      aeoFindings: report.aeoFindings ? JSON.parse(report.aeoFindings) : {},
      aioFindings: report.aioFindings ? JSON.parse(report.aioFindings) : {},
      geoFindings: report.geoFindings ? JSON.parse(report.geoFindings) : {},
      eeatFindings: report.eeatFindings ? JSON.parse(report.eeatFindings) : {},
      findings: reportFindings,
    });
  } catch (err: any) {
    console.error('Fetch URL Report error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch URL Report' });
  }
});

// 7. Audit Export (CSV)
app.get('/api/audit/:id/export', async (req: Request, res: Response) => {
  const auditId = parseInt(req.params.id, 10);
  if (isNaN(auditId)) {
    return res.status(400).json({ error: 'Invalid audit ID' });
  }

  try {
    const auditRecord = (
      await db.select().from(audits).where(eq(audits.id, auditId)).limit(1)
    )[0];
    if (!auditRecord) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const reports = await db
      .select()
      .from(urlReports)
      .where(eq(urlReports.auditId, auditId));

    let csv = 'URL,Title,Overall Score,SEO Score,AEO Score,AIO Score,GEO Score,E-E-A-T Score\n';
    for (const r of reports) {
      const cleanTitle = (r.title || '').replace(/"/g, '""');
      csv += `"${r.url}","${cleanTitle}",${r.overallScore},${r.seoScore},${r.aeoScore},${r.aioScore},${r.geoScore},${r.eeatScore}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${auditId}-report.csv"`);
    res.send(csv);
  } catch (err: any) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export audit report' });
  }
});

// 8. Dashboard Statistics from real PostgreSQL tables
app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const totalWebsites = (await db.select({ count: count() }).from(websites))[0]?.count || 0;
    const totalAudits = (await db.select({ count: count() }).from(audits))[0]?.count || 0;
    const totalUrls = (await db.select({ count: count() }).from(urls))[0]?.count || 0;
    const completedAudits = (
      await db
        .select({ count: count() })
        .from(audits)
        .where(eq(audits.status, 'completed'))
    )[0]?.count || 0;

    const recentAudits = await db
      .select()
      .from(audits)
      .orderBy(desc(audits.createdAt))
      .limit(6);

    const averages = await db
      .select({
        avgOverall: avg(audits.overallScore),
        avgSeo: avg(audits.seoScore),
        avgAeo: avg(audits.aeoScore),
        avgAio: avg(audits.aioScore),
        avgGeo: avg(audits.geoScore),
        avgEeat: avg(audits.eeatScore),
      })
      .from(audits)
      .where(eq(audits.status, 'completed'));

    res.json({
      totalWebsites,
      totalAudits,
      totalUrls,
      completedAudits,
      recentAudits,
      averages: {
        overall: Math.round(Number(averages[0]?.avgOverall) || 0),
        seo: Math.round(Number(averages[0]?.avgSeo) || 0),
        aeo: Math.round(Number(averages[0]?.avgAeo) || 0),
        aio: Math.round(Number(averages[0]?.avgAio) || 0),
        geo: Math.round(Number(averages[0]?.avgGeo) || 0),
        eeat: Math.round(Number(averages[0]?.avgEeat) || 0),
      },
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

const FALLBACK_PROFESSIONAL_WEBSITES = [
  {
    id: 1,
    domain: 'www.google.com',
    rootUrl: 'https://www.google.com',
    title: 'Google Alphabet Inc.',
    category: 'Technology & AI',
    address: '1600 Amphitheatre Parkway, Mountain View, California 94043, United States',
    addressUrl: 'https://maps.google.com/?q=1600+Amphitheatre+Parkway,+Mountain+View,+CA',
    city: 'Mountain View',
    country: 'United States',
    phone: '+1 650-253-0000',
    description: 'Global technology leader in generative AI search, cloud infrastructure, and quantum computing.',
    isProfessional: true,
  },
  {
    id: 2,
    domain: 'www.systemsltd.com',
    rootUrl: 'https://www.systemsltd.com',
    title: 'Systems Limited (.com)',
    category: 'Technology & AI',
    address: 'E-5, Central Commercial Area, DHA Phase 1, Lahore, Punjab, Pakistan',
    addressUrl: 'https://maps.google.com/?q=Systems+Limited+Lahore+DHA+Phase+1',
    city: 'Lahore',
    country: 'Pakistan',
    phone: '+92 42 111 797 836',
    description: 'Pakistan premier globally listed IT enterprise, enterprise software consulting and digital transformation.',
    isProfessional: true,
  },
  {
    id: 3,
    domain: 'www.netsoltech.com',
    rootUrl: 'https://www.netsoltech.com',
    title: 'NetSol Technologies (.com)',
    category: 'Corporate & Business',
    address: 'NetSol IT Village (Main Ghazi Road, DHA), Lahore, Pakistan',
    addressUrl: 'https://maps.google.com/?q=NetSol+Technologies+Lahore+Ghazi+Road',
    city: 'Lahore',
    country: 'Pakistan',
    phone: '+92 42 111 44 88 00',
    description: 'Global enterprise asset finance & leasing software solutions company listed on NASDAQ.',
    isProfessional: true,
  },
  {
    id: 4,
    domain: 'www.zameen.com',
    rootUrl: 'https://www.zameen.com',
    title: 'Zameen.com (EMPG Group)',
    category: 'Technology & AI',
    address: 'Pearl One, 94-B/I, MM Alam Road, Gulberg III, Lahore, Pakistan',
    addressUrl: 'https://maps.google.com/?q=Pearl+One+MM+Alam+Road+Gulberg+III+Lahore',
    city: 'Lahore',
    country: 'Pakistan',
    phone: '+92 42 111 926 336',
    description: 'Pakistan #1 real estate marketplace and digital property portal.',
    isProfessional: true,
  },
  {
    id: 5,
    domain: 'www.pakwheels.com',
    rootUrl: 'https://www.pakwheels.com',
    title: 'PakWheels.com',
    category: 'Technology & AI',
    address: 'Commercial Area Sector Y DHA Phase 3, Lahore, Pakistan',
    addressUrl: 'https://maps.google.com/?q=PakWheels+Lahore+DHA+Phase+3',
    city: 'Lahore',
    country: 'Pakistan',
    phone: '+92 42 111 943 357',
    description: 'Pakistan largest automotive portal for buying, selling and community vehicle diagnostics.',
    isProfessional: true,
  },
  {
    id: 6,
    domain: 'www.10pearls.com',
    rootUrl: 'https://www.10pearls.com',
    title: '10Pearls Global (.com)',
    category: 'Technology & AI',
    address: 'Shahrah-e-Faisal, Block 6 PECHS, Karachi, Pakistan',
    addressUrl: 'https://maps.google.com/?q=10Pearls+Karachi+Shahrah-e-Faisal',
    city: 'Karachi',
    country: 'Pakistan',
    phone: '+92 21 3432 8840',
    description: 'Global software design and product development consultancy specializing in AI, enterprise digital transformation.',
    isProfessional: true,
  },
  {
    id: 7,
    domain: 'www.arbisoft.com',
    rootUrl: 'https://www.arbisoft.com',
    title: 'Arbisoft (.com)',
    category: 'Technology & AI',
    address: '25 Canal Bank Road, Westwood Colony, Lahore, Pakistan',
    addressUrl: 'https://maps.google.com/?q=Arbisoft+Canal+Bank+Road+Westwood+Colony+Lahore',
    city: 'Lahore',
    country: 'Pakistan',
    phone: '+92 42 3749 8591',
    description: 'High-end engineering and data science software company partner to edX, travel tech and healthcare.',
    isProfessional: true,
  },
  {
    id: 8,
    domain: 'www.apple.com',
    rootUrl: 'https://www.apple.com',
    title: 'Apple Inc. (.com)',
    category: 'Technology & AI',
    address: 'One Apple Park Way, Cupertino, CA 95014, United States',
    addressUrl: 'https://maps.google.com/?q=One+Apple+Park+Way,+Cupertino,+CA',
    city: 'Cupertino',
    country: 'United States',
    phone: '+1 408-996-1010',
    description: 'Global consumer technology innovator in silicon hardware, operating systems, and intelligent privacy software.',
    isProfessional: true,
  },
  {
    id: 9,
    domain: 'www.microsoft.com',
    rootUrl: 'https://www.microsoft.com',
    title: 'Microsoft Corporation (.com)',
    category: 'Technology & AI',
    address: 'One Microsoft Way, Redmond, WA 98052, United States',
    addressUrl: 'https://maps.google.com/?q=One+Microsoft+Way,+Redmond,+WA',
    city: 'Redmond',
    country: 'United States',
    phone: '+1 425-882-8080',
    description: 'Pioneering platform in enterprise cloud computing (Azure), developer tools, and Copilot AI systems.',
    isProfessional: true,
  },
  {
    id: 10,
    domain: 'www.openai.com',
    rootUrl: 'https://www.openai.com',
    title: 'OpenAI (.com)',
    category: 'Technology & AI',
    address: '3180 18th St, San Francisco, CA 94110, United States',
    addressUrl: 'https://maps.google.com/?q=3180+18th+St,+San+Francisco,+CA',
    city: 'San Francisco',
    country: 'United States',
    phone: '+1 415-843-0000',
    description: 'Artificial intelligence research and deployment company behind ChatGPT, GPT-4, and SearchGPT models.',
    isProfessional: true,
  },
];

// 9. Monitored Websites & Professional Directory List
app.get('/api/websites', async (_req: Request, res: Response) => {
  try {
    const siteList = await db
      .select()
      .from(websites)
      .orderBy(desc(websites.createdAt));

    if (siteList && siteList.length > 0) {
      return res.json(siteList);
    }
    return res.json(FALLBACK_PROFESSIONAL_WEBSITES);
  } catch (err: any) {
    console.warn('Database query failed for websites, serving resilient fallback:', err.message);
    res.json(FALLBACK_PROFESSIONAL_WEBSITES);
  }
});

// Create new Professional Website with Address Links
app.post('/api/websites', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      rootUrl,
      category,
      address,
      addressUrl,
      city,
      country,
      description,
      phone,
    } = req.body;

    if (!rootUrl) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    let cleanUrl = String(rootUrl).trim();
    const isHttpOnly = cleanUrl.startsWith('http://');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl).hostname;
    } catch (_err) {
      domain = cleanUrl.replace(/https?:\/\//, '').split('/')[0];
    }

    // Auto-append .com if user provided a bare name without TLD
    if (!domain.includes('.')) {
      domain = domain + '.com';
    }

    // Ensure www. prefix is included at start
    if (!domain.startsWith('www.') && !domain.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      domain = 'www.' + domain;
    }

    const protocol = isHttpOnly ? 'http://' : 'https://';
    cleanUrl = `${protocol}${domain}`;

    // Auto-generate Google Maps address link if address is provided without explicit map link
    let finalAddressUrl = addressUrl ? String(addressUrl).trim() : '';
    if (!finalAddressUrl && address && String(address).trim()) {
      finalAddressUrl = `https://maps.google.com/?q=${encodeURIComponent(String(address).trim())}`;
    }

    const userId = req.dbUser ? req.dbUser.id : null;

    const inserted = await db
      .insert(websites)
      .values({
        userId,
        domain,
        rootUrl: cleanUrl,
        title: title ? String(title).trim() : domain,
        category: category || 'Technology',
        address: address ? String(address).trim() : null,
        addressUrl: finalAddressUrl || null,
        city: city ? String(city).trim() : null,
        country: country ? String(country).trim() : null,
        description: description ? String(description).trim() : null,
        phone: phone ? String(phone).trim() : null,
        isProfessional: 1,
        status: 'active',
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Error creating website:', err);
    res.status(500).json({ error: err.message || 'Failed to add professional website' });
  }
});

// Update Professional Website / Address
app.put('/api/websites/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const websiteId = parseInt(req.params.id, 10);
  if (isNaN(websiteId)) {
    return res.status(400).json({ error: 'Invalid website ID' });
  }

  try {
    const {
      title,
      rootUrl,
      category,
      address,
      addressUrl,
      city,
      country,
      description,
      phone,
    } = req.body;

    let finalAddressUrl = addressUrl ? String(addressUrl).trim() : '';
    if (!finalAddressUrl && address && String(address).trim()) {
      finalAddressUrl = `https://maps.google.com/?q=${encodeURIComponent(String(address).trim())}`;
    }

    const updated = await db
      .update(websites)
      .set({
        title: title ? String(title).trim() : undefined,
        rootUrl: rootUrl ? String(rootUrl).trim() : undefined,
        category: category !== undefined ? category : undefined,
        address: address !== undefined ? address : undefined,
        addressUrl: finalAddressUrl || null,
        city: city !== undefined ? city : undefined,
        country: country !== undefined ? country : undefined,
        description: description !== undefined ? description : undefined,
        phone: phone !== undefined ? phone : undefined,
      })
      .where(eq(websites.id, websiteId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Error updating website:', err);
    res.status(500).json({ error: err.message || 'Failed to update website' });
  }
});

// Delete Website
app.delete('/api/websites/:id', optionalAuth, async (req: Request, res: Response) => {
  const websiteId = parseInt(req.params.id, 10);
  if (isNaN(websiteId)) {
    return res.status(400).json({ error: 'Invalid website ID' });
  }

  try {
    // Delete associated urls and audits if needed
    await db.delete(urls).where(eq(urls.websiteId, websiteId));
    await db.delete(audits).where(eq(audits.websiteId, websiteId));
    const deleted = await db.delete(websites).where(eq(websites.id, websiteId)).returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({ success: true, message: 'Website removed successfully' });
  } catch (err: any) {
    console.error('Error deleting website:', err);
    res.status(500).json({ error: err.message || 'Failed to delete website' });
  }
});

// 10. ChatGPT-Style Multilingual & Multimodal AI Assistant
app.post('/api/chat', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, chatId, imageUrl, language, persona } = req.body;
    if (!prompt && !imageUrl) {
      return res.status(400).json({ error: 'Message text or image is required' });
    }

    let activeChatId = chatId || 'guest-' + Date.now();
    const userId = req.dbUser ? req.dbUser.id : null;
    const cleanPrompt = prompt ? removeDollarSigns(prompt) : '';
    let historyItems: Array<{ role: 'user' | 'assistant' | 'system'; content: string; imageUrl?: string }> = [];

    try {
      if (!chatId) {
        const newTitle = cleanPrompt ? cleanPrompt.slice(0, 30) + '...' : 'Image Query';
        const createdChat = await db
          .insert(chats)
          .values({
            userId,
            title: newTitle,
          })
          .returning();
        activeChatId = createdChat[0].id;
      }

      // Save user message
      await db.insert(chatMessages).values({
        chatId: activeChatId,
        role: 'user',
        content: cleanPrompt || '[Uploaded Image]',
        language: language || 'auto',
        imageUrl: imageUrl || null,
      });

      // Fetch conversation history
      const pastMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, activeChatId))
        .orderBy(chatMessages.createdAt);

      historyItems = pastMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: removeDollarSigns(m.content),
        imageUrl: m.imageUrl || undefined,
      }));
    } catch (_dbWarn) {
      console.warn('DB chat persistence unavailable, continuing in stateless mode');
    }

    // Call Gemini API
    const aiResult = await askAiAssistant({
      prompt: cleanPrompt || 'Analyze this provided image in detail.',
      history: historyItems.slice(0, -1),
      imageUrl,
      language: language || 'auto',
      persona: persona || 'auto',
    });

    const cleanAssistantContent = removeDollarSigns(aiResult.text);

    let savedAssistantMsg: any = null;
    try {
      // Save assistant response
      const insertedAssistant = await db
        .insert(chatMessages)
        .values({
          chatId: activeChatId,
          role: 'assistant',
          content: cleanAssistantContent,
          language: aiResult.language,
        })
        .returning();
      savedAssistantMsg = insertedAssistant[0];

      // Touch chat updatedAt
      await db
        .update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, activeChatId));
    } catch (_dbErr) {
      savedAssistantMsg = {
        id: Date.now(),
        chatId: activeChatId,
        role: 'assistant',
        content: aiResult.text,
        language: aiResult.language,
        createdAt: new Date(),
      };
    }

    res.json({
      chatId: activeChatId,
      message: savedAssistantMsg,
      direction: aiResult.dir,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'AI Assistant could not respond' });
  }
});

// Chats management
app.get('/api/chats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userChats = await db
      .select()
      .from(chats)
      .orderBy(desc(chats.updatedAt))
      .limit(30);

    res.json(userChats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.post('/api/chats/new', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.dbUser ? req.dbUser.id : null;
    const created = await db
      .insert(chats)
      .values({
        userId,
        title: title || 'New Conversation',
      })
      .returning();

    res.json(created[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.patch('/api/chats/:id', async (req: Request, res: Response) => {
  const chatId = parseInt(req.params.id, 10);
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  try {
    const updated = await db
      .update(chats)
      .set({ title })
      .where(eq(chats.id, chatId))
      .returning();
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to rename chat' });
  }
});

app.delete('/api/chats/:id', async (req: Request, res: Response) => {
  const chatId = parseInt(req.params.id, 10);
  try {
    await db.delete(chatMessages).where(eq(chatMessages.chatId, chatId));
    await db.delete(chats).where(eq(chats.id, chatId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

app.get('/api/chats/:id/messages', async (req: Request, res: Response) => {
  const chatId = parseInt(req.params.id, 10);
  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.createdAt);

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 11. Student Learning & Math/Code Camera Solver with Multi-Level Academic Personas
app.post('/api/student/solve', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { questionText, imageUrl, subject, academicLevel, medium, language } = req.body;
    if (!questionText && !imageUrl) {
      return res.status(400).json({ error: 'Question or image is required' });
    }

    // Map academic level to pedagogical persona
    let persona = 'auto';
    if (academicLevel === 'matric') persona = 'secondary';
    else if (academicLevel === 'inter') persona = 'higher_secondary';
    else if (academicLevel === 'university') persona = 'university';
    else if (academicLevel === 'phd') persona = 'phd';

    const mediumNote = medium === 'urdu' 
      ? 'URDU MEDIUM: Explain thoroughly in clear academic Urdu (اردو میڈیم) with standard technical and scientific terms in parentheses.'
      : medium === 'english'
      ? 'ENGLISH MEDIUM: Provide formal English explanations with standard academic conventions and formulas.'
      : 'BILINGUAL: Provide explanations accessible in English and Urdu terminology.';

    const cleanQuestionText = questionText ? removeDollarSigns(questionText) : '';

    const prompt = `Student Question (${subject || 'General Academic Subject'} - Level: ${academicLevel || '9th-PhD'} - ${medium || 'English/Urdu'}):
${cleanQuestionText || 'Please solve and explain the contents of the attached photograph step-by-step according to curriculum and conceptual standards.'}

${mediumNote}

MANDATORY PEDAGOGICAL MAPPING INSTRUCTION:
Ensure your response is strictly mapped to the concept's core pedagogical principles:
1. Core Pedagogical Principle & Formal Anchor (بنیادی تصور اور جامع تعریف)
2. First-Principles Mechanistic Breakdown (بنیادی میکانزم اور علمی منطق)
3. Mathematical Formulation, Derivations & SI Units (ریاضیاتی مساوات، علامات اور ایس آئی یونٹس)
4. Tangible Real-World Archetype & Everyday Analogy (عملی مثال و طبعی ماڈل)
5. Common Misconception Alert & Board/Defense Tip (عام غلط فہمی اور امتحانی نکتہ)
6. Formative Conceptual Self-Check (فہم کی فوری جانچ)

CRITICAL RULE ON FORMULAS & SYMBOLS:
DO NOT use dollar signs ($ or $$) anywhere. Write all scientific formulas, equations, units, powers, and derivations directly using clean textbook Unicode characters (e.g. F = m · a, E = mc², v = u + at, kg·m/s², [M L T⁻²]). Never enclose math in dollar signs.`;

    const aiResult = await askAiAssistant({
      prompt,
      imageUrl,
      language: medium === 'urdu' ? 'ur' : (language || 'auto'),
      persona,
      systemContext: `Student Learning Session for ${subject || 'Curriculum Subject'}. Level: ${academicLevel || '9th to PhD'}. Medium: ${medium || 'English/Urdu'}. Strict concept-first pedagogical principles mandate. Strict prohibition of dollar signs ($).`,
    });

    const cleanSolution = removeDollarSigns(aiResult.text);
    const userId = req.dbUser ? req.dbUser.id : null;
    let recordedQuestion: any = null;

    try {
      const recorded = await db
        .insert(studentQuestions)
        .values({
          userId,
          subject: subject || 'General',
          questionText: cleanQuestionText || 'Image based problem',
          imageUrl: imageUrl ? imageUrl.slice(0, 200) : null,
          solution: cleanSolution,
          language: aiResult.language,
        })
        .returning();
      recordedQuestion = recorded[0];
    } catch (_dbErr) {
      recordedQuestion = {
        id: Date.now(),
        subject: subject || 'General',
        questionText: cleanQuestionText || 'Image based problem',
        solution: cleanSolution,
        createdAt: new Date(),
      };
    }

    res.json({
      question: recordedQuestion,
      solution: cleanSolution,
      language: aiResult.language,
      direction: aiResult.dir,
    });
  } catch (err: any) {
    console.error('Student solver error:', err);
    res.status(500).json({ error: err.message || 'Solver failed' });
  }
});

// Student Notes & Flashcards endpoints
app.get('/api/student/notes', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notes = await db.select().from(studyNotes).orderBy(desc(studyNotes.createdAt)).limit(20);
    const sanitizedNotes = notes.map((n) => ({
      ...n,
      title: removeDollarSigns(n.title),
      content: removeDollarSigns(n.content),
    }));
    res.json(sanitizedNotes);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load study notes' });
  }
});

app.post('/api/student/notes', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.dbUser ? req.dbUser.id : null;
    const cleanTitle = removeDollarSigns(title || 'Untitled Note');
    const cleanContent = removeDollarSigns(content || '');
    const cleanTags = removeDollarSigns(tags || 'General');

    const created = await db
      .insert(studyNotes)
      .values({
        userId,
        title: cleanTitle,
        content: cleanContent,
        tags: cleanTags,
      })
      .returning();
    res.json(created[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save note' });
  }
});

app.get('/api/student/flashcards', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const cards = await db.select().from(flashcards).orderBy(desc(flashcards.createdAt)).limit(30);
    const sanitizedCards = cards.map((c) => ({
      ...c,
      front: removeDollarSigns(c.front),
      back: removeDollarSigns(c.back),
    }));
    res.json(sanitizedCards);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load flashcards' });
  }
});

app.post('/api/student/flashcards', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { deckName, front, back } = req.body;
    const userId = req.dbUser ? req.dbUser.id : null;
    const cleanDeckName = removeDollarSigns(deckName || 'General');
    const cleanFront = removeDollarSigns(front || '');
    const cleanBack = removeDollarSigns(back || '');

    const created = await db
      .insert(flashcards)
      .values({
        userId,
        deckName: cleanDeckName,
        front: cleanFront,
        back: cleanBack,
        masteryLevel: 0,
      })
      .returning();
    res.json(created[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

// Physics SI Units & Physical Constants retrieved formulas endpoint
// Automatically sanitized by scienceSanitizerMiddleware
app.get('/api/student/si-units', optionalAuth, async (_req: Request, res: Response) => {
  try {
    // Return all SI units and constants - middleware automatically intercepts and ensures zero '$' or currency symbols
    res.json({
      units: PHYSICS_SI_UNITS,
      constants: PHYSICAL_CONSTANTS,
      count: PHYSICS_SI_UNITS.length + PHYSICAL_CONSTANTS.length,
      sanitized: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve SI units' });
  }
});

// Seed sample flashcards if empty
async function seedDefaultFlashcardsIfEmpty() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.SQL_HOST) {
    return;
  }
  try {
    const existing = await db.select({ count: count() }).from(flashcards);
    if ((existing[0]?.count || 0) === 0) {
      await db.insert(flashcards).values([
        {
          deckName: 'AI Visibility Essentials',
          front: 'What is AEO (Answer Engine Optimization)?',
          back: 'Optimizing content to be directly cited and used as featured answers by conversational engines like Perplexity, ChatGPT Search, Claude, and Copilot.',
          masteryLevel: 1,
        },
        {
          deckName: 'AI Visibility Essentials',
          front: 'How does AIO (AI Overview Optimization) differ from traditional SEO?',
          back: 'AIO focuses on high information density, clear semantic headings (<article>, <main>), verifiable statistics, and direct definitions that Google AI Overviews can synthesize without fluff.',
          masteryLevel: 1,
        },
        {
          deckName: 'AI Visibility Essentials',
          front: 'What does GEO (Generative Engine Optimization) evaluate?',
          back: 'How well brand and entity relationships are modeled in LLM knowledge graphs through Schema.org Organization/Product markup and authoritative external citations.',
          masteryLevel: 0,
        },
        {
          deckName: 'AI Visibility Essentials',
          front: 'What are the 4 pillars of E-E-A-T?',
          back: 'Experience (first-hand practice), Expertise (verified knowledge/author credentials), Authoritativeness (reputation and citations), Trustworthiness (security, transparency, policies).',
          masteryLevel: 2,
        },
      ]);
    }
  } catch (_e) {
    // Ignore if DB connection not ready yet
  }
}
seedDefaultFlashcardsIfEmpty();

// ================= VITE INTEGRATION & SERVER STARTUP =================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    // Explicit 404 for unhandled API calls
    app.all('/api/*', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
    // Single page application fallback
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Production Server] Listening on http://0.0.0.0:${PORT} (Node: ${process.version})`);
  });

  // Graceful shutdown handling for Docker, Cloud Run, and VPS
  const gracefulShutdown = (signal: string) => {
    console.log(`[Shutdown] Received ${signal}. Closing server gracefully...`);
    server.close(() => {
      console.log('[Shutdown] Server closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Only start standalone HTTP server if not running inside a serverless container (e.g. Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
export { app };
