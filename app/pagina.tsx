import {flushSync} from 'react-dom';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Copy,
  Focus,
  BookOpenCheck,
  GraduationCap,
  Info,
  Layers3,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  X,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import CenaAnatomia from './cena.tsx';
import ArvoreAnatomica from './componentes/arvore-anatomica.tsx';
import CentralResidencia, {type Resposta3DResidencia} from './componentes/central-residencia.tsx';
import CentralEstudoAvancado from './componentes/central-estudo-avancado.tsx';
import MetricasCena from './componentes/metricas-cena.tsx';
import {registrarFerramentasAtlas} from './ferramentas-agente.ts';
import {
  EXPLICACOES,
  SISTEMAS,
  SISTEMAS_VISIVEIS_PADRAO,
  normalizarAtlas,
  parteVisivelNoEstado,
  obterExplicacao,
  obterNomeExibicao,
  type Atlas,
  type Conceito,
  type EstadoCena,
  type IdSistema,
  type MetricasRenderizacao,
  type Vista,
} from './anatomia.ts';
import {
  buscarConceitos,
  construirHierarquia,
  criarIndiceAnatomico,
  descricaoCategoria,
  encontrarRelacionados,
  nomeCategoria,
  nomeRegiao,
  type ConceitoIndexado,
} from './dominio/catalogo-anatomico.ts';
import {
  fichasRelacionadasAoConceito,
  resolverFichasEstudoDetalhado,
  type FichaEstudoResolvida,
} from './dominio/estudo-detalhado.ts';
import {resolverDestaqueClinico} from './dominio/marco-clinico-visual.ts';
import type {RotaEstudoResolvida} from './dominio/rotas-estudo-avancado.ts';
import {
  PROGRESSO_RESIDENCIA_VAZIO,
  type ProgressoResidencia,
  type QuestaoResidencia,
} from './dominio/estudo-residencia.ts';
import {
  carregarProgressoResidencia,
  limparProgressoResidencia,
  salvarProgressoResidencia,
} from './servicos/progresso-residencia.ts';
import {carregarPreferencias, salvarPreferencias} from './servicos/preferencias.ts';
import {
  atualizarEstruturaNaUrl,
  copiarLinkEstrutura,
  lerEstruturaDaUrl,
} from './servicos/navegacao-url.ts';

/** Estado padrão aplicado na primeira abertura e no botão de reinício. */
const ESTADO_INICIAL: EstadoCena = {
  explosao: 0,
  sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO,
  selecionados: [],
  relacionados: [],
  isolar: false,
  filtrarContexto: false,
  destaqueClinico: null,
  realceClinicoVisivel: true,
  foco: 0,
  vista: 'tres-quartos',
  rotacionar: false,
  reinicio: 0,
};

const VISTAS: Array<{id: Vista; rotulo: string; simbolo: string}> = [
  {id: 'tres-quartos', rotulo: 'Vista em três quartos', simbolo: '¾'},
  {id: 'frente', rotulo: 'Vista anterior', simbolo: 'A'},
  {id: 'costas', rotulo: 'Vista posterior', simbolo: 'P'},
  {id: 'lateral-direita', rotulo: 'Vista lateral direita', simbolo: 'D'},
  {id: 'lateral-esquerda', rotulo: 'Vista lateral esquerda', simbolo: 'E'},
  {id: 'superior', rotulo: 'Vista superior', simbolo: '↑'},
  {id: 'inferior', rotulo: 'Vista inferior', simbolo: '↓'},
];

type Painel = 'camadas' | 'busca' | 'hierarquia' | 'residencia' | 'avancado' | null;

function normalizarTextoLivre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Página principal do Atlas Anatômico 3D V2.
 *
 * A UI apenas coordena estado e apresentação. Busca, classificação,
 * persistência, URL e validação do manifesto ficam em módulos separados para
 * reduzir acoplamento e facilitar testes.
 */
