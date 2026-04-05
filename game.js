'use strict';
// ============================================================
//  DEEP MINE v2 — Minerals, Worlds, Workers, Stats
// ============================================================

// ---------- Number Formatting ----------
const SUFFIXES = ['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','UDc','DDc','TDc'];
function fmt(n) {
  if (!isFinite(n)) return '0';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) return n < 10 ? n.toFixed(1) : Math.floor(n).toString();
  const t = Math.min(Math.floor(Math.log10(n) / 3), SUFFIXES.length - 1);
  if (t <= 0) return Math.floor(n).toLocaleString();
  const s = n / Math.pow(1000, t);
  return (s < 10 ? s.toFixed(2) : s < 100 ? s.toFixed(1) : Math.floor(s)) + ' ' + SUFFIXES[t];
}
function fmtTime(s) {
  if (s < 60) return Math.floor(s) + 's';
  if (s < 3600) return Math.floor(s/60) + 'm ' + Math.floor(s%60) + 's';
  if (s < 86400) return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
  return Math.floor(s/86400) + 'd ' + Math.floor((s%86400)/3600) + 'h';
}

// ---------- Game Data ----------
const MINERALS = [
  { id:'coal',     name:'Coal',          rarity:'common',    value:1,     color:'#5a5a5a', icon:'\u2B1B' },
  { id:'copper',   name:'Copper Ore',    rarity:'common',    value:3,     color:'#b87333', icon:'\uD83D\uDFE7' },
  { id:'iron',     name:'Iron Ore',      rarity:'common',    value:5,     color:'#9a9a9a', icon:'\u2B1C' },
  { id:'tin',      name:'Tin Ore',       rarity:'common',    value:8,     color:'#c8c8c8', icon:'\uD83D\uDD18' },
  { id:'silver',   name:'Silver Ore',    rarity:'uncommon',  value:25,    color:'#c0c0c0', icon:'\u26AA' },
  { id:'gold',     name:'Gold Ore',      rarity:'uncommon',  value:60,    color:'#ffd700', icon:'\uD83D\uDFE1' },
  { id:'ruby',     name:'Ruby',          rarity:'rare',      value:250,   color:'#e0115f', icon:'\uD83D\uDD34' },
  { id:'sapphire', name:'Sapphire',      rarity:'rare',      value:350,   color:'#0f52ba', icon:'\uD83D\uDD35' },
  { id:'emerald',  name:'Emerald',       rarity:'rare',      value:450,   color:'#50c878', icon:'\uD83D\uDFE2' },
  { id:'diamond',  name:'Diamond',       rarity:'epic',      value:1500,  color:'#b9f2ff', icon:'\uD83D\uDC8E' },
  { id:'mythril',  name:'Mythril',       rarity:'legendary', value:5000,  color:'#44aaff', icon:'\uD83D\uDD2E' },
  { id:'voidcrystal',name:'Void Crystal',rarity:'mythic',    value:20000, color:'#bb44ff', icon:'\uD83C\uDF11' },
];

const WORLDS = [
  { id:'caves',    name:'The Caves',        desc:'Does it have a bottom? What lurks deeper?',
    minerals:[{id:'coal',w:50},{id:'copper',w:30},{id:'iron',w:15},{id:'tin',w:5}],
    richness:1, bg:'world-caves', img:'pictures/2.png', cost:0 },
  { id:'coalpits', name:'Coal Pits',        desc:'Coal-rich ground with a few secrets laying around.',
    minerals:[{id:'coal',w:35},{id:'iron',w:30},{id:'silver',w:25},{id:'gold',w:10}],
    richness:1.5, bg:'world-coalpits', img:'pictures/3.png', cost:800 },
  { id:'crystal',  name:'Crystal Caverns',  desc:'Crystalline formations hide precious gems within.',
    minerals:[{id:'silver',w:25},{id:'gold',w:30},{id:'ruby',w:25},{id:'sapphire',w:20}],
    richness:2, bg:'world-crystal', img:'pictures/4.png', cost:250000 },
  { id:'dragon',   name:'Dragon Mountains', desc:'The mythical place where dragons reside.',
    minerals:[{id:'gold',w:15},{id:'ruby',w:25},{id:'sapphire',w:20},{id:'emerald',w:25},{id:'diamond',w:15}],
    richness:3, bg:'world-dragon', img:'pictures/5.png', cost:25000000 },
  { id:'void',     name:'Void Mines',       desc:'Where reality bends and impossible minerals form.',
    minerals:[{id:'diamond',w:30},{id:'mythril',w:40},{id:'voidcrystal',w:30}],
    richness:5, bg:'world-void', img:'pictures/6.png', cost:5000000000 },
];

const STAT_DEFS = [
  { id:'miningSpeed', name:'Mining Speed',       icon:'\u26A1',       maxLv:25, baseCost:100,  costMult:2.0,
    desc:'Increases auto-mining speed',
    curFn:l=>'+'+(l*8)+'%', nxtFn:l=>'+'+((l+1)*8)+'%' },
  { id:'miningPower', name:'Mining Power',       icon:'\uD83D\uDCAA', maxLv:50, baseCost:200,  costMult:1.6,
    desc:'Increases ore yield from minerals',
    curFn:l=>'x'+(1+l*0.2).toFixed(1), nxtFn:l=>'x'+(1+(l+1)*0.2).toFixed(1) },
  { id:'tapDamage',   name:'Tap Damage',         icon:'\uD83D\uDC46', maxLv:50, baseCost:150,  costMult:1.5,
    desc:'Increases click mining power',
    curFn:l=>(0.15+l*0.08).toFixed(2), nxtFn:l=>(0.15+(l+1)*0.08).toFixed(2) },
  { id:'critChance',  name:'Tap Crit Chance',    icon:'\uD83C\uDFAF', maxLv:40, baseCost:300,  costMult:1.5,
    desc:'Chance for critical mining hit',
    curFn:l=>(l*1).toFixed(0)+'%', nxtFn:l=>((l+1)*1).toFixed(0)+'%' },
  { id:'critMult',    name:'Tap Crit Multiplier', icon:'\u2728',      maxLv:60, baseCost:250,  costMult:1.45,
    desc:'Bonus multiplier on critical hits',
    curFn:l=>'x'+(2+l*0.1).toFixed(1), nxtFn:l=>'x'+(2+(l+1)*0.1).toFixed(1) },
  { id:'resourceMult',name:'Resource Multiplier', icon:'\uD83C\uDFB0', maxLv:20, baseCost:500, costMult:2.0,
    desc:'Chance to duplicate mined minerals',
    curFn:l=>(l*3)+'%', nxtFn:l=>((l+1)*3)+'%' },
];

const PRESTIGE_UPGRADES = [
  { id:'p1', name:'Head Start',        desc:'Start each run with 2,000 ore.',           cost:2  },
  { id:'p2', name:'Loyal Goblins',     desc:'Start with 5 free goblin miners.',         cost:3  },
  { id:'p3', name:'Quick Learner',     desc:'Start with Mining Speed Lv.3.',            cost:5  },
  { id:'p4', name:'Power Strikes',     desc:'Click power x5 permanently.',             cost:8  },
  { id:'p5', name:'World Memory',      desc:'Coal Pits starts unlocked on reset.',     cost:10 },
  { id:'p6', name:'Deep Veins',        desc:'All mining x3 permanently.',              cost:15 },
  { id:'p7', name:'Bargain Hunter',    desc:'All upgrade & worker costs -30%.',        cost:25 },
  { id:'p8', name:'Mineral Magnet',    desc:'Earn 3x Refined Minerals on prestige.',   cost:50 },
  { id:'p9', name:'Core Mastery',      desc:'All mining x5 permanently.',              cost:100},
  { id:'p10',name:'Crystal Memory',    desc:'Crystal Caverns starts unlocked on reset.',cost:200},
  { id:'p11',name:'Infinite Depth',    desc:'All mining x10 permanently.',             cost:500},
  { id:'p12',name:'Omega Mine',        desc:'All mining x50 permanently.',             cost:2000},
];

const WORKER_TYPES = [
  { id:'goblin',   name:'Goblin Miner',   rarity:'common',    power:1,   oreCost:true,
    cost:[], desc:'Cheap and cheerful. Gets the job done.' },
  { id:'dwarf',    name:'Dwarf Miner',    rarity:'common',    power:2,
    cost:[{id:'coal',n:30},{id:'iron',n:15},{id:'copper',n:10}], desc:'Sturdy and reliable. Born underground.' },
  { id:'engineer', name:'Engineer',        rarity:'uncommon',  power:5,
    cost:[{id:'silver',n:8},{id:'gold',n:3}], desc:'Smart tools, better yields.' },
  { id:'geologist', name:'Geologist',      rarity:'uncommon',  power:8,
    cost:[{id:'gold',n:10},{id:'silver',n:5}], desc:'Finds the richest veins.' },
  { id:'pyromancer',name:'Fire Mage',      rarity:'rare',      power:15,
    cost:[{id:'ruby',n:5},{id:'sapphire',n:3}], desc:'Burns through rock like butter.' },
  { id:'shaper',   name:'Crystal Shaper',  rarity:'rare',      power:25,
    cost:[{id:'emerald',n:5},{id:'sapphire',n:5}], desc:'Extracts crystals without breaking them.' },
  { id:'dragon',   name:'Dragon Tamer',    rarity:'epic',      power:50,
    cost:[{id:'diamond',n:3},{id:'ruby',n:8}], desc:'The dragon does the heavy lifting.' },
  { id:'voidwalker',name:'Void Walker',    rarity:'legendary', power:120,
    cost:[{id:'mythril',n:3},{id:'voidcrystal',n:1}], desc:'Mines across dimensions simultaneously.' },
];

