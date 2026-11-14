#!/usr/bin/env node
// Dummy Store (Next.js ecommerce template) by Abhishek Pal.
// Builds ecommerce-template-share/: setup and sync scripts that each carry the whole project
// (code, config, package-lock.json) compressed inside one copy-pasteable .mjs file.
// Run: npm run share
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const PROJECT = pkg.name; // folder name on the other machine and the project check
const TITLE = "Dummy Store ecommerce template";
const SHARE_DIR = `${PROJECT}-share`;
const OUT_DIR = join(ROOT, SHARE_DIR);
const SETUP = `setup-${PROJECT}.mjs`;
const SYNC = `sync-${PROJECT}.mjs`;

const SKIP_DIRS = new Set(["node_modules", ".next", "out", ".git", SHARE_DIR, ".sync-backup", ".vercel", ".claude", ".data"]);
const SKIP_FILES = [/\.tsbuildinfo$/, /^next-env\.d\.ts$/, /^\.env(?!\.example)/, /\.log$/];
const BINARY = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".woff", ".woff2"]);
/** Files from older versions to move aside when updating. Add paths here when you remove or rename a file. */
const OBSOLETE = [];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...walk(full));
    } else if (!SKIP_FILES.some((re) => re.test(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(ROOT)
  .map((full) => relative(ROOT, full).split("\\").join("/"))
  .sort()
  .map((p) => {
    const data = readFileSync(join(ROOT, p));
    const binary = BINARY.has(extname(p).toLowerCase());
    return {
      p,
      e: binary ? "base64" : "utf8",
      c: data.toString(binary ? "base64" : "utf8"),
      h: createHash("sha256").update(data).digest("hex").slice(0, 16),
    };
  });

const payload = gzipSync(JSON.stringify({ files }), { level: 9 }).toString("base64");
const payloadHash = createHash("sha256").update(payload).digest("hex").slice(0, 16);
const built = new Date().toISOString().slice(0, 16).replace("T", " ");

// The payload sits in comment lines at the end of the script. A paste that gets cut off is still
// valid JavaScript, so the script can report the damage instead of failing with a syntax error.
const payloadLines = payload.match(/.{1,100}/g).map((line) => "//~ " + line);

// Runtime of the generated scripts. Kept as a plain function so it is syntax-checked here too;
// it is serialised with Function.prototype.toString().
//   mode "setup": creates the project (in ./<PROJECT>) or updates it in place.
//   mode "sync":  only updates an existing project and makes it identical to this version:
//                 files that are no longer part of the project are moved to .sync-backup/.
function run(req, opts, scriptPath) {
  const { PROJECT, TITLE, OBSOLETE, PAYLOAD_HASH, MODE } = opts;
  const { createHash } = req("node:crypto");
  const { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } = req("node:fs");
  const { dirname, join, relative, resolve } = req("node:path");
  const { gunzipSync } = req("node:zlib");
  const sha = (data) => createHash("sha256").update(data).digest("hex").slice(0, 16);

  const damaged = () => {
    console.error("This script is damaged (the paste was probably cut off or changed). Copy it again in full.");
    process.exit(1);
  };
  const lines = readFileSync(scriptPath, "utf8").split(/\r?\n/);
  if (!lines.some((l) => l.trim() === "//~END")) damaged();
  const payload = lines
    .filter((l) => l.startsWith("//~ "))
    .map((l) => l.slice(4).trim())
    .join("");
  if (sha(payload) !== PAYLOAD_HASH) damaged();
  let files = [];
  try {
    files = JSON.parse(gunzipSync(Buffer.from(payload, "base64")).toString("utf8")).files;
  } catch {
    damaged();
  }

  const isProject = (dir) => {
    try {
      return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name === PROJECT;
    } catch {
      return false;
    }
  };
  const base = process.argv[2] ? resolve(process.argv[2]) : process.cwd();
  const target = isProject(base) ? base : join(base, PROJECT);
  const fresh = !isProject(target);
  if (fresh && MODE === "sync") {
    console.error("Could not find the " + PROJECT + " project in: " + base);
    console.error("Run this inside the project folder (the one with package.json), or pass the path as an argument.");
    console.error("For a new laptop use setup-" + PROJECT + ".mjs instead.");
    process.exit(1);
  }
  if (fresh && existsSync(join(target, "package.json"))) {
    console.error("A different project already exists in " + target + ". Run this somewhere else.");
    process.exit(1);
  }
  console.log(TITLE + " (by Abhishek Pal) - " + (MODE === "sync" ? "FULL SYNC" : fresh ? "creating project" : "updating project"));
  console.log("Folder: " + target + "\n");
  const hashOf = (p) => (existsSync(join(target, p)) ? sha(readFileSync(join(target, p))) : "none");
  const depsBefore = hashOf("package.json") + hashOf("package-lock.json");

  // Old files are moved, never deleted, so local work can be recovered.
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const stash = (p) => {
    const dest = join(target, ".sync-backup", stamp, p);
    mkdirSync(dirname(dest), { recursive: true });
    renameSync(join(target, p), dest);
    console.log("  moved    " + p + "  ->  .sync-backup/" + stamp + "/");
  };

  let written = 0;
  let unchanged = 0;
  let removed = 0;
  for (const f of files) {
    const dest = join(target, f.p);
    const data = Buffer.from(f.c, f.e);
    if (existsSync(dest) && readFileSync(dest).equals(data)) {
      unchanged++;
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, data);
    written++;
    console.log("  wrote    " + f.p);
  }
  const stale = new Set(OBSOLETE.filter((p) => existsSync(join(target, p))));
  if (MODE === "sync") {
    const keep = new Set(files.map((f) => f.p));
    const walk = (dir) => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const p = relative(target, full).split("\\").join("/");
          if (!keep.has(p)) stale.add(p);
        }
      }
    };
    for (const dir of ["src", "public", "scripts"]) walk(join(target, dir));
  }
  for (const p of stale) {
    stash(p);
    removed++;
  }

  const bad = files.filter((f) => {
    const dest = join(target, f.p);
    return !existsSync(dest) || sha(readFileSync(dest)) !== f.h;
  });
  console.log("\nDone: " + written + " written, " + unchanged + " already up to date, " + removed + " old files moved to .sync-backup.");
  if (bad.length) {
    console.error("WARNING: these files are missing or did not verify: " + bad.map((f) => f.p).join(", "));
    process.exit(1);
  }
  console.log("All " + files.length + " files verified.\n");
  console.log("Next:");
  if (base !== target) console.log('  cd "' + target + '"');
  const depsChanged = depsBefore !== hashOf("package.json") + hashOf("package-lock.json");
  if (!existsSync(join(target, "node_modules")) || depsChanged) {
    console.log("  npm install" + (depsChanged && !fresh ? "      (dependencies changed)" : ""));
  }
  console.log("  npm run dev      -> http://localhost:3000");
}

