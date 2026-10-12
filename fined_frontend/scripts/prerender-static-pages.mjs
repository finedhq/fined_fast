// Writes a real HTML file for each public static page (about.html, tags/ipo.html, ...) with that
// page's own title, description and canonical, so crawlers get them without running JavaScript.
// Runs right after `vite build` (see the "build" script). Vercel serves the files through the
// rewrites at the top of vercel.json; every other route still gets the plain index.html.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANONICAL_STATIC_PATHS,
  TAG_NAMES,
  getTitleForPath,
  getDescriptionForPath,
  getCanonicalForPath,
} from '../src/config/pageTitles.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// <meta> tags are matched by their name/property, whatever order their attributes are in
function setMetaContent(html, attribute, key, value) {
  const tagPattern = new RegExp(`<meta\\b[^>]*\\b${attribute}="${key}"[^>]*>`, 'i')
  if (!tagPattern.test(html)) {
    throw new Error(`index.html has no <meta ${attribute}="${key}">`)
  }
  return html.replace(tagPattern, (tag) =>
    tag.replace(/content="[^"]*"/i, () => `content="${escapeHtml(value)}"`),
  )
}

function setTitle(html, value) {
  if (!/<title>[^<]*<\/title>/i.test(html)) throw new Error('index.html has no <title>')
  // Quotes are fine inside element text; only & and < > need escaping
  const text = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return html.replace(/<title>[^<]*<\/title>/i, () => `<title>${text}</title>`)
}

function pageHtml(shell, path) {
  const tagSlug = path.startsWith('/tags/') ? path.slice('/tags/'.length) : null
  const title = tagSlug ? `Articles tagged "${TAG_NAMES[tagSlug]}" | FinEd` : getTitleForPath(path)
  const description = getDescriptionForPath(path)
  const canonical = getCanonicalForPath(path)
  if (!title || !description || !canonical) {
    throw new Error(`Missing title, description or canonical for ${path}`)
  }

  let html = setTitle(shell, title)
  html = setMetaContent(html, 'name', 'description', description)
  html = setMetaContent(html, 'property', 'og:title', title)
  html = setMetaContent(html, 'property', 'og:description', description)
  html = setMetaContent(html, 'name', 'twitter:title', title)
  html = setMetaContent(html, 'name', 'twitter:description', description)

  const extraTags =
    `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n` +
    `  <meta property="og:url" content="${escapeHtml(canonical)}" />\n`
  return html.replace('</head>', () => `${extraTags}</head>`)
}

const shell = readFileSync(resolve(distDir, 'index.html'), 'utf-8')
if (/rel="canonical"/i.test(shell)) {
  throw new Error('index.html already has a canonical link; it would apply to every route')
}

const paths = [
  ...[...CANONICAL_STATIC_PATHS].filter((path) => path !== '/'),
  ...Object.keys(TAG_NAMES).map((slug) => `/tags/${slug}`),
]

// Every file needs a rewrite, or Vercel would keep serving the plain index.html for that route
const vercelConfig = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf-8'))
const rewrites = new Map((vercelConfig.rewrites || []).map((rule) => [rule.source, rule.destination]))
const missingRewrites = paths.filter((path) => rewrites.get(path) !== `${path}.html`)
if (missingRewrites.length) {
  throw new Error(
    `vercel.json needs a rewrite from each path to its .html file. Missing: ${missingRewrites.join(', ')}`,
  )
}

for (const path of paths) {
  const file = resolve(distDir, `.${path}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, pageHtml(shell, path))
}

console.log(`Prerendered head tags for ${paths.length} pages: ${paths.join(', ')}`)
