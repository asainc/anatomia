/**
 * Simplifica cada malha anatômica com `meshoptimizer` e reempacota os buffers.
 * O erro geométrico relativo máximo permanece limitado a 0,2% por estrutura.
 */
import fs from 'node:fs';
import {MeshoptSimplifier} from 'meshoptimizer';

await MeshoptSimplifier.ready;

const nomeArquivo = process.argv[2] ?? 'atlas.json';
const prefixo = nomeArquivo.includes('female') ? 'female' : 'body';
const diretorio = new URL('../public/models/', import.meta.url);
const manifesto = JSON.parse(
  fs.readFileSync(new URL(nomeArquivo, diretorio), 'utf8'),
);
const arquivosOriginais = manifesto.chunks.map((bloco) =>
  bloco.url.split('/').pop(),
);

if (manifesto.optimized) {
  throw new Error(
    'O modelo já foi otimizado. Execute novamente o conversor da fonte antes de otimizar.',
  );
}

const blocosOrigem = manifesto.chunks.map((bloco) =>
  fs.readFileSync(new URL(bloco.url.split('/').pop(), diretorio)),
);

let blocos = [];
let segmentos = [];
let bytesAtuais = 0;
let triangulos = 0;
let maiorErro = 0;

/** Fecha o bloco corrente quando ele atinge o tamanho-alvo. */
const finalizarBloco = () => {
  if (!bytesAtuais) {
    return;
  }

  const url = `/models/${prefixo}-${blocos.length}.bin`;
  fs.writeFileSync(
    new URL(url.split('/').pop(), diretorio),
    Buffer.concat(segmentos),
  );
  blocos.push({url, bytes: bytesAtuais});
  segmentos = [];
  bytesAtuais = 0;
};

/** Adiciona um array tipado garantindo alinhamento de 4 bytes. */
const adicionar = (arrayTipado) => {
  const preenchimento = (4 - (bytesAtuais % 4)) % 4;
  if (preenchimento) {
    segmentos.push(Buffer.alloc(preenchimento));
    bytesAtuais += preenchimento;
  }

  const deslocamento = bytesAtuais;
  const buffer = Buffer.from(
    arrayTipado.buffer,
    arrayTipado.byteOffset,
    arrayTipado.byteLength,
  );
  segmentos.push(buffer);
  bytesAtuais += buffer.length;
  return deslocamento;
};

for (const parte of manifesto.parts) {
  const bloco = blocosOrigem[parte.chunk];
  let posicoes = new Float32Array(
    bloco.buffer,
    bloco.byteOffset + parte.positions,
    parte.vertexCount * 3,
  );
  let normais = new Int16Array(
    bloco.buffer,
    bloco.byteOffset + parte.normals,
    parte.vertexCount * 3,
  );
  let indices = new Uint32Array(
    bloco.buffer,
    bloco.byteOffset + parte.indices,
    parte.indexCount,
  );

  if (prefixo === 'female') {
    // Exportações HRA podem duplicar vértices em fronteiras de triângulos.
    // A soldagem por posição ocorre antes da simplificação e as normais são médias.
    const mapaVertices = new Map();
    const remapeamento = new Uint32Array(parte.vertexCount);
    const posicoesSoldadas = [];
    const normaisSomadas = [];

    for (let i = 0; i < parte.vertexCount; i += 1) {
      const chave = `${posicoes[i * 3]},${posicoes[i * 3 + 1]},${posicoes[i * 3 + 2]}`;
      let indiceSoldado = mapaVertices.get(chave);

      if (indiceSoldado === undefined) {
        indiceSoldado = posicoesSoldadas.length / 3;
        mapaVertices.set(chave, indiceSoldado);
        posicoesSoldadas.push(
          posicoes[i * 3],
          posicoes[i * 3 + 1],
          posicoes[i * 3 + 2],
        );
        normaisSomadas.push(0, 0, 0);
      }

      remapeamento[i] = indiceSoldado;
      for (let eixo = 0; eixo < 3; eixo += 1) {
        normaisSomadas[indiceSoldado * 3 + eixo] += normais[i * 3 + eixo];
      }
    }

    for (let i = 0; i < normaisSomadas.length; i += 3) {
      const comprimento =
        Math.hypot(
          normaisSomadas[i],
          normaisSomadas[i + 1],
          normaisSomadas[i + 2],
        ) || 1;
      for (let eixo = 0; eixo < 3; eixo += 1) {
        normaisSomadas[i + eixo] = Math.round(
          (normaisSomadas[i + eixo] / comprimento) * 32767,
        );
      }
    }

    posicoes = new Float32Array(posicoesSoldadas);
    normais = new Int16Array(normaisSomadas);
    indices = Uint32Array.from(indices, (indice) => remapeamento[indice]);
  }

  // Preserva todas as malhas nomeadas e limita o erro a 0,2% da extensão da peça.
  const alvo = Math.max(96, Math.floor((parte.indexCount * 0.22) / 3) * 3);
  const [indicesSimplificados, erro] = MeshoptSimplifier.simplify(
    indices,
    posicoes,
    3,
    Math.min(indices.length, alvo),
    0.002,
  );
  maiorErro = Math.max(maiorErro, erro);

  const [remapeamento, quantidadeVertices] =
    MeshoptSimplifier.compactMesh(indicesSimplificados);
  const novasPosicoes = new Float32Array(quantidadeVertices * 3);
  const novasNormais = new Int16Array(quantidadeVertices * 3);

  for (let indiceAntigo = 0; indiceAntigo < remapeamento.length; indiceAntigo += 1) {
    const indiceNovo = remapeamento[indiceAntigo];
    if (indiceNovo === 0xffffffff) {
      continue;
    }

    novasPosicoes.set(
      posicoes.subarray(indiceAntigo * 3, indiceAntigo * 3 + 3),
      indiceNovo * 3,
    );
    novasNormais.set(
      normais.subarray(indiceAntigo * 3, indiceAntigo * 3 + 3),
      indiceNovo * 3,
    );
  }

  if (bytesAtuais > 4_000_000) {
    finalizarBloco();
  }

  parte.chunk = blocos.length;
  parte.positions = adicionar(novasPosicoes);
  parte.normals = adicionar(novasNormais);
  parte.indices = adicionar(indicesSimplificados);
  parte.vertexCount = quantidadeVertices;
  parte.indexCount = indicesSimplificados.length;
  triangulos += indicesSimplificados.length / 3;
}

finalizarBloco();
manifesto.sourceTriangles = manifesto.triangles;
manifesto.triangles = triangulos;
manifesto.chunks = blocos;
manifesto.optimized = {
  method: 'meshoptimizer quadric simplification',
  maximumRelativeError: 0.002,
  preservedMeshes: manifesto.parts.length,
};
fs.writeFileSync(new URL(nomeArquivo, diretorio), JSON.stringify(manifesto));

// Remove somente os arquivos do conversor substituídos pelos blocos otimizados.
for (const arquivo of arquivosOriginais) {
  fs.unlinkSync(new URL(arquivo, diretorio));
}

console.log(
  JSON.stringify({
    partes: manifesto.parts.length,
    triangulos,
    bytes: blocos.reduce((total, bloco) => total + bloco.bytes, 0),
    blocos: blocos.length,
    maiorErro,
  }),
);
