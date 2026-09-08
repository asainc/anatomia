import {useMemo, useState} from 'react';
import {BookOpenCheck, ChevronLeft, ChevronRight, Route, Search, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {ConceitoIndexado} from '../dominio/catalogo-anatomico.ts';
import {
  NOMES_AREA_ESTUDO,
  filtrarRotas,
  resolverRotasEstudoAvancado,
  type AreaEstudoAvancado,
  type RotaEstudoResolvida,
} from '../dominio/rotas-estudo-avancado.ts';

interface PropriedadesCentralEstudoAvancado {
  indice: ConceitoIndexado[];
  aoVisualizar: (
    principal: ConceitoIndexado,
    relacionados: ConceitoIndexado[],
    rota: RotaEstudoResolvida,
    etapaIndice: number,
  ) => void;
  aoEncerrar: () => void;
}

const AREAS: Array<{id: AreaEstudoAvancado | 'todas'; nome: string}> = [
  {id: 'todas', nome: 'Todas'},
  {id: 'neuroanatomia', nome: 'Neuro'},
  {id: 'arterial', nome: 'Arterial'},
  {id: 'venoso', nome: 'Venosa'},
  {id: 'linfatico', nome: 'Linfáticos'},
  {id: 'nervos-perifericos', nome: 'Nervos periféricos'},
  {id: 'especialidades', nome: 'Especialidades'},
];

function primeiraEtapaVisualizavel(rota: RotaEstudoResolvida): number {
  const indice = rota.etapas.findIndex((etapa) => etapa.conceitos.length > 0);
  return indice >= 0 ? indice : 0;
}

export default function CentralEstudoAvancado({
  indice,
  aoVisualizar,
  aoEncerrar,
}: PropriedadesCentralEstudoAvancado) {
  const [area, definirArea] = useState<AreaEstudoAvancado | 'todas'>('todas');
  const [consulta, definirConsulta] = useState('');
  const [rotaAtivaId, definirRotaAtivaId] = useState<string | null>(null);
  const [etapaAtiva, definirEtapaAtiva] = useState(0);

  const rotas = useMemo(() => resolverRotasEstudoAvancado(indice), [indice]);
  const filtradas = useMemo(
    () => filtrarRotas(rotas, area, consulta),
    [rotas, area, consulta],
  );
  const rotaAtiva = useMemo(
    () => rotas.find((rota) => rota.id === rotaAtivaId) ?? null,
    [rotas, rotaAtivaId],
  );

  const visualizarEtapa = (rota: RotaEstudoResolvida, indiceEtapa: number) => {
    const etapa = rota.etapas[indiceEtapa];
    const principal = etapa?.conceitos[0];
    if (!etapa || !principal) return;

    const relacionados = new Map<string, ConceitoIndexado>();
    rota.etapas.forEach((item) => {
      item.conceitos.forEach((conceito) => {
        if (conceito.conceito.id !== principal.conceito.id) {
          relacionados.set(conceito.conceito.id, conceito);
        }
      });
    });

    definirRotaAtivaId(rota.id);
    definirEtapaAtiva(indiceEtapa);
    aoVisualizar(principal, [...relacionados.values()].slice(0, 20), rota, indiceEtapa);
  };

  const abrirRota = (rota: RotaEstudoResolvida) => {
    const primeira = primeiraEtapaVisualizavel(rota);
    definirRotaAtivaId(rota.id);
    definirEtapaAtiva(primeira);
    if (rota.etapas[primeira]?.conceitos.length) visualizarEtapa(rota, primeira);
  };

  if (rotaAtiva) {
    const etapa = rotaAtiva.etapas[etapaAtiva];
    const visualizavel = etapa?.conceitos.length > 0;

    return (
      <section className="advanced-center glass" aria-label="Estudo anatômico avançado">
        <div className="advanced-heading">
          <Button
            variant="ghost"
            className="icon-button"
            onClick={() => definirRotaAtivaId(null)}
            aria-label="Voltar às rotas"
          >
            <ChevronLeft size={17} />
          </Button>
          <div>
            <span className="eyebrow">{NOMES_AREA_ESTUDO[rotaAtiva.area].toUpperCase()}</span>
            <h2>{rotaAtiva.titulo}</h2>
          </div>
          <Button variant="ghost" className="icon-button" onClick={aoEncerrar} aria-label="Fechar estudo avançado">
            <X size={18} />
          </Button>
        </div>

        <p className="advanced-summary">{rotaAtiva.resumo}</p>

        <div className="advanced-route-progress" aria-label="Etapas da rota">
          {rotaAtiva.etapas.map((item, indiceEtapa) => (
            <button
              type="button"
              key={`${rotaAtiva.id}-${item.titulo}`}
              className={`${indiceEtapa === etapaAtiva ? 'active' : ''} ${item.conceitos.length ? '' : 'unavailable'}`}
              onClick={() => {
                definirEtapaAtiva(indiceEtapa);
                if (item.conceitos.length) visualizarEtapa(rotaAtiva, indiceEtapa);
              }}
              title={item.conceitos.length ? 'Mostrar esta etapa no modelo' : 'Sem malha isolada disponível'}
            >
              <span>{indiceEtapa + 1}</span>
              <strong>{item.titulo}</strong>
            </button>
          ))}
        </div>

        {etapa && (
          <article className="advanced-step-card">
            <div className="advanced-step-title">
              <div>
                <small>ETAPA {etapaAtiva + 1} DE {rotaAtiva.etapas.length}</small>
                <h3>{etapa.titulo}</h3>
              </div>
              <span>{etapa.conceitos.length} {etapa.conceitos.length === 1 ? 'conceito 3D' : 'conceitos 3D'}</span>
            </div>
            <p>{etapa.explicacao}</p>

            {visualizavel ? (
              <div className="advanced-concepts">
                {etapa.conceitos.slice(0, 8).map((item, indiceConceito) => (
                  <button
                    type="button"
                    key={item.conceito.id}
                    className={indiceConceito === 0 ? 'primary' : ''}
                    onClick={() => {
                      const outros = rotaAtiva.etapas
                        .flatMap((e) => e.conceitos)
                        .filter((c) => c.conceito.id !== item.conceito.id);
                      aoVisualizar(item, outros.slice(0, 20), rotaAtiva, etapaAtiva);
                    }}
                  >
                    {item.conceito.nome}
                  </button>
                ))}
              </div>
            ) : (
              <div className="advanced-model-gap">
                Esta etapa é conceitual: a base atual não possui uma malha isolada adequada. Use as etapas vizinhas e as estruturas-âncora do roteiro.
              </div>
            )}
          </article>
        )}

        <div className="advanced-high-yield">
          <h3>Pontos de alta incidência</h3>
          <ul>{rotaAtiva.pontosResidencia.map((ponto) => <li key={ponto}>{ponto}</li>)}</ul>
        </div>

        {rotaAtiva.lacunasModelo.length > 0 && (
          <div className="advanced-limitations">
            <h3>Limitações desta base 3D</h3>
            <ul>{rotaAtiva.lacunasModelo.map((ponto) => <li key={ponto}>{ponto}</li>)}</ul>
          </div>
        )}

        <div className="advanced-actions">
          <Button
            variant="outline"
            disabled={etapaAtiva <= 0}
            onClick={() => {
              const anterior = etapaAtiva - 1;
              definirEtapaAtiva(anterior);
              if (rotaAtiva.etapas[anterior]?.conceitos.length) visualizarEtapa(rotaAtiva, anterior);
            }}
          ><ChevronLeft size={15} /> Anterior</Button>
          <Button
            disabled={etapaAtiva >= rotaAtiva.etapas.length - 1}
            onClick={() => {
              const proxima = etapaAtiva + 1;
              definirEtapaAtiva(proxima);
              if (rotaAtiva.etapas[proxima]?.conceitos.length) visualizarEtapa(rotaAtiva, proxima);
            }}
          >Próxima <ChevronRight size={15} /></Button>
        </div>
      </section>
    );
  }

  return (
    <section className="advanced-center glass" aria-label="Central de estudo anatômico avançado">
      <div className="advanced-heading">
        <div>
          <span className="eyebrow">ESTUDO AVANÇADO</span>
          <h2>Rotas anatômicas</h2>
        </div>
        <Button variant="ghost" className="icon-button" onClick={aoEncerrar} aria-label="Fechar estudo avançado">
          <X size={18} />
        </Button>
      </div>

      <p className="advanced-summary">
        Neuroanatomia, circulação, linfáticos, nervos periféricos e roteiros por especialidade. As etapas usam as malhas disponíveis e sinalizam explicitamente o que é apenas topográfico/conceitual.
      </p>

      <div className="advanced-overview">
        <span><Route size={15} /><strong>{rotas.length}</strong><small>rotas</small></span>
        <span><BookOpenCheck size={15} /><strong>{rotas.reduce((soma, rota) => soma + rota.etapas.length, 0)}</strong><small>etapas</small></span>
        <span><strong>{rotas.reduce((soma, rota) => soma + rota.totalConceitos, 0)}</strong><small>associações 3D</small></span>
      </div>

      <label className="advanced-search">
        <Search size={15} />
        <input
          type="search"
          value={consulta}
          onChange={(evento) => definirConsulta(evento.target.value)}
          placeholder="Ex.: mediano, Willis, femoral, urologia…"
        />
      </label>

      <div className="advanced-filters" role="group" aria-label="Filtrar área de estudo">
        {AREAS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={area === item.id ? 'active' : ''}
            onClick={() => definirArea(item.id)}
          >{item.nome}</button>
        ))}
      </div>

      <div className="advanced-list">
        {filtradas.map((rota) => {
          const etapasDisponiveis = rota.etapas.filter((etapa) => etapa.conceitos.length > 0).length;
          return (
            <button type="button" className="advanced-route-card" key={rota.id} onClick={() => abrirRota(rota)}>
              <span className="advanced-route-icon"><Route size={16} /></span>
              <span className="advanced-route-copy">
                <small>{rota.especialidade ?? NOMES_AREA_ESTUDO[rota.area]}</small>
                <strong>{rota.titulo}</strong>
                <span>{rota.resumo}</span>
              </span>
              <span className="advanced-route-meta">{etapasDisponiveis}/{rota.etapas.length} etapas 3D</span>
            </button>
          );
        })}
        {filtradas.length === 0 && (
          <div className="advanced-empty">Nenhuma rota corresponde aos filtros atuais.</div>
        )}
      </div>
    </section>
  );
}
