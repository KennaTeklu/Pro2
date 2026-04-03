// js/core/units.js
export const UNIT = {
    lbs: 'lbs',
    kg: 'kg'
};

let _currentUnit = UNIT.kg; // default

export function setUnit(unit) {
    if (unit === UNIT.lbs || unit === UNIT.kg) {
        _currentUnit = unit;
        localStorage.setItem('pro_unit', unit);
    }
}

export function getUnit() {
    const stored = localStorage.getItem('pro_unit');
    if (stored === UNIT.lbs || stored === UNIT.kg) {
        _currentUnit = stored;
    }
    return _currentUnit;
}

// Convert weight between kg and lbs
export function convertWeight(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === UNIT.lbs && toUnit === UNIT.kg) return value * 0.45359237;
    if (fromUnit === UNIT.kg && toUnit === UNIT.lbs) return value / 0.45359237;
    return value;
}

// Round weight to nearest standard increment
// lbs: 2.5 lb increments, kg: 1.25 kg increments (or 2.5 kg for simplicity)
export function roundWeight(value, unit = null) {
    const u = unit || getUnit();
    let increment;
    if (u === UNIT.lbs) increment = 2.5;
    else increment = 1.25; // kg
    return Math.round(value / increment) * increment;
}

// Format weight with unit for display
export function formatWeight(value, unit = null, decimals = 1) {
    const u = unit || getUnit();
    const rounded = roundWeight(value, u);
    return `${rounded.toFixed(decimals)} ${u}`;
}

// Convert an entire 1RM object to current unit
export function normalizeOneRM(entry) {
    if (!entry) return null;
    const current = getUnit();
    if (entry.unit === current) return entry;
    const convertedWeight = convertWeight(entry.weight, entry.unit, current);
    return {
        weight: roundWeight(convertedWeight, current),
        reps: entry.reps,
        unit: current,
        date: entry.date
    };
}