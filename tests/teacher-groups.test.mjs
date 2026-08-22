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

const groups = context.window.SITE_DATA.teacherGroups;

const profile = (zh, en, image) => ({ name: { zh, en }, image });
const primaryProfiles = [
  profile("Lucas 老师", "Teacher Lucas", "assets/images/teachers/primary-lucas.jpg"),
  profile("萧老师", "Teacher Xiao", "assets/images/teachers/primary-xiao.jpg"),
  profile("Candy 老师", "Teacher Candy", "assets/images/teachers/primary-candy.jpg")
];
const daycareProfiles = [
  profile("Elaine 老师", "Teacher Elaine", "assets/images/teachers/daycare-elaine.jpg"),
  profile("Angel 老师", "Teacher Angel", "assets/images/teachers/daycare-angel.jpg")
];

test("小学组显示 Lucas、萧老师和 Candy 老师的资料", () => {
  const primary = groups.find((group) => group.id === "primary");

  assert.deepEqual(
    structuredClone(primary.teachers),
    primaryProfiles
  );
  assert.doesNotMatch(primary.description.zh, /即将加入/);
  assert.doesNotMatch(primary.description.en, /coming soon/i);
});

test("托育组显示 Elaine 老师和 Angel 老师的资料", () => {
  const daycare = groups.find((group) => group.id === "daycare");

  assert.deepEqual(
    structuredClone(daycare.teachers),
    daycareProfiles
  );
  assert.doesNotMatch(daycare.description.zh, /即将加入/);
  assert.doesNotMatch(daycare.description.en, /coming soon/i);
});

test("五张新增老师照片都能从网站目录加载", () => {
  const missingImages = [...primaryProfiles, ...daycareProfiles]
    .map((teacher) => teacher.image)
    .filter((image) => !existsSync(resolve(projectRoot, image)));

  assert.deepEqual(missingImages, []);
});
