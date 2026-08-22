import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(projectRoot, "index.html"), "utf8");
const source = readFileSync(resolve(projectRoot, "assets/site-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);

const homeNavLinks = structuredClone(context.window.SITE_DATA.homeNav).map((item) => item.href);

test("首页不再显示活动、进步和常见问题三个区块", () => {
  assert.doesNotMatch(html, /<section[^>]+id="stories"/);
  assert.doesNotMatch(html, /<section[^>]+id="progress"/);
  assert.doesNotMatch(html, /<section[^>]+id="faq"/);
  assert.ok(!homeNavLinks.includes("#stories"));
  assert.ok(!homeNavLinks.includes("#faq"));
});

test("删除后仍保留学生见证、家长好评和分行联系", () => {
  assert.match(html, /<section[^>]+id="process"/);
  assert.match(html, /<section[^>]+id="reviews"/);
  assert.match(html, /<section[^>]+id="contact"/);
  assert.ok(homeNavLinks.includes("#process"));
  assert.ok(homeNavLinks.includes("#reviews"));
  assert.ok(homeNavLinks.includes("#contact"));
});
