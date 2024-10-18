# Open-source analytics

This project collects [npm download counts](https://github.com/npm/registry/blob/main/docs/download-counts.md) for [Observable’s open-source projects](https://github.com/observablehq) and [D3](https://github.com/d3). These charts are built with [Observable Framework](https://observablehq.com/framework/) and updated daily on [Observable Cloud](https://observablehq.com/platform/cloud) so they can be [embedded](https://observablehq.com/framework/embeds) in our GitHub READMEs.

<a href="https://observablehq.observablehq.cloud/oss-analytics/@observablehq/plot">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://observablehq.observablehq.cloud/oss-analytics/@observablehq/plot/downloads-dark.svg">
    <img alt="Daily downloads of Observable Plot" src="https://observablehq.observablehq.cloud/oss-analytics/@observablehq/plot/downloads.svg">
  </picture>
</a>

<sub>Daily downloads of Observable Plot · [oss-analytics](https://observablehq.observablehq.cloud/oss-analytics/)</sub>

## How to use for your own packages

This project is [open-source](https://github.com/observablehq/oss-analytics/); you can use it to build embeddable charts of your own packages.

1. [Fork this repository.](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
2. Edit [`observablehq.config.js`](https://github.com/observablehq/oss-analytics/blob/main/observablehq.config.js) to list your npm packages, comitting your changes.
3. In your [Observable workspace](https://observablehq.com), create a new data app and link it to your forked repository.
4. In your new data app’s **Automation** tab, enable the `daily` build schedule.
5. Tweak [`index.md.js`](https://github.com/observablehq/oss-analytics/blob/main/src/index.md.js) to personalize the page.
