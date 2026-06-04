// Human-like manuscript typewriter effect.
// Returns a controller with a `start()` method so typing can begin
// only when the panel actually scrolls into view (called once).

export function initManuscript(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return null;

  const text = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ",
    "nisi ut aliquip ex ea commodo consequat.\n\n",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum ",
    "dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non ",
    "proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  ].join("");

  let started = false;
  let i = 0;

  function typeChar() {
    if (i >= text.length) return;
    const ch = text[i];
    el!.textContent = text.slice(0, i + 1);
    i++;

    // Base human-like cadence
    let delay = 45 + Math.random() * 85;

    // Faster across plain spaces
    if (ch === " ") delay = 30 + Math.random() * 55;

    // Natural pauses at punctuation
    if (ch === ",") delay = 180 + Math.random() * 140;
    if (ch === ";" || ch === ":") delay = 220 + Math.random() * 160;
    if (ch === "." || ch === "!" || ch === "?") delay = 420 + Math.random() * 320;

    // Longer beat at paragraph breaks
    if (ch === "\n") delay = 550 + Math.random() * 350;

    // Occasional "thinking" hesitation mid-sentence
    if (Math.random() < 0.025) delay += 280 + Math.random() * 420;

    setTimeout(typeChar, delay);
  }

  return {
    start() {
      if (started) return;
      started = true;
      setTimeout(typeChar, 1000);
    },
  };
}