export default function PaginaInicial() {
  const tituloDetalhe = useRef<HTMLHeadingElement>(null);
  const urlInicialAplicada = useRef(false);
  const preferenciasCarregadas = useRef(false);

  const [atlas, definirAtlas] = useState<Atlas | null>(null);
  const [estado, definirEstado] = useState<EstadoCena>(ESTADO_INICIAL);
  const [progresso, definirProgresso] = useState(0);
  const [erro, definirErro] = useState('');
  const [painel, definirPainel] = useState<Painel>(null);
  const [detalhes, definirDetalhes] = useState(false);
  const [sobre, definirSobre] = useState(false);
  const [consulta, definirConsulta] = useState('');
  const [escolhido, definirEscolhido] = useState<Conceito | null>(null);
  const [metricas, definirMetricas] = useState<MetricasRenderizacao>({
    fps: 0,
    chamadas: 0,
    triangulos: 0,
    geometrias: 0,
    texturas: 0,
  });
  const [mostrarMetricas, definirMostrarMetricas] = useState(false);
  const [mensagemLink, definirMensagemLink] = useState('');
  const [comparacao, definirComparacao] = useState<ConceitoIndexado | null>(null);
  const [fichaAtivaId, definirFichaAtivaId] = useState<string | null>(null);
  const [buscaGuia, definirBuscaGuia] = useState('');
  const [rotaAvancadaAtiva, definirRotaAvancadaAtiva] = useState<{rota: string; etapa: string} | null>(null);

  const [progressoResidencia, definirProgressoResidencia] =
    useState<ProgressoResidencia>(PROGRESSO_RESIDENCIA_VAZIO);
  const [questaoResidencia, definirQuestaoResidencia] =
    useState<QuestaoResidencia | null>(null);
  const [respostaResidencia3D, definirRespostaResidencia3D] =
    useState<Resposta3DResidencia | null>(null);

  /** Restaura somente preferências de visualização; seleção não é persistida. */
  useEffect(() => {
    const preferencias = carregarPreferencias({
      explosao: ESTADO_INICIAL.explosao,
      sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO,
      vista: ESTADO_INICIAL.vista,
      mostrarMetricas: false,
    });
    definirEstado((anterior) => ({
      ...anterior,
      explosao: preferencias.explosao,
      sistemasVisiveis: preferencias.sistemasVisiveis,
      vista: preferencias.vista,
    }));
    definirMostrarMetricas(preferencias.mostrarMetricas);
    preferenciasCarregadas.current = true;
  }, []);

  useEffect(() => {
    if (preferenciasCarregadas.current) {
      salvarPreferencias(estado, mostrarMetricas);
    }
  }, [estado.explosao, estado.sistemasVisiveis, estado.vista, mostrarMetricas]);

  /** Progresso de estudo é local e independente das preferências visuais. */
  useEffect(() => {
    definirProgressoResidencia(carregarProgressoResidencia());
  }, []);

  const atualizarProgressoResidencia = (proximo: ProgressoResidencia) => {
    definirProgressoResidencia(proximo);
    salvarProgressoResidencia(proximo);
  };

  /** Carrega o manifesto e o valida com schema antes de chegar ao domínio. */
  useEffect(() => {
    const controlador = new AbortController();
    definirProgresso(0);
    definirErro('');
    definirAtlas(null);

    fetch('/models/atlas.json', {signal: controlador.signal})
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Não foi possível carregar o catálogo anatômico.');
        return resposta.json();
      })
      .then((dados) => definirAtlas(normalizarAtlas(dados)))
      .catch((falha: Error) => {
        if (falha.name !== 'AbortError') definirErro(falha.message);
      });

    return () => controlador.abort();
  }, []);

  /** Atalho “/” abre a busca quando o foco não está em um campo de texto. */
  useEffect(() => {
    const tratarTecla = (evento: KeyboardEvent) => {
      const alvoEhCampo =
        evento.target instanceof HTMLInputElement ||
        evento.target instanceof HTMLTextAreaElement;
      if (evento.key === '/' && !alvoEhCampo) {
        evento.preventDefault();
        definirPainel('busca');
        definirDetalhes(false);
        definirRotaAvancadaAtiva(null);
      }
      if (evento.key.toLowerCase() === 'h' && !alvoEhCampo && !evento.ctrlKey && !evento.metaKey) {
        definirEstado((anterior) =>
          anterior.destaqueClinico
            ? {...anterior, realceClinicoVisivel: !anterior.realceClinicoVisivel}
            : anterior,
        );
      }
      if (evento.key === 'Escape') {
        definirPainel(null);
        definirQuestaoResidencia(null);
        definirRespostaResidencia3D(null);
        definirFichaAtivaId(null);
        definirRotaAvancadaAtiva(null);
        definirEstado((anterior) => ({
          ...anterior,
          selecionados: [],
          relacionados: [],
          isolar: false,
          filtrarContexto: false,
          destaqueClinico: null,
        }));
      }
    };
    window.addEventListener('keydown', tratarTecla);
    return () => window.removeEventListener('keydown', tratarTecla);
  }, []);

  const partesPorId = useMemo(
    () => new Map(atlas?.partes.map((parte) => [parte.id, parte])),
    [atlas],
  );
  const conceitosPorId = useMemo(
    () => new Map(atlas?.conceitos.map((conceito) => [conceito.id, conceito])),
    [atlas],
  );
  const indice = useMemo(() => (atlas ? criarIndiceAnatomico(atlas) : []), [atlas]);
  const indicePorId = useMemo(
    () => new Map(indice.map((item) => [item.conceito.id, item])),
    [indice],
  );
  const hierarquia = useMemo(() => construirHierarquia(indice), [indice]);
  const fichasDetalhadas = useMemo(() => resolverFichasEstudoDetalhado(indice), [indice]);
  const fichaAtiva = useMemo(
    () => fichasDetalhadas.find((ficha) => ficha.id === fichaAtivaId) ?? null,
    [fichasDetalhadas, fichaAtivaId],
  );
  const guiasFiltrados = useMemo(() => {
    const termo = normalizarTextoLivre(buscaGuia);
    if (!termo) return fichasDetalhadas;

    return fichasDetalhadas.filter((ficha) =>
      normalizarTextoLivre(
        [ficha.titulo, ficha.resumo, ...ficha.gatilhos, ...ficha.estruturasChave].join(' '),
      ).includes(termo),
    );
  }, [fichasDetalhadas, buscaGuia]);

  const contagens = useMemo(
    () =>
      Object.fromEntries(
        SISTEMAS.map((sistema) => [
          sistema.id,
          atlas?.partes.filter((parte) => parte.sistema === sistema.id).length ?? 0,
        ]),
      ) as Record<IdSistema, number>,
    [atlas],
  );

  const sistemasAtivos = SISTEMAS.filter((sistema) => contagens[sistema.id] > 0);
  const partesSelecionadas = estado.selecionados
    .map((id) => partesPorId.get(id))
    .filter((parte) => !!parte);
  const parteSelecionada = partesSelecionadas[0];
  const sistemaSelecionado = SISTEMAS.find(
    (sistema) => sistema.id === parteSelecionada?.sistema,
  );
  const itemEscolhido = escolhido ? indicePorId.get(escolhido.id) : undefined;
  const relacionados = useMemo(
    () => (itemEscolhido ? encontrarRelacionados(indice, itemEscolhido, 8) : []),
    [indice, itemEscolhido],
  );
  const idsRelacionados = useMemo(
    () => relacionados.flatMap((item) => item.conceito.elementos),
    [relacionados],
  );
  const fichasDoConceito = useMemo(
    () => (itemEscolhido ? fichasRelacionadasAoConceito(fichasDetalhadas, itemEscolhido, 6) : []),
    [fichasDetalhadas, itemEscolhido],
  );
  const fichasVisiveis = useMemo(() => {
    const mapa = new Map<string, FichaEstudoResolvida>();
    if (fichaAtiva) mapa.set(fichaAtiva.id, fichaAtiva);
    fichasDoConceito.forEach((ficha) => mapa.set(ficha.id, ficha));
    return [...mapa.values()];
  }, [fichaAtiva, fichasDoConceito]);
  const contextoAtivo = estado.relacionados.length > 0;

  const quantidadeVisivel =
    atlas?.partes.filter((parte) => parteVisivelNoEstado(parte, estado)).length ?? 0;

  /** Busca semântica leve: PT-BR, aliases, FMA, inglês interno e fuzzy curto. */
  const resultados = useMemo(() => {
    if (!atlas) return [];
    if (consulta.trim()) return buscarConceitos(indice, consulta, 80);

    const destaques = [
      'heart',
      'brain',
      'liver',
      'stomach',
      'spleen',
      'pancreas',
      'urinary bladder',
      'trachea',
    ];
    return destaques
      .map((nome) =>
        indice.find((item) => item.conceito.nomeOriginal?.toLowerCase() === nome),
      )
      .filter((item): item is ConceitoIndexado => !!item);
  }, [atlas, indice, consulta]);

  const selecionarConceito = (
    conceito: Conceito,
    abrirDetalhe = true,
    opcoes?: {fichaId?: string | null; relacionados?: string[]; filtrarContexto?: boolean; destaqueClinico?: EstadoCena['destaqueClinico']},
  ) => {
    definirEscolhido(conceito);
    definirEstado((anterior) => ({
      ...anterior,
      selecionados: conceito.elementos,
      relacionados: opcoes?.relacionados ?? [],
      isolar: false,
      filtrarContexto: opcoes?.filtrarContexto ?? false,
      destaqueClinico: opcoes?.destaqueClinico ?? null,
      realceClinicoVisivel: opcoes?.destaqueClinico ? true : anterior.realceClinicoVisivel,
      foco: anterior.foco + 1,
      rotacionar: false,
    }));
    atualizarEstruturaNaUrl(conceito.id);
    definirDetalhes(abrirDetalhe);
    definirPainel(null);
    definirMensagemLink('');
    definirComparacao(null);
    definirRotaAvancadaAtiva(null);
    definirFichaAtivaId(opcoes?.fichaId ?? null);
  };

  const aplicarFichaEstudo = (ficha: FichaEstudoResolvida) => {
    const ancora = ficha.conceitosRelacionados[0];
    if (!ancora) return;
    const destaqueClinico = ficha.tipo === 'marco-clinico'
      ? resolverDestaqueClinico(ficha, indice)
      : null;
    const idsRelacionadosFicha = [
      ...new Set(
        ficha.conceitosRelacionados
          .slice(1)
          .flatMap((item) => item.conceito.elementos),
      ),
    ];
    selecionarConceito(ancora.conceito, true, {
      fichaId: ficha.id,
      relacionados: idsRelacionadosFicha,
      filtrarContexto: true,
      destaqueClinico,
    });
    if (destaqueClinico?.vistaPreferida) {
      definirEstado((anterior) => ({
        ...anterior,
        vista: destaqueClinico.vistaPreferida!,
      }));
    }
  };

  /** Abre diretamente a estrutura compartilhada em #estrutura=FMA:... */
  useEffect(() => {
    if (!atlas || urlInicialAplicada.current) return;
    urlInicialAplicada.current = true;
    const id = lerEstruturaDaUrl();
    if (!id) return;
    const conceito = conceitosPorId.get(id);
    if (conceito) selecionarConceito(conceito);
  }, [atlas, conceitosPorId]);

  /** Registra integração opcional com ferramentas de IA do navegador. */
  useEffect(() => {
    if (!atlas) return;
    return registrarFerramentasAtlas(atlas, (conceito) =>
      flushSync(() => selecionarConceito(conceito)),
    );
  }, [atlas]);

  const selecionarParte = (id: string) => {
    const parte = partesPorId.get(id);
    if (!parte) return;

    if (questaoResidencia?.tipo === 'localizacao-3d') {
      const conceitoClicado = conceitosPorId.get(parte.idConceito);
      const acertouEstrutura = questaoResidencia.conceito.conceito.elementos.includes(id);
      definirRespostaResidencia3D({
        questaoId: questaoResidencia.id,
        // Conceitos agregados podem conter várias peças com ids de conceito
        // diferentes. A correção usa a associação peça → conceito-alvo.
        conceitoId: acertouEstrutura
          ? questaoResidencia.respostaCorreta
          : (conceitoClicado?.id ?? parte.idConceito),
        instante: Date.now(),
      });
      definirEstado((anterior) => ({
        ...anterior,
        selecionados: [id],
        relacionados: [],
        destaqueClinico: null,
        foco: anterior.foco + 1,
        rotacionar: false,
      }));
      return;
    }

    const conceito = conceitosPorId.get(parte.idConceito) ?? {
      id: parte.idConceito,
      nome: parte.nome,
      nomeOriginal: parte.nomeOriginal,
      elementos: [id],
    };
    selecionarConceito(conceito);
  };

  const alternarSistema = (id: IdSistema) => {
    definirDetalhes(false);
    definirEstado((anterior) => ({
      ...anterior,
      selecionados: [],
      relacionados: [],
      isolar: false,
      filtrarContexto: false,
          destaqueClinico: null,
      sistemasVisiveis: anterior.sistemasVisiveis.includes(id)
        ? anterior.sistemasVisiveis.filter((item) => item !== id)
        : [...anterior.sistemasVisiveis, id],
    }));
    atualizarEstruturaNaUrl(null);
  };

  const reiniciar = () => {
    definirEstado((anterior) => ({
      ...ESTADO_INICIAL,
      sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO,
      reinicio: anterior.reinicio + 1,
      foco: anterior.foco + 1,
    }));
    definirEscolhido(null);
    definirDetalhes(false);
    definirPainel(null);
    definirQuestaoResidencia(null);
    definirRespostaResidencia3D(null);
    definirComparacao(null);
    definirFichaAtivaId(null);
    definirRotaAvancadaAtiva(null);
    atualizarEstruturaNaUrl(null);
  };

  const abrirPainel = (proximo: Exclude<Painel, null>) => {
    definirDetalhes(false);
    if (painel === 'residencia') {
      definirQuestaoResidencia(null);
      definirRespostaResidencia3D(null);
      definirEstado((anterior) => ({
        ...anterior,
        selecionados: [],
        relacionados: [],
        isolar: false,
        filtrarContexto: false,
          destaqueClinico: null,
      }));
    }
    if (proximo !== 'hierarquia') definirFichaAtivaId(null);
    if (proximo !== 'avancado' || painel === proximo) definirRotaAvancadaAtiva(null);
    definirPainel(painel === proximo ? null : proximo);
  };

  const nomeEscolhido = escolhido ? obterNomeExibicao(escolhido.nome) : '';
  const descricaoEscolhida =
    escolhido && parteSelecionada
      ? EXPLICACOES[(escolhido.nomeOriginal ?? escolhido.nome).toLowerCase()] ??
        (itemEscolhido
          ? descricaoCategoria(itemEscolhido.categoria, parteSelecionada.sistema)
          : obterExplicacao(
              escolhido.nomeOriginal ?? escolhido.nome,
              parteSelecionada.sistema,
            ))
      : '';

  return (
    <main className="studio">
      {atlas && (
        <CenaAnatomia
          atlas={atlas}
          estado={{
            ...estado,
            inspetorAberto: detalhes && partesSelecionadas.length > 0,
          }}
          aoSelecionar={selecionarParte}
          aoProgredir={(valor) => {
            definirProgresso(valor);
            if (valor === 100) definirErro('');
          }}
          aoFalhar={definirErro}
          aoMetricas={definirMetricas}
        />
      )}

      <div className="vignette" />

      <header className="identity">
        <div className="eyebrow"><span className="status-dot" /> ANATOMIA INTERATIVA</div>
        <h1>
          Anatomia Humana
          <Badge variant="outline" className="edition">V2</Badge>
        </h1>
        <div className="identity-meta">
          {atlas ? atlas.partes.length.toLocaleString('pt-BR') : '2.234'} peças modeladas
          <span>·</span> BodyParts3D <span>·</span> PT-BR
        </div>
      </header>

      <nav className="top-actions" aria-label="Ferramentas do explorador">
        <Button
          variant="ghost"
          className={painel === 'busca' ? 'active' : ''}
          onClick={() => abrirPainel('busca')}
          aria-label="Buscar na anatomia"
        >
          <Search size={18} /><span>Buscar</span><kbd>/</kbd>
        </Button>
        <Button
          variant="ghost"
          className={painel === 'hierarquia' ? 'active' : ''}
          onClick={() => abrirPainel('hierarquia')}
        >
          <Layers3 size={18} /><span>Explorar</span>
        </Button>
        <Button
          variant="ghost"
          className={painel === 'residencia' ? 'active' : ''}
          onClick={() => abrirPainel('residencia')}
        >
          <GraduationCap size={17} /><span>Residência</span>
        </Button>
        <Button
          variant="ghost"
          className={painel === 'avancado' ? 'active' : ''}
          onClick={() => abrirPainel('avancado')}
        >
          <BookOpenCheck size={17} /><span>Avançado</span>
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          aria-label="Sobre este atlas"
          onClick={() => {
            definirDetalhes(false);
            definirPainel(null);
            definirQuestaoResidencia(null);
            definirRespostaResidencia3D(null);
            definirEstado((anterior) => ({
              ...anterior,
              selecionados: [],
              relacionados: [],
              isolar: false,
              filtrarContexto: false,
          destaqueClinico: null,
            }));
            definirFichaAtivaId(null);
            definirRotaAvancadaAtiva(null);
            definirSobre(true);
          }}
        >
          <Info size={18} />
        </Button>
      </nav>

      <section
        className={`layers-panel glass ${painel === 'camadas' ? 'mobile-open' : ''}`}
        aria-label="Camadas anatômicas"
      >
        <div className="panel-heading">
          <span>Sistemas</span>
          <Button
            variant="ghost"
            className="mobile-only icon-button"
            onClick={() => definirPainel(null)}
            aria-label="Fechar sistemas"
          ><X size={18} /></Button>
          <Badge variant="secondary" className="desktop-only small-number">{sistemasAtivos.length}</Badge>
        </div>

        <div className="layer-presets">
          <Button
            variant="ghost"
            aria-pressed={sistemasAtivos.every((sistema) => estado.sistemasVisiveis.includes(sistema.id))}
            onClick={() => definirEstado((anterior) => ({
              ...anterior,
              selecionados: [], relacionados: [], isolar: false,
              filtrarContexto: false,
              destaqueClinico: null,
              sistemasVisiveis: sistemasAtivos.map((sistema) => sistema.id),
            }))}
          >Todos</Button>
          <Button
            variant="ghost"
            aria-pressed={estado.sistemasVisiveis.length === 1 && estado.sistemasVisiveis[0] === 'esqueletico'}
            onClick={() => definirEstado((anterior) => ({
              ...anterior,
              selecionados: [], relacionados: [], isolar: false,
              filtrarContexto: false,
              destaqueClinico: null,
              sistemasVisiveis: ['esqueletico'],
            }))}
          >Esqueleto</Button>
          <Button
            variant="ghost"
            onClick={() => definirEstado((anterior) => ({
              ...anterior,
              selecionados: [], relacionados: [], isolar: false,
              filtrarContexto: false,
              destaqueClinico: null,
              sistemasVisiveis: ['cardiaco','respiratorio','digestivo','urinario','endocrino','reprodutor'],
            }))}
          >Órgãos</Button>
        </div>

        <div className="system-list">
          {sistemasAtivos.map((sistema) => (
            <div
              className={`system-row ${estado.sistemasVisiveis.includes(sistema.id) ? 'enabled' : ''}`}
              key={sistema.id}
            >
              <Button
                variant="ghost"
                className="system-name"
                title={`Exibir somente ${sistema.nome.toLowerCase()}`}
                onClick={() => definirEstado((anterior) => ({
                  ...anterior,
                  sistemasVisiveis: [sistema.id], selecionados: [], relacionados: [], isolar: false,
                  filtrarContexto: false,
                  destaqueClinico: null,
                }))}
              >
                <span className="system-dot" style={{background: sistema.cor}} />
                {sistema.nome}<span className="system-count">{contagens[sistema.id]}</span>
              </Button>
              <Switch
                checked={estado.sistemasVisiveis.includes(sistema.id)}
                onCheckedChange={() => alternarSistema(sistema.id)}
                aria-label={`Exibir ${sistema.nome.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        <div className="panel-foot">
          <span>{quantidadeVisivel.toLocaleString('pt-BR')} peças visíveis</span>
          <Button variant="ghost" onClick={() => definirEstado((anterior) => ({
            ...anterior, sistemasVisiveis: [], selecionados: [], relacionados: [], isolar: false,
            filtrarContexto: false,
            destaqueClinico: null,
          }))}>Ocultar tudo</Button>
        </div>
      </section>

      {painel === 'busca' && (
        <section className="search-panel glass" aria-label="Buscar na anatomia">
          <div className="panel-heading">
            <span>Busca anatômica</span>
            <Button variant="ghost" className="icon-button" onClick={() => definirPainel(null)} aria-label="Fechar busca"><X size={18} /></Button>
          </div>
          <Combobox<ConceitoIndexado>
            items={resultados}
            value={null}
            onValueChange={(valor) => valor && selecionarConceito(valor.conceito)}
            inputValue={consulta}
            onInputValueChange={definirConsulta}
            itemToStringLabel={(item) => item.conceito.nome}
            filter={null}
            open
            onOpenChange={(aberto) => !aberto && definirPainel(null)}
          >
            <ComboboxInput
              autoFocus
              placeholder="Fêmur, omoplata, artéria radial, FMA…"
              aria-label="Buscar estruturas anatômicas"
              showTrigger={false}
            />
            <ComboboxContent className="anatomy-search-results">
              <ComboboxEmpty>Nenhuma estrutura corresponde à sua busca.</ComboboxEmpty>
              <ComboboxList>
                {(item: ConceitoIndexado) => (
                  <ComboboxItem key={item.conceito.id} value={item}>
                    <span className="search-result-copy">
                      <span className="search-result-name">{item.conceito.nome}</span>
                      <span className="search-result-path">{nomeRegiao(item.regiao)} · {nomeCategoria(item.categoria)}</span>
                    </span>
                    <span className="small-number">{item.conceito.elementos.length} {item.conceito.elementos.length === 1 ? 'peça' : 'peças'}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <p className="search-note">
            Aceita sinônimos, nomes sem acento, identificadores FMA e pequenos erros de digitação.
          </p>
        </section>
      )}

      {painel === 'hierarquia' && (
        <section className="hierarchy-panel glass" aria-label="Explorar anatomia por hierarquia">
          <div className="panel-heading">
            <span>Explorar por hierarquia</span>
            <Button variant="ghost" className="icon-button" onClick={() => definirPainel(null)} aria-label="Fechar hierarquia"><X size={18} /></Button>
          </div>
          <p className="hierarchy-intro">Sistema → região → categoria → estrutura</p>
          <div className="guide-library">
            <div className="section-title"><strong>Guias de prova</strong><span>{guiasFiltrados.length} / {fichasDetalhadas.length} roteiros</span></div>
            <p className="guide-library-note">Marcos clínicos e correlações cirúrgicas para estudar com apoio visual do modelo.</p>
            <input
              className="guide-search-input"
              type="search"
              placeholder="Filtrar guias por tema, órgão ou marco anatômico"
              value={buscaGuia}
              onChange={(evento) => definirBuscaGuia(evento.target.value)}
              aria-label="Filtrar guias de prova"
            />
            <div className="guide-library-list">
              {guiasFiltrados.map((ficha) => (
                <button
                  key={ficha.id}
                  type="button"
                  className={`guide-library-item ${fichaAtivaId === ficha.id ? 'active' : ''}`}
                  onClick={() => aplicarFichaEstudo(ficha)}
                >
                  <span className="guide-library-copy">
                    <strong>{ficha.titulo}</strong>
                    <small>{ficha.resumo}</small>
                  </span>
                  <BookOpenCheck size={15} />
                </button>
              ))}
              {guiasFiltrados.length === 0 && (
                <div className="guide-empty-state">Nenhum guia encontrado para esse filtro.</div>
              )}
            </div>
          </div>
          <ArvoreAnatomica grupos={hierarquia} aoSelecionar={selecionarConceito} />
        </section>
      )}

      {painel === 'avancado' && atlas && (
        <CentralEstudoAvancado
          indice={indice}
          aoVisualizar={(principal, relacionadosRota, rota: RotaEstudoResolvida, etapaIndice) => {
            const etapa = rota.etapas[etapaIndice];
            definirEscolhido(principal.conceito);
            definirComparacao(null);
            definirDetalhes(false);
            definirRotaAvancadaAtiva({rota: rota.titulo, etapa: etapa?.titulo ?? ''});
            definirEstado((anterior) => ({
              ...anterior,
              selecionados: principal.conceito.elementos,
              relacionados: [
                ...new Set(relacionadosRota.flatMap((item) => item.conceito.elementos)),
              ],
              isolar: false,
              filtrarContexto: true,
              destaqueClinico: null,
              explosao: 0,
              foco: anterior.foco + 1,
              rotacionar: false,
            }));
          }}
          aoEncerrar={() => {
            definirPainel(null);
            definirRotaAvancadaAtiva(null);
            definirEstado((anterior) => ({
              ...anterior,
              selecionados: [],
              relacionados: [],
              isolar: false,
              filtrarContexto: false,
          destaqueClinico: null,
            }));
          }}
        />
      )}

      {painel === 'residencia' && atlas && (
        <CentralResidencia
          indice={indice}
          progresso={progressoResidencia}
          resposta3D={respostaResidencia3D}
          aoAtualizarProgresso={atualizarProgressoResidencia}
          aoQuestaoAtiva={(questao) => {
            definirQuestaoResidencia(questao);
            definirRespostaResidencia3D(null);
            definirDetalhes(false);
            if (!questao) {
              definirEstado((anterior) => ({
                ...anterior,
                selecionados: [],
                relacionados: [],
                isolar: false,
                filtrarContexto: false,
          destaqueClinico: null,
              }));
              return;
            }
            if (questao.tipo === 'identificacao') {
              definirEstado((anterior) => ({
                ...anterior,
                selecionados: questao.conceito.conceito.elementos,
                relacionados: [],
                isolar: false,
                filtrarContexto: false,
          destaqueClinico: null,
                explosao: 0,
                foco: anterior.foco + 1,
                rotacionar: false,
              }));
            } else {
              definirEstado((anterior) => ({
                ...anterior,
                selecionados: [],
                relacionados: [],
                isolar: false,
                filtrarContexto: false,
          destaqueClinico: null,
                rotacionar: false,
              }));
            }
          }}
          aoEncerrar={() => {
            definirQuestaoResidencia(null);
            definirRespostaResidencia3D(null);
            definirPainel(null);
            definirFichaAtivaId(null);
            definirEstado((anterior) => ({
              ...anterior,
              selecionados: [],
              relacionados: [],
              isolar: false,
              filtrarContexto: false,
          destaqueClinico: null,
            }));
          }}
          aoLimparProgresso={() => {
            limparProgressoResidencia();
            definirProgressoResidencia(PROGRESSO_RESIDENCIA_VAZIO);
          }}
        />
      )}

      <nav className="view-controls glass" aria-label="Controles da câmera">
        {VISTAS.map((vista) => (
          <Button
            variant="ghost"
            key={vista.id}
            className={estado.vista === vista.id ? 'active' : ''}
            aria-pressed={estado.vista === vista.id}
            disabled={estado.explosao > 0.8 && vista.id !== 'frente'}
            onClick={() => definirEstado((anterior) => ({
              ...anterior, vista: vista.id, reinicio: anterior.reinicio + 1, rotacionar: false,
            }))}
            title={vista.rotulo}
            aria-label={vista.rotulo}
          ><span>{vista.simbolo}</span></Button>
        ))}
        <i />
        <Button
          variant="ghost"
          disabled={estado.explosao >= 0.4}
          aria-label={estado.rotacionar ? 'Pausar rotação' : 'Rotacionar corpo'}
          title="Rotação automática"
          className={estado.rotacionar ? 'active' : ''}
          onClick={() => definirEstado((anterior) => ({...anterior, rotacionar: !anterior.rotacionar}))}
        >{estado.rotacionar ? <Pause size={17} /> : <RotateCw size={18} />}</Button>
        <Button variant="ghost" aria-label="Redefinir vista e camadas" title="Redefinir" onClick={reiniciar}><RotateCcw size={17} /></Button>
      </nav>

      <div className="scene-caption">
        <span className="caption-line" />
        <span>
          {rotaAvancadaAtiva
            ? `${rotaAvancadaAtiva.rota.toUpperCase()} · ${rotaAvancadaAtiva.etapa.toUpperCase()} · ${quantidadeVisivel} PEÇAS`
            : estado.filtrarContexto && fichaAtiva
              ? `GUIA: ${fichaAtiva.titulo.toUpperCase()} · ${quantidadeVisivel} PEÇAS`
              : questaoResidencia?.tipo === 'localizacao-3d'
              ? `QUESTÃO: LOCALIZE ${questaoResidencia.conceito.conceito.nome.toUpperCase()}`
            : questaoResidencia?.tipo === 'identificacao'
              ? 'QUESTÃO: IDENTIFIQUE A ESTRUTURA DESTACADA'
              : estado.isolar
              ? nomeEscolhido || 'ESTRUTURA SELECIONADA'
              : estado.explosao > 0.95
                ? 'INVENTÁRIO ANATÔMICO'
                : estado.explosao > 0.05
                  ? 'ESTRUTURAS SEPARADAS'
                  : 'HUMANO ADULTO · MASCULINO'}
        </span>
        <span className="caption-line" />
      </div>

      {estado.destaqueClinico && (
        <aside className={`clinical-legend glass ${estado.realceClinicoVisivel ? '' : 'muted'}`} aria-label="Legenda do marco clínico">
          <span className="clinical-swatch" style={{background: estado.destaqueClinico.cor}} />
          <div className="clinical-legend-copy">
            <strong>{estado.destaqueClinico.titulo}</strong>
            <small>{estado.realceClinicoVisivel ? 'Realce clínico ativo · anatomia ao redor = contexto' : 'Realce oculto · o filtro anatômico continua ativo'}</small>
          </div>
          <Button
            variant="ghost"
            onClick={() => definirEstado((anterior) => ({...anterior, realceClinicoVisivel: !anterior.realceClinicoVisivel}))}
            aria-pressed={estado.realceClinicoVisivel}
          >{estado.realceClinicoVisivel ? 'Ocultar realce' : 'Mostrar realce'}</Button>
        </aside>
      )}

      <div className="bottom-dock glass">
        <Button variant="ghost" className="mobile-only dock-layers" onClick={() => abrirPainel('camadas')} aria-label="Abrir camadas dos sistemas">
          <Layers3 size={20} /><span>Sistemas</span>
        </Button>
        <div className="explode-control">
          <div className="explode-label"><label id="explode-label">Explodir anatomia</label><output>{Math.round(estado.explosao * 100)}<span>%</span></output></div>
          <Slider
            aria-labelledby="explode-label"
            min={0} max={100} step={1}
            value={[estado.explosao * 100]}
            onValueChange={(valor) => {
              const percentual = Array.isArray(valor) ? valor[0] : valor;
              definirEstado((anterior) => ({
                ...anterior,
                explosao: percentual / 100,
                vista: percentual > 80 ? 'frente' : anterior.vista,
                rotacionar: false,
              }));
            }}
          />
          <div className="slider-endpoints"><span>Montada</span><span>Cada peça</span></div>
        </div>
        <Button variant="ghost" className="dock-reset" onClick={reiniciar} aria-label="Montar anatomia e redefinir"><RotateCcw size={18} /><span>Redefinir</span></Button>
      </div>

      <footer className="studio-footer">
        <span>{estado.explosao > 0.8 ? 'Arraste para mover' : 'Arraste para orbitar'} <b>·</b> Pinça/rolagem para zoom <b>·</b> Toque para inspecionar</span>
        <div className="footer-actions">
          <Button variant="ghost" onClick={() => definirMostrarMetricas((valor) => !valor)}>{mostrarMetricas ? 'Ocultar métricas' : 'Métricas 3D'}</Button>
          <Button variant="ghost" onClick={() => {definirDetalhes(false); definirPainel(null); definirFichaAtivaId(null); definirRotaAvancadaAtiva(null); definirSobre(true);}}>Fonte e créditos <ArrowUpRight size={12} /></Button>
        </div>
      </footer>

      {mostrarMetricas && <MetricasCena metricas={metricas} />}

      {progresso < 100 && !erro && (
        <div className="loading glass" role="status">
          <Activity size={18} />
          <div>
            <strong>Preparando a anatomia</strong>
            <span>{progresso}% · Carregando {atlas?.partes.length.toLocaleString('pt-BR') ?? '2.234'} peças</span>
            <div className="loading-track"><i style={{width: `${progresso}%`}} /></div>
          </div>
        </div>
      )}

      {erro && (
        <div className="loading glass error" role="alert">
          <p>{erro}</p>
          <Button variant="ghost" onClick={() => location.reload()}>Recarregar visualizador</Button>
        </div>
      )}

      <Sheet
        open={detalhes && partesSelecionadas.length > 0 && !questaoResidencia}
        modal={false}
        disablePointerDismissal
        onOpenChange={definirDetalhes}
      >
        <SheetContent
          initialFocus={tituloDetalhe}
          className={`detail-sheet glass ${estado.isolar ? 'is-isolated' : ''}`}
          showCloseButton
        >
          <div className="detail-header">
            <div className="detail-accent" style={{background: sistemaSelecionado?.cor}} />
            <div className="eyebrow">{sistemaSelecionado?.nome ?? 'ANATOMIA'}</div>
            <SheetTitle ref={tituloDetalhe} tabIndex={-1} className="structure-title">{nomeEscolhido}</SheetTitle>
            {itemEscolhido && (
              <div className="anatomy-breadcrumbs" aria-label="Classificação anatômica">
                <span>{nomeRegiao(itemEscolhido.regiao)}</span><ChevronRight size={12} /><span>{nomeCategoria(itemEscolhido.categoria)}</span>
              </div>
            )}
          </div>

          <div className="detail-scroll" key={`${escolhido?.id}-${estado.isolar}`}>
            <SheetDescription className="structure-description">{descricaoEscolhida}</SheetDescription>

            {estado.filtrarContexto && (
              <div className="model-filter-status" role="status">
                <Focus size={14} />
                <span><strong>Filtro automático ativo</strong> · somente as estruturas deste guia estão visíveis no modelo.</span>
              </div>
            )}

            <div className="structure-facts">
              {itemEscolhido?.nomeLatim && <span><small>Nome em latim</small><strong>{itemEscolhido.nomeLatim}</strong></span>}
              <span><small>Região</small><strong>{itemEscolhido ? nomeRegiao(itemEscolhido.regiao) : 'Não classificada'}</strong></span>
              <span><small>Categoria</small><strong>{itemEscolhido ? nomeCategoria(itemEscolhido.categoria) : 'Estrutura'}</strong></span>
              <span><small>Referência FMA</small><strong>{escolhido?.id}</strong></span>
              <span><small>Peças 3D</small><strong>{estado.selecionados.length.toLocaleString('pt-BR')}</strong></span>
            </div>

            {partesSelecionadas.length > 1 && (
              <div className="member-list">
                <h3>Peças desta estrutura</h3>
                {partesSelecionadas.slice(0, 30).map((parte) => (
                  <Button variant="ghost" key={parte.id} onClick={() => selecionarParte(parte.id)}>
                    <span>{obterNomeExibicao(parte.nome)}</span><ChevronRight size={14} />
                  </Button>
                ))}
                {partesSelecionadas.length > 30 && <p>E mais {partesSelecionadas.length - 30} peças modeladas.</p>}
              </div>
            )}

            {fichasVisiveis.length > 0 && (
              <div className="study-guides-list">
                <h3>Estudo aprofundado para residência</h3>
                <p>Essas fichas usam as peças disponíveis do atlas para reforçar marcos clínicos e correlações anatômicas de prova.</p>
                {fichasVisiveis.map((ficha) => (
                  <article className={`study-guide-card ${fichaAtiva?.id === ficha.id ? 'active' : ''}`} key={ficha.id}>
                    <div className="study-guide-header">
                      <div>
                        <small>{ficha.tipo === 'marco-clinico' ? 'MARCO CLÍNICO' : ficha.tipo === 'correlacao-cirurgica' ? 'CORRELAÇÃO CIRÚRGICA' : 'REVISÃO ORGÂNICA'}</small>
                        <strong>{ficha.titulo}</strong>
                      </div>
                      <Button
                        variant="outline"
                        className={fichaAtiva?.id === ficha.id && estado.filtrarContexto ? 'active' : ''}
                        onClick={() => aplicarFichaEstudo(ficha)}
                      >
                        {fichaAtiva?.id === ficha.id && estado.filtrarContexto ? 'Destacado no modelo' : 'Mostrar no modelo'}
                      </Button>
                    </div>
                    <p className="study-guide-summary">{ficha.resumo}</p>
                    <p className="study-guide-visual"><strong>Como visualizar:</strong> {ficha.visualizacao}</p>

                    {ficha.limites && ficha.limites.length > 0 && (
                      <div className="study-guide-section">
                        <h4>Limites</h4>
                        <ul>{ficha.limites.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}

                    {ficha.conteudo && ficha.conteudo.length > 0 && (
                      <div className="study-guide-section">
                        <h4>Conteúdo / componentes</h4>
                        <ul>{ficha.conteudo.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}

                    {ficha.camadas && ficha.camadas.length > 0 && (
                      <div className="study-guide-section">
                        <h4>Camadas / organização</h4>
                        <ul>{ficha.camadas.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}

                    <div className="study-guide-section">
                      <h4>Pontos de residência</h4>
                      <ul>{ficha.pontosResidencia.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>

                    {ficha.clinica && ficha.clinica.length > 0 && (
                      <div className="study-guide-section">
                        <h4>Correlação clínica</h4>
                        <ul>{ficha.clinica.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}

                    {ficha.lacunasModelo && ficha.lacunasModelo.length > 0 && (
                      <div className="study-guide-section model-gap">
                        <h4>Observação do modelo</h4>
                        <ul>{ficha.lacunasModelo.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {relacionados.length > 0 && (
              <div className="related-list">
                <h3>Estruturas relacionadas</h3>
                <p>Relacionadas por sistema, região, categoria e terminologia.</p>
                {relacionados.map((item) => (
                  <div className="related-row" key={item.conceito.id}>
                    <Button variant="ghost" onClick={() => selecionarConceito(item.conceito)}>
                      <span>{item.conceito.nome}</span><ChevronRight size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      className="compare-button"
                      onClick={() => {
                        definirComparacao(item);
                        definirEstado((anterior) => ({
                          ...anterior,
                          relacionados: item.conceito.elementos,
                          isolar: false,
                          filtrarContexto: false,
          destaqueClinico: null,
                        }));
                      }}
                    >Comparar</Button>
                  </div>
                ))}
              </div>
            )}

            {comparacao && itemEscolhido && (
              <div className="comparison-card">
                <div className="comparison-heading"><strong>Comparação anatômica</strong><Button variant="ghost" onClick={() => {definirComparacao(null); definirEstado((anterior) => ({...anterior, relacionados: [], destaqueClinico: null}));}}>Fechar</Button></div>
                <div className="comparison-names"><span>{itemEscolhido.conceito.nome}</span><b>×</b><span>{comparacao.conceito.nome}</span></div>
                <ul>
                  <li><strong>Região:</strong> {itemEscolhido.regiao === comparacao.regiao ? `ambas em ${nomeRegiao(itemEscolhido.regiao)}` : `${nomeRegiao(itemEscolhido.regiao)} × ${nomeRegiao(comparacao.regiao)}`}</li>
                  <li><strong>Categoria:</strong> {itemEscolhido.categoria === comparacao.categoria ? `ambas são ${nomeCategoria(itemEscolhido.categoria).toLowerCase()}` : `${nomeCategoria(itemEscolhido.categoria)} × ${nomeCategoria(comparacao.categoria)}`}</li>
                  <li><strong>Sistema:</strong> {itemEscolhido.sistema === comparacao.sistema ? `mesmo sistema (${SISTEMAS.find((s) => s.id === itemEscolhido.sistema)?.nome ?? itemEscolhido.sistema})` : `${SISTEMAS.find((s) => s.id === itemEscolhido.sistema)?.nome ?? itemEscolhido.sistema} × ${SISTEMAS.find((s) => s.id === comparacao.sistema)?.nome ?? comparacao.sistema}`}</li>
                </ul>
              </div>
            )}

            <a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">Ver fonte anatômica <ArrowUpRight size={14} /></a>
          </div>

          <div className="detail-actions">
            <Button
              className={`primary-action ${estado.isolar || estado.filtrarContexto ? 'active' : ''}`}
              onClick={() => definirEstado((anterior) => {
                if (anterior.filtrarContexto) {
                  return {
                    ...anterior,
                    filtrarContexto: false,
          destaqueClinico: null,
                    isolar: false,
                    relacionados: [],
                    explosao: 0,
                    foco: anterior.foco + 1,
                  };
                }
                return {
                  ...anterior,
                  isolar: !anterior.isolar,
                  filtrarContexto: false,
          destaqueClinico: null,
                  relacionados: [],
                  explosao: 0,
                  foco: anterior.foco + 1,
                };
              })}
            >
              <Focus size={18} />{estado.isolar || estado.filtrarContexto ? 'Exibir anatomia ao redor' : 'Isolar estrutura'}<ChevronRight size={16} />
            </Button>
            <div className="detail-action-grid">
              <Button variant="outline" onClick={() => definirEstado((anterior) => ({...anterior, foco: anterior.foco + 1, explosao: 0}))}>Focar</Button>
              <Button
                variant="outline"
                disabled={!sistemaSelecionado}
                onClick={() => sistemaSelecionado && definirEstado((anterior) => ({
                  ...anterior,
                  sistemasVisiveis: [sistemaSelecionado.id],
                  isolar: false,
                  filtrarContexto: false,
          destaqueClinico: null,
                  relacionados: [],
                  foco: anterior.foco + 1,
                }))}
              >Somente sistema</Button>
              <Button
                variant="outline"
                disabled={!idsRelacionados.length}
                className={contextoAtivo ? 'active' : ''}
                onClick={() => definirEstado((anterior) => ({
                  ...anterior,
                  relacionados: contextoAtivo ? [] : idsRelacionados,
                  isolar: false,
                  filtrarContexto: false,
          destaqueClinico: null,
                }))}
              >{contextoAtivo ? 'Ocultar relacionadas' : 'Mostrar relacionadas'}</Button>
              {estado.destaqueClinico && (
                <Button
                  variant="outline"
                  className={estado.realceClinicoVisivel ? 'active' : ''}
                  onClick={() => definirEstado((anterior) => ({...anterior, realceClinicoVisivel: !anterior.realceClinicoVisivel}))}
                >{estado.realceClinicoVisivel ? 'Ocultar realce clínico' : 'Mostrar realce clínico'}</Button>
              )}
              <Button
                variant="outline"
                disabled={!escolhido}
                onClick={async () => {
                  if (!escolhido) return;
                  const copiado = await copiarLinkEstrutura(escolhido.id);
                  definirMensagemLink(copiado ? 'Link copiado' : 'Link atualizado na barra do navegador');
                }}
              ><Copy size={14} /> Compartilhar</Button>
            </div>
            {mensagemLink && <span className="share-feedback" role="status">{mensagemLink}</span>}
            <Button
              variant="ghost"
              className="secondary-action"
              onClick={() => {
                definirEstado((anterior) => ({
                  ...anterior,
                  selecionados: [],
                  relacionados: [],
                  isolar: false,
                  filtrarContexto: false,
          destaqueClinico: null,
                }));
                definirEscolhido(null);
                definirDetalhes(false);
                atualizarEstruturaNaUrl(null);
              }}
            >Limpar seleção</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={sobre} onOpenChange={definirSobre}>
        <SheetContent className="about-sheet glass">
          <div className="eyebrow">FONTE E ESCOPO</div>
          <SheetTitle className="structure-title">Um corpo, revelado.</SheetTitle>
          <SheetDescription>Atlas anatômico 3D masculino adulto baseado no BodyParts3D.</SheetDescription>
          <div className="about-copy">
            <p><strong>V2 · PT-BR integral</strong><br />2.234 malhas individuais e 3.432 conceitos nomeados, com catálogo versionado e validação de schema.</p>
            <p>A busca aceita sinônimos, acentos opcionais, identificadores FMA e pequenos erros de digitação. A hierarquia organiza estruturas por sistema, região e categoria.</p>
            <p>O modo Residência oferece treino ativo, revisão espaçada e 53 fichas de marcos anatômicos. A Central Avançada acrescenta 53 rotas sequenciais de neuroanatomia, vascular, linfáticos, nervos periféricos e especialidades.</p>
            <p>As classificações de região/categoria, roteiros de estudo e descrições gerais são recursos educacionais derivados por regras locais. Eles não substituem revisão por especialista nem devem ser usados para diagnóstico, laudo ou planejamento cirúrgico real.</p>
            <p>A geometria e os identificadores científicos permanecem rastreáveis à fonte. Quando uma estrutura relevante para estudo não existe como malha isolada nesta base, o atlas informa a limitação e destaca o contexto visual disponível.</p>
            <h3>Versões</h3>
            <p>Aplicação 0.6.2 · schema do atlas {atlas?.versaoSchema ?? '2.0'} · manifesto {atlas?.versao ?? '—'}.</p>
            <h3>Fonte</h3>
            <p>BodyParts3D, © The Database Center for Life Science, licenciado sob CC Attribution 4.0 International.</p>
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Licença do conjunto de dados <ArrowUpRight size={14} /></a>
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Geometria e metadados originais <ArrowUpRight size={14} /></a>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