const HEADERS = {
  setup: [
    `// ${TITLE} by Abhishek Pal - setup / update script (${files.length} files, built ${built} UTC).`,
    `// New machine:  put this file in any folder and run  node ${SETUP}`,
    `//               it creates a "${PROJECT}" folder there.`,
    `// Update:       run it inside the existing ${PROJECT} folder (the one with package.json).`,
    "// Then:         npm install   and   npm run dev",
  ],
  sync: [
    `// ${TITLE} by Abhishek Pal - FULL SYNC (${files.length} files, built ${built} UTC).`,
    "// Makes an existing project identical to this version, whatever version it had before.",
    `// Run inside the project folder (the one with package.json):  node ${SYNC}`,
    "// Files that are no longer part of the project are moved to .sync-backup/ (never deleted).",
  ],
};

function buildScript(mode) {
  const opts = { PROJECT, TITLE, OBSOLETE, PAYLOAD_HASH: payloadHash, MODE: mode };
  return [
    "#!/usr/bin/env node",
    ...HEADERS[mode],
    'import { createRequire } from "node:module";',
    'import { fileURLToPath } from "node:url";',
    "",
    run.toString(),
    "",
    `run(createRequire(import.meta.url), ${JSON.stringify(opts)}, fileURLToPath(import.meta.url));`,
    "",
    "// ---- compressed project files (do not edit below this line) ----",
    ...payloadLines,
    "//~END",
    "",
  ].join("\n");
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, SETUP), buildScript("setup"));
writeFileSync(join(OUT_DIR, SYNC), buildScript("sync"));
const sizeKb = Math.round(statSync(join(OUT_DIR, SETUP)).size / 1024);

