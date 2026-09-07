/**
 * Tipos e regras centrais do atlas anatômico.
 *
 * O arquivo `public/models/atlas.json` é a versão localizada em PT-BR do
 * manifesto BodyParts3D. IDs, offsets e geometria continuam idênticos à fonte;
 * o nome original em inglês fica somente em `nameEn` para rastreabilidade e
 * nunca é usado como fallback visual.
 */

export type IdSistema =
  | 'esqueletico'
  | 'muscular'
  | 'arterial'
  | 'venoso'
  | 'nervoso'
  | 'digestivo'
  | 'respiratorio'
  | 'urinario'
  | 'reprodutor'
  | 'linfatico'
  | 'endocrino'
  | 'tegumentar'
  | 'conjuntivo'
  | 'sensorial'
  | 'cardiaco';

export interface SistemaAnatomico {
  id: IdSistema;
  nome: string;
  cor: string;
  descricao: string;
}

/** Sistemas exibidos na interface e suas descrições educacionais. */
export const SISTEMAS: SistemaAnatomico[] = [
  {
    id: 'esqueletico',
    nome: 'Esqueleto',
    cor: '#e2d9ba',
    descricao:
      'Os ossos formam a estrutura de sustentação do corpo, protegem órgãos e oferecem pontos de fixação para os músculos. O tecido interno também armazena minerais e participa da produção de células sanguíneas.',
  },
  {
    id: 'muscular',
    nome: 'Músculos',
    cor: '#a85b50',
    descricao:
      'Os músculos esqueléticos geram movimento ao tracionar seus pontos de fixação. Em conjunto com os tendões, movimentam as articulações, estabilizam a postura e produzem calor.',
  },
  {
    id: 'cardiaco',
    nome: 'Coração',
    cor: '#b96760',
    descricao:
      'O coração é uma bomba muscular com quatro câmaras. Suas válvulas direcionam o sangue pelo circuito pulmonar e pelo circuito sistêmico.',
  },
  {
    id: 'sensorial',
    nome: 'Órgãos sensoriais',
    cor: '#b0c8ce',
    descricao:
      'Essas estruturas participam de sentidos especiais, como visão, audição e equilíbrio. Seus tecidos especializados detectam estímulos e trabalham com o sistema nervoso para transmitir informações.',
  },
  {
    id: 'arterial',
    nome: 'Artérias',
    cor: '#c05245',
    descricao:
      'O coração impulsiona o sangue pela circulação. As artérias levam o sangue para fora do coração, abastecendo os tecidos ou, no circuito pulmonar, conduzindo-o aos pulmões.',
  },
  {
    id: 'venoso',
    nome: 'Veias',
    cor: '#527c9f',
    descricao:
      'As veias conduzem o sangue de volta ao coração. Redes superficiais e profundas coletam o sangue dos tecidos; as veias pulmonares trazem sangue oxigenado dos pulmões.',
  },
  {
    id: 'nervoso',
    nome: 'Sistema nervoso',
    cor: '#d8b565',
    descricao:
      'Cérebro, medula espinhal e nervos periféricos transportam e processam sinais. Eles sustentam sensação, movimento, coordenação e regulação automática das funções do corpo.',
  },
  {
    id: 'respiratorio',
    nome: 'Respiratório',
    cor: '#b98991',
    descricao:
      'As vias aéreas conduzem o ar aos pulmões, onde oxigênio e dióxido de carbono são trocados entre o ar e o sangue. A respiração depende de mudanças de pressão produzidas pelos músculos respiratórios.',
  },
  {
    id: 'digestivo',
    nome: 'Digestório',
    cor: '#b8916b',
    descricao:
      'O trato digestório decompõe os alimentos, absorve nutrientes e água e conduz os resíduos. Órgãos acessórios contribuem com bile e enzimas digestivas.',
  },
  {
    id: 'urinario',
    nome: 'Urinário',
    cor: '#b47961',
    descricao:
      'Os rins filtram o sangue e regulam líquidos, eletrólitos e o equilíbrio ácido-base. A urina percorre os ureteres até a bexiga e é eliminada pela uretra.',
  },
  {
    id: 'linfatico',
    nome: 'Linfático',
    cor: '#879f7c',
    descricao:
      'Os vasos linfáticos devolvem o excesso de líquido dos tecidos à circulação. Linfonodos e outros órgãos linfoides participam da vigilância e das respostas imunológicas.',
  },
  {
    id: 'endocrino',
    nome: 'Endócrino',
    cor: '#c5a09a',
    descricao:
      'Os órgãos endócrinos liberam hormônios no sangue para coordenar processos como metabolismo, crescimento, resposta ao estresse e reprodução.',
  },
  {
    id: 'reprodutor',
    nome: 'Reprodutor',
    cor: '#bda098',
    descricao:
      'As estruturas reprodutivas masculinas representadas contribuem para produção, maturação e transporte de espermatozoides, além da produção de hormônios sexuais.',
  },
  {
    id: 'tegumentar',
    nome: 'Superfície corporal',
    cor: '#ba9b7d',
    descricao:
      'A superfície corporal fornece uma referência anatômica externa. O sistema tegumentar forma uma barreira protetora e participa da sensibilidade e da regulação da temperatura.',
  },
  {
    id: 'conjuntivo',
    nome: 'Tecido conjuntivo',
    cor: '#aec3bb',
    descricao:
      'Cartilagens, ligamentos e outros tecidos conjuntivos sustentam, conectam e separam estruturas. Entre suas funções estão estabilizar articulações e distribuir cargas mecânicas.',
  },
];

