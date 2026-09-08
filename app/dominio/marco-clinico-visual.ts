import type {Vista} from '../anatomia.ts';
import type {ConceitoIndexado} from './catalogo-anatomico.ts';
import type {FichaEstudoResolvida} from './estudo-detalhado.ts';

export type FormaDestaqueClinico =
  | 'triangulo'
  | 'circulo'
  | 'anel'
  | 'capsula'
  | 'retangulo';

export interface DestaqueClinico {
  id: string;
  titulo: string;
  forma: FormaDestaqueClinico;
  eixo: 'frontal' | 'sagital' | 'transversal';
  bilateral?: boolean;
  largura: number;
  altura: number;
  profundidade: number;
  deslocamento: [number, number, number];
  espelharX?: boolean;
  vistaPreferida?: Vista;
  partes: string[];
  cor: string;
}

interface EspecificacaoMarcoClinico
  extends Omit<DestaqueClinico, 'id' | 'titulo' | 'partes'> {
  termos: string[];
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function chaveBusca(item: ConceitoIndexado): string {
  return normalizar(
    [
      item.conceito.id,
      item.conceito.nome,
      item.conceito.nomeOriginal,
      ...item.aliases,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

const LARANJA = '#ff7f32';

export const ESPECIFICACOES_MARCO_CLINICO: Record<string, EspecificacaoMarcoClinico> = {
  'circulo-willis': {
    forma: 'anel',
    eixo: 'frontal',
    largura: 0.19,
    altura: 0.16,
    profundidade: 0.01,
    deslocamento: [0, 0, 0.025],
    vistaPreferida: 'frente',
    termos: ['cerebral arterial círculo', 'artéria comunicante anterior', 'artéria comunicante posterior', 'artéria cerebral anterior', 'artéria cerebral posterior', 'artéria carótida interna'],
    cor: LARANJA,
  },
  'nervo-optico-orbita': {
    forma: 'capsula',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.08,
    altura: 0.16,
    profundidade: 0.008,
    deslocamento: [0, 0, 0.025],
    vistaPreferida: 'frente',
    termos: ['nervo óptico', 'globo ocular', 'olho do lado direito', 'olho do lado esquerdo'],
    cor: LARANJA,
  },
  'hipofise-regiao-selar': {
    forma: 'circulo',
    eixo: 'frontal',
    largura: 0.09,
    altura: 0.09,
    profundidade: 0.008,
    deslocamento: [0, -0.015, 0.025],
    vistaPreferida: 'frente',
    termos: ['hipófise'],
    cor: LARANJA,
  },
  'circulacao-coronaria': {
    forma: 'anel',
    eixo: 'frontal',
    largura: 0.43,
    altura: 0.5,
    profundidade: 0.012,
    deslocamento: [0, 0, 0.03],
    vistaPreferida: 'frente',
    termos: ['coração', 'coronária'],
    cor: LARANJA,
  },
  'diafragma-hiatos': {
    forma: 'capsula',
    eixo: 'frontal',
    largura: 0.8,
    altura: 0.18,
    profundidade: 0.012,
    deslocamento: [0, -0.02, 0.02],
    vistaPreferida: 'frente',
    termos: ['diafragma', 'esôfago', 'aorta', 'veia cava inferior'],
    cor: LARANJA,
  },
  'triangulo-hesselbach': {
    forma: 'triangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.22,
    altura: 0.18,
    profundidade: 0.008,
    deslocamento: [-0.11, -0.08, 0.028],
    espelharX: true,
    vistaPreferida: 'frente',
    termos: ['artéria epigástrica inferior', 'veia epigástrica inferior'],
    cor: LARANJA,
  },
  'canal-inguinal-cordao-espermatico': {
    forma: 'capsula',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.22,
    altura: 0.09,
    profundidade: 0.008,
    deslocamento: [0, -0.03, 0.024],
    vistaPreferida: 'frente',
    termos: ['ducto deferente', 'artéria epigástrica inferior'],
    cor: LARANJA,
  },
  'tronco-celiaco': {
    forma: 'circulo',
    eixo: 'frontal',
    largura: 0.12,
    altura: 0.12,
    profundidade: 0.008,
    deslocamento: [0, 0, 0.03],
    vistaPreferida: 'frente',
    termos: ['celíaco tronco', 'artéria celíaco', 'aorta abdominal'],
    cor: LARANJA,
  },
  'arteria-mesenterica-superior': {
    forma: 'capsula',
    eixo: 'frontal',
    largura: 0.16,
    altura: 0.38,
    profundidade: 0.01,
    deslocamento: [0, -0.02, 0.028],
    vistaPreferida: 'frente',
    termos: ['artéria mesentérica superior'],
    cor: LARANJA,
  },
  'arteria-mesenterica-inferior': {
    forma: 'capsula',
    eixo: 'frontal',
    largura: 0.14,
    altura: 0.28,
    profundidade: 0.01,
    deslocamento: [0, -0.02, 0.028],
    vistaPreferida: 'frente',
    termos: ['artéria mesentérica inferior'],
    cor: LARANJA,
  },
  'colon-ceco-apendice': {
    forma: 'circulo',
    eixo: 'frontal',
    largura: 0.18,
    altura: 0.18,
    profundidade: 0.008,
    deslocamento: [0, 0, 0.025],
    vistaPreferida: 'frente',
    termos: ['ceco', 'apêndice vermiforme'],
    cor: LARANJA,
  },
  'fossa-cubital': {
    forma: 'retangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.2,
    altura: 0.1,
    profundidade: 0.008,
    deslocamento: [0, 0, 0.024],
    vistaPreferida: 'frente',
    termos: ['artéria braquial', 'artéria radial', 'artéria ulnar', 'veia cubital mediano'],
    cor: LARANJA,
  },
  'tunel-carpo': {
    forma: 'retangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.16,
    altura: 0.07,
    profundidade: 0.008,
    deslocamento: [0, 0, 0.022],
    vistaPreferida: 'frente',
    termos: ['flexor retináculo do punho', 'osso do carpo'],
    cor: LARANJA,
  },
  'tabaqueira-anatomica': {
    forma: 'triangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.11,
    altura: 0.1,
    profundidade: 0.008,
    deslocamento: [0, 0, 0.02],
    vistaPreferida: 'frente',
    termos: ['artéria radial', 'metacarpo 1º'],
    cor: LARANJA,
  },
  'triangulo-femoral': {
    forma: 'triangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.27,
    altura: 0.2,
    profundidade: 0.01,
    deslocamento: [0, 0.02, 0.026],
    vistaPreferida: 'frente',
    termos: ['artéria femoral', 'veia femoral', 'sartório', 'adutor longo'],
    cor: LARANJA,
  },
  'regiao-glutea-quadrantes': {
    forma: 'retangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.26,
    altura: 0.18,
    profundidade: 0.01,
    deslocamento: [0.06, 0.06, -0.03],
    espelharX: true,
    vistaPreferida: 'costas',
    termos: ['glúteo médio', 'fêmur', 'pelve'],
    cor: LARANJA,
  },
  'fossa-poplitea': {
    forma: 'retangulo',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.23,
    altura: 0.12,
    profundidade: 0.008,
    deslocamento: [0, -0.02, -0.024],
    vistaPreferida: 'costas',
    termos: ['artéria poplítea', 'veia poplítea'],
    cor: LARANJA,
  },
  'tendao-calcaneo-retrope': {
    forma: 'capsula',
    eixo: 'frontal',
    bilateral: true,
    largura: 0.12,
    altura: 0.25,
    profundidade: 0.008,
    deslocamento: [0, 0, -0.024],
    vistaPreferida: 'costas',
    termos: ['tendão calcâneo', 'calcâneo'],
    cor: LARANJA,
  },
};

export function resolverDestaqueClinico(
  ficha: FichaEstudoResolvida,
  indice: ConceitoIndexado[],
): DestaqueClinico | null {
  const especificacao = ESPECIFICACOES_MARCO_CLINICO[ficha.id];
  if (!especificacao) return null;

  const partes = new Set<string>();
  especificacao.termos.forEach((termo) => {
    const termoNormalizado = normalizar(termo);
    indice.forEach((item) => {
      if (chaveBusca(item).includes(termoNormalizado)) {
        item.conceito.elementos.forEach((elemento) => partes.add(elemento));
      }
    });
  });

  if (partes.size === 0) {
    ficha.conceitosRelacionados
      .slice(0, especificacao.bilateral ? 8 : 4)
      .forEach((item) => item.conceito.elementos.forEach((elemento) => partes.add(elemento)));
  }

  return {
    id: ficha.id,
    titulo: ficha.titulo,
    forma: especificacao.forma,
    eixo: especificacao.eixo,
    bilateral: especificacao.bilateral,
    largura: especificacao.largura,
    altura: especificacao.altura,
    profundidade: especificacao.profundidade,
    deslocamento: especificacao.deslocamento,
    espelharX: especificacao.espelharX,
    vistaPreferida: especificacao.vistaPreferida,
    partes: [...partes],
    cor: especificacao.cor,
  };
}
