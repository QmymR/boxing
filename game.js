/* 握拳出击 —— 手势拳击小游戏
 * 左手握拳 → 打左边来的敌人；右手握拳 → 打右边来的敌人。
 * 敌人贴身会打你一拳，被打 3 次即失败。
 * 键盘备用：A / ← 打左，D / → 打右。
 */
(() => {
  "use strict";

  /* ---------------- 基础 ---------------- */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const el = {
    menu: document.getElementById("menu"),
    settings: document.getElementById("settings"),
    over: document.getElementById("over"),
    overTitle: document.getElementById("overTitle"),
    overSub: document.getElementById("overSub"),
    btnStart: document.getElementById("btnStart"),
    btnAgain: document.getElementById("btnAgain"),
    btnSettings: document.getElementById("btnSettings"),
    btnBack: document.getElementById("btnBack"),
    hearts: document.getElementById("hearts"),
    score: document.getElementById("score"),
    combo: document.getElementById("combo"),
    camWrap: document.getElementById("camWrap"),
    cam: document.getElementById("cam"),
    dotL: document.getElementById("dotL"),
    dotR: document.getElementById("dotR"),
    toast: document.getElementById("toast"),
    mTitle: document.getElementById("mTitle"),
    mSub: document.getElementById("mSub"),
    mRules: document.getElementById("mRules"),
    mNote: document.getElementById("mNote"),
    sTitle: document.getElementById("sTitle"),
    sLangLabel: document.getElementById("sLangLabel"),
    sVolLabel: document.getElementById("sVolLabel"),
    sVolVal: document.getElementById("sVolVal"),
    volRange: document.getElementById("volRange"),
    langSeg: document.getElementById("langSeg"),
    labHp: document.getElementById("labHp"),
    pause: document.getElementById("pause"),
    pauseTitle: document.getElementById("pauseTitle"),
    pauseSub: document.getElementById("pauseSub"),
    pauseNote: document.getElementById("pauseNote"),
    btnPause: document.getElementById("btnPause"),
    btnResume: document.getElementById("btnResume"),
    btnPauseSettings: document.getElementById("btnPauseSettings"),
    btnQuit: document.getElementById("btnQuit"),
  };

  const MP = {
    bundle: "./vendor/mediapipe/vision_bundle.mjs",
    bundleAlt: "./vendor/mediapipe/vision_bundle.js",
    wasm: "./vendor/mediapipe/wasm",
    model: "./vendor/models/hand_landmarker.task",
  };

  const MAX_HP = 3;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ---------------- 多语言 ---------------- */
  const I18N = {
    zh: {
      title: "握拳出击",
      sub: "用双手握拳挥向来敌，守住你的三颗心",
      rules: [
        "<b>握拳挥出</b>即可出拳：左手打左来的敌人，右手打右来的敌人",
        "敌人逼近到身前会打你一下，<b>被打三次即失败</b>",
        "来不及的话：键盘 <b>A / ←</b> 打左，<b>D / →</b> 打右",
      ],
      startBtn: "开 始 游 戏",
      settingsBtn: "设 置",
      settingsTitle: "设 置",
      langLabel: "语言 / Language",
      volLabel: "音量",
      backBtn: "返 回",
      note: "首次启动请允许摄像头权限 · 需要 http://localhost 访问",
      hpLabel: "生命",
      dotL: "左",
      dotR: "右",
      hint: "双手握拳挥出 → 打同侧的敌人",
      ready: "手势已就绪，握拳试试",
      camFail: "摄像头/手势不可用 · 改用键盘 A / D 出拳",
      libReady: "手势库就绪 · 点击开始并允许摄像头",
      libFail: "手势库加载失败 · 仍可用键盘 A / D 游玩",
      overTitle: "被 打 倒 了",
      overSub: n => `你击倒了 ${n} 名敌人`,
      againBtn: "再 来 一 局",
      overToast: "被打倒三次 · 再来一局",
      combo: n => `连击 × ${n}`,
      pauseTitle: "暂 停",
      pauseSub: "随时停下，调一调再上路",
      resumeBtn: "继 续",
      pauseSettingsBtn: "设 置",
      quitBtn: "退 出 本 局",
      pauseNote: "按 Esc 暂停 / 继续",
    },
    en: {
      title: "FIST UP",
      sub: "Throw fists at incoming enemies — keep all three hearts",
      rules: [
        "<b>Throw a fist</b> to punch: left hand hits the left enemy, right hand the right",
        "An enemy that reaches you lands a hit — <b>three hits and you are out</b>",
        "No camera? Keys <b>A / ←</b> punch left, <b>D / →</b> punch right",
      ],
      startBtn: "START GAME",
      settingsBtn: "SETTINGS",
      settingsTitle: "SETTINGS",
      langLabel: "Language",
      volLabel: "Volume",
      backBtn: "BACK",
      note: "Allow camera access on first launch · must be served over http://localhost",
      hpLabel: "LIVES",
      dotL: "L",
      dotR: "R",
      hint: "Throw a fist → punch the enemy on that side",
      ready: "Gesture ready — try a fist",
      camFail: "Camera unavailable · keyboard A / D still works",
      libReady: "Gesture library ready · click Start and allow camera",
      libFail: "Gesture library failed · keyboard A / D still works",
      overTitle: "D O W N",
      overSub: n => `You knocked out ${n} ${n === 1 ? "enemy" : "enemies"}`,
      againBtn: "PLAY AGAIN",
      overToast: "Three hits — have another go",
      combo: n => `COMBO × ${n}`,
      pauseTitle: "P A U S E D",
      pauseSub: "Take a breath, tune it, then jump back in",
      resumeBtn: "RESUME",
      pauseSettingsBtn: "SETTINGS",
      quitBtn: "QUIT TO MENU",
      pauseNote: "Press Esc to pause / resume",
    },
  };

  let LANG = localStorage.getItem("fistbox.lang") === "en" ? "en" : "zh";
  const t = (key, ...args) => {
    const v = I18N[LANG][key];
    return typeof v === "function" ? v(...args) : v;
  };

  function applyLang() {
    document.documentElement.lang = LANG === "en" ? "en" : "zh-CN";
    el.mTitle.textContent = t("title");
    el.mSub.textContent = t("sub");
    el.mRules.innerHTML = I18N[LANG].rules.map(r => `<li>${r}</li>`).join("");
    el.btnStart.textContent = t("startBtn");
    el.btnSettings.textContent = t("settingsBtn");
    el.mNote.textContent = t("note");
    el.sTitle.textContent = t("settingsTitle");
    el.sLangLabel.textContent = t("langLabel");
    el.sVolLabel.textContent = t("volLabel");
    el.btnBack.textContent = t("backBtn");
    el.labHp.textContent = t("hpLabel");
    el.dotL.textContent = t("dotL");
    el.dotR.textContent = t("dotR");
    el.overTitle.textContent = t("overTitle");
    el.btnAgain.textContent = t("againBtn");
    el.pauseTitle.textContent = t("pauseTitle");
    el.pauseSub.textContent = t("pauseSub");
    el.btnResume.textContent = t("resumeBtn");
    el.btnPauseSettings.textContent = t("pauseSettingsBtn");
    el.btnQuit.textContent = t("quitBtn");
    el.pauseNote.textContent = t("pauseNote");
    if (state.over) el.overSub.textContent = t("overSub", state.score);
    [...el.langSeg.children].forEach(b => b.classList.toggle("active", b.dataset.lang === LANG));
  }

  function loadSettings() {
    const saved = localStorage.getItem("fistbox.vol");
    const vol = saved == null ? 0.7 : parseFloat(saved);
    Sound.vol = Number.isFinite(vol) ? clamp(vol, 0, 1) : 0.7;
    const pct = Math.round(Sound.vol * 100);
    el.volRange.value = String(pct);
    el.sVolVal.textContent = pct + "%";
    el.volRange.style.setProperty("--fill", pct + "%");
  }

  const settingsOpen = () => !el.settings.classList.contains("hidden");

  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  /* ---------------- 声音：合成的激情 BGM + 音效 ---------------- */
  const Sound = {
    ctx: null,
    master: null,
    bgmBus: null,
    sfxBus: null,
    vol: 0.7,
    musicTimer: null,
    nextTime: 0,
    step: 0,
    bpm: 132,
    noise: null,
  };

  function initAudio() {
    if (Sound.ctx) {
      if (Sound.ctx.state === "suspended") Sound.ctx.resume();
      return Sound.ctx;
    }
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      Sound.ctx = ac;
      Sound.master = ac.createGain();
      Sound.master.gain.value = Sound.vol;
      Sound.master.connect(ac.destination);
      Sound.bgmBus = ac.createGain();
      Sound.bgmBus.gain.value = 0.62;
      Sound.bgmBus.connect(Sound.master);
      Sound.sfxBus = ac.createGain();
      Sound.sfxBus.gain.value = 0.85;
      Sound.sfxBus.connect(Sound.master);

      // 预生成噪声缓冲，军鼓 / 踩镲复用
      const len = Math.floor(ac.sampleRate * 0.16);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      Sound.noise = buf;
      if (ac.state === "suspended") ac.resume();
    } catch (_) { Sound.ctx = null; }
    return Sound.ctx;
  }

  function noiseBurst(dur, freq, gain, type = "lowpass") {
    const ac = Sound.ctx;
    if (!ac || !Sound.noise) return;
    const src = ac.createBufferSource();
    src.buffer = Sound.noise;
    src.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    src.connect(f).connect(g).connect(Sound.sfxBus);
    src.start(); src.stop(ac.currentTime + dur);
  }

  function tone(freq, dur, gain, type = "square") {
    const ac = Sound.ctx; if (!ac) return;
    const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g).connect(Sound.sfxBus);
    o.start(); o.stop(ac.currentTime + dur);
  }

  const sfxWhiff = () => noiseBurst(0.16, 900, 0.14, "highpass");
  const sfxKill = () => { noiseBurst(0.22, 320, 0.5); tone(130, 0.18, 0.32); };
  const sfxHurt = () => { tone(85, 0.22, 0.4, "sawtooth"); noiseBurst(0.3, 240, 0.4); };

  /* ---- BGM 乐器（全部合成，无音频文件） ---- */
  function bgmKick(t) {
    const ac = Sound.ctx; if (!ac) return;
    const o = ac.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(152, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.95, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(Sound.bgmBus);
    o.start(t); o.stop(t + 0.21);
  }

  function bgmSnare(t) {
    const ac = Sound.ctx; if (!ac || !Sound.noise) return;
    const src = ac.createBufferSource();
    src.buffer = Sound.noise; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1500; f.Q.value = 0.7;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(f).connect(g).connect(Sound.bgmBus);
    src.start(t); src.stop(t + 0.16);

    const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = 190;
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.26, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g2).connect(Sound.bgmBus);
    o.start(t); o.stop(t + 0.1);
  }

  function bgmHat(t, amp) {
    const ac = Sound.ctx; if (!ac || !Sound.noise) return;
    const src = ac.createBufferSource();
    src.buffer = Sound.noise; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 5200;
    const g = ac.createGain();
    g.gain.setValueAtTime(amp * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
    src.connect(f).connect(g).connect(Sound.bgmBus);
    src.start(t); src.stop(t + 0.06);
  }

  function bgmBass(t, freq) {
    const ac = Sound.ctx; if (!ac) return;
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 560; f.Q.value = 3;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(f).connect(g).connect(Sound.bgmBus);
    o.start(t); o.stop(t + 0.15);
  }

  function bgmStab(t, amp) {
    const ac = Sound.ctx; if (!ac) return;
    for (const [freq, det] of [[220, -4], [261.63, 0], [329.63, 4]]) {
      const o = ac.createOscillator(); o.type = "square"; o.frequency.value = freq;
      o.detune.value = det;
      const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.075 * amp, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      o.connect(f).connect(g).connect(Sound.bgmBus);
      o.start(t); o.stop(t + 0.2);
    }
  }

  const BASS_SEQ = [110, 110, 130.8, 98, 110, 164.8, 110, 146.8];

  function playStep(step, t) {
    if (step % 2 === 0 || step === 15) bgmKick(t);
    if (step === 4 || step === 12 || step === 14 || step === 7) bgmSnare(t);
    if (step % 2 === 1) bgmHat(t, step % 4 === 3 ? 0.34 : 0.2);
    if (step % 2 === 0) bgmBass(t, BASS_SEQ[(step / 2) % BASS_SEQ.length]);
    if (step === 0 || step === 6 || step === 10) bgmStab(t, step === 0 ? 0.9 : 0.6);
  }

  function startMusic() {
    initAudio();
    if (!Sound.ctx || Sound.musicTimer) return;
    Sound.nextTime = Sound.ctx.currentTime + 0.06;
    Sound.step = 0;
    Sound.musicTimer = setInterval(() => {
      const ac = Sound.ctx; if (!ac) return;
      const stepDur = 60 / Sound.bpm / 4;
      while (Sound.nextTime < ac.currentTime + 0.18) {
        playStep(Sound.step, Sound.nextTime);
        Sound.nextTime += stepDur;
        Sound.step = (Sound.step + 1) % 16;
      }
    }, 30);
  }

  function setVolume(pct) {
    Sound.vol = clamp(pct / 100, 0, 1);
    if (Sound.master) Sound.master.gain.value = Sound.vol;
    localStorage.setItem("fistbox.vol", String(Sound.vol));
    el.sVolVal.textContent = Math.round(pct) + "%";
    el.volRange.style.setProperty("--fill", Math.round(pct) + "%");
  }

  /* ---------------- 游戏状态 ---------------- */
  const state = {
    playing: false,
    paused: false,
    over: false,
    hp: MAX_HP,
    score: 0,
    combo: 0,
    comboAt: 0,
    time: 0,
    enemies: [],
    particles: [],
    shake: 0,
    hurtFlash: 0,
    spawnIn: 1.2,
    punch: { "-1": -99, "1": -99 },   // 每侧出拳起始时间
  };

  const player = { x: 0, y: 0, r: 46 };

  function layout() {
    player.x = W / 2;
    player.y = H * 0.62;
    player.r = clamp(Math.min(W * 0.062, H * 0.11), 34, 74);
  }

  /* ---------------- 敌人 ---------------- */
  function spawnEnemy() {
    // 优先选择当前没有近身敌人的一侧
    const nearLeft = state.enemies.some(e => e.side === -1 && e.p < 0.45);
    const nearRight = state.enemies.some(e => e.side === 1 && e.p < 0.45);
    let side;
    if (nearLeft && !nearRight) side = 1;
    else if (nearRight && !nearLeft) side = -1;
    else side = Math.random() < 0.5 ? -1 : 1;

    state.enemies.push({
      side,
      p: 0,
      speed: 0.19 + Math.min(state.score, 12) * 0.012 + rand(-0.015, 0.02),
      state: "walk",
      t: 0,
      bob: rand(0, TAU),
      walk: 0,
    });
  }

  function enemyPos(e) {
    const reachX = player.x + e.side * (player.r * 2.15);
    const farX = player.x + e.side * (W * 0.52);
    return {
      x: farX + (reachX - farX) * e.p,
      y: player.y + Math.sin(e.bob + state.time * 2.4) * 6,
    };
  }

  /* ---------------- 出拳 ---------------- */
  function punch(side, source) {
    if (!state.playing || state.over || state.paused) return;
    const now = state.time;
    if (now - state.punch[String(side)] < 0.34) return;
    state.punch[String(side)] = now;
    sfxWhiff();

    // 打这一侧已进入攻击距离、且还没被击倒的敌人
    let target = null;
    for (const e of state.enemies) {
      if (e.side !== side || e.state !== "walk" || e.p < 0.84) continue;
      if (!target || e.p > target.p) target = e;
    }
    if (target) knockOut(target);
    if (source === "gesture") pulseDot(side);
  }

  function knockOut(e) {
    e.state = "ko";
    e.t = 0;
    state.score++;
    state.combo++;
    state.comboAt = state.time;
    state.shake = Math.max(state.shake, 0.32);
    sfxKill();
    el.score.textContent = state.score;

    const pos = enemyPos(e);
    burst(pos.x, pos.y, e.side, 16);
    showCombo();
  }

  function hurtPlayer(e) {
    e.state = "attack";
    e.t = 0;
    state.hp = Math.max(0, state.hp - 1);
    state.combo = 0;
    state.shake = 0.5;
    state.hurtFlash = 0.45;
    sfxHurt();
    renderHearts();
    if (state.hp <= 0) endGame();
  }

  function burst(x, y, side, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(120, 420);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * sp + side * rand(60, 160),
        vy: Math.sin(a) * sp - rand(40, 120),
        life: rand(0.35, 0.75),
        age: 0,
        r: rand(2, 5.5),
        col: Math.random() < 0.5 ? "#ffd68a" : (side < 0 ? "#e0604f" : "#6fa3d8"),
      });
    }
  }

  /* ---------------- UI ---------------- */
  const HEART_SVG = `<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.7-9.3-9.2C1.1 7.6 3.4 4.6 6.6 4.6c2 0 3.6 1.1 4.4 2.3l1 1.5 1-1.5c.8-1.2 2.4-2.3 4.4-2.3 3.2 0 5.5 3 3.9 6.7C19.5 15.8 12 20.5 12 20.5z" fill="#e2453a"/></svg>`;

  function initHearts() {
    el.hearts.innerHTML = HEART_SVG.repeat(MAX_HP);
    renderHearts();
  }
  function renderHearts() {
    [...el.hearts.children].forEach((h, i) => {
      h.classList.toggle("lost", i >= state.hp);
    });
  }

  let comboTimer = 0;
  function showCombo() {
    if (state.combo < 2) return;
    el.combo.textContent = t("combo", state.combo);
    el.combo.classList.add("show");
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => el.combo.classList.remove("show"), 900);
  }

  let toastTimer = 0;
  function toast(text, ms = 3200) {
    el.toast.textContent = text;
    el.toast.classList.remove("hidden");
    requestAnimationFrame(() => el.toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("show");
      setTimeout(() => el.toast.classList.add("hidden"), 300);
    }, ms);
  }

  /* ---------------- 手势识别 ---------------- */
  let visionLib = null, visionFileset = null, landmarker = null;
  let camReady = false, camStream = null, lastDetect = 0;
  const fistPrev = { "-1": false, "1": false };
  let dots = { "-1": 0, "1": 0 };

  function pulseDot(side) {
    const d = side < 0 ? el.dotL : el.dotR;
    d.classList.add("on");
    setTimeout(() => d.classList.remove("on"), 160);
  }

  async function loadVisionLibrary() {
    const problems = [];
    let lib = null;
    for (const raw of [MP.bundleAlt, MP.bundle]) {
      const url = raw + "?v=1";
      try {
        lib = await import(/* @vite-ignore */ url);
        break;
      } catch (e) {
        try {
          const txt = await fetch(url, { cache: "no-store" }).then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
          });
          const blobUrl = URL.createObjectURL(new Blob([txt], { type: "text/javascript" }));
          lib = await import(/* @vite-ignore */ blobUrl);
          break;
        } catch (e2) {
          problems.push(`import(${raw}) → ${e.name}: ${e.message} ｜ blob → ${e2.name}: ${e2.message}`);
        }
      }
    }
    if (lib && !lib.FilesetResolver && typeof self.FilesetResolver === "function") {
      lib = { FilesetResolver: self.FilesetResolver, HandLandmarker: self.HandLandmarker };
    }
    if (!lib || !lib.FilesetResolver) {
      throw new Error(problems.join(" ｜ ") || "手势库缺少 FilesetResolver");
    }
    visionLib = lib;
    visionFileset = await lib.FilesetResolver.forVisionTasks(MP.wasm);
  }

  async function loadLandmarker() {
    const make = delegate => visionLib.HandLandmarker.createFromOptions(visionFileset, {
      baseOptions: { modelAssetPath: MP.model, delegate },
      runningMode: "VIDEO",
      numHands: 2,
    });
    try {
      landmarker = await make("GPU");
    } catch (_) {
      landmarker = await make("CPU");
    }
  }

  async function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: "user" },
      audio: false,
    });
    el.cam.srcObject = camStream;
    await el.cam.play();
    camReady = true;
    el.camWrap.classList.remove("hidden");
    return true;
  }

  function analyzeHand(lm) {
    const wrist = lm[0], mid = lm[9];
    const palm = Math.hypot(mid.x - wrist.x, mid.y - wrist.y) || 1e-6;
    let curled = 0;
    for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
      const d = Math.hypot(lm[tip].x - wrist.x, lm[tip].y - wrist.y);
      if (d / palm < 1.35) curled++;
    }
    // 预览画面是镜像的，所以屏幕左半 = 原始 x > 0.5
    const screenX = 1 - mid.x;
    return { fist: curled >= 3, side: screenX < 0.5 ? -1 : 1, palm };
  }

  function detectHands(now) {
    if (!landmarker || !camReady || el.cam.readyState < 2) return;
    let res;
    try { res = landmarker.detectForVideo(el.cam, now); } catch (_) { return; }
    const hands = (res && res.landmarks) || [];
    const seen = { "-1": false, "1": false };
    for (const lm of hands) {
      const info = analyzeHand(lm);
      seen[String(info.side)] = true;
      const key = String(info.side);
      // 握拳瞬间触发（需要先张开再握，避免一直握着连打）
      if (info.fist && !fistPrev[key]) {
        punch(info.side, "gesture");
        pulseDot(info.side);
      }
      fistPrev[key] = info.fist;
    }
    if (!seen["-1"]) fistPrev["-1"] = false;
    if (!seen["1"]) fistPrev["1"] = false;
  }

  /* ---------------- 更新 ---------------- */
  let lastSpawnSide = 1;

  function update(dt) {
    state.time += dt;
    state.shake = Math.max(0, state.shake - dt * 1.6);
    state.hurtFlash = Math.max(0, state.hurtFlash - dt);

    // 粒子
    for (const p of state.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.vx *= 0.98;
    }
    state.particles = state.particles.filter(p => p.age < p.life);

    // 敌人
    if (state.playing && !state.over) {
      state.spawnIn -= dt;
      if (state.spawnIn <= 0) {
        spawnEnemy();
        state.spawnIn = rand(1.25, 2.1) - Math.min(state.score * 0.02, 0.5);
      }

      for (const e of state.enemies) {
        e.t += dt;
        if (e.state === "walk") {
          // 进入近身区后减速，给玩家留出出拳反应时间
          const damp = e.p > 0.8 ? 0.72 : 1;
          e.p += e.speed * damp * dt;
          e.walk += dt;
          if (e.p >= 1) { e.p = 1; hurtPlayer(e); }
        }
      }

      // 结算动画后移除
      state.enemies = state.enemies.filter(e => {
        if (e.state === "ko") return e.t < 0.75;
        if (e.state === "attack") return e.t < 0.55;
        return true;
      });
    }
  }

  /* ---------------- 绘制 ---------------- */
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#141924");
    g.addColorStop(0.55, "#0f131b");
    g.addColorStop(1, "#080a0f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 顶部聚光
    const spot = ctx.createRadialGradient(W / 2, -H * 0.15, 10, W / 2, -H * 0.15, H * 0.85);
    spot.addColorStop(0, "rgba(120, 160, 220, 0.16)");
    spot.addColorStop(0.5, "rgba(80, 110, 170, 0.05)");
    spot.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H);

    // 地板
    const floorY = player.y + player.r * 2.0;
    const fg = ctx.createLinearGradient(0, floorY, 0, H);
    fg.addColorStop(0, "rgba(60, 75, 100, 0.22)");
    fg.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorY, W, H - floorY);

    ctx.strokeStyle = "rgba(150, 180, 220, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.stroke();

    // 两侧的擂台绳
    drawRopes(-1);
    drawRopes(1);
  }

  function drawRopes(side) {
    const x0 = side < 0 ? 0 : W;
    const x1 = side < 0 ? W * 0.16 : W * 0.84;
    for (let i = 0; i < 3; i++) {
      const y = player.y - player.r * 2.2 + i * player.r * 0.55;
      ctx.strokeStyle = "rgba(190, 80, 70, 0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y + 6);
      ctx.stroke();
    }
  }

  function punchEase(side) {
    const t0 = state.punch[String(side)];
    const u = (state.time - t0) / 0.3;
    if (u < 0 || u > 1) return 0;
    return u < 0.32 ? easeOut(u / 0.32) : 1 - easeOut((u - 0.32) / 0.68);
  }

  function drawPlayer() {
    const { x, y, r } = player;
    const u = r; // 以半径为单位

    // 地面投影
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + u * 2.05, u * 1.35, u * 0.24, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 腿
    ctx.strokeStyle = "#c9b9a3";
    ctx.lineWidth = u * 0.16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - u * 0.34, y + u * 1.1);
    ctx.lineTo(x - u * 0.42, y + u * 1.95);
    ctx.moveTo(x + u * 0.34, y + u * 1.1);
    ctx.lineTo(x + u * 0.42, y + u * 1.95);
    ctx.stroke();

    // 短裤
    ctx.fillStyle = "#3a4c68";
    roundedRect(x - u * 0.64, y + u * 0.7, u * 1.28, u * 0.62, u * 0.14);

    // 躯干
    ctx.fillStyle = "#f0dfc8";
    ctx.beginPath();
    ctx.moveTo(x - u * 0.62, y + u * 0.85);
    ctx.quadraticCurveTo(x - u * 0.78, y - u * 0.2, x - u * 0.5, y - u * 0.78);
    ctx.lineTo(x + u * 0.5, y - u * 0.78);
    ctx.quadraticCurveTo(x + u * 0.78, y - u * 0.2, x + u * 0.62, y + u * 0.85);
    ctx.closePath();
    ctx.fill();

    // 胸前号码
    ctx.fillStyle = "rgba(180, 150, 120, 0.25)";
    ctx.fillRect(x - u * 0.26, y - u * 0.3, u * 0.52, u * 0.42);

    // 头
    const headY = y - u * 1.18;
    ctx.fillStyle = "#f3e2cc";
    ctx.beginPath();
    ctx.arc(x, headY, u * 0.46, 0, TAU);
    ctx.fill();

    // 头带
    ctx.fillStyle = "#e2453a";
    ctx.beginPath();
    ctx.ellipse(x, headY - u * 0.16, u * 0.47, u * 0.16, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(x - u * 0.47, headY - u * 0.28, u * 0.94, u * 0.13);

    // 眼睛
    ctx.fillStyle = "#2a2a30";
    ctx.beginPath();
    ctx.arc(x - u * 0.16, headY + u * 0.04, u * 0.05, 0, TAU);
    ctx.arc(x + u * 0.16, headY + u * 0.04, u * 0.05, 0, TAU);
    ctx.fill();

    // 两只拳套
    for (const side of [-1, 1]) {
      const e = punchEase(side);
      const reach = u * (0.62 + e * 1.55);
      const gx = x + side * reach;
      const gy = y - u * 0.28 + side * 0 - e * u * 0.08;

      // 手臂
      ctx.strokeStyle = "#f0dfc8";
      ctx.lineWidth = u * 0.17;
      ctx.beginPath();
      ctx.moveTo(x + side * u * 0.5, y - u * 0.25);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      // 残影
      if (e > 0.2) {
        ctx.fillStyle = "rgba(255, 214, 138, 0.35)";
        ctx.beginPath();
        ctx.arc(x + side * (reach - u * 0.3), gy, u * 0.36, 0, TAU);
        ctx.fill();
      }

      // 拳套
      ctx.fillStyle = "#e2453a";
      ctx.beginPath();
      ctx.arc(gx, gy, u * 0.34, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(gx - side * u * 0.1, gy - u * 0.12, u * 0.11, 0, TAU);
      ctx.fill();

      // 出拳冲击环
      if (e > 0.55) {
        ctx.strokeStyle = `rgba(255, 214, 138, ${0.5 * (1 - (e - 0.55) / 0.45)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx, gy, u * (0.4 + (e - 0.55) * 1.4), 0, TAU);
        ctx.stroke();
      }
    }
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function drawEnemy(e) {
    const pos = enemyPos(e);
    const r = player.r * 0.92;
    const col = e.side < 0 ? "#b23c35" : "#3f6fa8";
    const colDark = e.side < 0 ? "#8a2b27" : "#2f527c";

    let alpha = 1, rot = 0, scale = 1;
    if (e.state === "ko") {
      const u = e.t / 0.75;
      alpha = 1 - u;
      rot = e.side * u * 0.9;
      scale = 1 + u * 0.15;
    } else if (e.state === "attack") {
      const u = Math.min(e.t / 0.55, 1);
      alpha = 1 - u * 0.85;
      scale = 1 + u * 0.12;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(pos.x, pos.y + r * 1.5);
    ctx.rotate(rot);
    ctx.scale(scale, scale);

    // 影子
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.18, 0, 0, TAU);
    ctx.fill();

    // 腿
    const step = Math.sin(e.walk * 9) * (e.state === "walk" ? r * 0.16 : 0);
    ctx.strokeStyle = colDark;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.3);
    ctx.lineTo(-r * 0.34 + step, 0);
    ctx.moveTo(r * 0.28, -r * 0.3);
    ctx.lineTo(r * 0.34 - step, 0);
    ctx.stroke();

    // 身体
    ctx.fillStyle = col;
    roundedRect(-r * 0.62, -r * 1.55, r * 1.24, r * 1.3, r * 0.28);

    // 拳套（朝玩家方向举起）
    const raise = e.p > 0.78 ? 1 : 0.7;
    ctx.fillStyle = colDark;
    ctx.beginPath();
    ctx.arc(-e.side * r * 0.55, -r * 1.5 - raise * r * 0.15, r * 0.3, 0, TAU);
    ctx.arc(e.side * r * 0.2, -r * 1.72 + raise * r * 0.1, r * 0.3, 0, TAU);
    ctx.fill();

    // 头
    ctx.fillStyle = "#e8c9a8";
    ctx.beginPath();
    ctx.arc(0, -r * 1.95, r * 0.5, 0, TAU);
    ctx.fill();

    // 怒眉 + 眼睛
    ctx.fillStyle = "#3a2a26";
    ctx.beginPath();
    ctx.arc(-r * 0.17, -r * 2.0, r * 0.06, 0, TAU);
    ctx.arc(r * 0.17, -r * 2.0, r * 0.06, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#3a2a26";
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 2.18);
    ctx.lineTo(-r * 0.08, -r * 2.08);
    ctx.moveTo(r * 0.3, -r * 2.18);
    ctx.lineTo(r * 0.08, -r * 2.08);
    ctx.stroke();

    ctx.restore();
  }

  function drawParticles() {
    for (const p of state.particles) {
      const a = 1 - p.age / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.save();
    if (state.shake > 0) {
      const s = state.shake * 18;
      ctx.translate(rand(-s, s), rand(-s, s));
    }
    drawBackground();

    // 敌人按 p 排序，靠近玩家的后画
    const sorted = [...state.enemies].sort((a, b) => a.p - b.p);
    for (const e of sorted) drawEnemy(e);

    drawPlayer();
    drawParticles();
    ctx.restore();

    if (state.hurtFlash > 0) {
      ctx.fillStyle = `rgba(200, 40, 30, ${state.hurtFlash * 0.55})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ---------------- 主循环 ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (state.playing && !state.paused && camReady && now - lastDetect > 33) {
      lastDetect = now;
      detectHands(now);
    }

    if (!state.paused) update(dt);
    if (state.playing) render();
    else render(); // 开始界面下也画一幅静态擂台
    requestAnimationFrame(loop);
  }

  /* ---------------- 流程 ---------------- */
  function resetState() {
    state.playing = true;
    state.over = false;
    state.paused = false;
    state.hp = MAX_HP;
    state.score = 0;
    state.combo = 0;
    state.time = 0;
    state.enemies.length = 0;
    state.particles.length = 0;
    state.shake = 0;
    state.hurtFlash = 0;
    state.spawnIn = 1.0;
    state.punch = { "-1": -99, "1": -99 };
    fistPrev["-1"] = false;
    fistPrev["1"] = false;
    el.score.textContent = "0";
    renderHearts();
    layout();
  }

  function endGame() {
    state.over = true;
    state.playing = false;
    state.paused = false;
    el.pause.classList.add("hidden");
    el.btnPause.classList.add("hidden");
    el.overSub.textContent = t("overSub", state.score);
    el.over.classList.remove("hidden");
    toast(t("overToast"), 2600);
  }

  function togglePause(force) {
    if (!state.playing || state.over) return;
    const next = typeof force === "boolean" ? force : !state.paused;
    if (next === state.paused) return;
    state.paused = next;
    el.pause.classList.toggle("hidden", !next);
    el.btnPause.classList.toggle("is-paused", next);
    el.btnPause.textContent = next ? "▶" : "❚❚";
  }

  function quitToMenu() {
    state.playing = false;
    state.over = false;
    state.paused = false;
    state.enemies.length = 0;
    state.particles.length = 0;
    state.combo = 0;
    el.pause.classList.add("hidden");
    el.over.classList.add("hidden");
    el.settings.classList.add("hidden");
    el.btnPause.classList.add("hidden");
    el.btnPause.classList.remove("is-paused");
    el.btnPause.textContent = "❚❚";
    el.combo.classList.remove("show");
    el.menu.classList.remove("hidden");
  }

  async function startGame() {
    initAudio();
    startMusic();
    el.menu.classList.add("hidden");
    el.settings.classList.add("hidden");
    el.over.classList.add("hidden");
    el.pause.classList.add("hidden");
    resetState();
    el.btnPause.classList.remove("hidden");
    el.btnPause.classList.remove("is-paused");
    el.btnPause.textContent = "❚❚";
    toast(t("hint"), 3200);

    if (!landmarker) {
      try {
        if (!visionLib) await loadVisionLibrary();
        if (!landmarker) await loadLandmarker();
        await initCamera();
        toast(t("ready"), 2600);
      } catch (e) {
        console.warn("[手势]", e);
        el.mNote.textContent = "手势不可用：" + (e.message || e);
        toast(t("camFail"), 4200);
      }
    }
  }

  /* ---------------- 输入 ---------------- */
  const KEY_LEFT = ["a", "A", "ArrowLeft", "Left"];
  const KEY_RIGHT = ["d", "D", "ArrowRight", "Right"];
  window.addEventListener("keydown", ev => {
    if (ev.key === "Escape") {
      ev.preventDefault();
      if (settingsOpen()) { closeSettings(); return; }
      if (state.playing && !state.over) togglePause();
      return;
    }
    if (settingsOpen()) return;
    if (!state.playing) {
      if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); startGame(); }
      return;
    }
    if (state.paused) {
      if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); togglePause(false); }
      return;
    }
    if (KEY_LEFT.includes(ev.key)) { ev.preventDefault(); punch(-1, "key"); }
    if (KEY_RIGHT.includes(ev.key)) { ev.preventDefault(); punch(1, "key"); }
  });

  el.btnStart.addEventListener("click", startGame);
  el.btnAgain.addEventListener("click", startGame);

  let settingsReturn = null;
  function openSettings(from) {
    initAudio();
    startMusic();
    settingsReturn = from || (state.playing ? "pause" : "menu");
    if (settingsReturn === "pause") el.pause.classList.add("hidden");
    else el.menu.classList.add("hidden");
    el.settings.classList.remove("hidden");
  }

  function closeSettings() {
    el.settings.classList.add("hidden");
    if (settingsReturn === "pause") el.pause.classList.remove("hidden");
    else if (!state.playing) el.menu.classList.remove("hidden");
    settingsReturn = null;
  }

  el.btnSettings.addEventListener("click", () => openSettings("menu"));
  el.btnBack.addEventListener("click", closeSettings);
  el.btnPause.addEventListener("click", () => togglePause());
  el.btnResume.addEventListener("click", () => togglePause(false));
  el.btnPauseSettings.addEventListener("click", () => openSettings("pause"));
  el.btnQuit.addEventListener("click", quitToMenu);

  el.langSeg.addEventListener("click", ev => {
    const btn = ev.target.closest(".seg-btn");
    if (!btn) return;
    LANG = btn.dataset.lang === "en" ? "en" : "zh";
    localStorage.setItem("fistbox.lang", LANG);
    applyLang();
  });

  el.volRange.addEventListener("input", () => {
    initAudio();
    startMusic();
    setVolume(Number(el.volRange.value));
  });

  /* ---------------- 启动 ---------------- */
  initHearts();
  loadSettings();
  applyLang();
  layout();
  render();
  requestAnimationFrame(loop);

  // 提前预热手势库（不阻塞）
  (async () => {
    try {
      await loadVisionLibrary();
      el.mNote.textContent = t("libReady");
    } catch (e) {
      console.warn("[手势库预热]", e);
      el.mNote.textContent = t("libFail");
    }
  })();
})();
