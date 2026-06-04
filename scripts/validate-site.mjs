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
const robots = readFileSync(join(publicDir, "robots.txt"), "utf8");
const sitemap = readFileSync(join(publicDir, "sitemap.xml"), "utf8");

const finalAssets = readdirSync(assetsDir).filter((file) => /^gabriela-template-\d{2}\.jpg$/.test(file));
const webpAssets = readdirSync(assetsDir).filter((file) => /^gabriela-template-\d{2}\.webp$/.test(file));
const originalAssets = readdirSync(docsDir).filter((file) => /^\d+\.png$/.test(file));
const publishedTemplates = ["01", "02", "03", "04", "05", "06", "09", "10", "11", "12"];
const removedTemplates = ["07", "08"];

check(finalAssets.length === publishedTemplates.length, `esperava ${publishedTemplates.length} assets finais, encontrei ${finalAssets.length}`);
check(webpAssets.length === publishedTemplates.length, `esperava ${publishedTemplates.length} assets WebP, encontrei ${webpAssets.length}`);
check(originalAssets.length === 12, `esperava 12 templates originais, encontrei ${originalAssets.length}`);

for (const templateId of publishedTemplates) {
  const file = `gabriela-template-${templateId}.jpg`;
  const webpFile = file.replace(".jpg", ".webp");
  check(html.includes(`assets/${file}`), `asset ${file} não está referenciado no HTML`);
  check(html.includes(`assets/${webpFile}`), `asset ${webpFile} não está referenciado no HTML`);
  check(existsSync(join(assetsDir, file)), `asset ${file} não existe`);
  check(existsSync(join(assetsDir, webpFile)), `asset ${webpFile} não existe`);
  check(statSync(join(assetsDir, file)).size < 500_000, `asset ${file} está maior que 500 KB`);
  check(statSync(join(assetsDir, webpFile)).size < statSync(join(assetsDir, file)).size, `asset ${webpFile} não está menor que o JPG`);
}

removedTemplates.forEach((templateId) => {
  const jpgFile = `gabriela-template-${templateId}.jpg`;
  const webpFile = `gabriela-template-${templateId}.webp`;
  check(!html.includes(`assets/${jpgFile}`), `asset removido ${jpgFile} ainda está referenciado no HTML`);
  check(!html.includes(`assets/${webpFile}`), `asset removido ${webpFile} ainda está referenciado no HTML`);
  check(!existsSync(join(assetsDir, jpgFile)), `asset removido ${jpgFile} ainda existe em public/assets`);
  check(!existsSync(join(assetsDir, webpFile)), `asset removido ${webpFile} ainda existe em public/assets`);
});

const rootImages = readdirSync(root).filter((file) => /\.(png|jpe?g|webp)$/i.test(file));
check(rootImages.length === 0, `há imagens soltas na raiz: ${rootImages.join(", ")}`);

const h1Matches = html.match(/<h1[\s>]/gi) || [];
check(h1Matches.length === 1, `esperava 1 H1, encontrei ${h1Matches.length}`);
const pictureMatches = html.match(/<picture>/g) || [];
check(pictureMatches.length === publishedTemplates.length, `esperava ${publishedTemplates.length} picture tags, encontrei ${pictureMatches.length}`);
const sectionCopyMatches = html.match(/class="section-copy sr-only"/g) || [];
check(sectionCopyMatches.length === publishedTemplates.length, `esperava ${publishedTemplates.length} blocos de texto por seção, encontrei ${sectionCopyMatches.length}`);
check(html.includes('<meta name="robots" content="index, follow"'), "meta robots ausente");
check(html.includes('<link rel="canonical" href="https://'), "canonical absoluto ausente");
check(robots.includes("Sitemap: https://advogada-gabriela.vercel.app/sitemap.xml"), "robots sem sitemap final");
check(sitemap.includes("<loc>https://advogada-gabriela.vercel.app/</loc>"), "sitemap sem URL final");
check(html.includes("Advogada de Inventários e de Imóveis"), "bloco de autoridade direto ausente");
check(html.includes("Regularize o imóvel, resolva o inventário e proteja o patrimônio da sua família com orientação jurídica clara e segura."), "CTA persuasivo final ausente");
check(html.includes("Advogada de Inventários e de Imóveis, com atuação voltada à regularização patrimonial, sucessões e segurança jurídica familiar."), "frase de autoridade da seção sobre ausente");
check(html.includes("Advogada em Iraí/RS para inventários, imóveis e regularização patrimonial."), "frase de SEO local agressiva ausente");

[
  "advogada em Iraí/RS",
  "inventário em Iraí",
  "regularização de imóveis no RS",
  "advogada de inventário online",
].forEach((term) => check(html.includes(term), `termo de SEO local ausente: ${term}`));

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
