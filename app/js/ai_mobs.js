// ai_mobs.js — улучшенный AI монстров для MiniCraft Adventure
// ПРОМПТ: Создать многоуровневую систему AI монстров для трёхуровневого мира.
// Подземелье: пауки лазают по стенам и потолку, летучие мыши висят и
// нападают сверху, скелеты стреляют из лука из-за укрытий. Поверхность:
// волки охотятся стаями, орки бросаются в ближний бой, тролли защищают
// территорию. Небеса: драконы летают и атакуют с воздуха, призраки
// проходят сквозь блоки, облачные элементали телепортируются.
// Боссы: уникальные паттерны атак, фазы боя, призыв миньонов.
// Добавить систему aggro, укрытия, стайное поведение, патрулирование.
// КОММИТ: feat: add multi-level AI system for 3-tier world
// wall-climbing spiders, flying dragons, ghost phasing, pack hunting,
// boss phases, aggro system, cover seeking, patrol routes

// ==================== КОНФИГУРАЦИЯ AI ====================

const AI_CONFIG = {
    aggroRadius: 12,
    loseAggroRadius: 20,
    attackCooldown: 1.5,
    patrolRadius: 8,
    packRadius: 15,
    fleeThreshold: 0.2,
    bossPhaseThresholds: [0.75, 0.5, 0.25]
};

// ==================== БАЗОВЫЙ КЛАСС AI ====================

class MobAI {
    constructor(mob) {
        this.mob = mob;
        this.state = 'idle';
        this.target = null;
        this.aggroTimer = 0;
        this.attackTimer = 0;
        this.patrolCenter = { x: mob.x, y: mob.y, z: mob.z };
        this.patrolPoint = null;
        this.stateTimer = 0;
        this.path = [];
        this.pathIndex = 0;
    }

    update(delta, world, player) {
        this.stateTimer += delta;
        this.attackTimer -= delta;

        // Обновление состояния
        this.updateState(delta, world, player);

        // Выполнение действия по состоянию
        switch (this.state) {
            case 'idle':
                this.onIdle(delta, world, player);
                break;
            case 'patrol':
                this.onPatrol(delta, world, player);
                break;
            case 'chase':
                this.onChase(delta, world, player);
                break;
            case 'attack':
                this.onAttack(delta, world, player);
                break;
            case 'flee':
                this.onFlee(delta, world, player);
                break;
            case 'return':
                this.onReturn(delta, world, player);
                break;
            case 'special':
                this.onSpecial(delta, world, player);
                break;
        }

        // Обновление позиции модели
        this.updateModel();
    }

    updateState(delta, world, player) {
        const distToPlayer = this.distanceTo(player);
        const hpRatio = this.mob.hp / this.mob.maxHp;

        // Проверка на потерю цели
        if (this.target && distToPlayer > AI_CONFIG.loseAggroRadius) {
            this.target = null;
            this.state = 'return';
            return;
        }

        // Обнаружение игрока
        if (!this.target && distToPlayer < AI_CONFIG.aggroRadius) {
            this.target = player;
            this.state = 'chase';
            this.onAggro();
            return;
        }

        // Бегство при низком HP
        if (hpRatio < AI_CONFIG.fleeThreshold && this.canFlee()) {
            this.state = 'flee';
            return;
        }

        // Переход в атаку
        if (this.target && distToPlayer < this.getAttackRange()) {
            this.state = 'attack';
            return;
        }

        // Возврат к патрулированию
        if (!this.target && this.state !== 'patrol' && this.state !== 'return') {
            this.state = 'return';
        }
    }

    distanceTo(target) {
        const dx = this.mob.x - target.x;
        const dy = this.mob.y - target.y;
        const dz = this.mob.z - target.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    moveToward(target, speed, delta, world) {
        const dx = target.x - this.mob.x;
        const dy = target.y - this.mob.y;
        const dz = target.z - this.mob.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist < 0.1) return true;

        const moveX = (dx / dist) * speed * delta;
        const moveY = (dy / dist) * speed * delta;
        const moveZ = (dz / dist) * speed * delta;

        // Проверка коллизий
        if (this.canMoveTo(this.mob.x + moveX, this.mob.y + moveY, this.mob.z + moveZ, world)) {
            this.mob.x += moveX;
            this.mob.y += moveY;
            this.mob.z += moveZ;
        }

        // Поворот к цели
        this.mob.model.rotation.y = Math.atan2(dx, dz);

        return false;
    }

