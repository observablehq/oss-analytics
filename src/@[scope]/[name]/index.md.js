import {parseArgs} from "node:util";
import {github} from "../../github.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

// TODO lookup github repo from npm package name…
const {body: info} = await github(`/repos/${scope}/${name}`);

// TODO get releases from npm instead of github
const {body: [release]} = await github(`/repos/${scope}/${name}/releases?per_page=1`);

process.stdout.write(`# [@${scope}/${name}](https://github.com/${scope}/${name})

${info.description}

---

<div class="grid grid-cols-4">
  <a href=https://github.com/${scope}/${name}/stargazers class="card">
    <h2>GitHub stars</h2>
    <div class="big">${info.stargazers_count.toLocaleString("en-US")}</div>
  </a>
  <a href=https://github.com/${scope}/${name}/issues class="card">
    <h2>GitHub open issues & PRs</h2>
    <div class="big">${info.open_issues_count.toLocaleString("en-US")}</div>
  </a>
  <a href=https://github.com/${scope}/${name}/releases class="card">
    <h2>Latest release</h2>
    <div class="big">${release?.name}</div>
  </a>
  <a class="card">
    <h2>npm downloads (last 7 days)</h2>
    <div class="big">$\{d3.sum(downloads.slice(0, 7), (d) => d.value).toLocaleString("en-US")}</div>
  </a>
</div>

---

~~~js
Plot.plot({
  title: "Daily downloads",
  width,
  height: 400,
  y: {label: "downloads"},
  marks: [
    Plot.axisY({anchor: "right", label: null}),
    Plot.areaY(downloads, {x: "date", y: "value", fill: "var(--theme-foreground-focus)", curve: "step", tip: true}),
    Plot.ruleY([0]),
    Plot.textX(versions, {x: "create_time", text: "version", rotate: -90, frameAnchor: "top-right", lineAnchor: "bottom", dx: -4}),
    Plot.ruleX(versions, {x: "create_time", strokeOpacity: 0.2})
  ]
})
~~~

---

TODO

- npm downloads big number ☑️
- npm downloads chart with releases ☑️
  - with 7-day moving average
  - with 28-day moving average
- npm downloads by version
- days since last release
- days since last commit
- days since last issue or discussion activity
- github open issues big number
- github issue burndown chart
- github commits by author timeline chart
- github calendar commits

---

~~~js
const downloads = FileAttachment("./downloads.json").text().then((text) => JSON.parse(text, reviver));
~~~
~~~js
const versions = FileAttachment("./versions.json").text().then((text) => JSON.parse(text, reviver));
~~~
~~~js
function reviver(key, value) {
  return typeof value === "string" && /(^|_)(date|time)$/.test(key) ? new Date(value) : value;
}
~~~

~~~js
(${JSON.stringify(info)})
~~~

~~~js
(${JSON.stringify(release)})
~~~

<style type="text/css">

#observablehq-main a[href].card:not(:hover, :focus),
#observablehq-main h1 a[href]:not(:hover, :focus) {
  text-decoration: none;
}

</style>
`);
