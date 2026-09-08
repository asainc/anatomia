import {SISTEMAS, type IdSistema} from '../anatomia.ts';
import {
  nomeCategoria,
  nomeRegiao,
  type CategoriaAnatomica,
  type ConceitoIndexado,
  type IdRegiaoAnatomica,
} from './catalogo-anatomico.ts';

/**
 * Domínio do modo de preparação para residência médica.
 *
 * As questões são produzidas somente a partir do catálogo anatômico local.
 * Não há geração por IA nem dependência de rede: a mesma base 3D que o aluno
 * explora é usada para criar alternativas, filtros e estatísticas.
 */

export type TipoQuestaoResidencia =
  | 'localizacao-3d'
  | 'identificacao'
  | 'regiao'
  | 'sistema'
  | 'categoria';

export type ModoEstudoResidencia =
  | 'treino-rapido'
  | 'simulado'
  | 'revisao-espacada'
  | 'caderno-erros';

export type NivelQuestao = 'fundamental' | 'intermediario' | 'avancado';

export interface FiltroEstudoResidencia {
  sistema?: IdSistema | 'todos';
  regiao?: IdRegiaoAnatomica | 'todas';
  nivel?: NivelQuestao | 'todos';
}

export interface AlternativaQuestao {
  id: string;
  texto: string;
}

export interface QuestaoResidencia {
  id: string;
  tipo: TipoQuestaoResidencia;
  conceito: ConceitoIndexado;
  enunciado: string;
  instrucao?: string;
  alternativas: AlternativaQuestao[];
  respostaCorreta: string;
  explicacao: string;
  nivel: NivelQuestao;
}

export interface RegistroConceitoEstudo {
  conceitoId: string;
  acertos: number;
  erros: number;
  sequenciaAcertos: number;
  intervaloDias: number;
  ultimaRespostaEm: string;
  proximaRevisaoEm: string;
}

export interface HistoricoRespostaResidencia {
  id: string;
  conceitoId: string;
  tipo: TipoQuestaoResidencia;
  correto: boolean;
  respondidaEm: string;
}

export interface ProgressoResidencia {
  versao: 1;
  registros: Record<string, RegistroConceitoEstudo>;
  historico: HistoricoRespostaResidencia[];
  simuladosConcluidos: number;
  melhorPercentualSimulado: number;
}

export const PROGRESSO_RESIDENCIA_VAZIO: ProgressoResidencia = {
  versao: 1,
  registros: {},
  historico: [],
  simuladosConcluidos: 0,
  melhorPercentualSimulado: 0,
};

const CATEGORIAS_ESTUDAVEIS = new Set<CategoriaAnatomica>([
  'osso',
  'musculo',
  'arteria',
  'veia',
  'nervo',
  'orgao',
  'ligamento',
  'cartilagem',
  'glandula',
  'via-aerea',
]);

function embaralhar<T>(itens: T[], aleatorio = Math.random): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function nivelDoConceito(item: ConceitoIndexado): NivelQuestao {
  const palavras = item.conceito.nome.trim().split(/\s+/).length;
  if (item.conceito.elementos.length > 12 || palavras <= 2) return 'fundamental';
  if (palavras >= 6 || /ramo|segment|porcao|cabe[cç]a|folheto|fasciculo/i.test(item.conceito.nome)) {
    return 'avancado';
  }
  return 'intermediario';
}

export function conceitoElegivelParaEstudo(item: ConceitoIndexado): boolean {
  return (
    item.regiao !== 'nao-classificada' &&
    CATEGORIAS_ESTUDAVEIS.has(item.categoria) &&
    item.conceito.elementos.length > 0 &&
    item.conceito.elementos.length <= 40
  );
}

