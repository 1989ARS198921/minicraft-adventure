/* ============================================================
   MiniCraft Adventure RPG V2
   ============================================================ */
window.MiniCraftAdventureV2 = (() => {
  const S = window.MiniCraftAdventure || {};
  const state = S.state || {level:1,xp:0,gold:0,discovered:[],activeQuests:[],completedQuests:[]};
  state.flags = state.flags || {};
  state.inventory = state.inventory || [];

  const npcs = [
    {id:"boris", name:"Фермер Борис", role:"Фермер",
     greeting:"Привет! Гоблины утащили мой мешок яблок. Поможешь?",
     quest:"apples"},
    {id:"maria", name:"Мария", role:"Хранительница деревни",
     greeting:"В старом доме ночью появляется странный свет...",
     quest:"old_house"}
  ];

  const questSteps = {
    apples: [
      {id:"talk", text:"Поговорить с фермером Борисом"},
      {id:"find_cave", text:"Найти Пещеру гоблинов"},
      {id:"find_apples", text:"Найти мешок яблок"},
      {id:"return", text:"Вернуть яблоки Борису"}
    ],
    old_house: [
      {id:"talk", text:"Поговорить с Марией"},
      {id:"house", text:"Исследовать заброшенный дом"},
      {id:"secret", text:"Найти источник странного света"},
      {id:"return", text:"Вернуться к Марии"}
    ]
  };

  function hasItem(id){ return state.inventory.includes(id); }
  function addItem(id){ if(!hasItem(id)) state.inventory.push(id); }
  function removeItem(id){ state.inventory=state.inventory.filter(x=>x!==id); }

  function toast(text){
    window.dispatchEvent(new CustomEvent("rpgv2:toast",{detail:{text}}));
  }

  function talk(npcId){
    const npc=npcs.find(n=>n.id===npcId);
    if(!npc) return;
    toast(`🧑 ${npc.name}: ${npc.greeting}`);
    if(npc.quest==="apples" && !state.activeQuests.includes("apples") && !state.completedQuests.includes("apples")){
      state.activeQuests.push("apples");
      state.flags.apples_talk=true;
      toast("📜 Новый квест: Пропавшие яблоки");
      // ЗАКРЫВАЕМ ДИАЛОГ
      const dlg = document.getElementById('dlg');
      if (dlg) dlg.style.display = 'none';
      // ЗВУК КВЕСТА
      if (typeof soundQuest === 'function') soundQuest();
    }
  }

  function enterDungeon(id){
    const d=(S.dungeons||[]).find(x=>x.id===id);
    if(!d) return;
    state.flags["entered_"+id]=true;
    toast(`🏰 Ты вошёл: ${d.name}. Уровней: ${d.levels}`);
    window.dispatchEvent(new CustomEvent("rpgv2:dungeon",{detail:d}));
  }

  function progressQuest(id, step){
    state.flags["quest_"+id+"_"+step]=true;
    const steps=questSteps[id]||[];
    const next=steps.findIndex(x=>x.id===step)+1;
    if(next<steps.length) toast("📜 Следующий шаг: "+steps[next].text);
  }

  function collectApples(){
    if(!state.activeQuests.includes("apples")) return;
    if(!hasItem("apple_bag")){
      addItem("apple_bag");
      progressQuest("apples","find_apples");
      toast("🍎 Ты нашёл мешок яблок!");
    }
  }

  function returnApples(){
    if(state.activeQuests.includes("apples") && hasItem("apple_bag")){
      removeItem("apple_bag");
      state.activeQuests=state.activeQuests.filter(x=>x!=="apples");
      state.completedQuests.push("apples");
      state.flags.apples_complete=true;
      state.gold += 20;
      state.xp += 50;
      toast("🎉 Квест выполнен! +50 опыта, +20 золота");
      window.dispatchEvent(new CustomEvent("rpg:levelup"));
    }
  }

  return {state,npcs,questSteps,talk,enterDungeon,progressQuest,collectApples,returnApples,addItem,hasItem};
})();


// ============================================================
//  🔊 ЗВУКИ
// ============================================================
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playTone(freq, dur, vol = 0.1) {
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function soundQuest() { playTone(660, 0.08); setTimeout(() => playTone(880, 0.12), 100); setTimeout(() => playTone(1100, 0.15), 200); }
function soundAttack() { playTone(150, 0.08, 0.15); playTone(80, 0.1, 0.1); }
function soundJump() { playTone(300, 0.06); setTimeout(() => playTone(450, 0.06), 50); }
function soundHit() { playTone(100, 0.1, 0.15); setTimeout(() => playTone(60, 0.12, 0.12), 80); }

// ============================================================
//  🖥️ УПРАВЛЕНИЕ: кнопки скрытия, автозакрытие диалогов
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Кнопки скрытия
  const toggleHud = document.getElementById('toggleHud');
  const toggleQuest = document.getElementById('toggleQuest');
  const quests = document.getElementById('quests');
  const minimap = document.getElementById('minimap');
  const timeBadge = document.getElementById('timeBadge');
  const lvlBadge = document.getElementById('lvlBadge');
  const flyBadge = document.getElementById('flyBadge');

  let hudVisible = true, questVisible = true;

  // 📱 На телефоне панель заданий сразу свёрнута — не занимает экран
  if (window.matchMedia('(pointer: coarse)').matches && quests)
    quests.classList.add('collapsed');

  if (toggleHud) {
    toggleHud.onclick = function() {
      hudVisible = !hudVisible;
      if (minimap) minimap.classList.toggle('hidden', !hudVisible);
      if (timeBadge) timeBadge.classList.toggle('hidden', !hudVisible);
      if (lvlBadge) lvlBadge.classList.toggle('hidden', !hudVisible);
      if (flyBadge) flyBadge.classList.toggle('hidden', !hudVisible);
      this.textContent = hudVisible ? '📋 HUD' : '📋 Показать HUD';
    };
  }

  if (toggleQuest) {
    toggleQuest.onclick = function() {
      questVisible = !questVisible;
      if (quests) quests.classList.toggle('hidden', !questVisible);
      this.textContent = questVisible ? '📜 Квест' : '📜 Показать квест';
    };
  }

  // Включаем touch-режим на ПК
  if (!document.body.classList.contains('touch')) {
    document.body.classList.add('touch');
  }

  // ===== ДИАЛОГИ: закрытие по Esc (автозакрытия больше нет — читай спокойно!) =====
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const d = document.getElementById('dlg');
      if (d && d.style.display === 'flex') d.style.display = 'none';
    }
  });

  console.log('✅ Улучшения загружены!');
  console.log('🎮 WASD — ходьба, E — взаимодействие, F — атака');
  console.log('❌ Esc — закрыть диалог');
  console.log('💬 Диалоги: варианты ответов, закрытие по Esc');
});


