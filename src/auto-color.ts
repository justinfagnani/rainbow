import {color} from './rainbow.js';

// In the browser hook it up to color on page load
document.addEventListener('DOMContentLoaded', (_event) => {
  // if (!defer) {
  color();
  // }
}, false);
