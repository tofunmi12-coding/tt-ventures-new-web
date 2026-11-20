import fs from "node:fs";
import path from "node:path";
import LegacyScripts from "./LegacyScripts";

const linkRoutes = [
  ["index.html", "/"],
  ["shop.html", "/shop"],
  ["contact.html", "/contact"],
  ["delivery.html", "/delivery"],
  ["returns.html", "/returns"],
  ["admin.html", "/admin"],
  ["account.html", "/account"],
  ["payment-callback.html", "/payment-callback"],
];

export default function LegacyPage({ file }) {
  const filePath = path.join(process.cwd(), "public", file);
  const document = fs.readFileSync(filePath, "utf8");
  const bodyMatch = document.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  const bodyAttributes = bodyMatch?.[1] ?? "";
  let markup = bodyMatch?.[2] ?? "";
  const scriptSources = [...document.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script\s*>/gi)]
    .map((match) => match[1].replace(/^\//, ""));

  markup = markup.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  for (const [oldPath, newPath] of linkRoutes) {
    markup = markup.replaceAll(oldPath, newPath);
  }

  const bodyClass = bodyAttributes.match(/\bclass=["']([^"']*)["']/i)?.[1] ?? "";
  const scripts = [...new Set(scriptSources)];

  return (
    <>
      <div
        className={`legacy-page-content ${bodyClass}`.trim()}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <LegacyScripts sources={scripts} />
    </>
  );
}
