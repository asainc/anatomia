import {flushSync} from 'react-dom';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Focus,
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
import {registrarFerramentasAtlas} from './ferramentas-agente.ts';
import {
  EXPLICACOES,
  SISTEMAS,
  SISTEMAS_VISIVEIS_PADRAO,
  normalizarAtlas,
  normalizarTexto,
  obterExplicacao,
  obterNomeExibicao,
  type Atlas,
  type Conceito,
  type EstadoCena,
  type IdSistema,
  type Vista,
} from './anatomia.ts';

/** Estado padrão aplicado na abertura da página e no botão de reinício. */
const ESTADO_INICIAL: EstadoCena = {
  explosao: 0,
  sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO,
  selecionados: [],
  isolar: false,
  vista: 'tres-quartos',
  rotacionar: false,
  reinicio: 0,
};

const VISTAS: Array<{id: Vista; rotulo: string; simbolo: string}> = [
  {id: 'tres-quartos', rotulo: 'Vista em três quartos', simbolo: '¾'},
  {id: 'frente', rotulo: 'Vista frontal', simbolo: 'F'},
  {id: 'lateral', rotulo: 'Vista lateral', simbolo: 'L'},
  {id: 'costas', rotulo: 'Vista posterior', simbolo: 'C'},
];

/**
 * Página principal do atlas.
 *
 * Responsabilidades:
 * - carregar e normalizar o catálogo anatômico;
 * - controlar filtros, busca e seleção;
 * - manter o estado de câmera/explosão enviado para a cena 3D;
 * - apresentar painéis e mensagens acessíveis em português.
 */
