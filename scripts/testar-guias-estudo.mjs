import fs from 'node:fs';
import assert from 'node:assert/strict';
import {normalizarAtlas} from '../app/anatomia.ts';
import {criarIndiceAnatomico} from '../app/dominio/catalogo-anatomico.ts';
import {
  FICHAS_ESTUDO_DETALHADO,
  resolverFichasEstudoDetalhado,
} from '../app/dominio/estudo-detalhado.ts';

const bruto = JSON.parse(
  fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'),
);
const atlas = normalizarAtlas(bruto);
const indice = criarIndiceAnatomico(atlas);
const fichas = resolverFichasEstudoDetalhado(indice);

assert.ok(
  FICHAS_ESTUDO_DETALHADO.length >= 50,
  `Cobertura insuficiente de guias anatômicos: ${FICHAS_ESTUDO_DETALHADO.length}`,
);

const ids = new Set();
for (const ficha of fichas) {
  assert.ok(!ids.has(ficha.id), `ID duplicado de guia: ${ficha.id}`);
  ids.add(ficha.id);

  assert.ok(ficha.titulo.length > 5, `Título inválido em ${ficha.id}`);
  assert.ok(
    ficha.conceitosRelacionados.length > 0,
    `Guia sem conceitos relacionados: ${ficha.titulo}`,
  );
  assert.ok(
    ficha.conceitosRelacionados.length <= 16,
    `Guia excedeu o limite de conceitos relacionados: ${ficha.titulo}`,
  );
  assert.ok(
    ficha.pontosResidencia.length >= 1,
    `Guia sem pontos de residência: ${ficha.titulo}`,
  );
}

console.log(
  `Guias anatômicos validados: ${fichas.length} roteiros com conceitos relacionados e cobertura ampla para estudo de prova.`,
);