(()=>{
 const A=window.MiniCraftAdventureV2, base=window.MiniCraftAdventure;
 const lvl=document.getElementById('adv-v2-level'), gold=document.getElementById('adv-v2-gold'), qs=document.getElementById('adv-v2-quests'), toast=document.getElementById('adv-v2-toast');
 function refresh(){lvl.textContent='Уровень '+A.state.level;gold.textContent='Золото '+A.state.gold;
  const all=(base?.quests||[]);
  qs.innerHTML=all.map(q=>`<div>${q.status==='completed'?'✅':q.status==='active'?'🟢':'🟡'} ${q.title}<br><span class="small">${q.objective}</span></div>`).join('');
 }
 function show(t){toast.textContent=t;toast.style.display='block';clearTimeout(show.t);show.t=setTimeout(()=>toast.style.display='none',3200);refresh();}
 window.addEventListener('rpgv2:toast',e=>show(e.detail.text));
 document.getElementById('adv-v2-q').onclick=()=>{qs.style.display=qs.style.display==='block'?'none':'block';refresh()};
 document.getElementById('adv-v2-npc').onclick=()=>A.talk('boris');
 refresh();
})();


window.MiniCraftDungeonV3 = (() => {
  const state = {
    dungeon: "goblin_cave",
    room: 0,
    hasKey: false,
    chestOpened: false,
    secretFound: false,
    goblinsDefeated: 0,
    bossDefeated: false,
    applesFound: false
  };
  const rooms = [
    {name:"Вход в пещеру", desc:"Старые факелы освещают каменный проход."},
    {name:"Лагерь гоблинов", desc:"Костры, ящики и следы маленьких ног."},
    {name:"Старый склад", desc:"Здесь кто-то хранит награбленные вещи."},
    {name:"Секретный туннель", desc:"Узкий проход ведёт глубже под землю."},
    {name:"Зал вожака", desc:"Большая пещера. В центре стоит сундук."}
  ];
  function toast(text){ window.dispatchEvent(new CustomEvent("dungeon:toast",{detail:{text}})); }
  function enter(){ state.room=0; toast("🏰 Ты вошёл в Пещеру гоблинов"); }
  function nextRoom(){ if(state.room < rooms.length-1){ state.room++; const r=rooms[state.room]; toast("➡️ "+r.name); if(state.room===1) spawnGoblin(); if(state.room===4) spawnBoss(); } else toast("🚪 Дальше пути нет."); }
  function spawnGoblin(){ toast("👹 Гоблин заметил тебя!"); }
  function defeatGoblin(){ state.goblinsDefeated++; toast("⚔️ Гоблин побеждён!"); if(state.goblinsDefeated===1){ state.hasKey=true; toast("🗝️ Ты получил ключ!"); } }
  function openChest(){ if(state.room!==2 && state.room!==4){ toast("🔒 Здесь нет подходящего сундука."); return; } if(!state.hasKey){ toast("🔒 Сундук заперт. Нужен ключ."); return; } if(state.chestOpened){ toast("📦 Сундук уже открыт."); return; } state.chestOpened=true; state.applesFound=true; toast("🍎 Ты нашёл мешок яблок!"); window.dispatchEvent(new CustomEvent("dungeon:apples")); }
  function findSecret(){ if(state.room!==2){ toast("🔎 Здесь нет ничего необычного."); return; } state.secretFound=true; state.room=3; toast("✨ Секретный проход найден!"); }
  function spawnBoss(){ if(!state.bossDefeated) toast("👑 Вожак гоблинов выходит из тени!"); }
  function defeatBoss(){ if(state.room!==4){ toast("Здесь никого нет."); return; } if(state.bossDefeated){ toast("🏆 Вожак уже побеждён."); return; } state.bossDefeated=true; toast("🏆 Вожак гоблинов побеждён!"); window.dispatchEvent(new CustomEvent("dungeon:bossdefeated")); }
  return {state,rooms,enter,nextRoom,defeatGoblin,openChest,findSecret,defeatBoss};
})();