export default function PaginaInicial() {
  const tituloDetalhe = useRef<HTMLHeadingElement>(null);
  const [atlas, definirAtlas] = useState<Atlas | null>(null);
  const [estado, definirEstado] = useState<EstadoCena>(ESTADO_INICIAL);
  const [progresso, definirProgresso] = useState(0);
  const [erro, definirErro] = useState('');
  const [painel, definirPainel] = useState<'camadas' | 'busca' | null>(null);
  const [detalhes, definirDetalhes] = useState(false);
  const [sobre, definirSobre] = useState(false);
  const [consulta, definirConsulta] = useState('');
  const [escolhido, definirEscolhido] = useState<Conceito | null>(null);

  /** Carrega o manifesto do atlas e converte o contrato externo para PT-BR. */
  useEffect(() => {
    const controlador = new AbortController();

    definirProgresso(0);
    definirErro('');
    definirAtlas(null);
    definirEscolhido(null);
    definirDetalhes(false);
    definirEstado({...ESTADO_INICIAL, sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO});

    fetch('/models/atlas.json', {signal: controlador.signal})
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error('Não foi possível carregar o catálogo anatômico.');
        }
        return resposta.json();
      })
      .then((dados) => definirAtlas(normalizarAtlas(dados)))
      .catch((falha: Error) => {
        if (falha.name !== 'AbortError') {
          definirErro(falha.message);
        }
      });

    return () => controlador.abort();
  }, []);

  /** Atalho "/" abre a busca quando o foco não está em um campo de texto. */
  useEffect(() => {
    const tratarTecla = (evento: KeyboardEvent) => {
      const alvoEhCampo =
        evento.target instanceof HTMLInputElement ||
        evento.target instanceof HTMLTextAreaElement;

      if (evento.key === '/' && !alvoEhCampo) {
        evento.preventDefault();
        definirPainel('busca');
        definirDetalhes(false);
      }
    };

    window.addEventListener('keydown', tratarTecla);
    return () => window.removeEventListener('keydown', tratarTecla);
  }, []);

  const partesPorId = useMemo(
    () => new Map(atlas?.partes.map((parte) => [parte.id, parte])),
    [atlas],
  );

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

  const quantidadeVisivel =
    atlas?.partes.filter((parte) =>
      estado.isolar
        ? estado.selecionados.includes(parte.id)
        : estado.sistemasVisiveis.includes(parte.sistema) ||
          estado.selecionados.includes(parte.id),
    ).length ?? 0;

  /**
   * Busca pelo nome localizado, pelo nome original preservado internamente ou
   * pelo identificador FMA. Os resultados sempre são exibidos em PT-BR.
   */
  const resultados = useMemo(() => {
    if (!atlas) {
      return [];
    }

    const termo = normalizarTexto(consulta);
    if (!termo) {
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
          atlas.conceitos.find(
            (conceito) => conceito.nomeOriginal?.toLowerCase() === nome,
          ),
        )
        .filter((conceito): conceito is Conceito => !!conceito);
    }

    return atlas.conceitos
      .filter((conceito) => {
        const nomeLocalizado = normalizarTexto(conceito.nome);
        const nomeOriginal = normalizarTexto(conceito.nomeOriginal ?? '');
        return (
          nomeLocalizado.includes(termo) ||
          nomeOriginal.includes(termo) ||
          conceito.id.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => a.nome.length - b.nome.length)
      .slice(0, 80);
  }, [atlas, consulta]);

  const selecionarConceito = (conceito: Conceito) => {
    definirEscolhido(conceito);
    definirEstado((anterior) => ({
      ...anterior,
      selecionados: conceito.elementos,
      isolar: false,
      rotacionar: false,
    }));
    definirDetalhes(true);
    definirPainel(null);
  };

  /** Registra integração opcional com ferramentas de IA do navegador. */
  useEffect(() => {
    if (!atlas) {
      return;
    }

    return registrarFerramentasAtlas(atlas, (conceito) =>
      flushSync(() => selecionarConceito(conceito)),
    );
  }, [atlas]);

  const selecionarParte = (id: string) => {
    const parte = partesPorId.get(id);
    if (!parte) {
      return;
    }

    definirEscolhido({
      id: parte.idConceito,
      nome: parte.nome,
      elementos: [id],
    });
    definirEstado((anterior) => ({
      ...anterior,
      selecionados: [id],
      isolar: false,
      rotacionar: false,
    }));
    definirDetalhes(true);
    definirPainel(null);
  };

  const alternarSistema = (id: IdSistema) => {
    definirDetalhes(false);
    definirEstado((anterior) => ({
      ...anterior,
      selecionados: [],
      isolar: false,
      sistemasVisiveis: anterior.sistemasVisiveis.includes(id)
        ? anterior.sistemasVisiveis.filter((item) => item !== id)
        : [...anterior.sistemasVisiveis, id],
    }));
  };

  const reiniciar = () => {
    definirEstado((anterior) => ({
      ...ESTADO_INICIAL,
      sistemasVisiveis: SISTEMAS_VISIVEIS_PADRAO,
      reinicio: anterior.reinicio + 1,
    }));
    definirEscolhido(null);
    definirDetalhes(false);
    definirPainel(null);
  };

  const abrirPainel = (proximo: 'camadas' | 'busca') => {
    definirDetalhes(false);
    definirPainel((atual) => (atual === proximo ? null : proximo));
  };

  const nomeEscolhido = escolhido ? obterNomeExibicao(escolhido.nome) : '';

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
            if (valor === 100) {
              definirErro('');
            }
          }}
          aoFalhar={definirErro}
        />
      )}

      <div className="vignette" />

      <header className="identity">
        <div className="eyebrow">
          <span className="status-dot" /> ANATOMIA INTERATIVA
        </div>
        <h1>
          Anatomia Humana
          <Badge variant="outline" className="edition">
            3D
          </Badge>
        </h1>
        <div className="identity-meta">
          {atlas ? atlas.partes.length.toLocaleString('pt-BR') : '2.234'} peças
          modeladas <span>·</span> BodyParts3D
        </div>
      </header>

      <nav className="top-actions" aria-label="Painéis do explorador">
        <Button
          variant="ghost"
          className={painel === 'busca' ? 'active' : ''}
          onClick={() => abrirPainel('busca')}
          aria-label="Buscar na anatomia"
        >
          <Search size={18} />
          <span>Buscar estrutura</span>
          <kbd>/</kbd>
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          aria-label="Sobre este atlas"
          onClick={() => {
            definirDetalhes(false);
            definirPainel(null);
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
          >
            <X size={18} />
          </Button>
          <Badge variant="secondary" className="desktop-only small-number">
            {sistemasAtivos.length}
          </Badge>
        </div>

        <div className="layer-presets">
          <Button
            variant="ghost"
            aria-pressed={sistemasAtivos.every((sistema) =>
              estado.sistemasVisiveis.includes(sistema.id),
            )}
            onClick={() =>
              definirEstado((anterior) => ({
                ...anterior,
                selecionados: [],
                isolar: false,
                sistemasVisiveis: sistemasAtivos.map((sistema) => sistema.id),
              }))
            }
          >
            Todos
          </Button>
          <Button
            variant="ghost"
            aria-pressed={
              estado.sistemasVisiveis.length === 1 &&
              estado.sistemasVisiveis[0] === 'esqueletico'
            }
            onClick={() =>
              definirEstado((anterior) => ({
                ...anterior,
                selecionados: [],
                isolar: false,
                sistemasVisiveis: ['esqueletico'],
              }))
            }
          >
            Esqueleto
          </Button>
          <Button
            variant="ghost"
            aria-pressed={
              estado.sistemasVisiveis.length === 6 &&
              [
                'cardiaco',
                'respiratorio',
                'digestivo',
                'urinario',
                'endocrino',
                'reprodutor',
              ].every((id) =>
                estado.sistemasVisiveis.includes(id as IdSistema),
              )
            }
            onClick={() =>
              definirEstado((anterior) => ({
                ...anterior,
                selecionados: [],
                isolar: false,
                sistemasVisiveis: [
                  'cardiaco',
                  'respiratorio',
                  'digestivo',
                  'urinario',
                  'endocrino',
                  'reprodutor',
                ],
              }))
            }
          >
            Órgãos
          </Button>
        </div>

        <div className="system-list">
          {sistemasAtivos.map((sistema) => (
            <div
              className={`system-row ${
                estado.sistemasVisiveis.includes(sistema.id) ? 'enabled' : ''
              }`}
              key={sistema.id}
            >
              <Button
                variant="ghost"
                className="system-name"
                title={`Exibir somente ${sistema.nome.toLowerCase()}`}
                onClick={() =>
                  definirEstado((anterior) => ({
                    ...anterior,
                    sistemasVisiveis: [sistema.id],
                    isolar: false,
                    selecionados: [],
                  }))
                }
              >
                <span
                  className="system-dot"
                  style={{background: sistema.cor}}
                />
                {sistema.nome}
                <span className="system-count">{contagens[sistema.id]}</span>
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
          <Button
            variant="ghost"
            onClick={() =>
              definirEstado((anterior) => ({
                ...anterior,
                sistemasVisiveis: [],
                selecionados: [],
                isolar: false,
              }))
            }
          >
            Ocultar tudo
          </Button>
        </div>
      </section>

      {painel === 'busca' && (
        <section className="search-panel glass" aria-label="Buscar na anatomia">
          <div className="panel-heading">
            <span>Buscar estrutura</span>
            <Button
              variant="ghost"
              className="icon-button"
              onClick={() => definirPainel(null)}
              aria-label="Fechar busca"
            >
              <X size={18} />
            </Button>
          </div>
          <Combobox<Conceito>
            items={resultados}
            value={null}
            onValueChange={(valor) => {
              if (valor) {
                selecionarConceito(valor);
              }
            }}
            inputValue={consulta}
            onInputValueChange={definirConsulta}
            itemToStringLabel={(conceito) => obterNomeExibicao(conceito.nome)}
            filter={null}
            open
            onOpenChange={(aberto) => {
              if (!aberto) {
                definirPainel(null);
              }
            }}
          >
            <ComboboxInput
              autoFocus
              placeholder="Coração, fêmur, nervo craniano…"
              aria-label="Buscar estruturas anatômicas pelo nome"
              showTrigger={false}
            />
            <ComboboxContent className="anatomy-search-results">
              <ComboboxEmpty>
                Nenhuma estrutura corresponde à sua busca.
              </ComboboxEmpty>
              <ComboboxList>
                {(conceito: Conceito) => (
                  <ComboboxItem key={conceito.id} value={conceito}>
                    <span className="search-result-name">
                      {obterNomeExibicao(conceito.nome)}
                    </span>
                    <span className="small-number">
                      {conceito.elementos.length}{' '}
                      {conceito.elementos.length === 1 ? 'peça' : 'peças'}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <p className="search-note">
            {consulta
              ? 'Exibindo até 80 resultados. Refine a busca para localizar estruturas menores.'
              : 'Comece por um órgão principal ou pesquise qualquer estrutura nomeada.'}
          </p>
        </section>
      )}

      <nav className="view-controls glass" aria-label="Controles da câmera">
        {VISTAS.map((vista) => (
          <Button
            variant="ghost"
            key={vista.id}
            className={estado.vista === vista.id ? 'active' : ''}
            aria-pressed={estado.vista === vista.id}
            disabled={estado.explosao > 0.8 && vista.id !== 'frente'}
            onClick={() =>
              definirEstado((anterior) => ({
                ...anterior,
                vista: vista.id,
                reinicio: anterior.reinicio + 1,
                rotacionar: false,
              }))
            }
            title={vista.rotulo}
            aria-label={vista.rotulo}
          >
            <span>{vista.simbolo}</span>
          </Button>
        ))}
        <i />
        <Button
          variant="ghost"
          disabled={estado.explosao >= 0.4}
          aria-label={estado.rotacionar ? 'Pausar rotação' : 'Rotacionar corpo'}
          title="Rotação automática"
          className={estado.rotacionar ? 'active' : ''}
          onClick={() =>
            definirEstado((anterior) => ({
              ...anterior,
              rotacionar: !anterior.rotacionar,
            }))
          }
        >
          {estado.rotacionar ? <Pause size={17} /> : <RotateCw size={18} />}
        </Button>
        <Button
          variant="ghost"
          aria-label="Redefinir vista e camadas"
          title="Redefinir"
          onClick={reiniciar}
        >
          <RotateCcw size={17} />
        </Button>
      </nav>

      <div className="scene-caption">
        <span className="caption-line" />
        <span>
          {estado.isolar
            ? nomeEscolhido || 'ESTRUTURA SELECIONADA'
            : estado.explosao > 0.95
              ? 'INVENTÁRIO ANATÔMICO'
              : estado.explosao > 0.05
                ? 'ESTRUTURAS SEPARADAS'
                : 'HUMANO ADULTO · MASCULINO'}
        </span>
        <span className="caption-line" />
      </div>

      <div className="bottom-dock glass">
        <Button
          variant="ghost"
          className="mobile-only dock-layers"
          onClick={() => abrirPainel('camadas')}
          aria-label="Abrir camadas dos sistemas"
        >
          <Layers3 size={20} />
          <span>Sistemas</span>
        </Button>
        <div className="explode-control">
          <div className="explode-label">
            <label id="explode-label">Explodir anatomia</label>
            <output>
              {Math.round(estado.explosao * 100)}
              <span>%</span>
            </output>
          </div>
          <Slider
            aria-labelledby="explode-label"
            min={0}
            max={100}
            step={1}
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
          <div className="slider-endpoints">
            <span>Montada</span>
            <span>Cada peça</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="dock-reset"
          onClick={reiniciar}
          aria-label="Montar anatomia e redefinir"
        >
          <RotateCcw size={18} />
          <span>Redefinir</span>
        </Button>
      </div>

      <footer className="studio-footer">
        <span>
          {estado.explosao > 0.8 ? 'Arraste para mover' : 'Arraste para orbitar'}{' '}
          <b>·</b> Pinça/rolagem para zoom <b>·</b> Toque para inspecionar
        </span>
        <Button
          variant="ghost"
          onClick={() => {
            definirDetalhes(false);
            definirPainel(null);
            definirSobre(true);
          }}
        >
          Fonte e créditos <ArrowUpRight size={12} />
        </Button>
      </footer>

      {progresso < 100 && !erro && (
        <div className="loading glass" role="status">
          <Activity size={18} />
          <div>
            <strong>Preparando a anatomia</strong>
            <span>
              {progresso}% · Carregando{' '}
              {atlas?.partes.length.toLocaleString('pt-BR') ?? '2.234'} peças
            </span>
            <div className="loading-track">
              <i style={{width: `${progresso}%`}} />
            </div>
          </div>
        </div>
      )}

      {erro && (
        <div className="loading glass error" role="alert">
          <p>{erro}</p>
          <Button variant="ghost" onClick={() => location.reload()}>
            Recarregar visualizador
          </Button>
        </div>
      )}

      <Sheet
        open={detalhes && partesSelecionadas.length > 0}
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
            <div
              className="detail-accent"
              style={{background: sistemaSelecionado?.cor}}
            />
            <div className="eyebrow">
              {sistemaSelecionado?.nome ?? 'ANATOMIA'}
            </div>
            <SheetTitle
              ref={tituloDetalhe}
              tabIndex={-1}
              className="structure-title"
            >
              {nomeEscolhido}
            </SheetTitle>
          </div>

          <div
            className="detail-scroll"
            key={`${escolhido?.id}-${estado.isolar}`}
          >
            <SheetDescription className="structure-description">
              {escolhido && parteSelecionada
                ? obterExplicacao(escolhido.nomeOriginal ?? escolhido.nome, parteSelecionada.sistema)
                : ''}
            </SheetDescription>

            {escolhido && !EXPLICACOES[(escolhido.nomeOriginal ?? escolhido.nome).toLowerCase()] && (
              <span className="context-note">
                Visão geral do sistema · estrutura identificada na fonte anatômica
              </span>
            )}

            <div className="structure-meta">
              <span>
                Referência do atlas<strong>{escolhido?.id}</strong>
              </span>
              <span>
                Peças selecionadas
                <strong>{estado.selecionados.length.toLocaleString('pt-BR')}</strong>
              </span>
            </div>

            {partesSelecionadas.length > 1 && (
              <div className="member-list">
                <h3>Estruturas incluídas</h3>
                {partesSelecionadas.slice(0, 50).map((parte) => (
                  <Button
                    variant="ghost"
                    key={parte.id}
                    onClick={() => selecionarParte(parte.id)}
                  >
                    <span>{obterNomeExibicao(parte.nome)}</span>
                    <ChevronRight size={14} />
                  </Button>
                ))}
                {partesSelecionadas.length > 50 && (
                  <p>
                    E mais {partesSelecionadas.length - 50} peças modeladas.
                  </p>
                )}
              </div>
            )}

            <a
              className="source-link"
              href="https://lifesciencedb.jp/bp3d/"
              target="_blank"
              rel="noreferrer"
            >
              Ver fonte anatômica <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="detail-actions">
            <Button
              className={`primary-action ${estado.isolar ? 'active' : ''}`}
              onClick={() =>
                definirEstado((anterior) => ({
                  ...anterior,
                  isolar: !anterior.isolar,
                  explosao: 0,
                }))
              }
            >
              <Focus size={18} />
              {estado.isolar ? 'Exibir anatomia ao redor' : 'Isolar estrutura'}
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              className="secondary-action"
              onClick={() => {
                definirEstado((anterior) => ({
                  ...anterior,
                  selecionados: [],
                  isolar: false,
                }));
                definirDetalhes(false);
              }}
            >
              Limpar seleção
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={sobre} onOpenChange={definirSobre}>
        <SheetContent className="about-sheet glass">
          <div className="eyebrow">FONTE E ESCOPO</div>
          <SheetTitle className="structure-title">Um corpo, revelado.</SheetTitle>
          <SheetDescription>
            Explore a anatomia masculina adulta de referência do BodyParts3D.
          </SheetDescription>
          <div className="about-copy">
            <p>
              <strong>Masculino · BodyParts3D</strong>
              <br />
              2.234 malhas individuais e 3.432 conceitos nomeados de uma anatomia
              masculina adulta de referência.
            </p>
            <p>
              Esta referência não contém todas as estruturas ou variações humanas.
              Conceitos nomeados podem agrupar várias peças; cada malha da fonte é
              renderizada uma única vez.
            </p>
            <p>
              Cores e agrupamentos por sistema foram definidos para exploração. A
              geometria foi simplificada para a web e as explicações curtas oferecem
              contexto educacional geral. Esta é uma referência anatômica, não uma
              ferramenta de diagnóstico ou uso cirúrgico.
            </p>
            <p>
              Os identificadores e os milhares de nomes oficiais do BodyParts3D são
              preservados para rastreabilidade. Estruturas frequentes possuem nome de
              exibição em português e podem ser pesquisadas em PT-BR.
            </p>
            <h3>Fonte</h3>
            <p>
              BodyParts3D, © The Database Center for Life Science, licenciado sob CC
              Attribution 4.0 International.
            </p>
            <a
              href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
              target="_blank"
              rel="noreferrer"
            >
              Licença do conjunto de dados <ArrowUpRight size={14} />
            </a>
            <a
              href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"
              target="_blank"
              rel="noreferrer"
            >
              Geometria e metadados originais <ArrowUpRight size={14} />
            </a>
            <a
              href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752"
              target="_blank"
              rel="noreferrer"
            >
              Ler publicação da fonte <ArrowUpRight size={14} />
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
