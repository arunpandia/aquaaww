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
  }
  return { init, cut };
})();
