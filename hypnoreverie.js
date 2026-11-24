// Hypno Reverie 0.2.0 — Jaxx-01-ai
// Original canvas renderer and opt-in, room-scoped control protocol.
(() => {
  'use strict';
  const VERSION = '0.2.0', KEY = 'hypnoreverie-v2', CHANNEL = 'HypnoReverie';
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
      interval: 5, randomMin: 4, randomMax: 10, shape: 'soft' } };
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const spirals = [0, 1].map(i => {
      const d = defaults.spirals[i], s = raw.spirals?.[i] || {};
      return { enabled: bool(s.enabled, d.enabled), color: color(s.color, d.color),
        background: color(s.background, d.background), backgroundOpacity: num(s.backgroundOpacity, d.backgroundOpacity, 0, 0.9),
        opacity: num(s.opacity, d.opacity, 0, 0.9), arms: Math.round(num(s.arms, d.arms, 1, 16)),
        spin: num(s.spin, d.spin, 0, 4), reverse: bool(s.reverse, d.reverse),
        throbSpeed: num(s.throbSpeed, d.throbSpeed, 0, 2), throbStrength: num(s.throbStrength, d.throbStrength, 0, 0.35),
        zoom: num(s.zoom, d.zoom, 0.3, 3), thickness: num(s.thickness, d.thickness, 0.05, 0.95),
        blur: num(s.blur, d.blur, 0, 20), curve: num(s.curve, d.curve, 0, 6) };
    });
    const t = raw.text || {}, p = raw.pulse || {}, td = defaults.text, pd = defaults.pulse;
    const messages = Array.isArray(t.messages) ? t.messages.filter(x => typeof x === 'string')
      .slice(0, 40).map(x => x.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 160).trim()).filter(Boolean) : [];
    const min = num(p.randomMin, pd.randomMin, 2, 120);
    return { width: num(raw.width, 50, 10, 50), spirals,
      text: { enabled: bool(t.enabled, false), color: color(t.color, td.color), opacity: num(t.opacity, td.opacity, 0, 1),
        duration: num(t.duration, td.duration, 0.08, 30), gap: num(t.gap, td.gap, 0, 30),
        fontSize: num(t.fontSize, td.fontSize, 12, 180), mode: choice(t.mode, ['center', 'wall', 'lines', 'write'], 'center'),
        lines: Math.round(num(t.lines, td.lines, 1, 12)), random: bool(t.random, false), messages },
      pulse: { enabled: bool(p.enabled, false), mode: choice(p.mode, ['interval', 'random', 'text'], 'interval'),
        color: color(p.color, pd.color), opacity: num(p.opacity, pd.opacity, 0, 0.45),
        duration: num(p.duration, pd.duration, 0.3, 3), interval: num(p.interval, pd.interval, 2, 120),
        randomMin: min, randomMax: Math.max(min, num(p.randomMax, pd.randomMax, 2, 120)),
        shape: choice(p.shape, ['soft', 'flash'], 'soft') } };
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
      this.grant = { sender, level, token, expires: now + num(minutes, 15, 1, 30) * 60000, allowPulse: !!allowPulse };
      this.lastSequence = 0; this.lastCommand = -Infinity;
      return clone(this.grant);
    }
    revoke() { this.grant = null; this.lastSequence = 0; }
    apply(sender, packet, current, now, present) {
      const g = this.grant;
      if (!g || now >= g.expires || !present || sender !== g.sender || packet.token !== g.token ||
        !Number.isSafeInteger(packet.seq) || packet.seq <= this.lastSequence || now - this.lastCommand < 200) return null;
      if (!packet.settings || typeof packet.settings !== 'object') return null;
      const incoming = normalize(packet.settings), next = clone(current);
      next.spirals = incoming.spirals;
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
  const core = { normalize, defaults, bounds, ControlGate, textFrame };
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
  let enabled = false, locked = false, destroyed = false, socket = null, selected = 'self';
  let activeTime = 0, lastFrame = 0, frameId = 0, rectangle = null, networkRoom = null, networkMember = null;
  let dominant = false, pulseAllowed = false, status = 'Ready. Effects start off.', lastHello = 0;
  const gate = new ControlGate(), peers = new Map(), receivedGrants = new Map();
  const phases = [0, 0], textures = [document.createElement('canvas'), document.createElement('canvas')], textureKeys = ['', ''];
  const host = document.createElement('div'); host.id = 'hypnoreverie-addon';
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10000';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{color-scheme:dark;font:13px system-ui,sans-serif;color:#eee8ff}*{box-sizing:border-box}
    [hidden]{display:none!important}#effect{position:fixed;pointer-events:none}#ui{position:fixed;pointer-events:none}
    button,select,input,textarea{font:inherit;color:inherit}button,select{background:#2c203c;border:1px solid #73598a;border-radius:7px;padding:7px;cursor:pointer}
    button{pointer-events:auto}button:hover{background:#47305e}button:disabled{opacity:.45;cursor:default}
    #stop{background:#692f4a;border-color:#d383a4}#panel{pointer-events:auto;width:340px;max-width:100%;margin-top:7px;padding:14px;border:1px solid #73598a;border-radius:13px;background:#17111ff5;box-shadow:0 8px 32px #0008;overflow:auto;max-height:78vh}
    #toolbar{display:flex;gap:6px;flex-wrap:wrap}h2{font-size:17px;margin:0}h3{font-size:14px;margin:8px 0}p{font-size:12px;color:#c2b0d3;line-height:1.5}
    .tabs{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0}.tabs button[aria-selected=true]{background:#6a438d}
    label{display:block;margin:10px 0}input[type=range]{display:block;width:100%;accent-color:#bd8cff}input[type=checkbox]{accent-color:#bd8cff}
    input[type=color]{height:28px;width:52px;vertical-align:middle;border:0;padding:0;background:none}
    input[type=number]{width:75px;background:#281d36;border:1px solid #73598a;border-radius:5px;padding:4px}
    output{float:right;color:#d4b6f2}textarea{width:100%;min-height:140px;resize:vertical;background:#24182f;border:1px solid #73598a;border-radius:7px;padding:8px}
    select{max-width:100%}fieldset{border:0;padding:0;margin:0;min-width:0}fieldset:disabled{opacity:.55}
    .row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.notice{padding:9px;background:#38233d;border-radius:7px}
    #status{margin-bottom:0}#grant-info{overflow-wrap:anywhere}.help{font-size:11px;color:#bba9c9}
  </style>
  <canvas id="effect" aria-hidden="true" hidden></canvas>
  <div id="ui" hidden><div id="toolbar"><button id="open" aria-expanded="false">Hypno Reverie</button><button id="stop">Stop / revoke</button></div>
    <section id="panel" aria-label="Hypno Reverie settings" hidden>
      <h2>Hypno Reverie <small>0.2</small></h2>
      <label>Edit overlay <select id="target"><option value="self">My overlay</option></select></label>
      <div id="remote-note" class="notice" hidden>Editing a remote draft. Click Send changes to apply it.</div>
      <div class="row"><label><input id="enabled" type="checkbox"> Effects on</label><label id="lock-row" hidden><input id="lock" type="checkbox"> Lock normal controls</label></div>
      <div class="tabs" role="tablist" aria-label="Settings categories">
        <button data-tab="primary" role="tab" aria-selected="true">Primary</button><button data-tab="secondary" role="tab" aria-selected="false">Secondary</button>
        <button data-tab="text" role="tab" aria-selected="false">Text</button><button data-tab="pulse" role="tab" aria-selected="false">Pulse</button><button data-tab="sharing" role="tab" aria-selected="false">Sharing</button>
      </div>
      <div id="primary" role="tabpanel"><fieldset id="primary-fields"></fieldset></div>
      <div id="secondary" role="tabpanel" hidden><fieldset id="secondary-fields"></fieldset></div>
      <div id="text" role="tabpanel" hidden><fieldset id="text-fields"></fieldset></div>
      <div id="pulse" role="tabpanel" hidden><p>Pulse/flash effects can cause discomfort. Start low; Escape stops everything. Flash rate is limited to one every two seconds.</p><fieldset id="pulse-fields"></fieldset></div>
      <div id="sharing" role="tabpanel" hidden>
        <p>Share with one trusted player in this room. Both players need version 0.2. Availability as a dominant is self-declared; choose by name and member number.</p>
        <label><input id="dominant" type="checkbox"> Available as a dominant/controller</label>
        <button id="discover">Find players with the mod</button>
        <label>Give keys to <select id="peer"><option value="">No controllers discovered</option></select></label>
        <label>Permission <select id="level"><option value="visuals">Visuals only</option><option value="text">Visuals + text</option><option value="session">Full session + control lock</option></select></label>
        <label><input id="allow-pulse" type="checkbox"> Also allow pulse/flash changes</label>
        <label>Grant duration (minutes) <input id="minutes" type="number" min="1" max="30" value="15"></label>
        <p class="help">Granting shares your current effect settings and message list with that player. Full session permits on/off and locking ordinary settings. Escape and Stop / revoke always work. Grants are not saved and end on room changes or disconnects.</p>
        <div class="row"><button id="grant">Give keys</button><button id="revoke">Revoke keys</button></div>
        <p id="grant-info"></p>
      </div>
      <div id="remote-actions" hidden><button id="apply">Send changes</button><button id="release">Return keys</button></div>
      <p id="status" role="status"></p><p class="help">Escape: stop and revoke · Alt+Shift+S: toggle your overlay</p>
    </section>
  </div>`;
  const $ = id => root.getElementById(id), canvas = $('effect'), ctx = canvas.getContext('2d');
  const fields = [];
  function getPath(object, path) { return path.reduce((value, key) => value[key], object); }
  function setPath(object, path, value) { path.slice(0, -1).reduce((v, k) => v[k], object)[path.at(-1)] = value; }
  function editState() { return selected === 'self' ? settings : receivedGrants.get(Number(selected))?.draft || settings; }
  function field(parent, path, title, type, min, max, step, options) {
    const label = document.createElement('label'), input = document.createElement(type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input');
    const id = 'setting-' + path.join('-'); input.id = id; label.htmlFor = id;
    if (!['select', 'textarea'].includes(type)) input.type = type;
    label.append(document.createTextNode(title + ' '));
    if (type === 'range' || type === 'number') { input.min = min; input.max = max; input.step = step; }
    if (options) for (const [value, text] of options) { const option = document.createElement('option'); option.value = value; option.textContent = text; input.append(option); }
    const output = type === 'range' ? document.createElement('output') : null;
    if (output) label.append(output);
    label.append(input); $(parent).append(label);
    const record = { input, path, type, output }; fields.push(record);
    input.addEventListener(type === 'textarea' ? 'change' : 'input', () => {
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
    slider(parent, path('opacity'), 'Spiral opacity', 0, 0.9);
    slider(parent, path('backgroundOpacity'), 'Background opacity', 0, 0.9);
    slider(parent, path('arms'), 'Arms', 1, 16, 1);
    slider(parent, path('spin'), 'Spin speed (radians/s)', 0, 4, 0.05);
    field(parent, path('reverse'), 'Reverse spin', 'checkbox');
    slider(parent, path('throbSpeed'), 'Throb speed (cycles/s)', 0, 2, 0.05);
    slider(parent, path('throbStrength'), 'Throb strength', 0, 0.35);
    slider(parent, path('zoom'), 'Zoom', 0.3, 3, 0.05);
    slider(parent, path('thickness'), 'Thickness', 0.05, 0.95);
    slider(parent, path('blur'), 'Blur factor (px)', 0, 20, 0.5);
    slider(parent, path('curve'), 'Spiral curve', 0, 6, 0.1);
  }
  slider('primary-fields', ['width'], 'Player area width (%)', 10, 50, 1);
  field('text-fields', ['text', 'enabled'], 'Enable subliminal / cycling text', 'checkbox');
  field('text-fields', ['text', 'messages'], 'Edit messages — one word or sentence per line (40 max, 160 characters each)', 'textarea');
  field('text-fields', ['text', 'mode'], 'Layout', 'select', null, null, null,
    [['center', 'Centered message'], ['wall', 'Wall of text'], ['lines', 'Lines'], ['write', 'Write / typewriter']]);
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
    const localLocked = selected === 'self' && locked;
    $('primary-fields').disabled = $('secondary-fields').disabled = localLocked;
    $('text-fields').disabled = localLocked || (selected !== 'self' && remote?.level === 'visuals');
    $('pulse-fields').disabled = localLocked || (selected !== 'self' && !remote?.allowPulse);
    $('enabled').checked = selected === 'self' ? enabled : !!remote?.enabled;
    $('enabled').disabled = localLocked || (selected !== 'self' && remote?.level !== 'session');
    $('lock-row').hidden = selected === 'self' || remote?.level !== 'session';
    $('lock').checked = !!remote?.locked;
    $('remote-actions').hidden = $('remote-note').hidden = selected === 'self';
    $('status').textContent = status;
  }
  for (const button of root.querySelectorAll('[data-tab]')) button.onclick = () => {
    for (const tab of root.querySelectorAll('[data-tab]')) {
      const active = tab === button; tab.setAttribute('aria-selected', String(active)); $(tab.dataset.tab).hidden = !active;
    }
  };
  function open() { $('panel').hidden = false; $('open').setAttribute('aria-expanded', 'true'); }
  $('open').onclick = () => { const next = !$('panel').hidden; $('panel').hidden = next; $('open').setAttribute('aria-expanded', String(!next)); };
  $('enabled').onchange = () => {
    if (selected === 'self') { if (!locked) { enabled = $('enabled').checked; resetEffectClock(); layout(); } }
    else { const grant = receivedGrants.get(Number(selected)); if (grant?.level === 'session') grant.enabled = $('enabled').checked; }
    refreshFields();
  };
  $('lock').onchange = () => { const grant = receivedGrants.get(Number(selected)); if (grant?.level === 'session') grant.locked = $('lock').checked; };
  $('target').onchange = () => { selected = $('target').value; refreshFields(); };
  function player() { return window.Player; }
  function characters() { return Array.isArray(window.ChatRoomCharacter) ? window.ChatRoomCharacter : []; }
  function present(member) { return characters().some(c => c.MemberNumber === member); }
  function label(member) { const c = characters().find(c => c.MemberNumber === member); return `${c?.Nickname || c?.Name || 'Player'} (#${member})`; }
  function roomKey() {
    if (!window.ChatRoomData || !player()?.MemberNumber || window.CurrentScreen !== 'ChatRoom') return null;
    return JSON.stringify([window.ChatRoomData.Name, window.ChatRoomData.Space, window.ChatRoomData.Language]);
  }
  function send(kind, payload = {}, target = null) {
    if (!roomKey() || !socket?.connected || typeof window.ServerSend !== 'function') return false;
    const message = { v: 1, kind, ...payload, to: target };
    if (JSON.stringify(message).length > 16000) return false;
    try { window.ServerSend('ChatRoomChat', { Content: CHANNEL, Type: 'Hidden', Target: target, Dictionary: message }); return true; }
    catch { return false; }
  }
  function revoke(reason, notify = true) {
    const old = gate.grant;
    if (old && notify) send('revoke', { token: old.token }, old.sender);
    gate.revoke(); locked = false;
    if (old) enabled = false;
    say(reason); refreshFields(); updatePeople(); layout();
  }
  function stop() {
    enabled = false; revoke('Stopped. Remote keys revoked.');
    resetEffectClock(); canvas.hidden = true;
  }
  $('stop').onclick = stop; $('revoke').onclick = () => revoke('Keys revoked; overlay stopped.');
  function keydown(event) {
    if (event.key === 'Escape') stop();
    else if (event.altKey && event.shiftKey && event.code === 'KeyS' && !event.repeat && !locked) {
      event.preventDefault(); enabled = !enabled; resetEffectClock(); refreshFields(); layout();
    }
  }
  document.addEventListener('keydown', keydown, true);
  $('dominant').onchange = () => { dominant = $('dominant').checked; send('hello', { dominant }); };
  $('discover').onclick = () => { if (Date.now() - lastHello < 3000) return; lastHello = Date.now(); send('hello', { dominant }); say('Looking for players with Hypno Reverie…'); };
  $('grant').onclick = () => {
    const member = Number($('peer').value), peer = peers.get(member);
    if (!peer?.dominant || !present(member) || Date.now() - peer.seen > 45000) { say('Choose an available controller in this room.'); return; }
    if (gate.grant) revoke('Replacing previous keys.');
    pulseAllowed = $('allow-pulse').checked;
    const grant = gate.issue(member, $('level').value, crypto.randomUUID(), Date.now(), Number($('minutes').value), pulseAllowed);
    if (!send('grant', { token: grant.token, level: grant.level, expires: grant.expires, allowPulse: grant.allowPulse, settings, enabled, locked: false }, member)) {
      gate.revoke(); say('Could not send keys.'); return;
    }
    say(`Keys given to ${label(member)}. Escape revokes them.`); updatePeople();
  };
  $('apply').onclick = () => {
    // Commit the message editor if the user clicks Send before its blur handler runs.
    root.activeElement?.blur();
    const member = Number(selected), grant = receivedGrants.get(member);
    if (!grant || !present(member) || grant.expires <= Date.now()) { say('These keys are no longer valid.'); return; }
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
    populate($('target'), [['self', 'My overlay'], ...[...receivedGrants].map(([id]) => [String(id), label(id)])]);
    if (targetValue === 'self' || receivedGrants.has(Number(targetValue))) $('target').value = targetValue;
    else { selected = 'self'; $('target').value = 'self'; refreshFields(); }
    const g = gate.grant;
    $('grant-info').textContent = g ? `Keys: ${label(g.sender)} · ${g.level} · ${Math.max(0, Math.ceil((g.expires - Date.now()) / 60000))} min remaining${locked ? ' · normal controls locked' : ''}` : 'No one has keys to your overlay.';
  }
  const inboundTimes = new Map();
  function onMessage(data) {
    if (!data || data.Type !== 'Hidden' || data.Content !== CHANNEL || !Number.isSafeInteger(data.Sender) || !roomKey()) return;
    if (roomKey() !== networkRoom || player()?.MemberNumber !== networkMember) {
      clearSession('Room changed. Remote keys cleared.'); return;
    }
    const sender = data.Sender, packet = data.Dictionary;
    if (sender === player()?.MemberNumber || !present(sender) || !packet || typeof packet !== 'object' || packet.v !== 1 ||
      (packet.to !== null && packet.to !== player()?.MemberNumber)) return;
    if (!['hello', 'helloAck', 'grant', 'ackGrant', 'set', 'applied', 'release', 'revoke'].includes(packet.kind)) return;
    // Only hello is broadcast; commands/grants must explicitly target this player.
    if (packet.kind !== 'hello' && packet.to !== player()?.MemberNumber) return;
    try { if (JSON.stringify(packet).length > 16000) return; } catch { return; }
    const now = Date.now(), rateKey = `${sender}:${packet.kind}`;
    if (now - (inboundTimes.get(rateKey) || 0) < 150) return;
    inboundTimes.set(rateKey, now);
    if (packet.kind === 'hello' || packet.kind === 'helloAck') {
      peers.set(sender, { dominant: packet.dominant === true, seen: now });
      if (packet.kind === 'hello') send('helloAck', { dominant }, sender);
      updatePeople(); return;
    }
    if (packet.kind === 'grant') {
      if (!dominant || !['visuals', 'text', 'session'].includes(packet.level) || typeof packet.token !== 'string' ||
        packet.token.length < 16 || packet.token.length > 100 || typeof packet.expires !== 'number' ||
        !Number.isFinite(packet.expires) || packet.expires <= now || packet.expires > now + 31 * 60000) return;
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
      if (result.enabled !== undefined) enabled = result.enabled;
      if (result.locked !== undefined) locked = result.locked;
      save(); resetEffectClock(); refreshFields(); updatePeople(); layout();
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
    revoke(reason, false); receivedGrants.clear(); peers.clear(); inboundTimes.clear(); selected = 'self';
    updatePeople(); refreshFields();
  }
  function disconnected() { clearSession('Connection lost. All remote keys cleared.'); }
  function memberLeft(data) {
    const member = data?.SourceMemberNumber ?? data?.MemberNumber;
    if (gate.grant?.sender === member) revoke('Controller left the room. Keys revoked.', false);
    receivedGrants.delete(member); peers.delete(member); updatePeople();
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
    if (room !== networkRoom || member !== networkMember) {
      clearSession('Room changed. Remote keys cleared.'); networkRoom = room; networkMember = member; lastHello = 0;
    }
    if (!room || !socket?.connected) { if (gate.grant || receivedGrants.size) clearSession('Not connected to a room. Keys cleared.'); return; }
    const now = Date.now();
    if (now - lastHello > 15000) { send('hello', { dominant }); lastHello = now; }
    if (gate.grant && (now >= gate.grant.expires || !present(gate.grant.sender) || now - (peers.get(gate.grant.sender)?.seen || 0) > 45000)) revoke('Remote session ended. Keys revoked.');
    for (const [id, grant] of receivedGrants) if (now >= grant.expires || !present(id) || now - (peers.get(id)?.seen || grant.seen) > 45000) receivedGrants.delete(id);
    for (const [id, peer] of peers) if (!present(id) || now - peer.seen > 45000) peers.delete(id);
    updatePeople();
  }
  let pulseStart = -Infinity, nextPulse = 0, lastPulse = -Infinity, lastTextCycle = -1;
  function resetEffectClock() { activeTime = 0; lastFrame = 0; pulseStart = -Infinity; nextPulse = 0; lastPulse = -Infinity; lastTextCycle = -1; }
  function makeTexture(i, s) {
    const key = JSON.stringify([s.color, s.arms, s.curve, s.thickness]);
    if (key === textureKeys[i]) return;
    const texture = textures[i]; texture.width = texture.height = 1024;
    const tx = texture.getContext('2d'), size = 1024, center = size / 2, radius = size * 0.72;
    tx.clearRect(0, 0, size, size); tx.fillStyle = s.color;
    const sector = Math.PI * 2 / s.arms;
    for (let arm = 0; arm < s.arms; arm++) {
      tx.beginPath();
      for (let edge = 0; edge < 2; edge++) for (let step = 0; step <= 300; step++) {
        const r = radius * (edge ? 300 - step : step) / 300;
        const angle = arm * sector + edge * sector * s.thickness + r / radius * s.curve * Math.PI * 2;
        const x = center + r * Math.cos(angle), y = center + r * Math.sin(angle);
        if (!edge && !step) tx.moveTo(x, y); else tx.lineTo(x, y);
      }
      tx.closePath(); tx.fill();
    }
    textureKeys[i] = key;
  }
  function layout() {
    const game = document.getElementById('MainCanvas'), chat = document.getElementById('TextAreaChatLog');
    const chatVisible = chat && getComputedStyle(chat).visibility !== 'hidden' && !chat.closest('[hidden]');
    rectangle = chatVisible ? bounds(game?.getBoundingClientRect(), chat.getBoundingClientRect(), settings.width, innerWidth, innerHeight) : null;
    $('ui').hidden = !rectangle; canvas.hidden = !rectangle || !enabled || document.hidden;
    if (!rectangle) return;
    const r = rectangle;
    Object.assign(canvas.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    Object.assign($('ui').style, { left: r.left + 8 + 'px', top: r.top + 8 + 'px', width: Math.max(0, Math.min(340, r.width - 16)) + 'px' });
    $('panel').style.maxHeight = Math.max(80, r.height - 60) + 'px';
    const ratio = Math.min(devicePixelRatio || 1, 1.5), w = Math.round(r.width * ratio), h = Math.round(r.height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function wrapText(message, maxWidth) {
    const lines = []; let line = '';
    for (const char of message) {
      if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = char; } else line += char;
    }
    if (line) lines.push(line); return lines.slice(0, 12);
  }
  function drawText(frame, w, h) {
    const t = settings.text; if (!frame.message) return;
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
    } else {
      const lines = wrapText(message, w * 0.9), spacing = size * 1.3;
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
        for (let x = -count; x <= count; x++) for (let y = -count; y <= count; y++) ctx.drawImage(textures[i], (x - 0.5) * side, (y - 0.5) * side, side, side);
        ctx.restore();
      });
      const text = textFrame(settings.text, activeTime);
      drawPulse(text, w, h); drawText(text, w, h); lastTextCycle = text.cycle;
    }
    frameId = requestAnimationFrame(render);
  }
  const layoutTimer = setInterval(layout, 200), networkTimer = setInterval(networkTick, 1000);
  addEventListener('resize', layout); addEventListener('scroll', layout, true); document.addEventListener('visibilitychange', layout);
  window.HypnoReverie = { version: VERSION, open, stop,
    destroy() {
      stop(); destroyed = true; cancelAnimationFrame(frameId); clearInterval(layoutTimer); clearInterval(networkTimer);
      attachSocket(null); document.removeEventListener('keydown', keydown, true);
      removeEventListener('resize', layout); removeEventListener('scroll', layout, true); document.removeEventListener('visibilitychange', layout);
      host.remove(); delete window.HypnoReverie;
    } };
  refreshFields(); layout(); networkTick(); frameId = requestAnimationFrame(render);
})();
