import type {Atlas, Conceito, IdSistema, Parte} from '../anatomia.ts';

export type IdRegiaoAnatomica =
  | 'cabeca'
  | 'pescoco'
  | 'torax'
  | 'abdome'
  | 'pelve'
  | 'membro-superior'
  | 'membro-inferior'
  | 'coluna-dorso'
  | 'corpo-inteiro'
  | 'nao-classificada';

export type CategoriaAnatomica =
  | 'osso'
  | 'musculo'
  | 'arteria'
  | 'veia'
  | 'nervo'
  | 'orgao'
  | 'ligamento'
  | 'cartilagem'
  | 'glandula'
  | 'via-aerea'
  | 'vaso-linfatico'
  | 'tecido'
  | 'estrutura';

export interface RegiaoAnatomica {
  id: IdRegiaoAnatomica;
  nome: string;
}

export interface ConceitoIndexado {
  conceito: Conceito;
  sistema: IdSistema;
  regiao: IdRegiaoAnatomica;
  categoria: CategoriaAnatomica;
  aliases: string[];
  termosBusca: string;
  caminho: string[];
  nomeLatim?: string;
}

export interface GrupoHierarquia {
  sistema: IdSistema;
  regioes: Array<{
    regiao: IdRegiaoAnatomica;
    categorias: Array<{
      categoria: CategoriaAnatomica;
      conceitos: ConceitoIndexado[];
    }>;
  }>;
}

export const REGIOES: RegiaoAnatomica[] = [
  {id: 'cabeca', nome: 'Cabeça'},
  {id: 'pescoco', nome: 'Pescoço'},
  {id: 'torax', nome: 'Tórax'},
  {id: 'abdome', nome: 'Abdome'},
  {id: 'pelve', nome: 'Pelve e períneo'},
  {id: 'membro-superior', nome: 'Membro superior'},
  {id: 'membro-inferior', nome: 'Membro inferior'},
  {id: 'coluna-dorso', nome: 'Coluna e dorso'},
  {id: 'corpo-inteiro', nome: 'Corpo inteiro'},
  {id: 'nao-classificada', nome: 'Outras estruturas'},
];

const NOMES_CATEGORIA: Record<CategoriaAnatomica, string> = {
  osso: 'Ossos',
  musculo: 'Músculos',
  arteria: 'Artérias',
  veia: 'Veias',
  nervo: 'Nervos',
  orgao: 'Órgãos',
  ligamento: 'Ligamentos',
  cartilagem: 'Cartilagens',
  glandula: 'Glândulas',
  'via-aerea': 'Vias aéreas',
  'vaso-linfatico': 'Estruturas linfáticas',
  tecido: 'Tecidos',
  estrutura: 'Outras estruturas',
};

/** Sinônimos e termos leigos que tornam a busca mais útil em português. */
const ALIASES_COMUNS: Record<string, string[]> = {
  encefalo: ['cérebro', 'cerebro'],
  cerebro: ['encéfalo', 'encefalo'],
  coracao: ['coração', 'bomba cardíaca', 'bomba cardiaca'],
  traqueia: ['via aérea', 'via aerea'],
  escapula: ['omoplata'],
  patela: ['rótula', 'rotula'],
  clavicula: ['osso da clavícula', 'osso da clavicula'],
  ulna: ['cúbito', 'cubito'],
  fibula: ['perônio', 'peronio'],
  tibia: ['canela'],
  humero: ['osso do braço', 'osso do braco'],
  femur: ['osso da coxa'],
  mandibula: ['maxilar inferior'],
  maxila: ['maxilar superior'],
  metacarpo: ['ossos da mão', 'ossos da mao', 'metacarpal'],
  metatarso: ['ossos do pé', 'ossos do pe', 'metatarsal'],
  falange: ['dedo', 'dedos'],
};

const LATIM_COMUM: Array<[RegExp, string]> = [
  [/^coração$/i, 'cor'],
  [/^encéfalo$/i, 'encephalon'],
  [/^fêmur$/i, 'femur'],
  [/^úmero$/i, 'humerus'],
  [/^ulna$/i, 'ulna'],
  [/^rádio$/i, 'radius'],
  [/^tíbia$/i, 'tibia'],
  [/^fíbula$/i, 'fibula'],
  [/^patela$/i, 'patella'],
  [/^escápula$/i, 'scapula'],
  [/^clavícula$/i, 'clavicula'],
  [/^mandíbula$/i, 'mandibula'],
  [/^maxila$/i, 'maxilla'],
  [/^traqueia$/i, 'trachea'],
  [/^diafragma$/i, 'diaphragma'],
];

