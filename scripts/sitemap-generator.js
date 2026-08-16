/**
 * scripts/sitemap-generator.js
 *
 * Dual-purpose sitemap module:
 *
 *  1. CLI SCRIPT  → run directly with Node.js to write public/sitemap.xml
 *                   (used in CI / build pipelines for static hosting or SSG)
 *
 *  2. SSR HELPER  → exports `generateSitemapXml()` for pages/sitemap.xml.js
 *                   so the same logic serves dynamic SSR requests at /sitemap.xml
 *
 * API endpoints (from src/api/apiEndpoints.js):
 *   GET  web-settings        → data.web_favicon (logo), data.system_color (primary)
 *   GET  get-property-list   → property slugs
 *   GET  get_articles        → article slugs
 *   GET  agent-list          → agent slugs
 *
 * Branding is injected as XML processing instructions so sitemap.xsl can
 * render the correct favicon and theme colour when a browser opens /sitemap.xml:
 *   <?web-favicon https://example.com/logo.png?>
 *   <?web-color   #0277fa?>
 */

const axios = require('axios');

// dotenv is only needed when running as a CLI script (not inside Next.js)
try {
  require('dotenv').config();
} catch {
  // dotenv not installed — env vars supplied by Next.js runtime
}

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

const getApiBase = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || '';
  const sub = process.env.NEXT_PUBLIC_END_POINT || '/api/';
  return `${url}${sub}`;
};

const getWebUrl = () =>
  (process.env.NEXT_PUBLIC_WEB_URL || '').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Environment validation (CLI only)
// ---------------------------------------------------------------------------

const validateEnvironment = () => {
  const required = [
    'NEXT_PUBLIC_WEB_URL',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_END_POINT',
  ];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  try {
    new URL(process.env.NEXT_PUBLIC_WEB_URL);
    new URL(process.env.NEXT_PUBLIC_API_URL);
  } catch (err) {
    throw new Error(`Invalid URL format in environment variables: ${err.message}`);
  }
};

// ---------------------------------------------------------------------------
// Static routes
// ---------------------------------------------------------------------------

const staticRoutes = [
  // Core pages - Highest priority
  { path: '/',                         priority: 1.0, changefreq: 'daily'   },
  { path: '/properties/',              priority: 0.9, changefreq: 'daily'   },
  { path: '/projects/',                priority: 0.9, changefreq: 'daily'   },
  { path: '/search/',                  priority: 0.9, changefreq: 'daily'   },

  // Secondary pages - High priority
  { path: '/projects/featured-projects/', priority: 0.8, changefreq: 'weekly' },
  { path: '/properties-on-map/',          priority: 0.8, changefreq: 'weekly' },
  { path: '/all/categories/',             priority: 0.8, changefreq: 'weekly' },
  { path: '/all/agents/',                 priority: 0.8, changefreq: 'weekly' },
  { path: '/all/articles/',              priority: 0.8, changefreq: 'weekly' },

  // Informational pages - Medium priority
  { path: '/about-us/',            priority: 0.7, changefreq: 'monthly' },
  { path: '/contact-us/',          priority: 0.7, changefreq: 'monthly' },
  { path: '/subscription-plan/',   priority: 0.7, changefreq: 'monthly' },
  { path: '/faqs/',                priority: 0.6, changefreq: 'monthly' },

  // Legal pages - Lower priority
  { path: '/privacy-policy/',        priority: 0.5, changefreq: 'yearly' },
  { path: '/terms-and-conditions/',  priority: 0.5, changefreq: 'yearly' },
];

// ---------------------------------------------------------------------------
// URL entry builder (preserves hreflang support from original generator)
// ---------------------------------------------------------------------------

/**
 * Generates an XML <url> entry with optional hreflang alternate links.
 *
 * @param {string}  path            - URL path (without domain)
 * @param {number}  priority        - 0.0 – 1.0
 * @param {string}  changefreq      - e.g. 'weekly'
 * @param {Date}    lastmod         - null → current timestamp
 * @param {Array}   languages       - Array of { code } from web-settings
 * @param {string}  defaultLangCode - Default language code for canonical / x-default
 * @returns {string} XML snippet
 */