export function filtrarBancoResidencia(
  indice: ConceitoIndexado[],
  filtro: FiltroEstudoResidencia,
): ConceitoIndexado[] {
  return indice.filter((item) => {
    if (!conceitoElegivelParaEstudo(item)) return false;
    if (filtro.sistema && filtro.sistema !== 'todos' && item.sistema !== filtro.sistema) return false;
    if (filtro.regiao && filtro.regiao !== 'todas' && item.regiao !== filtro.regiao) return false;
    if (filtro.nivel && filtro.nivel !== 'todos' && nivelDoConceito(item) !== filtro.nivel) return false;
    return true;
  });
}

function distratoresEstrutura(
  banco: ConceitoIndexado[],
  alvo: ConceitoIndexado,
  quantidade: number,
  aleatorio = Math.random,
): ConceitoIndexado[] {
  const mesmaRegiaoCategoria = banco.filter(
    (item) =>
      item.conceito.id !== alvo.conceito.id &&
      item.regiao === alvo.regiao &&
      item.categoria === alvo.categoria,
  );
  const mesmaRegiao = banco.filter(
    (item) =>
      item.conceito.id !== alvo.conceito.id &&
      item.regiao === alvo.regiao &&
      item.categoria !== alvo.categoria,
  );
  const mesmoSistema = banco.filter(
    (item) =>
      item.conceito.id !== alvo.conceito.id &&
      item.sistema === alvo.sistema &&
      item.regiao !== alvo.regiao,
  );
  const candidatos = [...mesmaRegiaoCategoria, ...mesmaRegiao, ...mesmoSistema];
  const unicos = [...new Map(candidatos.map((item) => [item.conceito.id, item])).values()];
  return embaralhar(unicos, aleatorio).slice(0, quantidade);
}

function alternativasEstrutura(
  banco: ConceitoIndexado[],
  alvo: ConceitoIndexado,
  aleatorio = Math.random,
): AlternativaQuestao[] {
  const distratores = distratoresEstrutura(banco, alvo, 3, aleatorio);
  return embaralhar(
    [alvo, ...distratores].map((item) => ({
      id: item.conceito.id,
      texto: item.conceito.nome,
    })),
    aleatorio,
  );
}

function alternativasFixas(
  correta: string,
  candidatas: AlternativaQuestao[],
  aleatorio = Math.random,
): AlternativaQuestao[] {
  const corretaObj = candidatas.find((item) => item.id === correta);
  const demais = embaralhar(candidatas.filter((item) => item.id !== correta), aleatorio).slice(0, 3);
  return embaralhar([...(corretaObj ? [corretaObj] : []), ...demais], aleatorio);
}

function explicacaoBase(item: ConceitoIndexado): string {
  const sistema = SISTEMAS.find((valor) => valor.id === item.sistema)?.nome ?? item.sistema;
  return `${item.conceito.nome} pertence ao sistema ${sistema.toLowerCase()}, está classificado em ${nomeRegiao(item.regiao)} e, neste atlas, integra a categoria ${nomeCategoria(item.categoria).toLowerCase()}.`;
}

