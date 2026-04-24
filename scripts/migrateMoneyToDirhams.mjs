#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const mutationName = "migrations.migrateStoredMoneyToDirhams";
const argv = process.argv.slice(2);

let adminId = "";
let successfulWhopPaymentId = "";
let shouldApply = false;
let useProd = true;

for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === "--adminId") {
    adminId = argv[index + 1] ?? "";
    index += 1;
  } else if (arg === "--successfulWhopPaymentId") {
    successfulWhopPaymentId = argv[index + 1] ?? "";
    index += 1;
  } else if (arg === "--apply") {
    shouldApply = true;
  } else if (arg === "--dev") {
    useProd = false;
  }
}

if (!adminId) {
  console.error(
    "Usage: node scripts/migrateMoneyToDirhams.mjs --adminId <adminId> [--successfulWhopPaymentId <pay_xxx>] [--apply] [--dev]"
  );
  process.exit(1);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function runMigration(dryRun) {
  const payload = {
    adminId,
    dryRun,
  };

  if (successfulWhopPaymentId) {
    payload.successfulWhopPaymentId = successfulWhopPaymentId;
  }

  const args = ["convex", "run"];
  if (useProd) args.push("--prod");
  args.push(mutationName, JSON.stringify(payload));

  return execFileSync(npxCommand, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
}

console.log("== Dry run ==");
const dryRunOutput = runMigration(true);
console.log(dryRunOutput.trim());

if (!shouldApply) {
  console.log("\nDry run complete. Re-run with --apply to execute the migration.");
  process.exit(0);
}

console.log("\n== Apply ==");
const applyOutput = runMigration(false);
console.log(applyOutput.trim());
