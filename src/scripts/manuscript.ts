// Op-based human-like typewriter engine.
// Supports typing, deleting (backspace), and explicit pauses.
// 4 deliberate typos that get quickly self-corrected.

type Op =
  | { kind: 'type';   text: string  }
  | { kind: 'delete'; count: number }
  | { kind: 'pause';  ms: number    };

export function initManuscript(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return null;

  const ops: Op[] = [
    // TYPO 1: "escribiendo" → type "escribiedn" → delete 3 → "endo…"
    { kind: 'type',   text: 'Llevo un par de días escribi' },
    { kind: 'type',   text: 'edn' },
    { kind: 'pause',  ms: 140 },
    { kind: 'delete', count: 3 },
    { kind: 'type',   text: 'endo y borrando estas primeras líneas.\n' },
    { kind: 'type',   text: 'Supongo que eso ya dice bastante…\n' },

    // TYPO 2: "aprendí" + extra "i" → delete 1 → continue
    { kind: 'type',   text: 'Porque si algo aprendí' },
    { kind: 'type',   text: 'i' },
    { kind: 'pause',  ms: 130 },
    { kind: 'delete', count: 1 },
    { kind: 'type',   text: ' haciendo este álbum, es que entenderse a uno mismo es ' },

    // Intentional edit: "mucho más difícil" → pause → delete → "MÁS DIFÍCIL"
    { kind: 'type',   text: 'mucho más difícil' },
    { kind: 'pause',  ms: 700 },
    { kind: 'delete', count: 17 },
    { kind: 'type',   text: 'MÁS DIFÍCIL' },
    { kind: 'type',   text: ' de lo que parece.\n\n' },

    { kind: 'type',   text: 'Hay gente que se pasa la vida entera intentando convertirse en alguien.\n' },
    { kind: 'type',   text: 'Y hay otra gente que se pasa la vida intentando entender quiénes son cuando se quedan solos.\n' },
    { kind: 'type',   text: 'Creo que casi todos hemos sido las dos.\n\n' },

    { kind: 'type',   text: 'Durante mucho tiempo pensé que uno simplemente era como era.\n' },
    { kind: 'type',   text: 'Que había una sola versión de ti.\n' },
    { kind: 'type',   text: 'Ahora no estoy tan seguro.\n\n' },

    // TYPO 3: "tranquila" → "tranquilai" → delete 2 → "a.\n"
    { kind: 'type',   text: 'Porque a veces quiero una vida tranquil' },
    { kind: 'type',   text: 'ai' },
    { kind: 'pause',  ms: 150 },
    { kind: 'delete', count: 2 },
    { kind: 'type',   text: 'a.\n' },

    { kind: 'type',   text: 'Y otras veces quiero que mi nombre aparezca en una pantalla gigante.\n' },
    { kind: 'type',   text: 'A veces extraño cosas que no quiero de vuelta.\n' },

    // Intentional edit: types whole line then deletes it
    { kind: 'type',   text: 'A veces pienso que si hubiera hecho las cosas diferente pues—' },
    { kind: 'pause',  ms: 950 },
    { kind: 'delete', count: 61 },
    { kind: 'pause',  ms: 500 },
    { kind: 'type',   text: 'Supongo que así somos.\n' },
    { kind: 'type',   text: 'Contradicciones con piernas.\n\n' },

    { kind: 'type',   text: 'Una Cara Más nació de ahí.\n' },
    { kind: 'type',   text: 'Y de muchas otras cosas que probablemente voy a seguir escribiendo aquí…\n\n' },

    // TYPO 4: "versiones" → "versionnes" → delete 1 → "es distintas.\n"
    { kind: 'type',   text: 'De entender que dentro de uno viven demasiadas versio' },
    { kind: 'type',   text: 'nn' },
    { kind: 'pause',  ms: 140 },
    { kind: 'delete', count: 1 },
    { kind: 'type',   text: 'es distintas.\n' },

    { kind: 'type',   text: 'Y que quizás la vida no se trata de escoger una sola.\n' },
    { kind: 'type',   text: 'Sino de aprender a vivir con todas.\n\n' },

    { kind: 'type',   text: 'Con la que se equivoca.\n' },
    { kind: 'type',   text: 'Con la que quiere desaparecer un rato.\n' },
    { kind: 'type',   text: 'Con la que todavía cree en algo, aunque le dé vergüenza decirlo.\n' },
    { kind: 'type',   text: 'Con la que sigue.\n' },
    { kind: 'type',   text: 'Aunque no siempre sepa hacia dónde.\n\n' },

    { kind: 'type',   text: 'Gracias por entrar a este mundo.\n' },
    { kind: 'type',   text: 'Disfruten el ' },
    { kind: 'type',   text: 'puto ' },
    { kind: 'pause',  ms: 600 },
    { kind: 'delete', count: 5 },
    { kind: 'type',   text: 'álbum.\n' },
    { kind: 'type',   text: 'B' },
    { kind: 'pause',  ms: 380 },
    { kind: 'delete', count: 1 },
    { kind: 'type',   text: 'bye\n' },
    { kind: 'type',   text: '- Kova Parker' },
  ];

  let content  = '';
  let started  = false;
  let paused   = false;
  let timer: number | null = null;
  let opIdx    = 0;
  let charIdx  = 0;

  function render() {
    el!.textContent = content;
    const scrollEl = el!.closest('.manuscript-scroll') as HTMLElement | null;
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  function scheduleNext(delay: number) {
    timer = window.setTimeout(step, delay);
  }

  function typingDelay(ch: string): number {
    let d = 35 + Math.random() * 55;
    if (ch === ' ')                              d = 20 + Math.random() * 35;
    if (ch === ',')                              d = 120 + Math.random() * 100;
    if (ch === ';' || ch === ':')               d = 150 + Math.random() * 110;
    if (ch === '.' || ch === '!' || ch === '?') d = 270 + Math.random() * 200;
    if (ch === '…' || ch === '—')               d = 210 + Math.random() * 140;
    if (ch === '\n')                             d = 360 + Math.random() * 230;
    if (Math.random() < 0.025)                  d += 170 + Math.random() * 250;
    return d;
  }

  function step() {
    timer = null;
    if (paused || opIdx >= ops.length) return;

    const op = ops[opIdx];

    if (op.kind === 'pause') {
      opIdx++; charIdx = 0;
      scheduleNext(op.ms);
      return;
    }

    if (op.kind === 'type') {
      if (charIdx >= op.text.length) { opIdx++; charIdx = 0; scheduleNext(0); return; }
      const ch = op.text[charIdx++];
      content += ch;
      render();
      scheduleNext(typingDelay(ch));
      return;
    }

    if (op.kind === 'delete') {
      if (charIdx >= op.count || content.length === 0) { opIdx++; charIdx = 0; scheduleNext(0); return; }
      content = content.slice(0, -1);
      charIdx++;
      render();
      scheduleNext(28 + Math.random() * 38);
      return;
    }
  }

  return {
    start() {
      if (started) return;
      started = true;
      scheduleNext(1000);
    },
    pause() {
      if (paused) return;
      paused = true;
      if (timer !== null) { clearTimeout(timer); timer = null; }
    },
    resume() {
      if (!started || !paused) return;
      paused = false;
      if (timer === null && opIdx < ops.length) scheduleNext(1000);
    },
  };
}
