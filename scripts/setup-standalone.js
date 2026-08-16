const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");

const copies = [
  {
    label: "public",
    source: path.join(rootDir, "public"),
    destination: path.join(standaloneDir, "public"),
  },
  {
    label: ".next/static",
    source: path.join(rootDir, ".next", "static"),
    destination: path.join(standaloneNextDir, "static"),
  },
  {
    label: ".next/server",
    source: path.join(rootDir, ".next", "server"),
    destination: path.join(standaloneNextDir, "server"),
  },
];

function log(message) {
  console.log(`[standalone] ${message}`);
}

function copyDirectory({ label, source, destination }) {
  if (!fs.existsSync(source)) {
    log(`Skipped ${label}; source folder not found.`);
    return;
  }

  fs.mkdirSync(path.dirname(destination), {
    recursive: true,
  });

  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
  });

  log(`Copied ${label} → ${path.relative(rootDir, destination)}`);
}

if (!fs.existsSync(standaloneDir)) {
  log("Skipped asset copy; .next/standalone was not generated.");
  process.exit(1);
}

fs.mkdirSync(standaloneNextDir, {
  recursive: true,
});

log("Ensured .next/standalone/.next exists.");

copies.forEach(copyDirectory);

log("Standalone asset setup complete.");