window.MiniCraftDungeon3D = (() => {
  let group=null, scene=null, camera=null, THREE=null;
  const state={active:false, room:0, hasKey:false, apples:false, goblins:0, boss:false};
  const colors={stone:0x555a60, dark:0x25282b, wood:0x70452a, fire:0xff9d24, gold:0xd9b23c, goblin:0x5c9b45, boss:0x7c3aa5, apple:0xd34b36};
  function toast(t){ window.dispatchEvent(new CustomEvent("dungeon3d:toast",{detail:{text:t}})); }
  function mat(c){ return new THREE.MeshStandardMaterial({color:c,roughness:.85}); }
  function box(x,y,z,sx,sy,sz,c){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat(c)); m.position.set(x,y,z); group.add(m); return m; }
  function torch(x,y,z){ box(x,y,z,.12,.8,.12,colors.wood); const light=new THREE.PointLight(colors.fire,2.2,5); light.position.set(x,y+.55,z); group.add(light); const glow=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),mat(colors.fire)); glow.position.set(x,y+.5,z); group.add(glow); }
  function build(){ if(!window.THREE || !window.scene) return false; THREE=window.THREE; scene=window.scene; camera=window.camera; group=new THREE.Group(); group.name="AdventureGoblinCave"; scene.add(group); const rooms=[{x:0,z:0,w:10,d:10},{x:13,z:0,w:10,d:10},{x:26,z:0,w:10,d:10},{x:39,z:0,w:12,d:12}]; rooms.forEach((r,i)=>{ box(r.x,0,r.z,r.w,.5,r.d,colors.stone); box(r.x,-.5,r.z,r.w+.5,.5,r.d+.5,colors.dark); box(r.x-r.w/2,2.5,r.z,.5,5,r.d,colors.stone); box(r.x+r.w/2,2.5,r.z,.5,5,r.d,colors.stone); box(r.x,2.5,r.z-r.d/2,r.w,5,.5,colors.stone); box(r.x,2.5,r.z+r.d/2,r.w,5,.5,colors.stone); torch(r.x-r.w/2+.8,1.2,r.z-r.d/2+.8); torch(r.x+r.w/2-.8,1.2,r.z+r.d/2-.8); }); for(let i=0;i<3;i++) box(rooms[i].x+6.5,0.2,0,3,.5,2.5,colors.stone); box(13,0.5,0,1.2,1,1.2,colors.wood); const key=box(13,1.25,0,.35,.15,.7,colors.gold); key.name="dungeonKey"; box(26,0.8,0,1.8,1.2,1.1,colors.wood); box(26,1.45,0,1.9,.18,1.2,colors.gold); box(32,1.1,-4.9,1.2,2.2,.25,colors.dark); box(39,0.5,0,2.5,1,2.5,colors.dark); toast("🏰 3D-пещера гоблинов создана. Ищи проходы и сундук."); state.active=true; return true; }
  function destroy(){ if(group && scene) scene.remove(group); group=null; state.active=false; }
  function enter(){ if(!state.active && !build()) toast("⚠️ 3D-сцена ещё не готова."); else toast("🏰 Ты вошёл в пещеру гоблинов."); }
  function collectKey(){ if(!state.active) return; if(state.hasKey) return toast("🗝️ Ключ уже у тебя."); state.hasKey=true; toast("🗝️ Ты поднял золотой ключ!"); }
  function openChest(){ if(!state.hasKey) return toast("🔒 Сначала нужен ключ."); if(state.apples) return toast("📦 Сундук уже пуст."); state.apples=true; toast("🍎 В сундуке найден мешок яблок!"); window.dispatchEvent(new CustomEvent("dungeon3d:apples")); }
  function defeatGoblin(){ state.goblins++; toast("⚔️ Гоблин побеждён! Побеждено: "+state.goblins); }
  function defeatBoss(){ if(state.boss) return toast("🏆 Вожак уже побеждён."); state.boss=true; toast("🏆 Вожак гоблинов побеждён!"); window.dispatchEvent(new CustomEvent("dungeon3d:bossdefeated")); }
  return {state,build,destroy,enter,collectKey,openChest,defeatGoblin,defeatBoss};
})();


window.MiniCraftInteractionV5 = (() => {
  let THREE=null, camera=null, renderer=null, raycaster=null;
  const state={enabled:false, target:null, actionCooldown:0, hp:100, goblinHp:40};
  function toast(text){window.dispatchEvent(new CustomEvent("v5:toast",{detail:{text}}));}
  function init(){ THREE=window.THREE; camera=window.camera; renderer=window.renderer; if(!THREE || !camera) return false; raycaster=new THREE.Raycaster(); state.enabled=true; return true; }
  function raycast(max=5){ if(!state.enabled && !init()) return null; const dir=new THREE.Vector3(); camera.getWorldDirection(dir); raycaster.set(camera.position,dir); const objects=[]; const cave=window.MiniCraftDungeon3D; if(cave && cave.state.active && window.scene){ window.scene.traverse(o=>{if(o.isMesh && o.name!=="player") objects.push(o);}); } const hits=raycaster.intersectObjects(objects,true); return hits.find(h=>h.distance<=max)||null; }
  function interact(){ const hit=raycast(); if(!hit){toast("🔎 Здесь ничего интересного нет.");return;} const obj=hit.object; const name=(obj.name||"").toLowerCase(); const d=window.MiniCraftDungeon3D; if(!d){toast("⚠️ Локация не загружена.");return;} const p=obj.position; if(name.includes("dungeonkey") || (Math.abs(p.x-13)<1.5 && Math.abs(p.z)<1.5)){ d.collectKey(); return; } if(Math.abs(p.x-26)<2 && Math.abs(p.z)<2){ d.openChest(); return; } toast("👆 Ты осмотрел объект."); }
  function attack(){ const d=window.MiniCraftDungeon3D; if(!d) return; if(d.state.room===4){ d.defeatBoss(); return; } d.defeatGoblin(); }
  function bind(){ if(!init()) return; const canvas=renderer?.domElement || document.querySelector("canvas"); if(!canvas) return; let down=0; canvas.addEventListener("pointerdown",e=>{ if(e.button!==0) return; down=Date.now(); }); canvas.addEventListener("pointerup",e=>{ if(e.button!==0) return; const dt=Date.now()-down; if(dt<450) interact(); else attack(); }); }
  return {state,init,bind,interact,attack,raycast};
})();


