(() => {
  'use strict';
  if (document.getElementById('player-spiral-addon')) return;
  const KEY = 'player-spiral-settings-v1';
  const defaults = { color1: '#ad70ff', color2: '#171024', opacity: 0.35,
    speed: 0.7, arms: 4, twist: 2.5, scale: 1, reverse: false, width: 50 };
  const limits = { opacity: [0, 0.9], speed: [0, 3], arms: [1, 12],
    twist: [0, 6], scale: [0.3, 3], width: [10, 50] };
  function normalize(value) {
    const result = { ...defaults };
    for (const [key, [min, max]] of Object.entries(limits)) {
      if (typeof value?.[key] === 'number' && Number.isFinite(value[key]))
        result[key] = Math.max(min, Math.min(max, value[key]));
    }
    result.arms = Math.round(result.arms);
    for (const key of ['color1', 'color2'])
      if (/^#[0-9a-f]{6}$/i.test(value?.[key])) result[key] = value[key];
    result.reverse = value?.reverse === true;
    return result;
  }
  let settings;
  try { settings = normalize(JSON.parse(localStorage.getItem(KEY))); }
  catch { settings = { ...defaults }; }
  let enabled = false; // Always require deliberate activation after loading.
  let phase = 0, last = 0, visible = false, cacheDirty = true;
  const host = document.createElement('div');
  host.id = 'player-spiral-addon';
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10000';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{color-scheme:dark;font:13px system-ui,sans-serif}
      *{box-sizing:border-box} canvas{position:fixed;pointer-events:none}
      #ui{position:fixed;pointer-events:none;max-width:calc(100vw - 16px)}
      button,select{pointer-events:auto;font:inherit;color:#f3edff;background:#302442;border:1px solid #79608e;border-radius:7px;padding:7px;cursor:pointer}
      #panel{pointer-events:auto;width:260px;max-width:100%;padding:14px;margin-top:6px;background:#18131ff2;color:#f3edff;border:1px solid #79608e;border-radius:12px;max-height:65vh;overflow:auto;box-shadow:0 8px 32px #0007}
      [hidden]{display:none!important} h2{font-size:15px;margin:0 0 12px}
      label{display:block;margin:10px 0} input[type=range]{width:100%;accent-color:#b788ff}
      input[type=color]{width:45px;height:28px;border:0;padding:0;vertical-align:middle}
      output{float:right;color:#d7b9ff} p{font-size:12px;color:#c3b6d0;line-height:1.4}
      .colors{display:flex;gap:14px} .colors label{flex:1} #status{margin-bottom:0}
    </style>
    <canvas id="overlay" hidden aria-hidden="true"></canvas>
    <div id="ui" hidden>
      <button id="open" aria-expanded="false" aria-controls="panel">Spiral settings</button>
      <section id="panel" hidden aria-label="Spiral settings">
        <h2>Player area spiral</h2>
        <label><input id="enabled" type="checkbox"> Show overlay</label>
        <label>Preset <select id="preset"><option value="custom">Custom</option><option value="violet">Violet</option><option value="mono">Monochrome</option><option value="ocean">Ocean</option></select></label>
        <div class="colors"><label>Spiral <input id="color1" type="color"></label><label>Background <input id="color2" type="color"></label></div>
        <div id="sliders"></div>
        <label><input id="reverse" type="checkbox"> Reverse rotation</label>
        <button id="reset">Reset appearance</button>
        <p>Escape turns the overlay off. Alt+Shift+S toggles it. Game clicks pass through the spiral.</p>
        <p id="status" role="status"></p>
      </section>
    </div>`;
  const $ = id => root.getElementById(id);
  for (const [key, title, step] of [
    ['opacity', 'Opacity', 0.01], ['speed', 'Rotation speed', 0.05],
    ['arms', 'Spiral arms', 1], ['twist', 'Curve', 0.1],
    ['scale', 'Spiral scale', 0.1], ['width', 'Player area width (%)', 1]
  ]) {
    const label = document.createElement('label');
    label.textContent = title;
    const output = document.createElement('output'); output.id = `${key}-value`;
    const input = document.createElement('input');
    Object.assign(input, { id: key, type: 'range', min: limits[key][0], max: limits[key][1], step });
    label.append(output, input); $('sliders').append(label);
  }
  function sync() {
    for (const key of Object.keys(defaults)) {
      if (key === 'reverse') $(key).checked = settings[key];
      else $(key).value = settings[key];
      if ($(`${key}-value`)) $(`${key}-value`).value = settings[key];
    }
    $('enabled').checked = enabled;
  }
  function save() {
    cacheDirty = true;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); }
    catch { $('status').textContent = 'Settings could not be saved in this browser.'; }
    sync();
  }
  function toggle(value) { enabled = value; $('enabled').checked = value; layout(); }
  $('open').onclick = () => {
    $('panel').hidden = !$('panel').hidden;
    $('open').setAttribute('aria-expanded', String(!$('panel').hidden));
  };
  $('enabled').onchange = () => toggle($('enabled').checked);
  for (const key of Object.keys(defaults)) $(key).oninput = () => {
    settings[key] = key === 'reverse' ? $(key).checked : key.startsWith('color') ? $(key).value : Number($(key).value);
    $('preset').value = 'custom'; save(); layout();
  };
  $('preset').onchange = () => {
    const presets = { violet: ['#ad70ff', '#171024'], mono: ['#eeeeee', '#171717'], ocean: ['#62e4e8', '#072a41'] };
    const colors = presets[$('preset').value];
    if (colors) { [settings.color1, settings.color2] = colors; save(); }
  };
  $('reset').onclick = () => { settings = { ...defaults }; $('preset').value = 'custom'; save(); layout(); };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') toggle(false);
    if (event.altKey && event.shiftKey && event.code === 'KeyS' && !event.repeat) {
      event.preventDefault(); toggle(!enabled);
    }
  });
  const canvas = $('overlay'), ctx = canvas.getContext('2d');
  const texture = document.createElement('canvas');
  texture.width = texture.height = 768;
  const tx = texture.getContext('2d');
  function buildTexture() {
    const size = texture.width, center = size / 2, radius = size * 0.72;
    tx.fillStyle = settings.color2; tx.fillRect(0, 0, size, size);
    tx.fillStyle = settings.color1;
    const sector = Math.PI * 2 / settings.arms;
    const point = (r, angle) => [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    for (let arm = 0; arm < settings.arms; arm++) {
      tx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const r = radius * i / 240;
        const angle = arm * sector + r / radius * settings.twist * Math.PI * 2 / settings.scale;
        const p = point(r, angle); if (i === 0) tx.moveTo(...p); else tx.lineTo(...p);
      }
      for (let i = 240; i >= 0; i--) {
        const r = radius * i / 240;
        tx.lineTo(...point(r, arm * sector + sector / 2 + r / radius * settings.twist * Math.PI * 2 / settings.scale));
      }
      tx.closePath(); tx.fill();
    }
    cacheDirty = false;
  }
  function layout() {
    const game = document.getElementById('MainCanvas');
    const chat = document.getElementById('TextAreaChatLog');
    const g = game?.getBoundingClientRect(), c = chat?.getBoundingClientRect();
    const inRoom = !!(g?.width && g?.height && c?.width && c?.height &&
      getComputedStyle(chat).visibility !== 'hidden' && c.left > g.left);
    $('ui').hidden = !inRoom;
    visible = inRoom && enabled && !document.hidden;
    canvas.hidden = !visible;
    if (!inRoom) return;
    // Never extend beyond the left half or the actual chat boundary.
    const left = Math.max(0, g.left), top = Math.max(0, g.top);
    const right = Math.min(g.left + g.width * settings.width / 100, c.left - 2, innerWidth);
    const bottom = Math.min(g.bottom, innerHeight);
    const w = Math.max(0, right - left), h = Math.max(0, bottom - top);
    if (!w || !h) { visible = false; canvas.hidden = true; $('ui').hidden = true; return; }
    Object.assign(canvas.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px`, opacity: settings.opacity });
    Object.assign($('ui').style, { left: `${left + 8}px`, top: `${top + 8}px`, width: `${Math.max(0, w - 16)}px` });
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const pw = Math.round(w * ratio), ph = Math.round(h * ratio);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    $('status').textContent = enabled ? 'Overlay on · player area only' : 'Overlay off';
  }
  function frame(time) {
    const dt = last ? Math.min((time - last) / 1000, 0.1) : 0; last = time;
    if (visible && ctx && tx) {
      if (cacheDirty) buildTexture();
      phase = (phase + dt * settings.speed * (settings.reverse ? -1 : 1)) % (Math.PI * 2);
      const w = canvas.width, h = canvas.height, side = Math.hypot(w, h);
      ctx.clearRect(0, 0, w, h); ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(phase);
      ctx.drawImage(texture, -side / 2, -side / 2, side, side); ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  sync(); layout();
  // Poll as well as observing resize: the game can change screen without resizing.
  setInterval(layout, 200);
  addEventListener('resize', layout);
  addEventListener('scroll', layout, true);
  document.addEventListener('visibilitychange', layout);
  requestAnimationFrame(frame);
})();

