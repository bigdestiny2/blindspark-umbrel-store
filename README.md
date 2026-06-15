# HiveRelay Community App Store for Umbrel

A [community app store](https://github.com/getumbrel/umbrel-community-app-store)
for installing **Blindspark by HiveRelay** — a blind relay for the Pear /
Holepunch peer-to-peer ecosystem — on your own Umbrel before it lands in the
official Umbrel App Store.

## Install

1. In umbrelOS, open the **App Store**.
2. Click the **⋯** menu (top right) → **Community App Stores**.
3. Paste this repo's URL:
   ```
   https://github.com/bigdestiny2/blindspark-umbrel-store
   ```
4. Add it, then open the **HiveRelay** store and install **Blindspark**.
5. Open the app — a short first-run wizard names your relay and lets you
   choose how it accepts seed requests (review / allowlist / open).

## What it runs

- Image: `ghcr.io/bigdestiny2/p2p-hiverelay:0.14.0` (multi-arch, digest-pinned).
- Reached only through Umbrel's authenticated app proxy on port 9100 — no host
  ports are published.
- State persists under the app data volume; the relay identity is derived from
  your Umbrel seed, so reinstalls restore the same relay.

## Notes

- App id is `hiverelay-blindspark` (community stores require the app id to be
  prefixed with the store id `hiverelay`).
- Gallery images are placeholders pending real dashboard screenshots.
- Source + issues: https://github.com/bigdestiny2/p2p-hiverelay
- Apache-2.0. No account, no telemetry, no payment.
