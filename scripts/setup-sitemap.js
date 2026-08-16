'use strict';

/**
 * scripts/setup-sitemap.js
 *
 * Sitemap Setup Script
 *
 * Resolves the Next.js conflict between a static `public/sitemap.xml` and a
 * dynamic `pages/sitemap.xml.js` page — both cannot coexist at build time.
 *
 * Behaviour controlled by NEXT_PUBLIC_SEO:
 *
 *   true  -> SSR mode:
 *            - Deletes public/sitemap.xml  (if present)
 *            - Restores pages/sitemap.xml.js from template (if deleted)
 *            - Sitemap is served dynamically via getServerSideProps
 *
 *   false -> Static mode:
 *            - Deletes pages/sitemap.xml.js  (if present)
 *            - Runs sitemap-generator.js to write public/sitemap.xml
 *            - Sitemap is served as a plain static file
 *
 * Usage:
 *   node scripts/setup-sitemap.js
 *
 * In package.json:
 *   "build":  "node scripts/setup-sitemap.js && next build"
 *   "export": "node scripts/setup-sitemap.js && next build"
 */

const fs = require('fs');
const path = require('path');

// Load .env / .env.local before reading env vars
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  // dotenv not available — env vars already provided by the runtime
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.join(__dirname, '..');
const PUBLIC_SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const PAGES_SITEMAP = path.join(ROOT, 'pages', 'sitemap.xml.js');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SEO_ENABLED = process.env.NEXT_PUBLIC_SEO === 'true';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function removeIfExists(filePath, label) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('🗑️  Removed ' + label);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// pages/sitemap.xml.js template
//
// Stored as a plain concatenated string (no template literals) so that the
// embedded backticks and ${...} expressions are treated as literal text and
// written verbatim into the target file.
// ---------------------------------------------------------------------------