// ---------- State ----------
function defaultState() {
  const w = {}; WORLDS.forEach(x => {
    const a = {}; WORKER_TYPES.forEach(t => a[t.id] = 0);
    w[x.id] = { unlocked: x.id==='caves', assigned: a };
  });
  const m = {}; MINERALS.forEach(x => { m[x.id] = 0; });
  const s = {}; STAT_DEFS.forEach(x => { s[x.id] = 0; });
  const hw = {}; WORKER_TYPES.forEach(t => { hw[t.id] = 0; });
  return {
    ore:0, totalOre:0, allTimeOre:0,
    minerals: m, activeWorld:'caves', worlds: w,
    hiredWorkers: hw, stats: s,
    clicks:0, totalClicks:0,
    refinedMinerals:0, totalRMEarned:0,
    purchasedPrestige:[], totalPrestiges:0,
    achievedMilestones: [],
    lastUpdate: Date.now(), startTime: Date.now(),
  };
}
let S = defaultState();

// ---------- Event Systems State ----------
const combo = { count: 0, mult: 1, lastClick: 0 };
let nextBonusTime = Date.now() + (120 + Math.random() * 180) * 1000; // 2-5 min
let nextRushTime = Date.now() + (300 + Math.random() * 300) * 1000;  // 5-10 min
let rushActive = false;
let rushEnd = 0;
let activeBonusNode = null;

const BONUS_TYPES = [
  { id: 'golden',  label: 'GOLDEN CHEST',  oreMult: 5,  rm: 0,  color: '#ffd700' },
  { id: 'diamond', label: 'DIAMOND VEIN',  oreMult: 10, rm: 0,  color: '#b9f2ff' },
  { id: 'mythril', label: 'MYTHRIL METEOR', oreMult: 20, rm: 1, color: '#44aaff' },
];

const MILESTONES = [
  { id: 'click1',     check: () => S.totalClicks >= 1,       label: 'First Strike',      reward: 5 },
  { id: 'click10',    check: () => S.totalClicks >= 10,      label: '10 Clicks',          reward: 20 },
  { id: 'click100',   check: () => S.totalClicks >= 100,     label: '100 Clicks',         reward: 200 },
  { id: 'click1000',  check: () => S.totalClicks >= 1000,    label: '1,000 Clicks',       reward: 2000 },
  { id: 'click5000',  check: () => S.totalClicks >= 5000,    label: '5,000 Clicks',       reward: 15000 },
  { id: 'click10000', check: () => S.totalClicks >= 10000,   label: '10,000 Clicks!',     reward: 100000 },
  { id: 'worker1',    check: () => getTotalHired() >= 1,     label: 'First Hire',         reward: 100 },
  { id: 'worker10',   check: () => getTotalHired() >= 10,    label: '10 Workers',         reward: 5000 },
  { id: 'worker50',   check: () => getTotalHired() >= 50,    label: 'Mining Crew',        reward: 50000 },
  { id: 'ore1k',      check: () => S.allTimeOre >= 1000,     label: '1K Ore Mined',       reward: 500 },
  { id: 'ore10k',     check: () => S.allTimeOre >= 10000,    label: '10K Ore Mined',      reward: 2000 },
  { id: 'ore100k',    check: () => S.allTimeOre >= 100000,   label: '100K Ore Mined',     reward: 10000 },
  { id: 'ore1m',      check: () => S.allTimeOre >= 1000000,  label: '1M Ore Mined',       reward: 50000 },
  { id: 'ore10m',     check: () => S.allTimeOre >= 10000000, label: '10M Ore Mined',      reward: 200000 },
  { id: 'ore100m',    check: () => S.allTimeOre >= 100000000,label: '100M Ore Mined',     reward: 1000000 },
  { id: 'ore1b',      check: () => S.allTimeOre >= 1e9,      label: '1B Ore Mined',       reward: 10000000 },
  { id: 'prestige1',  check: () => S.totalPrestiges >= 1,    label: 'Gone Deeper',        reward: 5000 },
  { id: 'world2',     check: () => WORLDS.filter(w=>S.worlds[w.id]?.unlocked).length >= 2, label: 'Explorer', reward: 2000 },
  { id: 'world5',     check: () => WORLDS.filter(w=>S.worlds[w.id]?.unlocked).length >= 5, label: 'World Conqueror', reward: 500000 },
];

// ---------- Stat Calculations ----------
function getCostReduce() { return S.purchasedPrestige.includes('p7') ? 0.7 : 1; }

function getMiningSpeed() {
  const base = 0.15; // nodes progress per second per worker
  return base * (1 + S.stats.miningSpeed * 0.08);
}
function getMiningPower() { return 1 + S.stats.miningPower * 0.2; }
function getTapDmg() {
  let d = 0.25 + S.stats.tapDamage * 0.08;
  if (S.purchasedPrestige.includes('p4')) d *= 5;
  return d;
}
function getCritChance() { return Math.min(0.8, S.stats.critChance * 0.01); }
function getCritMult()   { return 2 + S.stats.critMult * 0.1; }
function getResMult()    { return Math.min(0.6, S.stats.resourceMult * 0.03); }

function getPrestigeMult() {
  let m = 1 + S.totalRMEarned * 0.25;
  if (S.purchasedPrestige.includes('p6'))  m *= 3;
  if (S.purchasedPrestige.includes('p9'))  m *= 5;
  if (S.purchasedPrestige.includes('p11')) m *= 10;
  if (S.purchasedPrestige.includes('p12')) m *= 50;
  return m;
}

// Worker power = sum of (count * type.power) for a world
function getWorldWorkerPower(wid) {
  const wa = S.worlds[wid]?.assigned;
  if (!wa) return 0;
  let total = 0;
  WORKER_TYPES.forEach(t => { total += (wa[t.id] || 0) * t.power; });
  return total;
}
function getWorldWorkerCount(wid) {
  const wa = S.worlds[wid]?.assigned;
  if (!wa) return 0;
  let c = 0; WORKER_TYPES.forEach(t => { c += (wa[t.id] || 0); }); return c;
}
function getTotalHired() {
  let c = 0; WORKER_TYPES.forEach(t => { c += (S.hiredWorkers[t.id] || 0); }); return c;
}
function getFreeByType(tid) {
  let assigned = 0;
  WORLDS.forEach(w => { assigned += (S.worlds[w.id]?.assigned?.[tid] || 0); });
  return (S.hiredWorkers[tid] || 0) - assigned;
}
function getTotalFree() {
  let f = 0; WORKER_TYPES.forEach(t => { f += getFreeByType(t.id); }); return f;
}

function getGoblinCost() {
  return Math.ceil(20 * Math.pow(1.5, S.hiredWorkers.goblin || 0));
}
function getWorkerMineralCost(wt) {
  // Each additional worker of the same type costs 50% more minerals
  const owned = S.hiredWorkers[wt.id] || 0;
  const mult = Math.pow(1.5, owned);
  return wt.cost.map(c => ({ id: c.id, n: Math.ceil(c.n * mult) }));
}
function canAffordWorker(wt) {
  if (wt.oreCost) return S.ore >= getGoblinCost();
  return getWorkerMineralCost(wt).every(c => (S.minerals[c.id] || 0) >= c.n);
}

function getStatCost(statId) {
  const sd = STAT_DEFS.find(s=>s.id===statId);
  return Math.ceil(sd.baseCost * Math.pow(sd.costMult, S.stats[statId]) * getCostReduce());
}

function getPrestigeGain() {
  let g = Math.floor(Math.sqrt(S.totalOre / 5e4));
  if (S.purchasedPrestige.includes('p8')) g *= 3;
  return g;
}

function getWorldOreRate(wid) {
  const world = WORLDS.find(w=>w.id===wid);
  const wp = getWorldWorkerPower(wid);
  if (!wp || !world) return 0;
  const speed = getMiningSpeed() * wp;
  const avgVal = worldAvgValue(world);
  const power = getMiningPower() * getPrestigeMult() * world.richness;
  const mult = 1 + getResMult();
  const efficiency = (wid === S.activeWorld) ? 1 : 0.5;
  return speed * avgVal * power * mult * efficiency;
}

function getTotalOreRate() {
  let total = 0;
  WORLDS.forEach(w => { if (S.worlds[w.id]?.unlocked) total += getWorldOreRate(w.id); });
  return total;
}

function worldAvgValue(world) {
  let totalW = 0, totalV = 0;
  world.minerals.forEach(m => {
    const min = MINERALS.find(x=>x.id===m.id);
    totalW += m.w; totalV += m.w * min.value;
  });
  return totalV / totalW;
}

