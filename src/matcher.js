const fs = require('fs');

const baseLines = fs.readFileSync('text/base.txt', 'utf-8').trim().split('\n');
const errorNames = fs.readFileSync('text/error.txt', 'utf-8').trim().split('\n');

// Build a map from the first field to the full line
const baseMap = new Map();
for (const line of baseLines) {
    const key = line.split(':')[0].trim();
    if (key) baseMap.set(key, line.trim());
}

// Match error names against the map
const results = [];
for (const name of errorNames) {
    const trimmed = name.trim();
    if (baseMap.has(trimmed)) {
        results.push(baseMap.get(trimmed));
    }
}

fs.writeFileSync('MATCHED.txt', results.join('\n') + '\n');
console.log(`Done. ${results.length} match(es) written to MATCHED.txt.`);