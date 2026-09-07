/**
 * Validação estrutural do manifesto e dos buffers binários do BodyParts3D.
 *
 * Este script trabalha diretamente com o contrato externo de `atlas.json`.
 * Por isso, propriedades como `parts`, `concepts` e `chunks` permanecem com os
 * nomes definidos pelo arquivo de origem, enquanto as variáveis do código usam
 * português.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const nomeArquivo = process.argv[2] ?? 'atlas.json';
const diretorioModelos = new URL('../public/models/', import.meta.url);
const atlasOrigem = JSON.parse(
  fs.readFileSync(new URL(nomeArquivo, diretorioModelos)),
);

// Quantidades esperadas da versão atual empacotada no projeto.
assert.equal(atlasOrigem.parts.length, 2234);
assert.equal(atlasOrigem.concepts.length, 3432);

const ids = new Set(atlasOrigem.parts.map((parte) => parte.id));
assert.equal(ids.size, 2234);

const arquivosBinarios = atlasOrigem.chunks.map((bloco) => {
  const conteudo = fs.readFileSync(
    new URL(bloco.url.split('/').pop(), diretorioModelos),
  );
  assert.equal(conteudo.length, bloco.bytes);
  return conteudo;
});

let triangulosCalculados = 0;

for (const parte of atlasOrigem.parts) {
  assert.ok(
    parte.name.trim() &&
      parte.name !== '-' &&
      !parte.name.includes('Bounds('),
  );
  assert.ok(parte.conceptId !== '-');
  assert.ok(parte.system);

  const buffer = arquivosBinarios[parte.chunk];
  assert.ok(parte.indices + parte.indexCount * 4 <= buffer.length);

  const posicoes = new Float32Array(
    buffer.buffer,
    buffer.byteOffset + parte.positions,
    parte.vertexCount * 3,
  );
  const indices = new Uint32Array(
    buffer.buffer,
    buffer.byteOffset + parte.indices,
    parte.indexCount,
  );

  assert.ok(indices.length >= 3);
  for (const indice of indices) {
    assert.ok(indice < parte.vertexCount, `${parte.id}: vértice inválido`);
  }
  for (const valor of posicoes) {
    assert.ok(Number.isFinite(valor));
  }

  triangulosCalculados += parte.indexCount / 3;
}

for (const conceito of atlasOrigem.concepts) {
  assert.ok(conceito.elements.length);
  for (const id of conceito.elements) {
    assert.ok(ids.has(id), `${conceito.id}: elemento ausente ${id}`);
  }
}

assert.equal(triangulosCalculados, atlasOrigem.triangles);
console.log(
  `Validação concluída: ${ids.size} malhas indexadas, ${atlasOrigem.concepts.length} conceitos completos, ${triangulosCalculados.toLocaleString('pt-BR')} triângulos e todos os buffers binários íntegros.`,
);
