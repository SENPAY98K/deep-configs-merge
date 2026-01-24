const fs = require('fs').promises;
const path = require('path');

function isPlainObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * Deeply merges two objects, with values from overrideObj replacing those in baseObj.
 * Arrays and non-plain objects are replaced (not merged).
 * @param {Object} baseObj
 * @param {Object} overrideObj
 * @returns {Object}
 */
function deepMerge(baseObj = {}, overrideObj = {}) {
    const result = { ...baseObj };

    Object.keys(overrideObj).forEach((key) => {
        const overrideVal = overrideObj[key];
        const baseVal = baseObj[key];

        if (isPlainObject(overrideVal) && isPlainObject(baseVal)) {
            result[key] = deepMerge(baseVal, overrideVal);
        } else {
            result[key] = overrideVal;
        }
    });

    return result;
}

/**
 * Merge a base JSON file with one or more override JSON files.
 * Writes the merged result to mergedOutput.json by default (can be overridden via options.outputPath).
 *
 * @param {string} baseConfigPath
 * @param {string|string[]} overrideConfigPaths - single path or array of paths
 * @param {Object} [options] - { write: boolean (default true), outputPath: string (default mergedOutput.json) }
 * @returns {Promise<Object>}
 */
async function mergeConfigs(baseConfigPath, overrideConfigPaths, options = {}) {
    const write = options.write !== undefined ? options.write : true;
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

        // Apply overrides sequentially (later overrides take precedence)
        for (const overridePath of overrides) {
            const overrideRaw = await fs.readFile(overridePath, 'utf8');
            let overrideConfig;
            try {
                overrideConfig = JSON.parse(overrideRaw);
            } catch (err) {
                throw new Error(`Invalid JSON in override config (${overridePath}): ${err.message}`);
            }
            merged = deepMerge(merged, overrideConfig);
        }

        if (write && outputPath) {
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, JSON.stringify(merged, null, 2), 'utf8');
        }

        return merged;
    } catch (err) {
        throw new Error(`mergeConfigs failed: ${err.message}`);
    }
}

module.exports = { mergeConfigs, deepMerge };