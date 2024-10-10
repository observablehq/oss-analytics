import {packages} from "../observablehq.config.js";
import {groups} from "d3";

function preview({name, href}) {
  return `<a class="card" href=${`/${name}`}>
    <h2>Daily downloads of ${name}</h2>
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="/${name}/downloads-dark.svg">
      <img style="width: 100%;" alt="Daily downloads of ${name}" src="/${name}/downloads.svg">
    </picture>
  </a>`;
}

process.stdout.write(`# Open-source analytics

This project collects [npm download counts](https://github.com/npm/registry/blob/main/docs/download-counts.md) for [Observable’s open-source projects](https://github.com/observablehq) and [D3](https://github.com/d3). These charts are built with [Observable Framework](https://observablehq.com/framework/) and updated daily on [Observable Cloud](https://observablehq.com/platform/cloud) so they can be [embedded](https://observablehq.com/framework/embeds) in our GitHub READMEs. This project is [open-source](https://github.com/observablehq/oss-analytics/); fork it to build your own embeddable charts!

<style type="text/css">

#observablehq-main a[href].card:not(:hover, :focus) {
  text-decoration: none;
}

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

.wide-grid .card {
  margin: 0;
}

</style>

${groups(packages, ({group}) => group).map(([group, packages]) => `---

## ${group}

<div class="wide-grid">
  ${packages.map(preview).join("\n  ")}
</div>`).join("\n\n")}
`);