const PALAVRAS_REGIAO: Array<[IdRegiaoAnatomica, string[]]> = [
  [
    'membro-superior',
    [
      'ombro', 'braço', 'braco', 'antebraço', 'antebraco', 'cotovelo', 'punho',
      'mão', 'mao', 'dedo', 'polegar', 'carpo', 'metacarpo', 'úmero', 'humero',
      'rádio', 'radio', 'ulna', 'escápula', 'escapula', 'clavícula', 'clavicula',
      'braquial', 'radial', 'ulnar', 'palmar',
    ],
  ],
  [
    'membro-inferior',
    [
      'quadril', 'coxa', 'joelho', 'perna', 'tornozelo', 'pé', 'pe', 'fêmur',
      'femur', 'patela', 'tíbia', 'tibia', 'fíbula', 'fibula', 'tarso',
      'metatarso', 'calcâneo', 'calcaneo', 'femoral', 'tibial', 'fibular',
      'plantar', 'poplítea', 'poplitea',
    ],
  ],
  [
    'cabeca',
    [
      'crânio', 'cranio', 'cérebro', 'cerebro', 'encéfalo', 'encefalo', 'olho',
      'ocular', 'orelha', 'ouvido', 'nariz', 'nasal', 'boca', 'oral', 'face',
      'facial', 'mandíbula', 'mandibula', 'maxila', 'zigomático', 'zigomatico',
      'temporal', 'frontal', 'occipital', 'parietal', 'cerebral', 'cerebel',
    ],
  ],
  [
    'pescoco',
    ['pescoço', 'pescoco', 'cervical', 'laringe', 'faringe', 'tireoide', 'carótida', 'carotida'],
  ],
  [
    'torax',
    [
      'tórax', 'torax', 'torác', 'torac', 'coração', 'coracao', 'pulmão', 'pulmao',
      'brônqu', 'bronqu', 'traqueia', 'costela', 'esterno', 'mediastino', 'pleura',
      'cardíac', 'cardiac', 'pulmonar',
    ],
  ],
  [
    'abdome',
    [
      'abdome', 'abdominal', 'fígado', 'figado', 'estômago', 'estomago', 'baço',
      'baco', 'pâncreas', 'pancreas', 'intestino', 'duodeno', 'jejuno', 'íleo',
      'ileo', 'cólon', 'colon', 'renal', 'rim', 'mesentér', 'mesenter',
    ],
  ],
  [
    'pelve',
    [
      'pelve', 'pélv', 'pelv', 'bexiga', 'próstata', 'prostata', 'reto', 'uretra',
      'testículo', 'testiculo', 'pênis', 'penis', 'períneo', 'perineo', 'ilíaca',
      'iliaca', 'sacral',
    ],
  ],
  [
    'coluna-dorso',
    ['vértebra', 'vertebra', 'vertebral', 'coluna', 'espinal', 'dorso', 'dorsal', 'sacro', 'cóccix', 'coccix'],
  ],
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function incluiPalavra(texto: string, palavra: string): boolean {
  return texto.includes(normalizar(palavra));
}

export function nomeRegiao(id: IdRegiaoAnatomica): string {
  return REGIOES.find((regiao) => regiao.id === id)?.nome ?? 'Outras estruturas';
}

export function nomeCategoria(categoria: CategoriaAnatomica): string {
  return NOMES_CATEGORIA[categoria];
}

export function inferirRegiao(nome: string, sistema: IdSistema): IdRegiaoAnatomica {
  const texto = normalizar(nome);
  for (const [regiao, palavras] of PALAVRAS_REGIAO) {
    if (palavras.some((palavra) => incluiPalavra(texto, palavra))) {
      return regiao;
    }
  }

  if (sistema === 'tegumentar' || texto.includes('corpo')) {
    return 'corpo-inteiro';
  }
  return 'nao-classificada';
}

export function inferirCategoria(nome: string, sistema: IdSistema): CategoriaAnatomica {
  const texto = normalizar(nome);
  if (sistema === 'arterial' || texto.includes('arteria')) return 'arteria';
  if (sistema === 'venoso' || texto.includes('veia')) return 'veia';
  if (sistema === 'nervoso' || texto.includes('nervo')) return 'nervo';
  if (sistema === 'muscular' || /(^| )musculo( |$)/.test(texto)) return 'musculo';
  if (texto.includes('ligamento')) return 'ligamento';
  if (texto.includes('cartilagem')) return 'cartilagem';
  if (texto.includes('glandula')) return 'glandula';
  if (texto.includes('bronqu') || texto.includes('traque') || texto.includes('laringe')) return 'via-aerea';
  if (sistema === 'linfatico') return 'vaso-linfatico';
  if (
    sistema === 'esqueletico' ||
    ['osso', 'vertebra', 'costela', 'femur', 'humero', 'tibia', 'fibula', 'patela', 'metacarpo', 'metatarso', 'falange'].some((termo) => texto.includes(termo))
  ) return 'osso';
  if (sistema === 'conjuntivo' || sistema === 'tegumentar') return 'tecido';
  if (['cardiaco', 'respiratorio', 'digestivo', 'urinario', 'reprodutor', 'endocrino', 'sensorial'].includes(sistema)) return 'orgao';
  return 'estrutura';
}

function nomeLatim(nome: string): string | undefined {
  for (const [padrao, latim] of LATIM_COMUM) {
    if (padrao.test(nome)) return latim;
  }
  return undefined;
}

function gerarAliases(conceito: Conceito): string[] {
  const base = normalizar(conceito.nome);
  const aliases = new Set<string>();
  Object.entries(ALIASES_COMUNS).forEach(([chave, valores]) => {
    if (base.includes(chave)) valores.forEach((valor) => aliases.add(valor));
  });
  if (conceito.nomeOriginal) aliases.add(conceito.nomeOriginal);
  return [...aliases];
}

export function criarIndiceAnatomico(atlas: Atlas): ConceitoIndexado[] {
  const partePorId = new Map(atlas.partes.map((parte) => [parte.id, parte]));
  return atlas.conceitos.map((conceito) => {
    const partes = conceito.elementos
      .map((id) => partePorId.get(id))
      .filter((parte): parte is Parte => !!parte);
    const sistema = partes[0]?.sistema ?? 'conjuntivo';
    const regiao = inferirRegiao(conceito.nome, sistema);
    const categoria = inferirCategoria(conceito.nome, sistema);
    const aliases = gerarAliases(conceito);
    const sistemaNome = sistema;
    const termosBusca = normalizar(
      [conceito.nome, conceito.nomeOriginal, conceito.id, ...aliases, nomeRegiao(regiao), nomeCategoria(categoria), sistemaNome]
        .filter(Boolean)
        .join(' '),
    );
    return {
      conceito,
      sistema,
      regiao,
      categoria,
      aliases,
      termosBusca,
      caminho: [nomeRegiao(regiao), nomeCategoria(categoria)],
      nomeLatim: nomeLatim(conceito.nome),
    };
  });
}

function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const anterior = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const atual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      atual[j] = Math.min(
        atual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j < atual.length; j += 1) anterior[j] = atual[j];
  }
  return anterior[b.length];
}