const generateUrlEntry = (
  path,
  priority = 0.5,
  changefreq = 'weekly',
  lastmod = null,
  languages = [],
  defaultLangCode = 'en'
) => {
  const normalizedPath = path ? path.replace(/^\/+/, '') : '';
  const baseWebUrl = getWebUrl();
  const baseUrl = normalizedPath
    ? `${baseWebUrl}/${normalizedPath}`
    : baseWebUrl;

  const encodeUrl = (url) => {
    try {
      const urlObj = new URL(url);
      urlObj.pathname = urlObj.pathname
        .split('/')
        .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
        .join('/');
      return urlObj.toString();
    } catch {
      return encodeURI(url);
    }
  };

  const escapeXml = (url) =>
    url
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const canonicalUrl = `${baseUrl}?lang=${defaultLangCode}`;
  const escapedCanonical = escapeXml(encodeUrl(canonicalUrl));
  const lastModified = lastmod ? lastmod.toISOString() : new Date().toISOString();
  const validPriority = Math.max(0.0, Math.min(1.0, priority)).toFixed(1);

  const uniqueLangs = languages
    .filter((l) => l.code && l.code.trim() !== '')
    .filter((l, i, arr) => arr.findIndex((x) => x.code === l.code) === i);

  const hreflangs = uniqueLangs
    .map((lang) => {
      const langUrl = escapeXml(encodeUrl(`${baseUrl}?lang=${lang.code}`));
      return `    <xhtml:link rel="alternate" hreflang="${lang.code}" href="${langUrl}" />`;
    })
    .join('\n');

  const xDefaultUrl = escapeXml(encodeUrl(`${baseUrl}?lang=${defaultLangCode}`));

  return `  <url>
    <loc>${escapedCanonical}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${validPriority}</priority>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />
  </url>`;
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Fetches all pages from a paginated GET endpoint.
 * Returns an empty array on any network error (non-fatal for SSR).
 */
const fetchAllPages = async (endpoint, params = {}, limit = 100) => {
  const allItems = [];
  let offset = 0;

  while (true) {
    try {
      const res = await axios.get(endpoint, {
        params: { ...params, limit, offset },
        timeout: 10000,
        // Mirror the X-Active-Role header that axiosMiddleware.js sets for client requests.
        // Required by endpoints like get-property-list and agent-list.
        headers: { 'X-Active-Role': 'user' },
      });
      const data = res.data?.data ?? res.data;
      if (!Array.isArray(data) || data.length === 0) break;
      allItems.push(...data);
      if (data.length < limit) break;
      offset += limit;
    } catch (err) {
      console.error(`Error fetching ${endpoint} at offset ${offset}:`, err.message);
      break;
    }
  }

  return allItems;
};

/**
 * Fetches web-settings and returns { webFavicon, webColor, defaultLangCode, languages }.
 * Falls back to safe defaults on error.
 */
const fetchSettings = async () => {
  try {
    const res = await axios.get(`${getApiBase()}web-settings`, { timeout: 10000 });
    const data = res.data?.data ?? {};
    return {
      webFavicon:      data.web_favicon    || '',
      webColor:        data.system_color   || '',
      defaultLangCode: data.default_language || 'en',
      languages:       data.languages || [],
    };
  } catch (err) {
    console.error('Error fetching web-settings:', err.message);
    return { webFavicon: '', webColor: '', defaultLangCode: 'en', languages: [] };
  }
};

// ---------------------------------------------------------------------------
// Dynamic route configurations
// ---------------------------------------------------------------------------

/**
 * Builds the base64-encoded filters param required by get-property-list.
 * Uses Buffer (Node.js) — same logic as the client-side btoa() in apiRoutes.js.
 */
const buildPropertyFilters = () => {
  const filtersObject = {
    property_type: '',
    category_id: '',
    category_slug_id: '',
    parameters: [],
    nearby_places: [],
    location: {},
    price: {},
    posted_since: 0,
    search: '',
    flags: {},
  };
  return Buffer.from(JSON.stringify(filtersObject)).toString('base64');
};

const getDynamicRouteConfigs = () => [
  {
    name: 'Properties',
    route: '/property-details/[slug]/',
    apiEndpoint: `${getApiBase()}get-property-list`,
    // get-property-list requires an encoded `filters` param — without it the API returns 500
    extraParams: { filters: buildPropertyFilters() },
    pathExtractor: (item) => item?.slug_id,
    priority: 0.8,
    changefreq: 'weekly',
  },
  {
    name: 'Projects',
    route: '/project-details/[slug]/',
    apiEndpoint: `${getApiBase()}get-projects`,
    extraParams: {},
    pathExtractor: (item) => item?.slug_id,
    priority: 0.8,
    changefreq: 'weekly',
  },
  {
    name: 'Articles',
    route: '/article-details/[slug]/',
    apiEndpoint: `${getApiBase()}get_articles`,
    extraParams: {},
    pathExtractor: (item) => item?.slug_id,
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    name: 'Agents',
    route: '/agent-details/[slug]/',
    apiEndpoint: `${getApiBase()}agent-list`,
    extraParams: {},
    // agent-list may return slug_id or unique_name depending on API version
    pathExtractor: (item) => item?.slug_id || item?.unique_name,
    priority: 0.7,
    changefreq: 'monthly',
  },
];

/**
 * Fetches all dynamic routes from APIs.
 * @returns {Promise<Array<{path, priority, changefreq, lastmod}>>}
 */
const fetchDynamicRoutes = async () => {
  const allRoutes = [];

  for (const config of getDynamicRouteConfigs()) {
    try {
      console.log(`Fetching ${config.name}...`);
      const items = await fetchAllPages(config.apiEndpoint, config.extraParams);

      if (items.length === 0) {
        console.warn(`⚠️  No items found for ${config.name}`);
        continue;
      }

      items.forEach((item) => {
        const slug = config.pathExtractor(item);
        if (!slug) return;
        const fullPath = config.route.replace('[slug]', slug);
        const lastModified = item.updated_at
          ? new Date(item.updated_at)
          : item.created_at
          ? new Date(item.created_at)
          : new Date();

        allRoutes.push({
          path: fullPath,
          priority: config.priority,
          changefreq: config.changefreq,
          lastmod: lastModified,
        });
      });

      console.log(`✓ Added ${items.length} ${config.name}`);
    } catch (err) {
      console.error(`❌ Error fetching ${config.name}:`, err.message);
    }
  }

  return allRoutes;
};

// ---------------------------------------------------------------------------
// Core XML assembler — shared between CLI and SSR
// ---------------------------------------------------------------------------

/**
 * Generates the full sitemap XML string.
 *
 * @param {Object} options
 * @param {string} options.webFavicon      - data.web_favicon from web-settings API
 * @param {string} options.webColor        - data.system_color from web-settings API
 * @param {string} options.defaultLangCode - Default language code
 * @param {Array}  options.languages       - Available language objects [{ code }]
 * @returns {Promise<string>} Complete XML string
 */
const generateSitemapXml = async ({
  webFavicon = '',
  webColor = '',
  defaultLangCode = 'en',
  languages = [],
} = {}) => {
  const sitemapEntries = [];

  // Static routes
  staticRoutes.forEach(({ path, priority, changefreq }) => {
    const normalizedPath = path === '/' ? '' : path.replace(/^\/+/, '');
    sitemapEntries.push(
      generateUrlEntry(normalizedPath, priority, changefreq, null, languages, defaultLangCode)
    );
  });

  // Dynamic routes
  const dynamicRoutes = await fetchDynamicRoutes();
  dynamicRoutes.forEach(({ path, priority, changefreq, lastmod }) => {
    const normalizedPath = path.replace(/^\/+/, '');
    sitemapEntries.push(
      generateUrlEntry(normalizedPath, priority, changefreq, lastmod, languages, defaultLangCode)
    );
  });

  // Branding processing instructions for sitemap.xsl
  const faviconPI = webFavicon ? `<?web-favicon ${webFavicon}?>` : '';
  const colorPI   = webColor   ? `<?web-color ${webColor}?>`     : '';

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    faviconPI,
    colorPI,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    ...sitemapEntries,
    '</urlset>',
  ];

  return lines.filter(Boolean).join('\n');
};

