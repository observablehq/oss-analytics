import * as Plot from "@observablehq/plot";
import {quantile} from "d3-array";
import {JSDOM} from "jsdom";

export function DailyPlot(
  data,
  {
    label,
    x = "date",
    y = "value",
    max = quantile(data, 0.995, (d) => d[y]),
    width,
    height = 200,
    round = true,
    marginTop = 10,
    annotations = [],
    background = "white",
    foreground = "black",
    focus = "#26c1ad",
    document = new JSDOM("").window.document,
    ...options
  } = {}
) {
  const d7 = (options) => Plot.windowY({k: 7, anchor: "start", strict: true}, options);
  const d28 = (options) => Plot.windowY({k: 28, anchor: "start", strict: true}, options);
  const plot = Plot.plot({
    ...options,
    style: `color: ${foreground}; --plot-background: ${background};`,
    document,
    marginTop,
    width,
    height,
    round,
    y: {grid: true, domain: [0, max], label},
    marks: [
      Plot.axisY({anchor: "right", label: null, tickFormat: max >= 10e3 ? "s" : undefined}),
      Plot.areaY(data, {x, y, curve: "step", fill: foreground, fillOpacity: 0.2, interval: "day"}), // prettier-ignore
      Plot.ruleY([0]),
      Plot.lineY(data, d7({x, y, strokeWidth: 1, stroke: focus, interval: "day"})),
      Plot.lineY(data, d28({x, y, stroke: foreground, interval: "day"})),
      Annotations(annotations, {x, stroke: background, fill: foreground})
    ]
  });
  plot.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg"); // prettier-ignore
  plot.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink"); // prettier-ignore
  return plot;
}

export function Annotations(
  data,
  {
    x = "date",
    text = "text",
    href = "href",
    target = "_blank",
    fill = "currentColor",
    stroke = "white",
    strokeOpacity = 0.1,
    fontVariant = "tabular-nums",
    frameAnchor = "top-right",
    lineAnchor = "bottom",
    rotate = -90,
    dx = -3,
    dy = 0,
    transform,
    clip = true
  } = {}
) {
  return Plot.marks(
    Plot.ruleX(data, {x, stroke: fill, strokeOpacity, transform, clip}),
    Plot.text(data, {
      x,
      text,
      href,
      target,
      rotate,
      dx,
      dy,
      frameAnchor,
      lineAnchor,
      fontVariant,
      fill,
      stroke,
      transform,
      clip
    })
  );
}
