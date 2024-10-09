import {parseArgs} from "node:util";
import {format as formatIso} from "isoformat";
import {getNpmDownloadsByVersion, getNpmPackage} from "../../npm.js";

const {
  values: {scope, name}
} = parseArgs({
  options: {scope: {type: "string"}, name: {type: "string"}}
});

const [info, downloads] = await Promise.all([
  getNpmPackage(`@${scope}/${name}`),
  getNpmDownloadsByVersion(`@${scope}/${name}`)
]);

const data = [];

for (const key in info.versions) {
  data.push({
    version: key,
    create_time: info.time[key] ? new Date(info.time[key]) : undefined,
    downloads: downloads.downloads[key]
  });
}

data.sort((a, b) => a.create_time - b.create_time);

process.stdout.write(JSON.stringify(data, replacer));

function replacer(key, value) {
  return typeof value === "string" && /(_|^)(date|time)$/.test(key) ? formatIso(new Date(value)) : value;
}