function pontuar(item: ConceitoIndexado, consulta: string): number {
  const termo = normalizar(consulta);
  if (!termo) return 0;
  const nome = normalizar(item.conceito.nome);
  if (nome === termo) return 1000;
  if (nome.startsWith(termo)) return 850 - Math.min(100, nome.length - termo.length);
  if (nome.includes(termo)) return 700 - Math.min(100, nome.indexOf(termo));

  const tokensConsulta = termo.split(' ').filter(Boolean);
  const encontrados = tokensConsulta.filter((token) => item.termosBusca.includes(token));
  if (encontrados.length === tokensConsulta.length) return 560 + encontrados.length * 15;
  if (encontrados.length) return 300 + encontrados.length * 20;

  // Fuzzy somente para consultas curtas: evita custo alto ao percorrer 3,4 mil conceitos.
  if (termo.length >= 4 && termo.length <= 18 && nome.length <= 30) {
    const primeiroToken = nome.split(' ')[0] ?? nome;
    const distancia = distanciaLevenshtein(termo, primeiroToken);
    const limite = termo.length <= 7 ? 1 : 2;
    if (distancia <= limite) return 180 - distancia * 30;
  }
  return -1;
}

export function buscarConceitos(
  indice: ConceitoIndexado[],
  consulta: string,
  limite = 80,
): ConceitoIndexado[] {
  const termo = normalizar(consulta);
  if (!termo) return [];
  return indice
    .map((item) => ({item, pontos: pontuar(item, termo)}))
    .filter(({pontos}) => pontos >= 0)
    .sort((a, b) => b.pontos - a.pontos || a.item.conceito.nome.localeCompare(b.item.conceito.nome, 'pt-BR'))
    .slice(0, limite)
    .map(({item}) => item);
}

