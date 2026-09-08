/**
 * Validador do manifesto carregado pelo navegador.
 *
 * É deliberadamente livre de dependências externas: depois do conflito de
 * versões React/RSC, a V2 evita introduzir bibliotecas para uma validação que
 * pode ser feita de forma determinística com TypeScript puro.
 */
export interface ManifestoAtlasValidado {
  schemaVersion: string;
  version: string;
  locale?: string;
  sourceLocale?: string;
  sex?: string;
  source?: string;
  scope?: string;
  parts: Array<{
    id: string;
    name: string;
    nameEn?: string;
    conceptId: string;
    system: string;
    chunk: number;
    positions: number;
    normals: number;
    indices: number;
    vertexCount: number;
    indexCount: number;
    bounds: [[number, number, number], [number, number, number]];
  }>;
  concepts: Array<{
    id: string;
    name: string;
    nameEn?: string;
    elements: string[];
  }>;
  chunks: Array<{
    url: string;
    bytes: number;
    gzip?: string;
    gzipBytes?: number;
  }>;
  triangles: number;
  [chave: string]: unknown;
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function numeroInteiro(valor: unknown, positivo = false): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    Number.isFinite(valor) &&
    (positivo ? valor > 0 : valor >= 0)
  );
}

function vetor3(valor: unknown): valor is [number, number, number] {
  return (
    Array.isArray(valor) &&
    valor.length === 3 &&
    valor.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function falhar(caminho: string, mensagem: string): never {
  throw new Error(
    `O catálogo anatômico é incompatível com esta versão do atlas (${caminho}: ${mensagem}).`,
  );
}

/**
 * Verifica o contrato mínimo e retorna o mesmo objeto com tipo refinado.
 * Campos adicionais são aceitos para permitir evolução retrocompatível.
 */
export function validarManifestoAtlas(dados: unknown): ManifestoAtlasValidado {
  if (!objeto(dados)) falhar('raiz', 'objeto esperado');
  if (!texto(dados.version)) falhar('version', 'texto obrigatório');
  if (!Array.isArray(dados.parts) || !dados.parts.length) falhar('parts', 'lista não vazia esperada');
  if (!Array.isArray(dados.concepts) || !dados.concepts.length) falhar('concepts', 'lista não vazia esperada');
  if (!Array.isArray(dados.chunks) || !dados.chunks.length) falhar('chunks', 'lista não vazia esperada');
  if (!numeroInteiro(dados.triangles)) falhar('triangles', 'inteiro não negativo esperado');

  dados.parts.forEach((parte, indice) => {
    const caminho = `parts.${indice}`;
    if (!objeto(parte)) falhar(caminho, 'objeto esperado');
    for (const campo of ['id', 'name', 'conceptId', 'system'] as const) {
      if (!texto(parte[campo])) falhar(`${caminho}.${campo}`, 'texto obrigatório');
    }
    for (const campo of ['chunk', 'positions', 'normals', 'indices'] as const) {
      if (!numeroInteiro(parte[campo])) falhar(`${caminho}.${campo}`, 'inteiro não negativo esperado');
    }
    for (const campo of ['vertexCount', 'indexCount'] as const) {
      if (!numeroInteiro(parte[campo], true)) falhar(`${caminho}.${campo}`, 'inteiro positivo esperado');
    }
    if (!Array.isArray(parte.bounds) || parte.bounds.length !== 2 || !vetor3(parte.bounds[0]) || !vetor3(parte.bounds[1])) {
      falhar(`${caminho}.bounds`, 'duas coordenadas 3D esperadas');
    }
    if (parte.nameEn !== undefined && !texto(parte.nameEn)) falhar(`${caminho}.nameEn`, 'texto esperado');
  });

  dados.concepts.forEach((conceito, indice) => {
    const caminho = `concepts.${indice}`;
    if (!objeto(conceito)) falhar(caminho, 'objeto esperado');
    if (!texto(conceito.id)) falhar(`${caminho}.id`, 'texto obrigatório');
    if (!texto(conceito.name)) falhar(`${caminho}.name`, 'texto obrigatório');
    if (!Array.isArray(conceito.elements) || !conceito.elements.length || !conceito.elements.every(texto)) {
      falhar(`${caminho}.elements`, 'lista não vazia de identificadores esperada');
    }
    if (conceito.nameEn !== undefined && !texto(conceito.nameEn)) falhar(`${caminho}.nameEn`, 'texto esperado');
  });

  dados.chunks.forEach((bloco, indice) => {
    const caminho = `chunks.${indice}`;
    if (!objeto(bloco)) falhar(caminho, 'objeto esperado');
    if (!texto(bloco.url)) falhar(`${caminho}.url`, 'texto obrigatório');
    if (!numeroInteiro(bloco.bytes)) falhar(`${caminho}.bytes`, 'inteiro não negativo esperado');
    if (bloco.gzip !== undefined && !texto(bloco.gzip)) falhar(`${caminho}.gzip`, 'texto esperado');
    if (bloco.gzipBytes !== undefined && !numeroInteiro(bloco.gzipBytes)) falhar(`${caminho}.gzipBytes`, 'inteiro não negativo esperado');
  });

  if (dados.schemaVersion !== undefined && !texto(dados.schemaVersion)) {
    falhar('schemaVersion', 'texto esperado');
  }

  const validado = dados as unknown as ManifestoAtlasValidado;
  return {
    ...validado,
    schemaVersion: texto(dados.schemaVersion) ? dados.schemaVersion : '1.0',
  };
}
