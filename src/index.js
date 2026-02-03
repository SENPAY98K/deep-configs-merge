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
    console.log('Usage: node src/index.js <base.json> <override1.json> [override2.json ...] [options]');
    console.log('');
    console.log('Merges all override files into base and writes result to mergedOutput.json by default.');
    console.log('');
    console.log('Options:');
    console.log('  --output, -o <file>    Specify custom output file path (default: mergedOutput.json)');
    console.log('  --help, -h             Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node src/index.js base.json override1.json override2.json');
    console.log('  node src/index.js base.json override1.json -o custom.json');
    console.log('  node src/index.js base.json file1.json file2.json --output result.json');
}

function parseArgs(argv) {
    const args = argv.slice(2);
    const result = {
        baseFile: null,
        overrideFiles: [],
        outputFile: 'mergedOutput.json',
        showHelp: false
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        if (arg === '-h' || arg === '--help') {
            result.showHelp = true;
            return result;
        } else if (arg === '-o' || arg === '--output') {
            i++;
            if (i >= args.length) {
                throw new Error(`${arg} flag requires a file path`);
            }
            result.outputFile = args[i];
        } else {
            // First non-flag argument is the base file
            if (!result.baseFile) {
                result.baseFile = arg;
            } else {
                // Remaining non-flag arguments are override files
                result.overrideFiles.push(arg);
            }
        }
        i++;
    }

    return result;
}

async function main() {
    let parsedArgs;

    try {
        parsedArgs = parseArgs(process.argv);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        printUsage();
        process.exitCode = 2;
        return;
    }

    if (parsedArgs.showHelp || !parsedArgs.baseFile) {
        printUsage();
        return;
    }

    if (parsedArgs.overrideFiles.length === 0) {
        console.error('Error: at least one override file is required.');
        printUsage();
        process.exitCode = 2;
        return;
    }

    const basePath = path.resolve(parsedArgs.baseFile);
    const overridePaths = parsedArgs.overrideFiles.map(p => path.resolve(p));
    const outputPath = path.resolve(parsedArgs.outputFile);

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