function pickMineral(world) {
  const total = world.minerals.reduce((s,m) => s + m.w, 0);
  let r = Math.random() * total;
  for (const m of world.minerals) {
    r -= m.w; if (r <= 0) return m.id;
  }
  return world.minerals[world.minerals.length - 1].id;
}

// ---------- Mineral Sprite Sheet ----------
const SPRITE_GRID = {
  coal:{c:0,r:0}, copper:{c:1,r:0}, iron:{c:2,r:0}, tin:{c:3,r:0},
  silver:{c:0,r:1}, gold:{c:1,r:1}, ruby:{c:2,r:1}, sapphire:{c:3,r:1},
  emerald:{c:0,r:2}, diamond:{c:1,r:2}, mythril:{c:2,r:2}, voidcrystal:{c:3,r:2},
};
const mineralSprites = {};

function loadSprites() {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cols = 4, rows = 3;
        const titleH = Math.round(img.height * 0.132);
        const cellW = Math.floor(img.width / cols);
        const cellH = Math.floor((img.height - titleH) / rows);
        Object.entries(SPRITE_GRID).forEach(([id, pos]) => {
          const cv = document.createElement('canvas');
          cv.width = cellW; cv.height = cellH;
          const ctx = cv.getContext('2d');
          ctx.drawImage(img, pos.c * cellW, titleH + pos.r * cellH, cellW, cellH, 0, 0, cellW, cellH);
          mineralSprites[id] = cv.toDataURL();
        });
      } catch(e) { console.warn('Sprites: canvas tainted, using emoji fallback. Run via start.bat for full graphics.'); }
      resolve();
    };
    img.onerror = () => { console.warn('Sprites: image not found, using emoji fallback.'); resolve(); };
    img.src = 'pictures/ores.png';
  });
}

// ---------- Mine Node System ----------
const MAX_NODES = 8;
let mineNodes = [];
let nodeIdCounter = 0;

function spawnNode() {
  const world = WORLDS.find(w => w.id === S.activeWorld);
  const mid = pickMineral(world);
  const mineral = MINERALS.find(m => m.id === mid);

  // Random position with collision avoidance
  let x, y, ok;
  for (let i = 0; i < 30; i++) {
    x = 12 + Math.random() * 76;
    y = 8 + Math.random() * 78;
    ok = !mineNodes.some(n => Math.hypot(n.x - x, n.y - y) < 14);
    if (ok) break;
  }

  const rSizes = {common:36, uncommon:38, rare:40, epic:42, legendary:44, mythic:46};
  const node = { id: nodeIdCounter++, mineral: mid, x, y, progress: 0, size: rSizes[mineral.rarity] || 38, el: null };
  mineNodes.push(node);
  renderNode(node);
}

function renderNode(node) {
  const mineral = MINERALS.find(m => m.id === node.mineral);
  const container = document.getElementById('mine-window');
  const el = document.createElement('div');
  el.className = 'mineral-node';
  el.style.left = node.x + '%';
  el.style.top = node.y + '%';
  el.style.width = node.size + 'px';
  el.style.height = node.size + 'px';

  const r = node.size / 2 - 2;
  const circ = 2 * Math.PI * r;

  el.innerHTML =
    '<svg class="node-ring" viewBox="0 0 ' + node.size + ' ' + node.size + '">' +
    '<circle class="ring-bg" cx="' + node.size/2 + '" cy="' + node.size/2 + '" r="' + r + '"/>' +
    '<circle class="ring-progress" cx="' + node.size/2 + '" cy="' + node.size/2 + '" r="' + r +
    '" stroke="' + mineral.color + '" stroke-dasharray="' + circ.toFixed(1) +
    '" stroke-dashoffset="' + circ.toFixed(1) +
    '" transform="rotate(-90 ' + node.size/2 + ' ' + node.size/2 + ')"/>' +
    '</svg>' +
    (mineralSprites[node.mineral]
      ? '<img class="node-sprite" src="' + mineralSprites[node.mineral] + '" style="--node-glow:' + mineral.color + '50" />'
      : '<div class="node-dot" style="background:' + mineral.color + ';--node-glow:' + mineral.color + '50"></div>');

  container.appendChild(el);
  node.el = el;
  node.circ = circ;
}

function extractNode(node) {
  const mineral = MINERALS.find(m => m.id === node.mineral);
  const world = WORLDS.find(w => w.id === S.activeWorld);
  let value = mineral.value * getMiningPower() * getPrestigeMult() * world.richness;

  // Resource multiplier
  let doubled = false;
  if (Math.random() < getResMult()) { value *= 2; doubled = true; }

  S.ore += value; S.totalOre += value; S.allTimeOre += value;
  S.minerals[node.mineral] = (S.minerals[node.mineral] || 0) + 1;
  if (doubled) S.minerals[node.mineral]++;

  // Float text
  showMineFloat(node.x, node.y, '+' + fmt(value));
  showMineFloat(node.x, node.y - 8, mineral.icon + ' ' + mineral.name, 'mineral-name');

  // Extract animation
  if (node.el) {
    node.el.classList.add('extracted');
    setTimeout(() => { if (node.el?.parentNode) node.el.remove(); }, 500);
  }

  mineNodes = mineNodes.filter(n => n.id !== node.id);

  // Lucky drop roll
  rollLuckyDrop(node);
}

function updateNodes(dt) {
  const wp = getWorldWorkerPower(S.activeWorld);
  const speed = getMiningSpeed() * wp * getRushMult();
  if (speed > 0 && mineNodes.length > 0) {
    const perNode = speed / mineNodes.length;
    mineNodes.forEach(node => {
      node.progress += perNode * dt;
      // Update ring
      if (node.el) {
        const ring = node.el.querySelector('.ring-progress');
        if (ring) ring.style.strokeDashoffset = (node.circ * (1 - Math.min(node.progress, 1))).toFixed(1);
      }
      if (node.progress >= 1) extractNode(node);
    });
  }
  // Respawn
  while (mineNodes.length < MAX_NODES) spawnNode();
}

function clearNodes() {
  mineNodes.forEach(n => { if (n.el?.parentNode) n.el.remove(); });
  mineNodes = [];
}