function buildSitemapPageContent() {
  // Using string concatenation keeps all ${} and ` characters literal —
  // they are NOT evaluated here; they become the source code of the restored file.
  var BT = '`';   // backtick
  var DS = '$';   // dollar sign

  return (
    '/**\n' +
    ' * pages/sitemap.xml.js\n' +
    ' *\n' +
    ' * Dynamic XML Sitemap for eBroker - Next.js Pages Router.\n' +
    ' * Serves /sitemap.xml via getServerSideProps (SSR).\n' +
    ' *\n' +
    ' * AUTO-MANAGED by scripts/setup-sitemap.js\n' +
    ' *   - Written/restored when NEXT_PUBLIC_SEO=true  (SSR mode)\n' +
    ' *   - Deleted        when NEXT_PUBLIC_SEO=false (static mode)\n' +
    ' *\n' +
    ' * Branding flow:\n' +
    ' *   1. GET /api/web-settings  (apiEndpoints.WEB_SETTINGS)\n' +
    ' *      -> data.web_favicon   (site logo / favicon URL)\n' +
    ' *      -> data.system_color  (primary hex color)\n' +
    ' *   2. Values passed to generateSitemapXml() which injects them as XML PIs:\n' +
    ' *        <?web-favicon https://example.com/logo.png?>\n' +
    ' *        <?web-color   #0277fa?>\n' +
    ' *   3. public/sitemap.xsl reads those PIs to render correct branding in browsers.\n' +
    ' */\n' +
    '\n' +
    '// ---------------------------------------------------------------------------\n' +
    '// Resolve the public-facing base URL at request time\n' +
    '// ---------------------------------------------------------------------------\n' +
    '\n' +
    'const resolveBaseUrl = (req) => {\n' +
    '  if (process.env.NODE_ENV === \'development\' && req) {\n' +
    '    const protocol = req.headers[\'x-forwarded-proto\'] || \'http\';\n' +
    '    const host = req.headers.host || \'localhost:3000\';\n' +
    '    return ' + BT + DS + '{protocol}://' + DS + '{host}' + BT + ';\n' +
    '  }\n' +
    '  return process.env.NEXT_PUBLIC_WEB_URL || \'\';\n' +
    '};\n' +
    '\n' +
    '// ---------------------------------------------------------------------------\n' +
    '// Minimal fallback sitemap (static routes only, no branding)\n' +
    '// ---------------------------------------------------------------------------\n' +
    '\n' +
    'const FALLBACK_ROUTES = [\n' +
    '  \'/\',\n' +
    '  \'/about-us\',\n' +
    '  \'/contact-us\',\n' +
    '  \'/faqs\',\n' +
    '  \'/properties\',\n' +
    '  \'/projects\',\n' +
    '  \'/subscription-plan\',\n' +
    '  \'/privacy-policy\',\n' +
    '  \'/terms-and-conditions\',\n' +
    '];\n' +
    '\n' +
    'const buildFallbackSitemap = (baseUrl) => {\n' +
    '  const safeBase = (baseUrl || process.env.NEXT_PUBLIC_WEB_URL || \'\').replace(/\\/$/, \'\');\n' +
    '  const urlEntries = FALLBACK_ROUTES.map((route) => {\n' +
    '    const urlPath = route === \'/\' ? \'\' : route;\n' +
    '    return [\n' +
    '      \'  <url>\',\n' +
    '      ' + BT + '    <loc>' + DS + '{safeBase}' + DS + '{urlPath}</loc>' + BT + ',\n' +
    '      ' + BT + '    <lastmod>' + DS + '{new Date().toISOString()}</lastmod>' + BT + ',\n' +
    '      \'    <changefreq>weekly</changefreq>\',\n' +
    '      \'    <priority>0.7</priority>\',\n' +
    '      \'  </url>\',\n' +
    '    ].join(\'\\n\');\n' +
    '  });\n' +
    '\n' +
    '  return [\n' +
    '    \'<?xml version="1.0" encoding="UTF-8"?>\',\n' +
    '    \'<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\',\n' +
    '    \'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\',\n' +
    '    ...urlEntries,\n' +
    '    \'</urlset>\',\n' +
    '  ].join(\'\\n\');\n' +
    '};\n' +
    '\n' +
    '// ---------------------------------------------------------------------------\n' +
    '// getServerSideProps\n' +
    '// ---------------------------------------------------------------------------\n' +
    '\n' +
    'export const getServerSideProps = async ({ req, res }) => {\n' +
    '  const baseUrl = resolveBaseUrl(req);\n' +
    '\n' +
    '  try {\n' +
    '    // Load sitemap-generator.js (CommonJS) via require so it works\n' +
    '    // in the Next.js server runtime without transpilation issues.\n' +
    '    const { generateSitemapXml, fetchSettings } = require(\'../scripts/sitemap-generator\');\n' +
    '\n' +
    '    // 1. Fetch web-settings for branding\n' +
    '    const { webFavicon, webColor, defaultLangCode, languages } = await fetchSettings();\n' +
    '\n' +
    '    // 2. Generate the full sitemap XML\n' +
    '    const sitemapXml = await generateSitemapXml({\n' +
    '      webFavicon,\n' +
    '      webColor,\n' +
    '      defaultLangCode,\n' +
    '      languages,\n' +
    '    });\n' +
    '\n' +
    '    // 3. Send response\n' +
    '    res.statusCode = 200;\n' +
    '    res.setHeader(\'Content-Type\', \'application/xml; charset=utf-8\');\n' +
    '    res.setHeader(\n' +
    '      \'Cache-Control\',\n' +
    '      \'public, s-maxage=3600, stale-while-revalidate=86400\'\n' +
    '    );\n' +
    '    res.end(sitemapXml);\n' +
    '\n' +
    '    return { props: {} };\n' +
    '  } catch (error) {\n' +
    '    console.error(\'[sitemap.xml] Failed to generate sitemap:\', error);\n' +
    '\n' +
    '    const fallbackXml = buildFallbackSitemap(baseUrl);\n' +
    '    res.statusCode = 200;\n' +
    '    res.setHeader(\'Content-Type\', \'application/xml; charset=utf-8\');\n' +
    '    res.setHeader(\n' +
    '      \'Cache-Control\',\n' +
    '      \'public, s-maxage=600, stale-while-revalidate=3600\'\n' +
    '    );\n' +
    '    res.end(fallbackXml);\n' +
    '\n' +
    '    return { props: { fallback: true } };\n' +
    '  }\n' +
    '};\n' +
    '\n' +
    '// ---------------------------------------------------------------------------\n' +
    '// Default export — required by Next.js; this route only ever responds\n' +
    '// via getServerSideProps (res.end) so the component is never rendered.\n' +
    '// ---------------------------------------------------------------------------\n' +
    'const SitemapPage = () => null;\n' +
    'export default SitemapPage;\n'
  );
}

// ---------------------------------------------------------------------------
// Mode: SSR  (NEXT_PUBLIC_SEO=true)
//
// Ensure public/sitemap.xml is gone (it conflicts with the page route) and
// that pages/sitemap.xml.js exists — auto-restoring from the embedded
// template when it was deleted by a prior static build.
// ---------------------------------------------------------------------------