window.MiniCraftCombatV6 = (() => {
  const enemies = [];
  let THREE=null, scene=null, player=null;
  function toast(t){window.dispatchEvent(new CustomEvent("combatv6:toast",{detail:{text:t}}));}
  function init(){ THREE=window.THREE; scene=window.scene; player=window.player || window.camera; if(!THREE || !scene) return false; return true; }
  function material(c){return new THREE.MeshStandardMaterial({color:c,roughness:.8});}
  function makeGoblin(x,z,isBoss=false){ if(!init()) return null; const g=new THREE.Group(); const skin=material(isBoss?0x6b3a86:0x4f9145); const dark=material(0x252525); const body=new THREE.Mesh(new THREE.BoxGeometry(isBoss?1.0:.75,1.1,isBoss?1.0:.75),skin); body.position.y=.85; g.add(body); const head=new THREE.Mesh(new THREE.BoxGeometry(isBoss?1.05:.82,.78,isBoss?1.05:.82),skin); head.position.y=1.65; g.add(head); const eyeMat=material(0xffff66); [-.18,.18].forEach(dx=>{ const eye=new THREE.Mesh(new THREE.SphereGeometry(.06,8,8),eyeMat); eye.position.set(dx,1.72,.42); g.add(eye); }); const weapon=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),dark); weapon.rotation.z=-.35; weapon.position.set(.52,1.0,.15); g.add(weapon); g.position.set(x,0,z); scene.add(g); const e={mesh:g,hp:isBoss?120:40,maxHp:isBoss?120:40,isBoss,alive:true,damage:isBoss?15:6}; enemies.push(e); toast(isBoss?"👑 Вожак гоблинов появился!":"👹 Гоблин появился!"); return e; }
  function spawnCaveEnemies(){ if(!init()) return; if(enemies.length) return; makeGoblin(13,2,false); makeGoblin(15,-2,false); makeGoblin(39,0,true); }
  function attackNearest(amount=20){ const live=enemies.filter(e=>e.alive); if(!live.length){toast("Здесь больше нет врагов.");return;} const p=(player && player.position)||window.camera?.position; live.sort((a,b)=>a.mesh.position.distanceTo(p)-b.mesh.position.distanceTo(p)); const e=live[0]; if(p && e.mesh.position.distanceTo(p)>4){toast("👀 Враг слишком далеко.");return;} e.hp-=amount; toast(`⚔️ Удар! ${Math.max(e.hp,0)}/${e.maxHp} HP`); if(e.hp<=0) kill(e); }
  function kill(e){ e.alive=false; if(e.mesh.parent) e.mesh.parent.remove(e.mesh); const reward=e.isBoss?100:25; if(window.MiniCraftAdventureV2){ window.MiniCraftAdventureV2.state.gold += e.isBoss?50:10; window.MiniCraftAdventureV2.state.xp += reward; if(!e.isBoss) window.MiniCraftAdventureV2.state.flags.goblins_defeated = (window.MiniCraftAdventureV2.state.flags.goblins_defeated||0)+1; } toast(e.isBoss?"🏆 Вожак побеждён! +100 опыта, +50 золота":"👹 Гоблин побеждён! +25 опыта, +10 золота"); if(e.isBoss) window.dispatchEvent(new CustomEvent("combatv6:bossdefeated")); }
  return {enemies,init,makeGoblin,spawnCaveEnemies,attackNearest};
})();


window.MiniCraftCombatV7 = (() => {
  const state={playerHP:100,maxHP:100,damageFlash:0,aiStarted:false};
  let THREE=null, camera=null, enemiesRef=null, last=0;
  function toast(t){window.dispatchEvent(new CustomEvent("combatv7:toast",{detail:{text:t}}));}
  function init(){ THREE=window.THREE; camera=window.camera; enemiesRef=window.MiniCraftCombatV6?.enemies; return !!(THREE && camera && enemiesRef); }
  function distance(e){ const p=camera?.position; return p ? e.mesh.position.distanceTo(p) : 999; }
  function tick(ts){ if(!state.aiStarted) return; const dt=Math.min((ts-last)/1000||0,.05); last=ts; if(!init()){requestAnimationFrame(tick);return;} enemiesRef.filter(e=>e.alive).forEach(e=>{ const d=distance(e); if(d<10 && d>2.1){ const p=camera.position, m=e.mesh.position; const dx=p.x-m.x, dz=p.z-m.z, len=Math.hypot(dx,dz)||1; m.x += dx/len * dt*(e.isBoss?1.25:1.0); m.z += dz/len * dt*(e.isBoss?1.25:1.0); e.mesh.lookAt(p.x,m.y,p.z); } else if(d<=2.1 && ts-(e.lastAttack||0)>1200){ e.lastAttack=ts; state.playerHP=Math.max(0,state.playerHP-(e.damage||6)); toast(`💥 Тебя атаковали! HP: ${state.playerHP}/${state.maxHP}`); window.dispatchEvent(new CustomEvent("combatv7:hp",{detail:state.playerHP})); if(state.playerHP===0){toast("☠️ Ты проиграл. Попробуй ещё раз!"); state.aiStarted=false;} } }); requestAnimationFrame(tick); }
  function startAI(){ if(!init()){toast("⚠️ Сначала создай пещеру и врагов.");return;} if(!enemiesRef.length){window.MiniCraftCombatV6.spawnCaveEnemies();} state.aiStarted=true; last=performance.now(); requestAnimationFrame(tick); toast("👹 Гоблины заметили тебя!"); }
  function heal(){ if(state.playerHP<=0){state.playerHP=100;toast("❤️ Ты возродился!");} else {state.playerHP=Math.min(state.maxHP,state.playerHP+25);toast(`❤️ Лечение: ${state.playerHP}/${state.maxHP}`);} window.dispatchEvent(new CustomEvent("combatv7:hp",{detail:state.playerHP})); }
  return {state,startAI,heal};
})();