writeFileSync(
  join(OUT_DIR, "HOW-TO-SETUP.md"),
  `# ${TITLE} - set up or update on another laptop

By Abhishek Pal. A colorful, customizable Next.js store (shop, product pages with photo reviews, cart,
wishlist, checkout) with an admin CMS at /admin, 6 color themes and light/dark mode.

Built ${built} UTC. Both scripts contain the whole project compressed, including \`package-lock.json\`,
and check every file after writing.

| Script | Use it for |
| --- | --- |
| \`${SETUP}\` (${sizeKb} KB) | New laptop: creates the \`${PROJECT}\` folder |
| \`${SYNC}\` (${sizeKb} KB) | Existing copy, any older version: makes it identical to this version |

## New laptop

1. Install Node.js 20.9 or newer (\`node -v\` to check).
2. Put \`${SETUP}\` in any folder (for example Downloads) and open a terminal there.
3. Run:

   \`\`\`bash
   node ${SETUP}
   cd ${PROJECT}
   npm install
   npm run dev
   \`\`\`

4. Open http://localhost:3000 (store) and http://localhost:3000/admin (password: admin)

## Update an existing copy (sync)

1. Copy \`${SYNC}\` into the \`${PROJECT}\` folder (the one with \`package.json\` and \`src\`).
2. Run \`node ${SYNC}\`. It ends with \`All ${files.length} files verified.\`
3. If it prints \`npm install (dependencies changed)\`, run \`npm install\`. Then \`npm run dev\`.

Files in \`src\`, \`public\` or \`scripts\` that are no longer part of the project are moved to
\`.sync-backup/<date>/\`, not deleted. Delete that folder once you've checked nothing in it is yours.

If it says \`Could not find the ${PROJECT} project\`, you are in the wrong folder: \`cd\` into it,
or pass the path: \`node ${SYNC} "C:\\path\\to\\${PROJECT}"\`.

Delete the sync file from the project folder afterwards.

## Sharing through codeshare or chat

Paste the whole file into a new file named \`${SETUP}\`.
If it says \`This script is damaged\`, the paste was cut off: copy it again in full.

## Customize

| File | What it controls |
| --- | --- |
| \`src/config/site.ts\` | Store name, announcement bar, currency, shipping, tax, coupons, nav, footer |
| \`src/config/theme.ts\` | Color palettes, default palette and mode, corner radius |
| \`src/app/globals.css\` | Light/dark neutral colors, button, card and input styles |
| \`src/config/admin.ts\` | Admin navigation and limits |
| Admin portal (\`/admin\`) | Products, images, categories, reviews and orders |
| \`src/server/repo.ts\` | Data access: replace with your database |
| \`src/server/actions/store.ts\` | Order placement: connect a payment provider |

## Notes

- Not included: \`node_modules\`, \`.next\`, \`out\` (rebuilt by npm) and \`.data\` (your products, orders
  and uploads; a fresh copy starts from the demo data).
- For \`npm run build && npm start\`, create \`.env.local\` with \`ADMIN_PASSWORD\` and \`ADMIN_SECRET\` (see README.md).
- Rebuild these scripts after changes with \`npm run share\`.
`,
);
console.log(`Wrote ${SETUP} and ${SYNC} (${files.length} files, ${sizeKb} KB each) and HOW-TO-SETUP.md in ${relative(ROOT, OUT_DIR)}`);
