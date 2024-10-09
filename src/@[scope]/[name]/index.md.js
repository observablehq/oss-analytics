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

const [{body: info}, info2, downloads, versions] = await Promise.all([
  github(`/repos/${scope}/${name}`),
  getNpmPackage(`@${scope}/${name}`),
  getNpmDownloadsByDate(`@${scope}/${name}`),
  getNpmDownloadsByVersion(`@${scope}/${name}`)
]);

const data = [];

for (const version in info2.versions) {
  if (isPrerelease(version)) continue;
  data.push({
    version,
    create_time: info2.time[version] ? new Date(info2.time[version]) : undefined,
    downloads: versions.downloads[version]
  });
}

data.sort((a, b) => a.create_time - b.create_time);

function replacer(key, value) {
  return value && /(_|^)(date|time)$/.test(key) ? formatIso(new Date(value)) : value;
}

function isPrerelease(version) {
  return /-/.test(version);
}

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
    <div class="big">${info2["dist-tags"].latest}</div>
  </a>
  <a href=https://github.com/${scope}/${name}/releases class="card">
    <h2>Days since last release</h2>
    <div class="big">${utcDay.count(new Date(info2.time[info2["dist-tags"].latest]), today)}</div>
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
- inline data rather than using FileAttachment

---

<script type="application/json" id="data_downloads">${JSON.stringify(downloads, replacer)}</script>
<script type="application/json" id="data_versions">${JSON.stringify(data, replacer)}</script>

<style type="text/css">

#observablehq-main a[href].card:not(:hover, :focus),
#observablehq-main h1 a[href]:not(:hover, :focus) {
  text-decoration: none;
}

</style>
`);
