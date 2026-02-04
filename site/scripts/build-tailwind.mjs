import { compile } from "tailwindcss";
import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, "src");
const outputFile = path.join(srcDir, "tailwind.generated.css");

const simpleClasses = new Set([
  "flex",
  "grid",
  "block",
  "hidden",
  "table",
  "border",
  "sticky",
  "absolute",
  "relative",
  "fixed",
  "uppercase",
  "italic",
  "transition",
]);

const tokenPattern = /^[a-z0-9][a-z0-9-:/]*$/i;

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractCandidates(content) {
  const candidates = new Set();
  const stringRegex = /`([^`]*)`|"([^"]*)"|'([^']*)'/g;
  const matches = content.matchAll(stringRegex);

  for (const match of matches) {
    const raw = match[1] ?? match[2] ?? match[3] ?? "";
    const dynamicSegments = raw.match(/\$\{[^}]+\}/g) ?? [];
    const cleaned = raw.replace(/\$\{[^}]+\}/g, " ");
    const tokens = cleaned
      .replace(/[^A-Za-z0-9-:/\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    for (const token of tokens) {
      if (!tokenPattern.test(token)) continue;
      if (token.includes("http") || token.includes("https")) continue;
      if (token.includes(".")) continue;

      const hasSeparator =
        token.includes("-") || token.includes(":") || token.includes("/");
      if (hasSeparator || simpleClasses.has(token)) {
        candidates.add(token);
      }
    }

    for (const segment of dynamicSegments) {
      const segmentMatches = segment.matchAll(/"([^"]+)"|'([^']+)'/g);
      for (const segmentMatch of segmentMatches) {
        const segmentRaw = segmentMatch[1] ?? segmentMatch[2] ?? "";
        const segmentTokens = segmentRaw
          .replace(/[^A-Za-z0-9-:/\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean);
        for (const token of segmentTokens) {
          if (!tokenPattern.test(token)) continue;
          if (token.includes("http") || token.includes("https")) continue;
          if (token.includes(".")) continue;
          const hasSeparator =
            token.includes("-") || token.includes(":") || token.includes("/");
          if (hasSeparator || simpleClasses.has(token)) {
            candidates.add(token);
          }
        }
      }
    }
  }

  return candidates;
}

async function buildTailwind() {
  const files = await collectFiles(srcDir);
  files.push(path.join(projectRoot, "index.html"));

  const candidates = new Set();
  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx") && !file.endsWith(".html")) {
      continue;
    }
    const content = await fs.readFile(file, "utf8");
    for (const candidate of extractCandidates(content)) {
      candidates.add(candidate);
    }
  }

  const baseCss = await fs.readFile(
    path.join(projectRoot, "node_modules", "tailwindcss", "index.css"),
    "utf8",
  );
  const compiler = await compile(baseCss);
  const css = compiler.build(Array.from(candidates));

  await fs.writeFile(outputFile, css, "utf8");
}

buildTailwind();
