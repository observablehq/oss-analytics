import {groups, sort, sum} from "d3-array";
import {utcDay} from "d3-time";
import {format as formatIso} from "isoformat";
import {packages} from "../observablehq.config.js";
import {fetchGithub, fetchGithubStargazersSinceCount} from "./github.js";
import {fetchNpm, fetchNpmDownloads} from "./npm.js";
import {lastWeek, today} from "./today.js";

for (const p of packages) {
  const downloads = await fetchNpmDownloads(p.name);
  p.weeklyDownloads = sum(downloads.slice(0, 7), (d) => d.value);
  p.lastWeeklyDownloads = sum(downloads.slice(7, 14), (d) => d.value);
  p.stargazers = (await fetchGithub(`/repos/${encodeURI(p.repo)}`)).stargazers_count;
  p.recentStargazers = await fetchGithubStargazersSinceCount(p.repo, lastWeek);
  const githubRepo = p.repo;
  const githubPackage = await fetchGithub(`/repos/${encodeURI(githubRepo)}/contents/package.json`);
  const {name: npmPackage} = JSON.parse(Buffer.from(githubPackage.content, "base64").toString("utf-8"));
  p.npmInfo = await fetchNpm(`https://registry.npmjs.org/${encodeURIComponent(npmPackage)}`);
}

process.stdout.write(`# Open-source analytics

This dashboard shows [Observable’s open-source projects](https://github.com/observablehq) and [D3](https://github.com/d3). This dashboard is itself [open-source](https://github.com/observablehq/oss-analytics/) and built with [Observable Framework](https://observablehq.com/framework/) and [updated daily](https://github.com/observablehq/oss-analytics/actions/workflows/deploy.yml); fork it to visualize your own projects!

<style type="text/css">

main table {
  margin: 1rem -1rem;
  width: calc(100% + 2rem);
  max-width: none;
  white-space: nowrap;
  background: var(--theme-background-alt);
  border: solid 1px var(--theme-foreground-faintest);
  border-radius: 8px;
}

main thead {
  position: sticky;
  background: var(--theme-background-alt);
  border-bottom: solid 1px var(--theme-foreground-faintest);
  top: calc(var(--observablehq-header-height) + 1.5rem + 1px);
}

main table a {
  display: inline-flex;
  align-items: center;
  height: 100%;
}

main table {
  border-collapse: separate;
  border-spacing: 0;
}

main th {
  border-bottom: solid 1px var(--theme-foreground-fainter);
}

main tr:not(:last-of-type) td {
  border-bottom: solid 1px var(--theme-foreground-faintest);
}

main th:nth-child(1) {
  width: 16rem;
}

main th[data-sort] {
  cursor: n-resize;
}

main th[data-sort=asc] {
  cursor: s-resize;
}

main th[data-sort=desc]:not([data-type]):after {
  content: " ↓";
}

main th[data-sort=desc][data-type]:before {
  content: "↓ ";
}

main th[data-sort=asc]:not([data-type]):after {
  content: " ↑";
}

main th[data-sort=asc][data-type]:before {
  content: "↑ ";
}

main th[data-type] {
  text-align: right;
}

main td[data-type] {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

main th,
main th:last-child,
main td,
main td:last-child {
  height: 2rem;
  padding: 0 0.5rem;
  vertical-align: middle;
}

main th:first-child,
main td:first-child {
  padding-left: 1rem;
}

main th:last-child,
main td:last-child {
  padding-right: 1rem;
}

</style>

${groups(packages, ({group}) => group)
  .map(
    ([group, packages]) => `<h2 style="margin-top: 4rem;">${group}</h2>

<table>
  <thead>
    <tr>
      <th data-sort>name</th>
      <th class="hide-if-small2" style="width: 6rem;" data-type="date" data-sort>latest release</th>
      <th style="width: 3rem;" class="hide-if-small2"></th>
      <th style="width: 6rem;" data-type="number" data-sort="desc">stars</th>
      <th style="width: 2rem;" class="hide-if-small"></th>
      <th style="width: 7rem;" data-type="number" data-sort><span class="hide-if-small">weekly</span> downloads</th>
      <th style="width: 2rem;" class="hide-if-small"></th>
    </tr>
  </thead>
  <tbody>
    ${sort(packages, (p) => -p.stargazers).map((p) => `<tr>
      <td data-value="${p.repo}">
        <a href="/@${p.repo}">@${p.repo}</a>
      </td>
      <td class="hide-if-small2" data-type="date" data-value="${p.npmInfo.time[p.npmInfo["dist-tags"].latest]}" title="${utcDay.count(new Date(p.npmInfo.time[p.npmInfo["dist-tags"].latest]), today).toLocaleString("en-US")} days ago">
        ${p.npmInfo["dist-tags"].latest}
      </td>
      <td class="hide-if-small2 muted" data-type="number" style="padding-left: 0; text-align: left;">
        ${formatIso(new Date(p.npmInfo.time[p.npmInfo["dist-tags"].latest])).slice(0, 10)}
      </td>
      <td data-type="number" data-value="${p.stargazers}">
        ${p.stargazers.toLocaleString("en-US")} ★
      </td>
      <td data-type="number" class="hide-if-small green" style="padding-left: 0; text-align: left;">
        ${p.recentStargazers ? p.recentStargazers.toLocaleString("en-US", {signDisplay: "always"}) : "<span></span>"}
      </td>
      <td data-type="number" data-value="${p.weeklyDownloads}">
        ${p.weeklyDownloads.toLocaleString("en-US")}
      </td>
      <td data-type="number" class="hide-if-small ${p.weeklyDownloads > p.lastWeeklyDownloads ? "green" : p.weeklyDownloads < p.lastWeeklyDownloads ? "red" : ""}" style="padding-left: 0; text-align: left;">
        ${((p.weeklyDownloads - p.lastWeeklyDownloads) / p.lastWeeklyDownloads).toLocaleString("en-US", {style: "percent", signDisplay: "always"})}
      </td>
    </tr>`).join("\n  ")}
  </tbody>
</table>`
  )
  .join("\n\n")}

~~~js
import semverCompare from "npm:semver/functions/compare";

for (const th of document.querySelectorAll("th[data-sort]")) {
  th.onclick = resort;
  th.onmousedown = noselect;
}

function noselect(event) {
  if (event.detail > 1) {
    event.preventDefault();
  }
}

function resort(event) {
  const th = event.currentTarget;
  if (th.dataset.sort === "desc") {
    th.dataset.sort = "asc";
  } else if (th.dataset.sort === "asc") {
    th.dataset.sort = "desc";
  } else {
    const oth = th.parentNode.querySelector("[data-sort]:not([data-sort=''])");
    if (oth) oth.dataset.sort = "";
    th.dataset.sort = th.dataset.type === undefined ? "asc" : "desc";
  }
  const i = Array.prototype.indexOf.call(th.parentNode.children, th);
  const o = th.dataset.type === "semver" ? semverCompare : d3.ascending;
  const v = th.dataset.type === "number" ? Number : th.dataset.type === "date" ? (d) => new Date(d) : String;
  Array.from(th.closest("table").querySelectorAll("tbody tr"))
    .sort(th.dataset.sort === "asc"
      ? (a, b) => o(v(a.children[i].dataset.value), v(b.children[i].dataset.value))
      : (b, a) => o(v(a.children[i].dataset.value), v(b.children[i].dataset.value)))
    .forEach((tr) => tr.parentNode.appendChild(tr));
  event.preventDefault();
}
~~~

`);
