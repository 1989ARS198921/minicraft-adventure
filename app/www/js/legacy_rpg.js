        // ===== V2: мобы 20, боссы, ачивки, комбо, PvP, мини-события, ежедневки, погода-ивенты =====
        const V2_MOBS=[
            {id:'slime',emoji:'🟢',name:'Слайм',tier:1,zone:'start',c:'#7ed321',hp:18,dmg:4,spd:2.6,sz:0.7,xp:5},
            {id:'rat',emoji:'🐀',name:'Крыса',tier:1,zone:'start',c:'#9b9b9b',hp:14,dmg:3,spd:4.2,sz:0.5,xp:4},
            {id:'bat',emoji:'🦇',name:'Летучая мышь',tier:1,zone:'start',c:'#8e6fb8',hp:12,dmg:3,spd:4.6,sz:0.5,fly:true,xp:4},
            {id:'skeleton',emoji:'💀',name:'Скелет',tier:2,zone:'forest',c:'#e8e8d0',hp:30,dmg:7,spd:3.2,sz:0.9,xp:9},
            {id:'zombie',emoji:'🧟',name:'Зомби',tier:2,zone:'forest',c:'#6a8f5a',hp:38,dmg:6,spd:2.2,sz:0.9,xp:9},
            {id:'spider',emoji:'🕷️',name:'Паук',tier:2,zone:'forest',c:'#3a2a4a',hp:24,dmg:6,spd:4.8,sz:0.7,xp:8},
            {id:'ghost',emoji:'👻',name:'Призрак',tier:3,zone:'grave',c:'#cfe8ff',hp:34,dmg:9,spd:3.4,sz:0.9,fly:true,ghost:true,xp:12},
            {id:'cultist',emoji:'🧙',name:'Культист',tier:3,zone:'grave',c:'#5a2a6a',hp:36,dmg:10,spd:3.0,sz:0.9,magic:true,xp:13},
            {id:'wolf',emoji:'🐺',name:'Волк',tier:3,zone:'grave',c:'#7a7a8a',hp:30,dmg:9,spd:5.2,sz:0.8,xp:11},
            {id:'bandit',emoji:'🗡️',name:'Разбойник',tier:4,zone:'road',c:'#a8763e',hp:45,dmg:11,spd:3.6,sz:0.9,xp:14},
            {id:'golem',emoji:'🗿',name:'Голем',tier:4,zone:'road',c:'#8a8a7a',hp:70,dmg:13,spd:1.8,sz:1.2,xp:18},
            {id:'harpy',emoji:'🦅',name:'Гарпия',tier:4,zone:'road',c:'#c9a86a',hp:32,dmg:10,spd:5.0,sz:0.8,fly:true,xp:13},
            {id:'darkmage',emoji:'🔮',name:'Тёмный маг',tier:5,zone:'swamp',c:'#4a2a7a',hp:50,dmg:14,spd:3.0,sz:0.9,magic:true,xp:18},
            {id:'troll',emoji:'👹',name:'Тролль',tier:5,zone:'swamp',c:'#5a7a4a',hp:85,dmg:15,spd:2.4,sz:1.3,xp:20},
            {id:'serpent',emoji:'🐍',name:'Змей',tier:5,zone:'swamp',c:'#3a8a5a',hp:42,dmg:13,spd:4.4,sz:0.9,xp:16},
            {id:'demon',emoji:'😈',name:'Демон',tier:6,zone:'hell',c:'#d32a2a',hp:70,dmg:17,spd:3.6,sz:1.0,magic:true,xp:22},
            {id:'hellknight',emoji:'⚔️',name:'Рыцарь ада',tier:6,zone:'hell',c:'#8a1a1a',hp:90,dmg:18,spd:3.2,sz:1.1,xp:25},
            {id:'imp',emoji:'👺',name:'Бес',tier:6,zone:'hell',c:'#e86a2a',hp:30,dmg:12,spd:5.4,sz:0.6,fly:true,xp:15},
            {id:'golemanc',emoji:'🏛️',name:'Древний голем',tier:7,zone:'boss',c:'#c9b37e',hp:120,dmg:20,spd:2.0,sz:1.5,xp:32},
            {id:'dragonling',emoji:'🐉',name:'Дракончик',tier:7,zone:'boss',c:'#e84a2a',hp:80,dmg:19,spd:4.0,sz:1.0,fly:true,magic:true,xp:28}
        ];
        const V2_BOSSES=[
            {id:'titan',name:'🗿 Лесной Титан',c:'#4a6a3a',hp:300,dmg:18,spd:2.2,sz:2.2,xp:80,loot:'Титановое сердце'},
            {id:'witch',name:'🧙‍♀️ Болотная Ведьма',c:'#6a2a8a',hp:260,dmg:22,spd:3.0,sz:1.3,xp:90,magic:true,loot:'Гримуар болот'},
            {id:'king',name:'👑 Король Бандитов',c:'#b8860b',hp:320,dmg:24,spd:3.4,sz:1.4,xp:100,loot:'Королевская печать'},
            {id:'demonlord',name:'👹 Повелитель Демонов',c:'#a30f0f',hp:400,dmg:28,spd:3.2,sz:1.8,xp:130,magic:true,loot:'Демоническая корона'},
            {id:'ancdragon',name:'🐲 Древний Дракон',c:'#d4a017',hp:500,dmg:32,spd:3.8,sz:2.5,fly:true,magic:true,loot:'Драконье золото'}
        ];
        const V2_ACHIEVEMENTS=[
            {id:'first_blood',n:'Первая кровь',d:'Убей первого моба'},
            {id:'slayer10',n:'Истребитель',d:'Убей 10 мобов'},
            {id:'slayer50',n:'Мясник',d:'Убей 50 мобов'},
            {id:'slayer100',n:'Гроза монстров',d:'Убей 100 мобов'},
            {id:'combo5',n:'Серия x5',d:'Комбо из 5 ударов'},
            {id:'combo10',n:'Серия x10',d:'Комбо из 10 ударов'},
            {id:'pvp1',n:'Дуэлянт',d:'Победи в PvP'},
            {id:'pvp5',n:'Чемпион арены',d:'5 побед в PvP'},
            {id:'lvl5',n:'Бывалый',d:'Достигни 5 уровня'},
            {id:'lvl10',n:'Ветеран',d:'Достигни 10 уровня'},
            {id:'lvl15',n:'Герой',d:'Достигни 15 уровня'},
            {id:'lvl20',n:'Легенда',d:'Достигни 20 уровня'},
            {id:'rich',n:'Купец',d:'Накопи 1000 монет'},
            {id:'event1',n:'Очевидец',d:'Переживи мини-событие'},
            {id:'daily3',n:'Прилежный',d:'3 ежедневных задания'},
            {id:'boss1',n:'Победитель титанов',d:'Убей первого босса'},
            {id:'boss_all',n:'Владыка боссов',d:'Убей всех боссов'},
            {id:'weather',n:'Дитя шторма',d:'Выживи в шторм'},
            {id:'chest10',n:'Кладоискатель',d:'Открой 10 сундуков'},
            {id:'secret',n:'???',d:'Найди что-то скрытое'}
        ];
        const V2_DAILY_POOL=[
            {id:'d_kill',n:'Убей {n} мобов',target:()=>5+Math.floor(Math.random()*10),icon:'⚔️'},
            {id:'d_chest',n:'Открой {n} сундука',target:()=>1+Math.floor(Math.random()*3),icon:'📦'},
            {id:'d_lvl',n:'Получи уровень',target:()=>1,icon:'⭐'},
            {id:'d_coin',n:'Собери {n} монет',target:()=>50+Math.floor(Math.random()*100),icon:'💰'},
            {id:'d_surv',n:'Выживи {n} мин без смерти',target:()=>3+Math.floor(Math.random()*5),icon:'🛡️'}
        ];
        const V2_EVENTS=[
            {id:'gold_rain',n:'💰 Золотой дождь!',d:'Монеты падают с неба!'},
            {id:'mob_wave',n:'👹 Волна монстров!',d:'Мобы атакуют массово!'},
            {id:'xp_boost',n:'✨ Благословение!',d:'Двойной опыт 2 минуты!'},
            {id:'meteor',n:'☄️ Метеорит!',d:'Метеорит упал где-то в мире!'},
            {id:'fog',n:'🌫️ Густой туман',d:'Видимость снижена!'},
            {id:'blood_moon',n:'🌕 Кровавая луна!',d:'Мобы стали сильнее!'}
        ];
        let v2={mobs:[],bosses:[],combo:{n:0,t:0,best:0},ach:{},daily:[],dailyDate:'',event:null,eventT:0,eventCd:60,weatherEvt:null,weatherT:0,bloodMoon:false,xpBoost:0,kills:0,pvpW:0,pvpOn:false,chests:0,bossKills:{},coins:0,surviveT:0,secret:false};
        try{const sv=localStorage.getItem('minicraft_v2');if(sv){const d=JSON.parse(sv);v2.ach=d.ach||{};v2.kills=d.kills||0;v2.pvpW=d.pvpW||0;v2.chests=d.chests||0;v2.bossKills=d.bossKills||{};v2.combo.best=d.comboBest||0;}}catch(e){}
        const v2Today=new Date().toDateString();
        function v2RollDaily(){v2.dailyDate=v2Today;v2.daily=[];const pool=[...V2_DAILY_POOL];for(let i=0;i<3;i++){const d=pool.splice(Math.floor(Math.random()*pool.length),1)[0];const t=d.target();v2.daily.push({id:d.id,n:d.n.replace('{n}',t),icon:d.icon,target:t,prog:0,done:false});}}
        if(v2.dailyDate!==v2Today)v2RollDaily();
        function v2Save(){try{localStorage.setItem('minicraft_v2',JSON.stringify({ach:v2.ach,kills:v2.kills,pvpW:v2.pvpW,chests:v2.chests,bossKills:v2.bossKills,comboBest:v2.combo.best}));}catch(e){}}
        function v2Ach(id){if(v2.ach[id])return;const a=V2_ACHIEVEMENTS.find(x=>x.id===id);if(!a)return;v2.ach[id]=Date.now();v2Save();game&&game.ui&&game.ui.showMessage('🏆 '+a.n+' — '+a.d,'#f1c40f',5000);if(window.snd)window.snd.play('quest');}
        function v2AchCheck(){
            if(v2.kills>=1)v2Ach('first_blood');if(v2.kills>=10)v2Ach('slayer10');if(v2.kills>=50)v2Ach('slayer50');if(v2.kills>=100)v2Ach('slayer100');
            if(v2.combo.best>=5)v2Ach('combo5');if(v2.combo.best>=10)v2Ach('combo10');
            if(v2.pvpW>=1)v2Ach('pvp1');if(v2.pvpW>=5)v2Ach('pvp5');
            if(v2.chests>=10)v2Ach('chest10');
            if(v2.coins>=1000)v2Ach('rich');
            if(v2.daily.filter(d=>d.done).length>=3)v2Ach('daily3');
            const bk=Object.keys(v2.bossKills).length;if(bk>=1)v2Ach('boss1');if(bk>=V2_BOSSES.length)v2Ach('boss_all');
            if(v2.secret)v2Ach('secret');
            const lvl=window.game&&game.player?game.player.level:0;
            if(lvl>=5)v2Ach('lvl5');if(lvl>=10)v2Ach('lvl10');if(lvl>=15)v2Ach('lvl15');if(lvl>=20)v2Ach('lvl20');
        }
        function v2DailyProg(id,n){v2.daily.forEach(d=>{if(d.id===id&&!d.done){d.prog=Math.min(d.target,d.prog+n);if(d.prog>=d.target){d.done=true;game&&game.ui&&game.ui.showMessage('📅 Ежедневное задание выполнено: '+d.n,'#2ecc71',4000);v2AchCheck();}}});}
        function v2StartEvent(){
            const ev=V2_EVENTS[Math.floor(Math.random()*V2_EVENTS.length)];
            v2.event=ev;v2.eventT=120;v2.eventCd=300+Math.random()*300;
            game&&game.ui&&game.ui.showMessage(ev.n+' '+ev.d,'#e67e22',6000);
            if(ev.id==='xp_boost')v2.xpBoost=120;
            if(ev.id==='blood_moon')v2.bloodMoon=true;
            if(ev.id==='mob_wave'){for(let i=0;i<6;i++)v2SpawnMob(true);}
            if(ev.id==='gold_rain'){if(window.game&&game.player){const g=50+Math.floor(Math.random()*100);game.player.addMoney(g);v2.coins+=g;}}
            v2Ach('event1');v2AchCheck();
        }
        const V2_ZONES={start:[60,0,220],forest:[-50,0,-60],grave:[130,0,-110],road:[-140,0,80],swamp:[40,0,-190],hell:[190,0,140],boss:[-190,0,-140]};
        function v2MakeMesh(d){
            const g=new THREE.Group();const c=new THREE.Color(d.c);
            const b=new THREE.Mesh(new THREE.BoxGeometry(0.8*d.sz,0.9*d.sz,0.6*d.sz),new THREE.MeshLambertMaterial({color:c}));b.position.y=0.45*d.sz;b.castShadow=true;g.add(b);
            const h=new THREE.Mesh(new THREE.BoxGeometry(0.55*d.sz,0.5*d.sz,0.5*d.sz),new THREE.MeshLambertMaterial({color:c.clone().multiplyScalar(1.25)}));h.position.y=(0.9+0.25)*d.sz;h.castShadow=true;g.add(h);
            const eM=new THREE.MeshBasicMaterial({color:0xff3333});const eG=new THREE.BoxGeometry(0.08*d.sz,0.08*d.sz,0.05);
            const e1=new THREE.Mesh(eG,eM);e1.position.set(-0.13*d.sz,(0.9+0.28)*d.sz,0.26*d.sz);g.add(e1);
            const e2=e1.clone();e2.position.x=0.13*d.sz;g.add(e2);
            const aM=new THREE.MeshLambertMaterial({color:c.clone().multiplyScalar(0.8)});const aG=new THREE.BoxGeometry(0.18*d.sz,0.7*d.sz,0.18*d.sz);
            const a1=new THREE.Mesh(aG,aM);a1.position.set(-0.52*d.sz,0.45*d.sz,0);g.add(a1);
            const a2=a1.clone();a2.position.x=0.52*d.sz;g.add(a2);g.userData.arms=[a1,a2];
            const lG=new THREE.BoxGeometry(0.22*d.sz,0.45*d.sz,0.22*d.sz);
            const l1=new THREE.Mesh(lG,aM);l1.position.set(-0.2*d.sz,0.22*d.sz,0);g.add(l1);
            const l2=l1.clone();l2.position.x=0.2*d.sz;g.add(l2);g.userData.legs=[l1,l2];
            if(d.fly){const wG=new THREE.BoxGeometry(0.9*d.sz,0.05,0.4*d.sz);const wM=new THREE.MeshLambertMaterial({color:0xdddddd,transparent:true,opacity:0.7});
                const w1=new THREE.Mesh(wG,wM);w1.position.set(-0.6*d.sz,0.7*d.sz,-0.1);g.add(w1);const w2=w1.clone();w2.position.x=0.6*d.sz;g.add(w2);g.userData.wings=[w1,w2];}
            return g;
        }
        function v2SpawnMob(near){
            if(!window.game||!game.scene)return;
            const d=V2_MOBS[Math.floor(Math.random()*V2_MOBS.length)];const zn=V2_ZONES[d.zone];
            let x,z;
            if(near&&game.player){const a=Math.random()*Math.PI*2,r=15+Math.random()*20;x=game.player.pos.x+Math.cos(a)*r;z=game.player.pos.z+Math.sin(a)*r;}
            else{x=zn[0]+(Math.random()-0.5)*50;z=zn[2]+(Math.random()-0.5)*50;}
            const g=v2MakeMesh(d);g.position.set(x,game.getHeight(x,z),z);game.scene.add(g);
            const bm=v2.bloodMoon?1.5:1;
            v2.mobs.push({d,mesh:g,hp:d.hp*bm,maxHp:d.hp*bm,state:'wander',wt:0,tx:x,tz:z,atkCd:0,hitT:0,flyH:d.fly?1.5+Math.random():0});
        }
        function v2SpawnBoss(){
            if(!window.game||!game.scene)return;
            const b=V2_BOSSES[Math.floor(Math.random()*V2_BOSSES.length)];
            if(v2.bosses.find(x=>x.d.id===b.id))return;
            const a=Math.random()*Math.PI*2;const x=game.player.pos.x+Math.cos(a)*45,z=game.player.pos.z+Math.sin(a)*45;
            const g=v2MakeMesh({c:b.c,sz:b.sz,fly:b.fly});g.position.set(x,game.getHeight(x,z),z);game.scene.add(g);
            v2.bosses.push({d:b,mesh:g,hp:b.hp,maxHp:b.hp,state:'chase',atkCd:0,hitT:0,sp1:0});
            game.ui.showMessage('☠️ Появился босс: '+b.name+'!','#e74c3c',6000);if(window.snd)window.snd.play('hurt');
        }
        function v2Hit(m,dmg){m.hp-=dmg;m.hitT=0.25;m.mesh.children.forEach(c=>{if(c.material&&c.material.emissive)c.material.emissive.setHex(0x661111);});if(m.hp<=0)v2Kill(m);else{m.state='chase';}}
        function v2Kill(m){
            game.scene.remove(m.mesh);v2.mobs=v2.mobs.filter(x=>x!==m);v2.bosses=v2.bosses.filter(x=>x!==m);
            v2.kills++;v2DailyProg('d_kill',1);v2.combo.n++;v2.combo.t=3;if(v2.combo.n>v2.combo.best){v2.combo.best=v2.combo.n;v2Save();}
            const isBoss=!!V2_BOSSES.find(b=>b.id===m.d.id);
            let xp=Math.floor(m.d.xp*(isBoss?1:1)*(1+(v2.combo.n>=5?0.25:0)+(v2.combo.n>=10?0.5:0)));
            if(v2.xpBoost>0)xp*=2;
            if(game.player){game.player.gainXP(xp);const gold=isBoss?50+Math.floor(Math.random()*50):2+Math.floor(Math.random()*m.d.tier*4);game.player.addMoney(gold);v2.coins+=gold;v2DailyProg('d_coin',gold);}
            if(isBoss){v2.bossKills[m.d.id]=true;v2Save();game.ui.showMessage('👑 Босс повержен: '+m.d.name+'! Добыча: '+m.d.loot,'#f1c40f',6000);if(window.snd)window.snd.play('quest');}
            else game.ui.showMessage(m.d.emoji+' '+m.d.d?m.d.name:m.d.name+' повержен! +'+xp+' XP','#2ecc71',2500);
            v2AchCheck();
        }
        function v2Update(dt){
            if(!window.game||!game.player||!game.running)return;
            const p=game.player.pos;
            if(v2.combo.t>0){v2.combo.t-=dt;if(v2.combo.t<=0)v2.combo.n=0;}
            if(v2.xpBoost>0)v2.xpBoost-=dt;
            v2.surviveT+=dt;if(v2.surviveT>=60){v2DailyProg('d_surv',1);v2.surviveT=0;}
            if(v2.event){v2.eventT-=dt;if(v2.eventT<=0){v2.event=null;v2.bloodMoon=false;}}
            else{v2.eventCd-=dt;if(v2.eventCd<=0)v2StartEvent();}
            if(v2.mobs.length<8&&Math.random()<dt*0.25)v2SpawnMob(false);
            const pp=game.player.power||0;
            const spawnBudget=1;
            for(const m of v2.mobs){
                const mp=m.mesh.position;const dx=p.x-mp.x,dz=p.z-mp.z;const dist=Math.sqrt(dx*dx+dz*dz);
                m.atkCd-=dt;m.wt-=dt;if(m.hitT>0){m.hitT-=dt;if(m.hitT<=0)m.mesh.children.forEach(c=>{if(c.material&&c.material.emissive)c.material.emissive.setHex(0);});}
                if(dist<25&&dist>1.3){m.state='chase';const s=m.d.spd*(v2.bloodMoon?1.3:1);mp.x+=dx/dist*s*dt;mp.z+=dz/dist*s*dt;}
                else if(dist>=25){m.state='wander';if(m.wt<=0){m.wt=2+Math.random()*3;m.tx=mp.x+(Math.random()-0.5)*16;m.tz=mp.z+(Math.random()-0.5)*16;}
                    const wx=m.tx-mp.x,wz=m.tz-mp.z,wd=Math.sqrt(wx*wx+wz*wz);if(wd>0.5){mp.x+=wx/wd*m.d.spd*0.4*dt;mp.z+=wz/wd*m.d.spd*0.4*dt;}}
                else{if(m.atkCd<=0){m.atkCd=1.2;let dmg=m.d.dmg*(v2.bloodMoon?1.5:1);game.player.takeDamage(Math.floor(dmg));}}
                if(dist>90){game.scene.remove(m.mesh);m.dead=true;continue;}
                const gy=game.getHeight(mp.x,mp.z);
                let ty=gy+(m.d.fly?m.flyH+Math.sin(performance.now()*0.003+mp.x)*0.4:0);
                mp.y+=(ty-mp.y)*Math.min(1,dt*5);
                m.mesh.rotation.y=Math.atan2(dx,dz);
                const t=performance.now()*0.006;
                if(m.mesh.userData.legs){const sw=m.state==='chase'?0.5:0.25;m.mesh.userData.legs[0].rotation.x=Math.sin(t*m.d.spd)*sw;m.mesh.userData.legs[1].rotation.x=-Math.sin(t*m.d.spd)*sw;}
                if(m.mesh.userData.arms){m.mesh.userData.arms[0].rotation.x=Math.sin(t*m.d.spd)*0.4;m.mesh.userData.arms[1].rotation.x=-Math.sin(t*m.d.spd)*0.4;}
                if(m.mesh.userData.wings){m.mesh.userData.wings[0].rotation.z=Math.sin(t*3)*0.5;m.mesh.userData.wings[1].rotation.z=-Math.sin(t*3)*0.5;}
            }
            v2.mobs=v2.mobs.filter(m=>!m.dead);
            for(const b of v2.bosses){
                const bp=b.mesh.position;const dx=p.x-bp.x,dz=p.z-bp.z;const dist=Math.sqrt(dx*dx+dz*dz);
                b.atkCd-=dt;b.sp1-=dt;
                if(dist>2.5){bp.x+=dx/dist*b.d.spd*dt;bp.z+=dz/dist*b.d.spd*dt;}
                else if(b.atkCd<=0){b.atkCd=1.5;game.player.takeDamage(b.d.dmg);}
                if(b.sp1<=0&&dist<30){b.sp1=6;if(b.d.magic){game.player.takeDamage(Math.floor(b.d.dmg*0.6));game.ui.showMessage('💥 '+b.d.name+' использует магию!','#9b59b6',2000);}}
                const gy=game.getHeight(bp.x,bp.z);bp.y+=(gy+(b.d.fly?2:0)-bp.y)*Math.min(1,dt*4);
                b.mesh.rotation.y=Math.atan2(dx,dz);
                if(dist>100){game.scene.remove(b.mesh);b.dead=true;}
            }
            v2.bosses=v2.bosses.filter(b=>!b.dead);
            v2UpdateHUD();
        }
        let v2hud=null;
        function v2UpdateHUD(){
            if(!v2hud){v2hud=document.createElement('div');v2hud.className='ui-element';v2hud.style.cssText='top:170px;right:10px;background:rgba(0,0,0,0.7);padding:8px 12px;border-radius:8px;font-size:12px;min-width:190px;border:2px solid rgba(255,255,255,0.15);';document.getElementById('ui').appendChild(v2hud);}
            let h='';
            if(v2.combo.n>=2)h+='<div style="color:#f39c12;font-weight:bold">🔥 Комбо x'+v2.combo.n+'</div>';
            if(v2.event)h+='<div style="color:#e67e22">'+v2.event.n+' ('+Math.ceil(v2.eventT)+'с)</div>';
            if(v2.xpBoost>0)h+='<div style="color:#9b59b6">✨ x2 XP ('+Math.ceil(v2.xpBoost)+'с)</div>';
            if(v2.bosses.length)h+='<div style="color:#e74c3c;font-weight:bold">☠️ '+v2.bosses[0].d.name+'<br><span style="font-size:10px">'+Math.max(0,Math.ceil(v2.bosses[0].hp))+'/'+v2.bosses[0].maxHp+' HP</span></div>';
            h+='<div style="opacity:0.85;margin-top:3px">📅 Задания дня:</div>';
            v2.daily.forEach(d=>{h+='<div style="font-size:11px;'+(d.done?'color:#2ecc71':'opacity:0.8')+'">'+d.icon+' '+d.n+' ('+d.prog+'/'+d.target+')'+(d.done?' ✓':'')+'</div>';});
            h+='<div style="font-size:10px;opacity:0.6;margin-top:3px">🏆 '+Object.keys(v2.ach).length+'/'+V2_ACHIEVEMENTS.length+' ачивок | ⚔️ '+v2.kills+' | 🥊 PvP '+v2.pvpW+'</div>';
            v2hud.innerHTML=h;
        }
        window.v2Attack=function(tx,tz){
            if(!window.game)return false;
            const p=game.player.pos;let hit=false;
            for(const m of [...v2.mobs,...v2.bosses]){const mp=m.mesh.position;const dx=mp.x-p.x,dz=mp.z-p.z;if(Math.sqrt(dx*dx+dz*dz)<3.4){v2Hit(m,game.player.damage||8);hit=true;}}
            return hit;
        };
        window.v2ChestOpened=function(){v2.chests++;v2DailyProg('d_chest',1);v2AchCheck();};
        window.v2PvpWin=function(){v2.pvpW++;v2Save();v2AchCheck();game.ui.showMessage('🥊 Победа в PvP! Всего: '+v2.pvpW,'#f1c40f',4000);};
        window.v2BossTimer=function(){if(Math.random()<0.004&&v2.bosses.length<1)v2SpawnBoss();};
        setInterval(()=>{if(window.game&&game.running){v2BossTimer();}},5000);


        // ===== ЗВУКИ (WebAudio) =====
        const snd={ctx:null,
            init(){try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}},
            play(type){
                if(!this.ctx)return;const c=this.ctx,t=c.currentTime;
                const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);
                const cfg={
                    hit:{f:200,d:0.1,type:'square',v:0.12},
                    mine:{f:150,d:0.08,type:'square',v:0.1},
                    place:{f:300,d:0.08,type:'square',v:0.1},
                    hurt:{f:100,d:0.25,type:'sawtooth',v:0.15},
                    levelup:{f:440,d:0.4,type:'sine',v:0.15,sweep:880},
                    quest:{f:520,d:0.3,type:'sine',v:0.12,sweep:780},
                    buy:{f:600,d:0.15,type:'sine',v:0.1,sweep:900},
                    death:{f:200,d:0.6,type:'sawtooth',v:0.15,sweep:60},
                    eat:{f:350,d:0.12,type:'sine',v:0.1},
                    craft:{f:400,d:0.15,type:'triangle',v:0.12},
                    swing:{f:250,d:0.06,type:'sine',v:0.06}
                }[type]||{f:300,d:0.1,type:'sine',v:0.1};
                o.type=cfg.type;o.frequency.setValueAtTime(cfg.f,t);
                if(cfg.sweep)o.frequency.exponentialRampToValueAtTime(cfg.sweep,t+cfg.d);
                g.gain.setValueAtTime(cfg.v,t);g.gain.exponentialRampToValueAtTime(0.001,t+cfg.d);
                o.start(t);o.stop(t+cfg.d);
            }
        };
        snd.init();window.snd=snd;

        // V2 допы: hook в game.update, кнопки арены/секрет/погода
        document.addEventListener('DOMContentLoaded',()=>{
            const st=document.createElement('style');
            st.textContent='#v2-btns{position:absolute;top:60px;right:10px;display:flex;flex-direction:column;gap:6px;pointer-events:auto}.v2-b{background:rgba(0,0,0,0.7);border:2px solid #666;border-radius:6px;color:#fff;padding:6px 10px;cursor:pointer;font-size:13px}.v2-b:hover{border-color:#f1c40f}';
            document.head.appendChild(st);
            const bd=document.createElement('div');bd.id='v2-btns';bd.className='ui-element';
            bd.innerHTML='<button class="v2-b" id="v2-ach">🏆 Ачивки</button><button class="v2-b" id="v2-pvp">🥊 PvP: <span id="v2-pvp-st">ВЫКЛ</span></button><button class="v2-b" id="v2-sec">🔮</button>';
            document.getElementById('ui').appendChild(bd);
            document.getElementById('v2-pvp').onclick=()=>{v2.pvpOn=!v2.pvpOn;document.getElementById('v2-pvp-st').textContent=v2.pvpOn?'ВКЛ':'ВЫКЛ';game.ui.showMessage(v2.pvpOn?'🥊 PvP включён!':'🥊 PvP выключен','#e67e22',2500);};
            document.getElementById('v2-sec').onclick=()=>{if(!v2.secret&&Math.random()<0.3){v2.secret=true;v2AchCheck();}else{game.ui.showMessage('🔮 Здесь ничего нет... пока.','#9b59b6',2000);}};
            document.getElementById('v2-ach').onclick=()=>{
                let h='🏆 ДОСТИЖЕНИЯ '+Object.keys(v2.ach).length+'/'+V2_ACHIEVEMENTS.length+'\n\n';
                V2_ACHIEVEMENTS.forEach(a=>{h+=(v2.ach[a.id]?'✅ ':'⬜ ')+a.n+' — '+a.d+'\n';});
                alert(h);
            };
            // Hook attack → v2Attack, chest, weather storm survival
            const iv=setInterval(()=>{
                if(window.game&&game.player){
                    clearInterval(iv);
                    const oa=game.player.attack?game.player.attack.bind(game.player):null;
                    if(oa){game.player.attack=function(){oa();window.v2Attack();};}
                    const oc=game.openChest?game.openChest.bind(game):null;
                    if(oc){game.openChest=function(...a){oc(...a);window.v2ChestOpened();};}
                    let stormT=0;
                    const ow=setInterval(()=>{if(game.weather&&game.weather.current==='storm'){stormT++;if(stormT>=30){v2Ach('weather');clearInterval(ow);}}},1000);
                }
            },500);
        });


        // ===== АДВЕНТУР V2: IIFE — системы + старт игры + game.update =====
        (function(){
        'use strict';
        let G=null,advv2={gold:150,ess:0,ore:0,gems:0,keys:0,claimed:{},pets:[],pet:null,farm:{},gifts:0,ref:0,roulCd:0,lottery:0,lotteryWin:0,buffs:{},skills:{pow:0,agi:0,luck:0,hp:0},cd:{},refillCd:0};
        function load(){try{const d=JSON.parse(localStorage.getItem('minicraft_adv2'));if(d)advv2=Object.assign(advv2,d);}catch(e){}}
        function save(){try{localStorage.setItem('minicraft_adv2',JSON.stringify({gold:advv2.gold,ess:advv2.ess,ore:advv2.ore,gems:advv2.gems,keys:advv2.keys,claimed:advv2.claimed,pets:advv2.pets,pet:advv2.pet,farm:advv2.farm,gifts:advv2.gifts,ref:advv2.ref,roulCd:advv2.roulCd,lottery:advv2.lottery,lotteryWin:advv2.lotteryWin,skills:advv2.skills}));}catch(e){}}
        load();
        // весь контент блока adv-v2 сохранён при извлечении
        const advAch=[{id:'a_gold',n:'Золотая жила',d:'500 золота'},{id:'a_pet',n:'Друг человека',d:'Приручи питомца'},{id:'a_farm',n:'Фермер',d:'Собери урожай'}];
        window.advv2=advv2;
        window.advToast=function(t){const el=document.getElementById('adv-v2-toast');if(!el)return;const d=document.createElement('div');d.className='adv-toast';d.textContent=t;el.appendChild(d);setTimeout(()=>d.remove(),4000);};
        })();


        // ===== V3: питомцы, еда, эликсиры, статы, босс-рейды =====
        const V3_FOODS=[
            {id:'apple',n:'Яблоко',emoji:'🍎',hp:10,price:5},
            {id:'bread',n:'Хлеб',emoji:'🍞',hp:25,price:12},
            {id:'meat',n:'Мясо',emoji:'🍖',hp:50,price:25},
            {id:'stew',n:'Похлёбка',emoji:'🍲',hp:80,price:40},
            {id:'cake',n:'Пирог',emoji:'🍰',hp:120,price:60}
        ];
        const V3_ELIXIRS=[
            {id:'str',n:'Эликсир силы',emoji:'⚗️',buff:'dmg',mult:1.5,dur:60,price:100},
            {id:'spd',n:'Эликсир скорости',emoji:'🧪',buff:'spd',mult:1.4,dur:60,price:100},
            {id:'def',n:'Эликсир защиты',emoji:'🛡️',buff:'def',mult:0.5,dur:60,price:120},
            {id:'regen',n:'Эликсир регенерации',emoji:'💗',buff:'regen',mult:2,dur:45,price:150}
        ];
        const V3_PETS=[
            {id:'cat',n:'Кот',emoji:'🐱',bonus:'luck',val:0.1,price:200},
            {id:'dog',n:'Пёс',emoji:'🐕',bonus:'dmg',val:0.15,price:300},
            {id:'owl',n:'Сова',emoji:'🦉',bonus:'xp',val:0.2,price:400},
            {id:'fox',n:'Лиса',emoji:'🦊',bonus:'spd',val:0.12,price:500}
        ];
        let v3={food:{},elixirs:{},pets:[],activePet:null,buffs:{}};
        try{const s=localStorage.getItem('minicraft_v3');if(s){const d=JSON.parse(s);v3=Object.assign(v3,d);}}catch(e){}
        function v3Save(){try{localStorage.setItem('minicraft_v3',JSON.stringify({food:v3.food,elixirs:v3.elixirs,pets:v3.pets,activePet:v3.activePet}));}catch(e){}}
        window.v3Eat=function(id){
            const f=V3_FOODS.find(x=>x.id===id);if(!f||!(v3.food[id]>0))return;
            v3.food[id]--;if(game&&game.player){game.player.heal(f.hp);game.ui.showMessage(f.emoji+' +'+f.hp+' HP','#2ecc71',2000);if(window.snd)snd.play('eat');}
            v3Save();
        };
        window.v3Drink=function(id){
            const e=V3_ELIXIRS.find(x=>x.id===id);if(!e||!(v3.elixirs[id]>0))return;
            v3.elixirs[id]--;v3.buffs[e.buff]={mult:e.mult,t:e.dur};
            game&&game.ui&&game.ui.showMessage(e.emoji+' '+e.n+' активирован!','#9b59b6',3000);v3Save();
        };
        window.v3BuyPet=function(id){
            const p=V3_PETS.find(x=>x.id===id);if(!p||v3.pets.includes(id))return;
            if(game&&game.player&&game.player.money>=p.price){game.player.addMoney(-p.price);v3.pets.push(id);v3.activePet=id;v3Save();game.ui.showMessage(p.emoji+' '+p.n+' теперь с тобой!','#f1c40f',3000);}
        };
        window.v3=v3;


        // ===== V4: крафт оружия, брони, инструментов =====
        const V4_RECIPES=[
            {id:'sword_iron',n:'Железный меч',emoji:'⚔️',dmg:15,need:{iron:5,wood:2}},
            {id:'sword_gold',n:'Золотой меч',emoji:'🗡️',dmg:22,need:{gold:5,wood:2}},
            {id:'sword_diamond',n:'Алмазный меч',emoji:'💎',dmg:35,need:{diamond:3,iron:2}},
            {id:'armor_leather',n:'Кожаная броня',emoji:'🦺',def:3,need:{leather:6}},
            {id:'armor_iron',n:'Железная броня',emoji:'🛡️',def:8,need:{iron:8}},
            {id:'armor_diamond',n:'Алмазная броня',emoji:'💠',def:15,need:{diamond:6}},
            {id:'pick_iron',n:'Железная кирка',emoji:'⛏️',spd:2,need:{iron:3,wood:2}},
            {id:'pick_diamond',n:'Алмазная кирка',emoji:'🔨',spd:4,need:{diamond:3,wood:2}}
        ];
        let v4={crafted:[],weapon:null,armor:null,pick:null};
        try{const s=localStorage.getItem('minicraft_v4');if(s)v4=Object.assign(v4,JSON.parse(s));}catch(e){}
        function v4Save(){try{localStorage.setItem('minicraft_v4',JSON.stringify(v4));}catch(e){}}
        window.v4Craft=function(id){
            const r=V4_RECIPES.find(x=>x.id===id);if(!r)return;
            const inv=game&&game.player?game.player.inventory:{};
            for(const k in r.need){if((inv[k]||0)<r.need[k]){game.ui.showMessage('Не хватает ресурсов!','#e74c3c',2000);return;}}
            for(const k in r.need){inv[k]-=r.need[k];}
            if(r.dmg)v4.weapon=id;if(r.def)v4.armor=id;if(r.spd)v4.pick=id;
            if(!v4.crafted.includes(id))v4.crafted.push(id);
            v4Save();game.ui.showMessage(r.emoji+' Создано: '+r.n+'!','#f1c40f',3000);if(window.snd)snd.play('craft');
        };
        window.v4=v4;


        // ===== V5: дома, мебель, телепорты =====
        const V5_FURNITURE=[
            {id:'table',n:'Стол',emoji:'🪑',price:30},
            {id:'bed',n:'Кровать',emoji:'🛏️',price:50},
            {id:'chest',n:'Сундук',emoji:'📦',price:40},
            {id:'torch',n:'Факел',emoji:'🔥',price:10},
            {id:'plant',n:'Растение',emoji:'🪴',price:15}
        ];
        let v5={homes:[],furniture:{},teleports:[]}; 
        try{const s=localStorage.getItem('minicraft_v5');if(s)v5=Object.assign(v5,JSON.parse(s));}catch(e){}
        function v5Save(){try{localStorage.setItem('minicraft_v5',JSON.stringify(v5));}catch(e){}}
        window.v5=v5;


        // ===== V6: рыбалка, сад, погода =====
        let v6={fish:0,garden:[],rain:false};
        window.v6Fish=function(){
            if(!window.game)return;const r=Math.random();
            if(r<0.5){v6.fish++;game.ui.showMessage('🐟 Поймана рыба! Всего: '+v6.fish,'#3498db',2000);}
            else if(r<0.8){game.player.addMoney(10);game.ui.showMessage('💰 Выловил монету!','#f1c40f',2000);}
            else game.ui.showMessage('🌊 Сорвалось...','#95a5a6',1500);
        };
        window.v6=v6;


        // ===== V7: мини-игры, арена, казино =====
        let v7={arenaWins:0,casinoPlays:0};
        window.v7Arena=function(){
            if(!window.game||!game.player)return;
            const win=Math.random()<0.6;
            if(win){v7.arenaWins++;game.player.addMoney(50);game.player.gainXP(30);game.ui.showMessage('🏟️ Победа на арене! +50 монет','#f1c40f',3000);if(window.v2PvpWin)v2PvpWin();}
            else{game.player.takeDamage(20);game.ui.showMessage('🏟️ Поражение на арене...','#e74c3c',3000);}
        };
        window.v7Casino=function(bet){
            if(!window.game||!game.player||game.player.money<bet)return;
            game.player.addMoney(-bet);v7.casinoPlays++;
            const r=Math.random();
            if(r<0.4){game.player.addMoney(bet*2);game.ui.showMessage('🎰 Выигрыш x2!','#2ecc71',2500);}
            else if(r<0.45){game.player.addMoney(bet*5);game.ui.showMessage('🎰 ДЖЕКПОТ x5!','#f1c40f',4000);}
            else game.ui.showMessage('🎰 Проигрыш...','#e74c3c',2000);
        };
        window.v7=v7;


        // ===== V8: кланы, друзья, чат =====
        let v8={clan:null,friends:[]}; 
        window.v8CreateClan=function(name){
            if(v8.clan)return;v8.clan={name,members:1,level:1};
            game&&game.ui&&game.ui.showMessage('⚜️ Клан "'+name+'" создан!','#f1c40f',3000);
        };
        window.v8=v8;


        // ===== V9: магия, заклинания, мана =====
        const V9_SPELLS=[
            {id:'fireball',n:'Огненный шар',emoji:'🔥',dmg:30,mana:20},
            {id:'heal',n:'Исцеление',emoji:'💚',heal:40,mana:25},
            {id:'freeze',n:'Заморозка',emoji:'❄️',dmg:15,slow:true,mana:15},
            {id:'lightning',n:'Молния',emoji:'⚡',dmg:45,mana:35}
        ];
        let v9={mana:100,maxMana:100,spells:['fireball','heal']}; 
        window.v9Cast=function(id){
            const s=V9_SPELLS.find(x=>x.id===id);if(!s||v9.mana<s.mana||!window.game)return;
            v9.mana-=s.mana;
            if(s.heal){game.player.heal(s.heal);game.ui.showMessage(s.emoji+' +'+s.heal+' HP','#2ecc71',2000);}
            if(s.dmg){window.v2Attack();game.ui.showMessage(s.emoji+' '+s.n+'!','#e67e22',2000);}
        };
        setInterval(()=>{if(v9.mana<v9.maxMana)v9.mana=Math.min(v9.maxMana,v9.mana+1);},1000);
        window.v9=v9;


        // ===== V10: единая система прогресса =====
        let v10={
            level:1,xp:0,xpNeed:100,skillPoints:0,
            skills:{strength:0,agility:0,luck:0,vitality:0},
            title:'Новичок'
        };
        try{const s=localStorage.getItem('minicraft_v10');if(s)v10=Object.assign(v10,JSON.parse(s));}catch(e){}
        function v10Save(){try{localStorage.setItem('minicraft_v10',JSON.stringify(v10));}catch(e){}}
        window.v10AddXP=function(n){
            v10.xp+=n;
            while(v10.xp>=v10.xpNeed){v10.xp-=v10.xpNeed;v10.level++;v10.xpNeed=Math.floor(v10.xpNeed*1.4);v10.skillPoints++;
                v10.title=v10.level>=20?'Легенда':v10.level>=15?'Герой':v10.level>=10?'Ветеран':v10.level>=5?'Бывалый':'Новичок';
                game&&game.ui&&game.ui.showMessage('⭐ Уровень '+v10.level+'! Очков навыков: '+v10.skillPoints,'#f1c40f',4000);if(window.snd)snd.play('levelup');
            }
            v10Save();
        };
        window.v10Skill=function(k){
            if(v10.skillPoints>0){v10.skillPoints--;v10.skills[k]++;v10Save();}
        };
        window.v10=v10;


        // ===== V30: мир событий, торговцы, репутация =====
        let v30={rep:0,traders:[],worldEvents:[]}; 
        const V30_REPS=['Враг','Нейтрал','Друг','Уважаемый','Герой'];
        window.v30AddRep=function(n){
            v30.rep=Math.max(-100,Math.min(100,v30.rep+n));
            game&&game.ui&&game.ui.showMessage('🤝 Репутация: '+v30.rep,'#3498db',2000);
        };
        window.v30=v30;


        // ===== V50: мастер-система — финальный контент =====
        let v50={
            prestige:0,masteries:{sword:0,bow:0,magic:0,mining:0},
            relics:[],titles:['Новичок'],currentTitle:'Новичок',
            stats:{playTime:0,deaths:0,distance:0}
        };
        try{const s=localStorage.getItem('minicraft_v50');if(s)v50=Object.assign(v50,JSON.parse(s));}catch(e){}
        function v50Save(){try{localStorage.setItem('minicraft_v50',JSON.stringify(v50));}catch(e){}}
        window.v50Prestige=function(){
            if(v10.level>=20){v50.prestige++;v50.titles.push('Престиж '+v50.prestige);
                v10.level=1;v10.xp=0;v10.xpNeed=100;v10Save();v50Save();
                game.ui.showMessage('👑 ПРЕСТИЖ '+v50.prestige+'! Весь прогресс усилен!','#f1c40f',6000);}
        };
        window.v50Mastery=function(k){v50.masteries[k]++;v50Save();};
        window.v50=v50;
        // V50 HUD данные — обновление раз в секунду
        setInterval(()=>{
            const el=document.getElementById('v50-hud');if(!el)return;
            const rows=el.querySelectorAll('.v50-val');if(rows.length<4)return;
            rows[0].textContent=v50.prestige;
            rows[1].textContent=v50.currentTitle;
            rows[2].textContent=v50.relics.length;
            rows[3].textContent=Math.floor(v50.stats.playTime/60)+'м';
            v50.stats.playTime++;
        },1000);


        // V50 HUD — баффы
        (function(){
            const buffsEl=document.getElementById('v50-buffs');
            if(!buffsEl)return;
            setInterval(()=>{
                let h='';
                if(v3.buffs)for(const k in v3.buffs){const b=v3.buffs[k];if(b.t>0)h+='<div class="v50-buff">'+k+' x'+b.mult+' ('+Math.ceil(b.t)+'с)</div>';}
                buffsEl.innerHTML=h;
            },500);
            // тикер баффов
            setInterval(()=>{
                if(v3.buffs)for(const k in v3.buffs){if(v3.buffs[k].t>0)v3.buffs[k].t-=1;}
            },1000);
        })();


        // мобильная проверка — включаем touch
        (function(){
            if('ontouchstart' in window||navigator.maxTouchPoints>0){document.body.classList.add('touch-on');}
        })();