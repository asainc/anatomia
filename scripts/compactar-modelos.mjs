/** Gera versões gzip dos blocos binários para reduzir o download no navegador. */
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';

const diretorioModelos = new URL('../public/models/', import.meta.url);

for (const nomeArquivo of fs
  .readdirSync(diretorioModelos)
  .filter((nome) => nome === 'atlas.json')) {
  const caminho = new URL(nomeArquivo, diretorioModelos);
  const atlasOrigem = JSON.parse(fs.readFileSync(caminho));
  let totalBytesCompactados = 0;

  for (const bloco of atlasOrigem.chunks) {
    const arquivoOrigem = fs.readFileSync(
      new URL(bloco.url.split('/').pop(), diretorioModelos),
    );
    const compactado = gzipSync(arquivoOrigem, {level: 9});

    bloco.gzip = `${bloco.url}.gz`;
    bloco.gzipBytes = compactado.length;
    fs.writeFileSync(
      new URL(bloco.gzip.split('/').pop(), diretorioModelos),
      compactado,
    );
    totalBytesCompactados += compactado.length;
  }

  fs.writeFileSync(caminho, JSON.stringify(atlasOrigem));
  console.log(
    `${nomeArquivo}: ${(totalBytesCompactados / 1e6).toFixed(1)} MB no download compactado`,
  );
}
