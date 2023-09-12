export function fruitLoader(
  text: string,
  interval?: NodeJS.Timeout
): NodeJS.Timeout {
  if (interval) {
    stopFruitLoader(interval);
  }

  const frames = [
    "🍊",
    "🍌",
    "🍎",
    "🍒",
    "🍓",
    "🥝",
    "🍏",
    "🍋",
    "🍑",
    "🍉",
    "🍈",
    "🍇",
    "🍍",
    "🥥",
    "🍅",
    "🍆",
    "🥑",
  ];

  let i = 0;
  let startTime = Date.now();

  interval = setInterval(() => {
    const frame = frames[(i = ++i % frames.length)];

    if (!frame) throw new Error("Frame not found");

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    process.stdout.write(`\r${frame} ${text} ${frame} ${elapsedSeconds}s `);
  }, 120);

  return interval;
}

export function stopFruitLoader(interval: NodeJS.Timeout) {
  console.log("Done ✔");
  clearInterval(interval);
}
