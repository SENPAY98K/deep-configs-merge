const path = require('path');
const fs = require('fs').promises;
const { mergeConfigs } = require('./function');

async function fileExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

function printUsage() {
    console.log('Usage: node src/index.js <base.json> <override1.json> [override2.json ...]');
    console.log('Merges all override files into base and writes result to mergedOutput.json by default.');
    console.log('Options: --help, -h');
}

async function main() {
    const [, , baseArg, ...overrideArgs] = process.argv;

    if (process.argv.includes('-h') || process.argv.includes('--help') || !baseArg) {
        printUsage();
        return;
    }

    if (overrideArgs.length === 0) {
        console.error('Error: at least one override file is required.');
        printUsage();
        process.exitCode = 2;
        return;
    }

    const basePath = path.resolve(baseArg);
    const overridePaths = overrideArgs.map(p => path.resolve(p));
    const outputPath = path.resolve('mergedOutput.json');

    if (!await fileExists(basePath)) {
        console.error(`Base config not found: ${basePath}`);
        process.exitCode = 2;
        return;
    }

    const missing = [];
    for (const p of overridePaths) {
        if (!await fileExists(p)) missing.push(p);
    }
    if (missing.length > 0) {
        console.error(`Override config(s) not found:\n  ${missing.join('\n  ')}`);
        process.exitCode = 2;
        return;
    }

    try {
        const merged = await mergeConfigs(basePath, overridePaths, { write: true, outputPath });
        console.log(`✓ Configs merged successfully -> ${outputPath}`);
    } catch (err) {
        console.error(err.message || err);
        process.exitCode = 1;
    }
}

main();