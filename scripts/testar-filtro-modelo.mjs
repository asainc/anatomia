import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  SISTEMAS_VISIVEIS_PADRAO,
  normalizarAtlas,
  parteVisivelNoEstado,
} from '../app/anatomia.ts';
import {criarIndiceAnatomico} from '../app/dominio/catalogo-anatomico.ts';
import {resolverFichasEstudoDetalhado} from '../app/dominio/estudo-detalhado.ts';

const bruto = JSON.parse(
  fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'),
);
const atlas = normalizarAtlas(bruto);
const indice = criarIndiceAnatomico(atlas);
const fichas = resolverFichasEstudoDetalhado(indice);
const hesselbach = fichas.find((ficha) => ficha.id === 'triangulo-hesselbach');
assert.ok(hesselbach, 'Guia do Triângulo de Hesselbach não encontrado.');
assert.ok(hesselbach.conceitosRelacionados.length >= 2, 'Guia precisa de contexto visual.');

const principal = hesselbach.conceitosRelacionados[0];
const selecionados = principal.conceito.elementos;
const relacionados = [
  ...new Set(
    hesselbach.conceitosRelacionados
      .slice(1)
      .flatMap((item) => item.conceito.elementos),
  ),
];
assert.ok(selecionados.length > 0, 'Estrutura principal sem peças 3D.');
assert.ok(relacionados.length > 0, 'Guia sem peças relacionadas.');

const base = {
  explosao: 0,
  sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO,
  selecionados,
  relacionados,
  isolar: false,
  filtrarContexto: true,
  foco: 1,
  vista: 'tres-quartos',
  rotacionar: false,
  reinicio: 0,
};

const idsPermitidos = new Set([...selecionados, ...relacionados]);
const visiveisFiltrados = atlas.partes.filter((parte) => parteVisivelNoEstado(parte, base));
assert.ok(visiveisFiltrados.length > 1, 'Filtro contextual precisa exibir várias peças.');
assert.ok(
  visiveisFiltrados.every((parte) => idsPermitidos.has(parte.id)),
  'Filtro contextual deixou uma peça externa ao guia visível.',
);
assert.equal(
  visiveisFiltrados.length,
  atlas.partes.filter((parte) => idsPermitidos.has(parte.id)).length,
  'Filtro contextual não exibiu todas as peças relacionadas disponíveis.',
);

const isolado = {...base, isolar: true};
const visiveisIsolados = atlas.partes.filter((parte) => parteVisivelNoEstado(parte, isolado));
assert.ok(
  visiveisIsolados.every((parte) => selecionados.includes(parte.id)),
  'Isolamento deve ter precedência sobre o filtro contextual.',
);

const normal = {...base, filtrarContexto: false, relacionados: []};
const foraDoGuiaMasSistemaAtivo = atlas.partes.find(
  (parte) => !idsPermitidos.has(parte.id) && normal.sistemasVisiveis.includes(parte.sistema),
);
assert.ok(foraDoGuiaMasSistemaAtivo, 'Não foi encontrada peça de controle para o modo normal.');
assert.equal(
  parteVisivelNoEstado(foraDoGuiaMasSistemaAtivo, normal),
  true,
  'Ao restaurar a anatomia, os sistemas visíveis devem voltar a aparecer.',
);

console.log(
  `Filtro automático validado: ${visiveisFiltrados.length} peças do guia permanecem visíveis e as demais são ocultadas.`,
);