export function criarQuestaoResidencia(
  banco: ConceitoIndexado[],
  alvo: ConceitoIndexado,
  tipo: TipoQuestaoResidencia,
  aleatorio = Math.random,
): QuestaoResidencia {
  const nivel = nivelDoConceito(alvo);
  const idBase = `${tipo}:${alvo.conceito.id}:${Date.now()}`;

  if (tipo === 'localizacao-3d') {
    return {
      id: idBase,
      tipo,
      conceito: alvo,
      enunciado: `Localize ${alvo.conceito.nome} no modelo 3D.`,
      instrucao: 'Clique diretamente na estrutura anatômica correta.',
      alternativas: [],
      respostaCorreta: alvo.conceito.id,
      explicacao: explicacaoBase(alvo),
      nivel,
    };
  }

  if (tipo === 'identificacao') {
    return {
      id: idBase,
      tipo,
      conceito: alvo,
      enunciado: 'Qual é a estrutura destacada no modelo 3D?',
      instrucao: `Observe a região de ${nomeRegiao(alvo.regiao).toLowerCase()} antes de responder.`,
      alternativas: alternativasEstrutura(banco, alvo, aleatorio),
      respostaCorreta: alvo.conceito.id,
      explicacao: explicacaoBase(alvo),
      nivel,
    };
  }

  if (tipo === 'regiao') {
    const regioes = [...new Set(banco.map((item) => item.regiao))].map((regiao) => ({
      id: regiao,
      texto: nomeRegiao(regiao),
    }));
    return {
      id: idBase,
      tipo,
      conceito: alvo,
      enunciado: `Em qual região anatômica se encontra ${alvo.conceito.nome}?`,
      alternativas: alternativasFixas(alvo.regiao, regioes, aleatorio),
      respostaCorreta: alvo.regiao,
      explicacao: explicacaoBase(alvo),
      nivel,
    };
  }

  if (tipo === 'sistema') {
    const sistemasDisponiveis = [...new Set(banco.map((item) => item.sistema))].map((sistema) => ({
      id: sistema,
      texto: SISTEMAS.find((valor) => valor.id === sistema)?.nome ?? sistema,
    }));
    return {
      id: idBase,
      tipo,
      conceito: alvo,
      enunciado: `A qual sistema anatômico pertence ${alvo.conceito.nome}?`,
      alternativas: alternativasFixas(alvo.sistema, sistemasDisponiveis, aleatorio),
      respostaCorreta: alvo.sistema,
      explicacao: explicacaoBase(alvo),
      nivel,
    };
  }

  const categorias = [...new Set(banco.map((item) => item.categoria))].map((categoria) => ({
    id: categoria,
    texto: nomeCategoria(categoria),
  }));
  return {
    id: idBase,
    tipo: 'categoria',
    conceito: alvo,
    enunciado: `Como ${alvo.conceito.nome} é classificado anatomicamente neste atlas?`,
    alternativas: alternativasFixas(alvo.categoria, categorias, aleatorio),
    respostaCorreta: alvo.categoria,
    explicacao: explicacaoBase(alvo),
    nivel,
  };
}

export function selecionarTipoQuestao(
  indiceQuestao: number,
  modo: ModoEstudoResidencia,
): TipoQuestaoResidencia {
  const ciclo: TipoQuestaoResidencia[] =
    modo === 'simulado'
      ? ['identificacao', 'regiao', 'sistema', 'categoria', 'localizacao-3d']
      : ['localizacao-3d', 'identificacao', 'regiao', 'sistema', 'categoria'];
  return ciclo[indiceQuestao % ciclo.length] ?? 'identificacao';
}

export function montarFilaEstudo(
  indice: ConceitoIndexado[],
  modo: ModoEstudoResidencia,
  filtro: FiltroEstudoResidencia,
  progresso: ProgressoResidencia,
  quantidade: number,
  agora = new Date(),
  aleatorio = Math.random,
): ConceitoIndexado[] {
  const banco = filtrarBancoResidencia(indice, filtro);
  if (!banco.length) return [];

  let candidatos = banco;
  if (modo === 'caderno-erros') {
    candidatos = banco.filter((item) => {
      const registro = progresso.registros[item.conceito.id];
      return !!registro && registro.erros > 0 && registro.sequenciaAcertos < 2;
    });
  } else if (modo === 'revisao-espacada') {
    const limite = agora.getTime();
    candidatos = banco.filter((item) => {
      const registro = progresso.registros[item.conceito.id];
      return !!registro && new Date(registro.proximaRevisaoEm).getTime() <= limite;
    });
  }

  return embaralhar(candidatos, aleatorio).slice(0, quantidade);
}

