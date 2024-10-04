import {observableNames, d3Names} from "../observablehq.config.js";

const repoMap = new Map([
  ...d3Names.map((name) => [name, `https://github.com/d3/${name}`]),
  ...observableNames.map((name) => [name, `https://github.com/${name.replace(/^@/, "")}`]),
  ["htl", "https://github.com/observablehq/htl"]
]);

function getRepo(name) {
  if (!repoMap.has(name)) throw new Error(`unknown repo: ${name}`);
  return repoMap.get(name);
}

function preview(name) {
  return `<div class="card" style="margin: 0;">
    <h2>Daily downloads of <a href=${getRepo(name)}>${name}</a></h2>
    <a href=${getRepo(name)}>
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="/${name}/downloads-dark.svg">
        <img style="width: 100%;" alt="Daily downloads of Observable Plot" src="/${name}/downloads.svg">
      </picture>
    </a>
  </div>`;
}

process.stdout.write(`# Open-source analytics

This project collects [npm download counts](https://github.com/npm/registry/blob/main/docs/download-counts.md) for [Observable’s open-source projects](https://github.com/observablehq) and [D3](https://github.com/d3). These charts are built with [Observable Framework](https://observablehq.com/framework/) and updated daily on [Observable Cloud](https://observablehq.com/platform/cloud) so they can be [embedded](https://observablehq.com/framework/embeds) in our GitHub READMEs. This project is [open-source](https://github.com/observablehq/oss-analytics/); fork it to build your own embeddable charts!

<style type="text/css">

.wide-grid {
  margin: 1rem 0;
  display: grid;
  gap: 1rem;
}

@container (min-width: 480px) {
  .wide-grid {
    grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  }
}

</style>

---

## Observable

<div class="wide-grid">
  ${observableNames.map(preview).join("\n")}
</div>

---

## D3

<div class="wide-grid">
  ${d3Names.map(preview).join("\n")}
</div>
`);