export interface Parte {
  id: string;
  nome: string;
  nomeOriginal?: string;
  idConceito: string;
  sistema: IdSistema;
  bloco: number;
  posicoes: number;
  normais: number;
  indices: number;
  quantidadeVertices: number;
  quantidadeIndices: number;
  limites: [number[], number[]];
}

export interface Conceito {
  id: string;
  nome: string;
  nomeOriginal?: string;
  elementos: string[];
}

export interface BlocoModelo {
  url: string;
  bytes: number;
  gzip?: string;
  bytesGzip?: number;
}

export interface Atlas {
  versao: string;
  sexo?: 'masculino';
  fonte?: string;
  escopo?: string;
  partes: Parte[];
  conceitos: Conceito[];
  blocos: BlocoModelo[];
  triangulos: number;
}

export type Vista = 'tres-quartos' | 'frente' | 'costas' | 'lateral';

export interface EstadoCena {
  inspetorAberto?: boolean;
  explosao: number;
  sistemasVisiveis: IdSistema[];
  selecionados: string[];
  isolar: boolean;
  vista: Vista;
  rotacionar: boolean;
  reinicio: number;
}

export const SISTEMAS_VISIVEIS_PADRAO: IdSistema[] = [
  'cardiaco',
  'sensorial',
  'esqueletico',
  'muscular',
  'arterial',
  'venoso',
  'nervoso',
  'respiratorio',
  'digestivo',
  'urinario',
  'linfatico',
  'endocrino',
  'reprodutor',
  'conjuntivo',
];

/** Explicações específicas para estruturas mais consultadas. */
export const EXPLICACOES: Record<string, string> = {
  heart:
    'Uma bomba muscular localizada no tórax. O lado direito envia sangue aos pulmões; o lado esquerdo envia sangue para a circulação sistêmica.',
  liver:
    'Um grande órgão localizado abaixo do lado direito do diafragma. Processa nutrientes absorvidos, produz bile e sintetiza diversas proteínas transportadas pelo sangue.',
  brain:
    'O órgão central do sistema nervoso. Suas regiões interligadas participam da percepção, movimento, memória, linguagem e regulação das funções corporais.',
  stomach:
    'Uma câmara muscular entre o esôfago e o intestino delgado. Armazena e mistura alimentos com ácido e enzimas antes de liberá-los no duodeno.',
  spleen:
    'Um órgão linfoide no quadrante superior esquerdo do abdome. Filtra o sangue, remove células sanguíneas envelhecidas e participa de respostas imunológicas.',
  pancreas:
    'Um órgão abdominal com funções digestivas e endócrinas. Fornece enzimas ao intestino delgado e libera hormônios, incluindo insulina e glucagon.',
  'urinary bladder':
    'Um reservatório muscular na pelve que armazena a urina proveniente dos rins por meio dos ureteres.',
  trachea:
    'A principal via aérea que conecta a laringe aos brônquios. Seus anéis cartilaginosos ajudam a manter a passagem de ar aberta durante a respiração.',
  diaphragm:
    'Um músculo amplo que separa o tórax do abdome. Ao se contrair, aumenta o volume torácico e auxilia a entrada de ar nos pulmões.',
};

