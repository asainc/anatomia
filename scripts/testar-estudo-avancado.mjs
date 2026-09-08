import fs from 'node:fs';
import assert from 'node:assert/strict';
import {normalizarAtlas} from '../app/anatomia.ts';
import {criarIndiceAnatomico} from '../app/dominio/catalogo-anatomico.ts';
import {
  ROTAS_ESTUDO_AVANCADO,
  resolverRotasEstudoAvancado,
} from '../app/dominio/rotas-estudo-avancado.ts';

const bruto = JSON.parse(
  fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'),
);
const atlas = normalizarAtlas(bruto);
const indice = criarIndiceAnatomico(atlas);
const rotas = resolverRotasEstudoAvancado(indice);

assert.ok(ROTAS_ESTUDO_AVANCADO.length >= 50, 'A central avançada deve manter cobertura ampla.');

const ids = new Set();
let etapas = 0;
let associacoes = 0;
for (const rota of rotas) {
  assert.ok(!ids.has(rota.id), `ID duplicado: ${rota.id}`);
  ids.add(rota.id);
  assert.ok(rota.etapas.length >= 2, `Rota curta demais: ${rota.titulo}`);
  assert.ok(rota.totalConceitos > 0, `Rota sem associação 3D: ${rota.titulo}`);
  assert.ok(rota.pontosResidencia.length >= 1, `Rota sem ponto de prova: ${rota.titulo}`);

  etapas += rota.etapas.length;
  associacoes += rota.totalConceitos;
  for (const etapa of rota.etapas) {
    assert.ok(etapa.explicacao.length >= 5, `Etapa sem explicação: ${rota.titulo} / ${etapa.titulo}`);
    assert.ok(etapa.conceitos.length > 0, `Etapa sem âncora 3D: ${rota.titulo} / ${etapa.titulo}`);
  }
}

const areas = new Set(rotas.map((rota) => rota.area));
for (const obrigatoria of ['neuroanatomia', 'arterial', 'venoso', 'linfatico', 'nervos-perifericos', 'especialidades']) {
  assert.ok(areas.has(obrigatoria), `Área ausente: ${obrigatoria}`);
}

console.log(`Estudo avançado validado: ${rotas.length} rotas, ${etapas} etapas e ${associacoes} associações 3D.`);