// ---------------------------------------------------------------------------
// CLI entry point — writes public/sitemap.xml when run directly
// ---------------------------------------------------------------------------

const runCli = async () => {
  const fs = require('fs');

  console.log('=================================');
  console.log('Starting Sitemap Generation');
  console.log('=================================\n');

  validateEnvironment();
  console.log('✓ Environment variables validated\n');

  console.log('Fetching website settings...');
  const { webFavicon, webColor, defaultLangCode, languages } = await fetchSettings();

  console.log(`✓ Using default language: ${defaultLangCode}`);
  console.log(`✓ Available languages: ${languages.map((l) => l.code).join(', ')}`);
  if (webFavicon) console.log(`✓ Favicon: ${webFavicon}`);
  if (webColor)   console.log(`✓ Theme color: ${webColor}\n`);

  const xml = await generateSitemapXml({ webFavicon, webColor, defaultLangCode, languages });

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public', { recursive: true });
  }

  fs.writeFileSync('public/sitemap.xml', xml);

  const stats = fs.statSync('public/sitemap.xml');
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const urlCount = (xml.match(/<url>/g) || []).length;

  console.log('=================================');
  console.log('✓ Sitemap Generation Complete');
  console.log('=================================');
  console.log(`Total URLs:   ${urlCount}`);
  console.log(`Languages:    ${languages.length}`);
  console.log(`Hreflang/URL: ${languages.length + 1} (incl. x-default)`);
  console.log(`File size:    ${fileSizeKB} KB`);
  console.log(`Location:     public/sitemap.xml`);
  console.log(`XSL branding: ${webFavicon ? '✓ favicon' : '— no favicon'} | ${webColor ? '✓ color' : '— no color'}\n`);

  if (urlCount > 50000) {
    console.warn('⚠️  WARNING: Sitemap exceeds 50,000 URLs. Consider splitting into multiple sitemaps.');
  }
  if (stats.size > 50 * 1024 * 1024) {
    console.warn('⚠️  WARNING: Sitemap exceeds 50 MB. Consider compressing or splitting.');
  }
};

// Run CLI only when invoked directly (node scripts/sitemap-generator.js)
if (require.main === module) {
  runCli().catch((err) => {
    console.error('\n=================================');
    console.error('❌ Error generating sitemap');
    console.error('=================================');
    console.error(err.message);
    console.error('\nStack trace:', err.stack);
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// Exports for use by pages/sitemap.xml.js (SSR)
// ---------------------------------------------------------------------------
module.exports = { generateSitemapXml, fetchSettings };
