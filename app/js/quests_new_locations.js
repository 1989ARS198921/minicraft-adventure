// quests_new_locations.js — квесты для новых локаций MiniCraft Adventure
// ПРОМПТ: Создать систему квестов для трёхуровневого мира MiniCraft Adventure.
// Подземелье: исследование руин, сбор редких руд, победа над королём
// гоблинов, спасение шахтёров. Поверхность: защита деревень от орков,
// охота на волков, поиск древних артефактов. Небеса: исследование
// облачных городов, сбор кристаллов, победа над ледяным драконом,
// активация обелисков. Связать квесты в цепочки с наградами.
// Добавить ежедневные задания для каждого уровня мира.
// КОММИТ: feat: add quest system for 3-tier world
// underground ruins, surface defense, sky exploration, quest chains,
// daily quests, boss battles, artifact collection

// ==================== БАЗА КВЕСТОВ ====================

const QUEST_TEMPLATES = {
    // === ПОДЗЕМЕЛЬЕ ===

    explore_ruins: {
        id: 'explore_ruins',
        title: 'Забытые глубины',
        description: 'Исследуйте подземные руины и найдите древний артефакт.',
        level: 'underground',
        type: 'exploration',
        objectives: [
            { type: 'visit', target: 'underground_ruins', count: 3, current: 0, label: 'Руин исследовано' },
            { type: 'find', target: 'ancient_artifact', count: 1, current: 0, label: 'Артефактов найдено' }
        ],
        rewards: { exp: 500, gold: 200, items: ['torch', 'rope'] },
        prerequisites: [],
        giver: 'miner_old',
        location: { x: 0, y: -20, z: 0 }
    },

    mine_ores: {
        id: 'mine_ores',
        title: 'Шахтёрская удача',
        description: 'Добудьте редкие руды в подземелье.',
        level: 'underground',
        type: 'collection',
        objectives: [
            { type: 'collect', target: 'diamond_ore', count: 5, current: 0, label: 'Алмазной руды' },
            { type: 'collect', target: 'gold_ore', count: 10, current: 0, label: 'Золотой руды' },
            { type: 'collect', target: 'obsidian', count: 3, current: 0, label: 'Обсидиана' }
        ],
        rewards: { exp: 800, gold: 500, items: ['pickaxe_steel'] },
        prerequisites: ['explore_ruins'],
        giver: 'blacksmith',
        location: { x: 0, y: -15, z: 0 }
    },

    defeat_goblin_king: {
        id: 'defeat_goblin_king',
        title: 'Король под горой',
        description: 'Победите короля гоблинов и освободите подземелье.',
        level: 'underground',
        type: 'boss',
        objectives: [
            { type: 'kill', target: 'goblin_king', count: 1, current: 0, label: 'Королей гоблинов побеждено' },
            { type: 'kill', target: 'goblin', count: 20, current: 0, label: 'Гоблинов убито' }
        ],
        rewards: { exp: 2000, gold: 1000, items: ['goblin_crown', 'key_underground'] },
        prerequisites: ['mine_ores'],
        giver: 'village_elder',
        location: { x: 0, y: -25, z: 0 }
    },

    rescue_miners: {
        id: 'rescue_miners',
        title: 'Спасение шахтёров',
        description: 'Найдите и спасите пропавших шахтёров.',
        level: 'underground',
        type: 'rescue',
        objectives: [
            { type: 'find', target: 'trapped_miner', count: 5, current: 0, label: 'Шахтёров спасено' },
            { type: 'kill', target: 'spider', count: 10, current: 0, label: 'Пауков убито' }
        ],
        rewards: { exp: 1200, gold: 600, items: ['miners_helmet', 'dynamite'] },
        prerequisites: ['explore_ruins'],
        giver: 'mayor',
        location: { x: 0, y: -18, z: 0 }
    },

    activate_altars: {
        id: 'activate_altars',
        title: 'Пробуждение древних',
        description: 'Активируйте все древние алтари в подземелье.',
        level: 'underground',
        type: 'activation',
        objectives: [
            { type: 'activate', target: 'altar', count: 5, current: 0, label: 'Алтарей активировано' }
        ],
        rewards: { exp: 1500, gold: 800, items: ['rune_stone', 'ancient_scroll'] },
        prerequisites: ['defeat_goblin_king'],
        giver: 'mage',
        location: { x: 0, y: -22, z: 0 }
    },

    // === ПОВЕРХНОСТЬ ===

    defend_village: {
        id: 'defend_village',
        title: 'Страж деревни',
        description: 'Защитите деревню от орочьего набега.',
        level: 'surface',
        type: 'defense',
        objectives: [
            { type: 'kill', target: 'orc', count: 15, current: 0, label: 'Орков убито' },
            { type: 'defend', target: 'village_house', count: 5, current: 0, label: 'Домов защищено' }
        ],
        rewards: { exp: 1000, gold: 400, items: ['village_shield', 'health_potion'] },
        prerequisites: [],
        giver: 'village_guard',
        location: { x: 0, y: 5, z: 0 }
    },

    hunt_wolves: {
        id: 'hunt_wolves',
        title: 'Волчья охота',
        description: 'Уничтожьте волчью стаю, терроризирующую окрестности.',
        level: 'surface',
        type: 'hunt',
        objectives: [
            { type: 'kill', target: 'wolf', count: 10, current: 0, label: 'Волков убито' },
            { type: 'kill', target: 'forest_giant', count: 1, current: 0, label: 'Лесных великанов побеждено' }
        ],
        rewards: { exp: 1500, gold: 700, items: ['wolf_pelt', 'hunters_bow'] },
        prerequisites: ['defend_village'],
        giver: 'hunter',
        location: { x: 50, y: 5, z: 50 }
    },

    find_artifacts: {
        id: 'find_artifacts',
        title: 'Охота за артефактами',
        description: 'Найдите древние артефакты, разбросанные по миру.',
        level: 'surface',
        type: 'collection',
        objectives: [
            { type: 'find', target: 'ancient_sword', count: 1, current: 0, label: 'Древний меч' },
            { type: 'find', target: 'crystal_shard', count: 5, current: 0, label: 'Кристальных осколков' },
            { type: 'find', target: 'golden_idol', count: 1, current: 0, label: 'Золотой идол' }
        ],
        rewards: { exp: 2000, gold: 1500, items: ['artifact_bag', 'map_treasure'] },
        prerequisites: ['hunt_wolves'],
        giver: 'archaeologist',
        location: { x: 100, y: 5, z: 100 }
    },

    build_watchtower: {
        id: 'build_watchtower',
        title: 'Бдительный страж',
        description: 'Помогите построить сторожевые башни для защиты границ.',
        level: 'surface',
        type: 'construction',
        objectives: [
            { type: 'build', target: 'watchtower', count: 3, current: 0, label: 'Башен построено' },
            { type: 'collect', target: 'stone', count: 100, current: 0, label: 'Камня собрано' },
            { type: 'collect', target: 'wood_log', count: 50, current: 0, label: 'Брёвен собрано' }
        ],
        rewards: { exp: 1200, gold: 600, items: ['builders_hammer', 'blueprint_tower'] },
        prerequisites: ['defend_village'],
        giver: 'architect',
        location: { x: 0, y: 5, z: 0 }
    },

    // === НЕБЕСА ===

    explore_cloud_city: {
        id: 'explore_cloud_city',
        title: 'Город в облаках',
        description: 'Исследуйте летающие города и найдите их тайны.',
        level: 'sky',
        type: 'exploration',
        objectives: [
            { type: 'visit', target: 'cloud_city', count: 2, current: 0, label: 'Облачных городов исследовано' },
            { type: 'activate', target: 'sky_portal', count: 1, current: 0, label: 'Порталов активировано' }
        ],
        rewards: { exp: 1500, gold: 800, items: ['cloud_boots', 'feather_fall'] },
        prerequisites: ['find_artifacts'],
        giver: 'sky_scholar',
        location: { x: 0, y: 90, z: 0 }
    },

    collect_crystals: {
        id: 'collect_crystals',
        title: 'Хрустальная коллекция',
        description: 'Соберите редкие хрустали с летающих островов.',
        level: 'sky',
        type: 'collection',
        objectives: [
            { type: 'collect', target: 'crystal', count: 15, current: 0, label: 'Хрусталей собрано' },
            { type: 'collect', target: 'sky_gem', count: 5, current: 0, label: 'Небесных самоцветов' }
        ],
        rewards: { exp: 1800, gold: 1000, items: ['crystal_staff', 'mana_potion'] },
        prerequisites: ['explore_cloud_city'],
        giver: 'crystal_merchant',
        location: { x: 50, y: 95, z: 50 }
    },

    defeat_ice_dragon: {
        id: 'defeat_ice_dragon',
        title: 'Ледяной ужас',
        description: 'Победите ледяного дракона и спасите небесные города.',
        level: 'sky',
        type: 'boss',
        objectives: [
            { type: 'kill', target: 'ice_dragon', count: 1, current: 0, label: 'Ледяных драконов побеждено' },
            { type: 'collect', target: 'dragon_scale', count: 10, current: 0, label: 'Драконьей чешуи' }
        ],
        rewards: { exp: 5000, gold: 3000, items: ['dragon_slayer_sword', 'ice_armor', 'dragon_egg'] },
        prerequisites: ['collect_crystals'],
        giver: 'sky_king',
        location: { x: 0, y: 100, z: 0 }
    },

    activate_obelisks: {
        id: 'activate_obelisks',
        title: 'Сила обелисков',
        description: 'Активируйте все обелиски силы в небесном мире.',
        level: 'sky',
        type: 'activation',
        objectives: [
            { type: 'activate', target: 'obelisk', count: 5, current: 0, label: 'Обелисков активировано' }
        ],
        rewards: { exp: 2500, gold: 1500, items: ['obelisk_power', 'sky_crystal'] },
        prerequisites: ['defeat_ice_dragon'],
        giver: 'sky_guardian',
        location: { x: 100, y: 95, z: 100 }
    },

    build_sky_bridge: {
        id: 'build_sky_bridge',
        title: 'Мосты между мирами',
        description: 'Постройте мосты между летающими островами.',
        level: 'sky',
        type: 'construction',
        objectives: [
            { type: 'build', target: 'sky_bridge', count: 5, current: 0, label: 'Мостов построено' },
            { type: 'collect', target: 'cloud_stone', count: 200, current: 0, label: 'Облачного камня' }
        ],
        rewards: { exp: 2000, gold: 1200, items: ['sky_builder_kit', 'cloud_platform'] },
        prerequisites: ['explore_cloud_city'],
        giver: 'sky_engineer',
        location: { x: 0, y: 90, z: 0 }
    },

    // === ЭПИЧЕСКИЕ КВЕСТЫ ===

    unite_worlds: {
        id: 'unite_worlds',
        title: 'Единство миров',
        description: 'Соберите артефакты всех трёх миров и откройте портал к финальному боссу.',
        level: 'all',
        type: 'epic',
        objectives: [
            { type: 'find', target: 'underground_key', count: 1, current: 0, label: 'Ключ подземелья' },
            { type: 'find', target: 'surface_key', count: 1, current: 0, label: 'Ключ поверхности' },
            { type: 'find', target: 'sky_key', count: 1, current: 0, label: 'Ключ небес' },
            { type: 'activate', target: 'final_portal', count: 1, current: 0, label: 'Финальный портал' }
        ],
        rewards: { exp: 10000, gold: 5000, items: ['world_uniter', 'legendary_sword', 'crown_hero'] },
        prerequisites: ['activate_altars', 'find_artifacts', 'activate_obelisks'],
        giver: 'ancient_prophet',
        location: { x: 0, y: 50, z: 0 }
    }
};

