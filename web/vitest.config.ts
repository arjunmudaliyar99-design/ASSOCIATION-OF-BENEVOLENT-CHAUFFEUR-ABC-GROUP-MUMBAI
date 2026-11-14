import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/empty.ts") } },
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:./data/test.db",
      RAZORPAY_KEY_ID: "rzp_test_dummy",
      RAZORPAY_KEY_SECRET: "test_secret_for_signatures",
      RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
      AUTH_SECRET: "a".repeat(48),
    },
  },
});