function showMineFloat(x, y, text, cls) {
  const container = document.getElementById('mine-window');
  const el = document.createElement('div');
  el.className = 'mine-float' + (cls ? ' ' + cls : '');
  el.textContent = text;
  el.style.left = x + '%'; el.style.top = y + '%';
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ---------- Actions ----------
function buyStat(statId) {
  const sd = STAT_DEFS.find(s=>s.id===statId);
  if (S.stats[statId] >= sd.maxLv) return false;
  const cost = getStatCost(statId);
  if (S.ore < cost) return false;
  S.ore -= cost; S.stats[statId]++;
  return true;
}

function hireWorkerType(tid) {
  const wt = WORKER_TYPES.find(t=>t.id===tid);
  if (!wt) return false;
  if (wt.oreCost) {
    const cost = getGoblinCost();
    if (S.ore < cost) return false;
    S.ore -= cost;
  } else {
    if (!canAffordWorker(wt)) return false;
    getWorkerMineralCost(wt).forEach(c => { S.minerals[c.id] -= c.n; });
  }
  S.hiredWorkers[tid] = (S.hiredWorkers[tid] || 0) + 1;
  return true;
}

function getReassignCost(tid) {
  const wt = WORKER_TYPES.find(t=>t.id===tid);
  // Cost scales with worker power: 50 * power^1.5
  return Math.ceil(50 * Math.pow(wt.power, 1.5));
}

function assignWorker(wid, tid, delta) {
  if (!S.worlds[wid]?.unlocked) return;
  if (!S.worlds[wid].assigned) { const a = {}; WORKER_TYPES.forEach(t => a[t.id] = 0); S.worlds[wid].assigned = a; }
  if (delta > 0 && getFreeByType(tid) <= 0) return;
  if (delta < 0) {
    if ((S.worlds[wid].assigned[tid] || 0) <= 0) return;
    const cost = getReassignCost(tid);
    if (S.ore < cost) return;
    S.ore -= cost;
  }
  S.worlds[wid].assigned[tid] = (S.worlds[wid].assigned[tid] || 0) + delta;
}

function assignAllFree(wid) {
  if (!S.worlds[wid]?.unlocked) return;
  if (!S.worlds[wid].assigned) { const a = {}; WORKER_TYPES.forEach(t => a[t.id] = 0); S.worlds[wid].assigned = a; }
  WORKER_TYPES.forEach(t => {
    const free = getFreeByType(t.id);
    if (free > 0) S.worlds[wid].assigned[t.id] = (S.worlds[wid].assigned[t.id] || 0) + free;
  });
}

function switchWorld(wid) {
  if (wid === S.activeWorld) return;
  if (!S.worlds[wid]?.unlocked) return;

  // Calculate idle earnings for the world we're warping TO
  const ws = S.worlds[wid];
  const lastVisit = ws.lastVisit || S.lastUpdate;
  const idleSec = (Date.now() - lastVisit) / 1000;
  const wp = getWorldWorkerPower(wid);
  let idleOre = 0;
  let idleMinerals = 0;
  if (wp > 0 && idleSec > 10) {
    const world = WORLDS.find(w => w.id === wid);
    const speed = getMiningSpeed() * wp;
    const avgVal = worldAvgValue(world);
    const power = getMiningPower() * getPrestigeMult() * world.richness;
    idleOre = speed * avgVal * power * (1 + getResMult()) * 0.5 * idleSec;
    idleMinerals = Math.floor(speed * idleSec * 0.5);
    S.ore += idleOre; S.totalOre += idleOre; S.allTimeOre += idleOre;
    // Add random minerals
    if (idleMinerals > 0) {
      for (let i = 0; i < Math.min(idleMinerals, 200); i++) {
        const mid = pickMineral(world);
        S.minerals[mid] = (S.minerals[mid] || 0) + 1;
      }
    }
  }

  // Mark old world's last visit
  S.worlds[S.activeWorld].lastVisit = Date.now();
  S.activeWorld = wid;
  ws.lastVisit = Date.now();
  clearNodes();
  updateMineWindowBg();

  // Show popup if there were idle earnings
  if (idleOre > 10) {
    showNotification(
      'Welcome to ' + WORLDS.find(w => w.id === wid).name + '!',
      'While idle, workers here mined ' + fmt(idleOre) + ' ore and ' + idleMinerals + ' minerals!'
    );
  }
}

function unlockWorld(wid) {
  const world = WORLDS.find(w=>w.id===wid);
  if (!world || S.worlds[wid]?.unlocked) return false;
  if (S.ore < world.cost) return false;
  S.ore -= world.cost;
  S.worlds[wid].unlocked = true;
  return true;
}

function sellMinerals() {
  let total = 0;
  MINERALS.forEach(m => {
    total += (S.minerals[m.id] || 0) * m.value;
    S.minerals[m.id] = 0;
  });
  S.ore += total; S.totalOre += total; S.allTimeOre += total;
  return total;
}

function onMineClick(event) {
  const tapDmg = getTapDmg();
  if (mineNodes.length === 0) return;
  incrementCombo();

  let target = mineNodes.reduce((a,b) => a.progress > b.progress ? a : b);
  let isCrit = Math.random() < getCritChance();
  let rushMul = getRushMult();
  let dmg = tapDmg * (isCrit ? getCritMult() : 1) * rushMul;
  target.progress += dmg;

  if (target.progress >= 1) {
    extractNode(target);
    while (mineNodes.length < MAX_NODES) spawnNode();
  } else {
    const ring = target.el?.querySelector('.ring-progress');
    if (ring) ring.style.strokeDashoffset = (target.circ * (1 - Math.min(target.progress, 1))).toFixed(1);
  }

  // Click ore with combo + rush multipliers
  const world = WORLDS.find(w=>w.id===S.activeWorld);
  let clickOre = tapDmg * getMiningPower() * getPrestigeMult() * world.richness
    * (isCrit ? getCritMult() : 1) * combo.mult * rushMul;
  S.ore += clickOre; S.totalOre += clickOre; S.allTimeOre += clickOre;
  S.clicks++; S.totalClicks++;

  const mw = document.getElementById('mine-window');
  mw.classList.remove('hit'); void mw.offsetWidth; mw.classList.add('hit');

  const rect = mw.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width * 100);
  const py = ((event.clientY - rect.top) / rect.height * 100);
  const label = (isCrit ? 'CRIT! ' : '') + (combo.mult > 1 ? 'x' + combo.mult + ' ' : '') + '+' + fmt(clickOre);
  showMineFloat(px, py, label, isCrit ? 'crit' : '');
}

function doPrestige() {
  const gain = getPrestigeGain();
  if (gain <= 0) return false;
  S.refinedMinerals += gain; S.totalRMEarned += gain; S.totalPrestiges++;

  // Reset
  S.ore = 0; S.totalOre = 0; S.clicks = 0;
  const hw = {}; WORKER_TYPES.forEach(t => { hw[t.id] = 0; }); S.hiredWorkers = hw;
  STAT_DEFS.forEach(sd => { S.stats[sd.id] = 0; });
  WORLDS.forEach(w => {
    const a = {}; WORKER_TYPES.forEach(t => a[t.id] = 0);
    S.worlds[w.id] = { unlocked: w.id==='caves', assigned: a };
  });
  MINERALS.forEach(m => { S.minerals[m.id] = 0; });
  S.activeWorld = 'caves';

  // Prestige bonuses
  if (S.purchasedPrestige.includes('p1')) { S.ore = 2000; S.totalOre = 2000; S.allTimeOre += 2000; }
  if (S.purchasedPrestige.includes('p2')) { S.hiredWorkers.goblin = 5; }
  if (S.purchasedPrestige.includes('p3')) { S.stats.miningSpeed = 3; }
  if (S.purchasedPrestige.includes('p5')) { S.worlds.coalpits.unlocked = true; }
  if (S.purchasedPrestige.includes('p10')) { S.worlds.crystal.unlocked = true; }

  clearNodes(); updateMineWindowBg();
  return true;
}

function buyPrestigeUpg(pid) {
  const pu = PRESTIGE_UPGRADES.find(p=>p.id===pid);
  if (!pu || S.purchasedPrestige.includes(pid)) return false;
  if (S.refinedMinerals < pu.cost) return false;
  S.refinedMinerals -= pu.cost;
  S.purchasedPrestige.push(pid);
  return true;
}

// ---------- Save / Load ----------
const SAVE_KEY = 'deepMine_v2';
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v:2, ...S, lastUpdate: Date.now() })); } catch(e) {}
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    const def = defaultState();
    Object.keys(def).forEach(k => { if (d[k] !== undefined) S[k] = d[k]; });
    // Ensure structures
    WORLDS.forEach(w => {
      if (!S.worlds[w.id]) S.worlds[w.id] = { unlocked: false, assigned: {} };
      // Migrate old format: workers (number) → assigned.goblin
      if (typeof S.worlds[w.id].workers === 'number') {
        const old = S.worlds[w.id].workers;
        const a = {}; WORKER_TYPES.forEach(t => a[t.id] = 0);
        a.goblin = old;
        S.worlds[w.id].assigned = a;
        delete S.worlds[w.id].workers;
      }
      if (!S.worlds[w.id].assigned) { const a = {}; WORKER_TYPES.forEach(t => a[t.id] = 0); S.worlds[w.id].assigned = a; }
      WORKER_TYPES.forEach(t => { if (S.worlds[w.id].assigned[t.id] === undefined) S.worlds[w.id].assigned[t.id] = 0; });
    });
    // Migrate old totalWorkers → hiredWorkers.goblin
    if (typeof S.totalWorkers === 'number' && !S.hiredWorkers) {
      const hw = {}; WORKER_TYPES.forEach(t => hw[t.id] = 0);
      hw.goblin = S.totalWorkers;
      S.hiredWorkers = hw;
    }
    if (!S.hiredWorkers) { const hw = {}; WORKER_TYPES.forEach(t => hw[t.id] = 0); S.hiredWorkers = hw; }
    WORKER_TYPES.forEach(t => { if (S.hiredWorkers[t.id] === undefined) S.hiredWorkers[t.id] = 0; });
    MINERALS.forEach(m => { if (S.minerals[m.id] === undefined) S.minerals[m.id] = 0; });
    STAT_DEFS.forEach(sd => { if (S.stats[sd.id] === undefined) S.stats[sd.id] = 0; });
    if (!Array.isArray(S.purchasedPrestige)) S.purchasedPrestige = [];
    if (!Array.isArray(S.achievedMilestones)) S.achievedMilestones = [];
    return true;
  } catch(e) { return false; }
}
function resetGame() { localStorage.removeItem(SAVE_KEY); S = defaultState(); clearNodes(); }
function exportSave() { saveGame(); return btoa(localStorage.getItem(SAVE_KEY)); }
function importSave(enc) { try { const r = atob(enc); JSON.parse(r); localStorage.setItem(SAVE_KEY, r); location.reload(); return true; } catch(e) { return false; } }

// ---------- UI ----------
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
let currentTab = 'stats';
let lastFullRender = 0;
const RENDER_MS = 600;
let adminUnlocked = false;

function updateMineWindowBg() {
  const mw = $('#mine-window');
  const world = WORLDS.find(w=>w.id===S.activeWorld);
  WORLDS.forEach(w => mw.classList.remove(w.bg));
  mw.classList.add(world.bg);
  $('#world-label').textContent = world.name;
}

function updateResources() {
  $('#ore-count').textContent = fmt(S.ore);
  $('#ore-rate').textContent = fmt(getTotalOreRate()) + '/s';
  $('#rm-count').textContent = fmt(S.refinedMinerals);
  const b = Math.round((getPrestigeMult()-1)*100);
  $('#rm-bonus').textContent = b > 0 ? '+'+b+'%' : '';
  $('#mine-workers').textContent = '\uD83D\uDC77 ' + getWorldWorkerCount(S.activeWorld);
  $('#mine-speed').textContent = '\u26A1 ' + fmt(getWorldOreRate(S.activeWorld)) + '/s';
  $('#click-display').textContent = 'Click: +' + fmt(getTapDmg() * getMiningPower() * getPrestigeMult() *
    (WORLDS.find(w=>w.id===S.activeWorld)?.richness || 1)) + ' ore';
}

