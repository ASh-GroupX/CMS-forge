const script = process.argv[2] ?? 'proof';

console.error(`${script} is declared for the SRS proof contract but is not implemented in F0-01.`);
process.exit(1);