export function construirHierarquia(indice: ConceitoIndexado[]): GrupoHierarquia[] {
  const porSistema = new Map<IdSistema, Map<IdRegiaoAnatomica, Map<CategoriaAnatomica, ConceitoIndexado[]>>>();
  indice.forEach((item) => {
    const regioes = porSistema.get(item.sistema) ?? new Map();
    porSistema.set(item.sistema, regioes);
    const categorias = regioes.get(item.regiao) ?? new Map();
    regioes.set(item.regiao, categorias);
    const conceitos = categorias.get(item.categoria) ?? [];
    categorias.set(item.categoria, conceitos);
    conceitos.push(item);
  });

  return [...porSistema.entries()].map(([sistema, regioes]) => ({
    sistema,
    regioes: [...regioes.entries()]
      .map(([regiao, categorias]) => ({
        regiao,
        categorias: [...categorias.entries()]
          .map(([categoria, conceitos]) => ({
            categoria,
            conceitos: conceitos.sort((a, b) => a.conceito.nome.localeCompare(b.conceito.nome, 'pt-BR')),
          }))
          .sort((a, b) => nomeCategoria(a.categoria).localeCompare(nomeCategoria(b.categoria), 'pt-BR')),
      }))
      .sort((a, b) => nomeRegiao(a.regiao).localeCompare(nomeRegiao(b.regiao), 'pt-BR')),
  }));
}

export function encontrarRelacionados(
  indice: ConceitoIndexado[],
  alvo: ConceitoIndexado,
  limite = 8,
): ConceitoIndexado[] {
  const tokens = normalizar(alvo.conceito.nome).split(' ').filter((token) => token.length >= 4);
  return indice
    .filter((item) => item.conceito.id !== alvo.conceito.id)
    .map((item) => {
      let pontos = 0;
      if (item.regiao === alvo.regiao) pontos += 5;
      if (item.sistema === alvo.sistema) pontos += 4;
      if (item.categoria === alvo.categoria) pontos += 2;
      const nome = normalizar(item.conceito.nome);
      pontos += tokens.filter((token) => nome.includes(token)).length * 3;
      return {item, pontos};
    })
    .filter(({pontos}) => pontos >= 7)
    .sort((a, b) => b.pontos - a.pontos || a.item.conceito.nome.length - b.item.conceito.nome.length)
    .slice(0, limite)
    .map(({item}) => item);
}

export function descricaoCategoria(categoria: CategoriaAnatomica, sistema: IdSistema): string {
  const porCategoria: Record<CategoriaAnatomica, string> = {
    osso: 'Estrutura do sistema esquelético que participa de sustentação, proteção e movimento.',
    musculo: 'Estrutura contrátil que participa do movimento, estabilização e controle postural.',
    arteria: 'Vaso que conduz sangue para fora do coração em direção aos tecidos.',
    veia: 'Vaso que conduz sangue dos tecidos de volta ao coração.',
    nervo: 'Estrutura que conduz sinais entre o sistema nervoso central e outras regiões do corpo.',
    orgao: 'Estrutura anatômica formada por diferentes tecidos que executa funções especializadas.',
    ligamento: 'Faixa de tecido conjuntivo que conecta e estabiliza estruturas, especialmente articulações.',
    cartilagem: 'Tecido conjuntivo especializado que oferece suporte e reduz atrito em determinadas superfícies.',
    glandula: 'Estrutura especializada na produção e liberação de substâncias.',
    'via-aerea': 'Estrutura que participa da condução do ar no sistema respiratório.',
    'vaso-linfatico': 'Estrutura do sistema linfático relacionada ao transporte de linfa e à resposta imune.',
    tecido: 'Estrutura de suporte, revestimento ou conexão entre componentes anatômicos.',
    estrutura: 'Estrutura anatômica catalogada no modelo de referência.',
  };
  void sistema;
  return porCategoria[categoria];
}
