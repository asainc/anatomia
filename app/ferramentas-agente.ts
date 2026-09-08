import {obterNomeExibicao, type Atlas, type Conceito} from './anatomia.ts';
import {
  buscarConceitos,
  criarIndiceAnatomico,
  nomeCategoria,
  nomeRegiao,
} from './dominio/catalogo-anatomico.ts';

/** Contrato mínimo usado pela API opcional de ferramentas do navegador. */
type Ferramenta = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: {readOnlyHint: boolean};
  execute: (entrada: unknown) => unknown;
};

/** Garante que a entrada de uma ferramenta seja um objeto simples. */
function obterRegistro(entrada: unknown): Record<string, unknown> {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw new Error('Era esperado um objeto como entrada.');
  }

  return entrada as Record<string, unknown>;
}

/**
 * Cria as ferramentas de busca e inspeção do atlas.
 *
 * Os nomes das propriedades exigidas pelo protocolo (`name`, `description`,
 * `inputSchema` e `execute`) permanecem em inglês porque fazem parte da API
 * externa do navegador. O restante da implementação está em português.
 */
export function criarFerramentasAtlas(
  atlas: Atlas,
  inspecionar: (conceito: Conceito) => void,
): Ferramenta[] {
  const indice = criarIndiceAnatomico(atlas);

  return [
    {
      name: 'buscar_anatomia',
      description:
        'Busca estruturas anatômicas por nome em português, nome da fonte ou identificador do atlas.',
      inputSchema: {
        type: 'object',
        properties: {consulta: {type: 'string', minLength: 1}},
        required: ['consulta'],
        additionalProperties: false,
      },
      annotations: {readOnlyHint: true},
      execute(entrada) {
        const dados = obterRegistro(entrada);
        if (typeof dados.consulta !== 'string' || !dados.consulta.trim()) {
          throw new Error('Informe uma consulta não vazia.');
        }

        return buscarConceitos(indice, dados.consulta, 30).map((item) => ({
          id: item.conceito.id,
          nome: obterNomeExibicao(item.conceito.nome),
          regiao: nomeRegiao(item.regiao),
          categoria: nomeCategoria(item.categoria),
          quantidadePecas: item.conceito.elementos.length,
        }));
      },
    },
    {
      name: 'inspecionar_estrutura_anatomica',
      description:
        'Seleciona um conceito no atlas 3D e abre o painel visível de detalhes.',
      inputSchema: {
        type: 'object',
        properties: {id: {type: 'string'}},
        required: ['id'],
        additionalProperties: false,
      },
      annotations: {readOnlyHint: false},
      execute(entrada) {
        const dados = obterRegistro(entrada);
        if (typeof dados.id !== 'string') {
          throw new Error('Informe um identificador do atlas.');
        }

        const conceito = atlas.conceitos.find((item) => item.id === dados.id);
        if (!conceito) {
          throw new Error('A estrutura informada não está presente neste atlas.');
        }

        inspecionar(conceito);
        return {
          id: conceito.id,
          nome: obterNomeExibicao(conceito.nome),
          quantidadePecasSelecionadas: conceito.elementos.length,
        };
      },
    },
  ];
}

/**
 * Registra as ferramentas somente quando o navegador oferece a capacidade
 * `modelContext.registerTool`. A interface visual funciona normalmente sem ela.
 */
export function registrarFerramentasAtlas(
  atlas: Atlas,
  inspecionar: (conceito: Conceito) => void,
) {
  const contexto = (
    document as Document & {
      modelContext?: {
        registerTool: (
          ferramenta: Ferramenta,
          opcoes: {signal: AbortSignal},
        ) => void | Promise<void>;
      };
    }
  ).modelContext;

  if (!contexto?.registerTool) {
    return;
  }

  const cicloVida = new AbortController();

  for (const ferramenta of criarFerramentasAtlas(atlas, inspecionar)) {
    try {
      void Promise.resolve(
        contexto.registerTool(ferramenta, {signal: cicloVida.signal}),
      ).catch(() => {
        // Recurso opcional: falhas aqui não devem derrubar a interface principal.
      });
    } catch {
      // Recurso opcional: a experiência visual permanece disponível.
    }
  }

  return () => cicloVida.abort();
}
