# MiniCraft Adventure RPG V10 — Foundation

V10 is the foundation milestone:
- unified Game Core state;
- player stats, HP, XP, levels and gold;
- inventory and hotbar selection;
- quest state machine;
- world regions/discovery;
- defeated enemy tracking;
- local save/load via localStorage;
- automatic saving after important changes;
- mobile save/heal controls;
- resettable save state.

Architecture is intentionally prepared for later systems:
World, Player, Combat, AI, NPC/Dialogues, Quests, Items, Dungeon, Save/Load, Mobile Input.

Next global milestone: V11–V15 should replace prototype UI hooks with real 3D world entities, collision, NPC interaction, dungeon transitions and a persistent mobile input layer.
