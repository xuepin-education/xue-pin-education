import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataSource = readFileSync(resolve(projectRoot, "assets/site-data.js"), "utf8");
const appSource = readFileSync(resolve(projectRoot, "assets/app.js"), "utf8");
const styleSource = readFileSync(resolve(projectRoot, "assets/styles.css"), "utf8");

const createElement = (tagName) => {
  const element = {
    tagName,
    children: [],
    attributes: {},
    className: "",
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = value;
      }
    },
    append(...children) {
      this.children.push(...children);
    },
    cloneNode(deep = false) {
      const clone = createElement(tagName);
      clone.className = element.className;
      if (deep) clone.children = [...element.children];
      return clone;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    addEventListener() {},
    removeEventListener() {}
  };

  element.classList = {
    toggle(name, enabled) {
      const classes = new Set(element.className.split(/\s+/).filter(Boolean));
      if (enabled) classes.add(name);
      else classes.delete(name);
      element.className = [...classes].join(" ");
    },
    add(name) {
      this.toggle(name, true);
    },
    remove(name) {
      this.toggle(name, false);
    }
  };

  Object.defineProperty(element, "innerHTML", {
    set() {
      element.children = [];
    }
  });

  return element;
};

const renderTrustShowcase = () => {
  const dataContext = { window: {} };
  vm.runInNewContext(dataSource, dataContext);

  const trophy = createElement("article");
  const carousel = createElement("div");
  const awards = createElement("div");
  const daycareSlogan = createElement("p");
  const daycareCarousel = createElement("div");
  const intervals = [];
  const selectorMap = new Map([
    ["[data-trust-trophy]", trophy],
    ["[data-trust-carousel]", carousel],
    ["[data-trust-awards]", awards],
    ["[data-daycare-slogan]", daycareSlogan],
    ["[data-daycare-carousel]", daycareCarousel]
  ]);
  const body = createElement("body");
  body.dataset = { page: "home" };
  const document = {
    body,
    documentElement: createElement("html"),
    hidden: false,
    createElement,
    querySelector: (selector) => selectorMap.get(selector) || null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {}
  };
  const window = {
    SITE_DATA: dataContext.window.SITE_DATA,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    setInterval(callback, delay) {
      intervals.push({ callback, delay });
      return intervals.length;
    },
    clearInterval() {}
  };
  const context = {
    window,
    document,
    localStorage: { getItem: () => null, setItem() {} }
  };

  vm.runInNewContext(appSource, context);
  return { awards, intervals };
};

test("三大奖项轮播每两秒自动切换", () => {
  const { intervals } = renderTrustShowcase();

  assert.equal(intervals[0].delay, 2000);
});

test("托育图片轮播每三秒自动切换", () => {
  const { intervals } = renderTrustShowcase();

  assert.equal(intervals[1].delay, 3000);
});

test("TOP奖项Logo获得独立的手机定位标识", () => {
  const { awards } = renderTrustShowcase();
  const topAwardLogo = awards.children[2].children[0];

  assert.match(topAwardLogo.className, /\btrust-award-logo-top\b/);
});

test("为什么选择标题在所有断点保持单行且手机字号可收缩", () => {
  const titleRules = [...styleSource.matchAll(/\.trust-reveal-title\s*\{([^}]*)\}/g)].map((match) => match[1]);
  const baseRule = titleRules[0];

  assert.match(baseRule, /max-width:\s*none\s*;/);
  assert.match(baseRule, /white-space:\s*nowrap\s*;/);
  assert.equal(titleRules.some((rule) => /max-width:\s*8(?:\.\d+)?em\s*;/.test(rule)), false);
  assert.equal(titleRules.some((rule) => /font-size:\s*clamp\(28px,\s*8vw,\s*40px\)\s*;/.test(rule)), true);
});
