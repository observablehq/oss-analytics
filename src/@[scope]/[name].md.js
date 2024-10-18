import {parseArgs} from "node:util";
import {greatest, sum} from "d3-array";
import {utcDay, utcYear} from "d3-time";
import {format as formatIso} from "isoformat";
import {fetchGithub, listGithub} from "../github.js";
import {fetchNpm, fetchNpmDownloads} from "../npm.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

const today = utcDay();
const lastWeek = utcDay.offset(today, -7);
const lastYear = utcYear.offset(today, -1);

const githubRepo = `${scope}/${name}`;

const githubInfo = await fetchGithub(`/repos/${encodeURI(githubRepo)}`);
const githubPackage = await fetchGithub(`/repos/${encodeURI(githubRepo)}/contents/package.json`);
const {name: npmPackage} = JSON.parse(Buffer.from(githubPackage.content, "base64").toString("utf-8"));

const npmInfo = await fetchNpm(`https://registry.npmjs.org/${encodeURIComponent(npmPackage)}`);
const npmDownloads = await fetchNpmDownloads(npmPackage);
const npmDownloadsByVersion = await fetchNpm(`/versions/${encodeURIComponent(npmPackage)}/last-week`);

const downloads = npmDownloads;
const downloadsByVersion = npmDownloadsByVersion.downloads;

const commits = [];

for await (const item of listGithub(`/repos/${githubRepo}/commits`, {reverse: false})) {
  commits.push({
    sha: item.sha,
    message: truncate(item.commit.message),
    date: new Date(item.commit.committer.date),
    author: item.author?.login
  });
}

const start = greatest([new Date("2021-01-01"), utcDay(commits.at(-1).date)]);

const issues = [];
const pullRequests = [];

for await (const item of listGithub(`/repos/${githubRepo}/issues?state=all`, {reverse: false})) {
  (item.pull_request ? pullRequests : issues).push({
    state: item.state,
    created_at: new Date(item.created_at),
    closed_at: item.closed_at && new Date(item.closed_at),
    draft: item.draft,
    reactions: {...item.reactions, url: undefined},
    title: item.title,
    number: item.number
  });
}

let recentStargazerCount = 0;

for await (const item of listGithub(`/repos/${githubRepo}/stargazers`, {accept: "application/vnd.github.star+json"})) {
  const starred_at = new Date(item.starred_at);
  if (starred_at < lastWeek) break;
  ++recentStargazerCount;
}

const versions = [];