window.MiniCraftCombatV8 = (() => {
  const state={maxHP:100,hp:100,weaponDamage:25,alive:true,respawns:0,lastAttack:0,attackRange:4};
  let THREE=null,camera=null,enemies=null;
  function toast(t){window.dispatchEvent(new CustomEvent("v8:toast",{detail:{text:t}}));}
  function init(){ THREE=window.THREE; camera=window.camera; enemies=window.MiniCraftCombatV6?.enemies || []; return !!(THREE&&camera); }
  function nearest(){ if(!init()) return null; const live=enemies.filter(e=>e.alive); live.sort((a,b)=>a.mesh.position.distanceTo(camera.position)-b.mesh.position.distanceTo(camera.position)); return live[0]||null; }
  function attack(){ if(!state.alive) return; const now=performance.now(); if(now-state.lastAttack<350) return; state.lastAttack=now; const e=nearest(); if(!e){toast("🔎 Врагов рядом нет.");return;} const d=e.mesh.position.distanceTo(camera.position); if(d>state.attackRange){toast("⚔️ Подойди ближе.");return;} e.hp-=state.weaponDamage; toast(`⚔️ Удар! ${Math.max(0,e.hp)}/${e.maxHp} HP`); if(e.hp<=0 && window.MiniCraftCombatV6) window.MiniCraftCombatV6.attackNearest(state.weaponDamage); window.dispatchEvent(new CustomEvent("v8:attack",{detail:{enemy:e}})); }
  function damage(amount){ if(!state.alive)return; state.hp=Math.max(0,state.hp-amount); window.dispatchEvent(new CustomEvent("v8:hp",{detail:state.hp})); if(state.hp<=0) die(); }
  function die(){ state.alive=false; toast("☠️ Ты погиб!"); window.dispatchEvent(new CustomEvent("v8:death")); }
  function respawn(){ state.alive=true;state.hp=state.maxHP;state.respawns++; if(camera) camera.position.set(0,2,0); toast("✨ Возрождение! Ты снова в безопасности."); window.dispatchEvent(new CustomEvent("v8:hp",{detail:state.hp})); window.dispatchEvent(new CustomEvent("v8:respawn")); }
  function heal(amount=25){ if(!state.alive){respawn();return;} state.hp=Math.min(state.maxHP,state.hp+amount); window.dispatchEvent(new CustomEvent("v8:hp",{detail:state.hp})); toast(`❤️ +${amount} HP`); }
  return {state,attack,damage,respawn,heal};
})();


window.MiniCraftAdventureV9 = (() => {
  const state = { weapon:"Железный меч", damage:30, questsCompleted:0, borisQuest:false, bossDefeated:false, apples:false };
  let THREE=null, scene=null, camera=null, slash=null;
  function toast(t){window.dispatchEvent(new CustomEvent("v9:toast",{detail:{text:t}}));}
  function init(){THREE=window.THREE;scene=window.scene;camera=window.camera;return !!(THREE&&scene&&camera);}
  function createSword(){ if(!init()) return false; if(slash && slash.parent) slash.parent.remove(slash); slash=new THREE.Group(); const metal=new THREE.MeshStandardMaterial({color:0xbfc6cc,metalness:.8,roughness:.25}); const grip=new THREE.MeshStandardMaterial({color:0x6b4226}); const blade=new THREE.Mesh(new THREE.BoxGeometry(.12,.95,.10),metal); blade.position.y=.55; slash.add(blade); const guard=new THREE.Mesh(new THREE.BoxGeometry(.45,.09,.14),metal); guard.position.y=.1; slash.add(guard); const handle=new THREE.Mesh(new THREE.BoxGeometry(.09,.35,.09),grip); handle.position.y=-.12; slash.add(handle); slash.position.set(.45,-.35,-.8); slash.rotation.set(.25,0,.35); camera.add(slash); return true; }
  function swing(){ if(!slash) createSword(); if(!slash)return; slash.rotation.z=.35; const start=performance.now(); const animate=t=>{ const p=Math.min(1,(t-start)/260); slash.rotation.z=.35-Math.sin(p*Math.PI)*1.35; if(p<1) requestAnimationFrame(animate); }; requestAnimationFrame(animate); toast("⚔️ Удар мечом!"); window.dispatchEvent(new CustomEvent("v9:slash")); }
  function startQuest(){ state.borisQuest=true; toast("📜 Квест: «Пропавшие яблоки». Найди мешок в пещере."); }
  function collectApples(){ state.apples=true; toast("🍎 Мешок яблок найден! Вернись к Борису."); window.dispatchEvent(new CustomEvent("v9:apples")); }
  function completeQuest(){ if(!state.borisQuest){toast("🧑 Борис пока не дал тебе задание.");return;} if(!state.apples){toast("🧑 Борис: сначала найди яблоки.");return;} state.questsCompleted++; state.borisQuest=false; toast("🎉 Квест выполнен! Борис награждает тебя: +100 золота."); window.dispatchEvent(new CustomEvent("v9:questcomplete")); }
  function bossDefeated(){ state.bossDefeated=true; toast("👑 Вожак повержен! Путь назад открыт."); window.dispatchEvent(new CustomEvent("v9:boss")); }
  return {state,createSword,swing,startQuest,collectApples,completeQuest,bossDefeated};
})();


