<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:html="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <!--
    Read favicon and theme color from XML processing instructions
    injected by pages/sitemap.xml.js via getServerSideProps.
    Keys match eBroker API web-settings response:
      web-favicon: data.web_favicon (full URL to site favicon)
      web-color:   data.system_color (primary CSS color)
    Falls back to /favicon.ico and #0277fa if not present.
  -->
  <xsl:variable name="favicon-pi" select="/processing-instruction('web-favicon')"/>
  <xsl:variable name="color-pi"   select="/processing-instruction('web-color')"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>

        <!-- Dynamic favicon from API web-settings (data.web_favicon) -->
        <link rel="icon">
          <xsl:attribute name="href">
            <xsl:choose>
              <xsl:when test="normalize-space($favicon-pi) != ''">
                <xsl:value-of select="normalize-space($favicon-pi)"/>
              </xsl:when>
              <xsl:otherwise>/favicon.ico</xsl:otherwise>
            </xsl:choose>
          </xsl:attribute>
        </link>

        <style type="text/css">
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
            font-size: 14px;
            color: #1a202c;
            background: #f7fafc;
          }

          .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 32px 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          }

          .header-top {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 6px;
          }

          .header-favicon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            object-fit: contain;
            background: rgba(255,255,255,0.15);
            padding: 4px;
            flex-shrink: 0;
          }

          .header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }

          .header p { font-size: 14px; opacity: 0.85; margin-top: 4px; }

          .header .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 3px 12px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 12px;
          }

          .container { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }

          .stats { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }

          .stat-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 24px;
            flex: 1;
            min-width: 140px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }

          .stat-card .stat-value { font-size: 28px; font-weight: 700; color: var(--primary); line-height: 1; }

          .stat-card .stat-label {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px #e2e8f0;
          }

          thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }

          thead th {
            text-align: left;
            padding: 14px 18px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #4a5568;
          }

          tbody tr { border-bottom: 1px solid #edf2f7; transition: background 0.15s; }
          tbody tr:last-child { border-bottom: none; }
          tbody tr:hover { background: #f0f7ff; }
          tbody td { padding: 13px 18px; vertical-align: middle; }

          .url-cell a { color: var(--primary); text-decoration: none; font-size: 13px; word-break: break-all; }
          .url-cell a:hover { text-decoration: underline; color: var(--primary-dark); }

          .badge-priority { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
          .priority-high   { background: #c6f6d5; color: #276749; }
          .priority-medium { background: #fefcbf; color: #744210; }
          .priority-low    { background: #e2e8f0; color: #4a5568; }

          .badge-freq {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            background: #ebf4ff;
            color: var(--primary);
          }

          .lastmod { font-size: 12px; color: #718096; white-space: nowrap; }
          .row-num { font-size: 12px; color: #a0aec0; font-weight: 600; text-align: center; }
          .footer  { text-align: center; padding: 24px; color: #a0aec0; font-size: 12px; }
        </style>

        <!--
          Inject dynamic primary color from API web-settings (data.system_color).
          Falls back to #0277fa (eBroker default primary) if not present.
        -->
        <style type="text/css">
          <xsl:text>:root { --primary: </xsl:text>
          <xsl:choose>
            <xsl:when test="normalize-space($color-pi) != ''">
              <xsl:value-of select="normalize-space($color-pi)"/>
            </xsl:when>
            <xsl:otherwise>#0277fa</xsl:otherwise>
          </xsl:choose>
          <xsl:text>; --primary-dark: </xsl:text>
          <xsl:choose>
            <xsl:when test="normalize-space($color-pi) != ''">
              <xsl:value-of select="normalize-space($color-pi)"/>
            </xsl:when>
            <xsl:otherwise>#0250c5</xsl:otherwise>
          </xsl:choose>
          <xsl:text>; }</xsl:text>
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-top">
            <!-- Dynamic favicon/logo from API web-settings (data.web_favicon) -->
            <img class="header-favicon" alt="Site Logo">
              <xsl:attribute name="src">
                <xsl:choose>
                  <xsl:when test="normalize-space($favicon-pi) != ''">
                    <xsl:value-of select="normalize-space($favicon-pi)"/>
                  </xsl:when>
                  <xsl:otherwise>/favicon.ico</xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
            </img>
            <h1>XML Sitemap</h1>
          </div>
          <p>This sitemap is generated dynamically and helps search engines index your site.</p>
          <span class="badge">
            <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs indexed
          </span>
        </div>

        <div class="container">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:priority &gt;= 0.9])"/>
              </div>
              <div class="stat-label">High Priority</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:changefreq = 'weekly'])"/>
              </div>
              <div class="stat-label">Weekly Updates</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Priority</th>
                <th>Change Freq</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="row-num"><xsl:number/></td>
                  <td class="url-cell">
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:variable name="priority" select="sitemap:priority"/>
                    <xsl:choose>
                      <xsl:when test="$priority &gt;= 0.8">
                        <span class="badge-priority priority-high"><xsl:value-of select="$priority"/></span>
                      </xsl:when>
                      <xsl:when test="$priority &gt;= 0.5">
                        <span class="badge-priority priority-medium"><xsl:value-of select="$priority"/></span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="badge-priority priority-low"><xsl:value-of select="$priority"/></span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td>
                    <span class="badge-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                  </td>
                  <td class="lastmod">
                    <xsl:value-of select="concat(substring(sitemap:lastmod,1,10), ' ', substring(sitemap:lastmod,12,5))"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated dynamically &#x2022; Sitemap Protocol 0.9
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
