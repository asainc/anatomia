/** Valida layout explodido, busca/inspeção e detecção de toque. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizarAtlas} from '../app/anatomia.ts';
import {criarLayoutExplosao} from '../app/layout-explosao.ts';
import {DetectorToquePonteiro} from '../app/toque-ponteiro.ts';
import {criarFerramentasAtlas} from '../app/ferramentas-agente.ts';

for (const arquivo of ['atlas.json']) {
  const dadosOrigem = JSON.parse(
    await readFile(new URL(`../public/models/${arquivo}`, import.meta.url)),
  );
  const atlas = normalizarAtlas(dadosOrigem);

  const grupos = [
    atlas.partes,
    ...[...new Set(atlas.partes.map((parte) => parte.sistema))].map(
      (sistema) => atlas.partes.filter((parte) => parte.sistema === sistema),
    ),
  ];

  // Verifica se as peças não se sobrepõem em proporções de desktop e celular.
  for (const grupo of grupos) {
    for (const proporcao of [0.46, 1, 1.7]) {
      const layout = criarLayoutExplosao(grupo, proporcao);
      const celulas = [...layout.celulas.values()];
      assert.equal(celulas.length, grupo.length);

      for (let i = 0; i < celulas.length; i += 1) {
        const atual = celulas[i];
        assert.ok(
          Math.abs(atual.x) + atual.largura / 2 <= layout.largura / 2 + 1e-8,
        );
        assert.ok(
          Math.abs(atual.y) + atual.altura / 2 <= layout.altura / 2 + 1e-8,
        );

        for (let j = i + 1; j < celulas.length; j += 1) {
          const outra = celulas[j];
          assert.ok(
            Math.abs(atual.x - outra.x) >=
                (atual.largura + outra.largura) / 2 - 1e-8 ||
              Math.abs(atual.y - outra.y) >=
                (atual.altura + outra.altura) / 2 - 1e-8,
            'As peças explodidas não podem se sobrepor.',
          );
        }
      }
    }
  }

  let selecionado = null;
  const [buscar, inspecionar] = criarFerramentasAtlas(atlas, (conceito) => {
    selecionado = conceito;
  });

  const resultados = buscar.execute({consulta: 'fêmur'});
  assert.ok(resultados.length > 0);
  inspecionar.execute({id: resultados[0].id});

  const selecaoAnterior = selecionado;
  assert.throws(() => inspecionar.execute({id: 'estrutura-inexistente'}));
  assert.equal(selecionado, selecaoAnterior);
  assert.throws(() => buscar.execute({consulta: ' '}));

  console.log(
    `${arquivo}: layout em proporções desktop/móvel e contratos de busca/inspeção aprovados.`,
  );
}

const detector = new DetectorToquePonteiro();
detector.iniciar(1, 10, 10, 5);
assert.equal(detector.finalizar(1, 12, 11), true);

detector.iniciar(1, 10, 10, 5);
detector.mover(1, 40, 10);
assert.equal(detector.finalizar(1, 10, 10), false);

detector.iniciar(1, 10, 10, 12);
detector.iniciar(2, 20, 20, 12);
assert.equal(detector.finalizar(2, 20, 20), false);
assert.equal(detector.finalizar(1, 10, 10), false);

detector.iniciar(1, 10, 10, 5);
detector.cancelar(1);
assert.equal(detector.finalizar(1, 10, 10), false);

detector.iniciar(1, 10, 10, 5);
assert.equal(detector.finalizar(1, 10, 10), true);
assert.equal(criarLayoutExplosao([]).celulas.size, 0);

console.log(
  'Validações de toque, arraste, multitoque, cancelamento e visualização vazia aprovadas.',
);
