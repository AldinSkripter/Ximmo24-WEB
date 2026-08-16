/**
 * pages/sitemap.xml.js
 *
 * Dynamic XML Sitemap for eBroker - Next.js Pages Router.
 * Serves /sitemap.xml via getServerSideProps (SSR).
 *
 * AUTO-MANAGED by scripts/setup-sitemap.js
 *   - Written/restored when NEXT_PUBLIC_SEO=true  (SSR mode)
 *   - Deleted        when NEXT_PUBLIC_SEO=false (static mode)
 *
 * Branding flow:
 *   1. GET /api/web-settings  (apiEndpoints.WEB_SETTINGS)
 *      -> data.web_favicon   (site logo / favicon URL)
 *      -> data.system_color  (primary hex color)
 *   2. Values passed to generateSitemapXml() which injects them as XML PIs:
 *        <?web-favicon https://example.com/logo.png?>
 *        <?web-color   #0277fa?>
 *   3. public/sitemap.xsl reads those PIs to render correct branding in browsers.
 */

// ---------------------------------------------------------------------------
// Resolve the public-facing base URL at request time
// ---------------------------------------------------------------------------

const resolveBaseUrl = (req) => {
  if (process.env.NODE_ENV === 'development' && req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_WEB_URL || '';
};

// ---------------------------------------------------------------------------
// Minimal fallback sitemap (static routes only, no branding)
// ---------------------------------------------------------------------------

const FALLBACK_ROUTES = [
  '/',
  '/about-us',
  '/contact-us',
  '/faqs',
  '/properties',
  '/projects',
  '/subscription-plan',
  '/privacy-policy',
  '/terms-and-conditions',
];

const buildFallbackSitemap = (baseUrl) => {
  const safeBase = (baseUrl || process.env.NEXT_PUBLIC_WEB_URL || '').replace(/\/$/, '');
  const urlEntries = FALLBACK_ROUTES.map((route) => {
    const urlPath = route === '/' ? '' : route;
    return [
      '  <url>',
      `    <loc>${safeBase}${urlPath}</loc>`,
      `    <lastmod>${new Date().toISOString()}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.7</priority>',
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    '</urlset>',
  ].join('\n');
};

// ---------------------------------------------------------------------------
// getServerSideProps
// ---------------------------------------------------------------------------

export const getServerSideProps = async ({ req, res }) => {
  const baseUrl = resolveBaseUrl(req);

  try {
    // Load sitemap-generator.js (CommonJS) via require so it works
    // in the Next.js server runtime without transpilation issues.
    const { generateSitemapXml, fetchSettings } = require('../scripts/sitemap-generator');

    // 1. Fetch web-settings for branding
    const { webFavicon, webColor, defaultLangCode, languages } = await fetchSettings();

    // 2. Generate the full sitemap XML
    const sitemapXml = await generateSitemapXml({
      webFavicon,
      webColor,
      defaultLangCode,
      languages,
    });

    // 3. Send response
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    res.end(sitemapXml);

    return { props: {} };
  } catch (error) {
    console.error('[sitemap.xml] Failed to generate sitemap:', error);

    const fallbackXml = buildFallbackSitemap(baseUrl);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=3600'
    );
    res.end(fallbackXml);

    return { props: { fallback: true } };
  }
};

// ---------------------------------------------------------------------------
// Default export — required by Next.js; this route only ever responds
// via getServerSideProps (res.end) so the component is never rendered.
// ---------------------------------------------------------------------------
const SitemapPage = () => null;
export default SitemapPage;