window.MiniCraftGameCore = (() => {
  const KEY="minicraft_adventure_save_v10";
  const state={ version:10, player:{x:0,y:2,z:0,hp:100,maxHp:100,level:1,xp:0,gold:100}, inventory:{slots:["Железный меч","🍎 Яблоко","🧪 Зелье"],counts:[1,3,2],selected:0}, quest:{id:"apples",stage:0,active:false,completed:false}, world:{region:"Деревня",openedChests:[],defeated:[],discovered:["Деревня"]}, settings:{autoJump:true,sensitivity:1.0} };
  let saveTimer=null;
  function toast(text){window.dispatchEvent(new CustomEvent("v10:toast",{detail:{text}}));}
  function emit(){window.dispatchEvent(new CustomEvent("v10:state",{detail:structuredClone(state)}));}
  function save(){ try{ if(window.camera){ state.player.x=window.camera.position.x; state.player.y=window.camera.position.y; state.player.z=window.camera.position.z; } localStorage.setItem(KEY,JSON.stringify(state)); toast("💾 Игра сохранена"); }catch(e){toast("⚠️ Не удалось сохранить игру");} }
  function load(){ try{ const raw=localStorage.getItem(KEY); if(raw){ const s=JSON.parse(raw); Object.assign(state,s); toast("💾 Сохранение загружено"); }else toast("ℹ️ Сохранения пока нет"); emit(); }catch(e){toast("⚠️ Ошибка сохранения");} }
  function autoSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>save(),1200)}
  function xp(amount){ state.player.xp+=amount; while(state.player.xp>=state.player.level*100){ state.player.xp-=state.player.level*100; state.player.level++; state.player.maxHp+=15; state.player.hp=state.player.maxHp; toast(`⭐ Новый уровень: ${state.player.level}!`); } emit();autoSave(); }
  function damage(amount){ state.player.hp=Math.max(0,state.player.hp-amount); if(state.player.hp===0){ state.player.hp=state.player.maxHp; state.player.x=0;state.player.y=2;state.player.z=0; toast("☠️ Ты погиб. Возрождение в деревне."); } emit();autoSave(); }
  function heal(amount=25){ state.player.hp=Math.min(state.player.maxHp,state.player.hp+amount); emit();autoSave();toast(`❤️ +${amount} HP`); }
  function addItem(name,count=1){ const i=state.inventory.slots.indexOf(name); if(i>=0) state.inventory.counts[i]+=count; else {state.inventory.slots.push(name);state.inventory.counts.push(count);} emit();autoSave(); }
  function selectSlot(i){ if(i>=0 && i<state.inventory.slots.length){state.inventory.selected=i;emit();} }
  function startQuest(){ state.quest.active=true;state.quest.stage=Math.max(1,state.quest.stage); toast("📜 Квест начат: найди мешок яблок в пещере."); emit();autoSave(); }
  function progressQuest(stage){ if(!state.quest.active)return; state.quest.stage=Math.max(state.quest.stage,stage); if(stage>=2) toast("🍎 Цель обновлена: вернись к Борису."); emit();autoSave(); }
  function completeQuest(){ if(!state.quest.active || state.quest.stage<2){toast("📜 Сначала выполни цель квеста.");return;} state.quest.active=false;state.quest.completed=true;state.player.gold+=100; xp(100);toast("🎉 Квест выполнен! +100 золота и опыт."); emit();autoSave(); }
  function discover(region){ state.world.region=region; if(!state.world.discovered.includes(region))state.world.discovered.push(region); emit();autoSave(); }
  function defeat(id,rewardXp=50,rewardGold=20){ if(!state.world.defeated.includes(id)){ state.world.defeated.push(id);state.player.gold+=rewardGold;xp(rewardXp); toast(`🏆 Победа! +${rewardXp} опыта, +${rewardGold} золота.`); emit();autoSave(); } }
  function reset(){ localStorage.removeItem(KEY); location.reload(); }
  return {state,save,load,damage,heal,addItem,selectSlot,startQuest,progressQuest,completeQuest,discover,defeat,reset};
})();


window.MiniCraftV30 = (() => {
  const S = { version:30, player:{hp:100,maxHp:100,level:1,xp:0,gold:100,attack:12,defense:5}, world:{region:"Деревня",discovered:["Деревня"],day:1,time:8,weather:"Ясно"}, inventory:{items:[{id:"sword_iron",name:"Железный меч",qty:1,type:"weapon",power:12},{id:"apple",name:"Яблоко",qty:3,type:"food",heal:15},{id:"potion",name:"Зелье лечения",qty:2,type:"potion",heal:40}],selected:0}, quests:{active:null,completed:[]}, flags:{}, enemies:[], settings:{autoJump:true,sensitivity:1} };
  const SAVE="minicraft_adventure_v30";
  const emit=()=>window.dispatchEvent(new CustomEvent("v30:state",{detail:structuredClone(S)}));
  const toast=t=>window.dispatchEvent(new CustomEvent("v30:toast",{detail:{text:t}}));
  function save(){localStorage.setItem(SAVE,JSON.stringify(S));toast("💾 Сохранено");}
  function load(){ const x=localStorage.getItem(SAVE); if(x){Object.assign(S,JSON.parse(x));toast("↩️ Сохранение загружено");emit();} else toast("ℹ️ Сохранения нет"); }
  function addXP(n){ S.player.xp+=n; while(S.player.xp>=S.player.level*100){ S.player.xp-=S.player.level*100;S.player.level++; S.player.maxHp+=10;S.player.hp=S.player.maxHp;S.player.attack+=2; toast("⭐ Новый уровень "+S.player.level); } emit();save(); }
  function heal(n){ S.player.hp=Math.min(S.player.maxHp,S.player.hp+n);emit();save(); toast("❤️ +"+n+" HP"); }
  function damage(n){ const real=Math.max(1,n-S.player.defense); S.player.hp=Math.max(0,S.player.hp-real); if(S.player.hp===0){S.player.hp=S.player.maxHp;S.player.x=0;S.player.z=0;S.world.region="Деревня";toast("☠️ Возрождение в деревне");} emit();save(); }
  function discover(r){ S.world.region=r; if(!S.world.discovered.includes(r))S.world.discovered.push(r); toast("🗺️ Открыта область: "+r);emit();save(); }
  function giveItem(id,name,qty,type,extra={}){ let i=S.inventory.items.findIndex(x=>x.id===id); if(i<0)S.inventory.items.push({id,name,qty,type,...extra});else S.inventory.items[i].qty+=qty; emit();save(); }
  function useSelected(){ const it=S.inventory.items[S.inventory.selected]; if(!it)return; if(it.type==="food"||it.type==="potion"){heal(it.heal);it.qty--;if(it.qty<=0)S.inventory.items.splice(S.inventory.selected,1);} else toast("⚔️ "+it.name+" экипирован"); emit();save(); }
  function select(i){if(i>=0&&i<S.inventory.items.length){S.inventory.selected=i;emit();}}
  function startQuest(id,title,steps){ S.quests.active={id,title,step:0,steps};toast("📜 "+title);emit();save(); }
  function nextQuest(){ if(!S.quests.active)return; S.quests.active.step++; if(S.quests.active.step>=S.quests.active.steps.length){ const q=S.quests.active;S.quests.completed.push(q.id);S.quests.active=null; S.player.gold+=100;addXP(100);toast("🎉 Квест завершён: "+q.title); }else toast("📜 "+S.quests.active.steps[S.quests.active.step]); emit();save(); }
  function battle(enemy){ const dmg=Math.max(1,S.player.attack-(enemy.defense||0)); enemy.hp-=dmg;toast("⚔️ Удар: -"+dmg); if(enemy.hp<=0){S.player.gold+=(enemy.gold||10);addXP(enemy.xp||25);toast("🏆 Победа!");} else damage(enemy.attack||5); emit();save(); }
  function reset(){localStorage.removeItem(SAVE);location.reload();}
  return {S,save,load,heal,damage,discover,giveItem,useSelected,select,startQuest,nextQuest,battle,reset};
})();


