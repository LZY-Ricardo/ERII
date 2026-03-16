import { load } from "cheerio";
import TurndownService from "turndown";
import * as turndownPluginGfm from "turndown-plugin-gfm";

const { gfm } = turndownPluginGfm;

function normalizeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  return raw;
}

function trimTrailingNewlines(value) {
  return String(value ?? "").replace(/\s+$/, "");
}

function collapseMarkdownWhitespace(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractLanguage(node) {
  const className = String(
    node?.getAttribute?.("class") ??
      node?.firstElementChild?.getAttribute?.("class") ??
      ""
  ).trim();

  const patterns = [
    /language-([a-z0-9_+-]+)/i,
    /lang-([a-z0-9_+-]+)/i,
    /hljs\s+([a-z0-9_+-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = className.match(pattern);
    if (match?.[1]) return match[1].toLowerCase();
  }

  const datasetLanguage =
    String(node?.getAttribute?.("data-language") ?? "").trim() ||
    String(node?.getAttribute?.("data-lang") ?? "").trim();

  return datasetLanguage.toLowerCase();
}

function createTurndownService() {
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    headingStyle: "atx",
    hr: "---",
    strongDelimiter: "**",
  });

  service.use(gfm);

  service.remove(["style", "script", "noscript", "iframe", "button"]);

  service.addRule("juejinFigureImage", {
    filter(node) {
      return (
        node.nodeName === "FIGURE" &&
        typeof node.querySelector === "function" &&
        Boolean(node.querySelector("img"))
      );
    },
    replacement(_content, node) {
      const imageNode = node.querySelector("img");
      if (!imageNode) return "";

      const src = normalizeUrl(imageNode.getAttribute("src"));
      if (!src) return "";

      const alt = String(imageNode.getAttribute("alt") ?? "").trim();
      const caption = String(node.querySelector("figcaption")?.textContent ?? "").trim();
      const markdown = `![${alt}](${src})`;

      return caption ? `\n\n${markdown}\n\n*${caption}*\n\n` : `\n\n${markdown}\n\n`;
    },
  });

  service.addRule("juejinPreCode", {
    filter(node) {
      return node.nodeName === "PRE";
    },
    replacement(_content, node) {
      const codeNode =
        typeof node.querySelector === "function" ? node.querySelector("code") : null;
      const code = trimTrailingNewlines(codeNode?.textContent ?? node.textContent ?? "");
      const language = extractLanguage(codeNode ?? node);

      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    },
  });

  service.addRule("juejinTaskListCheckbox", {
    filter(node) {
      return node.nodeName === "INPUT" && node.getAttribute("type") === "checkbox";
    },
    replacement(_content, node) {
      return node.hasAttribute("checked") ? "[x] " : "[ ] ";
    },
  });

  return service;
}

export function sanitizeImportedHtml(html) {
  const $ = load(`<article>${String(html ?? "")}</article>`);
  const root = $("article");

  root.find("style, script, noscript, iframe, button").remove();
  root
    .find(
      ".copy-code-btn, .code-block-extension-header, .code-block-extension-fold, .juejin-article-banner, .header-anchor"
    )
    .remove();

  root.find("a").each((_, element) => {
    const current = normalizeUrl($(element).attr("href"));
    if (current) {
      $(element).attr("href", current);
    }
  });

  root.find("img").each((_, element) => {
    const nextSrc = normalizeUrl(
      $(element).attr("src") ||
        $(element).attr("data-src") ||
        $(element).attr("data-original")
    );

    if (nextSrc) {
      $(element).attr("src", nextSrc);
    }

    $(element).removeAttr("srcset");
    $(element).removeAttr("loading");
    $(element).removeAttr("decoding");
  });

  root.find("*").each((_, element) => {
    for (const name of Object.keys(element.attribs ?? {})) {
      if (name === "style") {
        $(element).removeAttr(name);
      }
      if (name.startsWith("data-") && name !== "data-language" && name !== "data-lang") {
        $(element).removeAttr(name);
      }
    }
  });

  return root.html() || "";
}

export function htmlToMarkdown(html) {
  const cleanedHtml = sanitizeImportedHtml(html);
  if (!cleanedHtml) return "";

  const service = createTurndownService();
  const markdown = service.turndown(cleanedHtml);

  return collapseMarkdownWhitespace(markdown);
}
