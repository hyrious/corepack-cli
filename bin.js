#!/usr/bin/env node

// @ts-check

let [_1, _2, command, ...args] = process.argv;

const help = `usage: corepack-cli <command> ...args

where <command> are:

  prepare-latest [npm|pnpm|yarn]   (default: pnpm)
`;

if (!command || command.includes("help")) {
  console.log(help);
  process.exit(0);
}

/** @param res { import('http').IncomingMessage } */
function json(res) {
  return new Promise(resolve => {
    let chunks = [];
    res.on("data", chunk => chunks.push(chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } else {
        throw new Error("response status code: " + res.statusCode);
      }
    });
  });
}

if (command === "prepare-latest") {
  const npm = args[0] || "pnpm";
  import("https").then(https =>
    https.get(
      `https://data.jsdelivr.com/v1/package/npm/${npm}`,
      async function prepareLatest(res) {
        console.log(`Querying latest version of ${npm}...`);
        const { tags } = await json(res);
        const version = tags.latest;
        const fullName = `${npm}@${version}`;
        const { spawnSync } = await import("child_process");
        process.exit(
          spawnSync("corepack", ["prepare", fullName, "--activate"], {
            stdio: "inherit",
            shell: process.platform === "win32",
          }).status || 0
        );
      }
    )
  );
} else {
  console.log(help);
  process.exit(0);
}
