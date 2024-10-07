# Open-source analytics

This project collects [npm download counts](https://github.com/npm/registry/blob/main/docs/download-counts.md) for [Observable’s open-source projects](https://github.com/observablehq) and [D3](https://github.com/d3). These charts are built with [Observable Framework](https://observablehq.com/framework/) and updated daily on [Observable Cloud](https://observablehq.com/platform/cloud) so they can be [embedded](https://observablehq.com/framework/embeds) in our GitHub READMEs.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://observablehq.observablehq.cloud/oss-analytics/@observablehq/plot/downloads-dark.svg">
  <img alt="Daily downloads of Observable Plot" src="https://observablehq.observablehq.cloud/oss-analytics/@observablehq/plot/downloads.svg">
</picture>

<sub>Daily downloads of Observable Plot · [oss-analytics](https://observablehq.observablehq.cloud/oss-analytics/)</sub>


## How to use for your own packages

This project is [open-source](https://github.com/observablehq/oss-analytics/); fork it to build your own embeddable charts.

1. Edit [observablehq.config.js](https://github.com/observablehq/oss-analytics/blob/main/observablehq.config.js) to list your npm packages.
2. In your Observable account, add a new data app and link it to the forked repo.
3. In the data app’s Automation tab, set a the build schedule to “daily”.
4. Tweak [index.md.js](https://github.com/observablehq/oss-analytics/blob/main/src/index.md.js) to personalize the page.