function renderStats() {
  const c = $('#panel-stats');
  let h = '';
  STAT_DEFS.forEach(sd => {
    const lv = S.stats[sd.id];
    const maxed = lv >= sd.maxLv;
    const cost = maxed ? 0 : getStatCost(sd.id);
    const afford = !maxed && S.ore >= cost;
    h += '<div class="stat-card ' + (maxed ? 'maxed' : afford ? 'affordable' : '') + '">'
      + '<div class="stat-icon">' + sd.icon + '</div>'
      + '<div class="stat-info">'
      + '<div class="stat-name">' + sd.name + ' <span class="stat-level">Lv. ' + lv + '/' + sd.maxLv + '</span></div>'
      + '<div class="stat-effect">' + sd.desc + ': ' + sd.curFn(lv)
      + (maxed ? ' (MAX)' : ' \u2192 <span class="next">' + sd.nxtFn(lv) + '</span>') + '</div>'
      + '</div>'
      + '<button class="stat-buy ' + (afford ? '' : 'disabled') + '" data-stat="' + sd.id + '">'
      + (maxed ? 'MAX' : '<span class="cost">' + fmt(cost) + '</span>') + '</button>'
      + '</div>';
  });
  c.innerHTML = h;
  c.querySelectorAll('.stat-buy').forEach(btn => {
    btn.addEventListener('click', () => { if (buyStat(btn.dataset.stat)) renderStats(); });
  });
}

function renderWorkers() {
  const c = $('#panel-workers');
  let h = '<div class="worker-summary">'
    + '<div><span class="count">' + getTotalHired() + '</span> workers'
    + ' &middot; <span class="count">' + getTotalFree() + '</span> unassigned</div></div>';

  // Hire section
  h += '<div class="section-label">Hire Workers</div>';
  WORKER_TYPES.forEach(wt => {
    const owned = S.hiredWorkers[wt.id] || 0;
    const free = getFreeByType(wt.id);
    const afford = canAffordWorker(wt);
    let costHtml;
    if (wt.oreCost) {
      costHtml = '<span class="wt-ore-cost">' + fmt(getGoblinCost()) + ' ore</span>';
    } else {
      costHtml = getWorkerMineralCost(wt).map(c => {
        const min = MINERALS.find(m=>m.id===c.id);
        const have = S.minerals[c.id] || 0;
        return '<span class="wt-mineral-cost ' + (have >= c.n ? '' : 'short') + '">'
          + min.icon + ' ' + have + '/' + c.n + '</span>';
      }).join(' ');
    }
    h += '<div class="worker-type-card" data-rarity="' + wt.rarity + '">'
      + '<div class="wt-header">'
      + '<span class="wt-name">' + wt.name + '</span>'
      + '<span class="wt-power">x' + wt.power + '</span>'
      + '</div>'
      + '<div class="wt-desc">' + wt.desc + '</div>'
      + '<div class="wt-footer">'
      + '<div class="wt-cost">' + costHtml + '</div>'
      + '<div class="wt-owned">Owned: ' + owned + (free > 0 ? ' (' + free + ' free)' : '') + '</div>'
      + '<button class="wt-hire ' + (afford ? '' : 'disabled') + '" data-hire="' + wt.id + '">Hire</button>'
      + '</div></div>';
  });

  // Assign section
  h += '<div class="section-label">Assign to Worlds</div>';
  WORLDS.forEach(w => {
    const ws = S.worlds[w.id];
    if (!ws?.unlocked) return;
    if (!ws.assigned) { ws.assigned = {}; WORKER_TYPES.forEach(t => ws.assigned[t.id] = 0); }
    const isCur = w.id === S.activeWorld;
    const wc = getWorldWorkerCount(w.id);
    const wp = getWorldWorkerPower(w.id);
    const totalFree = getTotalFree();
    h += '<div class="world-worker-card ' + (isCur ? 'current' : '') + '">'
      + '<div class="ww-header"><span class="ww-name">' + w.name + (isCur ? ' \u2B50' : '') + '</span>'
      + '<span class="ww-power">' + wc + ' workers &middot; x' + wp + ' power</span></div>';
    // Show each type that player owns
    WORKER_TYPES.forEach(t => {
      if ((S.hiredWorkers[t.id] || 0) <= 0) return;
      const assigned = ws.assigned[t.id] || 0;
      const free = getFreeByType(t.id);
      const rCost = getReassignCost(t.id);
      const canRemove = assigned > 0 && S.ore >= rCost;
      h += '<div class="ww-type-row">'
        + '<span class="ww-type-name">' + t.name + '</span>'
        + '<div class="ww-controls">'
        + '<button class="ww-btn ' + (!canRemove ? 'disabled' : '') + '" data-aw="' + w.id + '" data-at="' + t.id + '" data-ad="-1"'
        + ' title="Recall cost: ' + fmt(rCost) + ' ore">&minus;</button>'
        + '<span class="ww-count">' + assigned + '</span>'
        + '<button class="ww-btn ' + (free <= 0 ? 'disabled' : '') + '" data-aw="' + w.id + '" data-at="' + t.id + '" data-ad="1">+</button>'
        + '</div></div>';
    });
    // Assign All button
    h += '<button class="assign-all-btn ' + (totalFree <= 0 ? 'disabled' : '') + '" data-assignall="' + w.id + '">Assign All Free (' + totalFree + ')</button>';
    h += '</div>';
  });

  c.innerHTML = h;
  c.querySelectorAll('.wt-hire').forEach(btn => {
    btn.addEventListener('click', () => { if (hireWorkerType(btn.dataset.hire)) renderWorkers(); });
  });
  c.querySelectorAll('.ww-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      assignWorker(btn.dataset.aw, btn.dataset.at, parseInt(btn.dataset.ad));
      renderWorkers();
    });
  });
  c.querySelectorAll('.assign-all-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      assignAllFree(btn.dataset.assignall);
      renderWorkers();
    });
  });
}

function renderMinerals() {
  const c = $('#panel-minerals');
  let totalVal = 0;
  MINERALS.forEach(m => { totalVal += (S.minerals[m.id] || 0) * m.value; });

  let h = '<div class="mineral-grid">';
  MINERALS.forEach(m => {
    const cnt = S.minerals[m.id] || 0;
    h += '<div class="mineral-item" data-rarity="' + m.rarity + '">'
      + (mineralSprites[m.id]
        ? '<img class="mi-sprite" src="' + mineralSprites[m.id] + '" />'
        : '<span class="mi-icon">' + m.icon + '</span>')
      + '<div class="mi-info">'
      + '<div class="mi-name">' + m.name + '</div>'
      + '<div class="mi-count">' + cnt + '</div>'
      + '<div class="mi-val">' + fmt(m.value) + ' ea</div>'
      + '</div></div>';
  });
  h += '</div>';
  h += '<button class="sell-all-btn ' + (totalVal > 0 ? '' : 'disabled') + '" id="sell-btn">'
    + 'Sell All Minerals (' + fmt(totalVal) + ' ore)</button>';

  c.innerHTML = h;
  $('#sell-btn')?.addEventListener('click', () => {
    const earned = sellMinerals();
    if (earned > 0) {
      showNotification('Minerals Sold!', 'You earned ' + fmt(earned) + ' ore from selling minerals.');
      renderMinerals();
    }
  });
}

function renderWorlds() {
  const c = $('#panel-worlds');
  let h = '';
  WORLDS.forEach(w => {
    const ws = S.worlds[w.id];
    const unlocked = ws?.unlocked;
    const isCurrent = w.id === S.activeWorld;
    const canAfford = S.ore >= w.cost;
    const wc = getWorldWorkerCount(w.id);
    const rate = getWorldOreRate(w.id);

    h += '<div class="world-card ' + (isCurrent ? 'current' : !unlocked ? 'locked' : '') + '">'
      + '<div class="wc-thumb" style="background-image:url(\'' + w.img + '\')"></div>'
      + '<div class="wc-header"><span class="wc-name">' + w.name + '</span>'
      + '<span class="wc-badge ' + (isCurrent ? 'current' : unlocked ? 'idle' : 'locked-badge') + '">'
      + (isCurrent ? 'Current' : unlocked ? 'Idle' : 'Locked') + '</span></div>'
      + '<div class="wc-desc">' + w.desc + '</div>'
      + '<div class="wc-minerals">';
    w.minerals.forEach(m => {
      const min = MINERALS.find(x=>x.id===m.id);
      h += '<span class="wc-mineral-tag">' + min.icon + ' ' + min.name + '</span>';
    });
    h += '</div><div class="wc-footer">'
      + '<span class="wc-stats">\uD83D\uDC77 ' + wc + ' &middot; ' + fmt(rate) + '/s'
      + (unlocked && !isCurrent ? ' (50%)' : '') + '</span>';

    if (isCurrent) {
      h += '<button class="warp-btn current-btn">Current</button>';
    } else if (unlocked) {
      h += '<button class="warp-btn warp" data-warp="' + w.id + '">Warp</button>';
    } else if (w.cost > 0) {
      h += '<button class="warp-btn ' + (canAfford ? 'unlock' : 'disabled') + '" data-unlock="' + w.id + '">'
        + 'Unlock (' + fmt(w.cost) + ')</button>';
    }
    h += '</div></div>';
  });
  c.innerHTML = h;

  c.querySelectorAll('[data-warp]').forEach(btn => {
    btn.addEventListener('click', () => { switchWorld(btn.dataset.warp); renderCurrentTab(); });
  });
  c.querySelectorAll('[data-unlock]').forEach(btn => {
    btn.addEventListener('click', () => { if (unlockWorld(btn.dataset.unlock)) renderWorlds(); });
  });
}

