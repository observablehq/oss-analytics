import {parseArgs} from "node:util";
import {sum} from "d3-array";
import {utcDay} from "d3-time";
import {format as formatIso} from "isoformat";
import {github, githubList} from "../../github.js";
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

const commits = [];

for await (const commit of githubList(`/repos/${scope}/${name}/commits`, {reverse: false})) {
  commits.push({
    sha: commit.sha,
    message: truncate(commit.commit.message),
    date: commit.commit.committer.date,
    author: commit.author?.login
  });
}

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

function truncate(message, length = 255) {
  message = message.replace(/\n\n.*/s, "");
  return message.length <= length ? message : `${message.slice(0, length - 1)}…`;
}

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
  <a href=https://github.com/${scope}/${name}/commits class="card">
    <h2>Days since last commit</h2>
    <div class="big">${utcDay.count(new Date(commits[0].date), today)}</div>
  </a>
  <a class="card">
    <h2>npm downloads (last 7 days)</h2>
    <div class="big">${sum(downloads.slice(0, 7), (d) => d.value).toLocaleString("en-US")}</div>
  </a>
</div>

---

~~~js
const downloads = JSON.parse(data__downloads.textContent, reviver);
const versions = JSON.parse(data__versions.textContent, reviver);
const commits = JSON.parse(data__commits.textContent, reviver);
const today = new Date("${formatIso(today)}");
const domain = [d3.utcDay(commits.at(-1).date), today];

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
  marginLeft: 0,
  marginRight: 60,
  x: {domain},
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
  marginLeft: 40,
  marginRight: 60,
  x: {axis: "top", grid: true},
  marks: [
    Plot.barX(versions, {
      y: "version",
      x: "downloads",
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

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Commits calendar</h2>

~~~js
const calendarStart = d3.utcYear.offset(today, -1);
~~~

~~~js
Plot.plot({
  width,
  label: null,
  round: false,
  marginTop: 0,
  marginBottom: 0,
  aspectRatio: 1,
  padding: 0,
  x: {axis: null},
  y: {tickFormat: Plot.formatWeekday()},
  color: {type: "log", label: "commits", domain: [0.5, 20], range: ["black", "green"]},
  marks: [
    Plot.cell(d3.utcDays(calendarStart, today), {x: (d) => d3.utcWeek.count(0, d), y: (d) => d.getUTCDay(), stroke: "var(--theme-background)", r: 2, inset: 1.5}),
    Plot.cell(commits.filter((d) => d.date >= calendarStart), Plot.group({fill: "count"}, {x: (d) => d3.utcWeek.count(0, d.date), y: (d) => d.date.getUTCDay(), r: 2, tip: {format: {x: null, y: null}}, inset: 1}))
  ]
})
~~~

~~~js
class MonthLine extends Plot.Mark {
  static defaults = {stroke: "currentColor", strokeWidth: 1};
  constructor(data, options = {}) {
    const {x, y} = options;
    super(data, {x: {value: x, scale: "x"}, y: {value: y, scale: "y"}}, options, MonthLine.defaults);
  }
  render(index, {x, y}, {x: X, y: Y}, dimensions) {
    const {marginTop, marginBottom, height} = dimensions;
    const dx = x.bandwidth(), dy = y.bandwidth();
    return htl.svg\`<path fill=none stroke=$\{this.stroke} stroke-width=$\{this.strokeWidth} d=$\{
      Array.from(index, (i) => \`$\{Y[i] > marginTop + dy * 1.5 // is the first day a Monday?
          ? \`M$\{X[i] + dx},$\{marginTop}V$\{Y[i]}h$\{-dx}\`
          : \`M$\{X[i]},$\{marginTop}\`}V$\{height - marginBottom}\`)
        .join("")
    }>\`;
  }
}
~~~

  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Commits by author</h2>
    <h3>Top 10 authors</h3>

~~~js
Plot.plot({
  width,
  label: null,
  marginLeft: 0,
  marginRight: 60,
  x: {axis: "top", domain},
  y: {grid: true},
  marks: [
    Plot.axisY({anchor: "right", textOverflow: "ellipsis-middle", lineWidth: 5}),
    Plot.dot(commits, {x: "date", y: "author", href: (d) => \`https://github.com/${scope}/${name}/commit/$\{d.sha\}\`, target: "_blank", title: "message", tip: true, sort: {y: "x", reduce: "count", reverse: true, limit: 10}})
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
- days since last commit ☑️
- days since last issue or discussion activity
- github open issues big number
- github issue burndown chart
- github top issues
- github commits by author timeline chart ☑️
- github commits calendar heatmap ☑️
  - month line
  - show date in tip
  - tip for zero days
- github top contributors
- inline data rather than using FileAttachment ☑️
- don’t show more than three years?

<script type="application/json" id="data__downloads">${JSON.stringify(downloads, replacer)}</script>
<script type="application/json" id="data__versions">${JSON.stringify(versions, replacer)}</script>
<script type="application/json" id="data__commits">${JSON.stringify(commits, replacer)}</script>

<style type="text/css">

#observablehq-main a[href].card:not(:hover, :focus),
#observablehq-main h1 a[href]:not(:hover, :focus) {
  text-decoration: none;
}

</style>
`);