export function registrarResposta(
  progresso: ProgressoResidencia,
  questao: QuestaoResidencia,
  correto: boolean,
  agora = new Date(),
): ProgressoResidencia {
  const anterior = progresso.registros[questao.conceito.conceito.id];
  const sequenciaAcertos = correto ? (anterior?.sequenciaAcertos ?? 0) + 1 : 0;
  const intervalos = [1, 3, 7, 14, 30, 60];
  const intervaloDias = correto
    ? intervalos[Math.min(sequenciaAcertos - 1, intervalos.length - 1)] ?? 60
    : 1;
  const proxima = new Date(agora);
  proxima.setDate(proxima.getDate() + intervaloDias);

  const registro: RegistroConceitoEstudo = {
    conceitoId: questao.conceito.conceito.id,
    acertos: (anterior?.acertos ?? 0) + (correto ? 1 : 0),
    erros: (anterior?.erros ?? 0) + (correto ? 0 : 1),
    sequenciaAcertos,
    intervaloDias,
    ultimaRespostaEm: agora.toISOString(),
    proximaRevisaoEm: proxima.toISOString(),
  };

  const historico: HistoricoRespostaResidencia = {
    id: `${agora.getTime()}:${questao.conceito.conceito.id}`,
    conceitoId: questao.conceito.conceito.id,
    tipo: questao.tipo,
    correto,
    respondidaEm: agora.toISOString(),
  };

  return {
    ...progresso,
    registros: {...progresso.registros, [registro.conceitoId]: registro},
    historico: [...progresso.historico, historico].slice(-1200),
  };
}

export function concluirSimulado(
  progresso: ProgressoResidencia,
  acertos: number,
  total: number,
): ProgressoResidencia {
  const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;
  return {
    ...progresso,
    simuladosConcluidos: progresso.simuladosConcluidos + 1,
    melhorPercentualSimulado: Math.max(progresso.melhorPercentualSimulado, percentual),
  };
}

export interface ResumoEstudoResidencia {
  respondidas: number;
  acertos: number;
  percentual: number;
  estruturasEstudadas: number;
  revisoesPendentes: number;
  cadernoErros: number;
  dominadas: number;
}

export function resumirProgresso(
  progresso: ProgressoResidencia,
  agora = new Date(),
): ResumoEstudoResidencia {
  const registros = Object.values(progresso.registros);
  const acertos = progresso.historico.filter((item) => item.correto).length;
  const respondidas = progresso.historico.length;
  const limite = agora.getTime();
  return {
    respondidas,
    acertos,
    percentual: respondidas ? Math.round((acertos / respondidas) * 100) : 0,
    estruturasEstudadas: registros.length,
    revisoesPendentes: registros.filter((item) => new Date(item.proximaRevisaoEm).getTime() <= limite).length,
    cadernoErros: registros.filter((item) => item.erros > 0 && item.sequenciaAcertos < 2).length,
    dominadas: registros.filter((item) => item.sequenciaAcertos >= 3).length,
  };
}

export interface DesempenhoTema {
  id: string;
  nome: string;
  respondidas: number;
  acertos: number;
  percentual: number;
}

export function desempenhoPorSistema(
  indice: ConceitoIndexado[],
  progresso: ProgressoResidencia,
): DesempenhoTema[] {
  const porConceito = new Map(indice.map((item) => [item.conceito.id, item]));
  const acumulado = new Map<IdSistema, {respondidas: number; acertos: number}>();
  progresso.historico.forEach((resposta) => {
    const sistema = porConceito.get(resposta.conceitoId)?.sistema;
    if (!sistema) return;
    const atual = acumulado.get(sistema) ?? {respondidas: 0, acertos: 0};
    atual.respondidas += 1;
    atual.acertos += resposta.correto ? 1 : 0;
    acumulado.set(sistema, atual);
  });
  return [...acumulado.entries()]
    .map(([id, valor]) => ({
      id,
      nome: SISTEMAS.find((sistema) => sistema.id === id)?.nome ?? id,
      ...valor,
      percentual: valor.respondidas ? Math.round((valor.acertos / valor.respondidas) * 100) : 0,
    }))
    .sort((a, b) => a.percentual - b.percentual || b.respondidas - a.respondidas);
}
