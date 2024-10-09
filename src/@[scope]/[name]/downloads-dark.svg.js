import {parseArgs} from "node:util";
import {getNpmDownloadsByDate} from "../../npm.js";
import {DailyPlot} from "../../DailyPlot.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

const data = await getNpmDownloadsByDate(`@${scope}/${name}`);

process.stdout.write(DailyPlot(data, {foreground: "white", background: "black"}).outerHTML);
