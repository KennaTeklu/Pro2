// js/core/storage.js
import Dexie from 'https://unpkg.com/dexie@3.2.4/dist/dexie.js';

// Initialize database
const db = new Dexie('ProApp');
db.version(1).stores({
    workouts: 'id, date, type',
    exercises: 'id',
    user: 'key',
    savedWorkout: 'id'
});

// ----- User storage -----
export async function saveUserToDB(user) {
    await db.user.put({ key: 'main', value: user });
}

export async function loadUserFromDB() {
    const record = await db.user.get('main');
    return record ? record.value : null;
}

// ----- Workout history -----
export async function saveWorkout(workout) {
    if (!workout.id) workout.id = `wo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await db.workouts.put(workout);
    // Also keep in‑memory list if needed
    return workout;
}

export async function loadWorkouts() {
    return await db.workouts.toArray();
}

export async function deleteWorkout(id) {
    await db.workouts.delete(id);
}

// ----- Exercise records (1RM history, performance logs) -----
export async function saveExerciseRecord(exerciseId, record) {
    await db.exercises.put({ id: exerciseId, ...record });
}

export async function loadExerciseRecord(exerciseId) {
    return await db.exercises.get(exerciseId);
}

export async function loadAllExerciseRecords() {
    const records = await db.exercises.toArray();
    const map = {};
    records.forEach(rec => {
        const { id, ...data } = rec;
        map[id] = data;
    });
    return map;
}

// ----- Saved current workout (for resume feature) -----
export async function saveCurrentWorkout(workout) {
    if (workout) {
        await db.savedWorkout.put({ id: 'current', value: workout });
    } else {
        await db.savedWorkout.delete('current');
    }
}

export async function loadCurrentWorkout() {
    const record = await db.savedWorkout.get('current');
    return record ? record.value : null;
}

// ----- Full export/import for backup -----
export async function exportAllData() {
    const workouts = await loadWorkouts();
    const exercises = await loadAllExerciseRecords();
    const userRecord = await db.user.get('main');
    const saved = await loadCurrentWorkout();
    return {
        version: '2.0',
        exportDate: new Date().toISOString(),
        user: userRecord ? userRecord.value : null,
        workouts,
        exercises,
        savedWorkout: saved
    };
}

export async function importAllData(data) {
    if (!data) return;
    // Clear existing
    await db.workouts.clear();
    await db.exercises.clear();
    await db.user.clear();
    await db.savedWorkout.clear();
    // Import
    if (data.user) await db.user.put({ key: 'main', value: data.user });
    if (data.workouts && data.workouts.length) await db.workouts.bulkPut(data.workouts);
    if (data.exercises) {
        const records = Object.entries(data.exercises).map(([id, value]) => ({ id, ...value }));
        await db.exercises.bulkPut(records);
    }
    if (data.savedWorkout) await db.savedWorkout.put({ id: 'current', value: data.savedWorkout });
}

// Initialize storage and perform migrations if needed
export async function initStorage() {
    // Ensure database is open
    await db.open();
    // Optional: migrate from localStorage if this is first run with Dexie
    const hasUser = await db.user.get('main');
    if (!hasUser) {
        const legacy = localStorage.getItem('pro_user');
        if (legacy) {
            try {
                const user = JSON.parse(legacy);
                await db.user.put({ key: 'main', value: user });
            } catch(e) {}
        }
    }
}