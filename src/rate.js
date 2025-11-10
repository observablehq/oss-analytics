export function RateLimiter(n, duration) {
  let recents = [];
  return async () => {
    if (!((n = +n) >= 1)) throw new Error(`invalid n: ${n}`);
    while (true) {
      const time = Date.now() - duration;
      recents = recents.filter((r) => r >= time);
      if (recents.length < n) break;
      const delay = Math.max(recents[0] + duration - Date.now(), 100);
      console.warn(`rate limit reached; waiting ${delay}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    recents.push(Date.now());
  };
}
