import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(projectRoot, "assets/site-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);

const data = structuredClone(context.window.SITE_DATA);

const advisors = {
  karen: {
    name: { zh: "Karen 老师", en: "Teacher Karen" },
    phone: "016 7333 900",
    image: "assets/images/contact/karen.jpg",
    url: "https://wa.me/60167333900"
  },
  joan: {
    name: { zh: "Joan 老师", en: "Teacher Joan" },
    phone: "017 7137 900",
    image: "assets/images/contact/joan.jpg",
    url: "https://wa.me/60177137900"
  },
  michelle: {
    name: { zh: "Michelle 老师", en: "Teacher Michelle" },
    phone: "016 7333 800",
    image: "assets/images/contact/michelle.jpg",
    url: "https://wa.me/60167333800"
  },
  eva: {
    name: { zh: "Eva 老师", en: "Teacher Eva" },
    phone: "016 7728 900",
    image: "assets/images/contact/eva.jpg",
    url: "https://wa.me/60167728900"
  }
};

test("分院联系卡将四位老师放在正确分院并使用各自号码", () => {
  assert.deepEqual(data.branches.map(({ name, advisors }) => ({ name, advisors })), [
    {
      name: { zh: "总院 - Permas Jaya", en: "Main Branch - Permas Jaya" },
      advisors: [advisors.karen, advisors.joan]
    },
    {
      name: { zh: "第二分行 - Masai", en: "Second Branch - Masai" },
      advisors: [advisors.michelle, advisors.eva]
    }
  ]);
});

test("四位老师的 WhatsApp 快捷联系资料与联系卡一致", () => {
  assert.deepEqual(data.advisorGroups, [
    {
      branch: { zh: "Permas 总院", en: "Permas Main Branch" },
      advisors: [advisors.karen, advisors.joan]
    },
    {
      branch: { zh: "Masai 第二分行", en: "Masai Second Branch" },
      advisors: [advisors.michelle, advisors.eva]
    }
  ]);
});

test("四张联系老师照片都能从网站目录加载", () => {
  const missingImages = Object.values(advisors)
    .map((advisor) => advisor.image)
    .filter((image) => !existsSync(resolve(projectRoot, image)));

  assert.deepEqual(missingImages, []);
});

test("两个完整地址与地图链接归属正确分院", () => {
  assert.deepEqual(
    data.branches.map(({ name, address, map }) => ({ name, address, map })),
    [
      {
        name: { zh: "总院 - Permas Jaya", en: "Main Branch - Permas Jaya" },
        address: "9, Jln Permas 10/8, Bandar Baru Permas Jaya, 81750 Masai, Johor Darul Ta'zim",
        map: "https://www.google.com/maps/search/?api=1&query=9%2C%20Jln%20Permas%2010%2F8%2C%20Bandar%20Baru%20Permas%20Jaya%2C%2081750%20Masai%2C%20Johor%20Darul%20Ta%27zim"
      },
      {
        name: { zh: "第二分行 - Masai", en: "Second Branch - Masai" },
        address: "30-01, Jalan Suria 2, Bandar Seri Alam, 81750 Masai, Johor Darul Ta'zim",
        map: "https://www.google.com/maps/search/?api=1&query=30-01%2C%20Jalan%20Suria%202%2C%20Bandar%20Seri%20Alam%2C%2081750%20Masai%2C%20Johor%20Darul%20Ta%27zim"
      }
    ]
  );
});
