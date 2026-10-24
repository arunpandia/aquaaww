/* On-device person cut-out (MediaPipe Selfie Segmentation, Apache-2.0). Works on any background; fully offline. */
window.PersonCut = (function () {
  let seg = null, ready = null, last = null, waiter = null;
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });
  function init(base) {
    if (ready) return ready;
    ready = (async () => {
      await loadScript(base + 'selfie_segmentation.js');
      seg = new window.SelfieSegmentation({ locateFile: f => base + f });
      seg.setOptions({ modelSelection: 0, selfieMode: false });
      seg.onResults(r => { last = r; if (waiter) { const w = waiter; waiter = null; w(); } });
      await seg.initialize();
    })();
    return ready;
  }
  // draw only the person from `src` (a square canvas) into ctx (px x px)
  async function cut(src, ctx, px) {
    let got = false; waiter = () => { got = true; };
    await seg.send({ image: src });
    if (!got) await new Promise(r => { waiter = r; });
    ctx.save();
    ctx.clearRect(0, 0, px, px);
    ctx.drawImage(last.segmentationMask, 0, 0, px, px);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(src, 0, 0, px, px);
    ctx.restore();
    // the mask is soft: harden it so faint low-confidence pixels become fully transparent (no hazy box on a transparent overlay)
    const img = ctx.getImageData(0, 0, px, px), d = img.data;
    for (let i = 3; i < d.length; i += 4) { let a = (d[i] / 255 - 0.4) / 0.4; a = a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a); d[i] = a * 255; }
    ctx.putImageData(img, 0, 0);
  }
  // remove the video's own background (white, or an off-white/grey): the reference colour is read from the four corners
  let ref = null;
  function keyBg(img, w, h) {
    const d = img.data, n = Math.max(4, Math.round(w / 40)), cs = [];
    for (const [x0, y0] of [[0, 0], [w - n, 0], [0, h - n], [w - n, h - n]]) {
      let r = 0, g = 0, b = 0;
      for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const k = n * n; cs.push([r / k, g / k, b / k]);
    }
    cs.sort((a, b) => (b[0] + b[1] + b[2]) - (a[0] + a[1] + a[2]));          // lightest corners first: a subject touching a corner is darker
    const m = [0, 1, 2].map(c => (cs[0][c] + cs[1][c]) / 2);
    const target = Math.min(m[0], m[1], m[2]) >= 170 ? m : [255, 255, 255];  // corners not light: fall back to pure white
    ref = ref ? ref.map((v, c) => v * 0.8 + target[c] * 0.2) : target;       // smooth, so compression noise does not flicker
    const B = ref, lo = 30, hi = 90;
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.max(0, B[0] - d[i], B[1] - d[i + 1], B[2] - d[i + 2]);
      let a = (dist - lo) / (hi - lo); a = a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a);
      if (a > 0 && a < 1) for (let k = 0; k < 3; k++) { const x = B[k] - (B[k] - d[i + k]) / a; d[i + k] = x < 0 ? 0 : x > 255 ? 255 : x; }
      d[i + 3] = a * 255;
    }
  }
  return { init, cut, keyBg };
})();
