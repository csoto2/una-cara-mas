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

  const NUM_BACKGROUND_STARS = 200;
  const STAR_TEXT = "KOVA PARKER";
  const TEXT_REVEAL_DURATION = 4000;
  const TEXT_REVEAL_START = 2000;

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
    draw() {
      ctx!.beginPath();
      ctx!.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness * 0.15})`;
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness})`;
      ctx!.fill();
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

    constructor(x: number, y: number, delay: number) {
      this.baseX = x; this.baseY = y;
      this.x = x; this.y = y;
      this.delay = delay;
      this.targetSize = Math.random() * 1.5 + 1.5;
      this.twinkleSpeed = Math.random() * 0.004 + 0.002;
      this.twinkleOffset = Math.random() * Math.PI * 2;
      this.targetBrightness = Math.random() * 0.3 + 0.7;
      this.popDuration = 300 + Math.random() * 200;
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
        const elastic = 1 - Math.pow(2, -10 * progress) * Math.cos(progress * Math.PI * 2);
        this.size = this.targetSize * Math.min(elastic, 1);
        this.brightness = this.targetBrightness * Math.min(progress * 1.5, 1);
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

      // Spring back
      // Very weak spring for slow return
      const springStrength = 0.003; 
      const returnX = this.baseX - this.x;
      const returnY = this.baseY - this.y;
      
      this.vx += returnX * springStrength;
      this.vy += returnY * springStrength;

      // Friction
      const friction = 0.90; 
      this.vx *= friction;
      this.vy *= friction;

      this.x += this.vx;
      this.y += this.vy;
    }
    draw() {
      if (!this.born || this.size <= 0) return;
      ctx!.beginPath();
      ctx!.arc(this.x, this.y, this.displaySize * 3, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness * 0.1})`;
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(this.x, this.y, this.displaySize * 1.8, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness * 0.25})`;
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(this.x, this.y, this.displaySize, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 250, 220, ${this.currentBrightness})`;
      ctx!.fill();
    }
  }

  class ShootingStar {
    active: boolean = false; x: number = 0; y: number = 0; length: number = 0;
    speed: number = 0; angle: number = 0; opacity: number = 0; thickness: number = 0;

    activate() {
      this.x = Math.random() * starCanvas!.width * 0.8;
      this.y = Math.random() * starCanvas!.height * 0.4;
      this.length = Math.random() * 100 + 50;
      this.speed = Math.random() * 15 + 10;
      this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
      this.opacity = 1;
      this.thickness = Math.random() * 2 + 1;
      this.active = true;
    }
    update() {
      if (!this.active) return;
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.opacity -= 0.015;
      if (this.opacity <= 0 || this.x > starCanvas!.width + 100 || this.y > starCanvas!.height + 100) {
        this.active = false;
      }
    }
    draw() {
      if (!this.active) return;
      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;
      const gradient = ctx!.createLinearGradient(this.x, this.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255, 250, 220, ${this.opacity})`);
      gradient.addColorStop(0.3, `rgba(255, 250, 220, ${this.opacity * 0.6})`);
      gradient.addColorStop(1, 'transparent');
      ctx!.beginPath();
      ctx!.moveTo(this.x, this.y);
      ctx!.lineTo(tailX, tailY);
      ctx!.strokeStyle = gradient;
      ctx!.lineWidth = this.thickness;
      ctx!.lineCap = 'round';
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.arc(this.x, this.y, this.thickness, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255, 250, 220, ${this.opacity})`;
      ctx!.fill();
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
  let shootingStars: ShootingStar[] = [];

  function initStarScene() {
    backgroundStars = [];
    for (let i = 0; i < NUM_BACKGROUND_STARS; i++) backgroundStars.push(new BackgroundStar());
    textStars = [];
    const textPoints = getStarTextPoints(STAR_TEXT);
    textPoints.sort((a, b) => (a.x * 0.3 + Math.random() * starCanvas!.width * 0.7) - (b.x * 0.3 + Math.random() * starCanvas!.width * 0.7));
    for (let i = 0; i < textPoints.length; i++) {
      const delay = TEXT_REVEAL_START + (i / textPoints.length) * TEXT_REVEAL_DURATION;
      const randomDelay = delay + (Math.random() - 0.5) * 500;
      textStars.push(new TextStar(textPoints[i].x, textPoints[i].y, randomDelay));
    }
    shootingStars = [];
    for (let i = 0; i < 5; i++) shootingStars.push(new ShootingStar());
  }

  initStarScene();

  let starStartTime: number | null = null;
  let lastShootingStarTime = 0;

  function animateStars(timestamp: number) {
    if (scroller && scroller.scrollTop < 4.8 * window.innerHeight) {
       requestAnimationFrame(animateStars);
       return; 
    }
    if (!starStartTime) starStartTime = timestamp;
    const elapsed = timestamp - starStartTime;
    ctx!.fillStyle = '#000008';
    ctx!.fillRect(0, 0, starCanvas!.width, starCanvas!.height);
    if (timestamp - lastShootingStarTime > 8000 + Math.random() * 4000) {
      const inactive = shootingStars.find(s => !s.active);
      if (inactive) {
        inactive.activate();
        lastShootingStarTime = timestamp;
      }
    }
    for (const star of shootingStars) { star.update(); star.draw(); }
    for (const star of backgroundStars) { star.update(timestamp); star.draw(); }
    for (const star of textStars) { star.update(timestamp, elapsed); star.draw(); }
    requestAnimationFrame(animateStars);
  }

  window.addEventListener('resize', () => {
    resizeStarCanvas();
    initStarScene();
    starStartTime = null;
  });

  starCanvas.addEventListener('click', () => {
    initStarScene();
    starStartTime = null;
  });

  animateStars(0);
}
