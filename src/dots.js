const canvas = document.getElementById('boids');
const ctx = canvas.getContext('2d');

let width = canvas.width;
let height = canvas.height;

function resizeCanvas() {
  width = canvas.width = canvas.offsetWidth;
  height = canvas.height = canvas.offsetHeight;
}
resizeCanvas();

const DOT_COUNT = 100;
const DOT_SIZE = 4
const dots = [];

for (let i = 0; i < DOT_COUNT; i++) {
  dots.push({
    x: Math.random() * width,
    y: Math.random() * height,
    dx: (Math.random() - 0.5) * 1.5,
    dy: (Math.random() - 0.5) * 1.5,
    r: 2 + Math.random() * DOT_SIZE,
  });
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (const dot of dots) {
    dot.x += dot.dx;
    dot.y += dot.dy;

    if (dot.x <= 0 || dot.x >= width) dot.dx *= -1;
    if (dot.y <= 0 || dot.y >= height) dot.dy *= -1;

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fillStyle = document.documentElement.style.getPropertyValue('--fg') || '#000';
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

animate();
