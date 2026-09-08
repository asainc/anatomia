import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const trio = ['react', 'react-dom', 'react-server-dom-webpack'];
const versoes = Object.fromEntries(trio.map((nome) => [nome, pkg.dependencies?.[nome]]));

for (const [nome, versao] of Object.entries(versoes)) {
  if (!/^\d+\.\d+\.\d+$/.test(versao ?? '')) {
    throw new Error(`${nome} deve usar versão exata, sem ^ ou ~. Valor atual: ${versao}`);
  }
}
const unicas = new Set(Object.values(versoes));
if (unicas.size !== 1) {
  throw new Error(`React/RSC incompatíveis: ${JSON.stringify(versoes)}`);
}
const raizLock = lock.packages?.['']?.dependencies ?? {};
for (const nome of trio) {
  if (raizLock[nome] !== versoes[nome]) {
    throw new Error(`${nome}: package.json=${versoes[nome]} mas package-lock.json=${raizLock[nome]}`);
  }
}
console.log(`Dependências React/RSC alinhadas em ${[...unicas][0]}.`);