function renderPrestige() {
  const gain = getPrestigeGain();
  const mult = getPrestigeMult();
  let h = '<div class="prestige-section">'
    + '<h3>Go Deeper</h3>'
    + '<p>Reset progress to mine deeper layers, earning Refined Minerals that permanently boost all mining.</p>'
    + '<div class="prestige-stats">'
    + '<div>Refined Minerals: <span class="rm-highlight">' + fmt(S.refinedMinerals) + '</span></div>'
    + '<div>Total Ever Earned: <span class="rm-highlight">' + fmt(S.totalRMEarned) + '</span></div>'
    + '<div>Production Bonus: <span class="rm-highlight">x' + mult.toFixed(1) + '</span></div>'
    + '<div>Ore This Run: <span class="ore-highlight">' + fmt(S.totalOre) + '</span></div>'
    + '</div>'
    + '<div class="prestige-gain">Prestige for: <span class="rm-highlight">' + gain + '</span> RM</div>'
    + '<button id="prestige-btn" class="' + (gain > 0 ? 'prestige-ready' : 'disabled') + '">'
    + 'GO DEEPER (+' + gain + ' RM)</button></div><h3>Prestige Upgrades</h3>';
  $('#prestige-info').innerHTML = h;

  $('#prestige-btn')?.addEventListener('click', () => {
    const g = getPrestigeGain();
    if (g <= 0) return;
    if (!confirm('Go Deeper?\n\nYou will earn ' + g + ' Refined Minerals.\nOre, workers, stats, and worlds reset.\nPrestige bonuses carry over!')) return;
    doPrestige();
    switchTab('stats');
    showNotification('Gone Deeper!', 'Earned ' + g + ' Refined Minerals!');
  });

  let puH = '';
  PRESTIGE_UPGRADES.forEach(pu => {
    const owned = S.purchasedPrestige.includes(pu.id);
    const afford = !owned && S.refinedMinerals >= pu.cost;
    puH += '<div class="upg-card ' + (owned ? 'owned' : afford ? 'affordable' : '') + '">'
      + '<div class="upg-info"><div class="upg-name">' + pu.name + (owned ? ' (Owned)' : '') + '</div>'
      + '<div class="upg-desc">' + pu.desc + '</div></div>';
    if (!owned) puH += '<button class="upg-buy ' + (afford ? '' : 'disabled') + '" data-pres="' + pu.id + '">'
      + '<div class="buy-cost">' + pu.cost + ' RM</div></button>';
    puH += '</div>';
  });
  $('#prestige-upgrades-list').innerHTML = puH;
  $$('[data-pres]').forEach(btn => {
    btn.addEventListener('click', () => { if (buyPrestigeUpg(btn.dataset.pres)) renderPrestige(); });
  });
}

function renderSettings() {
  const pt = (Date.now() - S.startTime) / 1000;
  let totalMin = 0; MINERALS.forEach(m => totalMin += S.minerals[m.id] || 0);
  $('#panel-settings').innerHTML = '<div class="settings-section"><h3>Statistics</h3>'
    + '<div class="stats-grid">'
    + '<div>Play Time:</div><div>' + fmtTime(pt) + '</div>'
    + '<div>Total Ore:</div><div>' + fmt(S.allTimeOre) + '</div>'
    + '<div>Ore/Second:</div><div>' + fmt(getTotalOreRate()) + '</div>'
    + '<div>Clicks:</div><div>' + S.totalClicks.toLocaleString() + '</div>'
    + '<div>Workers:</div><div>' + getTotalHired() + '</div>'
    + '<div>Minerals Held:</div><div>' + totalMin + '</div>'
    + '<div>Worlds Unlocked:</div><div>' + WORLDS.filter(w=>S.worlds[w.id]?.unlocked).length + '/' + WORLDS.length + '</div>'
    + '<div>Prestiges:</div><div>' + S.totalPrestiges + '</div>'
    + '<div>Prestige Mult:</div><div>x' + getPrestigeMult().toFixed(1) + '</div>'
    + '</div></div>'
    + '<div class="settings-section"><h3>Save &amp; Load</h3>'
    + '<div class="settings-buttons">'
    + '<button id="s-save">Save</button><button id="s-export">Export</button>'
    + '<button id="s-import">Import</button><button id="s-reset" class="danger">Hard Reset</button>'
    + '</div></div>'
    + '<div class="settings-section"><h3>Insert Code</h3>'
    + '<div class="code-input-row">'
    + '<input type="text" id="code-input" placeholder="Enter code..." autocomplete="off" spellcheck="false"/>'
    + '<button id="code-btn">Activate</button>'
    + '</div>'
    + '<div id="code-msg"></div>'
    + '</div>'
    + (adminUnlocked ? renderAdminPanel() : '');

  $('#s-save').addEventListener('click', () => { saveGame(); showNotification('Saved', 'Progress saved.'); });
  $('#s-export').addEventListener('click', () => {
    navigator.clipboard.writeText(exportSave()).then(() => showNotification('Exported', 'Copied to clipboard.')).catch(() => prompt('Copy:', exportSave()));
  });
  $('#s-import').addEventListener('click', () => {
    const e = prompt('Paste save data:');
    if (e && importSave(e)) showNotification('Imported', 'Reloading...');
    else if (e) showNotification('Failed', 'Invalid save data.');
  });
  $('#s-reset').addEventListener('click', () => {
    if (!confirm('Reset ALL progress forever?')) return;
    if (!confirm('Really? Cannot undo.')) return;
    resetGame(); updateMineWindowBg(); renderCurrentTab();
    showNotification('Reset', 'All progress erased.');
  });

  // Code input
  const codeInput = $('#code-input');
  const codeBtn = $('#code-btn');
  const codeMsg = $('#code-msg');
  function submitCode() {
    const code = codeInput.value.trim().toUpperCase();
    if (!code) return;
    if (code === 'MASTERADMIN') {
      adminUnlocked = true;
      codeMsg.textContent = 'Admin panel unlocked!';
      codeMsg.className = 'code-msg success';
      codeInput.value = '';
      renderSettings();
    } else {
      codeMsg.textContent = 'Invalid code.';
      codeMsg.className = 'code-msg error';
    }
  }
  codeBtn.addEventListener('click', submitCode);
  codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitCode(); });

  // Admin button handlers
  if (adminUnlocked) {
    $('#adm-ore')?.addEventListener('click', () => { S.ore += 10000; S.totalOre += 10000; S.allTimeOre += 10000; showNotification('Cheat', '+10,000 ore'); renderSettings(); });
    $('#adm-ore100k')?.addEventListener('click', () => { S.ore += 100000; S.totalOre += 100000; S.allTimeOre += 100000; showNotification('Cheat', '+100,000 ore'); renderSettings(); });
    $('#adm-ore1m')?.addEventListener('click', () => { S.ore += 1000000; S.totalOre += 1000000; S.allTimeOre += 1000000; showNotification('Cheat', '+1,000,000 ore'); renderSettings(); });
    $('#adm-rm')?.addEventListener('click', () => { S.refinedMinerals += 100; S.totalRMEarned += 100; showNotification('Cheat', '+100 Refined Minerals'); renderSettings(); });
    $('#adm-workers')?.addEventListener('click', () => { S.hiredWorkers.goblin = (S.hiredWorkers.goblin||0) + 10; showNotification('Cheat', '+10 Goblin Miners'); renderSettings(); });
    $('#adm-stats')?.addEventListener('click', () => { STAT_DEFS.forEach(sd => { S.stats[sd.id] = sd.maxLv; }); showNotification('Cheat', 'All stats maxed!'); renderSettings(); });
    $('#adm-unlock')?.addEventListener('click', () => { WORLDS.forEach(w => { S.worlds[w.id].unlocked = true; }); showNotification('Cheat', 'All worlds unlocked!'); renderSettings(); });
    $('#adm-minerals')?.addEventListener('click', () => { MINERALS.forEach(m => { S.minerals[m.id] += 50; }); showNotification('Cheat', '+50 of each mineral'); renderSettings(); });
    $('#sim-run')?.addEventListener('click', () => {
      const mins = parseInt($('#sim-duration')?.value || '30');
      const sim = simulateProgress(mins);
      renderSimChart(sim);
    });
  }
}