    canMoveTo(x, y, z, world) {
        // Базовая проверка коллизий
        const block = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return !block || block === 'air' || block === 'water' || block === 'lava';
    }

    getAttackRange() {
        return 1.5;
    }

    canFlee() {
        return false;
    }

    onAggro() {}
    onIdle(delta, world, player) {
        if (this.stateTimer > 3) {
            this.state = 'patrol';
            this.stateTimer = 0;
            this.patrolPoint = this.getRandomPatrolPoint();
        }
    }
    onPatrol(delta, world, player) {
        if (!this.patrolPoint) {
            this.patrolPoint = this.getRandomPatrolPoint();
        }

        const reached = this.moveToward(this.patrolPoint, this.mob.speed * 0.3, delta, world);
        if (reached) {
            this.state = 'idle';
            this.stateTimer = 0;
            this.patrolPoint = null;
        }
    }
    onChase(delta, world, player) {
        this.moveToward(player, this.mob.speed, delta, world);
    }
    onAttack(delta, world, player) {
        if (this.attackTimer <= 0) {
            this.performAttack(player);
            this.attackTimer = AI_CONFIG.attackCooldown;
        }
        // Держим дистанцию
        const dist = this.distanceTo(player);
        if (dist < this.getAttackRange() * 0.5) {
            // Отступаем
            this.moveToward(
                { x: this.mob.x - (player.x - this.mob.x), y: this.mob.y, z: this.mob.z - (player.z - this.mob.z) },
                this.mob.speed * 0.5, delta, world
            );
        }
    }
    onFlee(delta, world, player) {
        const fleePoint = {
            x: this.mob.x + (this.mob.x - player.x) * 3,
            y: this.mob.y,
            z: this.mob.z + (this.mob.z - player.z) * 3
        };
        this.moveToward(fleePoint, this.mob.speed * 1.5, delta, world);

        if (this.distanceTo(player) > AI_CONFIG.aggroRadius * 1.5) {
            this.state = 'return';
        }
    }
    onReturn(delta, world, player) {
        const reached = this.moveToward(this.patrolCenter, this.mob.speed * 0.5, delta, world);
        if (reached) {
            this.state = 'idle';
            this.stateTimer = 0;
        }
    }
    onSpecial(delta, world, player) {}

    performAttack(target) {
        // Базовая атака
        if (target.takeDamage) {
            target.takeDamage(this.mob.damage);
        }
        // Анимация атаки
        this.playAttackAnimation();
    }

    playAttackAnimation() {
        if (this.mob.model) {
            // Простая анимация взмаха
            const originalRot = this.mob.model.rotation.x;
            this.mob.model.rotation.x = -0.5;
            setTimeout(() => {
                if (this.mob.model) this.mob.model.rotation.x = originalRot;
            }, 200);
        }
    }

    getRandomPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * AI_CONFIG.patrolRadius;
        return {
            x: this.patrolCenter.x + Math.cos(angle) * dist,
            y: this.patrolCenter.y,
            z: this.patrolCenter.z + Math.sin(angle) * dist
        };
    }

    updateModel() {
        if (this.mob.model) {
            this.mob.model.position.set(this.mob.x, this.mob.y, this.mob.z);
        }
    }
}

// ==================== ПОДЗЕМЕЛЬЕ AI ====================

class SpiderAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.isOnWall = false;
        this.climbTarget = null;
    }

    update(delta, world, player) {
        // Пауки лазают по стенам
        this.updateWallClimbing(world);
        super.update(delta, world, player);
    }

    updateWallClimbing(world) {
        const x = Math.floor(this.mob.x);
        const y = Math.floor(this.mob.y);
        const z = Math.floor(this.mob.z);

        // Проверяем стены рядом
        const walls = [
            { dx: 1, dy: 0, dz: 0 },
            { dx: -1, dy: 0, dz: 0 },
            { dx: 0, dy: 0, dz: 1 },
            { dx: 0, dy: 0, dz: -1 }
        ];

        for (const wall of walls) {
            const block = world.getBlock(x + wall.dx, y + wall.dy, z + wall.dz);
            if (block && block !== 'air') {
                this.isOnWall = true;
                // Поворачиваем модель к стене
                if (this.mob.model) {
                    this.mob.model.rotation.x = -Math.PI / 2;
                }
                return;
            }
        }

        this.isOnWall = false;
        if (this.mob.model) {
            this.mob.model.rotation.x = 0;
        }
    }

    canMoveTo(x, y, z, world) {
        // Пауки могут лазать по стенам
        const block = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        if (block && block !== 'air') {
            // Проверяем, есть ли стена рядом
            return this.isAdjacentToWall(x, y, z, world);
        }
        return true;
    }

    isAdjacentToWall(x, y, z, world) {
        const dirs = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
        for (const [dx, dy, dz] of dirs) {
            const block = world.getBlock(Math.floor(x+dx), Math.floor(y+dy), Math.floor(z+dz));
            if (block && block !== 'air') return true;
        }
        return false;
    }

    onAggro() {
        // Паук плюётся ядом
        if (Math.random() < 0.3) {
            this.spawnVenomProjectile();
        }
    }

    spawnVenomProjectile() {
        // Создаём снаряд яда
        const projectile = {
            x: this.mob.x, y: this.mob.y + 0.5, z: this.mob.z,
            vx: (this.target.x - this.mob.x) * 2,
            vy: 1,
            vz: (this.target.z - this.mob.z) * 2,
            damage: this.mob.damage * 0.5,
            type: 'venom',
            duration: 3
        };
        world.projectiles.push(projectile);
    }

    getAttackRange() {
        return 2.0; // Паук атакует с большей дистанции
    }
}

class BatAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.flyHeight = 0;
        this.diveTarget = null;
    }

    update(delta, world, player) {
        // Летучие мыши летают
        this.updateFlying(delta);
        super.update(delta, world, player);
    }

    updateFlying(delta) {
        // Парение в воздухе
        this.mob.y += Math.sin(Date.now() * 0.003) * 0.01;

        // Проверяем, не врезались ли в потолок
        const blockAbove = world.getBlock(
            Math.floor(this.mob.x),
            Math.floor(this.mob.y + 1),
            Math.floor(this.mob.z)
        );
        if (blockAbove && blockAbove !== 'air') {
            this.mob.y -= 0.1;
        }
    }

    canMoveTo(x, y, z, world) {
        // Летучие мыши летают — проверяем только столкновения с блоками
        const block = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return !block || block === 'air';
    }

    onChase(delta, world, player) {
        // Нырок на игрока
        const dist = this.distanceTo(player);
        if (dist < 5 && !this.diveTarget) {
            this.diveTarget = { ...player };
            this.state = 'special';
        } else {
            super.onChase(delta, world, player);
        }
    }

    onSpecial(delta, world, player) {
        // Нырок
        if (this.diveTarget) {
            const reached = this.moveToward(this.diveTarget, this.mob.speed * 2, delta, world);
            if (reached || this.distanceTo(this.diveTarget) < 1) {
                // Атака при нырке
                this.performAttack(player);
                this.diveTarget = null;
                this.state = 'chase';
            }
        }
    }

    getAttackRange() {
        return 1.0;
    }
}

class SkeletonAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.coverPosition = null;
        this.shotsFired = 0;
    }

    update(delta, world, player) {
        // Скелеты ищут укрытие
        if (this.state === 'chase') {
            this.findCover(world, player);
        }
        super.update(delta, world, player);
    }

    findCover(world, player) {
        if (this.coverPosition) return;

        // Ищем блок между нами и игроком
        const dx = player.x - this.mob.x;
        const dz = player.z - this.mob.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        if (dist > 5) {
            // Ищем укрытие поблизости
            for (let x = -3; x <= 3; x++) {
                for (let z = -3; z <= 3; z++) {
                    const bx = Math.floor(this.mob.x + x);
                    const by = Math.floor(this.mob.y);
                    const bz = Math.floor(this.mob.z + z);
                    const block = world.getBlock(bx, by, bz);
                    if (block && block !== 'air') {
                        // Проверяем, скрывает ли блок от игрока
                        const blockToPlayer = this.hasLineOfSight({x: bx, y: by, z: bz}, player, world);
                        if (!blockToPlayer) {
                            this.coverPosition = { x: bx + 0.5, y: by, z: bz + 0.5 };
                            return;
                        }
                    }
                }
            }
        }
    }

    hasLineOfSight(from, to, world) {
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = from.x + (to.x - from.x) * t;
            const y = from.y + (to.y - from.y) * t;
            const z = from.z + (to.z - from.z) * t;
            const block = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
            if (block && block !== 'air') return false;
        }
        return true;
    }

    onAttack(delta, world, player) {
        if (this.attackTimer <= 0) {
            if (this.hasLineOfSight(this.mob, player, world)) {
                // Стреляем из лука
                this.fireArrow(player);
                this.shotsFired++;

                // После 3 выстрелов меняем позицию
                if (this.shotsFired >= 3) {
                    this.coverPosition = null;
                    this.shotsFired = 0;
                    this.findCover(world, player);
                }
            } else {
                // Двигаемся к укрытию
                if (this.coverPosition) {
                    this.moveToward(this.coverPosition, this.mob.speed, delta, world);
                }
            }
            this.attackTimer = AI_CONFIG.attackCooldown * 1.5;
        }
    }

    fireArrow(target) {
        const arrow = {
            x: this.mob.x, y: this.mob.y + 1, z: this.mob.z,
            vx: (target.x - this.mob.x) * 3,
            vy: (target.y - this.mob.y) * 3 + 2,
            vz: (target.z - this.mob.z) * 3,
            damage: this.mob.damage,
            type: 'arrow',
            owner: this.mob
        };
        world.projectiles.push(arrow);
    }

    getAttackRange() {
        return 10; // Скелеты стреляют на дальние дистанции
    }
}

// ==================== ПОВЕРХНОСТЬ AI ====================

class WolfAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.packMembers = [];
        this.isPackLeader = false;
    }

    update(delta, world, player) {
        // Волки охотятся стаями
        this.updatePack(world);
        super.update(delta, world, player);
    }

    updatePack(world) {
        // Находим ближайших волков
        this.packMembers = world.mobs.filter(m => 
            m.type === 'wolf' && 
            m !== this.mob &&
            Math.abs(m.x - this.mob.x) < AI_CONFIG.packRadius &&
            Math.abs(m.z - this.mob.z) < AI_CONFIG.packRadius
        );

        // Лидер — волк с наибольшим HP
        this.isPackLeader = this.packMembers.every(m => m.hp <= this.mob.hp);
    }

    onAggro() {
        // Волки-лидеры призывают стаю
        if (this.isPackLeader) {
            this.packMembers.forEach(member => {
                if (member.ai) {
                    member.ai.target = this.target;
                    member.ai.state = 'chase';
                }
            });
        }
    }

    onChase(delta, world, player) {
        // Волки окружают игрока
        if (this.packMembers.length > 0) {
            const angle = (this.packMembers.indexOf(this.mob) / this.packMembers.length) * Math.PI * 2;
            const surroundX = player.x + Math.cos(angle) * 2;
            const surroundZ = player.z + Math.sin(angle) * 2;
            this.moveToward({ x: surroundX, y: player.y, z: surroundZ }, this.mob.speed * 1.2, delta, world);
        } else {
            super.onChase(delta, world, player);
        }
    }

    performAttack(target) {
        super.performAttack(target);
        // Волки могут сбить с ног
        if (Math.random() < 0.2 && target.knockback) {
            const dx = target.x - this.mob.x;
            const dz = target.z - this.mob.z;
            target.knockback(dx * 2, 1, dz * 2);
        }
    }
}

class OrcAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.chargeTimer = 0;
        this.isCharging = false;
    }

    update(delta, world, player) {
        if (this.isCharging) {
            this.chargeTimer -= delta;
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
            }
        }
        super.update(delta, world, player);
    }

    onChase(delta, world, player) {
        const dist = this.distanceTo(player);

        // Рывок на игрока
        if (dist > 3 && dist < 8 && !this.isCharging && Math.random() < 0.01) {
            this.isCharging = true;
            this.chargeTimer = 0.5;
            this.state = 'special';
            return;
        }

        super.onChase(delta, world, player);
    }

    onSpecial(delta, world, player) {
        // Рывок
        const dx = player.x - this.mob.x;
        const dz = player.z - this.mob.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        this.mob.x += (dx / dist) * this.mob.speed * 3 * delta;
        this.mob.z += (dz / dist) * this.mob.speed * 3 * delta;

        // Анимация рывка
        if (this.mob.model) {
            this.mob.model.rotation.x = 0.3;
        }

        if (dist < 1.5) {
            this.performAttack(player);
            this.isCharging = false;
            this.state = 'attack';
        }
    }

    performAttack(target) {
        super.performAttack(target);
        // Орки оглушают
        if (target.stun) {
            target.stun(0.5);
        }
    }
}

class TrollAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.territoryCenter = { x: mob.x, y: mob.y, z: mob.z };
        this.territoryRadius = 10;
        this.isEnraged = false;
    }

    updateState(delta, world, player) {
        const distToPlayer = this.distanceTo(player);
        const distToTerritory = Math.sqrt(
            (this.mob.x - this.territoryCenter.x)**2 +
            (this.mob.z - this.territoryCenter.z)**2
        );

        // Тролль защищает территорию
        if (distToPlayer < AI_CONFIG.aggroRadius && distToTerritory < this.territoryRadius) {
            if (!this.target) {
                this.target = player;
                this.state = 'chase';
                this.onAggro();
            }
        }

        // Ярость при низком HP
        const hpRatio = this.mob.hp / this.mob.maxHp;
        if (hpRatio < 0.3 && !this.isEnraged) {
            this.isEnraged = true;
            this.mob.speed *= 1.5;
            this.mob.damage *= 1.3;
            // Визуальный эффект ярости
            if (this.mob.model) {
                this.mob.model.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.emissive = new THREE.Color(0xff0000);
                        child.material.emissiveIntensity = 0.3;
                    }
                });
            }
        }

        super.updateState(delta, world, player);
    }

    onAttack(delta, world, player) {
        if (this.attackTimer <= 0) {
            // Тролль бьёт по земле — ударная волна
            this.groundSlam();
            this.attackTimer = AI_CONFIG.attackCooldown * 1.5;
        }
    }

    groundSlam() {
        // Ударная волна
        const radius = 3;
        world.mobs.concat([world.player]).forEach(target => {
            if (target === this.mob) return;
            const dist = Math.sqrt(
                (target.x - this.mob.x)**2 +
                (target.z - this.mob.z)**2
            );
            if (dist < radius) {
                const damage = this.mob.damage * (1 - dist / radius);
                if (target.takeDamage) target.takeDamage(damage);
                if (target.knockback) {
                    const dx = target.x - this.mob.x;
                    const dz = target.z - this.mob.z;
                    target.knockback(dx * 3, 2, dz * 3);
                }
            }
        });

        // Визуальный эффект
        createShockwave(this.mob.x, this.mob.y, this.mob.z);
    }
}

// ==================== НЕБЕСА AI ====================

class GhostAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.phaseTimer = 0;
        this.isPhasing = false;
    }

    update(delta, world, player) {
        // Призраки проходят сквозь блоки
        this.updatePhasing(delta);
        super.update(delta, world, player);
    }

    updatePhasing(delta) {
        this.phaseTimer -= delta;

        if (this.phaseTimer <= 0) {
            this.isPhasing = !this.isPhasing;
            this.phaseTimer = 2 + Math.random() * 3;

            // Визуальный эффект фазирования
            if (this.mob.model) {
                this.mob.model.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = this.isPhasing ? 0.2 : 0.6;
                    }
                });
            }
        }
    }

    canMoveTo(x, y, z, world) {
        // Призраки проходят сквозь блоки когда фазируют
        if (this.isPhasing) return true;
        return super.canMoveTo(x, y, z, world);
    }

    onChase(delta, world, player) {
        // Призраки телепортируются ближе
        const dist = this.distanceTo(player);
        if (dist > 5 && Math.random() < 0.02) {
            this.teleportNear(player);
        } else {
            super.onChase(delta, world, player);
        }
    }

    teleportNear(player) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 2 + Math.random() * 2;
        this.mob.x = player.x + Math.cos(angle) * dist;
        this.mob.z = player.z + Math.sin(angle) * dist;
        this.mob.y = player.y;

        // Визуальный эффект телепортации
        createTeleportEffect(this.mob.x, this.mob.y, this.mob.z);
    }

    performAttack(target) {
        super.performAttack(target);
        // Призраки высасывают ману
        if (target.mana) {
            target.mana = Math.max(0, target.mana - 10);
        }
    }
}

class DragonAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.flyHeight = 5;
        this.isFlying = true;
        this.breathTimer = 0;
        this.landingTimer = 0;
    }

    update(delta, world, player) {
        // Драконы летают
        this.updateFlying(delta, world, player);
        super.update(delta, world, player);
    }

    updateFlying(delta, world, player) {
        const dist = this.distanceTo(player);

        if (this.isFlying) {
            // Парение в воздухе
            this.mob.y = Math.max(this.mob.y, player.y + this.flyHeight);

            // Дыхание льдом/огнём
            this.breathTimer -= delta;
            if (this.breathTimer <= 0 && dist < 15) {
                this.fireBreath(player);
                this.breathTimer = 4;
            }

            // Приземление для ближней атаки
            if (dist < 3) {
                this.isFlying = false;
                this.landingTimer = 3;
            }
        } else {
            // На земле
            this.landingTimer -= delta;
            if (this.landingTimer <= 0 || dist > 8) {
                this.isFlying = true;
                this.mob.y += 2;
            }
        }
    }

    fireBreath(target) {
        const breath = {
            x: this.mob.x, y: this.mob.y, z: this.mob.z,
            vx: (target.x - this.mob.x) * 2,
            vy: (target.y - this.mob.y) * 2,
            vz: (target.z - this.mob.z) * 2,
            damage: this.mob.damage * 0.3,
            type: this.mob.type === 'ice_dragon' ? 'ice_breath' : 'fire_breath',
            duration: 2,
            radius: 2
        };
        world.projectiles.push(breath);
    }

    canMoveTo(x, y, z, world) {
        // Драконы летают — проверяем только столкновения сверху
        if (this.isFlying) {
            const blockAbove = world.getBlock(Math.floor(x), Math.floor(y + 2), Math.floor(z));
            return !blockAbove || blockAbove === 'air';
        }
        return super.canMoveTo(x, y, z, world);
    }

    getAttackRange() {
        return this.isFlying ? 15 : 3;
    }
}

// ==================== БОСС AI ====================

class BossAI extends MobAI {
    constructor(mob) {
        super(mob);
        this.phase = 1;
        this.maxPhases = 3;
        this.minionTimer = 0;
        this.specialTimer = 0;
    }

    update(delta, world, player) {
        this.checkPhaseTransition();
        this.minionTimer -= delta;
        this.specialTimer -= delta;
        super.update(delta, world, player);
    }

    checkPhaseTransition() {
        const hpRatio = this.mob.hp / this.mob.maxHp;
        const newPhase = AI_CONFIG.bossPhaseThresholds.findIndex(t => hpRatio > t) + 1;

        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
    }

    onPhaseChange() {
        // Боссы усиливаются с каждой фазой
        this.mob.speed *= 1.1;
        this.mob.damage *= 1.1;

        // Призыв миньонов
        this.summonMinions();

        // Визуальный эффект
        createPhaseChangeEffect(this.mob.x, this.mob.y, this.mob.z);
    }

    summonMinions() {
        const minionCount = this.phase * 2;
        const minionTypes = this.getMinionTypes();

        for (let i = 0; i < minionCount; i++) {
            const type = minionTypes[Math.floor(Math.random() * minionTypes.length)];
            const angle = (i / minionCount) * Math.PI * 2;
            const dist = 3;
            const x = this.mob.x + Math.cos(angle) * dist;
            const z = this.mob.z + Math.sin(angle) * dist;
            spawnMob(type, x, this.mob.y, z);
        }
    }

    getMinionTypes() {
        return ['goblin', 'skeleton', 'bat'];
    }

    onAttack(delta, world, player) {
        if (this.specialTimer <= 0) {
            this.performSpecialAttack(player);
            this.specialTimer = 5;
        } else {
            super.onAttack(delta, world, player);
        }
    }

    performSpecialAttack(player) {
        // Базовая специальная атака — переопределяется в подклассах
        this.performAttack(player);
    }
}

class ForestGiantAI extends BossAI {
    constructor(mob) {
        super(mob);
        this.stompTimer = 0;
    }

