// js/data/exerciseLibrary.js
export const exerciseLibrary = {
    quads: [
        { name: "Barbell Back Squat", muscles: ["quads", "glutes", "core"], equipment: "barbell", defaultSets: 4, defaultReps: "8-10", instructions: ["Place bar on upper traps", "Squat to parallel", "Drive through heels"], strengthIndex: 1.5, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Barbell Front Squat", muscles: ["quads", "core"], equipment: "barbell", defaultSets: 3, defaultReps: "6-8", instructions: ["Clean grip or cross arms", "Keep torso upright", "Squat deep"], strengthIndex: 1.3, skillFactor: 0.55, prescriptionType: "reps" },
        { name: "Goblet Squat", muscles: ["quads", "glutes"], equipment: "dumbbell", defaultSets: 3, defaultReps: "10-15", instructions: ["Hold one dumbbell vertically", "Squat down, elbows inside knees"], strengthIndex: 1.0, skillFactor: 0.7, prescriptionType: "reps" },
        { name: "Leg Press", muscles: ["quads", "glutes", "hamstrings"], equipment: "machine", defaultSets: 3, defaultReps: "10-15", instructions: ["Place feet shoulder-width", "Lower until knees at 90°"], strengthIndex: 1.3, skillFactor: 0.9, prescriptionType: "reps" },
        { name: "Bulgarian Split Squat", muscles: ["quads", "glutes", "hamstrings"], equipment: "dumbbell", defaultSets: 3, defaultReps: "8-12 each", instructions: ["Rear foot on bench", "Lower until front thigh parallel"], strengthIndex: 1.2, skillFactor: 0.65, prescriptionType: "reps" }
    ],
    hamstrings: [
        { name: "Romanian Deadlift", muscles: ["hamstrings", "glutes", "erectors"], equipment: "barbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Hinge at hips", "Keep back flat", "Feel stretch in hamstrings"], strengthIndex: 1.4, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Conventional Deadlift", muscles: ["hamstrings", "glutes", "back", "erectors"], equipment: "barbell", defaultSets: 3, defaultReps: "5", instructions: ["Feet hip-width", "Pull bar close to body"], strengthIndex: 1.8, skillFactor: 0.5, prescriptionType: "reps" },
        { name: "Lying Leg Curl", muscles: ["hamstrings"], equipment: "machine", defaultSets: 3, defaultReps: "12-20", instructions: ["Lie face down", "Curl heels toward glutes"], strengthIndex: 0.8, skillFactor: 0.95, prescriptionType: "reps" },
        { name: "Nordic Curl", muscles: ["hamstrings"], equipment: "bodyweight", defaultSets: 3, defaultReps: "5-8", instructions: ["Kneel with ankles anchored", "Lower torso slowly"], strengthIndex: 1.0, skillFactor: 0.5, prescriptionType: "reps" }
    ],
    glutes: [
        { name: "Barbell Hip Thrust", muscles: ["glutes", "hamstrings"], equipment: "barbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Shoulders on bench", "Drive hips up"], strengthIndex: 1.5, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Cable Glute Kickback", muscles: ["glutes"], equipment: "cable", defaultSets: 3, defaultReps: "15 each", instructions: ["Ankle cuff", "Kick back"], strengthIndex: 0.9, skillFactor: 0.8, prescriptionType: "reps" }
    ],
    chest: [
        { name: "Barbell Bench Press", muscles: ["chest", "triceps", "front_delts"], equipment: "barbell", defaultSets: 4, defaultReps: "5-8", instructions: ["Feet planted", "Bar to mid-chest"], strengthIndex: 1.2, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Incline Dumbbell Press", muscles: ["chest", "front_delts"], equipment: "dumbbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Bench at 30-45°", "Press dumbbells"], strengthIndex: 1.0, skillFactor: 0.65, prescriptionType: "reps" },
        { name: "Push-Up", muscles: ["chest", "triceps", "core"], equipment: "bodyweight", defaultSets: 3, defaultReps: "15-20", instructions: ["Hands shoulder-width", "Lower chest to floor"], strengthIndex: 1.0, skillFactor: 0.9, prescriptionType: "reps" },
        { name: "Dips (chest focus)", muscles: ["chest", "triceps"], equipment: "bodyweight", defaultSets: 3, defaultReps: "8-12", instructions: ["Lean forward", "Lower until arms 90°"], strengthIndex: 1.2, skillFactor: 0.7, prescriptionType: "reps" }
    ],
    back_lats: [
        { name: "Pull-Up", muscles: ["lats", "biceps", "back"], equipment: "bodyweight", defaultSets: 3, defaultReps: "AMRAP", instructions: ["Overhand grip", "Pull chest to bar"], strengthIndex: 1.0, skillFactor: 0.6, prescriptionType: "amrap" },
        { name: "Lat Pulldown", muscles: ["lats", "biceps"], equipment: "machine", defaultSets: 3, defaultReps: "10-15", instructions: ["Wide grip", "Pull to upper chest"], strengthIndex: 1.0, skillFactor: 0.9, prescriptionType: "reps" },
        { name: "Barbell Bent-Over Row", muscles: ["lats", "rhomboids", "traps", "biceps"], equipment: "barbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Bend at hips", "Pull bar to lower chest"], strengthIndex: 1.2, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Seated Cable Row", muscles: ["lats", "rhomboids"], equipment: "cable", defaultSets: 3, defaultReps: "10-15", instructions: ["Use V-bar", "Pull to abdomen"], strengthIndex: 1.1, skillFactor: 0.85, prescriptionType: "reps" }
    ],
    shoulders_anterior: [
        { name: "Overhead Press", muscles: ["front_delts", "triceps"], equipment: "barbell", defaultSets: 4, defaultReps: "5-8", instructions: ["Press from shoulders", "Lock out overhead"], strengthIndex: 0.8, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Seated Dumbbell Press", muscles: ["front_delts", "triceps"], equipment: "dumbbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Sit with back support", "Press overhead"], strengthIndex: 0.7, skillFactor: 0.65, prescriptionType: "reps" }
    ],
    shoulders_lateral: [
        { name: "Dumbbell Lateral Raise", muscles: ["lateral_delts"], equipment: "dumbbell", defaultSets: 3, defaultReps: "15-20", instructions: ["Light weight", "Raise to shoulder height"], strengthIndex: 0.5, skillFactor: 0.7, prescriptionType: "reps" }
    ],
    biceps: [
        { name: "Barbell Curl", muscles: ["biceps"], equipment: "barbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Stand with bar", "Curl without swinging"], strengthIndex: 0.4, skillFactor: 0.7, prescriptionType: "reps" },
        { name: "Dumbbell Curl", muscles: ["biceps"], equipment: "dumbbell", defaultSets: 3, defaultReps: "10-15", instructions: ["Alternating or simultaneous"], strengthIndex: 0.4, skillFactor: 0.8, prescriptionType: "reps" },
        { name: "Hammer Curl", muscles: ["biceps", "brachialis", "forearms"], equipment: "dumbbell", defaultSets: 3, defaultReps: "10-15", instructions: ["Neutral grip"], strengthIndex: 0.45, skillFactor: 0.8, prescriptionType: "reps" }
    ],
    triceps: [
        { name: "Close-Grip Bench Press", muscles: ["triceps", "chest"], equipment: "barbell", defaultSets: 3, defaultReps: "8-12", instructions: ["Hands inside shoulder width"], strengthIndex: 0.9, skillFactor: 0.65, prescriptionType: "reps" },
        { name: "Triceps Pushdown", muscles: ["triceps"], equipment: "cable", defaultSets: 3, defaultReps: "12-15", instructions: ["Rope or bar", "Push down"], strengthIndex: 0.5, skillFactor: 0.85, prescriptionType: "reps" }
    ],
    calves: [
        { name: "Standing Calf Raise", muscles: ["calves"], equipment: "machine", defaultSets: 4, defaultReps: "15-20", instructions: ["Stand with weight on shoulders", "Raise heels"], strengthIndex: 0.8, skillFactor: 0.95, prescriptionType: "reps" },
        { name: "Seated Calf Raise", muscles: ["soleus"], equipment: "machine", defaultSets: 4, defaultReps: "20", instructions: ["Sit with weight on knees", "Raise heels"], strengthIndex: 0.7, skillFactor: 0.95, prescriptionType: "reps" }
    ],
    core_abs: [
        { name: "Plank", muscles: ["core"], equipment: "bodyweight", defaultSets: 3, defaultReps: "60 sec", instructions: ["Elbows under shoulders", "Hold straight line"], strengthIndex: 1.0, skillFactor: 0.95, prescriptionType: "time", defaultDuration: 60 },
        { name: "Hanging Leg Raise", muscles: ["core"], equipment: "bodyweight", defaultSets: 3, defaultReps: "12-15", instructions: ["Hang from bar", "Raise legs to horizontal"], strengthIndex: 1.0, skillFactor: 0.6, prescriptionType: "reps" },
        { name: "Russian Twist", muscles: ["obliques", "core"], equipment: "dumbbell", defaultSets: 3, defaultReps: "20", instructions: ["Sit with feet elevated", "Rotate side to side"], strengthIndex: 0.4, skillFactor: 0.7, prescriptionType: "reps" }
    ],
    forearms: [
        { name: "Wrist Curl", muscles: ["forearms"], equipment: "barbell", defaultSets: 3, defaultReps: "15-20", instructions: ["Forearms on bench", "Curl weight"], strengthIndex: 0.3, skillFactor: 0.9, prescriptionType: "reps" },
        { name: "Farmer's Walk", muscles: ["forearms", "grip"], equipment: "dumbbell", defaultSets: 3, defaultReps: "30-60 sec", instructions: ["Walk holding heavy weights"], strengthIndex: 0.5, skillFactor: 0.8, prescriptionType: "time", defaultDuration: 45 }
    ],
    traps: [
        { name: "Barbell Shrug", muscles: ["traps"], equipment: "barbell", defaultSets: 3, defaultReps: "12-15", instructions: ["Hold bar at arms", "Shrug shoulders up"], strengthIndex: 1.2, skillFactor: 0.9, prescriptionType: "reps" }
    ],
    rhomboids_reardelts: [
        { name: "Face Pull", muscles: ["rear_delts", "rhomboids", "traps"], equipment: "cable", defaultSets: 3, defaultReps: "15-20", instructions: ["Rope attachment", "Pull to face"], strengthIndex: 0.7, skillFactor: 0.7, prescriptionType: "reps" },
        { name: "Bent-Over Reverse Fly", muscles: ["rear_delts", "rhomboids"], equipment: "dumbbell", defaultSets: 3, defaultReps: "15", instructions: ["Bend at hips", "Raise arms laterally"], strengthIndex: 0.7, skillFactor: 0.7, prescriptionType: "reps" }
    ]
};

export function getExerciseById(id) {
    for (const group in exerciseLibrary) {
        const found = exerciseLibrary[group].find(ex => 
            ex.name.toLowerCase().replace(/\s/g, '_') === id
        );
        if (found) return found;
    }
    return null;
}

export function getAllExercises() {
    const all = [];
    for (const group in exerciseLibrary) {
        all.push(...exerciseLibrary[group]);
    }
    return all;
}

export function getExercisesByMuscle(muscle) {
    const results = [];
    for (const group in exerciseLibrary) {
        for (const ex of exerciseLibrary[group]) {
            if (ex.muscles && ex.muscles.includes(muscle)) {
                results.push(ex);
            }
        }
    }
    return results;
}