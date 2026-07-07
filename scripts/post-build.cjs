/**
 * post-build.cjs — 构建后补全 electron-builder --publish never 缺失的文件
 *
 * electron-builder 在 --publish never 模式下不会生成 app-update.yml，
 * 便携版（zip）启动时的 install surface check 会因此失败。
 * 此脚本在 electron-builder 完成后自动补写。
 */
const fs = require("fs");
const path = require("path");

const REPO_OWNER = "Libai-88";
const REPO_NAME = "couple";

function writeAppUpdateYml(unpackedDir) {
  const ymlPath = path.join(unpackedDir, "resources", "app-update.yml");
  const content = `provider: github\nowner: ${REPO_OWNER}\nrepo: ${REPO_NAME}\n`;
  fs.mkdirSync(path.dirname(ymlPath), { recursive: true });
  fs.writeFileSync(ymlPath, content, "utf-8");
  console.log(`[post-build] wrote ${ymlPath}`);
}

// 查找 dist 下的 unpacked 目录
const distDir = path.join(__dirname, "..", "dist");
const entries = fs.readdirSync(distDir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory() && entry.name.endsWith("-unpacked")) {
    const unpackedDir = path.join(distDir, entry.name);
    if (fs.existsSync(path.join(unpackedDir, "resources"))) {
      writeAppUpdateYml(unpackedDir);
    }
  }
}
