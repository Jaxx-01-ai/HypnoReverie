// Hypno Reverie 0.9.0 — Jaxx-01-ai
// Original canvas renderer and opt-in, room-scoped control protocol.
(() => {
  'use strict';
  const BOOT = typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Math.random());
  const VERSION = '0.9.0', KEY = 'hypnoreverie-v2', CHANNEL = 'HypnoReverie';
  const PRESET_KEY = 'hypnoreverie-presets-v1', PRIVACY_KEY = 'hypnoreverie-head-sharing-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  // Binaural presets: [left Hz, right Hz]; the difference is the beat.
  const BINAURAL_PRESETS={custom:null,delta:[100,102.5],theta:[180,186],schumann:[150,157.83],alpha:[200,210],beta:[220,235],gamma:[240,280]};
  const binauralHz=a=>BINAURAL_PRESETS[a.binauralPreset]||[a.leftHz,a.rightHz];
  // Vocal clips (assets/vocals/<name>.mp3) and the sets the menu offers; sets with several clips play shuffled.
  const VOCAL_SETS={sighs:['sighs'],soft:['soft'],needy:['needy'],building:['building'],orgasm:['orgasm','orgasm2'],edge:['edge'],afterglow:['afterglow'],whimpers:['whimpers'],panting:['panting'],
    muffled:['muffled'],gagplead:['gagplead'],gagorgasm:['gagorgasm'],
    random:['sighs','soft','needy','building','orgasm','orgasm2','edge','afterglow','whimpers','panting','muffled','gagplead','gagorgasm'],
    ungagged:['sighs','soft','needy','building','orgasm','orgasm2','edge','afterglow','whimpers','panting'],gagged:['muffled','gagplead','gagorgasm']};
  const VOCAL_CHOICES=['none',...Object.keys(VOCAL_SETS)];
  const BED_KINDS=['pink','brown','ocean','drone','bowls'];
  // Imagery: the wearer's own links, tagged by category. The list stays in this browser; settings only name a category.
  const MEDIA_CATS=['any','mouth','chest','rear','feet','body','other'],MEDIA_LABELS={any:'Any',mouth:'Mouth',chest:'Chest',rear:'Rear',feet:'Feet',body:'Body',other:'Other'},MEDIA_KEY='hypnoreverie-media-v1',IMAGERY_PACK=[{file:'bound-wrists.mp4',cat:'body'},{file:'catsuit-body.mp4',cat:'body'},{file:'gag-drool.mp4',cat:'mouth'},{file:'heels-feet.mp4',cat:'feet'},{file:'lace-chest.mp4',cat:'chest'},{file:'lace-rear.mp4',cat:'rear'},{file:'latex-chest.mp4',cat:'chest'},{file:'latex-rear.mp4',cat:'rear'},{file:'lip-bite.mp4',cat:'mouth'},{file:'spiral-eyes.mp4',cat:'body'},{file:'stocking-feet.mp4',cat:'feet'}];
  // Clicker / bell cues and how long each one rings (seconds).
  const CUE_LEN={clicker:.4,double:.6,tick:.2,bell:3,chime:3,tingsha:5,deep:6,gong:8},CUE_KINDS=['none',...Object.keys(CUE_LEN)];
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
    audio: {enabled:false,master:0.2,binaural:false,leftHz:180,rightHz:184,toneLevel:0.18,iso:false,isoHz:180,isoRate:4,isoDuty:0.5,isoLevel:0.15,music:'none',musicLevel:0.2,heartbeat:false,bpm:60,heartLevel:0.2,breathing:false,inhale:4,exhale:6,pause:1,breathLevel:0.15,breathStyle:'mouth',binauralPreset:'custom',vocal:'none',vocalLevel:0.3,vocalGap:3,slick:'none',slickBpm:100,slickWet:0.6,slickLevel:0.3,cue:'none',cueMode:'interval',cueEvery:4,cueLevel:0.3,cueWords:[]},
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
      audio: {enabled:bool(a.enabled,false),master:num(a.master,0.2,0,0.6),binaural:bool(a.binaural,false),leftHz:num(a.leftHz,180,40,1000),rightHz:num(a.rightHz,184,40,1000),toneLevel:num(a.toneLevel,0.18,0,0.5),iso:bool(a.iso,false),isoHz:num(a.isoHz,180,40,1000),isoRate:num(a.isoRate,4,0.1,30),isoDuty:num(a.isoDuty,0.5,0.1,0.9),isoLevel:num(a.isoLevel,0.15,0,0.5),music:choice(a.music,['none','velvet','drift','rain',...BED_KINDS], 'none'),musicLevel:num(a.musicLevel,0.2,0,0.5),heartbeat:bool(a.heartbeat,false),bpm:num(a.bpm,60,30,180),heartLevel:num(a.heartLevel,0.2,0,0.5),breathing:bool(a.breathing,false),inhale:num(a.inhale,4,1,12),exhale:num(a.exhale,6,1,16),pause:num(a.pause,1,0,8),breathLevel:num(a.breathLevel,0.15,0,0.5),breathStyle:choice(a.breathStyle,['mouth','nose','sigh'],'mouth'),binauralPreset:choice(a.binauralPreset,Object.keys(BINAURAL_PRESETS),'custom'),vocal:choice(a.vocal,VOCAL_CHOICES,'none'),vocalLevel:num(a.vocalLevel,0.3,0,0.6),vocalGap:num(a.vocalGap,3,0,30),slick:choice(a.slick,['none','steady','build'],'none'),slickBpm:num(a.slickBpm,100,40,200),slickWet:num(a.slickWet,0.6,0,1),slickLevel:num(a.slickLevel,0.3,0,0.6),cue:choice(a.cue,CUE_KINDS,'none'),cueMode:choice(a.cueMode,['interval','words','trigger'],'interval'),cueEvery:num(a.cueEvery,4,0.5,60),cueLevel:num(a.cueLevel,0.3,0,0.6),cueWords:Array.isArray(a.cueWords)?a.cueWords.filter(x=>typeof x==='string').slice(0,30).map(x=>x.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,40)).filter(Boolean):[]},
      imagery:(im=>({enabled:bool(im.enabled,false),builtin:bool(im.builtin,true),category:choice(im.category,MEDIA_CATS,'any'),order:choice(im.order,['random','inorder'],'random'),timing:choice(im.timing,['cycle','words','steady'],'cycle'),duration:num(im.duration,4,0.5,60),gap:num(im.gap,1,0,60),fade:num(im.fade,0.6,0,5),opacity:num(im.opacity,0.6,0,1),size:num(im.size,0.7,0.1,1),position:choice(im.position,['center','random','fill'],'center'),blend:choice(im.blend,['normal','screen','overlay','soft-light','multiply'],'normal'),layer:choice(im.layer,['under','over'],'under'),pacer:choice(im.pacer,['off','ring','bar'],'off'),pacerFollow:bool(im.pacerFollow,true),pacerBpm:num(im.pacerBpm,90,20,220),pacerColor:color(im.pacerColor,'#ff7ad9'),pacerSize:num(im.pacerSize,0.25,0.05,0.6)}))(raw.imagery||{}),
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
      if (g.level === 'session') next.imagery = incoming.imagery;
      if (g.allowPulse) next.pulse = incoming.pulse;
      this.lastSequence = packet.seq; this.lastCommand = now;
      return { settings: normalize(next), enabled: g.level === 'session' && typeof packet.enabled === 'boolean' ? packet.enabled : undefined,
        allowSelfHead: typeof packet.allowSelfHead==='boolean'?packet.allowSelfHead:undefined,
        locked: g.level === 'session' && typeof packet.locked === 'boolean' ? packet.locked : undefined };
    }
  }
  // Several controllers: one independent ControlGate per holder.
  class MultiGate {
    constructor(){this.map=new Map();}
    issue(sender,...rest){const g=new ControlGate();const r=g.issue(sender,...rest);this.map.set(sender,g);return r;}
    get(sender){return this.map.get(sender)?.grant||null;}
    has(sender){return this.map.has(sender);}
    get size(){return this.map.size;}
    list(){return [...this.map.values()].map(g=>g.grant);}
    revoke(sender){this.map.delete(sender);}
    revokeAll(){this.map.clear();}
    apply(sender,packet,current,now,present){return this.map.get(sender)?.apply(sender,packet,current,now,present)||null;}
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
  // State-variable band-pass, one sample at a time (state lives in s.l<k>/s.b<k>).
  function svf(s,k,x,fc,q,rate){const f=2*Math.sin(Math.PI*Math.min(fc,rate/6)/rate);s['l'+k]=(s['l'+k]||0)+f*(s['b'+k]||0);const h=x-s['l'+k]-q*(s['b'+k]||0);s['b'+k]=(s['b'+k]||0)+f*h;return s['b'+k];}
  // Breath: turbulent noise through moving nose/mouth resonances. Inhale is brighter and quicker; exhale is warmer with a slow release.
  // Every breath in the loop varies slightly so it never sounds mechanical; 'sigh' adds a soft falling voice on the exhale.
  function breathSample(i,t,a,rate,s){
    const cycle=a.inhale+a.exhale+a.pause,n=Math.floor(t/cycle),u=t-n*cycle,vary=1+(random01(n*31+7)-.5)*.16,amp=.85+random01(n*17+3)*.3,style=a.breathStyle;
    const white=random01(i*2+11)*2-1;s.am=(s.am||0)+((random01(Math.floor(t*9)+n*97)-.5)-(s.am||0))*.002;
    let env=0,fc1=0,fc2=0,mix2=0,tilt=0;
    if(u<a.inhale){const x=u/a.inhale;env=Math.min(1,x/.3)**1.6*Math.min(1,(1-x)/.22)**1.2;fc1=(style==='nose'?1500:1100)*vary*(1+.25*x);fc2=(style==='nose'?3800:2600)*vary;mix2=style==='nose'?.9:.55;tilt=.35;}
    else if(u<a.inhale+a.exhale){const x=(u-a.inhale)/a.exhale;env=.82*Math.min(1,x/.08)*(1-x)**1.35;fc1=(style==='nose'?1200:style==='sigh'?650:780)*vary*(1-.2*x);fc2=(style==='nose'?3000:1700)*vary;mix2=style==='nose'?.6:.35;tilt=.6;}
    // Two band-passes in series per resonance give real breath's soft, mid-heavy colour instead of hiss.
    s.lp=(s.lp||0)+(white-(s.lp||0))*.06;const b1=svf(s,4,svf(s,1,white,fc1||800,.6,rate),fc1||800,.6,rate),b2=svf(s,5,svf(s,2,white,fc2||2000,.8,rate),fc2||2000,.8,rate);
    const inhaling=u<a.inhale;let v=b1+b2*mix2*.6+s.lp*tilt*1.4;s.o=(s.o||0)+(v-(s.o||0))*(inhaling?.5:.35);v=s.o;
    if(!env)return 0;
    if(!inhaling)v*=1.7;
    if(style==='sigh'&&u>=a.inhale&&u<a.inhale+a.exhale*.6){const x=(u-a.inhale)/(a.exhale*.6),f0=(210-60*x)*vary;s.ph=(s.ph||0)+f0/rate;const voice=Math.sin(s.ph*2*Math.PI)+.45*Math.sin(s.ph*4*Math.PI)+.2*Math.sin(s.ph*6*Math.PI);v+=svf(s,3,voice,700,.9,rate)*.35*Math.sin(Math.min(1,x)*Math.PI);}
    return v*env*amp*(1+s.am*.6);
  }
  // Background beds for binaural listening; all repeat seamlessly over the 32-second loop.
  function bedSample(i,t,kind,s){const w=random01(i*3+5)*2-1;
    if(kind==='pink'){s.p0=.99886*(s.p0||0)+w*.0555179;s.p1=.99332*(s.p1||0)+w*.0750759;s.p2=.969*(s.p2||0)+w*.153852;s.p3=.8665*(s.p3||0)+w*.3104856;s.p4=.55*(s.p4||0)+w*.5329522;s.p5=-.7616*(s.p5||0)-w*.016898;const v=s.p0+s.p1+s.p2+s.p3+s.p4+s.p5+(s.p6||0)+w*.5362;s.p6=w*.115926;return v*.11;}
    if(kind==='brown'||kind==='ocean'){s.br=((s.br||0)+.02*w)/1.02;let v=s.br*3.2;if(kind==='ocean'){const swell=.5-.5*Math.cos(t/8*2*Math.PI);s.hi=(s.hi||0)+(w-(s.hi||0))*.25;v=v*(.35+.65*swell)+s.hi*.12*swell**3;}return v;}
    if(kind==='drone'){let v=0;for(const [f,g] of [[55,.5],[82.5,.3],[110,.25],[110.0625,.25],[165,.12],[220.03125,.06]])v+=Math.sin(2*Math.PI*f*t)*g;return v*.22*(.85+.15*Math.sin(2*Math.PI*t/16));}
    const slot=Math.floor(t/8),age=t-slot*8,base=[220,261.625,196,246.94][slot%4];let v=0;for(const [m,g,d] of [[1,1,.35],[2.71,.45,.6],[5.4,.2,1.1]])v+=Math.sin(2*Math.PI*base*m*age+m)*g*Math.exp(-age*d);return v*.18*Math.min(1,age/.004);}
  // Clicker and bell cues, t = seconds since the strike. Bells use inharmonic partials with their own decay rates.
  function cueSample(i,t,kind){const n=random01(i*5+3)*2-1;
    const bell=(f,parts,decay)=>{let s=0;for(const [m,g,d] of parts)s+=Math.sin(2*Math.PI*f*m*t)*g*Math.exp(-t*decay*d);return s*Math.min(1,t/.002);};
    const click=x=>x>=0&&x<.03?(Math.sin(2*Math.PI*2300*x)*.8+n*.5)*Math.exp(-x*180):0;
    if(kind==='clicker')return click(t)+.55*click(t-.07);
    if(kind==='double')return click(t)+.55*click(t-.07)+click(t-.25)+.55*click(t-.32);
    if(kind==='tick')return t<.05?(Math.sin(2*Math.PI*1800*t)*.9+n*.3)*Math.exp(-t*120):0;
    if(kind==='bell')return bell(880,[[1,1,1],[2,.5,1.6],[2.76,.35,2.2],[5.4,.2,3.5],[8.93,.1,5]],1.6)*.6;
    if(kind==='deep')return bell(220,[[1,1,1],[.5,.6,.7],[2,.5,1.4],[2.4,.3,1.8],[3,.25,2.4],[4.2,.15,3]],.45)*.6;
    if(kind==='tingsha')return (Math.sin(2*Math.PI*2450*t)+Math.sin(2*Math.PI*2457*t)+.4*Math.sin(2*Math.PI*6620*t)*Math.exp(-t*2))*Math.exp(-t*.9)*Math.min(1,t/.001)*.3;
    if(kind==='chime'){let v=0;for(const [d,f] of [[0,1318.5],[.18,1568],[.36,1975.5]]){const x=t-d;if(x>=0)v+=Math.sin(2*Math.PI*f*x)*Math.exp(-x*2.5)*(1+.5*Math.sin(2*Math.PI*f*2.4*x)*Math.exp(-x*6))*Math.min(1,x/.002);}return v*.25;}
    if(kind==='gong'){const bloom=Math.min(1,t/.35);return (Math.sin(2*Math.PI*98*t+2*Math.sin(2*Math.PI*.7*t))*.8+Math.sin(2*Math.PI*147.3*t)*.4*bloom+Math.sin(2*Math.PI*233*t)*.3*bloom+n*.15*Math.exp(-t*8))*Math.exp(-t*.5)*.45*Math.min(1,t/.004);}
    return 0;}
  // Wet rhythm: each hit is a skin slap (fast broadband burst + low body thump) plus a wet, crackling tail.
  // Hits are humanised (timing, strength, alternating strong/weak). 'build' speeds up over 64 seconds, then starts again.
  function slickTrack(a,rate){const build=a.slick==='build',dur=build?64:16*60/a.slickBpm,n=Math.round(dur*rate),d=new Float32Array(n),times=[];
    if(build){let t=0;while(t<dur-.2){times.push(t);t+=60/(a.slickBpm*(1+.9*(t/dur)**1.5));}}else for(let k=0;k<16;k++)times.push(k*60/a.slickBpm);
    times.forEach((t0,k)=>{const start=Math.max(0,Math.round((t0+(k?(random01(k*13+1)-.5)*.024:0))*rate)),amp=(k%2?.8:1)*(.85+random01(k*7+2)*.3)*(build?.7+.3*t0/dur:1),len=Math.round(rate*.22);
      let b1=0,l1=0,b2=0,l2=0;const f1=2*Math.sin(Math.PI*700/rate),f2=2*Math.sin(Math.PI*2400/rate);
      for(let i=0;i<len&&start+i<n;i++){const x=i/rate,w=random01(start*3+i*7+k)*2-1;
        l1+=f1*b1;let h=w-l1-.9*b1;b1+=f1*h;const slap=b1*Math.exp(-x*140)*1.4+Math.sin(2*Math.PI*85*x)*Math.exp(-x*45)*.8*Math.min(1,x/.002);
        l2+=f2*b2;h=w*(random01(start+i*5+k*91)>.9?3:.4)-l2-.6*b2;b2+=f2*h;const wet=b2*Math.exp(-x*22)*Math.min(1,x/.01)*a.slickWet*.9;
        d[start+i]+=(slap+wet)*amp;}});
    let peak=0;for(const x of d)peak=Math.max(peak,Math.abs(x));if(peak>0)for(let i=0;i<n;i++)d[i]*=.9/peak;return {data:d,rate,duration:dur};}
  function synthesizeTrack(kind,a,rate=22050) {
    if(kind==='slick')return slickTrack(a,rate);
    const duration=kind==='iso'?1/a.isoRate:kind==='heart'?60/a.bpm:kind==='breath'?4*(a.inhale+a.exhale+a.pause):kind==='cue'?a.cueEvery:kind==='music'&&['pink','brown','ocean'].includes(a.music)?32.5:32;
    const data=new Float32Array(Math.max(1,Math.round(duration*rate)));let low=0;const st={};
    const chords=[[130.81,164.81,196],[110,130.81,164.81],[87.31,110,130.81],[98,123.47,146.83]];
    for(let i=0;i<data.length;i++){
      const t=i/rate;let v=0;
      if(kind==='iso'){const phase=t/duration;const edge=.025;const envelope=Math.min(1,phase/edge,Math.max(0,(a.isoDuty-phase)/edge));v=Math.sin(t*a.isoHz*Math.PI*2)*Math.max(0,envelope);}
      else if(kind==='heart'){for(const [delay,amp,freq]of [[0,1,58],[duration*.23,.65,72]]){const x=t-delay;if(x>=0&&x<duration*.22)v+=amp*Math.sin(x*freq*Math.PI*2)*Math.sin(Math.min(1,x/.012)*Math.PI/2)*Math.exp(-x*40);}}
      else if(kind==='cue')v=cueSample(i,t,a.cue)*Math.min(1,(duration-t)/.03);
      else if(kind==='breath')v=breathSample(i,t,a,rate,st);
      else if(BED_KINDS.includes(a.music))v=bedSample(i,t,a.music,st);
      else {
        const chord=chords[Math.floor(t/8)%4],u=t%8,env=Math.sin(u/8*Math.PI)**2;
        for(let n=0;n<3;n++)v+=Math.sin(t*chord[n]*Math.PI*2)*env*.16;
        if(a.music==='drift'){const slot=Math.floor(t/2),age=t%2,freq=chords[Math.floor(slot/4)%4][slot%3]*4;v=v*.45+Math.sin(t*freq*Math.PI*2)*Math.sin(Math.min(1,age/.03)*Math.PI/2)*Math.exp(-age*2)*.2;}
        if(a.music==='rain'){low=low*.97+(random01(i+99)*2-1)*.03;v=v*.6+low*.8*Math.sin(t/32*Math.PI)**2;}
      }
      data[i]=kind==='breath'||kind==='cue'?v:Math.max(-1,Math.min(1,v));
    }
    if(kind==='breath'||kind==='cue'){let peak=0;for(const x of data)peak=Math.max(peak,Math.abs(x));if(peak>0)for(let i=0;i<data.length;i++)data[i]*=.9/peak;}
    // Noise beds: generate half a second extra and crossfade it into the start so the loop point is seamless.
    if(kind==='music'&&['pink','brown','ocean'].includes(a.music)){const N=Math.round(rate*.5),L=data.length-N,out=new Float32Array(L);for(let i=0;i<L;i++)out[i]=i<N?data[i]*(i/N)+data[L+i]*(1-i/N):data[i];return {data:out,rate,duration:L/rate};}
    return {data,rate,duration:data.length/rate};
  }
  function buildAudioMix(context,a,destination) {
    const nodes=[],sources=[],bus=context.createGain(),compressor=context.createDynamicsCompressor();
    nodes.push(bus,compressor);bus.gain.value=a.master*.35;compressor.threshold.value=-12;compressor.ratio.value=8;bus.connect(compressor);compressor.connect(destination);
    const start=context.currentTime+.03;
    const loop=(kind,level)=>{const track=synthesizeTrack(kind,a,['breath','cue','slick'].includes(kind)?32000:22050),buffer=context.createBuffer(1,track.data.length,track.rate);buffer.copyToChannel(track.data,0);const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=level;source.connect(gain);gain.connect(bus);source.start(start);sources.push(source);nodes.push(source,gain);};
    if(a.binaural){const merger=context.createChannelMerger(2);merger.channelInterpretation='discrete';merger.connect(bus);nodes.push(merger);for(const [channel,hz]of binauralHz(a).entries()){const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.value=a.toneLevel;osc.connect(gain);gain.connect(merger,0,channel);osc.start(start);sources.push(osc);nodes.push(osc,gain);}}
    if(a.iso)loop('iso',a.isoLevel);if(a.heartbeat)loop('heart',a.heartLevel);if(a.breathing)loop('breath',a.breathLevel);if(a.music!=='none')loop('music',a.musicLevel);
    if(a.cue!=='none'&&a.cueMode==='interval')loop('cue',a.cueLevel);if(a.slick!=='none')loop('slick',a.slickLevel);
    const result={start,bus,sources,nodes};
    if(a.vocal!=='none')loadVocals(context,VOCAL_SETS[a.vocal]).then(buffers=>{
      if(result.dead)return;if(!buffers.some(x=>x.length)){say('Vocal sounds are not available yet.');return;}
      const gain=context.createGain();gain.gain.value=a.vocalLevel;gain.connect(bus);const src=context.createBufferSource();src.buffer=joinVocals(context,buffers,a.vocalGap,VOCAL_SETS[a.vocal].length>1);src.loop=true;src.connect(gain);
      src.start(Math.max(start,context.currentTime+.02));sources.push(src);nodes.push(gain,src);});
    return result;
  }
  // Vocal clips live in assets/vocals/<name>.mp3 and are decoded once per page.
  const vocalCache=new Map();
  function loadVocals(context,keys){return Promise.all(keys.map(k=>{let p=vocalCache.get(k);if(!p){p=fetch(ASSET_BASE+'vocals/'+k+'.mp3').then(r=>{if(!r.ok)throw Error(String(r.status));return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).then(prepVocal);vocalCache.set(k,p);p.catch(()=>vocalCache.delete(k));}return p.catch(()=>null);})).then(list=>list.filter(Boolean));}
  // Each clip is mixed to mono, trimmed of silence at both ends, brought to a common loudness (peak-limited) and given 10 ms fades.
  function prepVocal(b){const c=b.numberOfChannels,n=b.length,m=new Float32Array(n);for(let ch=0;ch<c;ch++){const x=b.getChannelData(ch);for(let i=0;i<n;i++)m[i]+=x[i]/c;}
    const fr=Math.max(1,Math.round(b.sampleRate*.02)),env=[];let emax=0;for(let i=0;i<n;i+=fr){let e=0;const end=Math.min(n,i+fr);for(let j=i;j<end;j++)e+=m[j]*m[j];e=Math.sqrt(e/(end-i));env.push(e);emax=Math.max(emax,e);}
    if(!emax)return new Float32Array(0);const thr=emax*.05,first=Math.max(0,env.findIndex(e=>e>thr)-3),last=env.length-1-[...env].reverse().findIndex(e=>e>thr),s=first*fr,e=Math.min(n,(last+4)*fr);
    let peak=0,act=0,cnt=0;for(let i=s;i<e;i++)peak=Math.max(peak,Math.abs(m[i]));for(const v of env)if(v>thr){act+=v*v;cnt++;}
    const gain=Math.min(.9/peak,.18/Math.sqrt(act/Math.max(1,cnt))),out=m.slice(s,e);for(let i=0;i<out.length;i++)out[i]*=gain;
    const f=Math.min(out.length>>1,Math.round(b.sampleRate*.01));for(let i=0;i<f;i++){out[i]*=i/f;out[out.length-1-i]*=i/f;}return out;}
  // One looping buffer: the clips (shuffled for 'random') with a pause after each.
  function joinVocals(context,clips,gap,shuffle){const rate=context.sampleRate,order=(shuffle?clips.slice().sort(()=>Math.random()-.5):clips).filter(x=>x.length);
    const parts=order.map(x=>({x,pad:Math.round(rate*gap*(shuffle?.6+Math.random()*.8:1))})),out=context.createBuffer(1,Math.max(1,parts.reduce((n,p)=>n+p.x.length+p.pad,0)),rate),d=out.getChannelData(0);
    let o=0;for(const {x,pad} of parts){d.set(x,o);o+=x.length+pad;}return out;}
  const wearableVariants = [
    {group:'ItemHead',asset:'InteractiveVRHeadset',name:'Hypno Reverie Headset',description:'Smooth curved visor. Cosmetic passthrough by default; use the native Function setting for vision blocking.',colors:['#18121f','#ee53ba','#8040b0'],type:{f:0,b:0,g:0}},
    {group:'ItemHood',asset:'CustomLatexHood',name:'Hypno Reverie Latex Hood',description:'Skin-tight glossy black latex hood that follows the head and face, with seams and a lip-sized mouth opening. Hides hair. Cosmetic by default; use the native Eyes setting for vision blocking.',colors:['#1C1C1C'],type:{m:3,e:2,x:0,h:1,z:0}}
  ];
  wearableVariants.push(
    {group:'ItemArms',asset:'Bolero',name:'Hypno Reverie Latex Bolero',description:'Smooth glossy bolero artwork on the native arm restraint. Native locks and restraint behavior apply.',colors:['#101115','#151515','#cccccc'],type:{}},
    {group:'Suit',asset:'LatexCatsuit',name:'Hypno Reverie Latex Top',description:'Glossy black latex with size-specific curved chest seams. Matching bottom is in SuitLower.',colors:['#101115'],type:{typed:0}},
    {group:'SuitLower',asset:'LatexCatsuit',name:'Hypno Reverie Latex Bottom',description:'Matching glossy latex lower suit on the native Latex Catsuit base.',colors:['#101115'],type:{}}
  );
  function wearableVariant(item) { return wearableVariants.find(v=>item?.Asset?.Name===v.asset&&item.Asset.Group?.Name===v.group&&item.Craft?.Name===v.name); }
  function isReverieHeadset(item) { return wearableVariant(item)?.group==='ItemHead'; }
  function makeWearableCraft(v, owner) {
    return {Item:v.asset,Name:v.name,Description:v.description,Color:v.colors.join(','),Lock:'',TypeRecord:{...v.type},ItemProperty:{},Effects:{},Private:false,Partial:false,MemberName:String(owner?.Name||'Player'),MemberNumber:owner?.MemberNumber??null};
  }
  function addWearableChoices(api, character, group, locks=false) {
    if(locks||!character||!group||api.DialogMenuMode==='permissions'||api.DialogMenuMode==='locking'||!Array.isArray(api.DialogInventory)||!api.Player)return;
    const required=['AssetGet','InventoryAvailable','DialogCanUseCraftedItem','DialogInventoryAdd','CraftingValidate'];
    if(required.some(k=>typeof api[k]!=='function')||typeof api.AppearanceItem?.fromAsset!=='function')return;
    for(const variant of wearableVariants){
      if(variant.group!==group.Name)continue;
      if(api.DialogInventory.some(item=>wearableVariant(item)===variant))continue;
      const asset=api.AssetGet(character.AssetFamily,variant.group,variant.asset);
      if(!asset||!asset.Enable||!asset.Wear||!asset.DynamicAllowInventoryAdd(character)||!api.InventoryAvailable(api.Player,variant.asset,variant.group))continue;
      const craft=makeWearableCraft(variant,api.Player);
      if(!api.DialogCanUseCraftedItem(character,craft,asset))continue;
      // Native validation and normal dialog usability/permission checks remain in charge.
      const validation=api.CraftingValidate(craft,asset,false,true,false);
      if(validation===0||craft.Disabled)continue;
      api.DialogInventoryAdd(character,api.AppearanceItem.fromAsset(asset),false,undefined,craft);
    }
  }


  const core = { wearableVariants, wearableVariant, makeWearableCraft, addWearableChoices, isReverieHeadset, synthesizeTrack, buildAudioMix, newPulseState, pulseFrame, drawSpiralTexture, normalize, defaults, bounds, ControlGate, textFrame, textPosition, normalizePresets };
  if (typeof module !== 'undefined' && module.exports && typeof document === 'undefined') { module.exports = core; return; }
  if (window.HypnoReverie?.version === VERSION) { window.HypnoReverie.open(); return; }
  if (window.HypnoReverie?.destroy) window.HypnoReverie.destroy();
  if (document.getElementById('player-spiral-addon')) {
    alert('Reload the game once to unload the older Hypno Reverie version, then click your bookmark again.'); return;
  }
  // Artwork lives in assets/ next to this script (content-hashed names, so browsers can cache them safely).
  const ASSET_BASE=(()=>{try{const s=document.currentScript?.src;if(s&&/^https:/.test(s))return new URL('assets/',s).href;}catch{}return 'https://jaxx-01-ai.github.io/HypnoReverie/assets/';})();
  // CORS-enabled loads keep the game's canvases readable (GitHub Pages sends Access-Control-Allow-Origin: *).
  function hrImage(){const i=new Image();i.crossOrigin='anonymous';return i;}
  const HEADSET_IMAGE = ASSET_BASE+"hr-1c12f75df1b6.webp";
  const HOOD_IMAGE=ASSET_BASE+"hr-2391d83a19df.webp",HOOD_ECHO_IMAGE=ASSET_BASE+"hr-c892226d55cd.webp";
  /*
MIT License

Copyright (c) 2022 Jomshir98

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
// Bondage Club Mod Development Kit (1.2.0)
// For more info see: https://github.com/Jomshir98/bondage-club-mod-sdk
/** @type {ModSDKGlobalAPI} */
var bcModSdk=function(){"use strict";const o="1.2.0";function e(o){alert("Mod ERROR:\n"+o);const e=new Error(o);throw console.error(e),e}const t=new TextEncoder;function n(o){return!!o&&"object"==typeof o&&!Array.isArray(o)}function r(o){const e=new Set;return o.filter((o=>!e.has(o)&&e.add(o)))}const i=new Map,a=new Set;function c(o){a.has(o)||(a.add(o),console.warn(o))}function s(o){const e=[],t=new Map,n=new Set;for(const r of f.values()){const i=r.patching.get(o.name);if(i){e.push(...i.hooks);for(const[e,a]of i.patches.entries())t.has(e)&&t.get(e)!==a&&c(`ModSDK: Mod '${r.name}' is patching function ${o.name} with same pattern that is already applied by different mod, but with different pattern:\nPattern:\n${e}\nPatch1:\n${t.get(e)||""}\nPatch2:\n${a}`),t.set(e,a),n.add(r.name)}}e.sort(((o,e)=>e.priority-o.priority));const r=function(o,e){if(0===e.size)return o;let t=o.toString().replaceAll("\r\n","\n");for(const[n,r]of e.entries())t.includes(n)||c(`ModSDK: Patching ${o.name}: Patch ${n} not applied`),t=t.replaceAll(n,r);return(0,eval)(`(${t})`)}(o.original,t);let i=function(e){var t,i;const a=null===(i=(t=m.errorReporterHooks).hookChainExit)||void 0===i?void 0:i.call(t,o.name,n),c=r.apply(this,e);return null==a||a(),c};for(let t=e.length-1;t>=0;t--){const n=e[t],r=i;i=function(e){var t,i;const a=null===(i=(t=m.errorReporterHooks).hookEnter)||void 0===i?void 0:i.call(t,o.name,n.mod),c=n.hook.apply(this,[e,o=>{if(1!==arguments.length||!Array.isArray(e))throw new Error(`Mod ${n.mod} failed to call next hook: Expected args to be array, got ${typeof o}`);return r.call(this,o)}]);return null==a||a(),c}}return{hooks:e,patches:t,patchesSources:n,enter:i,final:r}}function l(o,e=!1){let r=i.get(o);if(r)e&&(r.precomputed=s(r));else{let e=window;const a=o.split(".");for(let t=0;t<a.length-1;t++)if(e=e[a[t]],!n(e))throw new Error(`ModSDK: Function ${o} to be patched not found; ${a.slice(0,t+1).join(".")} is not object`);const c=e[a[a.length-1]];if("function"!=typeof c)throw new Error(`ModSDK: Function ${o} to be patched not found`);const l=function(o){let e=-1;for(const n of t.encode(o)){let o=255&(e^n);for(let e=0;e<8;e++)o=1&o?-306674912^o>>>1:o>>>1;e=e>>>8^o}return((-1^e)>>>0).toString(16).padStart(8,"0").toUpperCase()}(c.toString().replaceAll("\r\n","\n")),d={name:o,original:c,originalHash:l};r=Object.assign(Object.assign({},d),{precomputed:s(d),router:()=>{},context:e,contextProperty:a[a.length-1]}),r.router=function(o){return function(...e){return o.precomputed.enter.apply(this,[e])}}(r),i.set(o,r),e[r.contextProperty]=r.router}return r}function d(){for(const o of i.values())o.precomputed=s(o)}function p(){const o=new Map;for(const[e,t]of i)o.set(e,{name:e,original:t.original,originalHash:t.originalHash,sdkEntrypoint:t.router,currentEntrypoint:t.context[t.contextProperty],hookedByMods:r(t.precomputed.hooks.map((o=>o.mod))),patchedByMods:Array.from(t.precomputed.patchesSources)});return o}const f=new Map;function u(o){f.get(o.name)!==o&&e(`Failed to unload mod '${o.name}': Not registered`),f.delete(o.name),o.loaded=!1,d()}function g(o,t){o&&"object"==typeof o||e("Failed to register mod: Expected info object, got "+typeof o),"string"==typeof o.name&&o.name||e("Failed to register mod: Expected name to be non-empty string, got "+typeof o.name);let r=`'${o.name}'`;"string"==typeof o.fullName&&o.fullName||e(`Failed to register mod ${r}: Expected fullName to be non-empty string, got ${typeof o.fullName}`),r=`'${o.fullName} (${o.name})'`,"string"!=typeof o.version&&e(`Failed to register mod ${r}: Expected version to be string, got ${typeof o.version}`),o.repository||(o.repository=void 0),void 0!==o.repository&&"string"!=typeof o.repository&&e(`Failed to register mod ${r}: Expected repository to be undefined or string, got ${typeof o.version}`),null==t&&(t={}),t&&"object"==typeof t||e(`Failed to register mod ${r}: Expected options to be undefined or object, got ${typeof t}`);const i=!0===t.allowReplace,a=f.get(o.name);a&&(a.allowReplace&&i||e(`Refusing to load mod ${r}: it is already loaded and doesn't allow being replaced.\nWas the mod loaded multiple times?`),u(a));const c=o=>{let e=g.patching.get(o.name);return e||(e={hooks:[],patches:new Map},g.patching.set(o.name,e)),e},s=(o,t)=>(...n)=>{var i,a;const c=null===(a=(i=m.errorReporterHooks).apiEndpointEnter)||void 0===a?void 0:a.call(i,o,g.name);g.loaded||e(`Mod ${r} attempted to call SDK function after being unloaded`);const s=t(...n);return null==c||c(),s},p={unload:s("unload",(()=>u(g))),hookFunction:s("hookFunction",((o,t,n)=>{"string"==typeof o&&o||e(`Mod ${r} failed to patch a function: Expected function name string, got ${typeof o}`);const i=l(o),a=c(i);"number"!=typeof t&&e(`Mod ${r} failed to hook function '${o}': Expected priority number, got ${typeof t}`),"function"!=typeof n&&e(`Mod ${r} failed to hook function '${o}': Expected hook function, got ${typeof n}`);const s={mod:g.name,priority:t,hook:n};return a.hooks.push(s),d(),()=>{const o=a.hooks.indexOf(s);o>=0&&(a.hooks.splice(o,1),d())}})),patchFunction:s("patchFunction",((o,t)=>{"string"==typeof o&&o||e(`Mod ${r} failed to patch a function: Expected function name string, got ${typeof o}`);const i=l(o),a=c(i);n(t)||e(`Mod ${r} failed to patch function '${o}': Expected patches object, got ${typeof t}`);for(const[n,i]of Object.entries(t))"string"==typeof i?a.patches.set(n,i):null===i?a.patches.delete(n):e(`Mod ${r} failed to patch function '${o}': Invalid format of patch '${n}'`);d()})),removePatches:s("removePatches",(o=>{"string"==typeof o&&o||e(`Mod ${r} failed to patch a function: Expected function name string, got ${typeof o}`);const t=l(o);c(t).patches.clear(),d()})),callOriginal:s("callOriginal",((o,t,n)=>{"string"==typeof o&&o||e(`Mod ${r} failed to call a function: Expected function name string, got ${typeof o}`);const i=l(o);return Array.isArray(t)||e(`Mod ${r} failed to call a function: Expected args array, got ${typeof t}`),i.original.apply(null!=n?n:globalThis,t)})),getOriginalHash:s("getOriginalHash",(o=>{"string"==typeof o&&o||e(`Mod ${r} failed to get hash: Expected function name string, got ${typeof o}`);return l(o).originalHash}))},g={name:o.name,fullName:o.fullName,version:o.version,repository:o.repository,allowReplace:i,api:p,loaded:!0,patching:new Map};return f.set(o.name,g),Object.freeze(p)}function h(){const o=[];for(const e of f.values())o.push({name:e.name,fullName:e.fullName,version:e.version,repository:e.repository});return o}let m;const y=void 0===window.bcModSdk?window.bcModSdk=function(){const e={version:o,apiVersion:1,registerMod:g,getModsInfo:h,getPatchingInfo:p,errorReporterHooks:Object.seal({apiEndpointEnter:null,hookEnter:null,hookChainExit:null})};return m=e,Object.freeze(e)}():(n(window.bcModSdk)||e("Failed to init Mod SDK: Name already in use"),1!==window.bcModSdk.apiVersion&&e(`Failed to init Mod SDK: Different version already loaded ('1.2.0' vs '${window.bcModSdk.version}')`),window.bcModSdk.version!==o&&alert(`Mod SDK warning: Loading different but compatible versions ('1.2.0' vs '${window.bcModSdk.version}')\nOne of mods you are using is using an old version of SDK. It will work for now but please inform author to update`),window.bcModSdk);return"undefined"!=typeof exports&&(Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=y),y}();

  const BOLERO_IMAGE=ASSET_BASE+"hr-cd51df325d6c.webp";
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
  const AREA_KEY='hypnoreverie-area-v1';let area='player';
  try{const a=localStorage.getItem(AREA_KEY);if(['player','chat','game','screen'].includes(a))area=a;}catch{}
  const PERMS_KEY='hypnoreverie-permissions-v1',ROLE_RANK={nobody:99,owner:5,lover:4,whitelist:3,friend:2,anyone:1};
  let perms={ask:'anyone'};
  const AUTH_KEY='hypnoreverie-authority-v1',AUTH_KEYS=['view','visuals','words','pulse','audio','imagery','expressions','effects','authority'];
  let authority=Object.fromEntries(AUTH_KEYS.map(k=>[k,{min:'nobody',self:true}]));
  try{const v=JSON.parse(localStorage.getItem(AUTH_KEY)||'{}');for(const k of AUTH_KEYS){if(ROLE_RANK[v[k]?.min])authority[k].min=v[k].min;if(v[k]?.self===false)authority[k].self=false;}}catch{}
  // Never leave the table unreachable: if nobody else can change it, you can.
  if(!authority.authority.self&&authority.authority.min==='nobody')authority.authority.self=true;
  const authSent=new Map(),authSeq=new Map();
  try{const v=JSON.parse(localStorage.getItem(PERMS_KEY)||'{}');if(ROLE_RANK[v.ask])perms.ask=v.ask;}catch{}
  const SESSION_KEY='hypnoreverie-resume-v1';
  let resume = {remember:false,enabled:false,member:null};
  try{const value=JSON.parse(localStorage.getItem(SESSION_KEY)||'{}');resume={remember:value.remember===true,enabled:value.enabled===true,member:Number.isSafeInteger(value.member)?value.member:null};}catch{}
  const PERMANENT_KEY='hypnoreverie-permanent-v2',OLD_PERMANENT_KEY='hypnoreverie-permanent-v1';let permanent=null;
  let remoteHeadSharing = false, selfHeadAllowed = false, ownHeadVisible = false;
  let enabled = resume.remember && resume.enabled && resume.member===window.Player?.MemberNumber, locked = false, destroyed = false, socket = null, selected = 'self';
  let networkStarted = false, activeTime = 0, lastFrame = 0, frameId = 0, rectangle = null, networkRoom = null, networkMember = null;
  let dominant = false, pulseAllowed = false, status = enabled ? 'Saved effects resumed.' : 'Ready. Effects are off.', lastHello = 0;
  const gate = new MultiGate(), peers = new Map(), receivedGrants = new Map();
  loadPermanent(window.Player?.MemberNumber);
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
    #content.settings-hidden fieldset{display:none!important}#imagery-layer{position:fixed;pointer-events:none;overflow:hidden}#imagery-layer>img,#imagery-layer>video{position:absolute;pointer-events:none}#media-url{flex:1;min-width:180px}.media-row{display:grid;grid-template-columns:70px 1fr auto;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid #3a2c4d}.media-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#cdbde0}.auth-row{display:grid;grid-template-columns:1fr auto minmax(150px,auto);gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid #3a2c4d}.auth-head{font-size:12px;color:#b7a3cc}.tabs{display:flex;flex-wrap:wrap;gap:4px;padding:14px 0 10px}.tabs button.on::after{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#7be0a0;margin-left:6px;vertical-align:middle}#preset-list{min-width:200px}.tabs button{white-space:nowrap;border-color:transparent;background:none;padding:8px 10px}.tabs button[aria-selected=true]{background:#66458d;color:white}
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
  <div id="focus-blur" hidden></div><div id="imagery-layer" aria-hidden="true" hidden></div><canvas id="effect" aria-hidden="true" hidden></canvas><canvas id="heads" aria-hidden="true" hidden></canvas>
  <div id="ui" hidden><section id="panel" role="dialog" aria-label="Hypno Reverie settings" hidden>
    <div class="header"><div class="brand" id="drag-bar" title="Drag to move the menu">${LOGO}<div><h2>Hypno Reverie</h2><small>0.9.0 · Drag here to move</small></div><button id="compact" title="Toggle compact menu; drag the bottom-right corner to resize" aria-label="Toggle compact menu">↔</button><button id="close" aria-label="Close menu">×</button></div>
      <div class="tabs" role="tablist" aria-label="Settings categories">
        <button data-tab="overview" role="tab" aria-selected="true">Overview</button><button data-tab="primary" role="tab" aria-selected="false">Primary</button><button data-tab="secondary" role="tab" aria-selected="false">Secondary</button>
        <button data-tab="text" role="tab" aria-selected="false">Words</button><button data-tab="pulse" role="tab" aria-selected="false">Pulse</button><button data-tab="audio" role="tab" aria-selected="false">Audio</button><button data-tab="focus" role="tab" aria-selected="false">Focus</button><button data-tab="expressions" role="tab" aria-selected="false">Face</button><button data-tab="head" role="tab" aria-selected="false">Head</button><button data-tab="imagery" role="tab" aria-selected="false">Imagery</button><button data-tab="sharing" role="tab" aria-selected="false">Keys</button><button data-tab="authority" role="tab" aria-selected="false">Authority</button><button data-tab="presets" role="tab" aria-selected="false">Presets</button>
      </div>
      <div class="session-bar"><label>Edit <select id="target"><option value="self">My overlay</option></select></label><label><input id="enabled" type="checkbox"> Effects on</label><label id="lock-row" hidden><input id="lock" type="checkbox"> Lock controls</label><button id="preview-toggle" aria-pressed="false">Preview draft</button><span id="session-badge" class="help">Local session</span></div>
    </div>
    <div id="content"><div id="profile-card" class="card" hidden><h3 id="profile-title"></h3><p id="profile-status"></p><div id="request-options"><label>Requested access <select id="request-level"><option value="visuals">Visuals only</option><option value="text">Visuals + words</option><option value="session">Full session + control lock</option></select></label><label>Duration <select id="request-duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="indefinite">Permanent access</option></select></label><label><input id="request-pulse" type="checkbox"> Include pulse / flash changes</label><label><input id="request-audio" type="checkbox"> Include audio control</label><label><input id="request-expressions" type="checkbox"> Include facial expressions</label></div><button id="request-keys">Request keys</button></div><div id="requests-card" class="card" hidden><h3>Key requests</h3><div id="requests-list"></div><p class="help">The controller chooses the requested permissions. Yes grants exactly those permissions; No declines.</p></div>
      <div id="hidden-note" class="notice" hidden></div><div id="remote-note" class="notice" hidden>Editing a remote draft. Send changes to apply it.</div>
      <div id="overview" role="tabpanel"><h3>Set the scene</h3><p>Build your spirals, add words and pulse effects, then save a preset. Changes to your own overlay apply immediately.</p>
        <div class="card" id="local-session-card"><h3>Session controls</h3><p id="stop-note">Stop your effects and revoke keys to your overlay.</p><button id="stop">Stop / revoke</button><label><input id="remember-session" type="checkbox"> Keep effects on across room changes and relog</label><p class="help">Remembers on/off for this account when the addon loads again. Timed keys clear when leaving the room. Permanent access preserves effects and lock until returned or revoked.</p><p class="help">While keys are handed over, this button is disabled. Escape stops your session only while controls are unlocked.</p></div>
        <div class="notice">Photosensitivity notice: flashing lights and moving patterns may trigger seizures in people with photosensitive epilepsy. Avoid these effects if they are a trigger for you. Stop if you feel unwell. <a href="https://www.epilepsy.com/what-is-epilepsy/seizure-triggers/photosensitivity" target="_blank" rel="noopener noreferrer">Learn more</a></div>
        <p class="help"><b>Effects on</b> (above) turns your whole overlay on or off. Inside it, each part has its own switch; a green dot on a tab means that part is switched on.</p><p class="help">Open this menu from Preferences &gt; Extensions, the headset icon in your player profile, your bookmark, or Alt+Shift+H. Close the menu to return to play.</p>
      </div>
      <div id="primary" role="tabpanel" hidden><h3>Primary spiral</h3><p class="help">Your main colour and motion layer.</p><div class="card"><label>Show spiral on <select id="area"><option value="player">Player area (left of the chat)</option><option value="chat">Chat area</option><option value="game">Whole game screen</option><option value="screen">Full screen</option></select></label><p class="help">Your own setting: presets and controllers never change it. Clicks still reach the game. Chat area, whole game and full screen cover the chat text, so lower the opacity if it gets hard to read.</p></div><fieldset id="primary-fields"></fieldset></div>
      <div id="secondary" role="tabpanel" hidden><h3>Secondary spiral</h3><p class="help">Blend an independent spiral over the primary.</p><fieldset id="secondary-fields"></fieldset></div>
      <div id="text" role="tabpanel" hidden><h3>Word flashes</h3><p class="help">One word or sentence per line. Random positions stay within the player area; center + periphery alternates between the middle and edges.</p><fieldset id="text-fields"></fieldset></div>
      <div id="pulse" role="tabpanel" hidden><h3>Pulse & flash</h3><p class="help">Choose a rhythm. Flashes remain limited to one every two seconds or slower.</p><fieldset id="pulse-fields"></fieldset></div>
      <div id="audio" role="tabpanel" hidden><h3>Audio layers</h3><p class="help">Headphones separate the left/right tones. Ambient music and sound loops are generated locally. Start at a comfortable volume.</p><div class="card"><button id="audio-start">Allow sound in this browser</button><button id="audio-mute">Mute audio</button><label><input id="audio-auto" type="checkbox"> Start sound automatically when the audio layer is on</label><label><input id="audio-preview" type="checkbox"> Listen to selected draft locally</label><p id="audio-status" class="help">Audio needs a local click after loading.</p><p class="help">Sound starts by itself when the audio layer and effects are on, including when a controller turns them on. If your browser holds it back, it starts on your next click or key press in the game, or press <b>Allow sound</b>. With Self off for Audio (Authority tab) you cannot mute or turn automatic start off. <b>Enable audio layer</b> below decides whether your overlay has sound at all. <b>Mute</b> silences it on this device only.</p></div><fieldset id="audio-fields"></fieldset></div>
      <div id="focus" role="tabpanel" hidden><h3>Fixation & tunnel vision</h3><p class="help">A soft opening keeps the center clear. Words draw over the fixation point. Colour changes follow the selected audio rhythm, with a gentle minimum two-second cycle.</p><fieldset id="focus-fields"></fieldset></div>
      <div id="expressions" role="tabpanel" hidden><h3>Facial expressions</h3><p class="help">Use the character’s supported game expressions, including mouth and tongue options when available. Changes use the game’s expression rules and are visible in the room.</p><label>Face group <select id="face-group"></select></label><label>Expression <select id="face-value"></select></label><button id="face-apply">Apply expression</button><p id="face-status" class="help"></p></div>
      <div id="head" role="tabpanel" hidden><h3>Head effects</h3><p class="help">Combine tiny words, a forehead spiral, spiral eyes, and a halo. Other players see these while your overlay is on; your own view starts off. During a grant, the controller must allow you to use Show my head effects. Use Preview draft to inspect the design. Position controls help align unusual poses.</p>
        <div class="card"><label id="broadcast-label"><input id="broadcast-head" type="checkbox"> Share my head effects with the room</label><p class="help">Shares your head-effect settings and the currently displayed words with other Hypno Reverie users. During a grant, head effects enabled by your controller are shared automatically. Each viewer can still hide shared effects.</p><label><input id="show-heads" type="checkbox"> Show other players’ shared head effects</label></div><label id="own-head-row"><input id="show-own-head" type="checkbox"> Show my head effects (off by default)</label><label id="allow-own-head-row" hidden><input id="allow-own-head" type="checkbox"> Allow wearer to view head effects</label><fieldset id="head-fields"></fieldset>
      </div>
      <div id="imagery" role="tabpanel" hidden><h3>Imagery and pacer</h3><p class="help">Adults only. Show your own images or videos (JOI-style) in the overlay. Add links below: they stay in this browser and only you see them. People with Imagery access (Authority tab) or full-session keys can switch imagery on, choose a category and change how it looks, but they never see or add links. The beat pacer sets a pace on screen and can follow the wet rhythm tempo.</p><div class="card" id="media-card"><h3>Your links</h3><div class="row"><input id="media-url" type="url" placeholder="https://… (.jpg .png .gif .webp .mp4 .webm)"><select id="media-cat" aria-label="Category"></select><button id="media-add">Add</button></div><div id="media-list"></div><p class="help">Up to 60 direct links to image or video files. Some sites block showing their files elsewhere; if one never appears, use another host.</p></div><fieldset id="imagery-fields"></fieldset></div><div id="sharing" role="tabpanel" hidden><h3>Hand over the keys</h3><p class="help">Both players need Hypno Reverie 0.6 or newer. Dominant/controller status is self-declared; choose by name and member number.</p>
        <div class="card"><label><input id="dominant" type="checkbox"> Available as a dominant/controller</label><button id="discover">Find players</button></div><div class="card" id="perms-card"><p class="help">Keys are a quick, temporary way to hand someone control, with no formal relationship. Several people can hold keys at once; each can only change what their own keys allow, and the latest change wins. Standing access for your owner, lovers and others is set in the <b>Authority</b> tab instead.</p><label>Who can request keys <select id="perm-ask"></select></label></div>
        <div class="card"><label>Give keys to <select id="peer"><option value="">No controllers discovered</option></select></label><label>Permission <select id="level"><option value="visuals">Visuals only</option><option value="text">Visuals + words</option><option value="session">Full session + control lock</option></select></label>
          <label><input id="allow-pulse" type="checkbox"> Also allow pulse/flash changes</label><label><input id="allow-audio" type="checkbox"> Also allow audio control</label><label><input id="allow-expressions" type="checkbox"> Also allow facial expressions</label><label>Duration <select id="duration"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="custom">Custom</option><option value="indefinite">No time limit</option></select></label><label id="minutes-row" hidden>Minutes <input id="minutes" type="number" min="1" max="30" value="15"></label>
          <p class="help">A grant shares your current settings and message list, and allows controller-enabled head effects to be visible to the room. Permanent access remembers this controller, permissions, effects and lock across room changes and relog. Returning or revoking keys ends it. Timed grants remain room-scoped. Control messages require both players in the same room.</p>
          <div class="row"><button id="grant">Give keys</button><button id="revoke">Revoke keys</button></div><p id="grant-info"></p>
        </div>
      </div>
      <div id="authority" role="tabpanel" hidden><h3>Authority</h3><p class="help">Standing access by role, like BCX. People at or above the lowest role can use that part of your overlay at any time: no keys and no requests. They open your profile, or pick you under Edit, and change it directly. <b>Self</b> is whether you can use that part yourself; untick it to lock yourself out. Roles come from your game lists (owner, lovers, whitelist, friends). Ghosted and blacklisted players never have access. Both players need Hypno Reverie 0.9.0.</p><p id="auth-note" class="notice" hidden></p><div id="auth-rows"></div><p class="help">Someone with <b>Change these permissions</b> can edit this table from their side, but only parts they hold themselves, and never in a way that removes their own access.</p></div><div id="presets" role="tabpanel" hidden><h3>Saved presets</h3><p class="help">Save the complete appearance, words, pulse and head settings. Presets never save access grants, locks, visibility-sharing choices, or turn effects on.</p>
        <div class="card"><label>Preset <select id="preset-list"><option value="">Choose a preset</option></select></label><div class="row"><button id="preset-load">Load preset</button><button id="preset-delete">Delete selected</button></div></div>
        <div class="card"><label>Name <input id="preset-name" type="text" maxlength="40" placeholder="e.g. Slow violet"></label><button id="preset-save">Save current settings</button><p class="help">Using the same name replaces that preset. Up to 24 presets, saved in this browser.</p></div>
      </div>
    </div>
    <div id="footer"><div class="footer-row"><p id="status" role="status"></p><div id="remote-actions" hidden><button id="apply">Send changes</button><button id="release">Return keys</button></div></div><div class="help">Escape: stop when unlocked · Alt+Shift+H: menu · Alt+Shift+S: toggle when unlocked</div></div>
  </section></div><section id="preview-window" hidden aria-label="Local draft preview"><div id="preview-bar"><strong>Draft preview</strong><button id="preview-close" aria-label="Close preview">×</button></div><p id="preview-label" class="help"></p><canvas id="preview-canvas" width="500" height="500"></canvas><p class="help">Local preview · Send changes to update their screen. Head position uses a sample figure.</p></section>`;
  const byId = id => root.getElementById(id), canvas = byId('effect'), ctx = canvas.getContext('2d');
  const heads = byId('heads'), hx = heads.getContext('2d'); let headRectangle = null;
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
    label.append(input); if (type === 'textarea') label.classList.add('wide'); byId(parent).append(label);
    const record = { input, path, type, output }; fields.push(record);
    input.addEventListener('input', () => {
      if (selected === 'self' && (locked || !selfCan(partOf(path)))) return;
      const value = type === 'checkbox' ? input.checked : ['range', 'number'].includes(type) ? Number(input.value) : type === 'textarea' ? input.value.split('\n') : input.value;
      const next = clone(editState()); setPath(next, path, value);
      if (selected === 'self') { settings = normalize(next); save(); resetEffectClock(); }
      else { const grant = receivedGrants.get(Number(selected)); if (grant) { grant.draft = normalize(next); grant.dirty = true; } }
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
    slider(parent, path('spin'), 'Spin speed', 0, 12, 0.05);
    field(parent, path('reverse'), 'Reverse spin', 'checkbox');
    slider(parent, path('throbSpeed'), 'Throb speed', 0, 5, 0.05);
    slider(parent, path('throbStrength'), 'Throb strength', 0, 0.6);
    slider(parent, path('zoom'), 'Zoom', 0.25, 6, 0.05);
    slider(parent, path('thickness'), 'Thickness', 0.01, 0.99);
    slider(parent, path('blur'), 'Blur factor (px)', 0, 50, 0.5);
    slider(parent, path('curve'), 'Spiral curve', 0, 12, 0.1);
  }
  slider('primary-fields', ['width'], 'Player area width (%)', 10, 50, 1);
  field('text-fields', ['text', 'enabled'], 'Enable subliminal / cycling text', 'checkbox');
  field('text-fields', ['text', 'messages'], 'Edit messages — one word or sentence per line (40 max, 160 characters each)', 'textarea');
  byId('setting-text-messages').placeholder='e.g.\nRelax\nSink deeper\nGood';
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
  field('audio-fields',['audio','binaural'],'Binaural beats (headphones)','checkbox');
  field('audio-fields',['audio','binauralPreset'],'Beat','select',null,null,null,[['custom','Custom (frequencies below)'],['delta','2.5 Hz delta · deep sleep'],['theta','6 Hz theta · trance'],['schumann','7.83 Hz · grounding'],['alpha','10 Hz alpha · calm'],['beta','15 Hz beta · alert'],['gamma','40 Hz gamma · intense focus']]);
  field('audio-fields',['audio','leftHz'],'Left frequency (Hz)','number',40,1000,0.1);
  field('audio-fields',['audio','rightHz'],'Right frequency (Hz)','number',40,1000,0.1);
  slider('audio-fields',['audio','toneLevel'],'Tone level',0,0.5);
  field('audio-fields',['audio','iso'],'Isochronic pulse track','checkbox');
  field('audio-fields',['audio','isoHz'],'Pulse tone (Hz)','number',40,1000,0.1);
  field('audio-fields',['audio','isoRate'],'Pulses per second','number',0.1,30,0.1);
  slider('audio-fields',['audio','isoDuty'],'Pulse on-time fraction',0.1,0.9);
  slider('audio-fields',['audio','isoLevel'],'Pulse track level',0,0.5);
  field('audio-fields',['audio','music'],'Background sound','select',null,null,null,[['none','None'],['velvet','Velvet chords'],['drift','Slow drifting bells'],['rain','Rain & warm pads'],['pink','Pink noise'],['brown','Brown noise (deep)'],['ocean','Ocean waves'],['drone','Warm drone'],['bowls','Singing bowls']]);
  slider('audio-fields',['audio','musicLevel'],'Music level',0,0.5);
  field('audio-fields',['audio','heartbeat'],'Heartbeat','checkbox');
  field('audio-fields',['audio','bpm'],'Heartbeat speed (BPM)','number',30,180,1);
  slider('audio-fields',['audio','heartLevel'],'Heartbeat level',0,0.5);
  field('audio-fields',['audio','breathing'],'Breathing sound','checkbox');
  field('audio-fields',['audio','breathStyle'],'Breathing style','select',null,null,null,[['mouth','Through the mouth'],['nose','Through the nose'],['sigh','Sighing (soft voice)']]);
  field('audio-fields',['audio','inhale'],'Inhale (seconds)','number',1,12,0.1);
  field('audio-fields',['audio','exhale'],'Exhale (seconds)','number',1,16,0.1);
  field('audio-fields',['audio','pause'],'Breath pause (seconds)','number',0,8,0.1);
  slider('audio-fields',['audio','breathLevel'],'Breathing level',0,0.5);
  field('audio-fields',['audio','vocal'],'Vocal sounds (adult)','select',null,null,null,[['none','Off'],['random','Mix: all'],['ungagged','Mix: ungagged'],['gagged','Mix: gagged'],['sighs','Sighs'],['soft','Soft moans'],['needy','Needy, pleading moans'],['building','Building moans'],['orgasm','Orgasm'],['edge','Edged (brought close, denied)'],['afterglow','Afterglow'],['whimpers','Whimpers'],['panting','Panting'],['muffled','Muffled moans (gagged)'],['gagplead','Gagged pleading'],['gagorgasm','Gagged orgasm']]);
  slider('audio-fields',['audio','vocalLevel'],'Vocal level',0,0.6);
  field('audio-fields',['audio','vocalGap'],'Pause between clips (seconds)','number',0,30,0.5);
  field('audio-fields',['audio','cue'],'Clicker / bell','select',null,null,null,[['none','Off'],['clicker','Training clicker'],['double','Double click'],['tick','Wood tick'],['bell','Small bell'],['chime','Three-note chime'],['tingsha','Tingsha cymbals'],['deep','Deep bell'],['gong','Gong']]);
  field('audio-fields',['audio','cueMode'],'Ring','select',null,null,null,[['interval','Every few seconds'],['words','On every word flash'],['trigger','On certain words']]);
  field('audio-fields',['audio','cueWords'],'Trigger words (one per line)','textarea');
  field('audio-fields',['audio','cueEvery'],'Every (seconds)','number',0.5,60,0.5);
  slider('audio-fields',['audio','cueLevel'],'Clicker / bell level',0,0.6);
  field('audio-fields',['audio','slick'],'Wet rhythm (adult)','select',null,null,null,[['none','Off'],['steady','Steady'],['build','Building (speeds up over a minute)']]);
  field('audio-fields',['audio','slickBpm'],'Tempo (beats per minute)','number',40,200,1);
  slider('audio-fields',['audio','slickWet'],'Wetness',0,1);
  slider('audio-fields',['audio','slickLevel'],'Wet rhythm level',0,0.6);
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
  field('imagery-fields',['imagery','enabled'],'Show imagery','checkbox');
  field('imagery-fields',['imagery','builtin'],'Use the built-in video pack','checkbox');
  field('imagery-fields',['imagery','category'],'Category','select',null,null,null,MEDIA_CATS.map(c=>[c,MEDIA_LABELS[c]]));
  field('imagery-fields',['imagery','timing'],'Timing','select',null,null,null,[['cycle','Cycle on a timer'],['words','Flash with each word'],['steady','Stay on screen']]);
  field('imagery-fields',['imagery','order'],'Order','select',null,null,null,[['random','Random'],['inorder','In order']]);
  field('imagery-fields',['imagery','duration'],'Show each for (seconds)','number',0.5,60,0.5);
  field('imagery-fields',['imagery','gap'],'Gap between (seconds)','number',0,60,0.5);
  field('imagery-fields',['imagery','fade'],'Fade (seconds)','number',0,5,0.1);
  slider('imagery-fields',['imagery','opacity'],'Opacity',0,1);
  slider('imagery-fields',['imagery','size'],'Size',0.1,1);
  field('imagery-fields',['imagery','position'],'Position','select',null,null,null,[['center','Centred'],['random','Random spot'],['fill','Fill the area']]);
  field('imagery-fields',['imagery','blend'],'Blend','select',null,null,null,[['normal','Normal'],['screen','Screen (glow)'],['overlay','Overlay'],['soft-light','Soft light'],['multiply','Multiply']]);
  field('imagery-fields',['imagery','layer'],'Layer','select',null,null,null,[['under','Under the spiral'],['over','Over the spiral']]);
  field('imagery-fields',['imagery','pacer'],'Beat pacer','select',null,null,null,[['off','Off'],['ring','Pulsing ring'],['bar','Bouncing bar']]);
  field('imagery-fields',['imagery','pacerFollow'],'Follow the wet rhythm tempo','checkbox');
  field('imagery-fields',['imagery','pacerBpm'],'Pacer tempo (beats per minute)','number',20,220,1);
  field('imagery-fields',['imagery','pacerColor'],'Pacer colour','color');
  slider('imagery-fields',['imagery','pacerSize'],'Pacer size',0.05,0.6);
  let media=[];try{const v=JSON.parse(localStorage.getItem(MEDIA_KEY)||'[]');if(Array.isArray(v))media=v.filter(m=>m&&typeof m.url==='string'&&/^https:\/\/\S+$/i.test(m.url)&&m.url.length<=2000).slice(0,60).map(m=>({url:m.url,cat:MEDIA_CATS.includes(m.cat)&&m.cat!=='any'?m.cat:'other'}));}catch{}
  for(const c of MEDIA_CATS.slice(1)){const o=document.createElement('option');o.value=c;o.textContent=MEDIA_LABELS[c];byId('media-cat').append(o);}
  function renderMedia(){const box=byId('media-list');box.replaceChildren();media.forEach((m,i)=>{const row=document.createElement('div');row.className='media-row';const tag=document.createElement('b');tag.textContent=MEDIA_LABELS[m.cat];
    const u=document.createElement('span');u.textContent=m.url;u.title=m.url;const del=document.createElement('button');del.textContent='Remove';del.onclick=()=>{if(!selfCan('imagery'))return;media.splice(i,1);saveMedia();};row.append(tag,u,del);box.append(row);});
    if(!media.length){const p=document.createElement('p');p.className='help';p.textContent='No links yet.';box.append(p);}}
  function saveMedia(){try{localStorage.setItem(MEDIA_KEY,JSON.stringify(media));}catch{say('Links could not be saved.');}renderMedia();imageryState.key='';refreshFields();}
  byId('media-add').onclick=()=>{if(!selfCan('imagery'))return;const url=byId('media-url').value.trim();if(!/^https:\/\/\S+$/i.test(url)||url.length>2000){say('Enter a full https:// link to an image or video file.');return;}
    if(media.length>=60){say('Remove a link first (60 maximum).');return;}media.push({url,cat:byId('media-cat').value});byId('media-url').value='';saveMedia();say('Link added.');};
  renderMedia();
  function syncLock(){locked=gate.list().some(g=>g.locked===true);}
  function savePermanent(){
    const owner=player()?.MemberNumber??permanent?.owner;if(!Number.isSafeInteger(owner))return;
    const list=gate.list().filter(g=>g.expires===null);if(!list.length){forgetPermanent();return;}
    permanent={owner,enabled,headSharing:remoteHeadSharing};
    try{localStorage.setItem(PERMANENT_KEY,JSON.stringify({...permanent,grants:list.map(g=>({sender:g.sender,level:g.level,allowPulse:g.allowPulse,allowAudio:g.allowAudio,allowExpressions:g.allowExpressions,locked:g.locked===true,auto:g.auto===true}))}));localStorage.removeItem(OLD_PERMANENT_KEY);}
    catch{say('Permanent access could not be saved in this browser.');}
  }
  // Only erase saved keys that were actually loaded for this account; before login nothing is loaded yet.
  function forgetPermanent(){const had=permanent!==null;permanent=null;if(had)try{localStorage.removeItem(PERMANENT_KEY);localStorage.removeItem(OLD_PERMANENT_KEY);}catch{}}
  function readPermanent(){
    try{let v=JSON.parse(localStorage.getItem(PERMANENT_KEY)||'null');
      if(!v){const o=JSON.parse(localStorage.getItem(OLD_PERMANENT_KEY)||'null');if(o&&Number.isSafeInteger(o.sender))v={owner:o.owner,enabled:o.enabled===true,headSharing:o.headSharing===true,grants:[o]};}
      return v&&typeof v==='object'&&Array.isArray(v.grants)?v:null;}catch{return null;}
  }
  function loadPermanent(m){
    if(!Number.isSafeInteger(m))return false;const v=readPermanent();if(!v||v.owner!==m)return false;
    const list=v.grants.filter(g=>g&&Number.isSafeInteger(g.sender)&&['visuals','text','session'].includes(g.level)&&!blockedMember(g.sender)).slice(0,16);
    if(!list.length){try{localStorage.removeItem(PERMANENT_KEY);localStorage.removeItem(OLD_PERMANENT_KEY);}catch{}return false;}
    permanent={owner:m,enabled:v.enabled===true,headSharing:v.headSharing===true};
    for(const g of list){gate.issue(g.sender,g.level,crypto.randomUUID(),Date.now(),null,g.allowPulse===true,g.allowAudio===true,g.allowExpressions===true);const h=gate.get(g.sender);h.auto=g.auto===true;h.locked=g.locked===true&&g.level==='session';}
    enabled=permanent.enabled;remoteHeadSharing=permanent.headSharing;syncLock();return true;
  }
  let permanentChecked=null;
  function restorePermanent(){
    const m=player()?.MemberNumber;if(!Number.isSafeInteger(m)||permanentChecked===m)return;permanentChecked=m;
    if(gate.size)return;
    if(loadPermanent(m)){resetEffectClock();say('Permanent access restored'+(locked?' · normal controls locked':'')+'.');refreshFields();layout();return;}
    if(resume.remember&&resume.enabled&&resume.member===m&&!enabled){enabled=true;resetEffectClock();refreshFields();layout();}
  }
  // New tokens for permanent holders (room change, controller reload); they are re-announced on the next hello.
  function rotateOne(sender){const g=gate.get(sender);if(!g||g.expires!==null)return;const auto=g.auto,l=g.locked;gate.issue(sender,g.level,crypto.randomUUID(),Date.now(),null,g.allowPulse,g.allowAudio,g.allowExpressions);const h=gate.get(sender);h.auto=auto;h.locked=l;h.announced='';}
  function rotatePermanent(){for(const g of gate.list())if(g.expires===null)rotateOne(g.sender);}
  function sendPermanent(member){const g=gate.get(member);if(!g||g.expires!==null||g.announced===g.token)return;
    if(send('grant',{token:g.token,level:g.level,expires:null,permanent:true,allowPulse:g.allowPulse,allowAudio:g.allowAudio,allowExpressions:g.allowExpressions,faceOptions:faceOptions(player()),settings,enabled,locked:g.locked===true},member))g.announced=g.token;}
  function saveSession() {
    if(permanent)savePermanent();
    const member=player()?.MemberNumber;if(!Number.isSafeInteger(member))return; // not logged in yet: keep the saved state
    resume.enabled=enabled;resume.member=member;
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(resume));}catch{say('Could not save session preference.');}
  }
  byId('remember-session').onchange=()=>{resume.remember=byId('remember-session').checked;saveSession();};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { say('Appearance could not be saved.'); } }
  function say(message) { status = message; byId('status').textContent = message; }
  function refreshFields(skip) {
    const current = editState(), remote = receivedGrants.get(Number(selected));
    for (const record of fields) {
      const value = getPath(current, record.path);
      if (record.input !== skip && root.activeElement !== record.input) {
        if (record.type === 'checkbox') record.input.checked = value;
        else record.input.value = record.type === 'textarea' ? value.join('\n') : value;
      }
      if (record.output) record.output.value = Number(value).toFixed(record.input.step === '1' ? 0 : 2);
      record.input.disabled = record.path[0] === 'width' && (selected !== 'self' || area !== 'player');
    }
    const noAccess = selected !== 'self' && !remote;
    const localLocked = (selected === 'self' && locked) || noAccess;
    byId('primary-fields').disabled = byId('secondary-fields').disabled = localLocked;
    byId('text-fields').disabled = localLocked || (selected !== 'self' && remote?.level === 'visuals');
    byId('pulse-fields').disabled = localLocked || (selected !== 'self' && !remote?.allowPulse);
    {const s=current,on={primary:s.spirals?.[0]?.enabled,secondary:s.spirals?.[1]?.enabled,text:s.text?.enabled,pulse:s.pulse?.enabled,audio:s.audio?.enabled,focus:s.focus?.enabled};
     for(const [t,v] of Object.entries(on)){const b=root.querySelector('[data-tab='+t+']');if(b){b.classList.toggle('on',!!v);b.title=v?'This part is switched on':'';}}}
    if(root.activeElement!==byId('perm-ask'))byId('perm-ask').value=perms.ask;byId('perm-ask').disabled=!selfCan('authority');
    byId('enabled').checked = selected === 'self' ? enabled : !!remote?.enabled;
    byId('enabled').disabled = localLocked || (selected !== 'self' && remote?.level !== 'session');
    byId('lock-row').hidden = selected === 'self' || remote?.level !== 'session';
    byId('lock').checked = !!remote?.locked;
    byId('remote-actions').hidden = selected === 'self' || noAccess; byId('remote-note').hidden = selected === 'self' || noAccess;
    byId('preview-toggle').disabled = noAccess;
    byId('head-fields').disabled = byId('focus-fields').disabled = localLocked; byId('audio-fields').disabled=localLocked || (selected!=='self'&&!remote?.allowAudio);
    if(selected!=='self'&&!remote?.allowPulse)for(const key of ['colorPulse','colorA','colorB','colorOpacity','beatSource','beats'])byId('setting-focus-'+key).disabled=true;
    refreshFace();
    for (const record of fields) if (selected !== 'self' && remote?.level === 'visuals' && record.path[0] === 'head' && ['words','wordMode'].includes(record.path[1])) record.input.disabled = true;
    byId('stop').disabled = byId('revoke').disabled = gate.size>0; byId('grant').disabled = locked || gate.has(Number(byId('peer').value));
    for (const id of ['peer','level','allow-pulse','allow-audio','allow-expressions','duration','minutes']) byId(id).disabled = locked;
    byId('preset-load').disabled = localLocked; byId('preset-save').disabled = noAccess;
    byId('broadcast-head').checked = privacy.broadcast;
    byId('own-head-row').hidden=selected!=='self';byId('show-own-head').checked=ownHeadVisible;byId('show-own-head').disabled=gate.size>0&&!selfHeadAllowed;
    byId('allow-own-head-row').hidden=selected==='self'||!remote;byId('allow-own-head').checked=!!remote?.allowSelfHead;
    byId('show-heads').checked = privacy.showOthers && !hideSharedUntilEnabled;
    byId('local-session-card').hidden = selected !== 'self'; byId('broadcast-label').hidden = selected !== 'self';
    byId('session-badge').textContent = selected !== 'self' ? 'Remote draft' : gate.size ? (locked ? 'Controls locked' : gate.size>1 ? gate.size+' controllers' : 'Keys handed over') : 'Local session';
    byId('remember-session').checked=resume.remember;
    {const self=selected==='self',ra=remote?.authority?remote:null,hide=self?!selfCan('view'):!!ra&&!ra.canSee;
     byId('content').classList.toggle('settings-hidden',hide);byId('hidden-note').hidden=!hide;
     byId('hidden-note').textContent=self?'Your settings are hidden: Self is off for “See settings” in the Authority tab.':'Your role does not let you see this player’s settings.';
     if(hide)for(const b of root.querySelectorAll('.tabs button.on'))b.classList.remove('on');
     if(self){for(const r of fields)if(!selfCan(partOf(r.path)))r.input.disabled=true;
       if(!selfCan('effects')){byId('enabled').disabled=true;byId('stop').disabled=true;}
       if(['visuals','words','pulse','audio','imagery'].some(k=>!selfCan(k)))byId('preset-load').disabled=true;
       if(hide){byId('preset-save').disabled=true;byId('preview-toggle').disabled=true;}}
     if(ra){for(const r of fields)r.input.disabled=r.path[0]==='width'||!ra.access[partOf(r.path)];
       byId('enabled').disabled=!ra.access.effects;byId('lock-row').hidden=true;byId('allow-own-head-row').hidden=true;byId('session-badge').textContent='Authority';if(hide)byId('preview-toggle').disabled=true;}
     byId('release').hidden=!!ra;renderAuthority();}
    byId('audio-mute').disabled=byId('audio-auto').disabled=!selfCan('audio');if(!selfCan('audio'))byId('audio-auto').checked=true;
    byId('media-card').hidden=selected!=='self';byId('media-add').disabled=!selfCan('imagery');for(const b of byId('media-list').querySelectorAll('button'))b.disabled=!selfCan('imagery');
    byId('imagery-fields').disabled=localLocked||(selected!=='self'&&!remote?.authority&&remote?.level!=='session');
    {const im=editState().imagery;if(!byId('content').classList.contains('settings-hidden'))root.querySelector('[data-tab=imagery]')?.classList.toggle('on',!!(im?.enabled||im?.pacer!=='off'));}
    if(editState().audio.binauralPreset!=='custom')for(const k of ['leftHz','rightHz'])byId('setting-audio-'+k).disabled=true;
    if(editState().audio.cueMode!=='interval')byId('setting-audio-cueEvery').disabled=true;
    if(editState().audio.cueMode!=='trigger')byId('setting-audio-cueWords').disabled=true;
    byId('status').textContent = status; refreshProfileCard();
  }
  for (const button of root.querySelectorAll('[data-tab]')) button.onclick = () => {
    byId('content').scrollTop = 0;
    for (const tab of root.querySelectorAll('[data-tab]')) {
      const active = tab === button; tab.setAttribute('aria-selected', String(active)); byId(tab.dataset.tab).hidden = !active;
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
  draggable(byId('panel'),byId('drag-bar'));draggable(byId('preview-window'),byId('preview-bar'));
  const windowObserver = new ResizeObserver(()=>{clampWindow(byId('panel'));clampWindow(byId('preview-window'));});windowObserver.observe(byId('panel'));
  byId('compact').onclick=()=>{const panel=byId('panel'),small=panel.getBoundingClientRect().width>520;panel.style.width=small?'390px':'760px';panel.style.height=small?'500px':'680px';clampWindow(panel);};
  function showPreview(on) { byId('preview-window').hidden=!on;byId('preview-toggle').setAttribute('aria-pressed',String(on));clampWindow(byId('preview-window')); }
  byId('preview-toggle').onclick=()=>showPreview(byId('preview-window').hidden);byId('preview-close').onclick=()=>showPreview(false);
  function open() { byId('ui').hidden = byId('panel').hidden = false; if(!windowReady){const p=byId('panel');p.style.width=Math.min(760,innerWidth-32)+'px';p.style.height=Math.min(680,innerHeight-32)+'px';p.style.left=Math.max(8,(innerWidth-760)/2)+'px';p.style.top='24px';windowReady=true;}clampWindow(byId('panel'));refreshFields(); }
  byId('close').onclick = () => { closeMenu(); leavePreferences(); };
  function privacySave() { try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(privacy)); } catch {} }
  byId('show-own-head').onchange=()=>{if(!gate.size||selfHeadAllowed)ownHeadVisible=byId('show-own-head').checked;refreshFields();};
  byId('allow-own-head').onchange=()=>{const g=receivedGrants.get(Number(selected));if(g)g.allowSelfHead=byId('allow-own-head').checked;};
  byId('broadcast-head').onchange = () => { privacy.broadcast = byId('broadcast-head').checked; privacySave(); publishHead(true); };
  byId('show-heads').onchange = () => { privacy.showOthers = byId('show-heads').checked; hideSharedUntilEnabled = false; privacySave(); layout(); };
  byId('area').value=area;byId('area').onchange=()=>{area=byId('area').value;try{localStorage.setItem(AREA_KEY,area);}catch{}refreshFields();layout();};
  const ROLE_CHOICES=[['nobody','Nobody'],['owner','Owner'],['lover','Lovers and above'],['whitelist','Whitelist and above'],['friend','Friends and above'],['anyone','Anyone']];
  function roleSelect(el,value,first){el.replaceChildren();for(const [v,t] of ROLE_CHOICES){const o=document.createElement('option');o.value=v;o.textContent=v==='nobody'?first:t;el.append(o);}el.value=value;}
  roleSelect(byId('perm-ask'),perms.ask,'Nobody (requests off)');
  byId('perm-ask').onchange=()=>{if(selfCan('authority')){perms.ask=byId('perm-ask').value;savePerms();}refreshFields();};
  function renderAuthority(){const box=byId('auth-rows'),remote=receivedGrants.get(Number(selected)),ra=remote?.authority?remote:null;let table,editable,note='';
    if(selected==='self'){table=authority;editable=()=>selfCan('authority');if(!selfCan('authority'))note='You can’t change these: Self is off for “Change these permissions”.';}
    else if(ra?.access.authority){table=ra.draftTable;editable=k=>ra.access[k];note='Editing '+label(Number(selected))+'’s authority. Send changes to apply. Changes that would remove your own access are ignored.';}
    else{box.replaceChildren();byId('auth-note').hidden=false;byId('auth-note').textContent='You can’t see this player’s authority settings.';return;}
    byId('auth-note').hidden=!note;byId('auth-note').textContent=note;
    const key=JSON.stringify([selected,table,AUTH_KEYS.map(k=>editable(k))]);if(box.dataset.key===key||box.contains(root.activeElement))return;box.dataset.key=key;box.replaceChildren();
    const head=document.createElement('div');head.className='auth-row auth-head';for(const t of ['Part','Self','Lowest role with access']){const c=document.createElement('span');c.textContent=t;head.append(c);}box.append(head);
    for(const k of AUTH_KEYS){const row=document.createElement('div');row.className='auth-row';const name=document.createElement('span');name.textContent=AUTH_LABELS[k];
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=table[k].self;cb.disabled=!editable(k);cb.setAttribute('aria-label','Self: '+AUTH_LABELS[k]);
      const sel=document.createElement('select');roleSelect(sel,table[k].min,'Nobody');sel.disabled=!editable(k);sel.setAttribute('aria-label','Lowest role: '+AUTH_LABELS[k]);
      cb.onchange=()=>setAuth(k,'self',cb.checked);sel.onchange=()=>setAuth(k,'min',sel.value);row.append(name,cb,sel);box.append(row);}}
  function setAuth(k,field,value){const remote=receivedGrants.get(Number(selected));byId('auth-rows').dataset.key='';
    if(selected!=='self'){if(remote?.authority&&remote.access.authority&&remote.access[k]){remote.draftTable[k][field]=value;remote.dirty=true;}refreshFields();return;}
    if(!selfCan('authority')){refreshFields();return;}
    const next={...authority[k],[field]:value};
    if(k==='authority'&&!next.self&&next.min==='nobody'){say('Give someone access to “Change these permissions” first, or you could never undo this.');refreshFields();return;}
    if(k==='authority'&&field==='self'&&value===false&&!confirm('Lock yourself out of changing these permissions? Only people with authority will be able to change them back.')){refreshFields();return;}
    authority[k]=next;saveAuthority();refreshFields();layout();}
  byId('duration').onchange = () => { byId('minutes-row').hidden = byId('duration').value !== 'custom'; };
  function refreshPresets() {
    const value = byId('preset-list').value; byId('preset-list').replaceChildren();
    for (const [i,p] of presets.entries()) { const o = document.createElement('option'); o.value = i; o.textContent = p.name; byId('preset-list').append(o); }
    if (!presets.length) { const o = document.createElement('option'); o.value = ''; o.textContent = 'No presets saved yet'; o.disabled = true; o.selected = true; byId('preset-list').append(o); }
    if (presets[Number(value)]) byId('preset-list').value = value;
  }
  function savePresets() { try { localStorage.setItem(PRESET_KEY,JSON.stringify(presets)); } catch { say('Preset storage is unavailable.'); } refreshPresets(); }
  byId('preset-save').onclick = () => {
    root.activeElement?.blur(); const name = byId('preset-name').value.trim().slice(0,40);
    if (!name) { say('Enter a preset name.'); return; }
    const existing = presets.findIndex(p => p.name === name);
    if (existing < 0 && presets.length >= 24) { say('Delete a preset first (24 maximum).'); return; }
    const preset = {name,settings:normalize(editState())};
    if (existing >= 0) presets[existing] = preset; else presets.push(preset);
    savePresets(); byId('preset-list').value = existing >= 0 ? existing : presets.length - 1; say('Preset saved.');
  };
  byId('preset-load').onclick = () => {
    const preset = presets[Number(byId('preset-list').value)]; if (!preset || (selected === 'self' && (locked || ['visuals','words','pulse','audio','imagery'].some(k=>!selfCan(k))))) return;
    if (selected === 'self') { settings = normalize(preset.settings); save(); resetEffectClock(); }
    else { const grant = receivedGrants.get(Number(selected)); if (grant) { grant.draft = normalize(preset.settings); grant.dirty = true; } }
    refreshFields(); layout(); say(selected === 'self' ? 'Preset loaded.' : 'Preset loaded into remote draft. Send changes to apply permitted settings.');
  };
  byId('preset-delete').onclick = () => { if (!presets.length || byId('preset-list').value === '') return; presets.splice(Number(byId('preset-list').value),1); savePresets(); say('Preset deleted.'); };
  refreshPresets();
  byId('enabled').onchange = () => {
    if (selected === 'self') { if (!locked && selfCan('effects')) { enabled = byId('enabled').checked; saveSession(); resetEffectClock(); layout(); } }
    else { const grant = receivedGrants.get(Number(selected)); if (grant?.level === 'session') { grant.enabled = byId('enabled').checked; grant.dirty = true; } }
    refreshFields();
  };
  byId('lock').onchange = () => { const grant = receivedGrants.get(Number(selected)); if (grant?.level === 'session') grant.locked = byId('lock').checked; };
  byId('target').onchange = () => { selected = byId('target').value; viewedProfile = selected === 'self' ? null : Number(selected); refreshFields(); };
  function openProfile(member) {
    viewedProfile = member === player()?.MemberNumber ? null : member; selected = viewedProfile === null ? 'self' : String(member);
    updatePeople(); open();
    if (!receivedGrants.has(member)) root.querySelector('[data-tab=overview]').click();
  }
  function refreshProfileCard() {
    const member = viewedProfile, peer = peers.get(member), grant = receivedGrants.get(member);
    byId('profile-card').hidden = member === null;
    if(member === null)return;
    const detected = peer && present(member) && Date.now()-peer.seen < 45000;
    byId('profile-title').textContent = label(member);
    byId('profile-status').textContent = grant ? grant.authority ? 'Hypno Reverie detected · Your role gives you authority over this overlay. Change it here, then Send changes.' : 'Hypno Reverie detected · You have keys. Edit and preview their draft, then Send changes.' : detected ? 'Hypno Reverie detected · Request keys to edit this player’s effects.' : 'Hypno Reverie not detected in this room. They may need to load it or update. Discovery can take up to 15 seconds.';
    byId('request-options').hidden = !!grant; byId('request-keys').hidden = !!grant; byId('request-keys').disabled = !detected || Date.now()-(requestTimes.get(member)||0)<30000;
  }
  byId('request-keys').onclick = () => {
    const member=viewedProfile;if(!member || !peers.has(member) || !present(member) || Date.now()-(requestTimes.get(member)||0)<30000)return;
    dominant=true;byId('dominant').checked=true;send('hello',{dominant});
    if(send('requestKeys',{level:byId('request-level').value,minutes:byId('request-duration').value==='indefinite'?null:Number(byId('request-duration').value),allowPulse:byId('request-pulse').checked,allowAudio:byId('request-audio').checked,allowExpressions:byId('request-expressions').checked},member)){requestTimes.set(member,Date.now());say('Key request sent. Waiting for their approval.');refreshProfileCard();}
  };
  function refreshRequests() {
    byId('requests-card').hidden=!keyRequests.size; byId('requests-list').replaceChildren();
    const levels={visuals:'Visuals only',text:'Visuals + words',session:'Full session + control lock (can turn effects on/off and disable your normal controls and Escape)'};
    for(const [member,request] of keyRequests){
      const row=document.createElement('div');row.className='card';const name=document.createElement('p');
      name.textContent=label(member)+' ['+ROLE_NAMES[roleOf(member)]+'] requests '+levels[request.level]+' · '+(request.minutes===null?'PERMANENT: survives room changes and relog until returned or revoked':request.minutes+' minutes')+' · pulse/flash changes '+(request.allowPulse?'included':'excluded')+' · audio '+(request.allowAudio?'included':'excluded')+' · facial expressions '+(request.allowExpressions?'included':'excluded')+'. Shares current settings and messages; controller-enabled head effects are visible to the room.';
      const yes=document.createElement('button');yes.textContent='Yes';yes.disabled=locked||gate.has(member);yes.onclick=()=>{if(keyRequests.get(member)!==request || Date.now()-request.at>120000)return;giveKeys(member,request.level,request.minutes,request.allowPulse,request.allowAudio,request.allowExpressions);};
      const no=document.createElement('button');no.textContent='No';no.onclick=()=>{send('declineKeys',{},member);keyRequests.delete(member);refreshRequests();};
      row.append(name,yes,no);byId('requests-list').append(row);
    }
  }

  const FACE_GROUPS=['Mouth','Eyes','Eyes2','Eyebrows','Blush','Tongue'];
  function cleanFaceOptions(raw){const result={};for(const name of FACE_GROUPS){if(Array.isArray(raw?.[name]))result[name]=[...new Set(raw[name].filter(v=>v===null||(typeof v==='string'&&v.length<=50)).slice(0,80))];}return result;}
  function faceOptions(character){const result={};for(const item of character?.Appearance||[]){const name=item.Asset?.Group?.Name;if(!FACE_GROUPS.includes(name))continue;let values=typeof window.InventoryGetItemProperty==='function'?window.InventoryGetItemProperty(item,'AllowExpression',true):item.Asset?.Group?.AllowExpression;if(Array.isArray(values)&&values.length)result[name]=[null,...values];}return cleanFaceOptions(result);}
  function refreshFace(){
    const remote=receivedGrants.get(Number(selected)),options=selected==='self'?faceOptions(player()):remote?.faceOptions||{};
    const group=byId('face-group').value,value=byId('face-value').value,key=JSON.stringify(options);
    if(byId('face-group').dataset.key!==key){byId('face-group').dataset.key=key;byId('face-group').replaceChildren();for(const name of Object.keys(options)){const option=document.createElement('option');option.value=name;option.textContent=name;byId('face-group').append(option);}if(options[group])byId('face-group').value=group;byId('face-value').dataset.group='';}
    const chosen=byId('face-group').value;
    if(byId('face-value').dataset.group!==chosen){byId('face-value').replaceChildren();for(const expression of options[chosen]||[]){const option=document.createElement('option');option.value=expression??'';option.textContent=expression===null?'Default':expression.replace(/([a-z])([A-Z])/g,'$1 $2');byId('face-value').append(option);}byId('face-value').dataset.group=chosen;}
    const available=Object.keys(options).length>0,permitted=selected==='self'?(!locked&&selfCan('expressions')):!!remote?.allowExpressions;
    byId('face-apply').disabled=byId('face-group').disabled=byId('face-value').disabled=!available||!permitted;
    byId('face-status').textContent=!available?'No supported expression choices found on this character.':!permitted?'Expression control is not granted, or your controls are locked.':'Choose an expression and Apply. The game may block choices due to equipped items.';
  }
  byId('face-group').onchange=()=>{byId('face-value').dataset.group='';refreshFace();};
  function applyFace(group,value){
    if(!FACE_GROUPS.includes(group) || !(value===null||typeof value==='string'))return {ok:false,message:'Unsupported expression.'};
    const c=player(),options=faceOptions(c);
    if(!options[group]?.includes(value)||typeof window.CharacterSetFacialExpression!=='function'||typeof window.CharacterIsExpressionDisallowed!=='function')return {ok:false,message:'Expression API or choice unavailable.'};
    const groups=group==='Eyes'?['Eyes','Eyes2']:[group];
    for(const name of groups){const item=c.Appearance.find(item=>item.Asset?.Group?.Name===name);if(!item)continue;const reason=window.CharacterIsExpressionDisallowed(c,item,value);if(reason)return {ok:false,message:'The game blocked this expression: '+String(reason)};}
    window.CharacterSetFacialExpression(c,group,value);c.ActiveExpression?.setWithoutReload?.(group,value);return {ok:true,message:'Expression applied.'};
  }
  byId('face-apply').onclick=()=>{const group=byId('face-group').value,value=byId('face-value').value||null;if(selected==='self'){if(!locked&&selfCan('expressions')){try{say(applyFace(group,value).message);}catch{say('The game could not apply that expression.');}}return;}const grant=receivedGrants.get(Number(selected));if(!grant?.allowExpressions||Date.now()-(grant.lastSend||0)<300)return;grant.lastSend=Date.now();grant.seq++;if(grant.authority)send('aset',{seq:grant.seq,expression:{group,value}},Number(selected));else send('expression',{token:grant.token,seq:grant.seq,group,value},Number(selected));};
  function player() { return window.Player; }
  function characters() { return Array.isArray(window.ChatRoomCharacter) ? window.ChatRoomCharacter : []; }
  function present(member) { return !blockedMember(member)&&characters().some(c => c.MemberNumber === member); }
  function label(member) { const c = characters().find(c => c.MemberNumber === member); return `${c?.Nickname || c?.Name || 'Player'} (#${member})`; }
  function roomKey() {
    if (!window.ChatRoomData || !player()?.MemberNumber || !(typeof window.ServerPlayerIsInChatRoom === 'function' ? window.ServerPlayerIsInChatRoom() : window.CurrentScreen === 'ChatRoom')) return null;
    return JSON.stringify([window.ChatRoomData.Name, window.ChatRoomData.Space, window.ChatRoomData.Language]);
  }
  function send(kind, payload = {}, target = null) {
    if (!installMessageHandler() || !roomKey() || !socket?.connected || typeof window.ServerSend !== 'function' || (target!==null&&blockedMember(target))) return false;
    const message = { v: 2, kind, boot:BOOT, ...payload, to: target };
    if (JSON.stringify(message).length > 16000) return false;
    try { window.ServerSend('ChatRoomChat', { Content: CHANNEL, Type: 'Hidden', Target: target, Dictionary: message }); return true; }
    catch { return false; }
  }
  function revoke(reason, notify = true, keepEffects = false) {
    const old=gate.list();forgetPermanent();
    if(notify)for(const g of old)send('revoke',{token:g.token},g.sender);
    gate.revokeAll(); locked = false; remoteHeadSharing = false; selfHeadAllowed=false;ownHeadVisible=false;
    if (old.length && !keepEffects) enabled = false;
    saveSession();
    say(reason); refreshFields(); updatePeople(); layout();
  }
  function revokeOne(sender,reason,notify=true){
    const g=gate.get(sender);if(!g)return;if(gate.size===1){revoke(reason,notify);return;}
    if(notify)send('revoke',{token:g.token},sender);gate.revoke(sender);syncLock();
    if(permanent)savePermanent();saveSession();say(reason);refreshFields();updatePeople();layout();
  }
  function stop() {
    enabled = false; revoke('Stopped. Remote keys revoked.');
    resetEffectClock(); canvas.hidden = true; hideSharedUntilEnabled = true; heads.hidden = true; publishHead(true); refreshFields();
  }
  byId('stop').onclick = () => { if (!gate.size) stop(); }; byId('revoke').onclick = () => { if (!gate.size) revoke('Keys revoked; overlay stopped.'); };
  function keydown(event) {
    if (event.key === 'Escape') { if (!locked && selfCan('effects')) stop(); }
    else if (event.altKey && event.shiftKey && event.code === 'KeyH' && !event.repeat) { event.preventDefault(); open(); }
    else if (event.altKey && event.shiftKey && event.code === 'KeyS' && !event.repeat && !locked && selfCan('effects')) {
      event.preventDefault(); enabled = !enabled; saveSession(); resetEffectClock(); refreshFields(); layout();
    }
  }
  document.addEventListener('keydown', keydown, true);
  byId('dominant').onchange = () => { dominant = byId('dominant').checked; send('hello', { dominant }); };
  byId('discover').onclick = () => { if (Date.now() - lastHello < 3000) return; lastHello = Date.now(); send('hello', { dominant }); say('Looking for players with Hypno Reverie…'); };
  function giveKeys(member,level,minutes,allowPulse,allowAudio=false,allowExpressions=false) {
    if(gate.has(member)){say(label(member)+' already has keys.');return;}
    const peer=peers.get(member);
    if(!peer?.dominant || !present(member) || Date.now()-peer.seen>45000){say('This controller is no longer available.');return;}
    const grant=gate.issue(member,level,crypto.randomUUID(),Date.now(),minutes,allowPulse,allowAudio,allowExpressions);
    if(!send('grant',{token:grant.token,level:grant.level,expires:grant.expires,allowPulse:grant.allowPulse,allowAudio:grant.allowAudio,allowExpressions:grant.allowExpressions,faceOptions:faceOptions(player()),settings,enabled,locked:false},member)){gate.revoke(member);say('Could not send keys.');return;}
    if(minutes===null){gate.get(member).announced=grant.token;savePermanent();}
    keyRequests.delete(member);say('Keys given to '+label(member)+'. Escape revokes them while unlocked.');updatePeople();refreshFields();
  }
  byId('grant').onclick = () => giveKeys(Number(byId('peer').value),byId('level').value,byId('duration').value==='indefinite'?null:Number(byId('duration').value==='custom'?byId('minutes').value:byId('duration').value),byId('allow-pulse').checked,byId('allow-audio').checked,byId('allow-expressions').checked);
  byId('apply').onclick = () => {
    // Commit the message editor if the user clicks Send before its blur handler runs.
    root.activeElement?.blur();
    const member = Number(selected), grant = receivedGrants.get(member);
    if (!grant || !present(member) || (grant.expires !== null && grant.expires <= Date.now())) { say('These keys are no longer valid.'); return; }
    if (Date.now() - (grant.lastSend || 0) < 300) return;
    grant.lastSend = Date.now(); grant.seq++;
    if (grant.authority) { const a = grant.access;
      if (send('aset', { seq: grant.seq, settings: grant.draft, enabled: a.effects ? grant.enabled : undefined, table: a.authority ? grant.draftTable : undefined }, member)) { grant.dirty = false; say('Changes sent to ' + label(member) + '.'); }
      else say('Could not send changes.'); return; }
    if (send('set', { token: grant.token, seq: grant.seq, settings: grant.draft, enabled: grant.enabled, locked: grant.locked, allowSelfHead:grant.allowSelfHead===true }, member)) say('Changes sent; waiting for acknowledgement.');
    else say('Could not send changes.');
  };
  byId('release').onclick = () => {
    const member = Number(selected), grant = receivedGrants.get(member);
    if (grant?.authority) return;
    if (grant) send('release', { token: grant.token }, member);
    receivedGrants.delete(member); selected = 'self'; updatePeople(); refreshFields(); say('Keys returned.');
  };
  function updatePeople() {
    const peerValue = byId('peer').value, targetValue = selected;
    const candidates = [...peers].filter(([id, p]) => p.dominant && present(id) && Date.now() - p.seen < 45000);
    const populate = (select, items) => {
      select.replaceChildren(); for (const [value, text] of items) { const o = document.createElement('option'); o.value = value; o.textContent = text; select.append(o); }
    };
    populate(byId('peer'), candidates.length ? candidates.map(([id]) => [String(id), label(id)]) : [['', 'No controllers discovered']]);
    if (candidates.some(([id]) => String(id) === peerValue)) byId('peer').value = peerValue;
    const targets = new Set(receivedGrants.keys()); if(viewedProfile !== null)targets.add(viewedProfile);
    populate(byId('target'), [['self', 'My overlay'], ...[...targets].map(id => [String(id), label(id) + (receivedGrants.get(id)?.authority ? ' · authority' : receivedGrants.has(id) ? ' · keys' : '')])]);
    if (targetValue === 'self' || targets.has(Number(targetValue))) byId('target').value = targetValue;
    else { selected = 'self'; byId('target').value = 'self'; refreshFields(); }
    const held=gate.list();
    byId('grant-info').textContent = held.length ? 'Keys: '+held.map(g=>`${label(g.sender)} · ${g.level} · ${g.expires === null ? 'permanent access' : Math.max(0, Math.ceil((g.expires - Date.now()) / 60000)) + ' min remaining'}${g.locked ? ' · locked your controls' : ''}`).join(' | ') : 'No one has keys to your overlay.';
    refreshFields(); refreshRequests();
  }
  const inboundTimes = new Map();
  function onMessage(data) {
    if(blockedMember(data?.Sender))return;
    if (!data || data.Type !== 'Hidden' || data.Content !== CHANNEL || !Number.isSafeInteger(data.Sender) || !roomKey()) return;
    if (roomKey() !== networkRoom || player()?.MemberNumber !== networkMember) {
      if(permanent && player()?.MemberNumber && permanent.owner!==player().MemberNumber){forgetPermanent();gate.revokeAll();locked=false;enabled=false;}
      clearSession('Room changed. Remote keys cleared.'); networkRoom=roomKey();networkMember=player()?.MemberNumber;lastHello=0;return;
    }
    const sender = data.Sender, packet = data.Dictionary;
    if (sender === player()?.MemberNumber || !present(sender) || !packet || typeof packet !== 'object' || packet.v !== 2 ||
      (packet.to !== null && packet.to !== player()?.MemberNumber)) return;
    if (!['hello', 'helloAck', 'grant', 'ackGrant', 'set', 'applied', 'release', 'revoke', 'head', 'requestKeys', 'declineKeys', 'auth', 'aset', 'aresult', 'expression', 'expressionResult'].includes(packet.kind)) return;
    // Discovery and cosmetic head state may broadcast; control always targets a member.
    if (!['hello', 'head'].includes(packet.kind) && packet.to !== player()?.MemberNumber) return;
    try { if (JSON.stringify(packet).length > 16000) return; } catch { return; }
    const now = Date.now(), rateKey = `${sender}:${packet.kind}`;
    if (now - (inboundTimes.get(rateKey) || 0) < 150 && !(packet.kind === 'head' && packet.active === false)) return;
    if (packet.kind === 'requestKeys' && now-(inboundTimes.get(rateKey)||0)<30000) return;
    inboundTimes.set(rateKey, now);
    if(packet.kind === 'requestKeys'){
      if(!['visuals','text','session'].includes(packet.level) || !(packet.minutes===null || (Number.isFinite(packet.minutes) && packet.minutes>=1 && packet.minutes<=30)) || typeof packet.allowPulse!=='boolean')return;
      if(!roleAllows(sender,perms.ask)){send('declineKeys',{},sender);return;}
      peers.set(sender,{dominant:true,seen:now});keyRequests.set(sender,{at:now,level:packet.level,minutes:packet.minutes,allowPulse:packet.allowPulse,allowAudio:packet.allowAudio===true,allowExpressions:packet.allowExpressions===true});updatePeople();say(label(sender)+' requested keys. Review the request in the menu.');
      open();return;
    }
    if(packet.kind === 'declineKeys'){say(label(sender)+' declined your key request.');return;}
    if (packet.kind === 'head') {
      if (packet.active === true) publicHeads.set(sender, { head: normalize({head:packet.head}).head, message: typeof packet.message === 'string' ? packet.message.slice(0,160) : '', seen: now });
      else publicHeads.delete(sender);
      return;
    }
    if(packet.kind==='auth'){const a=packet.access,old=receivedGrants.get(sender);
      if(!a||typeof a!=='object'){if(old?.authority){receivedGrants.delete(sender);updatePeople();refreshFields();}return;}
      if(old&&!old.authority)return; // keys they handed me take precedence while held
      const access={};for(const k of AUTH_KEYS)access[k]=a[k]===true;const see=access.view||['visuals','words','pulse','audio','imagery','effects'].some(k=>access[k]);
      const g=old||{authority:true,token:'',level:'session',expires:null,seq:0,locked:false};
      Object.assign(g,{access,canSee:see,allowPulse:true,allowAudio:true,allowExpressions:access.expressions,faceOptions:cleanFaceOptions(packet.faceOptions),seen:now,live:see?normalize(packet.settings):normalize(),liveEnabled:packet.enabled===true,liveTable:cleanTable(packet.table)});
      if(!old||!g.dirty){g.draft=clone(g.live);g.enabled=g.liveEnabled;g.draftTable=clone(g.liveTable);}
      receivedGrants.set(sender,g);if(!old)say('Your role gives you authority over '+label(sender)+'’s overlay.');updatePeople();refreshFields();return;}
    if(packet.kind==='aresult'){const g=receivedGrants.get(sender);if(!g?.authority||g.seq!==packet.seq)return;g.faceOptions=cleanFaceOptions(packet.faceOptions);refreshFace();say(packet.ok?'Expression applied on '+label(sender)+'.':'Expression rejected by the receiver’s game.');return;}
    if(packet.kind==='aset'){const a=authAccess(sender);if(!a||!Number.isSafeInteger(packet.seq)||packet.seq<=(authSeq.get(sender)||0))return;authSeq.set(sender,packet.seq);
      if(packet.expression&&typeof packet.expression==='object'){if(!a.expressions)return;let r;try{r=applyFace(packet.expression.group,packet.expression.value??null);}catch{r={ok:false,message:'The game could not apply that expression.'};}
        send('aresult',{ok:r.ok,message:r.message,seq:packet.seq,faceOptions:faceOptions(player())},sender);say(r.message);return;}
      let changed=false;
      if(packet.settings&&typeof packet.settings==='object'&&['visuals','words','pulse','audio','imagery'].some(k=>a[k])){const next=mergeParts(settings,normalize(packet.settings),a);if(JSON.stringify(next)!==JSON.stringify(settings)){settings=next;save();changed=true;}}
      if(a.effects&&typeof packet.enabled==='boolean'&&packet.enabled!==enabled){enabled=packet.enabled;saveSession();changed=true;}
      if(a.authority&&packet.table&&typeof packet.table==='object')changed=applyRemoteTable(sender,packet.table)||changed;
      if(changed){resetEffectClock();refreshFields();updatePeople();layout();publishHead(true);say(`Overlay updated by ${label(sender)} (${ROLE_NAMES[roleOf(sender)]}).`);}
      return;}
    if (packet.kind === 'hello' || packet.kind === 'helloAck') {
      if(gate.get(sender)?.expires===null && typeof packet.boot==='string' && packet.boot.length<=100 && peers.get(sender)?.boot!==packet.boot)rotateOne(sender);
      authSent.delete(sender);
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
      updatePeople(); if(viewedProfile===sender&&Date.now()-(requestTimes.get(sender)||0)<15000){selected=String(sender);byId('target').value=selected;}
      refreshFields(); say(selected===String(sender)?`You now control ${label(sender)}'s overlay.`:`${label(sender)} gave you overlay keys. Select their overlay above.`); return;
    }
    if (packet.kind === 'ackGrant' && gate.get(sender)?.token === packet.token) {
      const peer = peers.get(sender); if (peer) peer.seen = now; say(`${label(sender)} received your keys.`); return;
    }
    if(packet.kind==='expression'){
      if(!gate.get(sender)?.allowExpressions || !gate.apply(sender,{...packet,settings},settings,now,present(sender)))return;
      let result;try{result=applyFace(packet.group,packet.value);}catch{result={ok:false,message:'The game could not apply that expression.'};}
      send('expressionResult',{...result,token:gate.get(sender).token,seq:packet.seq,faceOptions:faceOptions(player())},sender);say(result.message);return;
    }
    if(packet.kind==='expressionResult'){const grant=receivedGrants.get(sender);if(grant?.token!==packet.token||grant.seq!==packet.seq)return;grant.faceOptions=cleanFaceOptions(packet.faceOptions);refreshFace();say(packet.ok?'Expression applied on '+label(sender)+'.':'Expression rejected by the receiver’s game.');return;}
    if (packet.kind === 'set') {
      const result = gate.apply(sender, packet, settings, now, present(sender));
      if (!result) return;
      settings = result.settings;
      remoteHeadSharing = ['words','forehead','eyes','halo'].some(key => settings.head[key]);
      if (result.enabled !== undefined) enabled = result.enabled;
      if (result.locked !== undefined) { gate.get(sender).locked = result.locked; syncLock(); }
      if(result.allowSelfHead!==undefined){selfHeadAllowed=result.allowSelfHead;if(!selfHeadAllowed)ownHeadVisible=false;}
      save(); saveSession(); resetEffectClock(); refreshFields(); updatePeople(); layout(); publishHead(true);
      send('applied', { token: gate.get(sender).token, seq: packet.seq }, sender);
      say(`Overlay updated by ${label(sender)}${locked ? ' · normal controls locked' : ''}.`); return;
    }
    if (packet.kind === 'applied') {
      const grant = receivedGrants.get(sender);
      if (grant?.token === packet.token && packet.seq === grant.seq) say(`Changes applied on ${label(sender)}.`);
    } else if (packet.kind === 'release' && gate.get(sender)?.token === packet.token) revokeOne(sender, `${label(sender)} returned the keys.`, false);
    else if (packet.kind === 'revoke') {
      if (receivedGrants.get(sender)?.token !== packet.token) return;
      receivedGrants.delete(sender); updatePeople(); refreshFields(); say(`${label(sender)} revoked your keys.`);
    }
  }
  function clearSession(reason) {
    if(permanent){for(const g of gate.list())if(g.expires!==null)gate.revoke(g.sender);syncLock();savePermanent();rotatePermanent();say(reason+' Permanent access retained.');}
    else {if(!resume.remember)enabled=false;revoke(reason,false,resume.remember);}
    receivedGrants.clear();peers.clear();publicHeads.clear();keyRequests.clear();requestTimes.clear();authSent.clear();authSeq.clear();viewedProfile=null;inboundTimes.clear();publicWasActive=false;selected='self';ownHeadVisible=false;selfHeadAllowed=false;
    updatePeople();refreshFields();layout();
  }
  function disconnected() { clearSession('Connection lost. All remote keys cleared.'); }
  function memberLeft(data) {
    const member = data?.SourceMemberNumber ?? data?.MemberNumber;
    const leaving=gate.get(member);if(leaving){if(leaving.expires===null){savePermanent();rotateOne(member);}else revokeOne(member,`${label(member)} left the room. Their keys were revoked.`,false);}
    receivedGrants.delete(member); peers.delete(member); publicHeads.delete(member); keyRequests.delete(member); authSent.delete(member); authSeq.delete(member); updatePeople();
  }
  function roomSync() { clearSession('Room synchronized. Remote keys cleared.'); lastHello = 0; }
  const ROLE_NAMES={owner:'Owner',lover:'Lover',whitelist:'Whitelisted',friend:'Friend',anyone:'Anyone'};
  function roleOf(member){
    const p=player();if(!p||!Number.isSafeInteger(member))return 'anyone';
    try{if(p.Ownership?.MemberNumber===member||(typeof p.IsOwnedByMemberNumber==='function'&&p.IsOwnedByMemberNumber(member)===true))return 'owner';}catch{}
    try{if((Array.isArray(p.Lovership)&&p.Lovership.some(l=>l?.MemberNumber===member))||(typeof p.IsLoverOfMemberNumber==='function'&&p.IsLoverOfMemberNumber(member)===true))return 'lover';}catch{}
    if(Array.isArray(p.WhiteList)&&p.WhiteList.includes(member))return 'whitelist';
    if(Array.isArray(p.FriendList)&&p.FriendList.includes(member))return 'friend';
    return 'anyone';
  }
  function roleAllows(member,min){return ROLE_RANK[roleOf(member)]>=(ROLE_RANK[min]||99);}
  function savePerms(){try{localStorage.setItem(PERMS_KEY,JSON.stringify(perms));}catch{say('Permissions could not be saved.');}}
  const AUTH_LABELS={view:'See settings',visuals:'Spirals, focus and head effects',words:'Words',pulse:'Pulse and flash',audio:'Audio',imagery:'Imagery and pacer',expressions:'Facial expressions',effects:'Turn effects on and off',authority:'Change these permissions'};
  const PULSE_FOCUS=['colorPulse','colorA','colorB','colorOpacity','beatSource','beats'];
  function selfCan(k){return authority[k]?.self!==false;}
  function saveAuthority(){try{localStorage.setItem(AUTH_KEY,JSON.stringify(authority));}catch{say('Authority settings could not be saved.');}authSent.clear();}
  // What this member may do on my overlay, from my authority table (null = nothing).
  function authAccess(member){if(!Number.isSafeInteger(member)||member===player()?.MemberNumber||blockedMember(member)||!present(member))return null;
    const a={};let any=false;for(const k of AUTH_KEYS){a[k]=roleAllows(member,authority[k].min);any=any||a[k];}return any?a:null;}
  function partOf(p){if(p[0]==='text'||(p[0]==='head'&&(p[1]==='words'||p[1]==='wordMode')))return 'words';if(p[0]==='pulse'||(p[0]==='focus'&&PULSE_FOCUS.includes(p[1])))return 'pulse';if(p[0]==='audio')return 'audio';if(p[0]==='imagery')return 'imagery';return 'visuals';}
  function mergeParts(cur,inc,a){const next=clone(cur);
    if(a.visuals){next.spirals=inc.spirals;next.width=inc.width;for(const k of Object.keys(inc.focus))if(!PULSE_FOCUS.includes(k))next.focus[k]=inc.focus[k];for(const k of Object.keys(inc.head))if(k!=='words'&&k!=='wordMode')next.head[k]=inc.head[k];}
    if(a.words){next.text=inc.text;next.head.words=inc.head.words;next.head.wordMode=inc.head.wordMode;}
    if(a.pulse){next.pulse=inc.pulse;for(const k of PULSE_FOCUS)next.focus[k]=inc.focus[k];}
    if(a.audio)next.audio=inc.audio;if(a.imagery)next.imagery=inc.imagery;return normalize(next);}
  function cleanTable(t){const r={};for(const k of AUTH_KEYS){const v=t?.[k];r[k]={min:ROLE_RANK[v?.min]?v.min:'nobody',self:v?.self!==false};}return r;}
  // A remote editor may change only parts they hold themselves, and never in a way that removes their own access.
  function applyRemoteTable(editor,incoming){const inc=cleanTable(incoming),mine=ROLE_RANK[roleOf(editor)];let changed=false;
    for(const k of AUTH_KEYS){const cur=authority[k],n=inc[k];if(n.min===cur.min&&n.self===cur.self)continue;
      if(!roleAllows(editor,cur.min)||mine<(ROLE_RANK[n.min]||99))continue;authority[k]={min:n.min,self:n.self};changed=true;}
    if(changed)saveAuthority();return changed;}
  function sendAuthority(){for(const [id] of peers){const a=authAccess(id),see=!!a&&(a.view||['visuals','words','pulse','audio','imagery','effects'].some(k=>a[k]));
    const payload=a?{access:a,settings:see?settings:undefined,enabled:see?enabled:undefined,table:a.authority?authority:undefined,faceOptions:a.expressions?faceOptions(player()):undefined}:{access:null};
    const key=JSON.stringify(payload);if(authSent.get(id)===key||(!a&&!authSent.has(id)))continue;if(send('auth',payload,id))authSent.set(id,key);}}
  function blockedMember(member) {
    const p=player();
    if(!p||!Number.isSafeInteger(member))return true;
    if([p.GhostList,p.BlackList].some(list=>Array.isArray(list)&&list.includes(member)))return true;
    try {
      const character=characters().find(c=>c.MemberNumber===member);
      return ['HasOnGhostlist','HasOnBlacklist'].some(method=>typeof p[method]==='function'&&p[method](character||member)===true);
    } catch { return true; } // Permission-check failures must not permit incoming access.
  }
  function clearBlockedPeers() {
    if(!player())return; // No logged-in player (e.g. mid-relog): don't wipe saved access on a transient state.
    for(const g of gate.list())if(blockedMember(g.sender))revokeOne(g.sender,'A controller is ghosted or blacklisted. Their access was revoked.',false);
    for(const map of [receivedGrants,peers,publicHeads,keyRequests,requestTimes,authSent,authSeq])for(const id of map.keys())if(blockedMember(id))map.delete(id);
    if(selected!=='self'&&blockedMember(Number(selected))){selected='self';refreshFields();}
    if(viewedProfile!==null&&blockedMember(viewedProfile))viewedProfile=null;
  }
  const addonMessageHandler={
    Description:'Hypno Reverie protocol',
    // Native ghost filtering runs at -200; native hidden-message handling runs at -1.
    Priority:-50,
    Callback(data,sender){
      if(data?.Type!=='Hidden'||data.Content!==CHANNEL)return false;
      if(!destroyed&&sender?.MemberNumber===data.Sender&&!blockedMember(data.Sender))onMessage(data);
      return true;
    }
  };
  let prefRegistered=false,inPreferences=false;
  function closeMenu(){byId('ui').hidden=byId('panel').hidden=true;}
  function leavePreferences(){if(!inPreferences)return;inPreferences=false;try{if(typeof PreferenceSubscreenExtensionsClear==='function')PreferenceSubscreenExtensionsClear();}catch{}}
  function registerPreferences(){
    if(prefRegistered||destroyed||typeof PreferenceRegisterExtensionSetting!=='function'||typeof PreferenceExtensionsSettings!=='object'||!PreferenceExtensionsSettings)return;
    try{
      delete PreferenceExtensionsSettings.HypnoReverie; // left by an older copy that was replaced without reloading
      PreferenceRegisterExtensionSetting({Identifier:'HypnoReverie',ButtonText:'Hypno Reverie',Image:'data:image/svg+xml,'+encodeURIComponent(LOGO),
        load(){inPreferences=true;open();},
        run(){try{DrawText('The Hypno Reverie menu is open in its own window.',1000,440,'White','Black');DrawText('Click anywhere here to show it again. Use the exit button to go back.',1000,500,'White','Black');DrawButton(1815,75,90,90,'','White','Icons/Exit.png');}catch{}},
        click(){if(typeof MouseIn==='function'&&MouseIn(1815,75,90,90)){closeMenu();leavePreferences();}else open();},
        exit(){inPreferences=false;closeMenu();return true;},
        unload(){inPreferences=false;}});
      prefRegistered=!!PreferenceExtensionsSettings.HypnoReverie;
    }catch{}
  }
  function installMessageHandler(){
    const handlers=window.ChatRoomMessageHandlers;
    if(destroyed||!Array.isArray(handlers)||typeof window.ChatRoomRegisterMessageHandler!=='function')return false;
    if(!handlers.includes(addonMessageHandler))window.ChatRoomRegisterMessageHandler(addonMessageHandler);
    return handlers.includes(addonMessageHandler);
  }
  function removeMessageHandler(){
    const handlers=window.ChatRoomMessageHandlers;if(!Array.isArray(handlers))return;
    const i=handlers.indexOf(addonMessageHandler);if(i>=0)handlers.splice(i,1);
  }

  function attachSocket(next) {
    if (socket) {
      socket.off('disconnect', disconnected);
      socket.off('ChatRoomSyncMemberLeave', memberLeft); socket.off('ChatRoomSync', roomSync);
    }
    socket = next;
    if (socket) { socket.on('disconnect', disconnected);
      socket.on('ChatRoomSyncMemberLeave', memberLeft); socket.on('ChatRoomSync', roomSync); }
  }
  function networkTick() {
    installMessageHandler();registerPreferences();restorePermanent();clearBlockedPeers();
    const next = window.ServerSocket;
    if (next !== socket && typeof next?.on === 'function' && typeof next?.off === 'function') { clearSession('Connected. Remote keys start cleared.'); attachSocket(next); }
    const room = roomKey(), member = player()?.MemberNumber;
    if((permanent && member && permanent.owner!==member)||(resume.member && member && member!==resume.member)){forgetPermanent();gate.revokeAll();locked=false;enabled=false;saveSession();}
    if (room !== networkRoom || member !== networkMember) {
      const firstTick=!networkStarted;networkStarted=true;
      clearSession('Room changed. Remote keys cleared.'); networkRoom = room; networkMember = member; lastHello = 0;
      if(firstTick&&!permanent)say(enabled?'Saved effects resumed.':'Ready. Effects are off.');
    }
    if (!room || !socket?.connected) { if (gate.size || receivedGrants.size) clearSession('Not connected to a room. Keys cleared.'); return; }
    const now = Date.now();
    if (now - lastHello > 15000) { send('hello', { dominant }); lastHello = now; }
    for (const g of gate.list()) if (g.expires !== null && (now >= g.expires || !present(g.sender) || now - (peers.get(g.sender)?.seen || 0) > 45000)) revokeOne(g.sender, `${label(g.sender)}'s session ended. Their keys were revoked.`);
    for (const [id, grant] of receivedGrants) if ((grant.expires !== null && now >= grant.expires) || !present(id) || now - (peers.get(id)?.seen || grant.seen) > 45000) receivedGrants.delete(id);
    for (const [id, peer] of peers) if (!present(id) || now - peer.seen > 45000) peers.delete(id);
    for (const [id,request] of keyRequests) if(!present(id) || now-request.at>120000)keyRequests.delete(id);
    for (const [id,state] of publicHeads) if (!present(id) || now - state.seen > 5000) publicHeads.delete(id);
    sendAuthority(); publishHead(); updatePeople();
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
  function overlayBounds(g,c){
    const clip=(l,t,r,b)=>{l=Math.max(0,l);t=Math.max(0,t);r=Math.min(r,innerWidth);b=Math.min(b,innerHeight);return r>l&&b>t?{left:l,top:t,width:r-l,height:b-t}:null;};
    if(area==='screen')return clip(0,0,innerWidth,innerHeight);
    if(area==='chat')return c?.width?clip(c.left,c.top,c.right,c.bottom):null;
    if(area==='game')return g?.width?clip(g.left,g.top,Math.max(g.right,c?.right||0),Math.max(g.bottom,c?.bottom||0)):null;
    return bounds(g,c,settings.width,innerWidth,innerHeight);
  }
  function layout() {
    syncProfileButton(); clampWindow(byId('panel')); clampWindow(byId('preview-window'));
    const game = document.getElementById('MainCanvas'), chat = document.getElementById('TextAreaChatLog');
    const visible = window.CurrentScreen === 'ChatRoom' && chat && getComputedStyle(chat).visibility !== 'hidden' && !chat.closest('[hidden]');
    rectangle = visible ? overlayBounds(game?.getBoundingClientRect(), chat.getBoundingClientRect()) : null;
    headRectangle = visible ? bounds(game?.getBoundingClientRect(), chat.getBoundingClientRect(), 50, innerWidth, innerHeight) : null;
    canvas.hidden = !rectangle || !enabled || document.hidden;
    heads.hidden = !headRectangle || document.hidden;
    positionImagery();
    for (const [layer,r] of [[canvas,rectangle],[heads,headRectangle]]) {
      if (!r) continue;
      Object.assign(layer.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
      const ratio = Math.min(devicePixelRatio || 1,1.5), w = Math.round(r.width*ratio), h = Math.round(r.height*ratio);
      if (layer.width !== w || layer.height !== h) { layer.width = w; layer.height = h; }
    }
  }
  // Imagery layer: one image or video at a time, faded in and out, placed over the same area as the overlay.
  const imageryState={key:'',el:null,start:0,end:-1,lastCycle:-1,order:0};
  function positionImagery(){const el=byId('imagery-layer'),im=settings.imagery;el.hidden=canvas.hidden||!im.enabled||!mediaPool(im).length||!rectangle;
    if(el.hidden){if(imageryState.el){imageryState.el.remove();imageryState.el=null;imageryState.end=-1;}return;}
    Object.assign(el.style,{left:rectangle.left+'px',top:rectangle.top+'px',width:rectangle.width+'px',height:rectangle.height+'px',zIndex:im.layer==='over'?'2':'0'});canvas.style.zIndex='1';}
  // The built-in pack (assets/imagery) plus the wearer's own links.
  function mediaPool(im){return [...(im.builtin?IMAGERY_PACK.map(x=>({url:ASSET_BASE+'imagery/'+x.file,cat:x.cat})):[]),...media];}
  function pickMedia(im){const pool=mediaPool(im).filter(m=>im.category==='any'||m.cat===im.category);if(!pool.length)return null;
    if(im.order==='inorder')return pool[imageryState.order++%pool.length];return pool[Math.floor(Math.random()*pool.length)];}
  function showMedia(m,im){const layer=byId('imagery-layer');imageryState.el?.remove();imageryState.el=null;if(!m)return;
    const video=/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(m.url),el=document.createElement(video?'video':'img');el.referrerPolicy='no-referrer';
    if(video){el.muted=true;el.loop=true;el.autoplay=true;el.playsInline=true;}el.src=m.url;const W=layer.clientWidth,H=layer.clientHeight;
    if(im.position==='fill')Object.assign(el.style,{left:'0',top:'0',width:'100%',height:'100%',objectFit:'cover'});
    else{const bw=W*im.size,bh=H*im.size,x=im.position==='random'?Math.random()*(W-bw):(W-bw)/2,y=im.position==='random'?Math.random()*(H-bh):(H-bh)/2;Object.assign(el.style,{left:x+'px',top:y+'px',width:bw+'px',height:bh+'px',objectFit:'contain'});}
    el.style.mixBlendMode=im.blend;el.style.opacity='0';layer.append(el);imageryState.el=el;if(video)el.play?.().catch(()=>{});}
  function updateImagery(text){const im=settings.imagery,s=imageryState,t=activeTime;if(byId('imagery-layer').hidden)return;
    const key=JSON.stringify([im,media.length]);if(key!==s.key||t<s.start){s.key=key;s.end=-1;s.lastCycle=-1;}
    if(im.timing==='words'){if(text.message&&text.cycle!==s.lastCycle){s.lastCycle=text.cycle;showMedia(pickMedia(im),im);s.start=t;s.end=t+im.duration;}}
    else if(im.timing==='steady'){if(s.end!==Infinity){showMedia(pickMedia(im),im);s.start=t;s.end=Infinity;}}
    else if(s.end<0||t>=s.end+im.gap){showMedia(pickMedia(im),im);s.start=t;s.end=t+im.duration;}
    if(!s.el)return;const f=Math.max(.001,im.fade);s.el.style.opacity=String(im.opacity*Math.max(0,Math.min(1,(t-s.start)/f,(s.end-t)/f)));}
  // Beat pacer: a pulsing ring or a bouncing bar. Following the wet rhythm uses its tempo, including the 64-second build.
  function pacerPhase(){const im=settings.imagery,a=settings.audio,follow=im.pacerFollow&&a.slick!=='none',bpm=follow?a.slickBpm:im.pacerBpm;
    if(follow&&a.slick==='build'){const T=64,u=activeTime%T;return (bpm/60*(u+.9*T*(u/T)**2.5/2.5))%1;}return (activeTime*bpm/60)%1;}
  function drawPacer(w,h){const im=settings.imagery;if(im.pacer==='off')return;const p=pacerPhase(),c=ctx;c.save();c.strokeStyle=c.fillStyle=im.pacerColor;
    if(im.pacer==='ring'){const base=Math.min(w,h)*im.pacerSize/2,beat=Math.exp(-p*6),r=base*(.75+.25*beat);c.globalAlpha=.85;c.lineWidth=Math.max(2,base*.08);c.shadowColor=im.pacerColor;c.shadowBlur=base*.3*beat;
      c.beginPath();c.arc(w/2,h/2,r,0,Math.PI*2);c.stroke();c.globalAlpha=.25*beat;c.fill();}
    else{const bw=w*.6,x0=(w-bw)/2,y=h*.88,pos=.5-.5*Math.cos(p*Math.PI*2),s=Math.max(6,Math.min(w,h)*im.pacerSize*.12);c.globalAlpha=.35;c.fillRect(x0,y-2,bw,4);c.globalAlpha=.9;c.beginPath();c.arc(x0+bw*pos,y,s,0,Math.PI*2);c.fill();}
    c.restore();}
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
        if(self && (!enabled || !ownHeadVisible || (gate.size>0&&!selfHeadAllowed)))continue;
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
  const previewCanvas=byId('preview-canvas'), previewContext=previewCanvas.getContext('2d');
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
    if(f.colorPulse){const rate=f.beatSource==='heartbeat'?config.audio.bpm/60:f.beatSource==='iso'?config.audio.isoRate:Math.abs(binauralHz(config.audio)[1]-binauralHz(config.audio)[0]);const seconds=Math.max(2,f.beats/Math.max(.01,rate)),mix=(1-Math.cos(beatTime/seconds*Math.PI*2))/2;
      const rgb=(color)=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),a=rgb(f.colorA),b=rgb(f.colorB);c.save();c.globalAlpha=f.colorOpacity;c.fillStyle='rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*mix)).join(',')+')';c.fillRect(0,0,w,h);c.restore();}
    if(f.enabled){const radius=focusRadius(f,time,w,h),outer=Math.max(radius+1,Math.min(w,h)*.65);
      if(f.blur>0){if(focusScratch.width!==w||focusScratch.height!==h){focusScratch.width=w;focusScratch.height=h;}const sc=focusScratch.getContext('2d');sc.clearRect(0,0,w,h);sc.save();sc.filter='blur('+f.blur*w/700+'px)';sc.drawImage(c.canvas,0,0);sc.filter='none';sc.globalCompositeOperation='destination-in';const mask=sc.createRadialGradient(w/2,h/2,radius,w/2,h/2,Math.min(outer,radius+Math.min(w,h)*.12));mask.addColorStop(0,'transparent');mask.addColorStop(1,'black');sc.fillStyle=mask;sc.fillRect(0,0,w,h);sc.restore();c.drawImage(focusScratch,0,0);}
      const gradient=c.createRadialGradient(w/2,h/2,radius,w/2,h/2,outer);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'rgba(0,0,0,'+f.darkness+')');c.fillStyle=gradient;c.fillRect(0,0,w,h);
    }
    if(f.fixation!=='none'){const r=Math.min(w,h)*f.size;c.save();c.translate(w/2,h/2);c.rotate(time*.3);c.strokeStyle=f.color;c.lineWidth=Math.max(1.5,r*.08);c.shadowColor=f.color;c.shadowBlur=f.glow;c.beginPath();
      if(f.fixation==='ring'){c.ellipse(0,0,r,r*.8,0,0,Math.PI*2);c.stroke();c.beginPath();c.rect(-r*.12,r*.65,r*.24,r*.3);}
      else for(let i=0;i<=150;i++){const a=i/150*Math.PI*6,rr=r*i/150;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();c.restore();}
  }
  function updateFocusBackdrop(){const el=byId('focus-blur'),r=rectangle,f=settings.focus;el.hidden=!r||!enabled||!f.enabled||f.blur<=0||document.hidden;if(el.hidden)return;const radius=focusRadius(f,activeTime,r.width,r.height);Object.assign(el.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',backdropFilter:'blur('+f.blur+'px)',maskImage:'radial-gradient(circle at center,transparent '+radius+'px,black '+(radius+Math.min(r.width,r.height)*.12)+'px)'});}
  function renderPreview(dt) {
    if(byId('preview-window').hidden || document.hidden || !previewContext)return;
    if(selected !== 'self' && !receivedGrants.has(Number(selected))){showPreview(false);return;}
    const config=editState(),key=selected+JSON.stringify(config);
    if(key!==previewConfig){previewConfig=key;previewTime=0;previewPulseState=newPulseState();}
    previewTime+=dt;
    byId('preview-label').textContent=(selected==='self'?'My overlay':label(Number(selected)))+' · unsent appearance preview';
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
      const text = textFrame(settings.text, activeTime); cueOnWord(text);
      drawPulse(text, w, h); drawText(text, w, h); drawPacer(w, h); updateImagery(text);
    }
    updateFocusBackdrop(); drawHeads(time / 1000); renderPreview(dt);
    frameId = requestAnimationFrame(render);
  }
  let audioContext=null,audioReady=false,audioDraft=false,audioGraph=null,audioKey='',audioMutedByError=false;
  const retiredAudio=new Set();
  function disposeAudio(graph,immediate=false){if(!graph)return;graph.dead=true;const now=audioContext?.currentTime||0;try{graph.bus.gain.cancelScheduledValues(now);graph.bus.gain.setTargetAtTime(0,now,.015);}catch{}const close=()=>{for(const source of graph.sources)try{source.stop();}catch{}for(const node of graph.nodes)try{node.disconnect();}catch{}};if(immediate)close();else{const id=setTimeout(()=>{retiredAudio.delete(id);close();},80);retiredAudio.add(id);}}
  // Word cues ring once when a new word or sentence appears: every one, or only those containing a trigger word or phrase (whole words, any case, punctuation ignored).
  const cueNorm=s=>' '+s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu,' ').trim()+' ';
  let lastCueCycle=-1;
  function cueOnWord(text){if(!text.message||text.cycle===lastCueCycle)return;lastCueCycle=text.cycle;const a=settings.audio;if(a.cue==='none'||a.cueMode==='interval'||!audioGraph||audioDraft)return;
    if(a.cueMode==='trigger'){const m=cueNorm(text.message);if(!a.cueWords.some(w=>{const n=cueNorm(w);return n.trim()&&m.includes(n);}))return;}
    try{let buf=audioGraph.cueBuffer;if(!buf){const tr=synthesizeTrack('cue',{...a,cueEvery:CUE_LEN[a.cue]},32000);buf=audioContext.createBuffer(1,tr.data.length,tr.rate);buf.copyToChannel(tr.data,0);audioGraph.cueBuffer=buf;}
      const src=audioContext.createBufferSource(),gain=audioContext.createGain();gain.gain.value=a.cueLevel;src.buffer=buf;src.connect(gain);gain.connect(audioGraph.bus);src.onended=()=>{try{gain.disconnect();}catch{}};src.start();}catch{}}
  function syncAudio(){
    if(destroyed)return;
    if(wantsAudio())tryAutoAudio();
    const config=audioDraft?editState().audio:settings.audio,validDraft=selected==='self'||receivedGrants.has(Number(selected));
    const play=audioReady&&audioContext?.state==='running'&&config.enabled&&(audioDraft?validDraft:enabled)&&!document.hidden;
    const key=play?JSON.stringify(config)+(audioDraft?selected:'live'):'';
    if(key!==audioKey){disposeAudio(audioGraph);audioGraph=null;audioKey=key;if(play){try{audioGraph=buildAudioMix(audioContext,config,audioContext.destination);}catch(error){audioKey='';audioReady=false;audioMutedByError=true;say('Audio could not start: '+error.message);}}}
    byId('audio-status').textContent=audioMutedByError?'Audio unavailable. Try Allow sound again.':!audioReady?(wantsAudio()?'Starting sound… if your browser holds it back, it starts on your next click or key press in the game.':userMuted?'Muted on this device. Press Allow sound to hear it again.':'Sound starts by itself when the audio layer and effects are on.'):audioContext?.state!=='running'?'Browser paused audio. Click Allow sound to resume.':play?(audioDraft?'Listening to the selected draft locally.':'Audio playing on this device.'):'Audio ready; enable the audio layer and effects to play.';
  }
  const AUTO_AUDIO_KEY='hypnoreverie-audio-auto-v1';let autoAudio=true,userMuted=false,autoTrying=false,lastAutoTry=0;
  try{if(localStorage.getItem(AUTO_AUDIO_KEY)==='0')autoAudio=false;}catch{}
  async function startAudio(auto=false){
    try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('Web Audio is unavailable');audioContext ||= new Context();
      // resume() can wait for a gesture; an automatic attempt gives up after a moment and tries again later.
      await (auto?Promise.race([audioContext.resume(),new Promise(r=>setTimeout(r,400))]):audioContext.resume());
      if(audioContext.state!=='running')return false;audioReady=true;audioMutedByError=false;if(!auto)userMuted=false;syncAudio();return true;}
    catch(error){if(!auto)say('Audio could not start: '+error.message);return false;}}
  // With Self off for Audio (Authority tab) the wearer cannot mute or opt out.
  function wantsAudio(){const forced=!selfCan('audio');return (autoAudio||forced)&&(!userMuted||forced)&&!destroyed&&settings.audio.enabled&&enabled&&!document.hidden&&!(audioReady&&audioContext?.state==='running');}
  async function tryAutoAudio(){if(autoTrying||!wantsAudio()||Date.now()-lastAutoTry<2000)return;autoTrying=true;lastAutoTry=Date.now();try{await startAudio(true);}finally{autoTrying=false;}}
  const gestureAudio=()=>{if(wantsAudio())startAudio(true);};
  for(const type of ['pointerdown','keydown','touchstart'])document.addEventListener(type,gestureAudio,true);
  byId('audio-start').onclick=()=>startAudio(false);
  byId('audio-auto').checked=autoAudio;byId('audio-auto').onchange=()=>{if(!selfCan('audio')){byId('audio-auto').checked=true;return;}autoAudio=byId('audio-auto').checked;try{localStorage.setItem(AUTO_AUDIO_KEY,autoAudio?'1':'0');}catch{}syncAudio();};
  byId('audio-mute').onclick=()=>{if(!selfCan('audio'))return;audioReady=false;userMuted=true;syncAudio();};
  byId('audio-preview').onchange=()=>{audioDraft=byId('audio-preview').checked;syncAudio();};
  function audioClock(fallback){return audioGraph&&audioReady&&audioContext?.state==='running'?Math.max(0,audioContext.currentTime-audioGraph.start):fallback;}
  const wearableMod=bcModSdk.registerMod({name:'HypnoReverie',fullName:'Hypno Reverie',version:VERSION,repository:'https://github.com/Jaxx-01-ai/HypnoReverie'},{allowReplace:true});
  let pickerInstalled=false, previewInstalled=false, buildContext=null, previewItem=null;
  const skinDefinitions=[
    {...wearableVariants[0],source:HEADSET_IMAGE,width:116,x:42,y:136,centerY:true,layers:['Body','Display'],drawLayer:'Display'},
    {...wearableVariants[1],source:HOOD_IMAGE,echoSource:HOOD_ECHO_IMAGE,raw:true,x:0,y:0,centerY:false,layers:null,keep:['HairUnder'],drawLayers:['PanelHeadHighlight','PanelHeadHighlightS','PanelHeadHighlightN']}
  ];
  const skinRestorers=[];
  function refreshWearableCanvases(){if(typeof window.CharacterLoadCanvas==='function')for(const c of new Set([player(),...characters()].filter(Boolean)))if(c.Appearance?.some(wearableVariant))window.CharacterLoadCanvas(c);}
  for(const skin of skinDefinitions){
    const image=hrImage();skin.image=image;skin.ready=false;skin.installed=false;
    const spriteOf=img=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);return c;};
    const thumbOf=sprite=>{const rgba=sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height).data;let x0=sprite.width,y0=sprite.height,x1=-1,y1=-1;for(let y=0;y<sprite.height;y++)for(let x=0;x<sprite.width;x++)if(rgba[(y*sprite.width+x)*4+3]>12){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<=x0||y1<=y0)return null;const w=x1-x0+1,h=y1-y0+1,t=document.createElement('canvas');t.width=t.height=225;const k=Math.min(195/w,195/h);t.getContext('2d').drawImage(sprite,x0,y0,w,h,(225-w*k)/2,(225-h*k)/2,w*k,h*k);return t.toDataURL('image/png');};
    const rawReady=()=>{if(destroyed||!skin.sprite||!skin.thumbnail||(skin.echoSource&&!skin.echoSprite))return;skin.ready=true;installWearables();};
    if(skin.raw&&skin.echoSource){const echoImage=hrImage();echoImage.onload=()=>{if(destroyed)return;skin.echoSprite=spriteOf(echoImage);rawReady();};echoImage.src=skin.echoSource;}
    image.onload=()=>{
      if(destroyed)return;
      if(skin.raw){skin.sprite=spriteOf(image);skin.thumbnail=thumbOf(skin.sprite);rawReady();return;}
      const scratch=document.createElement('canvas');scratch.width=image.width;scratch.height=image.height;
      const context=scratch.getContext('2d');context.drawImage(image,0,0);const rgba=context.getImageData(0,0,scratch.width,scratch.height).data;
      let x0=scratch.width,y0=scratch.height,x1=-1,y1=-1;
      for(let y=0;y<scratch.height;y++)for(let x=0;x<scratch.width;x++)if(rgba[(y*scratch.width+x)*4+3]>12){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
      if(x1<=x0||y1<=y0)return;
      const sprite=document.createElement('canvas');sprite.width=skin.width;sprite.height=skin.height||Math.round(skin.width*(y1-y0+1)/(x1-x0+1));
      sprite.getContext('2d').drawImage(image,x0,y0,x1-x0+1,y1-y0+1,0,0,sprite.width,sprite.height);skin.sprite=sprite;
      if(skin.echo){skin.echoSprite=document.createElement('canvas');skin.echoSprite.width=skin.echo.width;skin.echoSprite.height=skin.echo.height;skin.echoSprite.getContext('2d').drawImage(image,x0,y0,x1-x0+1,y1-y0+1,0,0,skin.echo.width,skin.echo.height);}
      const thumbnail=document.createElement('canvas');thumbnail.width=thumbnail.height=225;
      const scale=Math.min(195/sprite.width,195/sprite.height);thumbnail.getContext('2d').drawImage(sprite,(225-sprite.width*scale)/2,(225-sprite.height*scale)/2,sprite.width*scale,sprite.height*scale);
      skin.thumbnail=thumbnail.toDataURL('image/png');skin.ready=true;installWearables();
    };image.src=skin.source;
  }
  function installWearables(){
    if(destroyed)return;
    if(!pickerInstalled&&typeof window.DialogInventoryBuild==='function'&&typeof window.DialogInventorySort==='function'){
      wearableMod.hookFunction('DialogInventoryBuild',0,(args,next)=>{const previous=buildContext;buildContext={character:args[0],group:args[1],locks:!!args[3]};try{return next(args);}finally{buildContext=previous;}});
      wearableMod.hookFunction('DialogInventorySort',0,(args,next)=>{if(buildContext)addWearableChoices(window,buildContext.character,buildContext.group,buildContext.locks);return next(args);});
      pickerInstalled=true;
    }
    if(!previewInstalled&&['DrawItemPreview','DrawAssetPreview','DrawPreviewBox'].every(k=>typeof window[k]==='function')){
      wearableMod.hookFunction('DrawItemPreview',0,(args,next)=>{const previous=previewItem;previewItem=args[0];try{return next(args);}finally{previewItem=previous;}});
      wearableMod.hookFunction('DrawAssetPreview',0,(args,next)=>{
        const variant=wearableVariant(previewItem),skin=skinDefinitions.find(s=>s.name===variant?.name),[x,y,asset,options]=args;
        if(!skin?.ready||previewItem.Asset!==asset||window.CharacterAppearanceItemIsHidden?.(asset.Name,asset.DynamicGroupName||asset.Group.Name))return next(args);
        return window.DrawPreviewBox(x,y,skin.thumbnail,variant.name,options);
      });previewInstalled=true;
    }
    for(const skin of skinDefinitions){
      if(!skin.ready||skin.installed||typeof window.AssetGet!=='function'||!player())continue;
      const asset=window.AssetGet(player().AssetFamily,skin.group,skin.asset);if(!asset)continue;
      const beforeKey='Assets'+skin.group+skin.asset+'BeforeDraw',afterKey='Assets'+skin.group+skin.asset+'AfterDraw';
      const oldBefore=window[beforeKey],oldAfter=window[afterKey],flagBefore=asset.DynamicBeforeDraw,flagAfter=asset.DynamicAfterDraw;
      const opacities=new WeakMap();const alphaSprites=new Map();
      const before=data=>{
        const result=typeof oldBefore==='function'?oldBefore(data):undefined;
        if(destroyed||wearableVariant(data.CA)?.name!==skin.name||!(skin.layers?skin.layers.includes(data.L):!skin.keep.includes(data.L)))return result;
        opacities.set(data.CA,num(result?.Opacity??data.Opacity,1,0,1));return {...result,Opacity:0};
      };
      const after=data=>{
        if(typeof oldAfter==='function')oldAfter(data);
        if(destroyed||wearableVariant(data.CA)?.name!==skin.name||!(skin.drawLayers||[skin.drawLayer]).includes(data.L))return;
        const alpha=Math.round((opacities.get(data.CA)??1)*100)/100;
        const echo=(skin.echo||skin.echoSprite)&&data.C?.Appearance?.some(i=>i.Asset.Group.Name==='BodyStyle'&&i.Asset.Name==='EchoV2');
        let sprite=echo?skin.echoSprite:skin.sprite;const alphaKey=(echo?'echo:':'base:')+alpha;
        if(alpha!==1){if(!alphaSprites.has(alphaKey)){const a=document.createElement('canvas');a.width=sprite.width;a.height=sprite.height;const c=a.getContext('2d');c.globalAlpha=alpha;c.drawImage(sprite,0,0);alphaSprites.set(alphaKey,a);}sprite=alphaSprites.get(alphaKey);}
        const fit=echo&&skin.echo?skin.echo:skin;const x=data.X+fit.x,y=data.Y+fit.y-(skin.centerY?sprite.height/2:0);
        data.drawCanvas(sprite,x,y,data.AlphaMasks);data.drawCanvasBlink(sprite,x,y,data.AlphaMasks);
      };
      window[beforeKey]=before;window[afterKey]=after;asset.DynamicBeforeDraw=asset.DynamicAfterDraw=true;skin.installed=true;
      skinRestorers.push(()=>{if(window[beforeKey]===before){if(oldBefore)window[beforeKey]=oldBefore;else delete window[beforeKey];asset.DynamicBeforeDraw=flagBefore;}if(window[afterKey]===after){if(oldAfter)window[afterKey]=oldAfter;else delete window[afterKey];asset.DynamicAfterDraw=flagAfter;}});
      refreshWearableCanvases();
    }
  }
  function removeWearables(){wearableMod.unload();for(const restore of skinRestorers)restore();refreshWearableCanvases();}
  const wearableTimer=setInterval(installWearables,1000);installWearables();


  let wardrobeHooksInstalled=false,wardrobePreviewContext=null;
  function isReverieClothing(item){const variant=wearableVariant(item);return variant&&(variant.group==='Suit'||variant.group==='SuitLower');}
  function applyWardrobeCraft(C,item){
    if(!isReverieClothing(item))return;
    window.InventoryCraft(player(),C,item.Asset.Group.Name,JSON.parse(JSON.stringify(item.Craft)),false,true,false);
  }
  function installWardrobeHooks(){
    if(wardrobeHooksInstalled||!['AppearanceClick','AppearanceInventoryBuild','CharacterAppearanceSetItem','InventoryCraft','AppearancePreviewBuild','CharacterLoadSimple'].every(k=>typeof window[k]==='function'))return;
    wearableMod.hookFunction('AppearanceClick',10,(args,next)=>{
      const C=window.CharacterAppearanceSelection,group=window.CharacterAppearanceSelectedGroup;
      if(!C||!group||window.CharacterAppearanceMode!=='Cloth'||window.DialogFocusItem!=null||window.MouseYIn?.(25,90))return next(args);
      const entries=window.AppearanceInventoryBuild(),offset=window.DialogInventoryOffset||0,count=window.CharacterAppearanceNumClothPerPage||9;
      let chosen=null;
      for(let i=offset;i<entries.length&&i<offset+count;i++){const slot=i-offset;if(window.MouseIn(1250+(slot%3)*250,125+Math.floor(slot/3)*300,225,275)){chosen=entries[i];break;}}
      const current=window.InventoryGet(C,group.Name);
      const restoreOrdinary=isReverieClothing(current)&&chosen?.Asset===current.Asset&&!chosen.Craft;
      if(!isReverieClothing(chosen)&&!restoreOrdinary)return next(args);
      if(window.WardrobeGroupAccessible&&!window.WardrobeGroupAccessible(C,group))return;
      if(window.AppearanceGroupAllowed&&!window.AppearanceGroupAllowed(C,group.Name))return;
      if(window.InventoryBlockedOrLimited(C,chosen)||!window.InventoryAllow(C,chosen.Asset)||(chosen.Craft&&!window.DialogCanUseCraftedItem(C,chosen.Craft,chosen.Asset)))return;
      if(isReverieClothing(current)&&current.Craft.Name===chosen.Craft?.Name&&current.Asset===chosen.Asset&&current.Asset.Extended)return next(args);
      if(current?.Property?.LockedBy)return;
      const craft=chosen.Craft?JSON.parse(JSON.stringify(chosen.Craft)):null;
      if(craft&&(window.CraftingValidate(craft,chosen.Asset,false,true,false)===0||craft.Disabled))return;
      window.CharacterAppearanceSetItem(C,group.Name,chosen.Asset,craft?craft.Color.split(','):null);
      if(craft)applyWardrobeCraft(C,{...chosen,Craft:craft});
      window.CharacterRefresh(C);window.DialogInventoryBuild(C,group);window.AppearancePreviewBuild(C,group,true);window.AppearanceMenuBuild(C,group);
    });
    wearableMod.hookFunction('AppearancePreviewBuild',0,(args,next)=>{
      const previous=wardrobePreviewContext;
      wardrobePreviewContext={entries:window.AppearanceInventoryBuild().slice(window.DialogInventoryOffset||0,(window.DialogInventoryOffset||0)+(window.CharacterAppearanceNumClothPerPage||9)),index:0,current:null};
      try{return next(args);}finally{wardrobePreviewContext=previous;}
    });
    wearableMod.hookFunction('CharacterLoadSimple',0,(args,next)=>{
      const ctx=wardrobePreviewContext;
      if(ctx&&typeof args[0]==='string'&&args[0].startsWith('AppearancePreview-')){
        ctx.current=ctx.entries[ctx.index++];
        if(isReverieClothing(ctx.current)){ctx.currentId=args[0]+'-HypnoReverie';return next([ctx.currentId,...args.slice(1)]);}
        ctx.currentId=args[0];
      }
      return next(args);
    });
    wearableMod.hookFunction('CharacterAppearanceSetItem',0,(args,next)=>{
      const result=next(args),ctx=wardrobePreviewContext;
      if(ctx&&args[0]?.CharacterID===ctx.currentId&&ctx.current?.Asset===args[2]&&isReverieClothing(ctx.current))applyWardrobeCraft(args[0],ctx.current);
      return result;
    });
    wardrobeHooksInstalled=true;
  }

  const catsuitCache=new Map();let catsuitHooksInstalled=false;
  // Pre-fitted bolero layers per breast size: cleaned latex outline and the strap set (collar O-ring,
  // buckle, centre strap, under-bust O-ring and strap, arm buckle, tail). Native metal layer is replaced.
  const BOLERO_LAYERS={Small:{Leather:ASSET_BASE+"hr-7e06fd374025.webp",Belts:ASSET_BASE+"hr-0ed1593625d8.webp"},Normal:{Leather:ASSET_BASE+"hr-84c7a10124b0.webp",Belts:ASSET_BASE+"hr-11bedf612cc4.webp"},Large:{Leather:ASSET_BASE+"hr-d437d81cf0f8.webp",Belts:ASSET_BASE+"hr-014c0728a80a.webp"},XLarge:{Leather:ASSET_BASE+"hr-d35f7ff44b35.webp",Belts:ASSET_BASE+"hr-22f264abb5c2.webp"}};
  const boleroLayerCache=new Map();
  function boleroLayer(size,layer,C){
    const key=size+'/'+layer;let entry=boleroLayerCache.get(key);
    if(!entry){entry={ready:false,characters:new Set()};boleroLayerCache.set(key,entry);const image=hrImage();
      image.onload=()=>{if(destroyed)return;entry.image=image;entry.ready=true;const waiting=[...entry.characters];entry.characters.clear();for(const c of waiting)window.CharacterLoadCanvas?.(c);};
      image.onerror=()=>{entry.failed=true;entry.characters.clear();};image.src=BOLERO_LAYERS[size][layer];}
    if(!entry.ready&&!entry.failed&&C)entry.characters.add(C);
    return entry.ready?entry.image:null;
  }
  const boleroArtPromise=new Promise(resolve=>{
    const image=hrImage();image.onload=()=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);
      const p=x.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=0,bottom=0;
      for(let y=0;y<c.height;y++)for(let z=0;z<c.width;z++)if(p[(y*c.width+z)*4+3]>12){left=Math.min(left,z);top=Math.min(top,y);right=Math.max(right,z);bottom=Math.max(bottom,y);}
      const crop=document.createElement('canvas');crop.width=right-left+1;crop.height=bottom-top+1;crop.getContext('2d').drawImage(c,left,top,crop.width,crop.height,0,0,crop.width,crop.height);resolve(crop);
    };image.onerror=()=>resolve(null);image.src=BOLERO_IMAGE;
  });
  function isReverieCatsuit(item){return !!isReverieClothing(item);}
  function garmentMaterial(image,bolero,art,fallback=false){
    const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
    const original=ctx.getImageData(0,0,c.width,c.height),p=original.data;let left=c.width,top=c.height,right=0,bottom=0;
    const alpha=new Uint8Array(c.width*c.height);
    for(let i=0;i<p.length;i+=4){alpha[i/4]=p[i+3];if(!p[i+3])continue;const x=(i/4)%c.width,y=Math.floor(i/4/c.width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      const light=Math.max(p[i],p[i+1],p[i+2])/255,v=3+220*Math.pow(light,bolero||fallback?12:2.65);p[i]=Math.min(245,v);p[i+1]=Math.min(250,v*1.015);p[i+2]=Math.min(255,v*1.035);
    }
    ctx.putImageData(original,0,0);
    if(bolero&&art){
      // Retain the native collar, shoulder outline and size-specific breast opening.
      // The generated artwork supplies the surface; the game supplies its exact silhouette.
      const fitted=document.createElement('canvas');fitted.width=c.width;fitted.height=c.height;const fc=fitted.getContext('2d');
      fc.drawImage(art,left,top,right-left+1,bottom-top+1);
      const ap=fc.getImageData(0,0,c.width,c.height),src=new Uint8ClampedArray(ap.data),dst=ap.data,anchor=80;
      // The concept's collar is taller than the game's. Align each shoulder column's
      // first painted pixel with the native outline; blend back into unchanged art below.
      for(let x=left;x<=right;x++){
        if(Math.abs(x-(left+right)/2)<14)continue;
        let sourceTop=-1,targetTop=-1;
        for(let y=0;y<anchor;y++){const i=(y*c.width+x)*4;if(sourceTop<0&&src[i+3]>12)sourceTop=y;if(targetTop<0&&alpha[y*c.width+x]>12)targetTop=y;}
        if(sourceTop<0||targetTop<0||sourceTop<=targetTop)continue;
        for(let y=targetTop;y<anchor;y++){
          const sy=sourceTop+(y-targetTop)*(anchor-sourceTop)/(anchor-targetTop),y0=Math.floor(sy),t=sy-y0,i=(y*c.width+x)*4,j=(y0*c.width+x)*4,k=((y0+1)*c.width+x)*4;
          for(let channel=0;channel<4;channel++)dst[i+channel]=src[j+channel]*(1-t)+src[k+channel]*t;
        }
      }
      fc.putImageData(ap,0,0);ctx.drawImage(fitted,0,0);
      const result=ctx.getImageData(0,0,c.width,c.height),q=result.data,center=(left+right)/2;
      for(let i=0;i<q.length;i+=4){q[i+3]=alpha[i/4];const x=(i/4)%c.width;if(Math.abs(x-center)<6&&q[i+3]){const v=5+original.data[i]*.08;q[i]=q[i+1]=q[i+2]=v;}}
      ctx.putImageData(result,0,0); // Native belts and hardware are rendered in their own layers.
      // Close the narrow neck-to-shoulder gaps on EchoV2 without changing the chest opening.
      const shoulder=document.createElement('canvas');shoulder.width=c.width;shoulder.height=c.height;shoulder.getContext('2d').drawImage(c,0,0);
      ctx.save();ctx.beginPath();ctx.rect(166,20,19,12);ctx.rect(215,20,20,12);ctx.clip();ctx.globalCompositeOperation='destination-over';
      for(const dx of [-1,0,1])ctx.drawImage(shoulder,dx,-3);
      ctx.restore();
      // Use a shallow rounded collar rim rather than a pointed jaw-shaped extension.
      // Anchor the lower collar so it remains joined to the fitted shoulders.
      const collar=ctx.getImageData(0,0,c.width,c.height),before=new Uint8ClampedArray(collar.data);
      for(let x=182;x<=218;x++){
        const topY=12+6*(1-Math.pow(Math.abs(x-200)/18,2));
        let sourceTop=18;while(sourceTop<35&&before[(sourceTop*c.width+x)*4+3]<128)sourceTop++;
        for(let y=Math.ceil(topY);y<40;y++){
          const sy=sourceTop+(y-topY)*(40-sourceTop)/(40-topY),y0=Math.floor(sy),t=sy-y0,i=(y*c.width+x)*4,j=(y0*c.width+x)*4,k=((y0+1)*c.width+x)*4;
          for(let channel=0;channel<4;channel++)collar.data[i+channel]=before[j+channel]*(1-t)+before[k+channel]*t;
        }
      }
      ctx.putImageData(collar,0,0);
    }
    return c;
  }
  function garmentTexture(url,bolero,C){
    let entry=catsuitCache.get(url);
    if(entry){if(!entry.ready&&!entry.failed)entry.characters.add(C);return entry.ready?entry.canvas:null;}
    if(catsuitCache.size>=192){const old=[...catsuitCache].find(([,v])=>v.ready||v.failed);if(old)catsuitCache.delete(old[0]);}
    entry={characters:new Set([C])};catsuitCache.set(url,entry);
    const image=hrImage();image.crossOrigin='anonymous';image.onload=async()=>{const art=bolero?await boleroArtPromise:null;if(destroyed)return;
      try{entry.canvas=garmentMaterial(image,bolero,art,url.includes('SeamlessCatsuit_'));entry.ready=true;}catch(error){entry.failed=true;console.warn('[Hypno Reverie] Garment fitting failed; native artwork retained.',error);}
      const waiting=[...entry.characters];entry.characters.clear();if(entry.ready)for(const character of waiting)window.CharacterLoadCanvas?.(character);
    };image.onerror=()=>{entry.failed=true;entry.characters.clear();};image.src=url;return null;
  }

  // Higgsfield catsuit: one render per game layer (pose, breast size, Top/Bottom). Each is drawn at its
  // own spot and clipped to the game layer's outline; nothing is moved or warped.
  const CATSUIT_LAYERS={"Suit//Large/Base":[146,207,ASSET_BASE+"hr-463370f42b51.webp"],"Suit//Large/Sleeves":[149,373,ASSET_BASE+"hr-33235aacf1d9.webp"],"Suit//Normal/Base":[146,207,ASSET_BASE+"hr-a32df24fa7ce.webp"],"Suit//Normal/Sleeves":[149,373,ASSET_BASE+"hr-e3c3ae80ad3a.webp"],"Suit//Small/Base":[149,207,ASSET_BASE+"hr-c9c0259f028f.webp"],"Suit//Small/Sleeves":[151,373,ASSET_BASE+"hr-719cea7f4cd4.webp"],"Suit//XLarge/Base":[143,207,ASSET_BASE+"hr-96f90a2fc723.webp"],"Suit//XLarge/Sleeves":[147,373,ASSET_BASE+"hr-f1873a393207.webp"],"Suit/AllFours/Large/Base":[145,189,ASSET_BASE+"hr-183c97ce9984.webp"],"Suit/AllFours/Normal/Base":[147,189,ASSET_BASE+"hr-2a14327e2302.webp"],"Suit/AllFours/Small/Base":[149,189,ASSET_BASE+"hr-0901c51faa2b.webp"],"Suit/AllFours/XLarge/Base":[145,189,ASSET_BASE+"hr-e59a8a2eab11.webp"],"Suit/BackBoxTie/Large/Base":[146,207,ASSET_BASE+"hr-02dc540a2894.webp"],"Suit/BackBoxTie/Normal/Base":[146,207,ASSET_BASE+"hr-f7a662c4a90f.webp"],"Suit/BackBoxTie/Small/Base":[148,207,ASSET_BASE+"hr-6983ac89b2b8.webp"],"Suit/BackBoxTie/XLarge/Base":[142,207,ASSET_BASE+"hr-28644bfe6e77.webp"],"Suit/BackCuffs/Large/Base":[160,207,ASSET_BASE+"hr-7f8dc1c3a48f.webp"],"Suit/BackCuffs/Normal/Base":[160,207,ASSET_BASE+"hr-2dcede422383.webp"],"Suit/BackCuffs/Small/Base":[162,207,ASSET_BASE+"hr-2b056e0eda83.webp"],"Suit/BackCuffs/XLarge/Base":[158,207,ASSET_BASE+"hr-9938c69cd662.webp"],"Suit/BackElbowTouch/Large/Base":[160,207,ASSET_BASE+"hr-74e9422d09f9.webp"],"Suit/BackElbowTouch/Normal/Base":[160,207,ASSET_BASE+"hr-86d35722b224.webp"],"Suit/BackElbowTouch/Small/Base":[162,207,ASSET_BASE+"hr-a001f79dc960.webp"],"Suit/BackElbowTouch/XLarge/Base":[158,207,ASSET_BASE+"hr-4875edcf7c2c.webp"],"Suit/Hogtied/Large/Base":[160,177,ASSET_BASE+"hr-9c80e4bedc96.webp"],"Suit/Hogtied/Normal/Base":[160,177,ASSET_BASE+"hr-e88cdce70042.webp"],"Suit/Hogtied/Small/Base":[162,177,ASSET_BASE+"hr-dd6f3849a37c.webp"],"Suit/Hogtied/XLarge/Base":[155,177,ASSET_BASE+"hr-aa56e49c0548.webp"],"Suit/OverTheHead/Large/Base":[87,62,ASSET_BASE+"hr-755fd78ecb3b.webp"],"Suit/OverTheHead/Normal/Base":[87,63,ASSET_BASE+"hr-12724d389dd0.webp"],"Suit/OverTheHead/Small/Base":[87,63,ASSET_BASE+"hr-ea83e1ee9337.webp"],"Suit/OverTheHead/XLarge/Base":[87,62,ASSET_BASE+"hr-855171394264.webp"],"Suit/Yoked/Large/Base":[57,201,ASSET_BASE+"hr-04cad47fdf62.webp"],"Suit/Yoked/Normal/Base":[60,201,ASSET_BASE+"hr-ebcae34661ed.webp"],"Suit/Yoked/Small/Base":[60,201,ASSET_BASE+"hr-c3eb0abbffc1.webp"],"Suit/Yoked/XLarge/Base":[57,201,ASSET_BASE+"hr-17ffc76d0e5c.webp"],"SuitLower//Large/Base":[55,0,ASSET_BASE+"hr-e8d71ff04c4c.webp"],"SuitLower//Normal/Base":[56,0,ASSET_BASE+"hr-52edb6c120cb.webp"],"SuitLower//Small/Base":[57,0,ASSET_BASE+"hr-83ddd8222223.webp"],"SuitLower//XLarge/Base":[50,0,ASSET_BASE+"hr-2900f954df65.webp"],"SuitLower/Kneel/Large/Base":[55,0,ASSET_BASE+"hr-002cb728fd86.webp"],"SuitLower/Kneel/Normal/Base":[63,0,ASSET_BASE+"hr-34b62ffcf775.webp"],"SuitLower/Kneel/Small/Base":[66,0,ASSET_BASE+"hr-c494b3b9596d.webp"],"SuitLower/Kneel/XLarge/Base":[52,0,ASSET_BASE+"hr-00faf4635d84.webp"],"SuitLower/KneelingSpread/Large/Base":[0,0,ASSET_BASE+"hr-346c9805ddaa.webp"],"SuitLower/KneelingSpread/Normal/Base":[0,0,ASSET_BASE+"hr-783a8135628c.webp"],"SuitLower/KneelingSpread/Small/Base":[4,0,ASSET_BASE+"hr-e995fc4e9d01.webp"],"SuitLower/KneelingSpread/XLarge/Base":[0,0,ASSET_BASE+"hr-5cffc4a773d0.webp"],"SuitLower/LegsClosed/Large/Base":[56,0,ASSET_BASE+"hr-c8a889171141.webp"],"SuitLower/LegsClosed/Normal/Base":[63,0,ASSET_BASE+"hr-53ab357c5fab.webp"],"SuitLower/LegsClosed/Small/Base":[66,0,ASSET_BASE+"hr-0b95ae06e29f.webp"],"SuitLower/LegsClosed/XLarge/Base":[52,0,ASSET_BASE+"hr-22fcc9a476ca.webp"],"SuitLower/Spread/Large/Base":[32,0,ASSET_BASE+"hr-75a608d69ac1.webp"],"SuitLower/Spread/Normal/Base":[34,0,ASSET_BASE+"hr-e550432be439.webp"],"SuitLower/Spread/Small/Base":[36,0,ASSET_BASE+"hr-5484be2b9cd6.webp"],"SuitLower/Spread/XLarge/Base":[34,0,ASSET_BASE+"hr-38a43a2b8229.webp"]};
  const catsuitLayerImages=new Map();
  function catsuitLayerImage(key){let p=catsuitLayerImages.get(key);if(!p){const img=hrImage();p=new Promise((res,rej)=>{img.onload=()=>res(img);img.onerror=rej;});img.src=CATSUIT_LAYERS[key][2];catsuitLayerImages.set(key,p);}return p;}
  function catsuitLayerKey(group,pose,size,layer){const kind=layer.startsWith('Sleeves')?'Sleeves':'Base';const key=group+'/'+(pose||'')+'/'+size+'/'+kind;return CATSUIT_LAYERS[key]?key:null;}
  // Returns a canvas when ready, null while loading, false if it failed (caller falls back to the restyle).
  function catsuitLayerTexture(url,key,C){
    const cacheKey='layer:'+url;let entry=catsuitCache.get(cacheKey);
    if(entry){if(entry.failed)return false;if(!entry.ready)entry.characters.add(C);return entry.ready?entry.canvas:null;}
    entry={characters:new Set([C])};catsuitCache.set(cacheKey,entry);
    const nativeImage=new Promise((res,rej)=>{const n=hrImage();n.crossOrigin='anonymous';n.onload=()=>res(n);n.onerror=rej;n.src=url;});
    Promise.all([catsuitLayerImage(key),nativeImage]).then(([art,n])=>{
      if(destroyed)return;const c=document.createElement('canvas');c.width=n.width;c.height=n.height;const x=c.getContext('2d');
      x.fillStyle='#070709';x.fillRect(0,0,c.width,c.height);x.drawImage(art,CATSUIT_LAYERS[key][0],CATSUIT_LAYERS[key][1]);
      x.globalCompositeOperation='destination-in';x.drawImage(n,0,0);entry.canvas=c;entry.ready=true;
    }).catch(error=>{entry.failed=true;console.warn('[Hypno Reverie] Catsuit layer art failed; using the restyle.',error);})
    .finally(()=>{const waiting=[...entry.characters];entry.characters.clear();for(const ch of waiting)window.CharacterLoadCanvas?.(ch);});
    return null;
  }
  function installCatsuitHooks(){
    if(destroyed)return;installWardrobeHooks();
    if(catsuitHooksInstalled||typeof window.CommonDrawAppearanceBuild!=='function'||typeof window.CharacterAppearanceSortLayers!=='function')return;
    wearableMod.hookFunction('CharacterAppearanceSortLayers',0,(args,next)=>{
      const C=args[0],original=C.DrawAppearance;if(!original?.some(isReverieClothing))return next(args);
      const assets=new Map();C.DrawAppearance=original.map(item=>{
        if(!isReverieClothing(item))return item;
        const asset={...item.Asset};assets.set(asset,item.Asset);
        asset.Layer=item.Asset.Layer.map(layer=>{
          const map={...layer.PoseMapping};
          if(asset.Group.Name==='Suit'&&['Base','Base_Transparent','Zip','Zip_Transparent','PP'].includes(layer.Name))map.AllFours=original.some(i=>i.Asset.Group.Name==='BodyStyle'&&i.Asset.Name==='EchoV2')?'Hogtied':'AllFours';
          if(asset.Group.Name==='SuitLower'&&['Base','Base_Transparent'].includes(layer.Name))map.Hogtied='Hogtied';
          return {...layer,Asset:asset,PoseMapping:map};
        });return {...item,Asset:asset};
      });try{return next(args).map(layer=>assets.has(layer.Asset)?{...layer,Asset:assets.get(layer.Asset)}:layer);}finally{C.DrawAppearance=original;}
    });
    wearableMod.hookFunction('CommonDrawAppearanceBuild',0,(args,next)=>{
      const [C,callbacks]=args,selected=new Map((C.Appearance||[]).filter(i=>{const v=wearableVariant(i);return v&&(v.group==='Suit'||v.group==='SuitLower'||v.group==='ItemArms');}).map(i=>[i.Asset.Group.Name,i]));
      if(!selected.size)return next(args);
      const wrapped={...callbacks};
      for(const name of ['drawImage','drawImageBlink','drawImageColorize','drawImageColorizeBlink'])wrapped[name]=(src,x,y,options)=>{
        if(typeof src!=='string')return callbacks[name](src,x,y,options);
        const suit=src.match(/\/(Suit|SuitLower)\/(?:([A-Za-z]+)\/)?LatexCatsuit_(Small|Normal|Large|XLarge)_(Base(?:_Transparent)?|Sleeves(?:_Transparent)?|Shine(?:_Transparent)?)\.png$/);
        const boleroLayerMatch=src.match(/\/ItemArms\/(?:[^/]+\/)?Bolero_(Small|Normal|Large|XLarge)_(Leather|Belts|Metal)\.png$/);
        if(boleroLayerMatch&&selected.has('ItemArms')){
          if(boleroLayerMatch[2]==='Metal')return;
          const fitted=boleroLayer(boleroLayerMatch[1],boleroLayerMatch[2],C);if(!fitted)return callbacks[name](src,x,y,options);
          const opts={...options};delete opts.HexColor;return callbacks[name.includes('Blink')?'drawImageBlink':'drawImage'](fitted,x,y,opts);
        }
        const bolero=false;
        if((!suit||!selected.has(suit[1]))&&(!bolero||!selected.has('ItemArms')))return callbacks[name](src,x,y,options);
        const fallback=suit&&suit[1]==='SuitLower'&&src.includes('/Hogtied/');
        const layerKey=suit&&!fallback?catsuitLayerKey(suit[1],suit[2],suit[3],suit[4].startsWith('Shine')?'Base':suit[4]):null;
        if(layerKey){if(suit[4].startsWith('Shine'))return;const t=catsuitLayerTexture(src,layerKey,C);if(t){const o={...options};delete o.HexColor;return callbacks[name.includes('Blink')?'drawImageBlink':'drawImage'](t,x,y,o);}if(t===null)return callbacks[name](src,x,y,options);}
        const url=fallback?src.replace(/LatexCatsuit_(Small|Normal|Large|XLarge)_Base(?:_Transparent)?\.png$/,'SeamlessCatsuit_$1.png'):src;
        const texture=garmentTexture(url,bolero,C);if(!texture)return callbacks[name](url,x,y,options);
        const opts={...options};delete opts.HexColor;if(fallback&&suit[4].endsWith('_Transparent'))opts.Alpha=(opts.Alpha??1)*.3;
        return callbacks[name.includes('Blink')?'drawImageBlink':'drawImage'](texture,x,y,opts);
      };
      return next([C,wrapped,...args.slice(2)]);
    });catsuitHooksInstalled=true;
  }
  installCatsuitHooks();

  const catsuitTimer=setInterval(installCatsuitHooks,1000);
  const audioTimer=setInterval(syncAudio,100);
  const layoutTimer = setInterval(layout, 200), networkTimer = setInterval(networkTick, 1000);
  addEventListener('resize', layout); addEventListener('scroll', layout, true); document.addEventListener('visibilitychange', layout);
  window.HypnoReverie = { version: VERSION, open, stop,
    destroy() {
      stop(); destroyed = true; removeMessageHandler(); clearInterval(wearableTimer);clearInterval(catsuitTimer);catsuitCache.clear();boleroLayerCache.clear();removeWearables();cancelAnimationFrame(frameId); clearInterval(layoutTimer); clearInterval(networkTimer);
      clearInterval(audioTimer);disposeAudio(audioGraph,true);audioGraph=null;audioContext?.close().catch(()=>{});windowObserver.disconnect(); attachSocket(null); document.removeEventListener('keydown', keydown, true);for(const type of ['pointerdown','keydown','touchstart'])document.removeEventListener(type,gestureAudio,true);
      removeEventListener('resize', layout); removeEventListener('scroll', layout, true); document.removeEventListener('visibilitychange', layout);
      try{if(inPreferences)leavePreferences();if(prefRegistered)delete PreferenceExtensionsSettings.HypnoReverie;}catch{}
      profileButton?.remove(); host.remove(); delete window.HypnoReverie;
    } };
  refreshFields(); layout(); networkTick(); frameId = requestAnimationFrame(render);
})();
