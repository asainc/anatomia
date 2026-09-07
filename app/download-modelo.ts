/**
 * Hosts estáticos podem entregar um arquivo `.gz` já descompactado pelo
 * `Content-Encoding` ou ainda como um payload gzip bruto. A assinatura dos
 * primeiros bytes é verificada para evitar descompactar o mesmo conteúdo duas
 * vezes.
 */
export async function decodificarRespostaModelo(
  resposta: Response,
  bytesEsperados: number,
  compactado: boolean,
): Promise<ArrayBuffer> {
  if (!resposta.ok) {
    throw new Error('Não foi possível carregar um arquivo do modelo anatômico.');
  }

  const conteudo = await resposta.arrayBuffer();
  const assinatura = new Uint8Array(
    conteudo,
    0,
    Math.min(2, conteudo.byteLength),
  );
  const possuiGzip =
    compactado && assinatura[0] === 0x1f && assinatura[1] === 0x8b;

  const buffer = possuiGzip
    ? await new Response(
        new Blob([conteudo]).stream().pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer()
    : conteudo;

  if (buffer.byteLength !== bytesEsperados) {
    throw new Error(
      'Um arquivo do modelo anatômico foi recebido de forma incompleta. Recarregue o visualizador.',
    );
  }

  return buffer;
}
