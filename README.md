# Gabriela Luiza Baldin Advocacia

Landing page estatica criada a partir dos templates originais da cliente, preservando identidade visual, ordem das secoes e composicao.

## Estrutura

- `public/index.html`: pagina publicada.
- `public/styles.css`: estilos, animacoes e responsividade.
- `public/script.js`: mensagens contextuais de WhatsApp, animacoes e FAQ.
- `public/assets/`: imagens finais otimizadas em WebP com fallback JPG.
- `docs/template-original/`: templates PNG originais.
- `scripts/validate-site.mjs`: validacao estatica do pacote.

## Validacao

```bash
npm run validate
```

O validador confere assets, WebP, fallback JPG, canonical, robots, blocos de texto por secao, JSON-LD, FAQ e links principais.

## Publicacao

O `vercel.json` publica a pasta `public/`.

Quando trocar para dominio proprio, atualize:

- `public/index.html`: canonical, `og:url` e `url` do JSON-LD.
- `public/sitemap.xml`: URL final.
