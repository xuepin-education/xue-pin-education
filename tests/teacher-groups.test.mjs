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
const newSecondaryProfiles = [
  profile("Mico 老师", "Teacher Mico", "assets/images/teachers/secondary-mico-2026.jpeg"),
  profile("谢老师", "Teacher Xie", "assets/images/teachers/secondary-xie-2026.png")
];
const primaryProfiles = [
  profile("Lucas 老师", "Teacher Lucas", "assets/images/teachers/primary-lucas.jpg"),
  profile("萧老师", "Teacher Xiao", "assets/images/teachers/primary-xiao.jpg"),
  profile("Candy 老师", "Teacher Candy", "assets/images/teachers/primary-candy.jpg"),
  profile("孔老师", "Teacher Kong", "assets/images/teachers/primary-kong.jpg"),
  profile("晶老师", "Teacher Jing", "assets/images/teachers/primary-jing-2026.jpeg"),
  profile("雪老师", "Teacher Xue", "assets/images/teachers/primary-xue-2026.jpg"),
  profile("王老师", "Teacher Wang", "assets/images/teachers/primary-wang-2026.jpeg"),
  profile("刘老师", "Teacher Liu", "assets/images/teachers/primary-liu-2026.jpeg"),
  profile("Cherry 老师", "Teacher Cherry", "assets/images/teachers/primary-daycare-cherry-2026.jpeg")
];
const daycareProfiles = [
  profile("Elaine 老师", "Teacher Elaine", "assets/images/teachers/daycare-elaine.jpg"),
  profile("Angel 老师", "Teacher Angel", "assets/images/teachers/daycare-angel.jpg"),
  profile("陈老师", "Teacher Chen", "assets/images/teachers/daycare-chen.jpg"),
  profile("薇老师", "Teacher Wei", "assets/images/teachers/daycare-wei-2026.jpg"),
  profile("颜老师", "Teacher Yan", "assets/images/teachers/daycare-yan-2026.jpg"),
  profile("Cherry 老师", "Teacher Cherry", "assets/images/teachers/primary-daycare-cherry-2026.jpeg")
];

test("中学组加入 Mico 老师和谢老师的新照片", () => {
  const secondary = groups.find((group) => group.id === "secondary");

  assert.deepEqual(
    structuredClone(secondary.teachers.slice(-2)),
    newSecondaryProfiles
  );
});

test("小学组加入晶、雪、王、刘和 Cherry 老师的照片", () => {
  const primary = groups.find((group) => group.id === "primary");

  assert.deepEqual(
    structuredClone(primary.teachers),
    primaryProfiles
  );
  assert.doesNotMatch(primary.description.zh, /即将加入/);
  assert.doesNotMatch(primary.description.en, /coming soon/i);
});

test("托育组加入薇、颜和 Cherry 老师的照片", () => {
  const daycare = groups.find((group) => group.id === "daycare");

  assert.deepEqual(
    structuredClone(daycare.teachers),
    daycareProfiles
  );
  assert.doesNotMatch(daycare.description.zh, /即将加入/);
  assert.doesNotMatch(daycare.description.en, /coming soon/i);
});

test("所有分组老师照片都能从网站目录加载", () => {
  const missingImages = [...newSecondaryProfiles, ...primaryProfiles, ...daycareProfiles]
    .map((teacher) => teacher.image)
    .filter((image) => !existsSync(resolve(projectRoot, image)));

  assert.deepEqual(missingImages, []);
});
