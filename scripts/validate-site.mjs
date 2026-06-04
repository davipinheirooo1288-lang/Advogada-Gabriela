import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
const assetsDir = join(publicDir, "assets");
const docsDir = join(root, "docs", "template-original");
const required = [
  "public/index.html",
  "public/styles.css",
  "public/script.js",
  "package.json",
  "vercel.json",
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

required.forEach((file) => check(existsSync(join(root, file)), `${file} não existe`));

const html = readFileSync(join(publicDir, "index.html"), "utf8");
const css = readFileSync(join(publicDir, "styles.css"), "utf8");
const js = readFileSync(join(publicDir, "script.js"), "utf8");

const finalAssets = readdirSync(assetsDir).filter((file) => /^gabriela-template-\d{2}\.jpg$/.test(file));
const webpAssets = readdirSync(assetsDir).filter((file) => /^gabriela-template-\d{2}\.webp$/.test(file));
const originalAssets = readdirSync(docsDir).filter((file) => /^\d+\.png$/.test(file));

check(finalAssets.length === 12, `esperava 12 assets finais, encontrei ${finalAssets.length}`);
check(webpAssets.length === 12, `esperava 12 assets WebP, encontrei ${webpAssets.length}`);
check(originalAssets.length === 12, `esperava 12 templates originais, encontrei ${originalAssets.length}`);

for (let index = 1; index <= 12; index += 1) {
  const file = `gabriela-template-${String(index).padStart(2, "0")}.jpg`;
  const webpFile = file.replace(".jpg", ".webp");
  check(html.includes(`assets/${file}`), `asset ${file} não está referenciado no HTML`);
  check(html.includes(`assets/${webpFile}`), `asset ${webpFile} não está referenciado no HTML`);
  check(existsSync(join(assetsDir, file)), `asset ${file} não existe`);
  check(existsSync(join(assetsDir, webpFile)), `asset ${webpFile} não existe`);
  check(statSync(join(assetsDir, file)).size < 500_000, `asset ${file} está maior que 500 KB`);
  check(statSync(join(assetsDir, webpFile)).size < statSync(join(assetsDir, file)).size, `asset ${webpFile} não está menor que o JPG`);
}

const rootImages = readdirSync(root).filter((file) => /\.(png|jpe?g|webp)$/i.test(file));
check(rootImages.length === 0, `há imagens soltas na raiz: ${rootImages.join(", ")}`);

const h1Matches = html.match(/<h1[\s>]/gi) || [];
check(h1Matches.length === 1, `esperava 1 H1, encontrei ${h1Matches.length}`);
const pictureMatches = html.match(/<picture>/g) || [];
check(pictureMatches.length === 12, `esperava 12 picture tags, encontrei ${pictureMatches.length}`);
const sectionCopyMatches = html.match(/class="section-copy sr-only"/g) || [];
check(sectionCopyMatches.length === 12, `esperava 12 blocos de texto por seção, encontrei ${sectionCopyMatches.length}`);
check(html.includes('<meta name="robots" content="index, follow"'), "meta robots ausente");
check(html.includes('<link rel="canonical" href="https://'), "canonical absoluto ausente");

const faqDetails = html.match(/<details class="faq-item"/g) || [];
check(html.includes("faq-answers-panel"), "FAQ com respostas visíveis ausente");
check(faqDetails.length === 8, `esperava 8 respostas no FAQ, encontrei ${faqDetails.length}`);

const linkMatches = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/gi)];
check(linkMatches.length > 0, "nenhum link encontrado");
linkMatches.forEach((match) => {
  const href = match[1];
  check(href && href !== "#" && !href.startsWith("javascript:"), `link inválido: ${href}`);
});

check(html.includes("application/ld+json"), "JSON-LD ausente");
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (jsonLdMatch) {
  try {
    const schema = JSON.parse(jsonLdMatch[1]);
    check(schema["@type"] === "LegalService", "schema não é LegalService");
    check(Boolean(schema.telephone), "schema sem telefone");
    check(Boolean(schema.email), "schema sem e-mail");
  } catch (error) {
    failures.push(`JSON-LD inválido: ${error.message}`);
  }
}

check(css.includes("prefers-reduced-motion"), "CSS sem suporte a prefers-reduced-motion");
check(css.includes("overflow-x: hidden"), "CSS sem proteção contra overflow horizontal");
check(js.includes("IntersectionObserver"), "JS sem animação por IntersectionObserver");
check(js.includes("encodeURIComponent"), "JS não compõe mensagem contextual do WhatsApp");
check(js.includes("faqTarget"), "JS não conecta perguntas do template às respostas do FAQ");

if (failures.length) {
  console.error("Falhas de validação:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Validação estática concluída com sucesso.");
console.log(`Assets finais: ${finalAssets.length}`);
console.log(`Assets WebP: ${webpAssets.length}`);
console.log(`Templates originais preservados: ${originalAssets.length}`);
console.log(`Links verificados: ${linkMatches.length}`);
