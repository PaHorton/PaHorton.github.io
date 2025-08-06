// theme-generator.js
import { calcAPCA } from 'https://cdn.jsdelivr.net/npm/apca-w3/+esm';

function getRandomHexColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

const hexToRgb = (hex) => {
  const raw = hex.replace('#', '');
  return [
    parseInt(raw.substring(0, 2), 16),
    parseInt(raw.substring(2, 4), 16),
    parseInt(raw.substring(4, 6), 16)
  ];
};

const lerp = (a, b, t) => a + (b - a) * t;

const interpolateColor = (bg, fg, t) => [
  Math.round(lerp(bg[0], fg[0], t)),
  Math.round(lerp(bg[1], fg[1], t)),
  Math.round(lerp(bg[2], fg[2], t))
];

function setImgColor(fg, bg, contrast) {
  const canvas = document.getElementById('ditheredCanvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = 'dithered-image.png';
  img.crossOrigin = "anonymous";
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (contrast > 0) {
      [fg, bg] = [bg, fg];
    }
    const fgRGB = hexToRgb(fg);
    const bgRGB = hexToRgb(bg);

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i]; // assuming grayscale input
      const t = gray / 255;
      const [r, g, b] = interpolateColor(bgRGB, fgRGB, t);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      // alpha remains unchanged
    }
    ctx.putImageData(imageData, 0, 0);
  };
}

function applyTheme(fg, bg, contrast) {
  document.documentElement.style.setProperty('--fg', fg);
  document.documentElement.style.setProperty('--bg', bg);
  setImgColor(fg, bg, contrast);
}

function getAccessibleTheme(threshold = 60) {
  let fg, bg, contrast;
  for (let i = 0; i < 1000; i++) {
    fg = getRandomHexColor();
    bg = getRandomHexColor();
    contrast = calcAPCA(fg, bg);
    if (Math.abs(contrast) >= threshold) {
      return { fg, bg, contrast };
    }
  }
  throw new Error("Couldn't find accessible pair in 1000 tries");
}

function getInitialThemeFromStyles() {
  const styles = getComputedStyle(document.documentElement);
  return {
    fg: styles.getPropertyValue('--fg').trim(),
    bg: styles.getPropertyValue('--bg').trim(),
  };
}

const { fg, bg } = getInitialThemeFromStyles();
const initialContrast = calcAPCA(fg, bg);
applyTheme(fg, bg, initialContrast);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    const { fg, bg, contrast } = getAccessibleTheme(60);
    console.log('New APCA contrast:', contrast);
    console.log('Foreground:', fg, 'Background:', bg);
    applyTheme(fg, bg, contrast);
  }
});