// js/data/workoutSplits.js
export const workoutSplits = {
    splits: [
        {
            id: "full_body_a",
            name: "Full Body A",
            focus: ["quads", "chest", "lats", "shoulders", "core"],
            restAfter: 2,
            description: "Balanced full body workout with emphasis on lower body and horizontal push/pull"
        },
        {
            id: "full_body_b",
            name: "Full Body B",
            focus: ["hamstrings", "glutes", "back", "triceps", "biceps"],
            restAfter: 2,
            description: "Full body with posterior chain and arm focus"
        },
        {
            id: "push_day",
            name: "Push Day",
            focus: ["chest", "shoulders", "triceps"],
            restAfter: 3,
            description: "Upper body pushing muscles"
        },
        {
            id: "pull_day",
            name: "Pull Day",
            focus: ["back", "lats", "biceps", "rear_delts"],
            restAfter: 3,
            description: "Upper body pulling muscles"
        },
        {
            id: "legs_day",
            name: "Legs Day",
            focus: ["quads", "hamstrings", "glutes", "calves"],
            restAfter: 3,
            description: "Lower body focused"
        },
        {
            id: "longevity_day",
            name: "Longevity & Joint Health",
            focus: ["core", "forearms", "neck", "tibialis", "rhomboids", "hip_flexors"],
            restAfter: 1,
            description: "Low intensity, high volume joint and mobility work"
        },
        {
            id: "upper_body",
            name: "Upper Body",
            focus: ["chest", "back", "shoulders", "biceps", "triceps", "traps"],
            restAfter: 2,
            description: "Complete upper body workout"
        },
        {
            id: "lower_body",
            name: "Lower Body",
            focus: ["quads", "hamstrings", "glutes", "calves", "adductors", "abductors"],
            restAfter: 2,
            description: "Complete lower body workout"
        }
    ],
    
    // Get a split by ID
    getSplitById: function(id) {
        return this.splits.find(s => s.id === id);
    },
    
    // Get next split in rotation (cyclic)
    getNextSplit: function(currentSplitId) {
        const index = this.splits.findIndex(s => s.id === currentSplitId);
        if (index === -1) return this.splits[0];
        const nextIndex = (index + 1) % this.splits.length;
        return this.splits[nextIndex];
    },
    
    // Get splits suitable for deload (lower intensity)
    getDeloadSplits: function() {
        return this.splits.filter(s => s.id === 'longevity_day' || s.id === 'full_body_a' || s.id === 'full_body_b');
    }
};