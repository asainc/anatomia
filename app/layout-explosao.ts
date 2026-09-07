import type {Parte} from './anatomia.ts';

export interface CelulaLayout {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/**
 * Distribui somente as estruturas visíveis em uma grade sem sobreposição.
 *
 * Cada estrutura usa sua caixa delimitadora projetada como referência. Isso
 * permite que o modo "explodido" apresente as peças separadamente sem que uma
 * estrutura cubra visualmente outra.
 */
export function criarLayoutExplosao(partes: Parte[], proporcaoTela = 1) {
  const cartoes = partes.map((parte) => ({
    id: parte.id,
    sistema: parte.sistema,
    largura: Math.max(0.035, parte.limites[1][0] - parte.limites[0][0]) + 0.04,
    altura: Math.max(0.035, parte.limites[1][1] - parte.limites[0][1]) + 0.04,
  }));

  const areaTotal = cartoes.reduce(
    (acumulado, cartao) => acumulado + cartao.largura * cartao.altura,
    0,
  );
  const maiorLargura = Math.max(0.3, ...cartoes.map((cartao) => cartao.largura));
  const larguraAlvo = Math.max(
    maiorLargura,
    Math.sqrt(areaTotal * Math.max(0.5, Math.min(1.5, proporcaoTela))) * 1.18,
  );

  // Ordenar por altura reduz a chance de sobrar grandes espaços entre linhas.
  cartoes.sort(
    (a, b) => b.altura - a.altura || a.id.localeCompare(b.id),
  );

  const celulas = new Map<string, CelulaLayout>();
  let x = 0;
  let y = 0;
  let alturaLinha = 0;
  let larguraUsada = 0;

  for (const cartao of cartoes) {
    if (x > 0 && x + cartao.largura > larguraAlvo) {
      x = 0;
      y += alturaLinha;
      alturaLinha = 0;
    }

    celulas.set(cartao.id, {
      x: x + cartao.largura / 2,
      y: -y - cartao.altura / 2,
      largura: cartao.largura,
      altura: cartao.altura,
    });

    x += cartao.largura;
    larguraUsada = Math.max(larguraUsada, x);
    alturaLinha = Math.max(alturaLinha, cartao.altura);
  }

  const alturaUsada = y + alturaLinha;

  // Centraliza a grade no espaço da cena 3D.
  celulas.forEach((celula) => {
    celula.x -= larguraUsada / 2;
    celula.y += alturaUsada / 2;
  });

  return {celulas, largura: larguraUsada, altura: alturaUsada};
}