window.MiniCraftV50 = (() => {
 const KEY="minicraft_adventure_v50";
 const S={ version:50, player:{hp:100,maxHp:100,mana:60,maxMana:60,level:1,xp:0,gold:100,attack:14,defense:5,magic:10,x:0,y:2,z:0}, region:"Деревня", discovered:["Деревня"], inventory:[ {id:"sword",name:"Железный меч",qty:1,kind:"weapon",power:14}, {id:"apple",name:"Яблоко",qty:4,kind:"food",heal:15}, {id:"potion",name:"Зелье",qty:2,kind:"potion",heal:40}, {id:"fire",name:"Огненный шар",qty:3,kind:"spell",cost:12,power:28} ], selected:0, quest:{id:null,step:0,done:false}, world:{day:1,time:8,weather:"Ясно",chests:[],boss:false}, enemies:[],settings:{sensitivity:1,autoJump:true} };
 const toast=t=>dispatchEvent(new CustomEvent("v50:toast",{detail:{text:t}}));
 const emit=()=>dispatchEvent(new CustomEvent("v50:state",{detail:structuredClone(S)}));
 function save(){localStorage.setItem(KEY,JSON.stringify(S));toast("💾 V50 сохранена")}
 function load(){let x=localStorage.getItem(KEY);if(x){Object.assign(S,JSON.parse(x));toast("↩️ V50 загружена");emit()}else toast("ℹ️ Нет сохранения")}
 function xp(n){S.player.xp+=n;while(S.player.xp>=S.player.level*100){S.player.xp-=S.player.level*100;S.player.level++;S.player.maxHp+=12;S.player.maxMana+=8;S.player.hp=S.player.maxHp;S.player.mana=S.player.maxMana;S.player.attack+=2;S.player.magic+=2;toast("⭐ Уровень "+S.player.level)}emit();save()}
 function heal(n){S.player.hp=Math.min(S.player.maxHp,S.player.hp+n);emit();save();toast("❤️ +"+n)}
 function mana(n){S.player.mana=Math.min(S.player.maxMana,S.player.mana+n);emit();save()}
 function damage(n){S.player.hp=Math.max(0,S.player.hp-Math.max(1,n-S.player.defense));if(S.player.hp===0){S.player.hp=S.player.maxHp;S.player.mana=S.player.maxMana;S.region="Деревня";S.player.x=0;S.player.z=0;toast("☠️ Возрождение в деревне")}emit();save()}
 function discover(r){S.region=r;if(!S.discovered.includes(r))S.discovered.push(r);toast("🗺️ Открыта: "+r);emit();save()}
 function startQuest(){S.quest={id:"cave_apples",step:1,done:false};toast("📜 Борис: найди яблоки в пещере");emit();save()}
 function questNext(){if(!S.quest.id){startQuest();return}S.quest.step=Math.min(4,S.quest.step+1);const a=["","Найди лес","Найди вход в пещеру","Возьми яблоки из сундука","Вернись к Борису"];toast("📜 "+a[S.quest.step]);emit();save()}
 function questComplete(){if(S.quest.id&&S.quest.step>=4){S.quest.done=true;S.player.gold+=150;xp(150);toast("🎉 Квест завершён! +150 золота")}else toast("📜 Цель ещё не выполнена")}
 function addItem(id,name,kind,qty,extra={}){let i=S.inventory.findIndex(x=>x.id===id);if(i>=0)S.inventory[i].qty+=qty;else S.inventory.push({id,name,kind,qty,...extra});emit();save()}
 function select(i){if(i>=0&&i<S.inventory.length){S.selected=i;emit()}}
 function use(){let it=S.inventory[S.selected];if(!it)return;if(it.kind==="food"||it.kind==="potion"){heal(it.heal);it.qty--;if(it.qty<=0)S.inventory.splice(S.selected,1);S.selected=Math.min(S.selected,Math.max(0,S.inventory.length-1));emit();save()}else if(it.kind==="spell"){if(S.player.mana<it.cost){toast("🔵 Недостаточно маны");return}S.player.mana-=it.cost;toast("🔥 Заклинание подготовлено");emit();save()}else toast("⚔️ "+it.name+" экипирован")}
 function spawnEnemy(type="Гоблин"){let e={id:Date.now(),name:type,hp:type==="Вожак пещеры"?90:35,maxHp:type==="Вожак пещеры"?90:35,attack:type==="Вожак пещеры"?14:7,defense:type==="Вожак пещеры"?5:2,xp:type==="Вожак пещеры"?120:35,gold:type==="Вожак пещеры"?80:15};S.enemies.push(e);toast("👹 Появился "+type);emit()}
 function attackEnemy(){let e=S.enemies[0];if(!e){toast("⚔️ Поблизости нет врага");return}let it=S.inventory[S.selected];let d=Math.max(1,S.player.attack-(e.defense||0));if(it&&it.kind==="weapon")d+=it.power||0;e.hp-=d;toast("⚔️ -"+d+" HP");if(e.hp<=0){S.enemies.shift();S.player.gold+=e.gold;xp(e.xp);if(e.name==="Вожак пещеры")S.world.boss=true}else damage(e.attack);emit();save()}
 function cast(){let it=S.inventory.find(x=>x.kind==="spell"&&x.qty>0);if(!it){toast("🔥 Нет заклинаний");return}if(S.player.mana<it.cost){toast("🔵 Мало маны");return}S.player.mana-=it.cost;let e=S.enemies[0];if(e){e.hp-=it.power;it.qty--;toast("🔥 Огненный шар: -"+it.power);if(e.hp<=0){S.enemies.shift();S.player.gold+=e.gold;xp(e.xp)}}else toast("🔥 Огненный шар выпущен");emit();save()}
 function advanceTime(){S.world.time+=1;if(S.world.time>=24){S.world.time=0;S.world.day++}if(S.world.time>=19||S.world.time<6)S.world.weather="Ночь";else S.world.weather=(S.world.day%3===0?"Дождь":"Ясно");emit()}
 function openChest(id="cave1"){if(S.world.chests.includes(id)){toast("📦 Сундук пуст");return}S.world.chests.push(id);addItem("gem","Изумруд","loot",1);S.player.gold+=50;toast("💎 Сундук открыт: +изумруд +50 золота");if(S.quest.id&&S.quest.step===3)questNext();emit();save()}
 function reset(){localStorage.removeItem(KEY);location.reload()}
 return {S,save,load,xp,heal,mana,damage,discover,startQuest,questNext,questComplete,addItem,select,use,spawnEnemy,attackEnemy,cast,advanceTime,openChest,reset};
})();