function setupServerSideSitemap() {
  console.log('\n🔧 SSR mode (NEXT_PUBLIC_SEO=true)');
  console.log('   Sitemap will be served dynamically via pages/sitemap.xml.js\n');

  // Remove static file — it conflicts with the page route at build time
  var removed = removeIfExists(PUBLIC_SITEMAP, 'public/sitemap.xml  <- conflicts with pages/sitemap.xml.js');
  if (!removed) {
    console.log('✔  public/sitemap.xml not present — no conflict to resolve');
  }

  // Restore pages/sitemap.xml.js from the embedded template if it was
  // deleted by a prior static-mode build (NEXT_PUBLIC_SEO=false run).
  if (!fs.existsSync(PAGES_SITEMAP)) {
    fs.writeFileSync(PAGES_SITEMAP, buildSitemapPageContent(), 'utf-8');
    console.log('♻️  Restored pages/sitemap.xml.js from built-in template');
  } else {
    console.log('✔  pages/sitemap.xml.js already present');
  }

  console.log('✅ Dynamic sitemap ready — visit /sitemap.xml at runtime\n');
}

// ---------------------------------------------------------------------------
// Mode: Static  (NEXT_PUBLIC_SEO=false)
//
// Generate public/sitemap.xml via sitemap-generator.js and remove the page
// route so Next.js does not see the conflict.
// ---------------------------------------------------------------------------

async function generateStaticSitemap() {
  console.log('\n🚀 Static mode (NEXT_PUBLIC_SEO=false)');
  console.log('   Sitemap will be served as a static file from public/sitemap.xml\n');

  // Remove SSR page — it conflicts with public/sitemap.xml at build time
  removeIfExists(PAGES_SITEMAP, 'pages/sitemap.xml.js  <- conflicts with public/sitemap.xml');

  // Run the generator
  console.log('Running sitemap-generator.js...\n');
  var generator = require('./sitemap-generator');
  var generateSitemapXml = generator.generateSitemapXml;
  var fetchSettings = generator.fetchSettings;

  var BASE_URL = process.env.NEXT_PUBLIC_WEB_URL;
  if (!BASE_URL) {
    console.warn('⚠️  WARNING: NEXT_PUBLIC_WEB_URL is not set — sitemap URLs may be incorrect');
  }

  console.log('Fetching website settings...');
  var settings = await fetchSettings();
  var webFavicon = settings.webFavicon;
  var webColor = settings.webColor;
  var defaultLangCode = settings.defaultLangCode;
  var languages = settings.languages;

  console.log('✓ Default language : ' + defaultLangCode);
  console.log('✓ Languages        : ' + (languages.map(function (l) { return l.code; }).join(', ') || 'none'));
  if (webFavicon) console.log('✓ Favicon          : ' + webFavicon);
  if (webColor) console.log('✓ Theme color      : ' + webColor);
  console.log('');

  var xml = await generateSitemapXml({ webFavicon: webFavicon, webColor: webColor, defaultLangCode: defaultLangCode, languages: languages });

  if (!fs.existsSync(path.join(ROOT, 'public'))) {
    fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });
  }

  fs.writeFileSync(PUBLIC_SITEMAP, xml, 'utf-8');

  var stats = fs.statSync(PUBLIC_SITEMAP);
  var sizeKb = (stats.size / 1024).toFixed(2);
  var urlCount = (xml.match(/<url>/g) || []).length;

  console.log('=================================');
  console.log('✓ Static Sitemap Generated');
  console.log('=================================');
  console.log('Total URLs : ' + urlCount);
  console.log('File size  : ' + sizeKb + ' KB');
  console.log('Location   : public/sitemap.xml\n');
}

// ---------------------------------------------------------------------------
// Entry Point
// ---------------------------------------------------------------------------

async function run() {
  console.log('=================================');
  console.log('  Sitemap Setup');
  console.log('=================================');
  console.log('NEXT_PUBLIC_SEO : ' + (process.env.NEXT_PUBLIC_SEO || '(not set)'));
  console.log('SSR mode        : ' + SEO_ENABLED + '\n');

  if (SEO_ENABLED) {
    setupServerSideSitemap();
  } else {
    await generateStaticSitemap();
  }

  console.log('✅ Sitemap setup complete\n');
}

run().catch(function (err) {
  console.error('\n❌ setup-sitemap.js failed:');
  console.error('   ', err.message);
  console.error('\nStack:', err.stack);
  process.exit(1);
});
