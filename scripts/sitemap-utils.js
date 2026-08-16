/**
 * Sitemap Utilities
 * Helper functions for sitemap management and validation
 */

/**
 * Validates if a slug is SEO-friendly
 * @param {string} slug - The slug to validate
 * @returns {boolean} Whether the slug is valid
 */
const isValidSlug = (slug) => {
    if (!slug || typeof slug !== 'string') return false;

    // Check for valid characters (alphanumeric, hyphens, underscores)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

    // Additional validations
    const validations = [
        slug.trim() !== '',
        slug.length > 0,
        slug.length <= 200, // Reasonable max length
        slugPattern.test(slug),
        !slug.startsWith('-'),
        !slug.endsWith('-'),
        !slug.includes('--') // No double hyphens
    ];

    return validations.every(validation => validation);
};

/**
 * Sanitizes a slug to be SEO-friendly
 * @param {string} text - Text to convert to slug
 * @returns {string} Sanitized slug
 */
const sanitizeSlug = (text) => {
    if (!text || typeof text !== 'string') return '';

    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Estimates sitemap size in bytes
 * @param {number} urlCount - Number of URLs
 * @param {number} avgUrlLength - Average URL length in characters
 * @returns {object} Size estimate
 */
const estimateSitemapSize = (urlCount, avgUrlLength = 80) => {
    const xmlOverhead = 200; // XML header and closing tags
    const perUrlOverhead = 150; // XML tags per URL entry
    const totalBytes = xmlOverhead + (urlCount * (avgUrlLength + perUrlOverhead));

    return {
        bytes: totalBytes,
        kilobytes: (totalBytes / 1024).toFixed(2),
        megabytes: (totalBytes / (1024 * 1024)).toFixed(2),
        isWithinGoogleLimit: totalBytes < 50 * 1024 * 1024, // 50MB limit
        urlCountWithinLimit: urlCount <= 50000 // 50k URL limit
    };
};

/**
 * Groups URLs by type for potential sitemap splitting
 * @param {Array} routes - Array of route objects
 * @returns {object} Grouped routes
 */
const groupRoutesByType = (routes) => {
    const groups = {
        static: [],
        properties: [],
        projects: [],
        articles: [],
        agents: [],
        categories: [],
        other: []
    };

    routes.forEach(route => {
        if (route.route) {
            if (route.route.includes('property-details')) {
                groups.properties.push(route);
            } else if (route.route.includes('project-details')) {
                groups.projects.push(route);
            } else if (route.route.includes('article-details')) {
                groups.articles.push(route);
            } else if (route.route.includes('verified-user-details')) {
                groups.agents.push(route);
            } else if (route.route.includes('category')) {
                groups.categories.push(route);
            } else {
                groups.other.push(route);
            }
        } else {
            groups.static.push(route);
        }
    });

    return groups;
};

/**
 * Generates sitemap index XML for multiple sitemaps
 * @param {Array} sitemaps - Array of sitemap objects with url and lastmod
 * @param {string} baseUrl - Base URL of the website
 * @returns {string} Sitemap index XML
 */
const generateSitemapIndex = (sitemaps, baseUrl) => {
    const sitemapEntries = sitemaps.map(sitemap => {
        const lastmod = sitemap.lastmod || new Date().toISOString();
        return `  <sitemap>
    <loc>${baseUrl}/${sitemap.filename}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
};

/**
 * Validates priority value
 * @param {number} priority - Priority value to validate
 * @returns {number} Valid priority value between 0.0 and 1.0
 */
const validatePriority = (priority) => {
    const numPriority = parseFloat(priority);
    if (isNaN(numPriority)) return 0.5;
    return Math.max(0.0, Math.min(1.0, numPriority));
};

/**
 * Validates change frequency
 * @param {string} changefreq - Change frequency to validate
 * @returns {string} Valid change frequency
 */
const validateChangeFrequency = (changefreq) => {
    const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    return validFrequencies.includes(changefreq) ? changefreq : 'weekly';
};

/**
 * Formats date for sitemap lastmod
 * @param {Date|string} date - Date to format
 * @returns {string} ISO 8601 formatted date
 */
const formatSitemapDate = (date) => {
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            return new Date().toISOString();
        }
        return dateObj.toISOString();
    } catch (error) {
        return new Date().toISOString();
    }
};

/**
 * Escapes special XML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeXml = (text) => {
    if (!text || typeof text !== 'string') return '';

    return text
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

/**
 * Calculates optimal batch size for API requests
 * @param {number} totalItems - Total number of items to fetch
 * @param {number} maxBatchSize - Maximum items per request
 * @returns {object} Batch configuration
 */
const calculateBatchConfig = (totalItems, maxBatchSize = 100) => {
    const batches = Math.ceil(totalItems / maxBatchSize);
    return {
        batchSize: Math.min(totalItems, maxBatchSize),
        totalBatches: batches,
        lastBatchSize: totalItems % maxBatchSize || maxBatchSize
    };
};

/**
 * Generates a comprehensive sitemap report
 * @param {Array} entries - Sitemap entries
 * @returns {object} Sitemap statistics
 */
const generateSitemapReport = (entries) => {
    const grouped = groupRoutesByType(entries);
    const sizeEstimate = estimateSitemapSize(entries.length);

    return {
        totalUrls: entries.length,
        breakdown: {
            static: grouped.static.length,
            properties: grouped.properties.length,
            projects: grouped.projects.length,
            articles: grouped.articles.length,
            agents: grouped.agents.length,
            categories: grouped.categories.length,
            other: grouped.other.length
        },
        sizeEstimate,
        compliance: {
            urlCountOk: sizeEstimate.urlCountWithinLimit,
            sizeOk: sizeEstimate.isWithinGoogleLimit,
            needsSplitting: !sizeEstimate.urlCountWithinLimit || !sizeEstimate.isWithinGoogleLimit
        },
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    isValidSlug,
    sanitizeSlug,
    estimateSitemapSize,
    groupRoutesByType,
    generateSitemapIndex,
    validatePriority,
    validateChangeFrequency,
    formatSitemapDate,
    escapeXml,
    calculateBatchConfig,
    generateSitemapReport
};
