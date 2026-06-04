export function initStarfield(canvasId: string, scrollerId: string) {
  const starCanvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  const scroller = document.getElementById(scrollerId) as HTMLElement | null;
  
  if (!starCanvas) return;
  const ctx = starCanvas.getContext('2d');
  if (!ctx) return;

  function resizeStarCanvas() {
    if (starCanvas) {
      starCanvas.width = window.innerWidth;
      starCanvas.height = window.innerHeight;
    }
  }
  resizeStarCanvas();

  // --- CRT-ish post processing -------------------------------------------------
  // We render the scene (stars) to an offscreen buffer, then composite it to the
  // visible canvas with scanlines/vignette/noise + a tiny chromatic shift.
  // This avoids WebGL complexity but still sells the vibe.
  const CRT = {
    enabled: true,
    // 0..1
    scanlineOpacity: 0.12,
    vignetteStrength: 0.22,
    chromaOffsetPx: 1.6,
  } as const;

  const sceneCanvas = document.createElement('canvas');
  const sceneCtx = sceneCanvas.getContext('2d');

  // Channel buffers for stronger chromatic separation
  const rCanvas = document.createElement('canvas');
  const rCtx = rCanvas.getContext('2d');
  const bCanvas = document.createElement('canvas');
  const bCtx = bCanvas.getContext('2d');

  function resizePostFXCanvases() {
    sceneCanvas.width = starCanvas!.width;
    sceneCanvas.height = starCanvas!.height;
    rCanvas.width = starCanvas!.width;
    rCanvas.height = starCanvas!.height;
    bCanvas.width = starCanvas!.width;
    bCanvas.height = starCanvas!.height;
  }
  resizePostFXCanvases();

  function drawScanlines(targetCtx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const lineH = 2;
    const yOffset = Math.floor((t * 0.02) % lineH);
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'multiply';
    targetCtx.globalAlpha = CRT.scanlineOpacity;
    targetCtx.fillStyle = '#000';
    for (let y = yOffset; y < h; y += lineH) {
      targetCtx.fillRect(0, y, w, 1);
    }
    targetCtx.restore();
  }

  function drawVignette(targetCtx: CanvasRenderingContext2D, w: number, h: number) {
    const g = targetCtx.createRadialGradient(
      w * 0.5,
      h * 0.5,
      Math.min(w, h) * 0.4,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.65,
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${CRT.vignetteStrength})`);
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'source-over';
    targetCtx.fillStyle = g;
    targetCtx.fillRect(0, 0, w, h);
    targetCtx.restore();
  }

  function compositeCRT(targetCtx: CanvasRenderingContext2D, t: number) {
    const w = starCanvas!.width;
    const h = starCanvas!.height;
    if (!sceneCtx) return;

    targetCtx.clearRect(0, 0, w, h);
    targetCtx.imageSmoothingEnabled = false;

  // Chromatic offset: build two channel-separated layers (R and B)
  // and shift them slightly. This is more visible than tinted overlays.
  const jx = Math.sin(t * 0.0017) * 0.6;
  const jy = Math.cos(t * 0.0013) * 0.6;
    const o = CRT.chromaOffsetPx;

    // Base
    targetCtx.globalCompositeOperation = 'source-over';
    targetCtx.globalAlpha = 1;
    targetCtx.drawImage(sceneCanvas, 0, 0);

    // Build R-only and B-only layers
    if (rCtx && bCtx) {
      // R
      rCtx.clearRect(0, 0, w, h);
      rCtx.globalCompositeOperation = 'source-over';
      rCtx.drawImage(sceneCanvas, 0, 0);
      rCtx.globalCompositeOperation = 'source-in';
      rCtx.fillStyle = 'rgb(255,0,0)';
      rCtx.fillRect(0, 0, w, h);

      // B
      bCtx.clearRect(0, 0, w, h);
      bCtx.globalCompositeOperation = 'source-over';
      bCtx.drawImage(sceneCanvas, 0, 0);
      bCtx.globalCompositeOperation = 'source-in';
      bCtx.fillStyle = 'rgb(0,160,255)';
      bCtx.fillRect(0, 0, w, h);

      // Additive blend on top of base with offsets
      targetCtx.globalCompositeOperation = 'lighter';
      targetCtx.globalAlpha = 0.55;
      targetCtx.drawImage(rCanvas, o + jx, 0.3 + jy);
      targetCtx.globalAlpha = 0.45;
      targetCtx.drawImage(bCanvas, -o + jx, -0.3 - jy);

      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.globalAlpha = 1;
    }

    drawScanlines(targetCtx, w, h, t);
    drawVignette(targetCtx, w, h);
  }

  const NUM_BACKGROUND_STARS = 200;
  const STAR_TEXT = "KOVA PARKER";
  const TEXT_REVEAL_DURATION = 8000;
  const TEXT_REVEAL_START = 1000;

  let mouseX = -1000;
  let mouseY = -1000;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  class BackgroundStar {
    x: number = 0; y: number = 0; 
    baseX: number = 0; baseY: number = 0;
    vx: number = 0; vy: number = 0;
    size: number = 0; baseSize: number = 0;
    twinkleSpeed: number = 0; twinkleOffset: number = 0; brightness: number = 0;
    currentBrightness: number = 0;

    constructor() { this.init(); }
    init() {
      this.baseX = Math.random() * starCanvas!.width;
      this.baseY = Math.random() * starCanvas!.height;
      this.x = this.baseX;
      this.y = this.baseY;
      this.size = Math.random() * 2 + 0.5;
      this.baseSize = this.size;
      this.twinkleSpeed = Math.random() * 0.004 + 0.001;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      this.brightness = Math.random() * 0.6 + 0.4;
    }
    update(time: number) {
      // 1. Twinkle
      const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
      this.size = this.baseSize * (0.5 + 0.5 * (twinkle * 0.5 + 0.5));
      this.currentBrightness = this.brightness * (0.4 + 0.6 * (twinkle * 0.5 + 0.5));

      // 2. Physics Interaction
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = 8; // Smaller radius to match cursor
      
      if (distance < radius) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (radius - distance) / radius;
        const pushStrength = 4; // Higher push since radius is smaller

        this.vx += forceDirectionX * force * pushStrength;
        this.vy += forceDirectionY * force * pushStrength;
      }

      // Spring back to base position
      // Very weak spring so they drift back slowly ("later")
      const springStrength = 0.002; 
      const returnX = this.baseX - this.x;
      const returnY = this.baseY - this.y;
      
      this.vx += returnX * springStrength;
      this.vy += returnY * springStrength;

      // Friction to stop oscillation
      const friction = 0.92;
      this.vx *= friction;
      this.vy *= friction;

      this.x += this.vx;
      this.y += this.vy;
    }
    draw(drawCtx: CanvasRenderingContext2D) {
      const px = Math.round(this.x);
      const py = Math.round(this.y);
      const s = Math.max(1, Math.round(this.size));
      // Dim glow — scattered pixels around core
      drawCtx.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness * 0.12})`;
      drawCtx.fillRect(px - s, py, s, s);
      drawCtx.fillRect(px + s, py, s, s);
      drawCtx.fillRect(px, py - s, s, s);
      drawCtx.fillRect(px, py + s, s, s);
      // Bright core pixel
      drawCtx.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness})`;
      drawCtx.fillRect(px, py, s, s);
    }
  }

  class TextStar {
    displaySize: number = 0; currentBrightness: number = 0; birthTime: number | null = null;
    born: boolean = false; brightness: number = 0; size: number = 0;
    targetBrightness: number; popDuration: number; targetSize: number;
    twinkleOffset: number; twinkleSpeed: number; delay: number; 
    baseX: number; baseY: number;
    x: number; y: number;
    vx: number = 0; vy: number = 0;
    deviationPhase: number; // tiny individual offset

    constructor(x: number, y: number, delay: number) {
      this.baseX = x; this.baseY = y;
      this.x = x; this.y = y;
      this.delay = delay;
      this.targetSize = Math.random() * 1.5 + 1.5;
      this.twinkleSpeed = Math.random() * 0.004 + 0.002;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      this.targetBrightness = Math.random() * 0.3 + 0.7;
      this.popDuration = 800 + Math.random() * 600;
      this.deviationPhase = Math.random() * Math.PI * 2;
    }
    update(time: number, elapsed: number) {
      if (!this.born && elapsed >= this.delay) {
        this.born = true;
        this.birthTime = elapsed;
      }
      if (!this.born) return;
      const age = elapsed - (this.birthTime || 0);
      if (age < this.popDuration) {
        const progress = age / this.popDuration;
        // Smooth ease-out: starts fast, settles gently
        const ease = 1 - Math.pow(1 - progress, 3);
        this.size = this.targetSize * ease;
        this.brightness = this.targetBrightness * ease;
      } else {
        this.size = this.targetSize;
        this.brightness = this.targetBrightness;
      }
      const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
      this.currentBrightness = this.brightness * (0.7 + 0.3 * (twinkle * 0.5 + 0.5));
      this.displaySize = this.size * (0.8 + 0.2 * (twinkle * 0.5 + 0.5));

      // 2. Physics Interaction
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = 8; // Smaller radius
      
      if (distance < radius) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (radius - distance) / radius;
        const pushStrength = 5; // Stronger push for letters

        this.vx += forceDirectionX * force * pushStrength;
        this.vy += forceDirectionY * force * pushStrength;
      }

      // Uniform float — all stars move together, with super slight per-star deviation
      const floatTime = time * 0.0003;
      // Main uniform drift (all stars get the same offset)
      const floatX = Math.sin(floatTime * 0.7) * 30 + Math.sin(floatTime * 0.4) * 20;
      const floatY = Math.cos(floatTime * 0.5) * 22 + Math.cos(floatTime * 0.25) * 16;
      // Tiny per-star deviation (barely noticeable)
      const devX = Math.sin(floatTime * 0.6 + this.deviationPhase) * 1.5;
      const devY = Math.cos(floatTime * 0.5 + this.deviationPhase) * 1.2;

      // Spring back to base + float offset
      const springStrength = 0.008; 
      const returnX = (this.baseX + floatX + devX) - this.x;
      const returnY = (this.baseY + floatY + devY) - this.y;
      
      this.vx += returnX * springStrength;
      this.vy += returnY * springStrength;

      // Friction
      const friction = 0.90; 
      this.vx *= friction;
      this.vy *= friction;

      this.x += this.vx;
      this.y += this.vy;
    }
    draw(drawCtx: CanvasRenderingContext2D) {
      if (!this.born || this.size <= 0) return;
      const px = Math.round(this.x);
      const py = Math.round(this.y);
      const s = Math.max(1, Math.round(this.displaySize));
      // Outer artifact haze — offset pixel chunks
      drawCtx.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness * 0.06})`;
      drawCtx.fillRect(px - s * 2, py - s, s, s);
      drawCtx.fillRect(px + s * 2, py, s, s);
      drawCtx.fillRect(px, py - s * 2, s, s);
      drawCtx.fillRect(px - s, py + s * 2, s, s);
      // Mid glow — cross pattern
      drawCtx.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness * 0.18})`;
      drawCtx.fillRect(px - s, py, s, s);
      drawCtx.fillRect(px + s, py, s, s);
      drawCtx.fillRect(px, py - s, s, s);
      drawCtx.fillRect(px, py + s, s, s);
      // Bright core pixel block
      drawCtx.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness})`;
      drawCtx.fillRect(px, py, s, s);
    }
  }

  function getStarTextPoints(text: string) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [];
    tempCanvas.width = starCanvas!.width;
    tempCanvas.height = starCanvas!.height;
    const fontSize = Math.min(starCanvas!.width / 7, 110);
    tempCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillText(text, starCanvas!.width / 2, starCanvas!.height / 2);
    const imageData = tempCtx.getImageData(0, 0, starCanvas!.width, starCanvas!.height);
    const points = [];
    const gap = 6;
    for (let y = 0; y < starCanvas!.height; y += gap) {
      for (let x = 0; x < starCanvas!.width; x += gap) {
        const index = (y * starCanvas!.width + x) * 4;
        if (imageData.data[index + 3] > 128) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }

  let backgroundStars: BackgroundStar[] = [];
  let textStars: TextStar[] = [];

  function initStarScene() {
    backgroundStars = [];
    // Removed background stars
    textStars = [];
    const textPoints = getStarTextPoints(STAR_TEXT);
    for (let i = 0; i < textPoints.length; i++) {
      // Each star gets a fully random delay — no index-based ordering
      const delay = TEXT_REVEAL_START + Math.random() * TEXT_REVEAL_DURATION;
      textStars.push(new TextStar(textPoints[i].x, textPoints[i].y, delay));
    }
  }

  initStarScene();

  let starStartTime: number | null = null;

  function animateStars(timestamp: number) {
    // Determine the threshold based on mobile or desktop
    const isMobile = window.innerWidth <= 768;
    const threshold = isMobile ? 5.8 * window.innerHeight : 4.8 * window.innerHeight;

    if (scroller && scroller.scrollTop < threshold) {
       // Reset start time so animation doesn't progress while hidden
       starStartTime = null;
       requestAnimationFrame(animateStars);
       return; 
    }
    if (!starStartTime) starStartTime = timestamp;
    const elapsed = timestamp - starStartTime;

    // 1) Render stars into the scene buffer (or directly to visible ctx if CRT is off)
    const renderCtx = (CRT.enabled && sceneCtx) ? sceneCtx : ctx!;
    renderCtx.save();
    renderCtx.imageSmoothingEnabled = false;
    renderCtx.clearRect(0, 0, starCanvas!.width, starCanvas!.height);

    for (const star of backgroundStars) { star.update(timestamp); star.draw(renderCtx); }
    for (const star of textStars) { star.update(timestamp, elapsed); star.draw(renderCtx); }

    renderCtx.restore();

    // 2) Composite from scene buffer to visible canvas with CRT FX
    if (CRT.enabled && sceneCtx) {
      compositeCRT(ctx!, timestamp);
    }
    requestAnimationFrame(animateStars);
  }

  window.addEventListener('resize', () => {
    resizeStarCanvas();
    resizePostFXCanvases();
    initStarScene();
    starStartTime = null;
  });

  starCanvas.addEventListener('click', () => {
    initStarScene();
    starStartTime = null;
  });

  animateStars(0);
}
