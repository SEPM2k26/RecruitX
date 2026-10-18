const fs = require('fs');

const envPath = '.env';
let content = fs.readFileSync(envPath, 'utf8');

const lines = content.split('\n');
const updatedLines = lines.map((line) => {
  if (line.startsWith('DATABASE_URL=')) {
    if (!line.includes('sslmode=require')) {
      line = line.replace('?pgbouncer=true"', '?pgbouncer=true&sslmode=require&options=--search_path%3Drecruitx"');
    }
  }
  if (line.startsWith('DIRECT_URL=')) {
    if (!line.includes('sslmode=require')) {
      line = line.replace('/postgres"', '/postgres?sslmode=require&options=--search_path%3Drecruitx"');
    }
  }
  return line;
});

fs.writeFileSync(envPath, updatedLines.join('\n'));
console.log('.env updated.');
console.log('DATABASE_URL has sslmode:', updatedLines.some((l) => l.startsWith('DATABASE_URL=') && l.includes('sslmode=require')));
console.log('DIRECT_URL has sslmode:', updatedLines.some((l) => l.startsWith('DIRECT_URL=') && l.includes('sslmode=require')));
console.log('DATABASE_URL has search_path:', updatedLines.some((l) => l.startsWith('DATABASE_URL=') && l.includes('search_path')));
console.log('DIRECT_URL has search_path:', updatedLines.some((l) => l.startsWith('DIRECT_URL=') && l.includes('search_path')));