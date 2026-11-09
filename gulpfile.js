const path = require("path");
const { task, src, dest } = require("gulp");

// Copies node/credential icons into dist (the n8n community-node starter
// convention - tsc only emits .js/.d.ts).
task("build:icons", copyIcons);

function copyIcons() {
  const nodeSource = path.resolve("nodes", "**", "*.{png,svg}");
  const nodeDestination = path.resolve("dist", "nodes");
  src(nodeSource).pipe(dest(nodeDestination));
  const credSource = path.resolve("credentials", "**", "*.{png,svg}");
  const credDestination = path.resolve("dist", "credentials");
  return src(credSource).pipe(dest(credDestination));
}