// ==================== ЕЖЕДНЕВНЫЕ КВЕСТЫ ====================

const DAILY_QUESTS = {
    underground: [
        {
            id: 'daily_mine',
            title: 'Дневная выработка',
            description: 'Добудьте руды в подземелье.',
            objectives: [
                { type: 'collect', target: 'any_ore', count: 20, current: 0, label: 'Руды добыто' }
            ],
            rewards: { exp: 300, gold: 150 }
        },
        {
            id: 'daily_spider',
            title: 'Чистка пещер',
            description: 'Уничтожьте пауков в подземелье.',
            objectives: [
                { type: 'kill', target: 'spider', count: 10, current: 0, label: 'Пауков убито' }
            ],
            rewards: { exp: 400, gold: 200 }
        },
        {
            id: 'daily_explore',
            title: 'Исследователь глубин',
            description: 'Исследуйте новые области подземелья.',
            objectives: [
                { type: 'discover', target: 'new_chunk', count: 5, current: 0, label: 'Чанков исследовано' }
            ],
            rewards: { exp: 250, gold: 100 }
        }
    ],

    surface: [
        {
            id: 'daily_hunt',
            title: 'Охотничий день',
            description: 'Охотьтесь на диких зверей.',
            objectives: [
                { type: 'kill', target: 'wolf', count: 5, current: 0, label: 'Волков убито' }
            ],
            rewards: { exp: 350, gold: 180 }
        },
        {
            id: 'daily_defend',
            title: 'Дозорный',
            description: 'Защитите путников от бандитов.',
            objectives: [
                { type: 'escort', target: 'traveler', count: 3, current: 0, label: 'Путников доведено' }
            ],
            rewards: { exp: 400, gold: 220 }
        },
        {
            id: 'daily_gather',
            title: 'Сборщик',
            description: 'Соберите ресурсы для деревни.',
            objectives: [
                { type: 'collect', target: 'wood', count: 50, current: 0, label: 'Древесины' },
                { type: 'collect', target: 'stone', count: 30, current: 0, label: 'Камня' }
            ],
            rewards: { exp: 300, gold: 150 }
        }
    ],

    sky: [
        {
            id: 'daily_crystal',
            title: 'Небесный сборщик',
            description: 'Соберите хрустали с островов.',
            objectives: [
                { type: 'collect', target: 'crystal', count: 10, current: 0, label: 'Хрусталей' }
            ],
            rewards: { exp: 500, gold: 300 }
        },
        {
            id: 'daily_cloud',
            title: 'Облачный странник',
            description: 'Посетите летающие острова.',
            objectives: [
                { type: 'visit', target: 'floating_island', count: 5, current: 0, label: 'Островов посещено' }
            ],
            rewards: { exp: 450, gold: 250 }
        },
        {
            id: 'daily_sky_battle',
            title: 'Небесный воин',
            description: 'Победите облачных элементалей.',
            objectives: [
                { type: 'kill', target: 'cloud_elemental', count: 8, current: 0, label: 'Элементалей убито' }
            ],
            rewards: { exp: 600, gold: 350 }
        }
    ]
};

