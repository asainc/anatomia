/**
 * Diferencia um toque/clique intencional de gestos de órbita, zoom, arraste
 * ou de uma sequência multitoque cancelada.
 */
export class DetectorToquePonteiro {
  private ponteirosAtivos = new Map<
    number,
    {x: number; y: number; limiteMovimento: number}
  >();

  private bloqueado = false;

  iniciar(
    idPonteiro: number,
    x: number,
    y: number,
    limiteMovimento: number,
  ) {
    if (this.ponteirosAtivos.size === 0) {
      this.bloqueado = false;
    }

    this.ponteirosAtivos.set(idPonteiro, {x, y, limiteMovimento});

    // Mais de um ponteiro indica gesto multitoque, não seleção de estrutura.
    if (this.ponteirosAtivos.size > 1) {
      this.bloqueado = true;
    }
  }

  mover(idPonteiro: number, x: number, y: number) {
    const inicio = this.ponteirosAtivos.get(idPonteiro);
    if (
      inicio &&
      Math.hypot(x - inicio.x, y - inicio.y) > inicio.limiteMovimento
    ) {
      this.bloqueado = true;
    }
  }

  finalizar(idPonteiro: number, x: number, y: number) {
    this.mover(idPonteiro, x, y);

    const foiToque =
      this.ponteirosAtivos.has(idPonteiro) &&
      this.ponteirosAtivos.size === 1 &&
      !this.bloqueado;

    this.ponteirosAtivos.delete(idPonteiro);
    return foiToque;
  }

  cancelar(idPonteiro: number) {
    this.ponteirosAtivos.delete(idPonteiro);
    this.bloqueado = true;
  }
}
