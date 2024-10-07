export const packages = [
  ...[
    "@observablehq/framework",
    "@observablehq/plot",
    "@observablehq/inputs",
    "@observablehq/runtime",
    "@observablehq/stdlib",
    "@observablehq/inspector",
    "@observablehq/parser",
    "htl"
  ].map((name) => ({
    name,
    group: "Observable",
    href:
      name === "htl"
        ? "https://github.com/observablehq/htl"
        : `https://github.com/${name.replace(/^@/, "")}`
  })),
  ...[
    "d3",
    "d3-array",
    "d3-axis",
    "d3-brush",
    "d3-chord",
    "d3-color",
    "d3-contour",
    "d3-delaunay",
    "d3-dispatch",
    "d3-drag",
    "d3-dsv",
    "d3-ease",
    "d3-fetch",
    "d3-force",
    "d3-format",
    "d3-geo",
    "d3-hierarchy",
    "d3-interpolate",
    "d3-path",
    "d3-polygon",
    "d3-quadtree",
    "d3-random",
    "d3-scale",
    "d3-scale-chromatic",
    "d3-selection",
    "d3-shape",
    "d3-time",
    "d3-time-format",
    "d3-timer",
    "d3-transition",
    "d3-zoom"
  ].map((name) => ({
    name,
    group: "D3 (core)",
    href: `https://github.com/d3/${name}`
  })),
  ...[
    "d3-collection",
    "d3-geo-polygon",
    "d3-geo-projection",
    "d3-hexbin",
    "d3-hsv",
    "d3-queue",
    "d3-request",
    "d3-require",
    "d3-sankey",
    "d3-selection-multi",
    "d3-tile",
    "d3-voronoi"
  ].map((name) => ({
    name,
    group: "D3 (non-core)",
    href: `https://github.com/d3/${name}`
  }))
];

export default {
  title: "Open-source analytics",
  head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',
  root: "src",
  style: "style.css",
  globalStylesheets: [
    "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Spline+Sans+Mono:ital,wght@0,300..700;1,300..700&display=swap"
  ],
  toc: false,
  header: `<div style="display: flex; flex-grow: 1; align-items: center; justify-content: space-between; white-space: nowrap;">
    <div>
      <a href="/" class="hide-if-sidebar" style="display: flex; align-items: center; gap: 0.5rem;">
        <svg width="22" height="22" viewBox="0 0 21.92930030822754 22.68549919128418" fill="currentColor" style="align-self: center;">
          <path d="M10.9646 18.9046C9.95224 18.9046 9.07507 18.6853 8.33313 18.2467C7.59386 17.8098 7.0028 17.1909 6.62722 16.4604C6.22789 15.7003 5.93558 14.8965 5.75735 14.0684C5.56825 13.1704 5.47613 12.2574 5.48232 11.3427C5.48232 10.6185 5.52984 9.92616 5.62578 9.26408C5.7208 8.60284 5.89715 7.93067 6.15391 7.24843C6.41066 6.56618 6.74143 5.97468 7.14438 5.47308C7.56389 4.9592 8.1063 4.54092 8.72969 4.25059C9.38391 3.93719 10.1277 3.78091 10.9646 3.78091C11.977 3.78091 12.8542 4.00021 13.5962 4.43879C14.3354 4.87564 14.9265 5.49454 15.3021 6.22506C15.6986 6.97704 15.9883 7.7744 16.1719 8.61712C16.3547 9.459 16.447 10.3681 16.447 11.3427C16.447 12.067 16.3995 12.7593 16.3035 13.4214C16.2013 14.1088 16.0206 14.7844 15.7644 15.437C15.4994 16.1193 15.1705 16.7108 14.7739 17.2124C14.3774 17.714 13.8529 18.1215 13.1996 18.4349C12.5463 18.7483 11.8016 18.9046 10.9646 18.9046ZM12.8999 13.3447C13.4242 12.8211 13.7159 12.0966 13.7058 11.3427C13.7058 10.5639 13.4436 9.89654 12.92 9.34074C12.3955 8.78495 11.7441 8.50705 10.9646 8.50705C10.1852 8.50705 9.53376 8.78495 9.00928 9.34074C8.49569 9.87018 8.21207 10.5928 8.22348 11.3427C8.22348 12.1216 8.48572 12.7889 9.00928 13.3447C9.53376 13.9005 10.1852 14.1784 10.9646 14.1784C11.7441 14.1784 12.3891 13.9005 12.8999 13.3447ZM10.9646 22.6855C17.0199 22.6855 21.9293 17.6068 21.9293 11.3427C21.9293 5.07871 17.0199 0 10.9646 0C4.90942 0 0 5.07871 0 11.3427C0 17.6068 4.90942 22.6855 10.9646 22.6855Z"></path>
        </svg>
        <span>
          Observable
        </span>
      </a>
    </div>
    <span style="display: flex; align-items: baseline; gap: 1rem;">
      &#8203;
      <a style="font-size: 14px;" target="_blank" href="https://github.com/observablehq/oss-analytics"><span>GitHub️</span></a>
    </span>
  </div>`,
  footer: ((date = new Date()) =>
    `© ${date.getUTCFullYear()} Observable, Inc. Updated <a title="${date.toISOString()}">${date.toLocaleDateString("en-US", {month: "short", day: "numeric", hour: "numeric", timeZone: "America/Los_Angeles"})} PT</a>.`)(),
  dynamicPaths: packages.flatMap((name) => [
    `/${name}/downloads-dark.svg`,
    `/${name}/downloads.svg`
  ])
};
