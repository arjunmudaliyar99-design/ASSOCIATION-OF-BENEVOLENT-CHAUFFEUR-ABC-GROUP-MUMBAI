import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Serve pages pre-rendered at build time (e.g. /hi, /mr/about) from Workers static assets.
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