function renderAdminPanel() {
  return '<div class="settings-section admin-section"><h3>Admin Panel</h3>'
    + '<div class="admin-grid">'
    + '<button id="adm-ore" class="admin-btn">+10K Ore</button>'
    + '<button id="adm-ore100k" class="admin-btn">+100K Ore</button>'
    + '<button id="adm-ore1m" class="admin-btn">+1M Ore</button>'
    + '<button id="adm-rm" class="admin-btn">+100 RM</button>'
    + '<button id="adm-workers" class="admin-btn">+10 Workers</button>'
    + '<button id="adm-stats" class="admin-btn">Max All Stats</button>'
    + '<button id="adm-unlock" class="admin-btn">Unlock Worlds</button>'
    + '<button id="adm-minerals" class="admin-btn">+50 Minerals</button>'
    + '</div></div>'
    + '<div class="settings-section admin-section"><h3>Progress Simulator</h3>'
    + '<div class="sim-controls">'
    + '<label>Duration: <select id="sim-duration">'
    + '<option value="5">5 min</option><option value="10">10 min</option>'
    + '<option value="30" selected>30 min</option><option value="60">60 min</option>'
    + '<option value="120">2 hours</option><option value="480">8 hours</option>'
    + '</select></label>'
    + '<button id="sim-run" class="admin-btn">Run Simulation</button>'
    + '</div>'
    + '<canvas id="sim-canvas" width="500" height="260"></canvas>'
    + '<div id="sim-summary"></div>'
    + '</div>';
}

// ---------- Progress Simulator ----------
function simulateProgress(minutes) {
  const saved = JSON.parse(JSON.stringify(S));
  S = defaultState();

  const steps = 120;
  const stepSec = (minutes * 60) / steps;
  const results = [];
  const events = [];

  for (let i = 0; i <= steps; i++) {
    const t = i * stepSec;
    results.push({
      t, ore: S.ore, rate: getTotalOreRate(),
      workers: getTotalHired(), worlds: WORLDS.filter(w => S.worlds[w.id]?.unlocked).length,
      stats: STAT_DEFS.reduce((s, sd) => s + S.stats[sd.id], 0),
    });

    if (i === steps) break;

    // 1. Ore from auto-mining
    const rate = getTotalOreRate();
    const earned = rate * stepSec;
    S.ore += earned; S.totalOre += earned; S.allTimeOre += earned;

    // 2. Mineral generation from workers
    WORLDS.forEach(w => {
      if (!S.worlds[w.id]?.unlocked) return;
      const wp = getWorldWorkerPower(w.id);
      if (wp <= 0) return;
      const speed = getMiningSpeed() * wp;
      const world = w;
      const nodesCompleted = Math.floor(speed * stepSec);
      for (let n = 0; n < Math.min(nodesCompleted, 50); n++) {
        const mid = pickMineral(world);
        const min = MINERALS.find(m => m.id === mid);
        S.minerals[mid] = (S.minerals[mid] || 0) + 1;
        const val = min.value * getMiningPower() * getPrestigeMult() * world.richness;
        S.ore += val; S.totalOre += val; S.allTimeOre += val;
      }
    });

    // 3. Simulate clicks (~1/sec)
    const clicks = Math.floor(stepSec * 1);
    for (let c = 0; c < Math.min(clicks, 20); c++) {
      const world = WORLDS.find(w => w.id === S.activeWorld);
      const clickOre = getTapDmg() * getMiningPower() * getPrestigeMult() * (world?.richness || 1);
      S.ore += clickOre; S.totalOre += clickOre; S.allTimeOre += clickOre;
      S.clicks++; S.totalClicks++;
    }

    // 4. Smart AI: buy stats (cheapest first)
    for (let attempt = 0; attempt < 5; attempt++) {
      let best = null, bestCost = Infinity;
      STAT_DEFS.forEach(sd => {
        if (S.stats[sd.id] >= sd.maxLv) return;
        const c = getStatCost(sd.id);
        if (c < bestCost && c <= S.ore) { bestCost = c; best = sd.id; }
      });
      if (best) buyStat(best); else break;
    }

    // 5. Smart AI: hire goblins
    while (S.ore >= getGoblinCost() && (S.hiredWorkers.goblin || 0) < 30) {
      hireWorkerType('goblin');
    }

    // 6. Smart AI: hire mineral workers (try each, best power first)
    const sortedTypes = [...WORKER_TYPES].filter(t => !t.oreCost).sort((a, b) => b.power - a.power);
    sortedTypes.forEach(wt => {
      while (canAffordWorker(wt)) hireWorkerType(wt.id);
    });

    // 7. Smart AI: unlock worlds
    WORLDS.forEach(w => {
      if (S.worlds[w.id]?.unlocked) return;
      if (w.cost > 0 && S.ore >= w.cost) {
        const prevWorlds = WORLDS.filter(x => S.worlds[x.id]?.unlocked).length;
        unlockWorld(w.id);
        events.push({ t, label: w.name });
      }
    });

    // 8. Smart AI: assign all free workers to best world
    const bestWorld = WORLDS.filter(w => S.worlds[w.id]?.unlocked)
      .sort((a, b) => b.richness - a.richness)[0];
    if (bestWorld) {
      WORKER_TYPES.forEach(wt => {
        const free = getFreeByType(wt.id);
        if (free > 0) assignAllFree(bestWorld.id);
      });
      S.activeWorld = bestWorld.id;
    }
  }

  const result = { data: results, events };
  S = saved;
  return result;
}

