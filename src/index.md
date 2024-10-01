# Open-source analytics

```js
function preview([name, lightFile, darkFile]) {
  return html`<div class="card" style="max-width: 640px;">
  <h2>Daily downloads of ${name}</h2>
  <img style="max-width: 100%;" src=${(dark ? darkFile : lightFile).href}>
</div>`;
}
```

${[
  ["@observablehq/plot", FileAttachment("@observablehq/plot/downloads.svg"), FileAttachment("@observablehq/plot/downloads-dark.svg")],
  ["@observablehq/framework", FileAttachment("@observablehq/framework/downloads.svg"), FileAttachment("@observablehq/framework/downloads-dark.svg")],
  ["@observablehq/runtime", FileAttachment("@observablehq/runtime/downloads.svg"), FileAttachment("@observablehq/runtime/downloads-dark.svg")],
  ["@observablehq/inputs", FileAttachment("@observablehq/inputs/downloads.svg"), FileAttachment("@observablehq/inputs/downloads-dark.svg")],
  ["d3", FileAttachment("d3/downloads.svg"), FileAttachment("d3/downloads-dark.svg")],
  ["htl", FileAttachment("htl/downloads.svg"), FileAttachment("htl/downloads-dark.svg")]
].map(preview)}