(()=>{const G=window.MiniCraftV50,t=document.getElementById('v50toast'),h=document.getElementById('v50hot');
function show(s){t.textContent=s;t.style.display='block';clearTimeout(show.x);show.x=setTimeout(()=>t.style.display='none',2200)}
function render(){let s=G.S,p=s.player;
const lvl=document.getElementById('v50lvl'); if(lvl)lvl.textContent=p.level;
const gold=document.getElementById('v50gold'); if(gold)gold.textContent=p.gold;
const hp=document.getElementById('v50hp'); if(hp)hp.textContent=p.hp+'/'+p.maxHp;
const mana=document.getElementById('v50mana'); if(mana)mana.textContent=p.mana+'/'+p.maxMana;
const atk=document.getElementById('v50atk'); if(atk)atk.textContent=p.attack;
const def=document.getElementById('v50def'); if(def)def.textContent=p.defense;
const region=document.getElementById('v50region'); if(region)region.textContent=s.region;
const day=document.getElementById('v50day'); if(day)day.textContent=s.world.day;
const time=document.getElementById('v50time'); if(time)time.textContent=String(s.world.time).padStart(2,'0');
const weather=document.getElementById('v50weather'); if(weather)weather.textContent=s.world.weather;
const disc=document.getElementById('v50disc'); if(disc)disc.textContent=s.discovered.join(', ');
const q=document.getElementById('v50q'); if(q)q.textContent=!s.quest.id?(s.quest.done?'Выполнен':'Поговори с Борисом'):s.quest.step===1?'Иди в лес':s.quest.step===2?'Найди пещеру':s.quest.step===3?'Открой сундук':s.quest.step===4?'Вернись к Борису':'Готово';
if(h){h.innerHTML='';s.inventory.slice(0,8).forEach((it,i)=>{let b=document.createElement('button');b.textContent=it.name.slice(0,4)+' '+it.qty;if(i===s.selected)b.className='sel';b.onclick=()=>G.select(i);h.appendChild(b)})}}
document.addEventListener('v50:toast',e=>show(e.detail.text));document.addEventListener('v50:state',render);
const saveBtn=document.getElementById('v50save'); if(saveBtn)saveBtn.onclick=G.save;
const loadBtn=document.getElementById('v50load'); if(loadBtn)loadBtn.onclick=G.load;
const useBtn=document.getElementById('v50use'); if(useBtn)useBtn.onclick=G.use;
const magicBtn=document.getElementById('v50magic'); if(magicBtn)magicBtn.onclick=G.cast;
const attackBtn=document.getElementById('v50attack'); if(attackBtn)attackBtn.onclick=G.attackEnemy;
const jumpBtn=document.getElementById('v50jump'); if(jumpBtn)jumpBtn.onclick=()=>show("🦘 Прыжок");
const runBtn=document.getElementById('v50run'); if(runBtn)runBtn.onclick=()=>show("🏃 Бег включён");
const mineBtn=document.getElementById('v50mine'); if(mineBtn)mineBtn.onclick=()=>G.openChest();
const qbBtn=document.getElementById('v50qb'); if(qbBtn)qbBtn.onclick=()=>{let s=G.S;if(!s.quest.id)G.startQuest();else if(s.quest.step<4)G.questNext();else G.questComplete()};
render();
})();