function renderSimChart(sim) {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { l: 55, r: 15, t: 15, b: 30 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  const data = sim.data;
  if (data.length < 2) return;

  // Use log scale for ore rate
  const rates = data.map(d => Math.max(d.rate, 0.001));
  const minR = Math.log10(Math.max(rates[0], 0.001));
  const maxR = Math.log10(Math.max(...rates) * 1.2);
  const rRange = Math.max(maxR - minR, 1);
  const maxT = data[data.length - 1].t;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * ch;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
  }

  // Y labels
  ctx.fillStyle = '#8892a4';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const logVal = maxR - (i / 4) * rRange;
    const val = Math.pow(10, logVal);
    ctx.fillText(fmt(val) + '/s', pad.l - 4, pad.t + (i / 4) * ch + 3);
  }

  // X labels
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const t = (i / 4) * maxT;
    const x = pad.l + (i / 4) * cw;
    ctx.fillText(Math.round(t / 60) + 'm', x, H - 5);
  }

  // World unlock markers
  ctx.strokeStyle = 'rgba(0,212,255,0.3)';
  ctx.setLineDash([3, 3]);
  sim.events.forEach(ev => {
    const x = pad.l + (ev.t / maxT) * cw;
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ch); ctx.stroke();
    ctx.fillStyle = '#00d4ff';
    ctx.font = '8px system-ui';
    ctx.fillText(ev.label, x, pad.t + ch + 12);
  });
  ctx.setLineDash([]);

  // Ore rate line
  ctx.beginPath();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 2;
  data.forEach((d, i) => {
    const x = pad.l + (d.t / maxT) * cw;
    const logR = Math.log10(Math.max(d.rate, 0.001));
    const y = pad.t + ch - ((logR - minR) / rRange) * ch;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill under curve
  const lastD = data[data.length - 1];
  const lastX = pad.l + cw;
  const bottomY = pad.t + ch;
  ctx.lineTo(lastX, bottomY);
  ctx.lineTo(pad.l, bottomY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(245,166,35,0.08)';
  ctx.fill();

  // Summary
  const endD = data[data.length - 1];
  const sumEl = document.getElementById('sim-summary');
  if (sumEl) {
    sumEl.innerHTML = '<strong>End state (' + Math.round(maxT / 60) + 'min):</strong> '
      + fmt(endD.rate) + '/s ore | '
      + fmt(endD.ore) + ' total ore | '
      + endD.workers + ' workers | '
      + endD.worlds + ' worlds | '
      + endD.stats + ' stat levels';
  }
}

function renderCurrentTab(force) {
  // Don't auto-refresh settings tab (has text input that loses focus)
  if (currentTab === 'settings' && !force) return;
  switch (currentTab) {
    case 'stats':    renderStats(); break;
    case 'workers':  renderWorkers(); break;
    case 'minerals': renderMinerals(); break;
    case 'worlds':   renderWorlds(); break;
    case 'prestige': renderPrestige(); break;
    case 'settings': renderSettings(); break;
  }
}
function switchTab(name) {
  currentTab = name;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  renderCurrentTab(true);
}
function showNotification(title, msg) {
  $('#notif-title').textContent = title;
  $('#notif-message').textContent = msg;
  $('#notification-overlay').classList.remove('hidden');
}

// ---------- Bonus Node System ----------
function spawnBonusNode() {
  if (activeBonusNode) return; // only one at a time
  const bt = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
  let x, y;
  for (let i = 0; i < 30; i++) {
    x = 15 + Math.random() * 70; y = 12 + Math.random() * 70;
    if (!mineNodes.some(n => Math.hypot(n.x - x, n.y - y) < 18)) break;
  }
  const node = { id: nodeIdCounter++, x, y, type: bt, spawnTime: Date.now(), duration: 8000, el: null };
  const container = document.getElementById('mine-window');
  const el = document.createElement('div');
  el.className = 'mineral-node bonus-node';
  el.style.left = x + '%'; el.style.top = y + '%';
  el.style.width = '56px'; el.style.height = '56px';
  el.style.cursor = 'pointer'; el.style.pointerEvents = 'auto';
  el.style.setProperty('--bonus-time', (node.duration / 1000) + 's');
  const r = 24; const circ = 2 * Math.PI * r;
  el.innerHTML =
    '<div class="bonus-label">' + bt.label + '</div>' +
    '<svg class="node-ring" viewBox="0 0 56 56">' +
    '<circle class="ring-bg" cx="28" cy="28" r="' + r + '"/>' +
    '<circle class="ring-progress" cx="28" cy="28" r="' + r + '" stroke="' + bt.color +
    '" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="0" transform="rotate(-90 28 28)"/>' +
    '</svg>' +
    (mineralSprites.diamond
      ? '<img class="node-sprite" src="' + mineralSprites.diamond + '" style="--node-glow:' + bt.color + '80;width:75%;height:75%" />'
      : '<div class="node-dot" style="background:' + bt.color + ';--node-glow:' + bt.color + '80;width:60%;height:60%"></div>') +
    '<div class="bonus-countdown"></div>';
  el.addEventListener('click', (e) => { e.stopPropagation(); collectBonusNode(); });
  container.appendChild(el);
  node.el = el;
  activeBonusNode = node;

  // Flash mine border
  const mw = document.getElementById('mine-window');
  mw.style.borderColor = bt.color;
  setTimeout(() => { if (!rushActive) mw.style.borderColor = ''; }, 1500);
}

function collectBonusNode() {
  if (!activeBonusNode) return;
  const bt = activeBonusNode.type;
  const world = WORLDS.find(w => w.id === S.activeWorld);
  const baseOre = worldAvgValue(world) * getMiningPower() * getPrestigeMult() * world.richness;
  const reward = baseOre * bt.oreMult * 10;
  S.ore += reward; S.totalOre += reward; S.allTimeOre += reward;
  if (bt.rm > 0) { S.refinedMinerals += bt.rm; S.totalRMEarned += bt.rm; }

  showMineFloat(activeBonusNode.x, activeBonusNode.y, 'BONUS! +' + fmt(reward), 'lucky');
  if (bt.rm > 0) showMineFloat(activeBonusNode.x, activeBonusNode.y - 10, '+' + bt.rm + ' RM!', 'jackpot');

  if (activeBonusNode.el) {
    activeBonusNode.el.classList.add('extracted');
    setTimeout(() => { if (activeBonusNode?.el?.parentNode) activeBonusNode.el.remove(); activeBonusNode = null; }, 500);
  } else { activeBonusNode = null; }
}

function updateBonusNode() {
  if (!activeBonusNode) return;
  const elapsed = Date.now() - activeBonusNode.spawnTime;
  if (elapsed >= activeBonusNode.duration) {
    // Expired — remove
    if (activeBonusNode.el?.parentNode) activeBonusNode.el.remove();
    activeBonusNode = null;
  }
}

// ---------- Combo System ----------
function getComboMult() {
  const c = combo.count;
  if (c >= 80) return 10;
  if (c >= 50) return 8;
  if (c >= 25) return 5;
  if (c >= 12) return 3;
  if (c >= 5) return 2;
  return 1;
}

function updateCombo(dt) {
  if (combo.count > 0 && Date.now() - combo.lastClick > 1500) {
    combo.count = 0; combo.mult = 1;
    const cd = document.getElementById('combo-display');
    if (cd) { cd.classList.remove('visible'); cd.textContent = ''; }
  }
}

function incrementCombo() {
  combo.count++;
  combo.lastClick = Date.now();
  combo.mult = getComboMult();
  const cd = document.getElementById('combo-display');
  if (cd && combo.mult > 1) {
    cd.textContent = 'x' + combo.mult + ' COMBO!';
    cd.classList.add('visible');
    cd.classList.remove('pop'); void cd.offsetWidth; cd.classList.add('pop');
  }
}

// ---------- Ore Rush System ----------
function startOreRush() {
  rushActive = true;
  rushEnd = Date.now() + 15000;
  const mw = document.getElementById('mine-window');
  mw.classList.add('ore-rush');
}

function endOreRush() {
  rushActive = false;
  const mw = document.getElementById('mine-window');
  mw.classList.remove('ore-rush');
  mw.style.borderColor = '';
  const rt = document.getElementById('rush-timer');
  if (rt) rt.style.width = '0';
}

function updateOreRush() {
  if (!rushActive) return;
  const remaining = rushEnd - Date.now();
  if (remaining <= 0) { endOreRush(); return; }
  const pct = (remaining / 15000) * 100;
  const rt = document.getElementById('rush-timer');
  if (rt) rt.style.width = pct + '%';
}

function getRushMult() { return rushActive ? 5 : 1; }

// ---------- Lucky Drops ----------
function rollLuckyDrop(node) {
  const roll = Math.random();
  if (roll > 0.08) return; // 8% chance
  const mineral = MINERALS.find(m => m.id === node.mineral);
  const world = WORLDS.find(w => w.id === S.activeWorld);
  const baseVal = mineral.value * getMiningPower() * getPrestigeMult() * world.richness;
  let mult, cls, label;
  if (roll < 0.01) { mult = 50; cls = 'jackpot'; label = 'JACKPOT!'; }
  else { mult = 3 + Math.floor(Math.random() * 8); cls = 'lucky'; label = 'LUCKY!'; }
  const bonus = baseVal * mult;
  S.ore += bonus; S.totalOre += bonus; S.allTimeOre += bonus;
  setTimeout(() => {
    showMineFloat(node.x, node.y + 5, label + ' +' + fmt(bonus), cls);
  }, 200);
}

// ---------- Milestone System ----------
function checkMilestones() {
  if (!S.achievedMilestones) S.achievedMilestones = [];
  MILESTONES.forEach(ms => {
    if (S.achievedMilestones.includes(ms.id)) return;
    if (!ms.check()) return;
    S.achievedMilestones.push(ms.id);
    S.ore += ms.reward; S.totalOre += ms.reward; S.allTimeOre += ms.reward;
    showMilestoneToast(ms.label, ms.reward);
  });
}

function showMilestoneToast(label, reward) {
  const container = document.getElementById('milestone-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'milestone-toast';
  el.innerHTML = '<div class="mt-title">' + label + '</div><div class="mt-reward">+' + fmt(reward) + ' ore</div>';
  container.appendChild(el);
  el.addEventListener('animationend', (e) => { if (e.animationName === 'toast-out') el.remove(); });
}

// ---------- Game Loop ----------
let lastLoop = Date.now();

function gameLoop() {
  const now = Date.now();
  const dt = Math.min((now - lastLoop) / 1000, 1);
  lastLoop = now;

  // Active world: mine nodes
  updateNodes(dt);

  // Idle worlds: generate ore directly
  WORLDS.forEach(w => {
    if (w.id === S.activeWorld) return;
    if (!S.worlds[w.id]?.unlocked) return;
    const wp = getWorldWorkerPower(w.id);
    if (wp <= 0) return;
    const rate = getWorldOreRate(w.id);
    const earned = rate * dt;
    S.ore += earned; S.totalOre += earned; S.allTimeOre += earned;
  });

  // Event systems
  updateCombo(dt);
  updateBonusNode();
  updateOreRush();

  // Spawn bonus node on timer
  if (now >= nextBonusTime) {
    spawnBonusNode();
    nextBonusTime = now + (120 + Math.random() * 180) * 1000;
  }

  // Trigger ore rush on timer
  if (!rushActive && now >= nextRushTime) {
    startOreRush();
    nextRushTime = now + (300 + Math.random() * 300) * 1000;
  }

  // Milestones (check every few seconds, not every frame)
  if (now - lastFullRender > RENDER_MS) { checkMilestones(); }

  updateResources();

  if (now - lastFullRender > RENDER_MS) { renderCurrentTab(); lastFullRender = now; }

  requestAnimationFrame(gameLoop);
}

// ---------- Init ----------
async function init() {
  await loadSprites();
  const loaded = loadGame();

  // Offline progress
  if (loaded) {
    const offSec = (Date.now() - S.lastUpdate) / 1000;
    if (offSec > 60) {
      const rate = getTotalOreRate();
      const earned = rate * offSec;
      S.ore += earned; S.totalOre += earned; S.allTimeOre += earned;
      showNotification('Welcome Back!', 'Away ' + fmtTime(offSec) + ': miners earned ' + fmt(earned) + ' ore!');
    }
  }

  S.lastUpdate = Date.now(); lastLoop = Date.now();

  // Tab events
  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Mine click
  $('#mine-window').addEventListener('click', onMineClick);

  // Notification close
  $('#notif-close').addEventListener('click', () => $('#notification-overlay').classList.add('hidden'));

  // Init mine
  updateMineWindowBg();
  renderCurrentTab();
  updateResources();

  requestAnimationFrame(gameLoop);
  setInterval(saveGame, 30000);
  window.addEventListener('beforeunload', saveGame);
}

window.addEventListener('DOMContentLoaded', init);
