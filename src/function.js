const fs = require('fs').promises;
const path = require('path');

/**
 * Check if value is a plain object (not array, null, or other special objects)
 */
function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * Count total keys in an object (including nested)
 * @param {Object} obj - Object to count keys from
 * @returns {number} Total number of keys
 */
function countKeys(obj) {
    let count = 0;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            count++;
            if (isPlainObject(obj[key])) {
                count += countKeys(obj[key]);
            }
        }
    }
    return count;
}

/**
 * Deeply compares two values for equality
 * @param {*} val1
 * @param {*} val2
 * @returns {boolean}
 */
function deepEqual(val1, val2) {
    if (val1 === val2) return true;

    if (val1 === null || val2 === null) return false;
    if (typeof val1 !== typeof val2) return false;

    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        return val1.every((item, idx) => deepEqual(item, val2[idx]));
    }

    if (isPlainObject(val1) && isPlainObject(val2)) {
        const keys1 = Object.keys(val1);
        const keys2 = Object.keys(val2);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => deepEqual(val1[key], val2[key]));
    }

    return false;
}

/**
 * Deeply merges two objects, with values from overrideObj replacing those in baseObj.
 * Arrays and non-plain objects are replaced (not merged).
 * Only counts properties that actually changed.
 * @param {Object} baseObj
 * @param {Object} overrideObj
 * @returns {Object} Object with merged result and merge count
 */
function deepMerge(baseObj = {}, overrideObj = {}) {
    const result = { ...baseObj };
    let mergeCount = 0;

    Object.keys(overrideObj).forEach((key) => {
        const overrideVal = overrideObj[key];
        const baseVal = baseObj[key];

        if (isPlainObject(overrideVal) && isPlainObject(baseVal)) {
            const nested = deepMerge(baseVal, overrideVal);
            result[key] = nested.result;
            mergeCount += nested.mergeCount;
        } else {
            // Only count if the value actually changed
            if (!deepEqual(baseVal, overrideVal)) {
                mergeCount++;
            }
            result[key] = overrideVal;
        }
    });

    return { result, mergeCount };
}

/**
 * Merge a base JSON file with one or more override JSON files.
 * Writes the merged result to mergedOutput.json by default (can be overridden via options.outputPath).
 *
 * @param {string} baseConfigPath
 * @param {string|string[]} overrideConfigPaths - single path or array of paths
 * @param {Object} [options] - { write: boolean (default true), outputPath: string (default mergedOutput.json), showStats: boolean (default true) }
 * @returns {Promise<Object>}
 */
async function mergeConfigs(baseConfigPath, overrideConfigPaths, options = {}) {
    const write = options.write !== undefined ? options.write : true;
    const showStats = options.showStats !== undefined ? options.showStats : true;
    const outputPath = options.outputPath ? path.resolve(options.outputPath) : path.resolve('mergedOutput.json');

    if (!baseConfigPath) {
        throw new Error('baseConfigPath is required');
    }

    const overrides = Array.isArray(overrideConfigPaths)
        ? overrideConfigPaths
        : (overrideConfigPaths ? [overrideConfigPaths] : []);

    if (overrides.length === 0) {
        throw new Error('At least one overrideConfigPath is required');
    }

    try {
        // Read base config
        const baseRaw = await fs.readFile(baseConfigPath, 'utf8');
        let merged;
        try {
            merged = JSON.parse(baseRaw);
        } catch (err) {
            throw new Error(`Invalid JSON in base config (${baseConfigPath}): ${err.message}`);
        }

        const totalBaseKeys = countKeys(merged);
        const mergeStats = [];
        let totalMerged = 0;

        // Apply overrides sequentially (later overrides take precedence)
        for (const overridePath of overrides) {
            const overrideRaw = await fs.readFile(overridePath, 'utf8');
            let overrideConfig;
            try {
                overrideConfig = JSON.parse(overrideRaw);
            } catch (err) {
                throw new Error(`Invalid JSON in override config (${overridePath}): ${err.message}`);
            }

            const mergeResult = deepMerge(merged, overrideConfig);
            merged = mergeResult.result;

            mergeStats.push({
                file: path.basename(overridePath),
                merged: mergeResult.mergeCount
            });
            totalMerged += mergeResult.mergeCount;
        }

        if (write && outputPath) {
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, JSON.stringify(merged, null, 2), 'utf8');
        }

        // Display statistics if enabled
        if (showStats) {
            console.log('\n' + '='.repeat(50));
            console.log('MERGE STATISTICS');
            console.log('='.repeat(50));
            console.log(`\nBase file: ${path.basename(baseConfigPath)}`);
            console.log(`  Total keys: ${totalBaseKeys}`);
            console.log(`\nOverride files:`);
            mergeStats.forEach(stat => {
                console.log(`  ${stat.file}: ${stat.merged} properties merged`);
            });
            console.log(`\nTotal properties merged: ${totalMerged}`);
            console.log(`Properties unchanged from base: ${totalBaseKeys - totalMerged}`);
            console.log('='.repeat(50) + '\n');
        }

        return merged;
    } catch (err) {
        throw new Error(`mergeConfigs failed: ${err.message}`);
    }
}

module.exports = { mergeConfigs, deepMerge };