// ==================== МЕНЕДЖЕР КВЕСТОВ ====================

class QuestManager {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.dailyQuests = [];
        this.lastDailyReset = 0;
    }

    init() {
        this.resetDailyQuests();
    }

    resetDailyQuests() {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        if (now - this.lastDailyReset > dayMs) {
            this.dailyQuests = [];

            // Случайный выбор ежедневных квестов
            for (const level of ['underground', 'surface', 'sky']) {
                const quests = DAILY_QUESTS[level];
                const randomQuest = quests[Math.floor(Math.random() * quests.length)];
                this.dailyQuests.push({ ...randomQuest, isDaily: true });
            }

            this.lastDailyReset = now;
        }
    }

    startQuest(questId) {
        const template = QUEST_TEMPLATES[questId];
        if (!template) {
            console.warn('Quest not found:', questId);
            return null;
        }

        // Проверка предварительных условий
        for (const prereq of template.prerequisites) {
            if (!this.completedQuests.includes(prereq)) {
                console.warn('Prerequisites not met for quest:', questId);
                return null;
            }
        }

        // Проверка, не активен ли уже
        if (this.activeQuests.find(q => q.id === questId)) {
            console.warn('Quest already active:', questId);
            return null;
        }

        const quest = {
            ...template,
            startTime: Date.now(),
            objectives: template.objectives.map(o => ({ ...o }))
        };

        this.activeQuests.push(quest);
        this.onQuestStarted(quest);

        return quest;
    }

    updateQuestProgress(questId, objectiveType, target, amount = 1) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return;

        for (const objective of quest.objectives) {
            if (objective.type === objectiveType && 
                (objective.target === target || objective.target === 'any')) {
                objective.current = Math.min(objective.current + amount, objective.count);
            }
        }

        this.checkQuestCompletion(quest);
    }

    checkQuestCompletion(quest) {
        const allComplete = quest.objectives.every(o => o.current >= o.count);

        if (allComplete) {
            this.completeQuest(quest);
        }
    }

    completeQuest(quest) {
        // Удаляем из активных
        this.activeQuests = this.activeQuests.filter(q => q.id !== quest.id);
        this.completedQuests.push(quest.id);

        // Выдаём награды
        this.giveRewards(quest.rewards);

        // Уведомление
        this.onQuestCompleted(quest);

        // Проверяем доступность новых квестов
        this.checkNewQuests();
    }

    giveRewards(rewards) {
        if (rewards.exp) player.addExp(rewards.exp);
        if (rewards.gold) player.addGold(rewards.gold);
        if (rewards.items) {
            for (const item of rewards.items) {
                player.inventory.add(item);
            }
        }
    }

    checkNewQuests() {
        for (const [id, quest] of Object.entries(QUEST_TEMPLATES)) {
            if (this.completedQuests.includes(id)) continue;
            if (this.activeQuests.find(q => q.id === id)) continue;

            const prereqsMet = quest.prerequisites.every(p => this.completedQuests.includes(p));
            if (prereqsMet) {
                this.onQuestAvailable(quest);
            }
        }
    }

    // События
    onQuestStarted(quest) {
        showNotification(`Квест начат: ${quest.title}`);
        console.log('Quest started:', quest.id);
    }

    onQuestCompleted(quest) {
        showNotification(`Квест завершён: ${quest.title}!`);
        console.log('Quest completed:', quest.id);
    }

    onQuestAvailable(quest) {
        showNotification(`Доступен новый квест: ${quest.title}`);
        console.log('Quest available:', quest.id);
    }

    // Сериализация
    save() {
        return {
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            dailyQuests: this.dailyQuests,
            lastDailyReset: this.lastDailyReset
        };
    }

    load(data) {
        this.activeQuests = data.activeQuests || [];
        this.completedQuests = data.completedQuests || [];
        this.dailyQuests = data.dailyQuests || [];
        this.lastDailyReset = data.lastDailyReset || 0;
        this.resetDailyQuests();
    }
}

