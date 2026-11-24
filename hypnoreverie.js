// Hypno Reverie 0.6.0 — Jaxx-01-ai
// Original canvas renderer and opt-in, room-scoped control protocol.
(() => {
  'use strict';
  const BOOT = typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Math.random());
  const VERSION = '0.6.0', KEY = 'hypnoreverie-v2', CHANNEL = 'HypnoReverie';
  const PRESET_KEY = 'hypnoreverie-presets-v1', PRIVACY_KEY = 'hypnoreverie-head-sharing-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const num = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  const color = (v, fallback) => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v) ? v : fallback;
  const bool = (v, fallback) => typeof v === 'boolean' ? v : fallback;
  const choice = (v, values, fallback) => values.includes(v) ? v : fallback;
  const spiralDefault = { enabled: true, color: '#b47bff', background: '#171024', backgroundOpacity: 0.2,
    opacity: 0.4, arms: 4, spin: 0.7, reverse: false, throbSpeed: 0.4, throbStrength: 0,
    zoom: 1, thickness: 0.5, blur: 0, curve: 2.5, taper: 0, style: 'spiral' };
  const defaults = { width: 50, spirals: [spiralDefault, { ...spiralDefault, enabled: false, color: '#69e0e8',
    opacity: 0.22, arms: 3, reverse: true, backgroundOpacity: 0, spin: 0.45 }],
    text: { enabled: false, color: '#ffffff', opacity: 0.8, duration: 2, gap: 0.5, fontSize: 54,
      mode: 'center', lines: 5, random: false, messages: [] },
    pulse: { enabled: false, mode: 'interval', color: '#c3a2ff', opacity: 0.15, duration: 0.8,
      interval: 5, randomMin: 4, randomMax: 10, startDelay: 0, textDelay: 0, every: 1, shape: 'soft' },
    audio: {enabled:false,master:0.2,binaural:false,leftHz:180,rightHz:184,toneLevel:0.18,iso:false,isoHz:180,isoRate:4,isoDuty:0.5,isoLevel:0.15,music:'none',musicLevel:0.2,heartbeat:false,bpm:60,heartLevel:0.2,breathing:false,inhale:4,exhale:6,pause:1,breathLevel:0.15},
    focus: {enabled:false,opening:0.3,darkness:0.8,blur:8,tighten:false,endOpening:0.15,tightenSeconds:60,fixation:'none',size:0.1,glow:16,color:'#d4a6ff',colorPulse:false,colorA:'#40105f',colorB:'#f3a2d5',colorOpacity:0.15,beatSource:'heartbeat',beats:8},
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
        blur: num(s.blur, d.blur, 0, 50), curve: num(s.curve, d.curve, 0, 12), taper:num(s.taper,0,0,0.95), style:choice(s.style,['spiral','rings','hearts','petals','polygon','star'], 'spiral') };
    });
    const a=raw.audio||{}, f=raw.focus||{};
    const t = raw.text || {}, p = raw.pulse || {}, h = raw.head || {}, td = defaults.text, pd = defaults.pulse;
    const messages = Array.isArray(t.messages) ? t.messages.filter(x => typeof x === 'string')
      .slice(0, 40).map(x => x.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 160).trim()).filter(Boolean) : [];
    const min = num(p.randomMin, pd.randomMin, 2, 300);
    return { width: num(raw.width, 50, 10, 50), spirals,
      text: { enabled: bool(t.enabled, false), color: color(t.color, td.color), opacity: num(t.opacity, td.opacity, 0, 1),
        duration: num(t.duration, td.duration, 0.001, 30), gap: num(t.gap, td.gap, 0, 30),
        fontSize: num(t.fontSize, td.fontSize, 12, 180), mode: choice(t.mode, ['center', 'wall', 'lines', 'write', 'scatter', 'mixed'], 'center'),
        lines: Math.round(num(t.lines, td.lines, 1, 12)), random: bool(t.random, false), messages },
      pulse: { enabled: bool(p.enabled, false), mode: choice(p.mode, ['interval', 'random', 'text'], 'interval'),
        color: color(p.color, pd.color), opacity: num(p.opacity, pd.opacity, 0, 0.45),
        duration: num(p.duration, pd.duration, 0.05, 10), interval: num(p.interval, pd.interval, 2, 300),
        randomMin: min, randomMax: Math.max(min, num(p.randomMax, pd.randomMax, 2, 300)),
        startDelay: num(p.startDelay, 0, 0, 60), textDelay: num(p.textDelay, 0, 0, 5), every: Math.round(num(p.every, 1, 1, 20)),
        shape: choice(p.shape, ['soft', 'flash'], 'soft') },
      audio: {enabled:bool(a.enabled,false),master:num(a.master,0.2,0,0.6),binaural:bool(a.binaural,false),leftHz:num(a.leftHz,180,40,1000),rightHz:num(a.rightHz,184,40,1000),toneLevel:num(a.toneLevel,0.18,0,0.5),iso:bool(a.iso,false),isoHz:num(a.isoHz,180,40,1000),isoRate:num(a.isoRate,4,0.1,30),isoDuty:num(a.isoDuty,0.5,0.1,0.9),isoLevel:num(a.isoLevel,0.15,0,0.5),music:choice(a.music,['none','velvet','drift','rain'], 'none'),musicLevel:num(a.musicLevel,0.2,0,0.5),heartbeat:bool(a.heartbeat,false),bpm:num(a.bpm,60,30,180),heartLevel:num(a.heartLevel,0.2,0,0.5),breathing:bool(a.breathing,false),inhale:num(a.inhale,4,1,12),exhale:num(a.exhale,6,1,16),pause:num(a.pause,1,0,8),breathLevel:num(a.breathLevel,0.15,0,0.5)},
      focus: {enabled:bool(f.enabled,false),opening:num(f.opening,0.3,0.1,0.8),darkness:num(f.darkness,0.8,0,1),blur:num(f.blur,8,0,24),tighten:bool(f.tighten,false),endOpening:num(f.endOpening,0.15,0.08,0.7),tightenSeconds:num(f.tightenSeconds,60,5,300),fixation:choice(f.fixation,['none','spiral','ring'],'none'),size:num(f.size,0.1,0.025,0.25),glow:num(f.glow,16,0,40),color:color(f.color,'#d4a6ff'),colorPulse:bool(f.colorPulse,false),colorA:color(f.colorA,'#40105f'),colorB:color(f.colorB,'#f3a2d5'),colorOpacity:num(f.colorOpacity,0.15,0,0.35),beatSource:choice(f.beatSource,['heartbeat','iso','binaural'],'heartbeat'),beats:Math.round(num(f.beats,8,1,64))},
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
    issue(sender, level, token, now, minutes, allowPulse, allowAudio=false, allowExpressions=false) {
      if (!Number.isSafeInteger(sender) || !['visuals', 'text', 'session'].includes(level) || typeof token !== 'string' || token.length < 16)
        throw new Error('Invalid grant');
      this.grant = { sender, level, token, expires: minutes === null ? null : now + num(minutes, 15, 1, 30) * 60000, allowPulse: !!allowPulse, allowAudio:!!allowAudio, allowExpressions:!!allowExpressions };
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
      next.head = incoming.head; next.focus=incoming.focus;
      if(!g.allowPulse)for(const key of ['colorPulse','colorA','colorB','colorOpacity','beatSource','beats'])next.focus[key]=current.focus[key];
      if(g.allowAudio)next.audio=incoming.audio;
      if (g.level === 'visuals') { next.head.words = current.head.words; next.head.wordMode = current.head.wordMode; }
      if (g.level !== 'visuals') next.text = incoming.text;
      if (g.allowPulse) next.pulse = incoming.pulse;
      this.lastSequence = packet.seq; this.lastCommand = now;
      return { settings: normalize(next), enabled: g.level === 'session' && typeof packet.enabled === 'boolean' ? packet.enabled : undefined,
        allowSelfHead: typeof packet.allowSelfHead==='boolean'?packet.allowSelfHead:undefined,
        locked: g.level === 'session' && typeof packet.locked === 'boolean' ? packet.locked : undefined };
    }
  }
  function textFrame(t, seconds) {
    if (!t.enabled || !t.messages.length) return { message: '', index: -1, cycle: -1, progress: 0 };
    const period = t.duration + t.gap, cycle = Math.floor(seconds / period), age = seconds % period;
    // Stable pseudo-random order means changing frame rate does not skip words.
    const index = t.random ? ((Math.imul(cycle + 1, 1664525) + 1013904223) >>> 0) % t.messages.length : cycle % t.messages.length;
    const message = age < t.duration ? t.messages[index] : '';
    return { message, index, cycle, progress: Math.min(1, age / Math.max(0.000001, t.duration * 0.75)) };
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
        const r=radius*step/300,a=arm*sector+r/radius*s.curve*Math.PI*2+sector*s.thickness*(s.taper||0)*(1-r/radius)/2;
        const x=center+r*Math.cos(a),y=center+r*Math.sin(a);if(step)tx.lineTo(x,y);else tx.moveTo(x,y);
      }
      const outer=arm*sector+s.curve*Math.PI*2;
      tx.arc(center,center,radius,outer,outer+sector*s.thickness);
      for(let step=300;step>=0;step--){const r=radius*step/300,a=arm*sector+sector*s.thickness*(1-(s.taper||0)*(1-r/radius)/2)+r/radius*s.curve*Math.PI*2;tx.lineTo(center+r*Math.cos(a),center+r*Math.sin(a));}
      tx.closePath();tx.fill();
    }
  }
  function newPulseState() { return {start:-Infinity,last:-Infinity,next:0,cycle:-1,queued:null}; }
  function pulseFrame(p,frame,textEnabled,time,state,random=Math.random) {
    if(!p.enabled)return 0;
    if(time<p.startDelay){state.cycle=frame.cycle;return 0;}
    if(p.mode==='text'){
      if(textEnabled && frame.message && frame.cycle!==state.cycle && (frame.cycle+1)%p.every===0 && state.queued===null)state.queued=time+p.textDelay;
      state.cycle=frame.cycle;
    }
    const due=p.mode==='text'?state.queued!==null && time>=state.queued:time>=Math.max(p.startDelay,state.next);
    if(due && time-state.last>=Math.max(2,p.duration)){
      state.start=state.last=time;state.queued=null;
      state.next=time+(p.mode==='random'?p.randomMin+random()*(p.randomMax-p.randomMin):p.interval);
    }
    const progress=(time-state.start)/p.duration;
    return progress>=0&&progress<=1?p.opacity*(p.shape==='soft'?Math.sin(progress*Math.PI)**2:(1-progress)**2):0;
  }
  function synthesizeTrack(kind,a,rate=22050) {
    const duration=kind==='iso'?1/a.isoRate:kind==='heart'?60/a.bpm:kind==='breath'?a.inhale+a.exhale+a.pause:32;
    const data=new Float32Array(Math.max(1,Math.round(duration*rate)));let low=0;
    const chords=[[130.81,164.81,196],[110,130.81,164.81],[87.31,110,130.81],[98,123.47,146.83]];
    for(let i=0;i<data.length;i++){
      const t=i/rate;let v=0;
      if(kind==='iso'){const phase=t/duration;const edge=.025;const envelope=Math.min(1,phase/edge,Math.max(0,(a.isoDuty-phase)/edge));v=Math.sin(t*a.isoHz*Math.PI*2)*Math.max(0,envelope);}
      else if(kind==='heart'){for(const [delay,amp,freq]of [[0,1,58],[duration*.23,.65,72]]){const x=t-delay;if(x>=0&&x<duration*.22)v+=amp*Math.sin(x*freq*Math.PI*2)*Math.sin(Math.min(1,x/.012)*Math.PI/2)*Math.exp(-x*40);}}
      else if(kind==='breath'){low=low*.92+(random01(i+87)*2-1)*.08;const env=t<a.inhale?Math.sin(t/a.inhale*Math.PI)**1.5:t<a.inhale+a.exhale?.7*Math.sin((t-a.inhale)/a.exhale*Math.PI)**1.5:0;v=low*env*2;}
      else {
        const chord=chords[Math.floor(t/8)%4],u=t%8,env=Math.sin(u/8*Math.PI)**2;
        for(let n=0;n<3;n++)v+=Math.sin(t*chord[n]*Math.PI*2)*env*.16;
        if(a.music==='drift'){const slot=Math.floor(t/2),age=t%2,freq=chords[Math.floor(slot/4)%4][slot%3]*4;v=v*.45+Math.sin(t*freq*Math.PI*2)*Math.sin(Math.min(1,age/.03)*Math.PI/2)*Math.exp(-age*2)*.2;}
        if(a.music==='rain'){low=low*.97+(random01(i+99)*2-1)*.03;v=v*.6+low*.8*Math.sin(t/32*Math.PI)**2;}
      }
      data[i]=Math.max(-1,Math.min(1,v));
    }
    return {data,rate,duration:data.length/rate};
  }
  function buildAudioMix(context,a,destination) {
    const nodes=[],sources=[],bus=context.createGain(),compressor=context.createDynamicsCompressor();
    nodes.push(bus,compressor);bus.gain.value=a.master*.35;compressor.threshold.value=-12;compressor.ratio.value=8;bus.connect(compressor);compressor.connect(destination);
    const start=context.currentTime+.03;
    const loop=(kind,level)=>{const track=synthesizeTrack(kind,a),buffer=context.createBuffer(1,track.data.length,track.rate);buffer.copyToChannel(track.data,0);const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=level;source.connect(gain);gain.connect(bus);source.start(start);sources.push(source);nodes.push(source,gain);};
    if(a.binaural){const merger=context.createChannelMerger(2);merger.channelInterpretation='discrete';merger.connect(bus);nodes.push(merger);for(const [channel,hz]of [a.leftHz,a.rightHz].entries()){const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.value=a.toneLevel;osc.connect(gain);gain.connect(merger,0,channel);osc.start(start);sources.push(osc);nodes.push(osc,gain);}}
    if(a.iso)loop('iso',a.isoLevel);if(a.heartbeat)loop('heart',a.heartLevel);if(a.breathing)loop('breath',a.breathLevel);if(a.music!=='none')loop('music',a.musicLevel);
    return {start,bus,sources,nodes};
  }
  const core = { synthesizeTrack, buildAudioMix, newPulseState, pulseFrame, drawSpiralTexture, normalize, defaults, bounds, ControlGate, textFrame, textPosition, normalizePresets };
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
  const PERMANENT_KEY='hypnoreverie-permanent-v1';let permanent=null,permanentAnnouncedToken='';
  try{const v=JSON.parse(localStorage.getItem(PERMANENT_KEY)||'null');if(v && v.owner===window.Player?.MemberNumber && Number.isSafeInteger(v.sender) && ['visuals','text','session'].includes(v.level))permanent={owner:v.owner,sender:v.sender,level:v.level,allowPulse:v.allowPulse===true,allowAudio:v.allowAudio===true,allowExpressions:v.allowExpressions===true,enabled:v.enabled===true,locked:v.locked===true&&v.level==='session',headSharing:v.headSharing===true};}catch{}
  let remoteHeadSharing = false, selfHeadAllowed = false, ownHeadVisible = false;
  let enabled = resume.remember && resume.enabled && resume.member===window.Player?.MemberNumber, locked = false, destroyed = false, socket = null, selected = 'self';
  let activeTime = 0, lastFrame = 0, frameId = 0, rectangle = null, networkRoom = null, networkMember = null;
  let dominant = false, pulseAllowed = false, status = enabled ? 'Saved effects resumed.' : 'Ready. Effects are off.', lastHello = 0;
  const gate = new ControlGate(), peers = new Map(), receivedGrants = new Map();
  if(permanent){enabled=permanent.enabled;locked=permanent.locked;remoteHeadSharing=permanent.headSharing;gate.issue(permanent.sender,permanent.level,crypto.randomUUID(),Date.now(),null,permanent.allowPulse,permanent.allowAudio,permanent.allowExpressions);}
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
    #focus-blur{position:fixed;pointer-events:none}#effect,#heads{position:fixed;pointer-events:none}#ui{position:fixed;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;padding:16px}
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
  <div id="focus-blur" hidden></div><canvas id="effect" aria-hidden="true" hidden></canvas><canvas id="heads" aria-hidden="true" hidden></canvas>
  <div id="ui" hidden><section id="panel" role="dialog" aria-label="Hypno Reverie settings" hidden>
    <div class="header"><div class="brand" id="drag-bar" title="Drag to move the menu">${LOGO}<div><h2>Hypno Reverie</h2><small>0.6 · Drag here to move</small></div><button id="compact" title="Toggle compact menu; drag the bottom-right corner to resize" aria-label="Toggle compact menu">↔</button><button id="close" aria-label="Close menu">×</button></div>
      <div class="tabs" role="tablist" aria-label="Settings categories">
        <button data-tab="overview" role="tab" aria-selected="true">Overview</button><button data-tab="primary" role="tab" aria-selected="false">Primary</button><button data-tab="secondary" role="tab" aria-selected="false">Secondary</button>
        <button data-tab="text" role="tab" aria-selected="false">Words</button><button data-tab="pulse" role="tab" aria-selected="false">Pulse</button><button data-tab="audio" role="tab" aria-selected="false">Audio</button><button data-tab="focus" role="tab" aria-selected="false">Focus</button><button data-tab="expressions" role="tab" aria-selected="false">Face</button><button data-tab="head" role="tab" aria-selected="false">Head</button><button data-tab="sharing" role="tab" aria-selected="false">Keys</button><button data-tab="presets" role="tab" aria-selected="false">Presets</button>
      </div>
      <div class="session-bar"><label>Edit <select id="target"><option value="self">My overlay</option></select></label><label><input id="enabled" type="checkbox"> Effects on</label><label id="lock-row" hidden><input id="lock" type="checkbox"> Lock controls</label><button id="preview-toggle" aria-pressed="false">Preview draft</button><span id="session-badge" class="help">Local session</span></div>
    </div>
    <div id="content"><div id="profile-card" class="card" hidden><h3 id="profile-title"></h3><p id="profile-status"></p><div id="request-options"><label>Requested access <select id="request-level"><option value="visuals">Visuals only</option><option value="text">Visuals + words</option><option value="session">Full session + control lock</option></select></label><label>Duration <select id="request-duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="indefinite">Permanent access</option></select></label><label><input id="request-pulse" type="checkbox"> Include pulse / flash changes</label><label><input id="request-audio" type="checkbox"> Include audio control</label><label><input id="request-expressions" type="checkbox"> Include facial expressions</label></div><button id="request-keys">Request keys</button></div><div id="requests-card" class="card" hidden><h3>Key requests</h3><div id="requests-list"></div><p class="help">The controller chooses the requested permissions. Yes grants exactly those permissions; No declines.</p></div>
      <div id="remote-note" class="notice" hidden>Editing a remote draft. Send changes to apply it.</div>
      <div id="overview" role="tabpanel"><h3>Set the scene</h3><p>Build your spirals, add words and pulse effects, then save a preset. Changes to your own overlay apply immediately.</p>
        <div class="card" id="local-session-card"><h3>Session controls</h3><p id="stop-note">Stop your effects and revoke keys to your overlay.</p><button id="stop">Stop / revoke</button><label><input id="remember-session" type="checkbox"> Keep effects on across room changes and relog</label><p class="help">Remembers on/off for this account when the addon loads again. Timed keys clear when leaving the room. Permanent access preserves effects and lock until returned or revoked.</p><p class="help">While keys are handed over, this button is disabled. Escape stops your session only while controls are unlocked.</p></div>
        <div class="notice">Photosensitivity notice: flashing lights and moving patterns may trigger seizures in people with photosensitive epilepsy. Avoid these effects if they are a trigger for you. Stop if you feel unwell. <a href="https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity" target="_blank" rel="noopener noreferrer">Learn more</a></div>
        <p class="help">Open this menu from the headset icon in your player profile, your bookmark, or Alt+Shift+H. Close the menu to return to play.</p>
      </div>
      <div id="primary" role="tabpanel" hidden><h3>Primary spiral</h3><p class="help">Your main colour and motion layer.</p><fieldset id="primary-fields"></fieldset></div>
      <div id="secondary" role="tabpanel" hidden><h3>Secondary spiral</h3><p class="help">Blend an independent spiral over the primary.</p><fieldset id="secondary-fields"></fieldset></div>
      <div id="text" role="tabpanel" hidden><h3>Word flashes</h3><p class="help">One word or sentence per line. Random positions stay within the player area; center + periphery alternates between the middle and edges.</p><fieldset id="text-fields"></fieldset></div>
      <div id="pulse" role="tabpanel" hidden><h3>Pulse & flash</h3><p class="help">Choose a rhythm. Flashes remain limited to one every two seconds or slower.</p><fieldset id="pulse-fields"></fieldset></div>
      <div id="audio" role="tabpanel" hidden><h3>Audio layers</h3><p class="help">Headphones separate the left/right tones. Ambient music and sound loops are generated locally. Start at a comfortable volume.</p><div class="card"><button id="audio-start">Start audio on this device</button><button id="audio-mute">Mute audio</button><label><input id="audio-preview" type="checkbox"> Listen to selected draft locally</label><p id="audio-status" class="help">Audio needs a local click after loading.</p></div><fieldset id="audio-fields"></fieldset></div>
      <div id="focus" role="tabpanel" hidden><h3>Fixation & tunnel vision</h3><p class="help">A soft opening keeps the center clear. Words draw over the fixation point. Colour changes follow the selected audio rhythm, with a gentle minimum two-second cycle.</p><fieldset id="focus-fields"></fieldset></div>
      <div id="expressions" role="tabpanel" hidden><h3>Facial expressions</h3><p class="help">Use the character’s supported game expressions, including mouth and tongue options when available. Changes use the game’s expression rules and are visible in the room.</p><label>Face group <select id="face-group"></select></label><label>Expression <select id="face-value"></select></label><button id="face-apply">Apply expression</button><p id="face-status" class="help"></p></div>
      <div id="head" role="tabpanel" hidden><h3>Head effects</h3><p class="help">Combine tiny words, a forehead spiral, spiral eyes, and a halo. Other players see these while your overlay is on; your own view starts off. During a grant, the controller must allow you to use Show my head effects. Use Preview draft to inspect the design. Position controls help align unusual poses.</p>
        <div class="card"><label id="broadcast-label"><input id="broadcast-head" type="checkbox"> Share my head effects with the room</label><p class="help">Shares your head-effect settings and the currently displayed words with other Hypno Reverie users. During a grant, head effects enabled by your controller are shared automatically. Each viewer can still hide shared effects.</p><label><input id="show-heads" type="checkbox"> Show other players’ shared head effects</label></div><label id="own-head-row"><input id="show-own-head" type="checkbox"> Show my head effects (off by default)</label><label id="allow-own-head-row" hidden><input id="allow-own-head" type="checkbox"> Allow wearer to view head effects</label><fieldset id="head-fields"></fieldset>
      </div>
      <div id="sharing" role="tabpanel" hidden><h3>Hand over the keys</h3><p class="help">Both players need version 0.6 for all features. Dominant/controller status is self-declared; choose by name and member number.</p>
        <div class="card"><label><input id="dominant" type="checkbox"> Available as a dominant/controller</label><button id="discover">Find players</button></div>
        <div class="card"><label>Give keys to <select id="peer"><option value="">No controllers discovered</option></select></label><label>Permission <select id="level"><option value="visuals">Visuals only</option><option value="text">Visuals + words</option><option value="session">Full session + control lock</option></select></label>
          <label><input id="allow-pulse" type="checkbox"> Also allow pulse/flash changes</label><label><input id="allow-audio" type="checkbox"> Also allow audio control</label><label><input id="allow-expressions" type="checkbox"> Also allow facial expressions</label><label>Duration <select id="duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="custom">Custom</option><option value="indefinite">No time limit</option></select></label><label id="minutes-row" hidden>Minutes <input id="minutes" type="number" min="1" max="30" value="15"></label>
          <p class="help">A grant shares your current settings and message list, and allows controller-enabled head effects to be visible to the room. Permanent access remembers this controller, permissions, effects and lock across room changes and relog. Returning or revoking keys ends it. Timed grants remain room-scoped. Control messages require both players in the same room.</p>
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
    field(parent,path('style'),'Pattern','select',null,null,null,[['spiral','Spiral'],['rings','Expanding rings'],['hearts','Heart tunnel'],['petals','Flower tunnel'],['polygon','Polygon tunnel'],['star','Star tunnel']]);
    slider(parent,path('taper'),'Thin towards center',0,0.95);
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
  field('text-fields', ['text', 'duration'], 'Message duration (seconds)', 'number', 0.001, 30, 0.001);
  field('text-fields', ['text', 'gap'], 'Gap between messages (seconds)', 'number', 0, 30, 0.001);
  slider('text-fields', ['text', 'fontSize'], 'Font size (px)', 12, 180, 1);
  slider('text-fields', ['text', 'lines'], 'Number of lines', 1, 12, 1);
  field('text-fields', ['text', 'random'], 'Random message order', 'checkbox');
  field('pulse-fields', ['pulse', 'enabled'], 'Enable pulse / flash', 'checkbox');
  field('pulse-fields', ['pulse', 'mode'], 'Timing', 'select', null, null, null,
    [['interval', 'Fixed interval'], ['random', 'Random interval'], ['text', 'With each text message']]);
  field('pulse-fields', ['pulse', 'shape'], 'Effect', 'select', null, null, null, [['soft', 'Soft pulse'], ['flash', 'Flash with fade']]);
  field('pulse-fields', ['pulse', 'color'], 'Pulse colour', 'color');
  slider('pulse-fields', ['pulse', 'opacity'], 'Pulse opacity', 0, 0.45);
  field('pulse-fields', ['pulse', 'duration'], 'Pulse duration (seconds)', 'number', 0.05, 10, 0.001);
  field('pulse-fields', ['pulse', 'interval'], 'Interval (seconds)', 'number', 2, 300, 0.001);
  field('pulse-fields', ['pulse', 'randomMin'], 'Random minimum (seconds)', 'number', 2, 300, 0.001);
  field('pulse-fields', ['pulse', 'randomMax'], 'Random maximum (seconds)', 'number', 2, 300, 0.001);
  field('pulse-fields',['pulse','startDelay'],'Start delay (seconds)','number',0,60,0.001);
  field('pulse-fields',['pulse','textDelay'],'Delay after word (text timing only)','number',0,5,0.001);
  field('pulse-fields',['pulse','every'],'Pulse every Nth message (text timing only)','number',1,20,1);
  for (const [key, title] of [['words','Tiny words'],['forehead','Forehead spiral'],['eyes','Spiral eyes'],['halo','Spiral halo']]) field('head-fields', ['head',key], title, 'checkbox');
  field('head-fields',['head','wordMode'],'Word motion','select',null,null,null,[['orbit','Orbit around head'],['sparkle','Appear around head']]);
  field('head-fields',['head','color'],'Head effect colour','color');
  slider('head-fields',['head','opacity'],'Opacity',0,0.9);
  slider('head-fields',['head','size'],'Spiral size',0.4,2,0.05);
  slider('head-fields',['head','wordSize'],'Tiny word size',8,24,1);
  slider('head-fields',['head','offsetX'],'Horizontal alignment',-200,200,1);
  slider('head-fields',['head','offsetY'],'Vertical alignment',-300,300,1);
  field('audio-fields',['audio','enabled'],'Enable audio layer','checkbox');
  slider('audio-fields',['audio','master'],'Master level',0,0.6);
  field('audio-fields',['audio','binaural'],'Left / right tones','checkbox');
  field('audio-fields',['audio','leftHz'],'Left frequency (Hz)','number',40,1000,0.1);
  field('audio-fields',['audio','rightHz'],'Right frequency (Hz)','number',40,1000,0.1);
  slider('audio-fields',['audio','toneLevel'],'Tone level',0,0.5);
  field('audio-fields',['audio','iso'],'Isochronic pulse track','checkbox');
  field('audio-fields',['audio','isoHz'],'Pulse tone (Hz)','number',40,1000,0.1);
  field('audio-fields',['audio','isoRate'],'Pulses per second','number',0.1,30,0.1);
  slider('audio-fields',['audio','isoDuty'],'Pulse on-time fraction',0.1,0.9);
  slider('audio-fields',['audio','isoLevel'],'Pulse track level',0,0.5);
  field('audio-fields',['audio','music'],'Ambient music','select',null,null,null,[['none','None'],['velvet','Velvet chords'],['drift','Slow drifting bells'],['rain','Rain & warm pads']]);
  slider('audio-fields',['audio','musicLevel'],'Music level',0,0.5);
  field('audio-fields',['audio','heartbeat'],'Heartbeat','checkbox');
  field('audio-fields',['audio','bpm'],'Heartbeat speed (BPM)','number',30,180,1);
  slider('audio-fields',['audio','heartLevel'],'Heartbeat level',0,0.5);
  field('audio-fields',['audio','breathing'],'Breathing sound','checkbox');
  field('audio-fields',['audio','inhale'],'Inhale (seconds)','number',1,12,0.1);
  field('audio-fields',['audio','exhale'],'Exhale (seconds)','number',1,16,0.1);
  field('audio-fields',['audio','pause'],'Breath pause (seconds)','number',0,8,0.1);
  slider('audio-fields',['audio','breathLevel'],'Breathing level',0,0.5);
  field('focus-fields',['focus','enabled'],'Darken / blur periphery','checkbox');
  slider('focus-fields',['focus','opening'],'Clear center radius',0.1,0.8);
  slider('focus-fields',['focus','darkness'],'Outer darkness',0,1);
  slider('focus-fields',['focus','blur'],'Outer blur (px)',0,24,1);
  field('focus-fields',['focus','tighten'],'Slowly tighten tunnel','checkbox');
  slider('focus-fields',['focus','endOpening'],'Final opening',0.08,0.7);
  field('focus-fields',['focus','tightenSeconds'],'Tightening duration (seconds)','number',5,300,1);
  field('focus-fields',['focus','fixation'],'Center fixation','select',null,null,null,[['none','None'],['spiral','Glowing spiral'],['ring','Rotating collar ring']]);
  slider('focus-fields',['focus','size'],'Fixation size',0.025,0.25);
  slider('focus-fields',['focus','glow'],'Glow',0,40,1);
  field('focus-fields',['focus','color'],'Fixation colour','color');
  field('focus-fields',['focus','colorPulse'],'Beat-synced gentle colours','checkbox');
  field('focus-fields',['focus','colorA'],'First colour','color');field('focus-fields',['focus','colorB'],'Second colour','color');
  slider('focus-fields',['focus','colorOpacity'],'Colour intensity',0,0.35);
  field('focus-fields',['focus','beatSource'],'Rhythm source','select',null,null,null,[['heartbeat','Heartbeat'],['iso','Isochronic pulses'],['binaural','Left/right frequency difference']]);
  field('focus-fields',['focus','beats'],'Beats per colour cycle','number',1,64,1);
  function savePermanent(){
    const g=gate.grant;if(!g || g.expires!==null)return;
    const owner=player()?.MemberNumber??permanent?.owner;if(!Number.isSafeInteger(owner))return;
    permanent={owner,sender:g.sender,level:g.level,allowPulse:g.allowPulse,allowAudio:g.allowAudio,allowExpressions:g.allowExpressions,enabled,locked,headSharing:remoteHeadSharing};
    try{localStorage.setItem(PERMANENT_KEY,JSON.stringify(permanent));}catch{say('Permanent access could not be saved in this browser.');}
  }
  function forgetPermanent(){permanent=null;permanentAnnouncedToken='';try{localStorage.removeItem(PERMANENT_KEY);}catch{}}
  function rotatePermanent(){if(!permanent)return;gate.issue(permanent.sender,permanent.level,crypto.randomUUID(),Date.now(),null,permanent.allowPulse,permanent.allowAudio,permanent.allowExpressions);permanentAnnouncedToken='';}
  function sendPermanent(member){if(!permanent || permanent.sender!==member || !gate.grant || permanentAnnouncedToken===gate.grant.token)return;const g=gate.grant;if(send('grant',{token:g.token,level:g.level,expires:null,permanent:true,allowPulse:g.allowPulse,allowAudio:g.allowAudio,allowExpressions:g.allowExpressions,faceOptions:faceOptions(player()),settings,enabled,locked},member))permanentAnnouncedToken=g.token;}
  function saveSession() {
    if(permanent)savePermanent();
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
    $('head-fields').disabled = $('focus-fields').disabled = localLocked; $('audio-fields').disabled=localLocked || (selected!=='self'&&!remote?.allowAudio);
    if(selected!=='self'&&!remote?.allowPulse)for(const key of ['colorPulse','colorA','colorB','colorOpacity','beatSource','beats'])$('setting-focus-'+key).disabled=true;
    refreshFace();
    for (const record of fields) if (selected !== 'self' && remote?.level === 'visuals' && record.path[0] === 'head' && ['words','wordMode'].includes(record.path[1])) record.input.disabled = true;
    $('stop').disabled = $('revoke').disabled = $('grant').disabled = !!gate.grant;
    for (const id of ['peer','level','allow-pulse','allow-audio','allow-expressions','duration','minutes']) $(id).disabled = !!gate.grant;
    $('preset-load').disabled = localLocked; $('preset-save').disabled = noAccess;
    $('broadcast-head').checked = privacy.broadcast;
    $('own-head-row').hidden=selected!=='self';$('show-own-head').checked=ownHeadVisible;$('show-own-head').disabled=!!gate.grant&&!selfHeadAllowed;
    $('allow-own-head-row').hidden=selected==='self'||!remote;$('allow-own-head').checked=!!remote?.allowSelfHead;
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
  $('show-own-head').onchange=()=>{if(!gate.grant||selfHeadAllowed)ownHeadVisible=$('show-own-head').checked;refreshFields();};
  $('allow-own-head').onchange=()=>{const g=receivedGrants.get(Number(selected));if(g)g.allowSelfHead=$('allow-own-head').checked;};
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
    if(send('requestKeys',{level:$('request-level').value,minutes:$('request-duration').value==='indefinite'?null:Number($('request-duration').value),allowPulse:$('request-pulse').checked,allowAudio:$('request-audio').checked,allowExpressions:$('request-expressions').checked},member)){requestTimes.set(member,Date.now());say('Key request sent. Waiting for their approval.');refreshProfileCard();}
  };
  function refreshRequests() {
    $('requests-card').hidden=!keyRequests.size; $('requests-list').replaceChildren();
    const levels={visuals:'Visuals only',text:'Visuals + words',session:'Full session + control lock (can turn effects on/off and disable your normal controls and Escape)'};
    for(const [member,request] of keyRequests){
      const row=document.createElement('div');row.className='card';const name=document.createElement('p');
      name.textContent=label(member)+' requests '+levels[request.level]+' · '+(request.minutes===null?'PERMANENT: survives room changes and relog until returned or revoked':request.minutes+' minutes')+' · pulse/flash changes '+(request.allowPulse?'included':'excluded')+' · audio '+(request.allowAudio?'included':'excluded')+' · facial expressions '+(request.allowExpressions?'included':'excluded')+'. Shares current settings and messages; controller-enabled head effects are visible to the room.';
      const yes=document.createElement('button');yes.textContent='Yes';yes.disabled=!!gate.grant;yes.onclick=()=>{if(keyRequests.get(member)!==request || Date.now()-request.at>120000)return;giveKeys(member,request.level,request.minutes,request.allowPulse,request.allowAudio,request.allowExpressions);};
      const no=document.createElement('button');no.textContent='No';no.onclick=()=>{send('declineKeys',{},member);keyRequests.delete(member);refreshRequests();};
      row.append(name,yes,no);$('requests-list').append(row);
    }
  }

  const FACE_GROUPS=['Mouth','Eyes','Eyes2','Eyebrows','Blush','Tongue'];
  function cleanFaceOptions(raw){const result={};for(const name of FACE_GROUPS){if(Array.isArray(raw?.[name]))result[name]=[...new Set(raw[name].filter(v=>v===null||(typeof v==='string'&&v.length<=50)).slice(0,80))];}return result;}
  function faceOptions(character){const result={};for(const item of character?.Appearance||[]){const name=item.Asset?.Group?.Name;if(!FACE_GROUPS.includes(name))continue;let values=typeof window.InventoryGetItemProperty==='function'?window.InventoryGetItemProperty(item,'AllowExpression',true):item.Asset?.Group?.AllowExpression;if(Array.isArray(values)&&values.length)result[name]=[null,...values];}return cleanFaceOptions(result);}
  function refreshFace(){
    const remote=receivedGrants.get(Number(selected)),options=selected==='self'?faceOptions(player()):remote?.faceOptions||{};
    const group=$('face-group').value,value=$('face-value').value,key=JSON.stringify(options);
    if($('face-group').dataset.key!==key){$('face-group').dataset.key=key;$('face-group').replaceChildren();for(const name of Object.keys(options)){const option=document.createElement('option');option.value=name;option.textContent=name;$('face-group').append(option);}if(options[group])$('face-group').value=group;$('face-value').dataset.group='';}
    const chosen=$('face-group').value;
    if($('face-value').dataset.group!==chosen){$('face-value').replaceChildren();for(const expression of options[chosen]||[]){const option=document.createElement('option');option.value=expression??'';option.textContent=expression===null?'Default':expression.replace(/([a-z])([A-Z])/g,'$1 $2');$('face-value').append(option);}$('face-value').dataset.group=chosen;}
    const available=Object.keys(options).length>0,permitted=selected==='self'?!locked:!!remote?.allowExpressions;
    $('face-apply').disabled=$('face-group').disabled=$('face-value').disabled=!available||!permitted;
    $('face-status').textContent=!available?'No supported expression choices found on this character.':!permitted?'Expression control is not granted, or your controls are locked.':'Choose an expression and Apply. The game may block choices due to equipped items.';
  }
  $('face-group').onchange=()=>{$('face-value').dataset.group='';refreshFace();};
  function applyFace(group,value){
    if(!FACE_GROUPS.includes(group) || !(value===null||typeof value==='string'))return {ok:false,message:'Unsupported expression.'};
    const c=player(),options=faceOptions(c);
    if(!options[group]?.includes(value)||typeof window.CharacterSetFacialExpression!=='function'||typeof window.CharacterIsExpressionDisallowed!=='function')return {ok:false,message:'Expression API or choice unavailable.'};
    const groups=group==='Eyes'?['Eyes','Eyes2']:[group];
    for(const name of groups){const item=c.Appearance.find(item=>item.Asset?.Group?.Name===name);if(!item)continue;const reason=window.CharacterIsExpressionDisallowed(c,item,value);if(reason)return {ok:false,message:'The game blocked this expression: '+String(reason)};}
    window.CharacterSetFacialExpression(c,group,value);c.ActiveExpression?.setWithoutReload?.(group,value);return {ok:true,message:'Expression applied.'};
  }
  $('face-apply').onclick=()=>{const group=$('face-group').value,value=$('face-value').value||null;if(selected==='self'){if(!locked){try{say(applyFace(group,value).message);}catch{say('The game could not apply that expression.');}}return;}const grant=receivedGrants.get(Number(selected));if(!grant?.allowExpressions||Date.now()-(grant.lastSend||0)<300)return;grant.lastSend=Date.now();grant.seq++;send('expression',{token:grant.token,seq:grant.seq,group,value},Number(selected));};
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
    const message = { v: 2, kind, boot:BOOT, ...payload, to: target };
    if (JSON.stringify(message).length > 16000) return false;
    try { window.ServerSend('ChatRoomChat', { Content: CHANNEL, Type: 'Hidden', Target: target, Dictionary: message }); return true; }
    catch { return false; }
  }
  function revoke(reason, notify = true, keepEffects = false) {
    const old = gate.grant;
    forgetPermanent();
    if (old && notify) send('revoke', { token: old.token }, old.sender);
    gate.revoke(); locked = false; remoteHeadSharing = false; selfHeadAllowed=false;ownHeadVisible=false;
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
  function giveKeys(member,level,minutes,allowPulse,allowAudio=false,allowExpressions=false) {
    if(gate.grant)return;
    const peer=peers.get(member);
    if(!peer?.dominant || !present(member) || Date.now()-peer.seen>45000){say('This controller is no longer available.');return;}
    const grant=gate.issue(member,level,crypto.randomUUID(),Date.now(),minutes,allowPulse,allowAudio,allowExpressions);
    if(!send('grant',{token:grant.token,level:grant.level,expires:grant.expires,allowPulse:grant.allowPulse,allowAudio:grant.allowAudio,allowExpressions:grant.allowExpressions,faceOptions:faceOptions(player()),settings,enabled,locked:false},member)){gate.revoke();say('Could not send keys.');return;}
    if(minutes===null){savePermanent();permanentAnnouncedToken=grant.token;}
    keyRequests.delete(member);say('Keys given to '+label(member)+'. Escape revokes them while unlocked.');updatePeople();refreshFields();
  }
  $('grant').onclick = () => giveKeys(Number($('peer').value),$('level').value,$('duration').value==='indefinite'?null:Number($('duration').value==='custom'?$('minutes').value:$('duration').value),$('allow-pulse').checked,$('allow-audio').checked,$('allow-expressions').checked);
  $('apply').onclick = () => {
    // Commit the message editor if the user clicks Send before its blur handler runs.
    root.activeElement?.blur();
    const member = Number(selected), grant = receivedGrants.get(member);
    if (!grant || !present(member) || (grant.expires !== null && grant.expires <= Date.now())) { say('These keys are no longer valid.'); return; }
    if (Date.now() - (grant.lastSend || 0) < 300) return;
    grant.lastSend = Date.now(); grant.seq++;
    if (send('set', { token: grant.token, seq: grant.seq, settings: grant.draft, enabled: grant.enabled, locked: grant.locked, allowSelfHead:grant.allowSelfHead===true }, member)) say('Changes sent; waiting for acknowledgement.');
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
    $('grant-info').textContent = g ? `Keys: ${label(g.sender)} · ${g.level} · ${g.expires === null ? 'permanent access' : Math.max(0, Math.ceil((g.expires - Date.now()) / 60000)) + ' min remaining'}${locked ? ' · normal controls locked' : ''}` : 'No one has keys to your overlay.';
    refreshFields(); refreshRequests();
  }
  const inboundTimes = new Map();
  function onMessage(data) {
    if (!data || data.Type !== 'Hidden' || data.Content !== CHANNEL || !Number.isSafeInteger(data.Sender) || !roomKey()) return;
    if (roomKey() !== networkRoom || player()?.MemberNumber !== networkMember) {
      if(permanent && player()?.MemberNumber && permanent.owner!==player().MemberNumber){forgetPermanent();gate.revoke();locked=false;enabled=false;}
      clearSession('Room changed. Remote keys cleared.'); networkRoom=roomKey();networkMember=player()?.MemberNumber;lastHello=0;return;
    }
    const sender = data.Sender, packet = data.Dictionary;
    if (sender === player()?.MemberNumber || !present(sender) || !packet || typeof packet !== 'object' || packet.v !== 2 ||
      (packet.to !== null && packet.to !== player()?.MemberNumber)) return;
    if (!['hello', 'helloAck', 'grant', 'ackGrant', 'set', 'applied', 'release', 'revoke', 'head', 'requestKeys', 'declineKeys', 'expression', 'expressionResult'].includes(packet.kind)) return;
    // Discovery and cosmetic head state may broadcast; control always targets a member.
    if (!['hello', 'head'].includes(packet.kind) && packet.to !== player()?.MemberNumber) return;
    try { if (JSON.stringify(packet).length > 16000) return; } catch { return; }
    const now = Date.now(), rateKey = `${sender}:${packet.kind}`;
    if (now - (inboundTimes.get(rateKey) || 0) < 150 && !(packet.kind === 'head' && packet.active === false)) return;
    if (packet.kind === 'requestKeys' && now-(inboundTimes.get(rateKey)||0)<30000) return;
    inboundTimes.set(rateKey, now);
    if(packet.kind === 'requestKeys'){
      if(!['visuals','text','session'].includes(packet.level) || !(packet.minutes===null || (Number.isFinite(packet.minutes) && packet.minutes>=1 && packet.minutes<=30)) || typeof packet.allowPulse!=='boolean')return;
      peers.set(sender,{dominant:true,seen:now});keyRequests.set(sender,{at:now,level:packet.level,minutes:packet.minutes,allowPulse:packet.allowPulse,allowAudio:packet.allowAudio===true,allowExpressions:packet.allowExpressions===true});updatePeople();say(label(sender)+' requested keys. Review the request in the menu.');
      open();return;
    }
    if(packet.kind === 'declineKeys'){say(label(sender)+' declined your key request.');return;}
    if (packet.kind === 'head') {
      if (packet.active === true) publicHeads.set(sender, { head: normalize({head:packet.head}).head, message: typeof packet.message === 'string' ? packet.message.slice(0,160) : '', seen: now });
      else publicHeads.delete(sender);
      return;
    }
    if (packet.kind === 'hello' || packet.kind === 'helloAck') {
      if(permanent?.sender===sender && typeof packet.boot==='string' && packet.boot.length<=100 && peers.get(sender)?.boot!==packet.boot)rotatePermanent();
      peers.set(sender, { dominant: packet.dominant === true, seen: now, boot:typeof packet.boot==='string'?packet.boot.slice(0,100):'' });
      if (packet.kind === 'hello') send('helloAck', { dominant }, sender);
      sendPermanent(sender);updatePeople(); return;
    }
    if (packet.kind === 'grant') {
      if ((!dominant && packet.permanent!==true) || !['visuals', 'text', 'session'].includes(packet.level) || typeof packet.token !== 'string' ||
        packet.token.length < 16 || packet.token.length > 100 || (packet.expires !== null && (typeof packet.expires !== 'number' || !Number.isFinite(packet.expires) || packet.expires <= now || packet.expires > now + 31 * 60000))) return;
      receivedGrants.set(sender, { token: packet.token, level: packet.level, allowPulse: packet.allowPulse === true, allowAudio:packet.allowAudio===true,allowExpressions:packet.allowExpressions===true,faceOptions:cleanFaceOptions(packet.faceOptions),
        expires: packet.expires, draft: normalize(packet.settings), enabled: packet.enabled === true, locked: packet.locked===true, seq: 0, seen: now });
      send('ackGrant', { token: packet.token }, sender);
      updatePeople(); refreshFields(); say(`${label(sender)} gave you overlay keys. Select their overlay above.`); return;
    }
    if (packet.kind === 'ackGrant' && gate.grant?.sender === sender && gate.grant.token === packet.token) {
      const peer = peers.get(sender); if (peer) peer.seen = now; say(`${label(sender)} received your keys.`); return;
    }
    if(packet.kind==='expression'){
      if(!gate.grant?.allowExpressions || !gate.apply(sender,{...packet,settings},settings,now,present(sender)))return;
      let result;try{result=applyFace(packet.group,packet.value);}catch{result={ok:false,message:'The game could not apply that expression.'};}
      send('expressionResult',{...result,token:gate.grant.token,seq:packet.seq,faceOptions:faceOptions(player())},sender);say(result.message);return;
    }
    if(packet.kind==='expressionResult'){const grant=receivedGrants.get(sender);if(grant?.token!==packet.token||grant.seq!==packet.seq)return;grant.faceOptions=cleanFaceOptions(packet.faceOptions);refreshFace();say(packet.ok?'Expression applied on '+label(sender)+'.':'Expression rejected by the receiver’s game.');return;}
    if (packet.kind === 'set') {
      const result = gate.apply(sender, packet, settings, now, present(sender));
      if (!result) return;
      settings = result.settings;
      remoteHeadSharing = ['words','forehead','eyes','halo'].some(key => settings.head[key]);
      if (result.enabled !== undefined) enabled = result.enabled;
      if (result.locked !== undefined) locked = result.locked;
      if(result.allowSelfHead!==undefined){selfHeadAllowed=result.allowSelfHead;if(!selfHeadAllowed)ownHeadVisible=false;}
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
    if(permanent){savePermanent();rotatePermanent();say(reason+' Permanent access retained.');}
    else {if(!resume.remember)enabled=false;revoke(reason,false,resume.remember);}
    receivedGrants.clear();peers.clear();publicHeads.clear();keyRequests.clear();requestTimes.clear();viewedProfile=null;inboundTimes.clear();publicWasActive=false;selected='self';ownHeadVisible=false;selfHeadAllowed=false;
    updatePeople();refreshFields();layout();
  }
  function disconnected() { clearSession('Connection lost. All remote keys cleared.'); }
  function memberLeft(data) {
    const member = data?.SourceMemberNumber ?? data?.MemberNumber;
    if(gate.grant?.sender===member){if(permanent){savePermanent();rotatePermanent();}else revoke('Controller left the room. Keys revoked.',false);}
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
    if((permanent && member && permanent.owner!==member)||(resume.member && member && member!==resume.member)){forgetPermanent();gate.revoke();locked=false;enabled=false;saveSession();}
    if (room !== networkRoom || member !== networkMember) {
      clearSession('Room changed. Remote keys cleared.'); networkRoom = room; networkMember = member; lastHello = 0;
    }
    if (!room || !socket?.connected) { if (gate.grant || receivedGrants.size) clearSession('Not connected to a room. Keys cleared.'); return; }
    const now = Date.now();
    if (now - lastHello > 15000) { send('hello', { dominant }); lastHello = now; }
    if (gate.grant && !permanent && ((gate.grant.expires !== null && now >= gate.grant.expires) || !present(gate.grant.sender) || now - (peers.get(gate.grant.sender)?.seen || 0) > 45000)) revoke('Remote session ended. Keys revoked.');
    for (const [id, grant] of receivedGrants) if ((grant.expires !== null && now >= grant.expires) || !present(id) || now - (peers.get(id)?.seen || grant.seen) > 45000) receivedGrants.delete(id);
    for (const [id, peer] of peers) if (!present(id) || now - peer.seen > 45000) peers.delete(id);
    for (const [id,request] of keyRequests) if(!present(id) || now-request.at>120000)keyRequests.delete(id);
    for (const [id,state] of publicHeads) if (!present(id) || now - state.seen > 5000) publicHeads.delete(id);
    publishHead(); updatePeople();
  }
  let livePulse = newPulseState();
  function resetEffectClock() { activeTime = 0; lastFrame = 0; livePulse = newPulseState(); }
  function makeTexture(i, s, textures = effectTextures, textureKeys = effectTextureKeys) {
    const key = JSON.stringify([s.color, s.arms, s.curve, s.thickness, s.taper]);
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
  function drawPulse(frame,w,h) {
    const alpha=pulseFrame(settings.pulse,frame,settings.text.enabled,activeTime,livePulse);
    if(alpha>0){ctx.save();ctx.fillStyle=settings.pulse.color;ctx.globalAlpha=alpha;ctx.fillRect(0,0,w,h);ctx.restore();}
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
        if(self && (!enabled || !ownHeadVisible || (gate.grant&&!selfHeadAllowed)))continue;
        const state = self ? ownHeadState() : privacy.showOthers && !hideSharedUntilEnabled ? publicHeads.get(c.MemberNumber) : null;
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
  let previewTime=0,previewConfig='',previewPulseState=newPulseState();
  function focusRadius(f,time,w,h){const end=Math.min(f.opening,f.endOpening),amount=f.tighten?Math.min(1,time/f.tightenSeconds):0;return Math.min(w,h)*(f.opening+(end-f.opening)*amount);}
  function drawVisualLayer(c,s,time,w,h,index,textures,keys){
    if(!s.enabled)return;
    c.save();c.globalAlpha=s.backgroundOpacity;c.fillStyle=s.background;c.fillRect(0,0,w,h);c.globalAlpha=s.opacity;c.fillStyle=c.strokeStyle=s.color;c.translate(w/2,h/2);
    c.filter=s.blur?'blur('+s.blur*w/700+'px)':'none';
    const throb=1+Math.sin(time*s.throbSpeed*Math.PI*2)*s.throbStrength;
    if(s.style==='spiral'){
      makeTexture(index,s,textures,keys);c.rotate(time*s.spin*(s.reverse?-1:1));const side=Math.hypot(w,h)*s.zoom*throb,count=Math.ceil(Math.hypot(w,h)/side/2);
      for(let x=-count;x<=count;x++)for(let y=-count;y<=count;y++)c.drawImage(textures[index],(x-.5)*side,(y-.5)*side,side,side);
    }else{
      const radius=Math.hypot(w,h)*.7,spacing=Math.max(8,Math.min(w,h)*.2*s.zoom/Math.max(1,s.arms/4)),count=Math.min(80,Math.ceil(radius/spacing)+2);
      const phase=((time*s.spin*.25*(s.reverse?-1:1))%1+1)%1;
      if(['polygon','star','petals'].includes(s.style))c.rotate(time*s.spin*.08);
      for(let i=0;i<count;i++){
        const r=(i+phase)*spacing*throb;if(r<1)continue;c.lineWidth=Math.max(.4,spacing*s.thickness*(1-s.taper*(1-Math.min(1,r/radius))));c.beginPath();
        if(s.style==='rings')c.arc(0,0,r,0,Math.PI*2);
        else {const steps=s.style==='polygon'?6:s.style==='star'?10:180;for(let j=0;j<=steps;j++){const a=j/steps*Math.PI*2;let x,y;
          if(s.style==='hearts'){x=16*Math.sin(a)**3*r/17;y=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*r/17;}
          else{const rr=s.style==='star'?r*(j%2?.5:1):s.style==='petals'?r*(1+.16*Math.cos(6*a)):r;x=Math.sin(a)*rr;y=-Math.cos(a)*rr;}
          if(j)c.lineTo(x,y);else c.moveTo(x,y);
        }c.closePath();}c.stroke();
      }
    }c.restore();
  }
  const focusScratch=document.createElement('canvas');
  function drawFocus(c,config,time,w,h,beatTime=time){
    const f=config.focus;
    if(f.colorPulse){const rate=f.beatSource==='heartbeat'?config.audio.bpm/60:f.beatSource==='iso'?config.audio.isoRate:Math.abs(config.audio.rightHz-config.audio.leftHz);const seconds=Math.max(2,f.beats/Math.max(.01,rate)),mix=(1-Math.cos(beatTime/seconds*Math.PI*2))/2;
      const rgb=(color)=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),a=rgb(f.colorA),b=rgb(f.colorB);c.save();c.globalAlpha=f.colorOpacity;c.fillStyle='rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*mix)).join(',')+')';c.fillRect(0,0,w,h);c.restore();}
    if(f.enabled){const radius=focusRadius(f,time,w,h),outer=Math.max(radius+1,Math.min(w,h)*.65);
      if(f.blur>0){if(focusScratch.width!==w||focusScratch.height!==h){focusScratch.width=w;focusScratch.height=h;}const sc=focusScratch.getContext('2d');sc.clearRect(0,0,w,h);sc.save();sc.filter='blur('+f.blur*w/700+'px)';sc.drawImage(c.canvas,0,0);sc.filter='none';sc.globalCompositeOperation='destination-in';const mask=sc.createRadialGradient(w/2,h/2,radius,w/2,h/2,Math.min(outer,radius+Math.min(w,h)*.12));mask.addColorStop(0,'transparent');mask.addColorStop(1,'black');sc.fillStyle=mask;sc.fillRect(0,0,w,h);sc.restore();c.drawImage(focusScratch,0,0);}
      const gradient=c.createRadialGradient(w/2,h/2,radius,w/2,h/2,outer);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'rgba(0,0,0,'+f.darkness+')');c.fillStyle=gradient;c.fillRect(0,0,w,h);
    }
    if(f.fixation!=='none'){const r=Math.min(w,h)*f.size;c.save();c.translate(w/2,h/2);c.rotate(time*.3);c.strokeStyle=f.color;c.lineWidth=Math.max(1.5,r*.08);c.shadowColor=f.color;c.shadowBlur=f.glow;c.beginPath();
      if(f.fixation==='ring'){c.ellipse(0,0,r,r*.8,0,0,Math.PI*2);c.stroke();c.beginPath();c.rect(-r*.12,r*.65,r*.24,r*.3);}
      else for(let i=0;i<=150;i++){const a=i/150*Math.PI*6,rr=r*i/150;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();c.restore();}
  }
  function updateFocusBackdrop(){const el=$('focus-blur'),r=rectangle,f=settings.focus;el.hidden=!r||!enabled||!f.enabled||f.blur<=0||document.hidden;if(el.hidden)return;const radius=focusRadius(f,activeTime,r.width,r.height);Object.assign(el.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',backdropFilter:'blur('+f.blur+'px)',maskImage:'radial-gradient(circle at center,transparent '+radius+'px,black '+(radius+Math.min(r.width,r.height)*.12)+'px)'});}
  function renderPreview(dt) {
    if($('preview-window').hidden || document.hidden || !previewContext)return;
    if(selected !== 'self' && !receivedGrants.has(Number(selected))){showPreview(false);return;}
    const config=editState(),key=selected+JSON.stringify(config);
    if(key!==previewConfig){previewConfig=key;previewTime=0;previewPulseState=newPulseState();}
    previewTime+=dt;
    $('preview-label').textContent=(selected==='self'?'My overlay':label(Number(selected)))+' · unsent appearance preview';
    const c=previewContext,w=500,h=500;c.clearRect(0,0,w,h);c.fillStyle='#282331';c.fillRect(0,0,w,h);
    c.fillStyle='#71687f';c.beginPath();c.ellipse(250,195,38,48,0,0,Math.PI*2);c.fill();c.fillRect(210,245,80,230);
    config.spirals.forEach((layer,i)=>drawVisualLayer(c,layer,previewTime,w,h,i,previewTextures,previewKeys));
    drawFocus(c,config,previewTime,w,h);
    const frame=textFrame(config.text,previewTime),pulse=config.pulse;
    const alpha=pulseFrame(pulse,frame,config.text.enabled,previewTime,previewPulseState);
    if(alpha>0){c.save();c.fillStyle=pulse.color;c.globalAlpha=alpha;c.fillRect(0,0,w,h);c.restore();}
    drawText(frame,w,h,config.text,c);
    drawHeadGlyph(c,{head:config.head,message:textFrame({...config.text,enabled:true},previewTime).message},previewTime,250+config.head.offsetX*.5,195+config.head.offsetY*.5,.5);
  }
  function render(time) {
    if (destroyed) return;
    const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 0.1) : 0; lastFrame = time;
    if (!canvas.hidden && ctx) {
      activeTime += dt;
      const w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h);
      settings.spirals.forEach((layer,i)=>drawVisualLayer(ctx,layer,activeTime,w,h,i,effectTextures,effectTextureKeys));
      drawFocus(ctx,settings,activeTime,w,h,audioClock(activeTime));
      const text = textFrame(settings.text, activeTime);
      drawPulse(text, w, h); drawText(text, w, h);
    }
    updateFocusBackdrop(); drawHeads(time / 1000); renderPreview(dt);
    frameId = requestAnimationFrame(render);
  }
  let audioContext=null,audioReady=false,audioDraft=false,audioGraph=null,audioKey='',audioMutedByError=false;
  const retiredAudio=new Set();
  function disposeAudio(graph,immediate=false){if(!graph)return;const now=audioContext?.currentTime||0;try{graph.bus.gain.cancelScheduledValues(now);graph.bus.gain.setTargetAtTime(0,now,.015);}catch{}const close=()=>{for(const source of graph.sources)try{source.stop();}catch{}for(const node of graph.nodes)try{node.disconnect();}catch{}};if(immediate)close();else{const id=setTimeout(()=>{retiredAudio.delete(id);close();},80);retiredAudio.add(id);}}
  function syncAudio(){
    if(destroyed)return;
    const config=audioDraft?editState().audio:settings.audio,validDraft=selected==='self'||receivedGrants.has(Number(selected));
    const play=audioReady&&audioContext?.state==='running'&&config.enabled&&(audioDraft?validDraft:enabled)&&!document.hidden;
    const key=play?JSON.stringify(config)+(audioDraft?selected:'live'):'';
    if(key!==audioKey){disposeAudio(audioGraph);audioGraph=null;audioKey=key;if(play){try{audioGraph=buildAudioMix(audioContext,config,audioContext.destination);}catch(error){audioKey='';audioReady=false;audioMutedByError=true;say('Audio could not start: '+error.message);}}}
    $('audio-status').textContent=audioMutedByError?'Audio unavailable. Try Start audio again.':!audioReady?'Audio needs a local click after loading.':audioContext?.state!=='running'?'Browser paused audio. Click Start audio to resume.':play?(audioDraft?'Listening to the selected draft locally.':'Audio playing on this device.'):'Audio ready; enable the audio layer and effects to play.';
  }
  $('audio-start').onclick=async()=>{try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('Web Audio is unavailable');audioContext ||= new Context();await audioContext.resume();audioReady=true;audioMutedByError=false;syncAudio();}catch(error){say('Audio could not start: '+error.message);}};
  $('audio-mute').onclick=()=>{audioReady=false;syncAudio();};
  $('audio-preview').onchange=()=>{audioDraft=$('audio-preview').checked;syncAudio();};
  function audioClock(fallback){return audioGraph&&audioReady&&audioContext?.state==='running'?Math.max(0,audioContext.currentTime-audioGraph.start):fallback;}
  const audioTimer=setInterval(syncAudio,100);
  const layoutTimer = setInterval(layout, 200), networkTimer = setInterval(networkTick, 1000);
  addEventListener('resize', layout); addEventListener('scroll', layout, true); document.addEventListener('visibilitychange', layout);
  window.HypnoReverie = { version: VERSION, open, stop,
    destroy() {
      stop(); destroyed = true; cancelAnimationFrame(frameId); clearInterval(layoutTimer); clearInterval(networkTimer);
      clearInterval(audioTimer);disposeAudio(audioGraph,true);audioGraph=null;audioContext?.close().catch(()=>{});windowObserver.disconnect(); attachSocket(null); document.removeEventListener('keydown', keydown, true);
      removeEventListener('resize', layout); removeEventListener('scroll', layout, true); document.removeEventListener('visibilitychange', layout);
      profileButton?.remove(); host.remove(); delete window.HypnoReverie;
    } };
  refreshFields(); layout(); networkTick(); frameId = requestAnimationFrame(render);
})();
