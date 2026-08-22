import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(projectRoot, "index.html"), "utf8");

test("页面样式表使用版本化地址以避免本地浏览器读取旧排版", () => {
  const stylesheet = html.match(/<link\s+rel="stylesheet"\s+href="(assets\/styles\.css[^"]*)">/);

  assert.ok(stylesheet, "index.html 应加载 assets/styles.css");
  assert.match(stylesheet[1], /^assets\/styles\.css\?v=[a-z0-9.-]+$/i);
});

test("老师数据脚本使用版本化地址以避免本地浏览器读取旧资料", () => {
  const siteDataScript = html.match(/<script\s+src="(assets\/site-data\.js[^"]*)"><\/script>/);

  assert.ok(siteDataScript, "index.html 应加载 assets/site-data.js");
  assert.match(siteDataScript[1], /^assets\/site-data\.js\?v=[a-z0-9.-]+$/i);
});

test("页面应用脚本使用版本化地址以避免本地浏览器读取旧页面逻辑", () => {
  const appScript = html.match(/<script\s+src="(assets\/app\.js[^"]*)"><\/script>/);

  assert.ok(appScript, "index.html 应加载 assets/app.js");
  assert.match(appScript[1], /^assets\/app\.js\?v=[a-z0-9.-]+$/i);
});