for (const version in npmInfo.versions) {
  if (isPrerelease(version)) continue;
  versions.push({
    version,
    date: npmInfo.time[version] ? new Date(npmInfo.time[version]) : undefined,
    downloads: downloadsByVersion[version]
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

const weeklyDownloadsCount = sum(downloads.slice(0, 7), (d) => d.value);
const lastWeeklyDownloadsCount = sum(downloads.slice(7, 14), (d) => d.value);
const weeklyDownloadsChange = (weeklyDownloadsCount - lastWeeklyDownloadsCount) / lastWeeklyDownloadsCount;

process.stdout.write(`# [@${githubRepo}](https://github.com/${githubRepo})

${githubInfo.description}

---

~~~js
import semverCompare from "npm:semver/functions/compare";

const downloads = JSON.parse(data__downloads.textContent, reviver);
const versions = JSON.parse(data__versions.textContent, reviver);
const commits = JSON.parse(data__commits.textContent, reviver);
const lastYear = new Date("${formatIso(lastYear)}");
const start = new Date("${formatIso(start)}");
const today = new Date("${formatIso(today)}");
const domain = [start, today];

function reviver(key, value) {
  return typeof value === "string" && /(^|_)(date|time)$/.test(key) ? new Date(value) : value;
}
~~~

<div class="grid grid-cols-4">
  <a href=https://github.com/${githubRepo}/stargazers class="card">
    <div style="display: flex; flex-direction: column;">
      <h2>Stars</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline;">
        <div class="big">${githubInfo.stargazers_count.toLocaleString("en-US")}</div>
        <div class="green">${recentStargazerCount.toLocaleString("en-US", {signDisplay: "always"})} in 7d</div>
      </div>
    </div>
  </a>
  <a class="card">
    <h2>Weekly downloads</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline;">
      <div class="big">${weeklyDownloadsCount.toLocaleString("en-US")}</div>
      <div class="${weeklyDownloadsChange > 0 ? "green" : weeklyDownloadsChange < 0 ? "red" : "muted"}">${weeklyDownloadsChange.toLocaleString("en-US", {style: "percent", signDisplay: "always"})}</div>
    </div>
  </a>
  <a href=https://github.com/${githubRepo}/releases class="card">
    <h2>Latest release</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline;">
      <div class="big">${npmInfo["dist-tags"].latest}</div>
      <div class="muted">${utcDay.count(new Date(npmInfo.time[npmInfo["dist-tags"].latest]), today).toLocaleString("en-US")} days ago</div>
    </div>
  </a>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Daily downloads</h2>
    <h3>28d <b style="color: var(--theme-foreground);">—</b> and 7d <b style="color: var(--theme-foreground-focus);">—</b> average</h3>
    <div style="min-height: 390px;">$\{Plot.plot({
      width,
      height: 400,
      marginLeft: 0,
      marginRight: 60,
      x: {domain},
      y: {label: "downloads", domain: [0, d3.quantile(downloads, 0.995, (d) => d.value)]},
      marks: [
        Plot.axisY({anchor: "right", label: null}),
        Plot.areaY(downloads, {x: "date", y: "value", fillOpacity: 0.2, curve: "step"}),
        Plot.ruleY([0]),
        Plot.lineY(downloads, Plot.windowY({k: 7, anchor: "start", strict: true}, {x: "date", y: "value", strokeWidth: 1, stroke: "var(--theme-foreground-focus)", curve: "step"})),
        Plot.lineY(downloads, Plot.windowY({k: 28, anchor: "start", strict: true}, {x: "date", y: "value", stroke: "var(--theme-foreground)", curve: "step"})),
        Plot.textX(versions.filter((d) => d.date >= start), {x: "date", text: "version", href: (d) => \`https://github.com/${githubRepo}/releases/tag/v$\{d.version\}\`, target: "_blank", rotate: -90, frameAnchor: "top-right", lineAnchor: "bottom", dx: -4}),
        Plot.ruleX(versions.filter((d) => d.date >= start), {x: "date", strokeOpacity: 0.2}),
        Plot.tip(downloads, Plot.pointerX({x: "date", y: "value"}))
      ]
    })}</div>
  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Downloads by version</h2>
    <h3>Last seven days${versions.filter((d) => d.downloads > 0).length > 10 ? "; top 10 versions" : ""}</h3>
    $\{Plot.plot({
      width,
      label: null,
      marginLeft: 40,
      marginRight: 60,
      x: {axis: "top", grid: true},
      y: {domain: d3.sort(d3.sort(versions.filter((d) => d.downloads > 0), (d) => -d.downloads).slice(0, 10).map((d) => d.version), (a, b) => semverCompare(b, a))},
      marks: [
        Plot.barX(versions.filter((d) => d.downloads > 0), {
          y: "version",
          x: "downloads"
        }),
        Plot.text(versions.filter((d) => d.downloads > 0), {
          y: "version",
          x: "downloads",
          dx: -4,
          text: "downloads",
          frameAnchor: "right",
          fill: "var(--theme-background)"
        }),
        Plot.ruleX([0])
      ]
    })}
  </div>
</div>

---

<div class="grid grid-cols-4">
  <a href=https://github.com/${githubRepo}/commits class="card">
    <h2>Days since last commit</h2>
    <div class="big">${utcDay.count(new Date(commits[0].date), today).toLocaleString("en-US")}</div>
  </a>
  <a href=https://github.com/${githubRepo}/commits class="card">
    <h2>Commits</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline;">
      <div class="big">${commits.filter((d) => d.date >= lastYear).length.toLocaleString("en-US")}</div>
      <div class="muted">in 12 months</div>
    </div>
  </a>
  <a href=https://github.com/${githubRepo}/issues class="card">
    <h2>Open issues</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline;">
      <div class="big">${issues.filter((d) => d.state === "open").length.toLocaleString("en-US")}</div>
    </div>
  </a>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Commits calendar</h2>
    <h3>Last 12 months</h3>
    $\{Plot.plot({
      width,
      label: null,
      round: false,
      marginTop: 0,
      marginBottom: 0,
      aspectRatio: 1,
      padding: 0,
      x: {axis: null},
      y: {domain: [-1, 1, 2, 3, 4, 5, 6, 0], ticks: [1, 2, 3, 4, 5, 6, 0], tickFormat: Plot.formatWeekday()},
      color: {type: "log", label: "commits", domain: [0.2, 20], interpolate: "hcl", range: dark ? [d3.hcl(160, 40, 0), d3.hcl(140, 80, 80)] : ["white", d3.hcl(140, 70, 40)]},
      marks: [
        Plot.cell(d3.utcDays(lastYear, today), {x: (d) => d3.utcMonday.count(0, d), y: (d) => d.getUTCDay(), stroke: "var(--theme-background)", r: 2, inset: 1.5}),
        Plot.text(d3.utcMondays(d3.utcMonday(lastYear), d3.utcMonday(today)).filter((d, i, D) => i === 0 || d.getUTCMonth() !== D[i - 1].getUTCMonth()), {x: (d) => d3.utcMonday.count(0, d), y: -1, text: d3.utcFormat("%b"), frameAnchor: "bottom-left"}),
        Plot.cell(commits.filter((d) => d.date >= lastYear), Plot.group({fill: "count"}, {x: (d) => d3.utcMonday.count(0, d.date), y: (d) => d.date.getUTCDay(), channels: {date: ([d]) => d3.utcDay(d.date)}, r: 2, tip: {format: {x: null, y: null}}, inset: 1}))
      ]
    })}
  </div>
</div>

${commits.some((d) => d.date >= start) ? `<div class="grid grid-cols-1">
  <div class="card">
    <h2>Commits by author</h2>${new Set(commits.filter((d) => d.date >= start).map((d) => d.author)).size > 10 ? "\n<h3>Top 10 authors</h3>" : ""}
    $\{Plot.plot({
      width,
      label: null,
      marginLeft: 0,
      marginRight: 60,
      x: {axis: "top", domain},
      y: {grid: true},
      marks: [
        Plot.axisY({anchor: "right", textOverflow: "ellipsis-middle", lineWidth: 5}),
        Plot.dot(commits.filter((d) => d.date >= start), {x: "date", y: "author", sort: {y: "x", reduce: "count", reverse: true, limit: 10}}),
        Plot.voronoi(commits.filter((d) => d.date >= start), {x: "date", y: "author", href: (d) => \`https://github.com/${githubRepo}/commit/$\{d.sha\}\`, target: "_blank", fill: "transparent", title: "message", tip: {maxRadius: Infinity}})
      ]
    })}
  </div>
</div>` : ""}

---

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
