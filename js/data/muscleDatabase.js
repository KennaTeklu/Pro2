// js/data/muscleDatabase.js
export const muscleDatabase = {
    major: [
        { name: "quads", display: "Quadriceps", restDays: 3, category: "lower", agingRisk: "medium" },
        { name: "hamstrings", display: "Hamstrings", restDays: 3, category: "lower", agingRisk: "medium" },
        { name: "glutes", display: "Glutes", restDays: 2, category: "lower", agingRisk: "low" },
        { name: "chest", display: "Chest", restDays: 2, category: "upper", agingRisk: "low" },
        { name: "back", display: "Back", restDays: 2, category: "upper", agingRisk: "medium" },
        { name: "lats", display: "Latissimus Dorsi", restDays: 2, category: "upper", agingRisk: "low" },
        { name: "shoulders", display: "Shoulders", restDays: 2, category: "upper", agingRisk: "medium" },
        { name: "biceps", display: "Biceps", restDays: 2, category: "arms", agingRisk: "low" },
        { name: "triceps", display: "Triceps", restDays: 2, category: "arms", agingRisk: "low" },
        { name: "calves", display: "Calves", restDays: 2, category: "lower", agingRisk: "medium" },
        { name: "core", display: "Core", restDays: 1, category: "core", agingRisk: "high" },
        { name: "forearms", display: "Forearms", restDays: 2, category: "arms", agingRisk: "high" },
        { name: "traps", display: "Traps", restDays: 2, category: "upper", agingRisk: "low" },
        { name: "rear_delts", display: "Rear Deltoids", restDays: 2, category: "upper", agingRisk: "medium" },
        { name: "obliques", display: "Obliques", restDays: 2, category: "core", agingRisk: "medium" },
        { name: "hip_flexors", display: "Hip Flexors", restDays: 2, category: "lower", agingRisk: "high" },
        { name: "adductors", display: "Adductors", restDays: 3, category: "lower", agingRisk: "medium" },
        { name: "abductors", display: "Abductors", restDays: 2, category: "lower", agingRisk: "medium" },
        { name: "erectors", display: "Erector Spinae", restDays: 3, category: "core", agingRisk: "high" }
    ],
    longevity: [
        { name: "neck", display: "Neck", restDays: 3, category: "longevity", agingRisk: "high" },
        { name: "deep_neck", display: "Deep Neck Flexors", restDays: 2, category: "longevity", agingRisk: "high" },
        { name: "rhomboids", display: "Rhomboids", restDays: 2, category: "longevity", agingRisk: "medium" },
        { name: "infraspinatus", display: "Infraspinatus", restDays: 3, category: "longevity", agingRisk: "high" },
        { name: "supraspinatus", display: "Supraspinatus", restDays: 3, category: "longevity", agingRisk: "high" },
        { name: "subscapularis", display: "Subscapularis", restDays: 3, category: "longevity", agingRisk: "high" },
        { name: "brachialis", display: "Brachialis", restDays: 2, category: "longevity", agingRisk: "low" },
        { name: "brachioradialis", display: "Brachioradialis", restDays: 2, category: "longevity", agingRisk: "low" },
        { name: "popliteus", display: "Popliteus", restDays: 3, category: "longevity", agingRisk: "high" },
        { name: "tibialis", display: "Tibialis Anterior", restDays: 2, category: "longevity", agingRisk: "medium" },
        { name: "soleus", display: "Soleus", restDays: 2, category: "longevity", agingRisk: "medium" },
        { name: "multifidus", display: "Multifidus", restDays: 2, category: "longevity", agingRisk: "high" },
        { name: "transverse", display: "Transverse Abdominis", restDays: 1, category: "longevity", agingRisk: "high" }
    ],
    hands: [
        { name: "hand_lumbricals", display: "Hand Lumbricals", restDays: 1, category: "hands", agingRisk: "high" },
        { name: "hand_interossei", display: "Hand Interossei", restDays: 1, category: "hands", agingRisk: "high" },
        { name: "thenar", display: "Thenar/Hypothenar", restDays: 1, category: "hands", agingRisk: "high" }
    ],
    feet: [
        { name: "foot_intrinsics", display: "Foot Intrinsics", restDays: 1, category: "feet", agingRisk: "high" },
        { name: "foot_interossei", display: "Foot Interossei", restDays: 1, category: "feet", agingRisk: "high" },
        { name: "abductor_hallucis", display: "Abductor Hallucis", restDays: 2, category: "feet", agingRisk: "medium" },
        { name: "flexor_brevis", display: "Flexor Digitorum Brevis", restDays: 2, category: "feet", agingRisk: "medium" }
    ]
};

export function getAllMuscleGroups() {
    return [
        ...muscleDatabase.major,
        ...muscleDatabase.longevity,
        ...muscleDatabase.hands,
        ...muscleDatabase.feet
    ];
}

export function getMuscleByName(name) {
    const all = getAllMuscleGroups();
    return all.find(m => m.name === name);
}

export function getMuscleDisplayName(name) {
    const muscle = getMuscleByName(name);
    return muscle ? muscle.display : name;
}

export function getMuscleRestDays(name) {
    const muscle = getMuscleByName(name);
    return muscle ? muscle.restDays : 2;
}

export function getMusclesByCategory(category) {
    const all = getAllMuscleGroups();
    return all.filter(m => m.category === category);
}