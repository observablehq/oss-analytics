import {groups, sort, sum} from "d3-array";
import {utcDay} from "d3-time";
import {format as formatIso} from "isoformat";
import {packages} from "../observablehq.config.js";
import {fetchGithub} from "./github.js";
import {fetchNpm, fetchNpmDownloads} from "./npm.js";

const today = utcDay();

for (const p of packages) {
  p.downloads = await fetchNpmDownloads(p.name);
  p.stargazers = (await fetchGithub(`/repos/${encodeURI(p.repo)}`)).stargazers_count;
  const githubRepo = p.repo;
  const githubPackage = await fetchGithub(`/repos/${encodeURI(githubRepo)}/contents/package.json`);
  const {name: npmPackage} = JSON.parse(Buffer.from(githubPackage.content, "base64").toString("utf-8"));
  p.npmInfo = await fetchNpm(`https://registry.npmjs.org/${encodeURIComponent(npmPackage)}`);
}

process.stdout.write(`# Open-source analytics

This dashboard shows [Observable’s open-source projects](https://github.com/observablehq) and [D3](https://github.com/d3). This dashboard is itself [open-source](https://github.com/observablehq/oss-analytics/) and built with [Observable Framework](https://observablehq.com/framework/) and updated daily on [Observable Cloud](https://observablehq.com/platform/cloud); fork it to visualize your own projects!

<style type="text/css">

main table {
  margin: 1rem -1rem;
  width: calc(100% + 2rem);
  max-width: none;
  white-space: nowrap;
}

main thead {
  position: sticky;
  background: var(--theme-background-alt);
  border-bottom: solid 1px var(--theme-foreground-faintest);
  top: calc(var(--observablehq-header-height) + 1.5rem + 1px);
}

main table a {
  display: inline-flex;
  gap: 0.5rem;
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
main td {
  height: 2rem;
  padding: 0 1rem !important;
  vertical-align: middle;
}

</style>

${groups(packages, ({group}) => group)
  .map(
    ([group, packages]) => `<h2 style="margin-top: 4rem;">${group}</h2>

<table>
  <thead>
    <tr>
      <th data-sort>name</th>
      <th class="hide-if-small" style="width: 12rem;" data-type="date" data-sort>latest release</th>
      <th style="width: 10rem;" data-type="number" data-sort="desc">stars</th>
      <th style="width: 10rem;" data-type="number" data-sort>weekly downloads</th>
    </tr>
  </thead>
  <tbody>
    ${sort(packages, ({stargazers}) => -stargazers).map(({name, repo, stargazers, downloads, npmInfo}) => `<tr>
      <td data-value="${repo}">
        <a href="/@${repo}">@${repo}</a>
      </td>
      <td class="hide-if-small" data-type="date" data-value="${npmInfo.time[npmInfo["dist-tags"].latest]}" title="${utcDay.count(new Date(npmInfo.time[npmInfo["dist-tags"].latest]), today).toLocaleString("en-US")} days ago">
        ${npmInfo["dist-tags"].latest}
        <span class="muted">${formatIso(new Date(npmInfo.time[npmInfo["dist-tags"].latest])).slice(0, 10)}</span>
      </td>
      <td data-type="number" data-value="${stargazers}">
        ${stargazers.toLocaleString("en-US")} ★
      </td>
      <td data-type="number" data-value="${sum(downloads.slice(0, 7), (d) => d.value)}">
        ${sum(downloads.slice(0, 7), (d) => d.value).toLocaleString("en-US")}
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