// ==================== ИНТЕГРАЦИЯ С МИРОМ ====================

function onMobKilled(mob, killer) {
    // Обновляем прогресс квестов на убийство
    if (killer === player) {
        for (const quest of questManager.activeQuests) {
            questManager.updateQuestProgress(quest.id, 'kill', mob.type);
        }
    }
}

function onBlockMined(block, miner) {
    if (miner === player) {
        for (const quest of questManager.activeQuests) {
            questManager.updateQuestProgress(quest.id, 'collect', block);
        }
    }
}

function onStructureVisited(structure, visitor) {
    if (visitor === player) {
        for (const quest of questManager.activeQuests) {
            questManager.updateQuestProgress(quest.id, 'visit', structure);
        }
    }
}

function onStructureActivated(structure, activator) {
    if (activator === player) {
        for (const quest of questManager.activeQuests) {
            questManager.updateQuestProgress(quest.id, 'activate', structure);
        }
    }
}

function onItemFound(item, finder) {
    if (finder === player) {
        for (const quest of questManager.activeQuests) {
            questManager.updateQuestProgress(quest.id, 'find', item);
        }
    }
}

// ==================== UI УВЕДОМЛЕНИЯ ====================

function showNotification(text) {
    // Создаём элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'quest-notification';
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

let questManager;

function initQuestSystem() {
    questManager = new QuestManager();
    questManager.init();

    // Загрузка сохранённых квестов
    const saved = localStorage.getItem('minicraft_quests');
    if (saved) {
        questManager.load(JSON.parse(saved));
    }

    // Автосохранение
    setInterval(() => {
        localStorage.setItem('minicraft_quests', JSON.stringify(questManager.save()));
    }, 30000);
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = {
        QuestManager,
        QUEST_TEMPLATES,
        DAILY_QUESTS,
        initQuestSystem,
        onMobKilled,
        onBlockMined,
        onStructureVisited,
        onStructureActivated,
        onItemFound
    };
}
