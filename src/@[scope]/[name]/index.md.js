import {parseArgs} from "node:util";
import {sum} from "d3-array";
import {utcDay} from "d3-time";
import {format as formatIso} from "isoformat";
import {github} from "../../github.js";
import {getNpmDownloadsByDate, getNpmDownloadsByVersion, getNpmPackage} from "../../npm.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

// TODO This assumes that the GitHub repo name corresponds to the npm package
// name (and scope), but that isn’t guaranteed. We could either create a set of
// manual overrides here (e.g., for htl), or we could fetch the package.json
// from the GitHub repo and find the corresponding npm package name.

const today = utcDay();

const [{body: githubInfo}, npmInfo, downloads, downloadsByVersion] = await Promise.all([
  github(`/repos/${scope}/${name}`),
  getNpmPackage(`@${scope}/${name}`),
  getNpmDownloadsByDate(`@${scope}/${name}`),
  getNpmDownloadsByVersion(`@${scope}/${name}`)
]);

const versions = [];

for (const version in npmInfo.versions) {
  if (isPrerelease(version)) continue;
  versions.push({
    version,
    date: npmInfo.time[version] ? new Date(npmInfo.time[version]) : undefined,
    downloads: downloadsByVersion.downloads[version]
  });
}

versions.sort((a, b) => a.date - b.date);

function replacer(key, value) {
  return value && /(_|^)(date|time)$/.test(key) ? formatIso(new Date(value)) : value;
}

function isPrerelease(version) {
  return /-/.test(version);
}

process.stdout.write(`# [@${scope}/${name}](https://github.com/${scope}/${name})

${githubInfo.description}

---

<div class="grid grid-cols-4">
  <a href=https://github.com/${scope}/${name}/stargazers class="card">
    <h2>GitHub stars</h2>
    <div class="big">${githubInfo.stargazers_count.toLocaleString("en-US")}</div>
  </a>
  <a href=https://github.com/${scope}/${name}/issues class="card">
    <h2>GitHub open issues & PRs</h2>
    <div class="big">${githubInfo.open_issues_count.toLocaleString("en-US")}</div>
  </a>
  <a href=https://github.com/${scope}/${name}/releases class="card">
    <h2>Latest release</h2>
    <div class="big">${npmInfo["dist-tags"].latest}</div>
  </a>
  <a href=https://github.com/${scope}/${name}/releases class="card">
    <h2>Days since last release</h2>
    <div class="big">${utcDay.count(new Date(npmInfo.time[npmInfo["dist-tags"].latest]), today)}</div>
  </a>
  <a class="card">
    <h2>npm downloads (last 7 days)</h2>
    <div class="big">${sum(downloads.slice(0, 7), (d) => d.value).toLocaleString("en-US")}</div>
  </a>
</div>

---

~~~js
const downloads = JSON.parse(data_downloads.textContent, reviver);
const versions = JSON.parse(data_versions.textContent, reviver);

function reviver(key, value) {
  return typeof value === "string" && /(^|_)(date|time)$/.test(key) ? new Date(value) : value;
}
~~~

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Daily downloads</h2>
    <h3>28d <b style="color: var(--theme-foreground);">—</b> and 7d <b style="color: var(--theme-foreground-focus);">—</b> average</h3>

~~~js
Plot.plot({
  width,
  height: 400,
  y: {label: "downloads"},
  marks: [
    Plot.axisY({anchor: "right", label: null}),
    Plot.areaY(downloads, {x: "date", y: "value", fillOpacity: 0.2, curve: "step"}),
    Plot.ruleY([0]),
    Plot.lineY(downloads, Plot.windowY({k: 7, anchor: "start", strict: true}, {x: "date", y: "value", strokeWidth: 1, stroke: "var(--theme-foreground-focus)", curve: "step"})),
    Plot.lineY(downloads, Plot.windowY({k: 28, anchor: "start", strict: true}, {x: "date", y: "value", stroke: "var(--theme-foreground)", curve: "step"})),
    Plot.textX(versions, {x: "date", text: "version", href: (d) => \`https://github.com/${scope}/${name}/releases/tag/v$\{d.version\}\`, target: "_blank", rotate: -90, frameAnchor: "top-right", lineAnchor: "bottom", dx: -4}),
    Plot.ruleX(versions, {x: "date", strokeOpacity: 0.2}),
    Plot.tip(downloads, Plot.pointerX({x: "date", y: "value"}))
  ]
})
~~~

  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Downloads by version</h2>
    <h3>Last seven days; top 10 versions</h3>

~~~js
Plot.plot({
  width,
  label: null,
  x: {axis: "top", grid: true},
  color: {scheme: "reds", reverse: true},
  marks: [
    Plot.barX(versions, {
      y: "version",
      x: "downloads",
      fill: "date",
      sort: {y: "x", reverse: true, limit: 10}
    }),
    Plot.text(versions, {
      y: "version",
      x: "downloads",
      dx: -4,
      text: "downloads",
      frameAnchor: "right",
      fill: "var(--theme-background)"
    }),
    Plot.ruleX([0])
  ]
})
~~~

  </div>
</div>

---

TODO

- npm downloads big number ☑️
- npm downloads chart with releases ☑️
  - with 7-day moving average ☑️
  - with 28-day moving average ☑️
  - fill zeroes
- npm downloads by version ☑️
- github stars ☑️
- github stars last seven days
- days since last release ☑️
- days since last commit
- days since last issue or discussion activity
- github open issues big number
- github issue burndown chart
- github top issues
- github commits by author timeline chart
- github calendar commits
- inline data rather than using FileAttachment

<script type="application/json" id="data_downloads">${JSON.stringify(downloads, replacer)}</script>
<script type="application/json" id="data_versions">${JSON.stringify(versions, replacer)}</script>

<style type="text/css">

#observablehq-main a[href].card:not(:hover, :focus),
#observablehq-main h1 a[href]:not(:hover, :focus) {
  text-decoration: none;
}

</style>
`);
