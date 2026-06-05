// Op-based human-like typewriter engine.
// Supports typing, deleting (backspace), and explicit pauses.
// 4 deliberate typos that get quickly self-corrected.
// Supports ES ↔ EN switching with a highlight-then-clear transition.
const opsES = [
    // TYPO 1: "escribiendo" → type "escribiedn" → delete 3 → "endo…"
    { kind: 'type', text: 'Llevo un par de días escribi' },
    { kind: 'type', text: 'edn' },
    { kind: 'pause', ms: 140 },
    { kind: 'delete', count: 3 },
    { kind: 'type', text: 'endo y borrando estas primeras líneas.\n' },
    { kind: 'type', text: 'Supongo que eso ya dice bastante…\n' },
    // TYPO 2: "aprendí" + extra "i" → delete 1 → continue
    { kind: 'type', text: 'Porque si algo aprendí' },
    { kind: 'type', text: 'i' },
    { kind: 'pause', ms: 130 },
    { kind: 'delete', count: 1 },
    { kind: 'type', text: ' haciendo este álbum, es que entenderse a uno mismo es ' },
    // Intentional edit: "mucho más difícil" → pause → delete → "MÁS DIFÍCIL"
    { kind: 'type', text: 'mucho más difícil' },
    { kind: 'pause', ms: 700 },
    { kind: 'delete', count: 17 },
    { kind: 'type', text: 'MÁS DIFÍCIL' },
    { kind: 'type', text: ' de lo que parece.\n\n' },
    { kind: 'type', text: 'Hay gente que se pasa la vida entera intentando convertirse en alguien.\n' },
    { kind: 'type', text: 'Y hay otra gente que se pasa la vida intentando entender quiénes son cuando se quedan solos.\n' },
    { kind: 'type', text: 'Creo que casi todos hemos sido las dos.\n\n' },
    { kind: 'type', text: 'Durante mucho tiempo pensé que uno simplemente era como era.\n' },
    { kind: 'type', text: 'Que había una sola versión de ti.\n' },
    { kind: 'type', text: 'Ahora no estoy tan seguro.\n\n' },
    // TYPO 3: "tranquila" → "tranquilai" → delete 2 → "a.\n"
    { kind: 'type', text: 'Porque a veces quiero una vida tranquil' },
    { kind: 'type', text: 'ai' },
    { kind: 'pause', ms: 150 },
    { kind: 'delete', count: 2 },
    { kind: 'type', text: 'a.\n' },
    { kind: 'type', text: 'Y otras veces quiero que mi nombre aparezca en una pantalla gigante.\n' },
    { kind: 'type', text: 'A veces extraño cosas que no quiero de vuelta.\n' },
    // Intentional edit: types whole line then deletes it
    { kind: 'type', text: 'A veces pienso que si hubiera hecho las cosas diferente pues—' },
    { kind: 'pause', ms: 950 },
    { kind: 'delete', count: 61 },
    { kind: 'pause', ms: 500 },
    { kind: 'type', text: 'Supongo que así somos.\n' },
    { kind: 'type', text: 'Contradicciones con piernas.\n\n' },
    { kind: 'type', text: 'Una Cara Más nació de ahí.\n' },
    { kind: 'type', text: 'Y de muchas otras cosas que probablemente voy a seguir escribiendo aquí…\n\n' },
    // TYPO 4: "versiones" → "versionnes" → delete 1 → "es distintas.\n"
    { kind: 'type', text: 'De entender que dentro de uno viven demasiadas versio' },
    { kind: 'type', text: 'nn' },
    { kind: 'pause', ms: 140 },
    { kind: 'delete', count: 1 },
    { kind: 'type', text: 'es distintas.\n' },
    { kind: 'type', text: 'Y que quizás la vida no se trata de escoger una sola.\n' },
    { kind: 'type', text: 'Sino de aprender a vivir con todas.\n\n' },
    { kind: 'type', text: 'Con la que se equivoca.\n' },
    { kind: 'type', text: 'Con la que quiere desaparecer un rato.\n' },
    { kind: 'type', text: 'Con la que todavía cree en algo, aunque le dé vergüenza decirlo.\n' },
    { kind: 'type', text: 'Con la que sigue.\n' },
    { kind: 'type', text: 'Aunque no siempre sepa hacia dónde.\n\n' },
    { kind: 'type', text: 'Gracias por entrar a este mundo.\n' },
    { kind: 'type', text: 'Disfruten el ' },
    { kind: 'type', text: 'puto ' },
    { kind: 'pause', ms: 600 },
    { kind: 'delete', count: 5 },
    { kind: 'type', text: 'álbum.\n' },
    { kind: 'type', text: 'B' },
    { kind: 'pause', ms: 380 },
    { kind: 'delete', count: 1 },
    { kind: 'type', text: 'bye\n' },
    { kind: 'type', text: '- Kova Parker' },
];
const opsEN = [
    // TYPO 1: "writing" → "writiing" → delete 3 → "ng"
    { kind: 'type', text: "I've spent a couple days writi" },
    { kind: 'type', text: 'ing' },
    { kind: 'pause', ms: 140 },
    { kind: 'delete', count: 3 },
    { kind: 'type', text: 'ng and erasing these first lines.\n' },
    { kind: 'type', text: "I guess that already says a lot…\n" },
    // TYPO 2: "learned" → extra "e" → delete 1 → continue
    { kind: 'type', text: "Because if there's one thing I learn" },
    { kind: 'type', text: 'ee' },
    { kind: 'pause', ms: 130 },
    { kind: 'delete', count: 1 },
    { kind: 'type', text: "d making this album, it's that understanding yourself is " },
    // Intentional edit: "much harder" → pause → delete → "MORE DIFFICULT"
    { kind: 'type', text: 'much harder' },
    { kind: 'pause', ms: 700 },
    { kind: 'delete', count: 11 },
    { kind: 'type', text: 'MORE DIFFICULT' },
    { kind: 'type', text: ' than it seems.\n\n' },
    { kind: 'type', text: 'There are people who spend their whole lives trying to become someone.\n' },
    { kind: 'type', text: "And others who spend their whole lives trying to understand who they are when they're alone.\n" },
    { kind: 'type', text: 'I think almost all of us have been both.\n\n' },
    { kind: 'type', text: 'For a long time I thought you were just who you were.\n' },
    { kind: 'type', text: 'That there was only one version of you.\n' },
    { kind: 'type', text: "Now I'm not so sure.\n\n" },
    // TYPO 3: "quiet" → "queit" → delete 2 → "iet"
    { kind: 'type', text: 'Because sometimes I want a qu' },
    { kind: 'type', text: 'ei' },
    { kind: 'pause', ms: 150 },
    { kind: 'delete', count: 2 },
    { kind: 'type', text: 'iet life.\n' },
    { kind: 'type', text: 'And other times I want my name on a giant screen.\n' },
    { kind: 'type', text: "Sometimes I miss things I don't want back.\n" },
    // Intentional edit: types whole line then deletes it
    { kind: 'type', text: "Sometimes I think if I had done things differently maybe—" },
    { kind: 'pause', ms: 950 },
    { kind: 'delete', count: 57 },
    { kind: 'pause', ms: 500 },
    { kind: 'type', text: "I guess that's just how we are.\n" },
    { kind: 'type', text: 'Contradictions with legs.\n\n' },
    { kind: 'type', text: 'Una Cara Más was born from that.\n' },
    { kind: 'type', text: "And from many other things I'll probably keep writing about here…\n\n" },
    // TYPO 4: "versions" → "versioins" → delete 2 → "ns"
    { kind: 'type', text: 'From understanding that too many different versio' },
    { kind: 'type', text: 'in' },
    { kind: 'pause', ms: 140 },
    { kind: 'delete', count: 2 },
    { kind: 'type', text: 'ns live inside of us.\n' },
    { kind: 'type', text: "And that maybe life isn't about choosing just one.\n" },
    { kind: 'type', text: 'But about learning to live with all of them.\n\n' },
    { kind: 'type', text: 'With the one that makes mistakes.\n' },
    { kind: 'type', text: 'With the one that wants to disappear for a while.\n' },
    { kind: 'type', text: "With the one that still believes in something, even if it's embarrassing to say.\n" },
    { kind: 'type', text: 'With the one that keeps going.\n' },
    { kind: 'type', text: "Even when she doesn't always know where.\n\n" },
    { kind: 'type', text: 'Thanks for entering this world.\n' },
    { kind: 'type', text: 'Enjoy the ' },
    { kind: 'type', text: 'damn ' },
    { kind: 'pause', ms: 600 },
    { kind: 'delete', count: 5 },
    { kind: 'type', text: 'album.\n' },
    { kind: 'type', text: 'B' },
    { kind: 'pause', ms: 380 },
    { kind: 'delete', count: 1 },
    { kind: 'type', text: 'bye\n' },
    { kind: 'type', text: '- Kova Parker' },
];
export function initManuscript(targetId) {
    const el = document.getElementById(targetId);
    if (!el)
        return null;
    let activeOps = opsES.slice();
    let content = '';
    let started = false;
    let paused = false;
    let switching = false;
    let timer = null;
    let opIdx = 0;
    let charIdx = 0;
    function render() {
        el.textContent = content;
        const scrollEl = el.closest('.manuscript-scroll');
        if (scrollEl)
            scrollEl.scrollTop = scrollEl.scrollHeight;
    }
    function scheduleNext(delay) {
        timer = window.setTimeout(step, delay);
    }
    function typingDelay(ch) {
        let d = 35 + Math.random() * 55;
        if (ch === ' ')
            d = 20 + Math.random() * 35;
        if (ch === ',')
            d = 120 + Math.random() * 100;
        if (ch === ';' || ch === ':')
            d = 150 + Math.random() * 110;
        if (ch === '.' || ch === '!' || ch === '?')
            d = 270 + Math.random() * 200;
        if (ch === '…' || ch === '—')
            d = 210 + Math.random() * 140;
        if (ch === '\n')
            d = 360 + Math.random() * 230;
        if (Math.random() < 0.025)
            d += 170 + Math.random() * 250;
        return d;
    }
    function step() {
        timer = null;
        if (paused || opIdx >= activeOps.length)
            return;
        const op = activeOps[opIdx];
        if (op.kind === 'pause') {
            opIdx++;
            charIdx = 0;
            scheduleNext(op.ms);
            return;
        }
        if (op.kind === 'type') {
            if (charIdx >= op.text.length) {
                opIdx++;
                charIdx = 0;
                scheduleNext(0);
                return;
            }
            const ch = op.text[charIdx++];
            content += ch;
            render();
            scheduleNext(typingDelay(ch));
            return;
        }
        if (op.kind === 'delete') {
            if (charIdx >= op.count || content.length === 0) {
                opIdx++;
                charIdx = 0;
                scheduleNext(0);
                return;
            }
            content = content.slice(0, -1);
            charIdx++;
            render();
            scheduleNext(28 + Math.random() * 38);
            return;
        }
    }
    function clearAll(done) {
        if (content.length === 0) {
            done();
            return;
        }
        const chunkSize = Math.max(1, Math.min(8, Math.ceil(content.length / 80)));
        content = content.slice(0, -chunkSize);
        render();
        timer = window.setTimeout(() => clearAll(done), 10);
    }
    return {
        start() {
            if (started)
                return;
            started = true;
            scheduleNext(1000);
        },
        pause() {
            if (paused)
                return;
            paused = true;
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        },
        resume() {
            if (!started || !paused)
                return;
            paused = false;
            if (timer === null && opIdx < activeOps.length)
                scheduleNext(1000);
        },
        switchTo(lang) {
            if (switching)
                return;
            switching = true;
            paused = true;
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
            // highlight the inline span — hugs the text like a real selection
            el.classList.add('ms-highlighted');
            // after highlight hold: instant delete, then restart in new language
            timer = window.setTimeout(() => {
                timer = null;
                el.classList.remove('ms-highlighted');
                content = '';
                render();
                activeOps = (lang === 'en' ? opsEN : opsES).slice();
                opIdx = 0;
                charIdx = 0;
                paused = false;
                switching = false;
                scheduleNext(600);
            }, 500);
        },
    };
}