    performSpecialAttack(player) {
        // Топот — ударная волна
        const radius = 5 + this.phase * 2;
        world.mobs.concat([world.player]).forEach(target => {
            if (target === this.mob) return;
            const dist = Math.sqrt(
                (target.x - this.mob.x)**2 +
                (target.z - this.mob.z)**2
            );
            if (dist < radius) {
                const damage = this.mob.damage * 2 * (1 - dist / radius);
                if (target.takeDamage) target.takeDamage(damage);
                if (target.knockback) {
                    const dx = target.x - this.mob.x;
                    const dz = target.z - this.mob.z;
                    target.knockback(dx * 5, 3, dz * 5);
                }
            }
        });
        createShockwave(this.mob.x, this.mob.y, this.mob.z, radius);
    }

    getMinionTypes() {
        return ['wolf', 'goblin'];
    }
}

class NecromancerAI extends BossAI {
    constructor(mob) {
        super(mob);
        this.summonTimer = 0;
    }

    performSpecialAttack(player) {
        // Волна тьмы
        const shadow = {
            x: this.mob.x, y: this.mob.y, z: this.mob.z,
            vx: (player.x - this.mob.x) * 1.5,
            vy: 0,
            vz: (player.z - this.mob.z) * 1.5,
            damage: this.mob.damage * 1.5,
            type: 'shadow_bolt',
            homing: true,
            duration: 5
        };
        world.projectiles.push(shadow);
    }

    getMinionTypes() {
        return ['skeleton', 'ghost', 'zombie'];
    }

    onPhaseChange() {
        super.onPhaseChange();
        // Некромант воскрешает мёртвых
        world.mobs.filter(m => m.hp <= 0).forEach(m => {
            m.hp = m.maxHp * 0.5;
            m.ai = new SkeletonAI(m);
        });
    }
}

// ==================== ФАБРИКА AI ====================

function createAIForMob(mob) {
    const aiMap = {
        // Подземелье
        spider: SpiderAI,
        bat: BatAI,
        skeleton: SkeletonAI,
        goblin: MobAI,
        // Поверхность
        wolf: WolfAI,
        orc: OrcAI,
        troll: TrollAI,
        zombie: MobAI,
        // Небеса
        ghost: GhostAI,
        slime: MobAI,
        // Боссы
        forest_giant: ForestGiantAI,
        stone_golem: BossAI,
        ice_dragon: DragonAI,
        spider_queen: SpiderAI,
        necromancer: NecromancerAI,
        kraken: BossAI,
        fire_elemental: BossAI,
        dark_knight: BossAI,
        goblin_king: BossAI,
        ice_troll: TrollAI
    };

    const AIClass = aiMap[mob.type] || MobAI;
    return new AIClass(mob);
}

// ==================== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ====================

function createShockwave(x, y, z, radius = 3) {
    // Создаёт визуальную ударную волну
    const geometry = new THREE.RingGeometry(0.1, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(x, y + 0.1, z);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    // Анимация расширения
    const expand = () => {
        ring.scale.multiplyScalar(1.1);
        ring.material.opacity -= 0.05;
        if (ring.material.opacity > 0) {
            requestAnimationFrame(expand);
        } else {
            scene.remove(ring);
        }
    };
    expand();
}

function createTeleportEffect(x, y, z) {
    const particles = [];
    for (let i = 0; i < 10; i++) {
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0xaa00ff });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x, y + Math.random(), z);
        scene.add(particle);
        particles.push(particle);
    }

    setTimeout(() => {
        particles.forEach(p => scene.remove(p));
    }, 500);
}

function createPhaseChangeEffect(x, y, z) {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    scene.add(sphere);

    const expand = () => {
        sphere.scale.multiplyScalar(1.2);
        sphere.material.opacity -= 0.03;
        if (sphere.material.opacity > 0) {
            requestAnimationFrame(expand);
        } else {
            scene.remove(sphere);
        }
    };
    expand();
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = {
        MobAI, SpiderAI, BatAI, SkeletonAI,
        WolfAI, OrcAI, TrollAI, GhostAI, DragonAI,
        BossAI, ForestGiantAI, NecromancerAI,
        createAIForMob,
        createShockwave, createTeleportEffect, createPhaseChangeEffect,
        AI_CONFIG
    };
}
