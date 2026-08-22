import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(projectRoot, "index.html"), "utf8");
const appSource = readFileSync(resolve(projectRoot, "assets/app.js"), "utf8");
const dataSource = readFileSync(resolve(projectRoot, "assets/site-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(dataSource, context);

const data = structuredClone(context.window.SITE_DATA);

test("通用预约和 WhatsApp 入口全部移除", () => {
  assert.doesNotMatch(html, /data-whatsapp-link|floating-cta/);
  assert.doesNotMatch(appSource, /data\.whatsappUrl/);
  assert.equal(data.whatsappUrl, undefined);
  assert.equal(data.copy.cta.trial, undefined);
  assert.equal(data.copy.cta.consult, undefined);
  assert.equal(data.copy.cta.whatsapp, undefined);
});

test("最下方四位老师的个人电话与 WhatsApp 仍然保留", () => {
  const advisors = data.branches.flatMap((branch) => branch.advisors);

  assert.equal(advisors.length, 4);
  assert.ok(advisors.every((advisor) => advisor.phone && advisor.url.startsWith("https://wa.me/")));
  assert.deepEqual(
    advisors.map((advisor) => advisor.phone),
    ["016 7333 900", "017 7137 900", "016 7333 800", "016 7728 900"]
  );
});
