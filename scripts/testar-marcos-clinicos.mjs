import fs from 'node:fs';
import assert from 'node:assert/strict';
import {normalizarAtlas} from '../app/anatomia.ts';
import {criarIndiceAnatomico} from '../app/dominio/catalogo-anatomico.ts';
import {resolverFichasEstudoDetalhado} from '../app/dominio/estudo-detalhado.ts';
import {
  ESPECIFICACOES_MARCO_CLINICO,
  resolverDestaqueClinico,
} from '../app/dominio/marco-clinico-visual.ts';

const bruto = JSON.parse(
  fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'),
);
const atlas = normalizarAtlas(bruto);
const indice = criarIndiceAnatomico(atlas);
const fichas = resolverFichasEstudoDetalhado(indice).filter(
  (ficha) => ficha.tipo === 'marco-clinico',
);

assert.equal(
  Object.keys(ESPECIFICACOES_MARCO_CLINICO).length,
  fichas.length,
  'Cada marco clínico deve possuir uma especificação visual dedicada.',
);

for (const ficha of fichas) {
  const destaque = resolverDestaqueClinico(ficha, indice);
  assert.ok(destaque, `Marco sem destaque: ${ficha.titulo}`);
  assert.ok(destaque.partes.length > 0, `Marco sem peças-âncora: ${ficha.titulo}`);
  assert.ok(destaque.largura > 0 && destaque.altura > 0, `Marco com dimensões inválidas: ${ficha.titulo}`);
}

console.log(`Marcos clínicos validados: ${fichas.length} destaques visuais com âncoras anatômicas.`);
