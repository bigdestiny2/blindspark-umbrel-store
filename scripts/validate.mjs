#!/usr/bin/env node
// validate.mjs — structural checks for the HiveRelay community Umbrel store.
//
// Dependency-free on purpose: the release pipeline runs `npm run validate`
// inside a bare checkout (no npm install). Keep it that way.
//
// What this guards:
//   - umbrel-app-store.yml store index shape
//   - hiverelay-blindspark/umbrel-app.yml required fields + version format
//   - docker-compose.yml image pin: exact tag + sha256 digest, and the tag
//     must match the manifest version (what the release sync keeps in step)
//   - package.json version matches the manifest version
//   - icon/gallery assets exist and icon/gallery URLs are https

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const appDir = path.join(root, 'hiverelay-blindspark')

let failures = 0
function check (ok, label) {
  if (ok) console.log(`ok - ${label}`)
  else {
    failures++
    console.error(`not ok - ${label}`)
  }
}
function read (file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return null
  }
}
function scalar (text, key) {
  const m = text.match(new RegExp(`^${key}:[ \\t]*(.+)$`, 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null
}

// ── store index ──────────────────────────────────────────────────────────
const storeIndex = read(path.join(root, 'umbrel-app-store.yml'))
check(storeIndex !== null, 'umbrel-app-store.yml exists')
if (storeIndex) {
  check(scalar(storeIndex, 'id') === 'hiverelay', 'store index id is hiverelay')
  check(!!scalar(storeIndex, 'name'), 'store index has a name')
}

// ── app manifest ─────────────────────────────────────────────────────────
const manifest = read(path.join(appDir, 'umbrel-app.yml'))
check(manifest !== null, 'hiverelay-blindspark/umbrel-app.yml exists')

let manifestVersion = null
if (manifest) {
  check(scalar(manifest, 'manifestVersion') === '1', 'manifestVersion is 1')
  check(scalar(manifest, 'id') === 'hiverelay-blindspark', 'app id is hiverelay-blindspark')
  check(!!scalar(manifest, 'name'), 'app has a display name')
  manifestVersion = scalar(manifest, 'version')
  check(
    !!manifestVersion && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifestVersion),
    `version is semver-ish (got: ${manifestVersion ?? 'missing'})`
  )
  for (const key of ['tagline', 'developer', 'website', 'repo', 'support', 'submitter']) {
    check(!!scalar(manifest, key), `manifest has ${key}`)
  }
  const port = scalar(manifest, 'port')
  check(!!port && Number.isInteger(Number(port)) && Number(port) > 0 && Number(port) <= 65535,
    `port is a valid TCP port (got: ${port ?? 'missing'})`)
  check(/^releaseNotes:\s*>-/m.test(manifest), 'releaseNotes block present')
  const icon = scalar(manifest, 'icon')
  check(!!icon && icon.startsWith('https://'), 'icon is an https URL')
  const gallery = manifest.match(/^gallery:\s*\n((?:\s+-\s+.+\n?)+)/m)
  check(!!gallery && gallery[1].includes('https://'), 'gallery lists https image URLs')
}

// ── compose ──────────────────────────────────────────────────────────────
const compose = read(path.join(appDir, 'docker-compose.yml'))
check(compose !== null, 'hiverelay-blindspark/docker-compose.yml exists')
if (compose) {
  const pin = compose.match(/image:\s*ghcr\.io\/bigdestiny2\/p2p-hiverelay:([^\s@]+)@sha256:([0-9a-f]{64})/)
  check(!!pin, 'image is pinned as tag@sha256 digest')
  if (pin && manifestVersion) {
    check(pin[1] === manifestVersion,
      `compose image tag matches manifest version (${pin[1]} vs ${manifestVersion})`)
  }
  check(/APP_HOST:\s*hiverelay-blindspark_web_1/.test(compose),
    'app_proxy APP_HOST points at hiverelay-blindspark_web_1')
  check(/\$\{APP_DATA_DIR\}\/data:\/data/.test(compose), 'data volume mounted at /data')
}

// ── assets ───────────────────────────────────────────────────────────────
const iconSvg = read(path.join(appDir, 'icon.svg'))
check(!!iconSvg && iconSvg.includes('<svg'), 'icon.svg exists and is SVG')
for (const img of ['1.png', '2.png', '3.png']) {
  check(fs.existsSync(path.join(appDir, img)), `gallery asset ${img} exists`)
}

// ── version agreement with package.json ──────────────────────────────────
const pkg = read(path.join(root, 'package.json'))
check(pkg !== null, 'package.json exists')
if (pkg && manifestVersion) {
  const pkgVersion = JSON.parse(pkg).version
  check(pkgVersion === manifestVersion,
    `package.json version matches manifest (${pkgVersion} vs ${manifestVersion})`)
}

if (failures > 0) {
  console.error(`\nvalidate: ${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nvalidate: store layout OK')
