// Hypno Reverie 0.5.0 — Jaxx-01-ai
// Original canvas renderer and opt-in, room-scoped control protocol.
(() => {
  'use strict';
  const VERSION = '0.5.0', KEY = 'hypnoreverie-v2', CHANNEL = 'HypnoReverie';
  const PRESET_KEY = 'hypnoreverie-presets-v1', PRIVACY_KEY = 'hypnoreverie-head-sharing-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const num = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  const color = (v, fallback) => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v) ? v : fallback;
  const bool = (v, fallback) => typeof v === 'boolean' ? v : fallback;
  const choice = (v, values, fallback) => values.includes(v) ? v : fallback;
  const spiralDefault = { enabled: true, color: '#b47bff', background: '#171024', backgroundOpacity: 0.2,
    opacity: 0.4, arms: 4, spin: 0.7, reverse: false, throbSpeed: 0.4, throbStrength: 0,
    zoom: 1, thickness: 0.5, blur: 0, curve: 2.5 };
  const defaults = { width: 50, spirals: [spiralDefault, { ...spiralDefault, enabled: false, color: '#69e0e8',
    opacity: 0.22, arms: 3, reverse: true, backgroundOpacity: 0, spin: 0.45 }],
    text: { enabled: false, color: '#ffffff', opacity: 0.8, duration: 2, gap: 0.5, fontSize: 54,
      mode: 'center', lines: 5, random: false, messages: [] },
    pulse: { enabled: false, mode: 'interval', color: '#c3a2ff', opacity: 0.15, duration: 0.8,
      interval: 5, randomMin: 4, randomMax: 10, shape: 'soft' },
    head: { words: false, forehead: false, eyes: false, halo: false, color: '#bf93ff', opacity: 0.7,
      size: 1, wordSize: 14, offsetX: 0, offsetY: 0, wordMode: 'orbit' } };
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const spirals = [0, 1].map(i => {
      const d = defaults.spirals[i], s = raw.spirals?.[i] || {};
      return { enabled: bool(s.enabled, d.enabled), color: color(s.color, d.color),
        background: color(s.background, d.background), backgroundOpacity: num(s.backgroundOpacity, d.backgroundOpacity, 0, 1),
        opacity: num(s.opacity, d.opacity, 0, 1), arms: Math.round(num(s.arms, d.arms, 1, 32)),
        spin: num(s.spin, d.spin, 0, 12), reverse: bool(s.reverse, d.reverse),
        throbSpeed: num(s.throbSpeed, d.throbSpeed, 0, 5), throbStrength: num(s.throbStrength, d.throbStrength, 0, 0.6),
        zoom: num(s.zoom, d.zoom, 0.25, 6), thickness: num(s.thickness, d.thickness, 0.01, 0.99),
        blur: num(s.blur, d.blur, 0, 50), curve: num(s.curve, d.curve, 0, 12) };
    });
    const t = raw.text || {}, p = raw.pulse || {}, h = raw.head || {}, td = defaults.text, pd = defaults.pulse;
    const messages = Array.isArray(t.messages) ? t.messages.filter(x => typeof x === 'string')
      .slice(0, 40).map(x => x.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 160).trim()).filter(Boolean) : [];
    const min = num(p.randomMin, pd.randomMin, 2, 120);
    return { width: num(raw.width, 50, 10, 50), spirals,
      text: { enabled: bool(t.enabled, false), color: color(t.color, td.color), opacity: num(t.opacity, td.opacity, 0, 1),
        duration: num(t.duration, td.duration, 0.08, 30), gap: num(t.gap, td.gap, 0, 30),
        fontSize: num(t.fontSize, td.fontSize, 12, 180), mode: choice(t.mode, ['center', 'wall', 'lines', 'write', 'scatter', 'mixed'], 'center'),
        lines: Math.round(num(t.lines, td.lines, 1, 12)), random: bool(t.random, false), messages },
      pulse: { enabled: bool(p.enabled, false), mode: choice(p.mode, ['interval', 'random', 'text'], 'interval'),
        color: color(p.color, pd.color), opacity: num(p.opacity, pd.opacity, 0, 0.45),
        duration: num(p.duration, pd.duration, 0.3, 3), interval: num(p.interval, pd.interval, 2, 120),
        randomMin: min, randomMax: Math.max(min, num(p.randomMax, pd.randomMax, 2, 120)),
        shape: choice(p.shape, ['soft', 'flash'], 'soft') },
      head: { words: bool(h.words, false), forehead: bool(h.forehead, false), eyes: bool(h.eyes, false), halo: bool(h.halo, false),
        color: color(h.color, '#bf93ff'), opacity: num(h.opacity, 0.7, 0, 0.9), size: num(h.size, 1, 0.4, 2),
        wordSize: num(h.wordSize, 14, 8, 24), offsetX: num(h.offsetX, 0, -200, 200), offsetY: num(h.offsetY, 0, -300, 300),
        wordMode: choice(h.wordMode, ['orbit', 'sparkle'], 'orbit') } };
  }
  function bounds(g, c, width, vw, vh) {
    if (!g?.width || !g.height || !c?.width || !c.height || c.left <= g.left) return null;
    const left = Math.max(0, g.left), top = Math.max(0, g.top);
    const w = Math.min(g.left + g.width * width / 100, c.left - 2, vw) - left;
    const h = Math.min(g.bottom, vh) - top;
    return w > 0 && h > 0 ? { left, top, width: w, height: h } : null;
  }
  // This gate is the only path by which a remote command can change the receiver.
  class ControlGate {
    constructor() { this.grant = null; this.lastSequence = 0; this.lastCommand = -Infinity; }
    issue(sender, level, token, now, minutes, allowPulse) {
      if (!Number.isSafeInteger(sender) || !['visuals', 'text', 'session'].includes(level) || typeof token !== 'string' || token.length < 16)
        throw new Error('Invalid grant');
      this.grant = { sender, level, token, expires: minutes === null ? null : now + num(minutes, 15, 1, 30) * 60000, allowPulse: !!allowPulse };
      this.lastSequence = 0; this.lastCommand = -Infinity;
      return clone(this.grant);
    }
    revoke() { this.grant = null; this.lastSequence = 0; }
    apply(sender, packet, current, now, present) {
      const g = this.grant;
      if (!g || (g.expires !== null && now >= g.expires) || !present || sender !== g.sender || packet.token !== g.token ||
        !Number.isSafeInteger(packet.seq) || packet.seq <= this.lastSequence || now - this.lastCommand < 200) return null;
      if (!packet.settings || typeof packet.settings !== 'object') return null;
      const incoming = normalize(packet.settings), next = clone(current);
      next.spirals = incoming.spirals;
      next.head = incoming.head;
      if (g.level === 'visuals') { next.head.words = current.head.words; next.head.wordMode = current.head.wordMode; }
      if (g.level !== 'visuals') next.text = incoming.text;
      if (g.allowPulse) next.pulse = incoming.pulse;
      this.lastSequence = packet.seq; this.lastCommand = now;
      return { settings: normalize(next), enabled: g.level === 'session' && typeof packet.enabled === 'boolean' ? packet.enabled : undefined,
        locked: g.level === 'session' && typeof packet.locked === 'boolean' ? packet.locked : undefined };
    }
  }
  function textFrame(t, seconds) {
    if (!t.enabled || !t.messages.length) return { message: '', index: -1, cycle: -1, progress: 0 };
    const period = t.duration + t.gap, cycle = Math.floor(seconds / period), age = seconds % period;
    // Stable pseudo-random order means changing frame rate does not skip words.
    const index = t.random ? ((Math.imul(cycle + 1, 1664525) + 1013904223) >>> 0) % t.messages.length : cycle % t.messages.length;
    const message = age < t.duration ? t.messages[index] : '';
    return { message, index, cycle, progress: Math.min(1, age / Math.max(0.08, t.duration * 0.75)) };
  }
  function random01(seed) {
    let value = seed | 0; value ^= value >>> 16; value = Math.imul(value, 0x7feb352d); value ^= value >>> 15;
    value = Math.imul(value, 0x846ca68b); value ^= value >>> 16; return (value >>> 0) / 4294967296;
  }
  function textPosition(mode, cycle) {
    if (mode === 'mixed' && cycle % 2 === 0) return { x: 0.5, y: 0.5 };
    const x = 0.15 + random01(cycle * 3 + 1) * 0.7, y = 0.12 + random01(cycle * 3 + 2) * 0.76;
    if (mode !== 'mixed') return { x, y };
    const edge = Math.floor(random01(cycle * 3 + 3) * 4);
    return edge === 0 ? { x, y: 0.15 } : edge === 1 ? { x, y: 0.85 } : edge === 2 ? { x: 0.18, y } : { x: 0.82, y };
  }
  function normalizePresets(raw) {
    return Array.isArray(raw) ? raw.slice(0, 24).filter(p => p && typeof p.name === 'string' && p.name.trim())
      .map(p => ({ name: p.name.trim().slice(0, 40), settings: normalize(p.settings) })) : [];
  }
  function drawSpiralTexture(tx,s,size) {
    const center=size/2,radius=size*0.72,sector=Math.PI*2/s.arms;
    tx.clearRect(0,0,size,size);tx.fillStyle=s.color;
    for(let arm=0;arm<s.arms;arm++){
      tx.beginPath();
      for(let step=0;step<=300;step++){
        const r=radius*step/300,a=arm*sector+r/radius*s.curve*Math.PI*2;
        const x=center+r*Math.cos(a),y=center+r*Math.sin(a);if(step)tx.lineTo(x,y);else tx.moveTo(x,y);
      }
      const outer=arm*sector+s.curve*Math.PI*2;
      tx.arc(center,center,radius,outer,outer+sector*s.thickness);
      for(let step=300;step>=0;step--){const r=radius*step/300,a=arm*sector+sector*s.thickness+r/radius*s.curve*Math.PI*2;tx.lineTo(center+r*Math.cos(a),center+r*Math.sin(a));}
      tx.closePath();tx.fill();
    }
  }
  const core = { drawSpiralTexture, normalize, defaults, bounds, ControlGate, textFrame, textPosition, normalizePresets };
  if (typeof module !== 'undefined' && module.exports && typeof document === 'undefined') { module.exports = core; return; }
  if (window.HypnoReverie?.version === VERSION) { window.HypnoReverie.open(); return; }
  if (window.HypnoReverie?.destroy) window.HypnoReverie.destroy();
  if (document.getElementById('player-spiral-addon')) {
    alert('Reload the game once to unload the older Hypno Reverie version, then click your bookmark again.'); return;
  }
  let settings;
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) settings = normalize(JSON.parse(stored));
    else {
      const old = JSON.parse(localStorage.getItem('player-spiral-settings-v1') || 'null');
      const migrated = clone(defaults);
      if (old) { Object.assign(migrated.spirals[0], { color: old.color1, background: old.color2, opacity: old.opacity,
        spin: old.speed, arms: old.arms, curve: old.twist, zoom: old.scale, reverse: old.reverse }); migrated.width = old.width; }
      settings = normalize(migrated);
    }
  } catch { settings = normalize(); }
  let presets = [], privacy = { broadcast: false, showOthers: true }, hideSharedUntilEnabled = false;
  try { presets = normalizePresets(JSON.parse(localStorage.getItem(PRESET_KEY) || '[]')); } catch {}
  try { const p = JSON.parse(localStorage.getItem(PRIVACY_KEY) || '{}'); privacy = { broadcast: p.broadcast === true, showOthers: p.showOthers !== false }; } catch {}
  const SESSION_KEY='hypnoreverie-resume-v1';
  let resume = {remember:false,enabled:false,member:null};
  try{const value=JSON.parse(localStorage.getItem(SESSION_KEY)||'{}');resume={remember:value.remember===true,enabled:value.enabled===true,member:Number.isSafeInteger(value.member)?value.member:null};}catch{}
  let remoteHeadSharing = false;
  let enabled = resume.remember && resume.enabled && resume.member===window.Player?.MemberNumber, locked = false, destroyed = false, socket = null, selected = 'self';
  let activeTime = 0, lastFrame = 0, frameId = 0, rectangle = null, networkRoom = null, networkMember = null;
  let dominant = false, pulseAllowed = false, status = enabled ? 'Saved effects resumed.' : 'Ready. Effects are off.', lastHello = 0;
  const gate = new ControlGate(), peers = new Map(), receivedGrants = new Map();
  let viewedProfile = null; const keyRequests = new Map(), requestTimes = new Map();
  const publicHeads = new Map(); let lastPublic = 0, publicWasActive = false, profileButton = null;
  const phases = [0, 0], effectTextures = [document.createElement('canvas'), document.createElement('canvas')], effectTextureKeys = ['', ''];
  const host = document.createElement('div'); host.id = 'hypnoreverie-addon';
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10000';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  const LOGO = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect x=\"4\" y=\"17\" width=\"56\" height=\"33\" rx=\"12\" fill=\"#251a3c\" stroke=\"#c4a0ff\" stroke-width=\"3\"/><path d=\"M6 24 1 28v12l5 3m52-19 5 4v12l-5 3M24 50l8-7 8 7\" fill=\"none\" stroke=\"#c4a0ff\" stroke-width=\"3\"/><path d=\"M33 33c0-3-5-3-5 1 0 6 10 6 10-1 0-10-16-10-16 1 0 14 23 14 23-1 0-18-30-18-30 1\" fill=\"none\" stroke=\"#e5d6ff\" stroke-width=\"2.5\" stroke-linecap=\"round\"/></svg>";
  root.innerHTML = `<style>
    :host{color-scheme:dark;font:14px system-ui,sans-serif;color:#f2edff}*{box-sizing:border-box}[hidden]{display:none!important}
    #effect,#heads{position:fixed;pointer-events:none}#ui{position:fixed;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;padding:16px}
    button,select,input,textarea{font:inherit;color:inherit}button,select{background:#2b203d;border:1px solid #6b537f;border-radius:8px;padding:8px 11px;cursor:pointer}
    button{pointer-events:auto}button:hover{background:#47305f}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #cfafff;outline-offset:2px}
    button:disabled{opacity:.4;cursor:not-allowed}#stop{background:#592c42;border-color:#b5678d}#panel{pointer-events:auto;width:min(760px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#17121f;border:1px solid #70568b;border-radius:18px;box-shadow:0 18px 80px #000b;overflow:hidden}
    .header{padding:17px 20px 0;background:#21172e}.brand{display:flex;align-items:center;gap:12px}.brand svg{width:48px;height:48px;flex:none}.brand h2{font-size:21px;margin:0}.brand small{font-size:12px;color:#b7a3cc}.brand #close{margin-left:auto;font-size:19px;padding:4px 10px}
    .tabs{display:flex;gap:4px;overflow-x:auto;padding:14px 0 10px}.tabs button{white-space:nowrap;border-color:transparent;background:none;padding:8px 10px}.tabs button[aria-selected=true]{background:#66458d;color:white}
    .session-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;border-top:1px solid #4c385d;padding:9px 0}.session-bar label{margin:0}.session-bar #target{max-width:240px}.session-bar .help{margin-left:auto}
    #content{padding:18px 20px;overflow-y:auto;min-height:0;overscroll-behavior:contain}h3{font-size:16px;margin:0 0 8px}p{color:#c3b2d2;line-height:1.5;margin:8px 0 14px}.help{font-size:12px;color:#bca9ce}
    label{display:block;margin:0}input[type=range]{display:block;width:100%;accent-color:#bd8cff;margin-top:9px}input[type=checkbox]{accent-color:#bd8cff;margin-right:6px}input[type=color]{height:30px;width:54px;border:0;padding:0;background:none;vertical-align:middle}
    input[type=number],input[type=text]{background:#271c34;border:1px solid #6b537f;border-radius:7px;padding:7px}input[type=number]{width:90px}input[type=text]{width:100%}output{float:right;color:#d5b5ff;font-variant-numeric:tabular-nums}textarea{display:block;width:100%;min-height:130px;margin-top:8px;resize:vertical;background:#21172e;border:1px solid #6b537f;border-radius:8px;padding:10px}
    fieldset{border:0;padding:0;margin:0;min-width:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}fieldset>label{background:#22192d;border:1px solid #36253f;border-radius:10px;padding:11px;font-size:13px}.wide{grid-column:1/-1}fieldset:disabled{opacity:.5}.row{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.card{padding:15px;background:#241a30;border:1px solid #463052;border-radius:12px;margin:0 0 13px}.card label{margin:10px 0}.notice{padding:10px 12px;background:#38223b;border:1px solid #684364;border-radius:9px;font-size:12px;margin:10px 0;line-height:1.5}.notice a{color:#e0c3ff}
    #footer{padding:12px 20px;border-top:1px solid #463052;background:#21172e}.footer-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#status{margin:0;font-size:12px;flex:1}#remote-actions{display:flex;gap:8px}#grant-info{overflow-wrap:anywhere}select{max-width:100%}.danger-note{color:#e7abc9}
    @media(max-width:560px){fieldset{grid-template-columns:1fr}.header,#content,#footer{padding-left:12px;padding-right:12px}.tabs button{padding:8px}.session-bar #target{max-width:180px}.brand h2{font-size:18px}}
    #panel{position:fixed;resize:both;min-width:min(340px,calc(100vw - 16px));min-height:min(360px,calc(100vh - 16px));max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);container-type:inline-size}
    #drag-bar,#preview-bar{cursor:move;touch-action:none;user-select:none}#compact{margin-left:auto}.brand #close{margin-left:0}
    #preview-window{position:fixed;left:16px;top:16px;width:310px;max-width:calc(100vw - 16px);background:#21172e;border:1px solid #70568b;border-radius:12px;pointer-events:auto;padding:10px;box-shadow:0 8px 30px #0008}
    #preview-bar{display:flex;align-items:center;justify-content:space-between}#preview-window p{margin:6px 0;font-size:11px}#preview-canvas{display:block;width:100%;max-height:45vh;object-fit:contain;background:#161222}
    @container(max-width:510px){fieldset{grid-template-columns:1fr}.header,#content,#footer{padding-left:10px;padding-right:10px}.brand h2{font-size:17px}.brand svg{width:32px;height:32px}.tabs{padding-top:8px}.tabs button{padding:6px}.session-bar{gap:6px}.session-bar #target{max-width:170px}}
  </style>
  <canvas id="effect" aria-hidden="true" hidden></canvas><canvas id="heads" aria-hidden="true" hidden></canvas>
  <div id="ui" hidden><section id="panel" role="dialog" aria-label="Hypno Reverie settings" hidden>
    <div class="header"><div class="brand" id="drag-bar" title="Drag to move the menu">${LOGO}<div><h2>Hypno Reverie</h2><small>0.5 · Drag here to move</small></div><button id="compact" title="Toggle compact menu; drag the bottom-right corner to resize" aria-label="Toggle compact menu">↔</button><button id="close" aria-label="Close menu">×</button></div>
      <div class="tabs" role="tablist" aria-label="Settings categories">
        <button data-tab="overview" role="tab" aria-selected="true">Overview</button><button data-tab="primary" role="tab" aria-selected="false">Primary</button><button data-tab="secondary" role="tab" aria-selected="false">Secondary</button>
        <button data-tab="text" role="tab" aria-selected="false">Words</button><button data-tab="pulse" role="tab" aria-selected="false">Pulse</button><button data-tab="head" role="tab" aria-selected="false">Head</button><button data-tab="sharing" role="tab" aria-selected="false">Keys</button><button data-tab="presets" role="tab" aria-selected="false">Presets</button>
      </div>
      <div class="session-bar"><label>Edit <select id="target"><option value="self">My overlay</option></select></label><label><input id="enabled" type="checkbox"> Effects on</label><label id="lock-row" hidden><input id="lock" type="checkbox"> Lock controls</label><button id="preview-toggle" aria-pressed="false">Preview draft</button><span id="session-badge" class="help">Local session</span></div>
    </div>
    <div id="content"><div id="profile-card" class="card" hidden><h3 id="profile-title"></h3><p id="profile-status"></p><div id="request-options"><label>Requested access <select id="request-level"><option value="visuals">Visuals only</option><option value="text">Visuals + words</option><option value="session">Full session + control lock</option></select></label><label>Duration <select id="request-duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="indefinite">No time limit</option></select></label><label><input id="request-pulse" type="checkbox"> Include pulse / flash changes</label></div><button id="request-keys">Request keys</button></div><div id="requests-card" class="card" hidden><h3>Key requests</h3><div id="requests-list"></div><p class="help">The controller chooses the requested permissions. Yes grants exactly those permissions; No declines.</p></div>
      <div id="remote-note" class="notice" hidden>Editing a remote draft. Send changes to apply it.</div>
      <div id="overview" role="tabpanel"><h3>Set the scene</h3><p>Build your spirals, add words and pulse effects, then save a preset. Changes to your own overlay apply immediately.</p>
        <div class="card" id="local-session-card"><h3>Session controls</h3><p id="stop-note">Stop your effects and revoke keys to your overlay.</p><button id="stop">Stop / revoke</button><label><input id="remember-session" type="checkbox"> Keep effects on across room changes and relog</label><p class="help">Remembers on/off for this account when the addon loads again. Keys and locks still clear when leaving the room or disconnecting.</p><p class="help">While keys are handed over, this button is disabled. Escape stops your session only while controls are unlocked.</p></div>
        <div class="notice">Photosensitivity notice: flashing lights and moving patterns may trigger seizures in people with photosensitive epilepsy. Avoid these effects if they are a trigger for you. Stop if you feel unwell. <a href="https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity" target="_blank" rel="noopener noreferrer">Learn more</a></div>
        <p class="help">Open this menu from the headset icon in your player profile, your bookmark, or Alt+Shift+H. Close the menu to return to play.</p>
      </div>
      <div id="primary" role="tabpanel" hidden><h3>Primary spiral</h3><p class="help">Your main colour and motion layer.</p><fieldset id="primary-fields"></fieldset></div>
      <div id="secondary" role="tabpanel" hidden><h3>Secondary spiral</h3><p class="help">Blend an independent spiral over the primary.</p><fieldset id="secondary-fields"></fieldset></div>
      <div id="text" role="tabpanel" hidden><h3>Word flashes</h3><p class="help">One word or sentence per line. Random positions stay within the player area; center + periphery alternates between the middle and edges.</p><fieldset id="text-fields"></fieldset></div>
      <div id="pulse" role="tabpanel" hidden><h3>Pulse & flash</h3><p class="help">Choose a rhythm. Flashes remain limited to one every two seconds or slower.</p><fieldset id="pulse-fields"></fieldset></div>
      <div id="head" role="tabpanel" hidden><h3>Head effects</h3><p class="help">Combine tiny words, a forehead spiral, spiral eyes, and a halo. Other players see these while your overlay is on; they are hidden on your own character. Use Preview draft to inspect them. Position controls help align unusual poses.</p>
        <div class="card"><label id="broadcast-label"><input id="broadcast-head" type="checkbox"> Share my head effects with the room</label><p class="help">Shares your head-effect settings and the currently displayed words with other Hypno Reverie users. During a grant, head effects enabled by your controller are shared automatically. Each viewer can still hide shared effects.</p><label><input id="show-heads" type="checkbox"> Show other players’ shared head effects</label></div><fieldset id="head-fields"></fieldset>
      </div>
      <div id="sharing" role="tabpanel" hidden><h3>Hand over the keys</h3><p class="help">Both players need version 0.5 for all features. Dominant/controller status is self-declared; choose by name and member number.</p>
        <div class="card"><label><input id="dominant" type="checkbox"> Available as a dominant/controller</label><button id="discover">Find players</button></div>
        <div class="card"><label>Give keys to <select id="peer"><option value="">No controllers discovered</option></select></label><label>Permission <select id="level"><option value="visuals">Visuals only</option><option value="text">Visuals + words</option><option value="session">Full session + control lock</option></select></label>
          <label><input id="allow-pulse" type="checkbox"> Also allow pulse/flash changes</label><label>Duration <select id="duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="custom">Custom</option><option value="indefinite">No time limit</option></select></label><label id="minutes-row" hidden>Minutes <input id="minutes" type="number" min="1" max="30" value="15"></label>
          <p class="help">A grant shares your current settings and message list, and allows controller-enabled head effects to be visible to the room. No time limit lasts for this room session; room changes, disconnects, returning keys, or Escape while unlocked end it. Grants are never saved.</p>
          <div class="row"><button id="grant">Give keys</button><button id="revoke">Revoke keys</button></div><p id="grant-info"></p>
        </div>
      </div>
      <div id="presets" role="tabpanel" hidden><h3>Saved presets</h3><p class="help">Save the complete appearance, words, pulse and head settings. Presets never save access grants, locks, visibility-sharing choices, or turn effects on.</p>
        <div class="card"><label>Preset <select id="preset-list"><option value="">Choose a preset</option></select></label><div class="row"><button id="preset-load">Load preset</button><button id="preset-delete">Delete selected</button></div></div>
        <div class="card"><label>Name <input id="preset-name" type="text" maxlength="40" placeholder="e.g. Slow violet"></label><button id="preset-save">Save current settings</button><p class="help">Using the same name replaces that preset. Up to 24 presets, saved in this browser.</p></div>
      </div>
    </div>
    <div id="footer"><div class="footer-row"><p id="status" role="status"></p><div id="remote-actions" hidden><button id="apply">Send changes</button><button id="release">Return keys</button></div></div><div class="help">Escape: stop when unlocked · Alt+Shift+H: menu · Alt+Shift+S: toggle when unlocked</div></div>
  </section></div><section id="preview-window" hidden aria-label="Local draft preview"><div id="preview-bar"><strong>Draft preview</strong><button id="preview-close" aria-label="Close preview">×</button></div><p id="preview-label" class="help"></p><canvas id="preview-canvas" width="500" height="500"></canvas><p class="help">Local preview · Send changes to update their screen. Head position uses a sample figure.</p></section>`;
  const $ = id => root.getElementById(id), canvas = $('effect'), ctx = canvas.getContext('2d');
  const heads = $('heads'), hx = heads.getContext('2d'); let headRectangle = null;
  const fields = [];
  function getPath(object, path) { return path.reduce((value, key) => value[key], object); }
  function setPath(object, path, value) { path.slice(0, -1).reduce((v, k) => v[k], object)[path.at(-1)] = value; }
  function editState() { return selected === 'self' ? settings : receivedGrants.get(Number(selected))?.draft || normalize(); }
  function field(parent, path, title, type, min, max, step, options) {
    const label = document.createElement('label'), input = document.createElement(type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input');
    const id = 'setting-' + path.join('-'); input.id = id; label.htmlFor = id;
    if (!['select', 'textarea'].includes(type)) input.type = type;
    label.append(document.createTextNode(title + ' '));
    if (type === 'range' || type === 'number') { input.min = min; input.max = max; input.step = step; }
    if (options) for (const [value, text] of options) { const option = document.createElement('option'); option.value = value; option.textContent = text; input.append(option); }
    const output = type === 'range' ? document.createElement('output') : null;
    if (output) label.append(output);
    label.append(input); if (type === 'textarea') label.classList.add('wide'); $(parent).append(label);
    const record = { input, path, type, output }; fields.push(record);
    input.addEventListener('input', () => {
      if (selected === 'self' && locked) return;
      const value = type === 'checkbox' ? input.checked : ['range', 'number'].includes(type) ? Number(input.value) : type === 'textarea' ? input.value.split('\n') : input.value;
      const next = clone(editState()); setPath(next, path, value);
      if (selected === 'self') { settings = normalize(next); save(); resetEffectClock(); }
      else { const grant = receivedGrants.get(Number(selected)); if (grant) grant.draft = normalize(next); }
      refreshFields(input); layout();
    });
  }
  function slider(parent, path, title, min, max, step = 0.01) { field(parent, path, title, 'range', min, max, step); }
  for (const [i, parent] of ['primary-fields', 'secondary-fields'].entries()) {
    const path = key => ['spirals', i, key];
    field(parent, path('enabled'), 'Enable this spiral', 'checkbox');
    field(parent, path('color'), 'Spiral colour', 'color');
    field(parent, path('background'), 'Background colour', 'color');
    slider(parent, path('opacity'), 'Spiral opacity', 0, 1);
    slider(parent, path('backgroundOpacity'), 'Background opacity', 0, 1);
    slider(parent, path('arms'), 'Arms', 1, 32, 1);
    slider(parent, path('spin'), 'Spin speed (radians/s)', 0, 12, 0.05);
    field(parent, path('reverse'), 'Reverse spin', 'checkbox');
    slider(parent, path('throbSpeed'), 'Throb speed (cycles/s)', 0, 5, 0.05);
    slider(parent, path('throbStrength'), 'Throb strength', 0, 0.6);
    slider(parent, path('zoom'), 'Zoom', 0.25, 6, 0.05);
    slider(parent, path('thickness'), 'Thickness', 0.01, 0.99);
    slider(parent, path('blur'), 'Blur factor (px)', 0, 50, 0.5);
    slider(parent, path('curve'), 'Spiral curve', 0, 12, 0.1);
  }
  slider('primary-fields', ['width'], 'Player area width (%)', 10, 50, 1);
  field('text-fields', ['text', 'enabled'], 'Enable subliminal / cycling text', 'checkbox');
  field('text-fields', ['text', 'messages'], 'Edit messages — one word or sentence per line (40 max, 160 characters each)', 'textarea');
  field('text-fields', ['text', 'mode'], 'Layout', 'select', null, null, null,
    [['center', 'Centered message'], ['wall', 'Wall of text'], ['lines', 'Lines'], ['write', 'Write / typewriter'], ['scatter', 'Random positions'], ['mixed', 'Center + periphery']]);
  field('text-fields', ['text', 'color'], 'Text colour', 'color');
  slider('text-fields', ['text', 'opacity'], 'Text opacity', 0, 1);
  field('text-fields', ['text', 'duration'], 'Message duration (seconds)', 'number', 0.08, 30, 0.01);
  field('text-fields', ['text', 'gap'], 'Gap between messages (seconds)', 'number', 0, 30, 0.05);
  slider('text-fields', ['text', 'fontSize'], 'Font size (px)', 12, 180, 1);
  slider('text-fields', ['text', 'lines'], 'Number of lines', 1, 12, 1);
  field('text-fields', ['text', 'random'], 'Random message order', 'checkbox');
  field('pulse-fields', ['pulse', 'enabled'], 'Enable pulse / flash', 'checkbox');
  field('pulse-fields', ['pulse', 'mode'], 'Timing', 'select', null, null, null,
    [['interval', 'Fixed interval'], ['random', 'Random interval'], ['text', 'With each text message']]);
  field('pulse-fields', ['pulse', 'shape'], 'Effect', 'select', null, null, null, [['soft', 'Soft pulse'], ['flash', 'Flash with fade']]);
  field('pulse-fields', ['pulse', 'color'], 'Pulse colour', 'color');
  slider('pulse-fields', ['pulse', 'opacity'], 'Pulse opacity', 0, 0.45);
  field('pulse-fields', ['pulse', 'duration'], 'Pulse duration (seconds)', 'number', 0.3, 3, 0.1);
  field('pulse-fields', ['pulse', 'interval'], 'Interval (seconds)', 'number', 2, 120, 0.5);
  field('pulse-fields', ['pulse', 'randomMin'], 'Random minimum (seconds)', 'number', 2, 120, 0.5);
  field('pulse-fields', ['pulse', 'randomMax'], 'Random maximum (seconds)', 'number', 2, 120, 0.5);
  for (const [key, title] of [['words','Tiny words'],['forehead','Forehead spiral'],['eyes','Spiral eyes'],['halo','Spiral halo']]) field('head-fields', ['head',key], title, 'checkbox');
  field('head-fields',['head','wordMode'],'Word motion','select',null,null,null,[['orbit','Orbit around head'],['sparkle','Appear around head']]);
  field('head-fields',['head','color'],'Head effect colour','color');
  slider('head-fields',['head','opacity'],'Opacity',0,0.9);
  slider('head-fields',['head','size'],'Spiral size',0.4,2,0.05);
  slider('head-fields',['head','wordSize'],'Tiny word size',8,24,1);
  slider('head-fields',['head','offsetX'],'Horizontal alignment',-200,200,1);
  slider('head-fields',['head','offsetY'],'Vertical alignment',-300,300,1);
  function saveSession() {
    resume.enabled=enabled;const member=player()?.MemberNumber;if(Number.isSafeInteger(member))resume.member=member;
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(resume));}catch{say('Could not save session preference.');}
  }
  $('remember-session').onchange=()=>{resume.remember=$('remember-session').checked;saveSession();};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { say('Appearance could not be saved.'); } }
  function say(message) { status = message; $('status').textContent = message; }
  function refreshFields(skip) {
    const current = editState(), remote = receivedGrants.get(Number(selected));
    for (const record of fields) {
      const value = getPath(current, record.path);
      if (record.input !== skip && root.activeElement !== record.input) {
        if (record.type === 'checkbox') record.input.checked = value;
        else record.input.value = record.type === 'textarea' ? value.join('\n') : value;
      }
      if (record.output) record.output.value = Number(value).toFixed(record.input.step === '1' ? 0 : 2);
      record.input.disabled = selected !== 'self' && record.path[0] === 'width';
    }
    const noAccess = selected !== 'self' && !remote;
    const localLocked = (selected === 'self' && locked) || noAccess;
    $('primary-fields').disabled = $('secondary-fields').disabled = localLocked;
    $('text-fields').disabled = localLocked || (selected !== 'self' && remote?.level === 'visuals');
    $('pulse-fields').disabled = localLocked || (selected !== 'self' && !remote?.allowPulse);
    $('enabled').checked = selected === 'self' ? enabled : !!remote?.enabled;
    $('enabled').disabled = localLocked || (selected !== 'self' && remote?.level !== 'session');
    $('lock-row').hidden = selected === 'self' || remote?.level !== 'session';
    $('lock').checked = !!remote?.locked;
    $('remote-actions').hidden = selected === 'self' || noAccess; $('remote-note').hidden = selected === 'self' || noAccess;
    $('preview-toggle').disabled = noAccess;
    $('head-fields').disabled = localLocked;
    for (const record of fields) if (selected !== 'self' && remote?.level === 'visuals' && record.path[0] === 'head' && ['words','wordMode'].includes(record.path[1])) record.input.disabled = true;
    $('stop').disabled = $('revoke').disabled = $('grant').disabled = !!gate.grant;
    for (const id of ['peer','level','allow-pulse','duration','minutes']) $(id).disabled = !!gate.grant;
    $('preset-load').disabled = localLocked; $('preset-save').disabled = noAccess;
    $('broadcast-head').checked = privacy.broadcast;
    $('show-heads').checked = privacy.showOthers && !hideSharedUntilEnabled;
    $('local-session-card').hidden = selected !== 'self'; $('broadcast-label').hidden = selected !== 'self';
    $('session-badge').textContent = selected !== 'self' ? 'Remote draft' : gate.grant ? (locked ? 'Controls locked' : 'Keys handed over') : 'Local session';
    $('remember-session').checked=resume.remember;
    $('status').textContent = status; refreshProfileCard();
  }
  for (const button of root.querySelectorAll('[data-tab]')) button.onclick = () => {
    $('content').scrollTop = 0;
    for (const tab of root.querySelectorAll('[data-tab]')) {
      const active = tab === button; tab.setAttribute('aria-selected', String(active)); $(tab.dataset.tab).hidden = !active;
    }
  };
  let windowReady = false;
  function clampWindow(element) {
    if (element.hidden) return;
    const r = element.getBoundingClientRect();
    element.style.left = Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px';
    element.style.top = Math.max(8,Math.min(r.top,innerHeight-r.height-8))+'px';
  }
  function draggable(element,bar) {
    let drag = null;
    bar.addEventListener('pointerdown',e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const r=element.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};bar.setPointerCapture(e.pointerId);e.preventDefault();
    });
    bar.addEventListener('pointermove',e => { if(!drag)return; element.style.left=(e.clientX-drag.x)+'px';element.style.top=(e.clientY-drag.y)+'px';clampWindow(element); });
    const finish=()=>{drag=null;};bar.addEventListener('pointerup',finish);bar.addEventListener('pointercancel',finish);
  }
  draggable($('panel'),$('drag-bar'));draggable($('preview-window'),$('preview-bar'));
  const windowObserver = new ResizeObserver(()=>{clampWindow($('panel'));clampWindow($('preview-window'));});windowObserver.observe($('panel'));
  $('compact').onclick=()=>{const panel=$('panel'),small=panel.getBoundingClientRect().width>520;panel.style.width=small?'390px':'760px';panel.style.height=small?'500px':'680px';clampWindow(panel);};
  function showPreview(on) { $('preview-window').hidden=!on;$('preview-toggle').setAttribute('aria-pressed',String(on));clampWindow($('preview-window')); }
  $('preview-toggle').onclick=()=>showPreview($('preview-window').hidden);$('preview-close').onclick=()=>showPreview(false);
  function open() { $('ui').hidden = $('panel').hidden = false; if(!windowReady){const p=$('panel');p.style.width=Math.min(760,innerWidth-32)+'px';p.style.height=Math.min(680,innerHeight-32)+'px';p.style.left=Math.max(8,(innerWidth-760)/2)+'px';p.style.top='24px';windowReady=true;}clampWindow($('panel'));refreshFields(); }
  $('close').onclick = () => { $('ui').hidden = $('panel').hidden = true; };
  function privacySave() { try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(privacy)); } catch {} }
  $('broadcast-head').onchange = () => { privacy.broadcast = $('broadcast-head').checked; privacySave(); publishHead(true); };
  $('show-heads').onchange = () => { privacy.showOthers = $('show-heads').checked; hideSharedUntilEnabled = false; privacySave(); layout(); };
  $('duration').onchange = () => { $('minutes-row').hidden = $('duration').value !== 'custom'; };
  function refreshPresets() {
    const value = $('preset-list').value; $('preset-list').replaceChildren();
    for (const [i,p] of presets.entries()) { const o = document.createElement('option'); o.value = i; o.textContent = p.name; $('preset-list').append(o); }
    if (presets[Number(value)]) $('preset-list').value = value;
  }
  function savePresets() { try { localStorage.setItem(PRESET_KEY,JSON.stringify(presets)); } catch { say('Preset storage is unavailable.'); } refreshPresets(); }
  $('preset-save').onclick = () => {
    root.activeElement?.blur(); const name = $('preset-name').value.trim().slice(0,40);
    if (!name) { say('Enter a preset name.'); return; }
    const existing = presets.findIndex(p => p.name === name);
    if (existing < 0 && presets.length >= 24) { say('Delete a preset first (24 maximum).'); return; }
    const preset = {name,settings:normalize(editState())};
    if (existing >= 0) presets[existing] = preset; else presets.push(preset);
    savePresets(); $('preset-list').value = existing >= 0 ? existing : presets.length - 1; say('Preset saved.');
  };
  $('preset-load').onclick = () => {
    const preset = presets[Number($('preset-list').value)]; if (!preset || (selected === 'self' && locked)) return;
    if (selected === 'self') { settings = normalize(preset.settings); save(); resetEffectClock(); }
    else { const grant = receivedGrants.get(Number(selected)); if (grant) grant.draft = normalize(preset.settings); }
    refreshFields(); layout(); say(selected === 'self' ? 'Preset loaded.' : 'Preset loaded into remote draft. Send changes to apply permitted settings.');
  };
  $('preset-delete').onclick = () => { if (!$('preset-list').options.length) return; presets.splice(Number($('preset-list').value),1); savePresets(); say('Preset deleted.'); };
  refreshPresets();
  $('enabled').onchange = () => {
    if (selected === 'self') { if (!locked) { enabled = $('enabled').checked; saveSession(); resetEffectClock(); layout(); } }
    else { const grant = receivedGrants.get(Number(selected)); if (grant?.level === 'session') grant.enabled = $('enabled').checked; }
    refreshFields();
  };
  $('lock').onchange = () => { const grant = receivedGrants.get(Number(selected)); if (grant?.level === 'session') grant.locked = $('lock').checked; };
  $('target').onchange = () => { selected = $('target').value; viewedProfile = selected === 'self' ? null : Number(selected); refreshFields(); };
  function openProfile(member) {
    viewedProfile = member === player()?.MemberNumber ? null : member; selected = viewedProfile === null ? 'self' : String(member);
    updatePeople(); open();
    if (!receivedGrants.has(member)) root.querySelector('[data-tab=overview]').click();
  }
  function refreshProfileCard() {
    const member = viewedProfile, peer = peers.get(member), grant = receivedGrants.get(member);
    $('profile-card').hidden = member === null;
    if(member === null)return;
    const detected = peer && present(member) && Date.now()-peer.seen < 45000;
    $('profile-title').textContent = label(member);
    $('profile-status').textContent = grant ? 'Hypno Reverie detected · You have keys. Edit and preview their draft, then Send changes.' : detected ? 'Hypno Reverie detected · Request keys to edit this player’s effects.' : 'Hypno Reverie not detected in this room. They may need to load it or update. Discovery can take up to 15 seconds.';
    $('request-options').hidden = !!grant; $('request-keys').hidden = !!grant; $('request-keys').disabled = !detected || Date.now()-(requestTimes.get(member)||0)<30000;
  }
  $('request-keys').onclick = () => {
    const member=viewedProfile;if(!member || !peers.has(member) || !present(member) || Date.now()-(requestTimes.get(member)||0)<30000)return;
    dominant=true;$('dominant').checked=true;send('hello',{dominant});
    if(send('requestKeys',{level:$('request-level').value,minutes:$('request-duration').value==='indefinite'?null:Number($('request-duration').value),allowPulse:$('request-pulse').checked},member)){requestTimes.set(member,Date.now());say('Key request sent. Waiting for their approval.');refreshProfileCard();}
  };
  function refreshRequests() {
    $('requests-card').hidden=!keyRequests.size; $('requests-list').replaceChildren();
    const levels={visuals:'Visuals only',text:'Visuals + words',session:'Full session + control lock (can turn effects on/off and disable your normal controls and Escape)'};
    for(const [member,request] of keyRequests){
      const row=document.createElement('div');row.className='card';const name=document.createElement('p');
      name.textContent=label(member)+' requests '+levels[request.level]+' · '+(request.minutes===null?'no time limit':request.minutes+' minutes')+' · pulse/flash changes '+(request.allowPulse?'included':'excluded')+'. Shares current settings and messages; controller-enabled head effects are visible to the room.';
      const yes=document.createElement('button');yes.textContent='Yes';yes.disabled=!!gate.grant;yes.onclick=()=>{if(keyRequests.get(member)!==request || Date.now()-request.at>120000)return;giveKeys(member,request.level,request.minutes,request.allowPulse);};
      const no=document.createElement('button');no.textContent='No';no.onclick=()=>{send('declineKeys',{},member);keyRequests.delete(member);refreshRequests();};
      row.append(name,yes,no);$('requests-list').append(row);
    }
  }

  function player() { return window.Player; }
  function characters() { return Array.isArray(window.ChatRoomCharacter) ? window.ChatRoomCharacter : []; }
  function present(member) { return characters().some(c => c.MemberNumber === member); }
  function label(member) { const c = characters().find(c => c.MemberNumber === member); return `${c?.Nickname || c?.Name || 'Player'} (#${member})`; }
  function roomKey() {
    if (!window.ChatRoomData || !player()?.MemberNumber || !(typeof window.ServerPlayerIsInChatRoom === 'function' ? window.ServerPlayerIsInChatRoom() : window.CurrentScreen === 'ChatRoom')) return null;
    return JSON.stringify([window.ChatRoomData.Name, window.ChatRoomData.Space, window.ChatRoomData.Language]);
  }
  function send(kind, payload = {}, target = null) {
    if (!roomKey() || !socket?.connected || typeof window.ServerSend !== 'function') return false;
    const message = { v: 2, kind, ...payload, to: target };
    if (JSON.stringify(message).length > 16000) return false;
    try { window.ServerSend('ChatRoomChat', { Content: CHANNEL, Type: 'Hidden', Target: target, Dictionary: message }); return true; }
    catch { return false; }
  }
  function revoke(reason, notify = true, keepEffects = false) {
    const old = gate.grant;
    if (old && notify) send('revoke', { token: old.token }, old.sender);
    gate.revoke(); locked = false; remoteHeadSharing = false;
    if (old && !keepEffects) enabled = false;
    saveSession();
    say(reason); refreshFields(); updatePeople(); layout();
  }
  function stop() {
    enabled = false; revoke('Stopped. Remote keys revoked.');
    resetEffectClock(); canvas.hidden = true; hideSharedUntilEnabled = true; heads.hidden = true; publishHead(true); refreshFields();
  }
  $('stop').onclick = () => { if (!gate.grant) stop(); }; $('revoke').onclick = () => { if (!gate.grant) revoke('Keys revoked; overlay stopped.'); };
  function keydown(event) {
    if (event.key === 'Escape') { if (!locked) stop(); }
    else if (event.altKey && event.shiftKey && event.code === 'KeyH' && !event.repeat) { event.preventDefault(); open(); }
    else if (event.altKey && event.shiftKey && event.code === 'KeyS' && !event.repeat && !locked) {
      event.preventDefault(); enabled = !enabled; saveSession(); resetEffectClock(); refreshFields(); layout();
    }
  }
  document.addEventListener('keydown', keydown, true);
  $('dominant').onchange = () => { dominant = $('dominant').checked; send('hello', { dominant }); };
  $('discover').onclick = () => { if (Date.now() - lastHello < 3000) return; lastHello = Date.now(); send('hello', { dominant }); say('Looking for players with Hypno Reverie…'); };
  function giveKeys(member,level,minutes,allowPulse) {
    if(gate.grant)return;
    const peer=peers.get(member);
    if(!peer?.dominant || !present(member) || Date.now()-peer.seen>45000){say('This controller is no longer available.');return;}
    const grant=gate.issue(member,level,crypto.randomUUID(),Date.now(),minutes,allowPulse);
    if(!send('grant',{token:grant.token,level:grant.level,expires:grant.expires,allowPulse:grant.allowPulse,settings,enabled,locked:false},member)){gate.revoke();say('Could not send keys.');return;}
    keyRequests.delete(member);say('Keys given to '+label(member)+'. Escape revokes them while unlocked.');updatePeople();refreshFields();
  }
  $('grant').onclick = () => giveKeys(Number($('peer').value),$('level').value,$('duration').value==='indefinite'?null:Number($('duration').value==='custom'?$('minutes').value:$('duration').value),$('allow-pulse').checked);
  $('apply').onclick = () => {
    // Commit the message editor if the user clicks Send before its blur handler runs.
    root.activeElement?.blur();
    const member = Number(selected), grant = receivedGrants.get(member);
    if (!grant || !present(member) || (grant.expires !== null && grant.expires <= Date.now())) { say('These keys are no longer valid.'); return; }
    if (Date.now() - (grant.lastSend || 0) < 300) return;
    grant.lastSend = Date.now(); grant.seq++;
    if (send('set', { token: grant.token, seq: grant.seq, settings: grant.draft, enabled: grant.enabled, locked: grant.locked }, member)) say('Changes sent; waiting for acknowledgement.');
    else say('Could not send changes.');
  };
  $('release').onclick = () => {
    const member = Number(selected), grant = receivedGrants.get(member);
    if (grant) send('release', { token: grant.token }, member);
    receivedGrants.delete(member); selected = 'self'; updatePeople(); refreshFields(); say('Keys returned.');
  };
  function updatePeople() {
    const peerValue = $('peer').value, targetValue = selected;
    const candidates = [...peers].filter(([id, p]) => p.dominant && present(id) && Date.now() - p.seen < 45000);
    const populate = (select, items) => {
      select.replaceChildren(); for (const [value, text] of items) { const o = document.createElement('option'); o.value = value; o.textContent = text; select.append(o); }
    };
    populate($('peer'), candidates.length ? candidates.map(([id]) => [String(id), label(id)]) : [['', 'No controllers discovered']]);
    if (candidates.some(([id]) => String(id) === peerValue)) $('peer').value = peerValue;
    const targets = new Set(receivedGrants.keys()); if(viewedProfile !== null)targets.add(viewedProfile);
    populate($('target'), [['self', 'My overlay'], ...[...targets].map(id => [String(id), label(id)])]);
    if (targetValue === 'self' || targets.has(Number(targetValue))) $('target').value = targetValue;
    else { selected = 'self'; $('target').value = 'self'; refreshFields(); }
    const g = gate.grant;
    $('grant-info').textContent = g ? `Keys: ${label(g.sender)} · ${g.level} · ${g.expires === null ? 'no time limit' : Math.max(0, Math.ceil((g.expires - Date.now()) / 60000)) + ' min remaining'}${locked ? ' · normal controls locked' : ''}` : 'No one has keys to your overlay.';
    refreshFields(); refreshRequests();
  }
  const inboundTimes = new Map();
  function onMessage(data) {
    if (!data || data.Type !== 'Hidden' || data.Content !== CHANNEL || !Number.isSafeInteger(data.Sender) || !roomKey()) return;
    if (roomKey() !== networkRoom || player()?.MemberNumber !== networkMember) {
      clearSession('Room changed. Remote keys cleared.'); return;
    }
    const sender = data.Sender, packet = data.Dictionary;
    if (sender === player()?.MemberNumber || !present(sender) || !packet || typeof packet !== 'object' || packet.v !== 2 ||
      (packet.to !== null && packet.to !== player()?.MemberNumber)) return;
    if (!['hello', 'helloAck', 'grant', 'ackGrant', 'set', 'applied', 'release', 'revoke', 'head', 'requestKeys', 'declineKeys'].includes(packet.kind)) return;
    // Discovery and cosmetic head state may broadcast; control always targets a member.
    if (!['hello', 'head'].includes(packet.kind) && packet.to !== player()?.MemberNumber) return;
    try { if (JSON.stringify(packet).length > 16000) return; } catch { return; }
    const now = Date.now(), rateKey = `${sender}:${packet.kind}`;
    if (now - (inboundTimes.get(rateKey) || 0) < 150 && !(packet.kind === 'head' && packet.active === false)) return;
    if (packet.kind === 'requestKeys' && now-(inboundTimes.get(rateKey)||0)<30000) return;
    inboundTimes.set(rateKey, now);
    if(packet.kind === 'requestKeys'){
      if(!['visuals','text','session'].includes(packet.level) || !(packet.minutes===null || (Number.isFinite(packet.minutes) && packet.minutes>=1 && packet.minutes<=30)) || typeof packet.allowPulse!=='boolean')return;
      peers.set(sender,{dominant:true,seen:now});keyRequests.set(sender,{at:now,level:packet.level,minutes:packet.minutes,allowPulse:packet.allowPulse});updatePeople();say(label(sender)+' requested keys. Review the request in the menu.');
      open();return;
    }
    if(packet.kind === 'declineKeys'){say(label(sender)+' declined your key request.');return;}
    if (packet.kind === 'head') {
      if (packet.active === true) publicHeads.set(sender, { head: normalize({head:packet.head}).head, message: typeof packet.message === 'string' ? packet.message.slice(0,160) : '', seen: now });
      else publicHeads.delete(sender);
      return;
    }
    if (packet.kind === 'hello' || packet.kind === 'helloAck') {
      peers.set(sender, { dominant: packet.dominant === true, seen: now });
      if (packet.kind === 'hello') send('helloAck', { dominant }, sender);
      updatePeople(); return;
    }
    if (packet.kind === 'grant') {
      if (!dominant || !['visuals', 'text', 'session'].includes(packet.level) || typeof packet.token !== 'string' ||
        packet.token.length < 16 || packet.token.length > 100 || (packet.expires !== null && (typeof packet.expires !== 'number' || !Number.isFinite(packet.expires) || packet.expires <= now || packet.expires > now + 31 * 60000))) return;
      receivedGrants.set(sender, { token: packet.token, level: packet.level, allowPulse: packet.allowPulse === true,
        expires: packet.expires, draft: normalize(packet.settings), enabled: packet.enabled === true, locked: false, seq: 0, seen: now });
      send('ackGrant', { token: packet.token }, sender);
      updatePeople(); refreshFields(); say(`${label(sender)} gave you overlay keys. Select their overlay above.`); return;
    }
    if (packet.kind === 'ackGrant' && gate.grant?.sender === sender && gate.grant.token === packet.token) {
      const peer = peers.get(sender); if (peer) peer.seen = now; say(`${label(sender)} received your keys.`); return;
    }
    if (packet.kind === 'set') {
      const result = gate.apply(sender, packet, settings, now, present(sender));
      if (!result) return;
      settings = result.settings;
      remoteHeadSharing = ['words','forehead','eyes','halo'].some(key => settings.head[key]);
      if (result.enabled !== undefined) enabled = result.enabled;
      if (result.locked !== undefined) locked = result.locked;
      save(); saveSession(); resetEffectClock(); refreshFields(); updatePeople(); layout(); publishHead(true);
      send('applied', { token: gate.grant.token, seq: packet.seq }, sender);
      say(`Overlay updated by ${label(sender)}${locked ? ' · normal controls locked' : ''}.`); return;
    }
    if (packet.kind === 'applied') {
      const grant = receivedGrants.get(sender);
      if (grant?.token === packet.token && packet.seq === grant.seq) say(`Changes applied on ${label(sender)}.`);
    } else if (packet.kind === 'release' && gate.grant?.sender === sender && gate.grant.token === packet.token) revoke('Controller returned the keys.', false);
    else if (packet.kind === 'revoke') {
      if (receivedGrants.get(sender)?.token !== packet.token) return;
      receivedGrants.delete(sender); updatePeople(); refreshFields(); say(`${label(sender)} revoked your keys.`);
    }
  }
  function clearSession(reason) {
    if(!resume.remember) enabled=false;
    revoke(reason, false, resume.remember); receivedGrants.clear(); peers.clear(); publicHeads.clear(); keyRequests.clear(); requestTimes.clear(); viewedProfile=null; inboundTimes.clear(); publicWasActive = false; selected = 'self';
    updatePeople(); refreshFields();
  }
  function disconnected() { clearSession('Connection lost. All remote keys cleared.'); }
  function memberLeft(data) {
    const member = data?.SourceMemberNumber ?? data?.MemberNumber;
    if (gate.grant?.sender === member) revoke('Controller left the room. Keys revoked.', false);
    receivedGrants.delete(member); peers.delete(member); publicHeads.delete(member); keyRequests.delete(member); updatePeople();
  }
  function roomSync() { clearSession('Room synchronized. Remote keys cleared.'); lastHello = 0; }
  function attachSocket(next) {
    if (socket) {
      socket.off('ChatRoomMessage', onMessage); socket.off('disconnect', disconnected);
      socket.off('ChatRoomSyncMemberLeave', memberLeft); socket.off('ChatRoomSync', roomSync);
    }
    socket = next;
    if (socket) { socket.on('ChatRoomMessage', onMessage); socket.on('disconnect', disconnected);
      socket.on('ChatRoomSyncMemberLeave', memberLeft); socket.on('ChatRoomSync', roomSync); }
  }
  function networkTick() {
    const next = window.ServerSocket;
    if (next !== socket && typeof next?.on === 'function' && typeof next?.off === 'function') { clearSession('Connected. Remote keys start cleared.'); attachSocket(next); }
    const room = roomKey(), member = player()?.MemberNumber;
    if(resume.member && member && member!==resume.member){enabled=false;saveSession();}
    if (room !== networkRoom || member !== networkMember) {
      clearSession('Room changed. Remote keys cleared.'); networkRoom = room; networkMember = member; lastHello = 0;
    }
    if (!room || !socket?.connected) { if (gate.grant || receivedGrants.size) clearSession('Not connected to a room. Keys cleared.'); return; }
    const now = Date.now();
    if (now - lastHello > 15000) { send('hello', { dominant }); lastHello = now; }
    if (gate.grant && ((gate.grant.expires !== null && now >= gate.grant.expires) || !present(gate.grant.sender) || now - (peers.get(gate.grant.sender)?.seen || 0) > 45000)) revoke('Remote session ended. Keys revoked.');
    for (const [id, grant] of receivedGrants) if ((grant.expires !== null && now >= grant.expires) || !present(id) || now - (peers.get(id)?.seen || grant.seen) > 45000) receivedGrants.delete(id);
    for (const [id, peer] of peers) if (!present(id) || now - peer.seen > 45000) peers.delete(id);
    for (const [id,request] of keyRequests) if(!present(id) || now-request.at>120000)keyRequests.delete(id);
    for (const [id,state] of publicHeads) if (!present(id) || now - state.seen > 5000) publicHeads.delete(id);
    publishHead(); updatePeople();
  }
  let pulseStart = -Infinity, nextPulse = 0, lastPulse = -Infinity, lastTextCycle = -1;
  function resetEffectClock() { activeTime = 0; lastFrame = 0; pulseStart = -Infinity; nextPulse = 0; lastPulse = -Infinity; lastTextCycle = -1; }
  function makeTexture(i, s, textures = effectTextures, textureKeys = effectTextureKeys) {
    const key = JSON.stringify([s.color, s.arms, s.curve, s.thickness]);
    if (key === textureKeys[i]) return;
    const texture = textures[i]; texture.width = texture.height = 1024;
    drawSpiralTexture(texture.getContext('2d'),s,1024);
    textureKeys[i] = key;
  }
  function syncProfileButton() {
    const menu = document.getElementById('information-sheet-screen-menu'),member = window.InformationSheetSelection?.MemberNumber;
    if (window.CurrentScreen !== 'InformationSheet' || !menu || !Number.isSafeInteger(member)) { profileButton?.remove(); profileButton = null; return; }
    const self=member===player()?.MemberNumber,peer=peers.get(member),detected=peer && present(member) && Date.now()-peer.seen<45000;
    const title=self?'Hypno Reverie':detected?'Hypno Reverie · addon detected':'Hypno Reverie · addon not detected';
    if (profileButton?.isConnected && profileButton.dataset.member===String(member)) { profileButton.title=title;profileButton.setAttribute('aria-label',title);return; }
    profileButton?.remove();const onClick = () => openProfile(member);
    if (typeof window.InformationSheetMenuButton === 'function') profileButton = window.InformationSheetMenuButton('hypnoreverie-profile', onClick, 'data:image/svg+xml,' + encodeURIComponent(LOGO), title);
    else { profileButton = document.createElement('button'); profileButton.innerHTML = LOGO; profileButton.onclick = onClick; profileButton.style.cssText = 'width:60px;height:60px;cursor:pointer'; }
    profileButton.dataset.member=String(member);profileButton.title=title;profileButton.setAttribute('aria-label',title);menu.append(profileButton);
  }
  function layout() {
    syncProfileButton(); clampWindow($('panel')); clampWindow($('preview-window'));
    const game = document.getElementById('MainCanvas'), chat = document.getElementById('TextAreaChatLog');
    const visible = window.CurrentScreen === 'ChatRoom' && chat && getComputedStyle(chat).visibility !== 'hidden' && !chat.closest('[hidden]');
    rectangle = visible ? bounds(game?.getBoundingClientRect(), chat.getBoundingClientRect(), settings.width, innerWidth, innerHeight) : null;
    headRectangle = visible ? bounds(game?.getBoundingClientRect(), chat.getBoundingClientRect(), 50, innerWidth, innerHeight) : null;
    canvas.hidden = !rectangle || !enabled || document.hidden;
    heads.hidden = !headRectangle || document.hidden;
    for (const [layer,r] of [[canvas,rectangle],[heads,headRectangle]]) {
      if (!r) continue;
      Object.assign(layer.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
      const ratio = Math.min(devicePixelRatio || 1,1.5), w = Math.round(r.width*ratio), h = Math.round(r.height*ratio);
      if (layer.width !== w || layer.height !== h) { layer.width = w; layer.height = h; }
    }
  }
  function wrapText(message, maxWidth, ctx) {
    const lines = []; let line = '';
    for (const char of message) {
      if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = char; } else line += char;
    }
    if (line) lines.push(line); return lines.slice(0, 12);
  }
  function drawText(frame, w, h, t = settings.text, context = ctx) {
    const ctx = context; if (!frame.message) return;
    ctx.save(); ctx.fillStyle = t.color; ctx.globalAlpha = t.opacity;
    const size = t.fontSize * Math.min(w, h) / 700;
    ctx.font = `600 ${Math.max(9, size)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000'; ctx.shadowBlur = 3;
    const message = t.mode === 'write' ? [...frame.message].slice(0, Math.ceil([...frame.message].length * frame.progress)).join('') : frame.message;
    if (t.mode === 'wall') {
      const stepY = Math.max(15, size * 1.6), text = message + '   ';
      const stepX = Math.max(20, ctx.measureText(text).width);
      for (let y = stepY / 2; y < h; y += stepY) for (let x = stepX / 2; x < w + stepX / 2; x += stepX) ctx.fillText(text, x, y);
    } else if (t.mode === 'lines') {
      for (let i = 0; i < t.lines; i++) ctx.fillText(message, w / 2, h * (i + 1) / (t.lines + 1), w * 0.94);
    } else if (t.mode === 'scatter' || t.mode === 'mixed') {
      const pos = textPosition(t.mode, frame.cycle), maxWidth = w * Math.min(0.8,2*Math.min(pos.x,1-pos.x)-0.04);
      const lines = wrapText(message, maxWidth, ctx), spacing = size * 1.3;
      const centerY = Math.max(lines.length*spacing/2,Math.min(h-lines.length*spacing/2,pos.y*h));
      lines.forEach((line,i) => ctx.fillText(line,pos.x*w,centerY+(i-(lines.length-1)/2)*spacing,maxWidth));
    } else {
      const lines = wrapText(message, w * 0.9, ctx), spacing = size * 1.3;
      lines.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * spacing));
    }
    ctx.restore();
  }
  function drawPulse(frame, w, h) {
    const p = settings.pulse; if (!p.enabled) return;
    const textTrigger = settings.text.enabled && frame.cycle !== lastTextCycle && frame.message;
    const due = p.mode === 'text' ? textTrigger : activeTime >= nextPulse;
    if (due && activeTime - lastPulse >= Math.max(2, p.duration)) {
      pulseStart = lastPulse = activeTime;
      nextPulse = activeTime + (p.mode === 'random' ? p.randomMin + Math.random() * (p.randomMax - p.randomMin) : p.interval);
    }
    const progress = (activeTime - pulseStart) / p.duration;
    if (progress >= 0 && progress <= 1) {
      ctx.save(); ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * (p.shape === 'soft' ? Math.sin(progress * Math.PI) ** 2 : (1 - progress) ** 2);
      ctx.fillRect(0, 0, w, h); ctx.restore();
    }
  }
  function ownHeadState() {
    return {head:settings.head,message:textFrame({...settings.text,enabled:true},activeTime).message};
  }
  function publishHead(force = false) {
    const active = enabled && (privacy.broadcast || remoteHeadSharing) && ['words','forehead','eyes','halo'].some(key => settings.head[key]);
    if (!active && !publicWasActive) return;
    if (!force && Date.now() - lastPublic < 950) return;
    const state = ownHeadState();
    if (send('head',active ? {active:true,head:state.head,message:state.head.words ? state.message : ''} : {active:false})) {
      lastPublic = Date.now(); publicWasActive = active;
    }
  }
  function characterPositions() {
    // Read the game's already-computed layout without advancing its animation.
    // Unsupported views are deliberately omitted rather than guessing positions.
    if (typeof window.ChatRoomCharacterViewIsActive === 'function' && !window.ChatRoomCharacterViewIsActive()) return [];
    const list = window.ChatRoomCharacterDrawlist;
    if (!Array.isArray(list)) return [];
    const count = window.ChatRoomCharacterViewCharacterCount || list.length;
    const space = count >= 2 ? 1000/Math.min(count,5) : 500;
    const zoom = num(window.ChatRoomCharacterViewZoom,1,0.1,2);
    const startX = count >= 3 ? (space-500*zoom)/2 : 0, startY = count <= 5 ? 1000*(1-zoom)/2 : 0;
    return list.flatMap((c,i) => {
      if (c.FixedImage || (count === 1 && (window.ChatRoomCharacterViewCharacterCountTotal || list.length) <= 10 && c.MemberNumber !== player()?.MemberNumber)) return [];
      if (c.MemberNumber !== player()?.MemberNumber && player()?.GetBlindLevel?.() >= 3) return [];
      const offset = player()?.GraphicsSettings?.CenterChatrooms ? (i >= 5 ? window.ChatRoomCharacterViewX_Lower : window.ChatRoomCharacterViewX_Upper) || 0 : 0;
      return [{c,x:offset+(count === 1 ? 0 : startX+(i%5)*space),y:count === 1 ? 0 : startY+Math.floor(i/5)*500,zoom}];
    });
  }
  function drawHeadGlyph(hx,state,time,cx,cy,unit) {
    const h=state.head;
        hx.save(); hx.translate(cx,cy); hx.scale(unit,unit); hx.strokeStyle = hx.fillStyle = h.color; hx.globalAlpha = h.opacity;
        hx.shadowColor = '#100920'; hx.shadowBlur = 2;
        const spiral = (sx,sy,r) => {
          hx.save(); hx.translate(sx,sy); hx.rotate(time*0.8); hx.lineWidth = Math.max(1.5,r/13); hx.beginPath();
          for (let i=0;i<=100;i++) { const a=i/100*Math.PI*6, d=r*i/100; const px=Math.cos(a)*d,py=Math.sin(a)*d; if(i)hx.lineTo(px,py);else hx.moveTo(px,py); }
          hx.stroke(); hx.restore();
        };
        if (h.forehead) spiral(0,-34,28*h.size);
        if (h.eyes) { spiral(-28,8,13*h.size); spiral(28,8,13*h.size); }
        if (h.halo) { hx.save(); hx.translate(0,-94); hx.scale(1,0.35); spiral(0,0,85*h.size); hx.restore(); }
        if (h.words && state.message) {
          hx.font = '600 '+h.wordSize+'px system-ui,sans-serif'; hx.textAlign = 'center'; hx.textBaseline = 'middle';
          for (let i=0;i<3;i++) {
            const phase = h.wordMode === 'orbit' ? time*0.35+i*Math.PI*2/3 : random01(Math.floor(time/2)*7+i)*Math.PI*2;
            const alpha = h.wordMode === 'sparkle' ? 0.35+0.65*Math.sin(time*Math.PI/2)**2 : 1;
            hx.globalAlpha = h.opacity*alpha; hx.fillText(state.message,Math.cos(phase)*105,Math.sin(phase)*85,135);
          }
        }
        hx.restore();
  }
  function drawHeads(time) {
    if (heads.hidden || !hx || !headRectangle) return;
    hx.clearRect(0,0,heads.width,heads.height);
    const game = document.getElementById('MainCanvas')?.getBoundingClientRect(); if (!game) return;
    const scale = game.width/2000 * heads.width/headRectangle.width;
    hx.save(); hx.scale(scale,scale);
    try {
      for (const {c,x,y,zoom} of characterPositions()) {
        const self = c.MemberNumber === player()?.MemberNumber;
        // Head cosmetics are for other viewers; the wearer already has the full overlay.
        if (self) continue;
        const state = privacy.showOthers && !hideSharedUntilEnabled ? publicHeads.get(c.MemberNumber) : null;
        if (!state || (!self && Date.now()-state.seen > 5000)) continue;
        const h = state.head, ratio = num(c.HeightRatio,1,0.1,3);
        let box = [x+180*zoom,y+20*zoom,140*zoom,160*zoom];
        if (typeof window.DialogGetCharacterZone === 'function') box = window.DialogGetCharacterZone(c,[180,20,140,160],x,y,zoom,ratio);
        if (!box?.every(Number.isFinite)) continue;
        const unit = zoom*ratio, cx = box[0]+box[2]/2+h.offsetX*unit, cy = box[1]+box[3]/2+h.offsetY*unit;
        drawHeadGlyph(hx,state,time,cx,cy,unit);
      }
    } finally { hx.restore(); }
  }
  const previewCanvas=$('preview-canvas'), previewContext=previewCanvas.getContext('2d');
  const previewTextures=[document.createElement('canvas'),document.createElement('canvas')],previewKeys=['',''];
  let previewTime=0,previewConfig='',previewPulse=-Infinity,previewNext=0,previewLast=-Infinity,previewCycle=-1;
  function renderPreview(dt) {
    if($('preview-window').hidden || document.hidden || !previewContext)return;
    if(selected !== 'self' && !receivedGrants.has(Number(selected))){showPreview(false);return;}
    const config=editState(),key=selected+JSON.stringify(config);
    if(key!==previewConfig){previewConfig=key;previewTime=0;previewPulse=previewLast=-Infinity;previewNext=0;previewCycle=-1;}
    previewTime+=dt;
    $('preview-label').textContent=(selected==='self'?'My overlay':label(Number(selected)))+' · unsent appearance preview';
    const c=previewContext,w=500,h=500;c.clearRect(0,0,w,h);c.fillStyle='#282331';c.fillRect(0,0,w,h);
    c.fillStyle='#71687f';c.beginPath();c.ellipse(250,195,38,48,0,0,Math.PI*2);c.fill();c.fillRect(210,245,80,230);
    config.spirals.forEach((s,i)=>{
      if(!s.enabled)return;makeTexture(i,s,previewTextures,previewKeys);
      c.save();c.globalAlpha=s.backgroundOpacity;c.fillStyle=s.background;c.fillRect(0,0,w,h);
      c.globalAlpha=s.opacity;c.translate(w/2,h/2);c.rotate(previewTime*s.spin*(s.reverse?-1:1));c.filter=s.blur?'blur('+s.blur*w/700+'px)':'none';
      const side=Math.hypot(w,h)*s.zoom*(1+Math.sin(previewTime*s.throbSpeed*Math.PI*2)*s.throbStrength),count=Math.ceil(Math.hypot(w,h)/side/2);
      for(let x=-count;x<=count;x++)for(let y=-count;y<=count;y++)c.drawImage(previewTextures[i],(x-.5)*side,(y-.5)*side,side,side);c.restore();
    });
    const frame=textFrame(config.text,previewTime),pulse=config.pulse;
    if(pulse.enabled){
      const due=pulse.mode==='text'?config.text.enabled&&frame.cycle!==previewCycle&&frame.message:previewTime>=previewNext;
      if(due&&previewTime-previewLast>=Math.max(2,pulse.duration)){previewPulse=previewLast=previewTime;previewNext=previewTime+(pulse.mode==='random'?pulse.randomMin+random01(Math.floor(previewTime*100)+1)*(pulse.randomMax-pulse.randomMin):pulse.interval);}
      const progress=(previewTime-previewPulse)/pulse.duration;
      if(progress>=0&&progress<=1){c.save();c.fillStyle=pulse.color;c.globalAlpha=pulse.opacity*(pulse.shape==='soft'?Math.sin(progress*Math.PI)**2:(1-progress)**2);c.fillRect(0,0,w,h);c.restore();}
    }
    drawText(frame,w,h,config.text,c);previewCycle=frame.cycle;
    drawHeadGlyph(c,{head:config.head,message:textFrame({...config.text,enabled:true},previewTime).message},previewTime,250+config.head.offsetX*.5,195+config.head.offsetY*.5,.5);
  }
  function render(time) {
    if (destroyed) return;
    const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 0.1) : 0; lastFrame = time;
    if (!canvas.hidden && ctx) {
      activeTime += dt;
      const w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h);
      settings.spirals.forEach((s, i) => {
        if (!s.enabled) return;
        makeTexture(i, s); phases[i] = (phases[i] + dt * s.spin * (s.reverse ? -1 : 1)) % (Math.PI * 2);
        ctx.save(); ctx.globalAlpha = s.backgroundOpacity; ctx.fillStyle = s.background; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = s.opacity; ctx.translate(w / 2, h / 2); ctx.rotate(phases[i]);
        ctx.filter = s.blur ? `blur(${s.blur * w / rectangle.width}px)` : 'none';
        const throb = 1 + Math.sin(activeTime * s.throbSpeed * Math.PI * 2) * s.throbStrength;
        // Tiling preserves coverage when zoomed out, while the canvas clips at the player boundary.
        const side = Math.hypot(w, h) * s.zoom * throb, count = Math.ceil(Math.hypot(w, h) / side / 2);
        for (let x = -count; x <= count; x++) for (let y = -count; y <= count; y++) ctx.drawImage(effectTextures[i], (x - 0.5) * side, (y - 0.5) * side, side, side);
        ctx.restore();
      });
      const text = textFrame(settings.text, activeTime);
      drawPulse(text, w, h); drawText(text, w, h); lastTextCycle = text.cycle;
    }
    drawHeads(time / 1000); renderPreview(dt);
    frameId = requestAnimationFrame(render);
  }
  const layoutTimer = setInterval(layout, 200), networkTimer = setInterval(networkTick, 1000);
  addEventListener('resize', layout); addEventListener('scroll', layout, true); document.addEventListener('visibilitychange', layout);
  window.HypnoReverie = { version: VERSION, open, stop,
    destroy() {
      stop(); destroyed = true; cancelAnimationFrame(frameId); clearInterval(layoutTimer); clearInterval(networkTimer);
      windowObserver.disconnect(); attachSocket(null); document.removeEventListener('keydown', keydown, true);
      removeEventListener('resize', layout); removeEventListener('scroll', layout, true); document.removeEventListener('visibilitychange', layout);
      profileButton?.remove(); host.remove(); delete window.HypnoReverie;
    } };
  refreshFields(); layout(); networkTick(); frameId = requestAnimationFrame(render);
})();