const MAPA_SISTEMA_ORIGEM: Record<string, IdSistema> = {
  skeletal: 'esqueletico',
  muscular: 'muscular',
  cardiac: 'cardiaco',
  sensory: 'sensorial',
  arterial: 'arterial',
  venous: 'venoso',
  nervous: 'nervoso',
  respiratory: 'respiratorio',
  digestive: 'digestivo',
  urinary: 'urinario',
  lymphatic: 'linfatico',
  endocrine: 'endocrino',
  reproductive: 'reprodutor',
  integumentary: 'tegumentar',
  connective: 'conjuntivo',
};

/** Contrato mínimo do JSON original. Mantém os nomes da fonte somente na borda. */
interface AtlasOrigem {
  version: string;
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
    bounds: [number[], number[]];
  }>;
  concepts: Array<{id: string; name: string; nameEn?: string; elements: string[]}>;
  chunks: Array<{url: string; bytes: number; gzip?: string; gzipBytes?: number}>;
  triangles: number;
}

/**
 * Converte o JSON externo para o modelo interno em português.
 * Centralizar essa tradução evita espalhar nomes em inglês pelo restante do código.
 */
export function normalizarAtlas(dados: unknown): Atlas {
  const origem = dados as AtlasOrigem;

  if (!origem || !Array.isArray(origem.parts) || !Array.isArray(origem.concepts)) {
    throw new Error('O catálogo anatômico possui um formato inválido.');
  }

  return {
    versao: origem.version,
    sexo: origem.sex === 'male' ? 'masculino' : undefined,
    fonte: origem.source,
    escopo: origem.scope,
    partes: origem.parts.map((parte) => ({
      id: parte.id,
      nome: parte.name,
      nomeOriginal: parte.nameEn,
      idConceito: parte.conceptId,
      sistema: MAPA_SISTEMA_ORIGEM[parte.system] ?? 'conjuntivo',
      bloco: parte.chunk,
      posicoes: parte.positions,
      normais: parte.normals,
      indices: parte.indices,
      quantidadeVertices: parte.vertexCount,
      quantidadeIndices: parte.indexCount,
      limites: parte.bounds,
    })),
    conceitos: origem.concepts.map((conceito) => ({
      id: conceito.id,
      nome: conceito.name,
      nomeOriginal: conceito.nameEn,
      elementos: conceito.elements,
    })),
    blocos: origem.chunks.map((bloco) => ({
      url: bloco.url,
      bytes: bloco.bytes,
      gzip: bloco.gzip,
      bytesGzip: bloco.gzipBytes,
    })),
    triangulos: origem.triangles,
  };
}

/** Remove acentos e diferenças de caixa para tornar a busca mais tolerante. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Retorna o nome localizado já presente no manifesto PT-BR.
 *
 * Não existe fallback para inglês: se um rótulo não tiver sido localizado, o
 * script `gerar-atlas-ptbr.py` deve falhar durante a validação antes do build.
 */
export function obterNomeExibicao(nomeLocalizado: string): string {
  return nomeLocalizado;
}

/** Retorna uma explicação específica ou, como fallback, a descrição do sistema anatômico. */
export function obterExplicacao(nome: string, sistema: IdSistema): string {
  return (
    EXPLICACOES[nome.toLowerCase()] ??
    SISTEMAS.find((item) => item.id === sistema)?.descricao ??
    ''
  );
}
