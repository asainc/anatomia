import {useEffect, useMemo, useRef, useState} from 'react';
import {
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {SISTEMAS, type IdSistema} from '../anatomia.ts';
import {
  REGIOES,
  type ConceitoIndexado,
  type IdRegiaoAnatomica,
} from '../dominio/catalogo-anatomico.ts';
import {
  concluirSimulado,
  criarQuestaoResidencia,
  desempenhoPorSistema,
  filtrarBancoResidencia,
  montarFilaEstudo,
  registrarResposta,
  resumirProgresso,
  selecionarTipoQuestao,
  type FiltroEstudoResidencia,
  type ModoEstudoResidencia,
  type NivelQuestao,
  type ProgressoResidencia,
  type QuestaoResidencia,
} from '../dominio/estudo-residencia.ts';

export interface Resposta3DResidencia {
  questaoId: string;
  conceitoId: string;
  instante: number;
}

interface PropriedadesCentralResidencia {
  indice: ConceitoIndexado[];
  progresso: ProgressoResidencia;
  resposta3D: Resposta3DResidencia | null;
  aoAtualizarProgresso: (progresso: ProgressoResidencia) => void;
  aoQuestaoAtiva: (questao: QuestaoResidencia | null) => void;
  aoEncerrar: () => void;
  aoLimparProgresso: () => void;
}

type Etapa = 'inicio' | 'sessao' | 'resultado';

const ROTULOS_MODO: Record<ModoEstudoResidencia, {titulo: string; descricao: string}> = {
  'treino-rapido': {
    titulo: 'Treino rápido',
    descricao: '10 questões mistas para revisão ativa de anatomia.',
  },
  simulado: {
    titulo: 'Simulado',
    descricao: '20 questões sem feedback imediato; resultado ao final.',
  },
  'revisao-espacada': {
    titulo: 'Revisão espaçada',
    descricao: 'Prioriza estruturas que chegaram à data de revisão.',
  },
  'caderno-erros': {
    titulo: 'Caderno de erros',
    descricao: 'Refaça questões de estruturas em que você já errou.',
  },
};

function formatarTempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
  const resto = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${minutos}:${resto}`;
}

export default function CentralResidencia({
  indice,
  progresso,
  resposta3D,
  aoAtualizarProgresso,
  aoQuestaoAtiva,
  aoEncerrar,
  aoLimparProgresso,
}: PropriedadesCentralResidencia) {
  const [etapa, definirEtapa] = useState<Etapa>('inicio');
  const [modo, definirModo] = useState<ModoEstudoResidencia>('treino-rapido');
  const [filtro, definirFiltro] = useState<FiltroEstudoResidencia>({
    sistema: 'todos',
    regiao: 'todas',
    nivel: 'todos',
  });
  const [fila, definirFila] = useState<ConceitoIndexado[]>([]);
  const [indiceQuestao, definirIndiceQuestao] = useState(0);
  const [questao, definirQuestao] = useState<QuestaoResidencia | null>(null);
  const [resposta, definirResposta] = useState<string | null>(null);
  const [correto, definirCorreto] = useState<boolean | null>(null);
  const [acertosSessao, definirAcertosSessao] = useState(0);
  const [errosSessao, definirErrosSessao] = useState(0);
  const [mensagem, definirMensagem] = useState('');
  const [inicioSessao, definirInicioSessao] = useState<number | null>(null);
  const [segundos, definirSegundos] = useState(0);
  const idsRespondidos = useRef(new Set<string>());

  const resumo = useMemo(() => resumirProgresso(progresso), [progresso]);
  const desempenho = useMemo(() => desempenhoPorSistema(indice, progresso).slice(0, 5), [indice, progresso]);
  const bancoFiltrado = useMemo(() => filtrarBancoResidencia(indice, filtro), [indice, filtro]);

  useEffect(() => {
    if (etapa !== 'sessao' || !inicioSessao) return;
    const atualizar = () => definirSegundos(Math.floor((Date.now() - inicioSessao) / 1000));
    atualizar();
    const temporizador = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(temporizador);
  }, [etapa, inicioSessao]);


  const apresentar = (proximoIndice: number, proximaFila = fila, proximoModo = modo) => {
    const alvo = proximaFila[proximoIndice];
    if (!alvo) return;
    const tipo = selecionarTipoQuestao(proximoIndice, proximoModo);
    const banco = bancoFiltrado.length ? bancoFiltrado : indice;
    const criada = criarQuestaoResidencia(banco, alvo, tipo);
    definirQuestao(criada);
    definirResposta(null);
    definirCorreto(null);
    definirMensagem('');
    aoQuestaoAtiva(criada);
  };

  const iniciar = (modoSelecionado: ModoEstudoResidencia) => {
    const quantidade = modoSelecionado === 'simulado' ? 20 : 10;
    const novaFila = montarFilaEstudo(indice, modoSelecionado, filtro, progresso, quantidade);
    if (!novaFila.length) {
      definirMensagem(
        modoSelecionado === 'revisao-espacada'
          ? 'Nenhuma revisão está vencida agora. Faça um treino rápido para alimentar sua agenda de revisão.'
          : modoSelecionado === 'caderno-erros'
            ? 'Seu caderno de erros está vazio para este filtro.'
            : 'Nenhuma estrutura corresponde aos filtros escolhidos.',
      );
      return;
    }
    definirModo(modoSelecionado);
    definirFila(novaFila);
    definirIndiceQuestao(0);
    definirAcertosSessao(0);
    definirErrosSessao(0);
    idsRespondidos.current.clear();
    definirInicioSessao(Date.now());
    definirSegundos(0);
    definirEtapa('sessao');
    apresentar(0, novaFila, modoSelecionado);
  };

  const registrar = (valor: string) => {
    if (!questao || resposta !== null || idsRespondidos.current.has(questao.id)) return;
    idsRespondidos.current.add(questao.id);
    const acertou = valor === questao.respostaCorreta;
    definirResposta(valor);
    definirCorreto(acertou);
    definirAcertosSessao((atual) => atual + (acertou ? 1 : 0));
    definirErrosSessao((atual) => atual + (acertou ? 0 : 1));
    aoAtualizarProgresso(registrarResposta(progresso, questao, acertou));

    if (modo !== 'simulado') {
      definirMensagem(acertou ? 'Resposta correta.' : 'Resposta incorreta. Revise a explicação antes de avançar.');
    }
  };

  useEffect(() => {
    if (!questao || questao.tipo !== 'localizacao-3d' || !resposta3D) return;
    if (resposta3D.questaoId !== questao.id) return;
    registrar(resposta3D.conceitoId);
  }, [resposta3D, questao]);

  const avancar = () => {
    if (!questao || resposta === null) return;
    const proximo = indiceQuestao + 1;
    if (proximo >= fila.length) {
      let atualizado = progresso;
      if (modo === 'simulado') {
        atualizado = concluirSimulado(
          progresso,
          acertosSessao + (correto ? 0 : 0),
          fila.length,
        );
        aoAtualizarProgresso(atualizado);
      }
      aoQuestaoAtiva(null);
      definirEtapa('resultado');
      return;
    }
    definirIndiceQuestao(proximo);
    apresentar(proximo);
  };

  const voltarInicio = () => {
    aoQuestaoAtiva(null);
    definirEtapa('inicio');
    definirQuestao(null);
    definirResposta(null);
    definirMensagem('');
  };

  if (etapa === 'resultado') {
    const total = fila.length;
    const percentual = total ? Math.round((acertosSessao / total) * 100) : 0;
    return (
      <section className="residency-center glass residency-result" aria-live="polite">
        <div className="residency-heading">
          <div><span className="eyebrow">SESSÃO CONCLUÍDA</span><h2>Resultado</h2></div>
          <Button variant="ghost" className="icon-button" onClick={aoEncerrar} aria-label="Fechar preparação para residência">×</Button>
        </div>
        <div className="result-score"><strong>{percentual}%</strong><span>{acertosSessao} acertos em {total} questões</span></div>
        <div className="residency-stats compact">
          <span><Clock3 size={15}/><b>{formatarTempo(segundos)}</b><small>tempo</small></span>
          <span><CheckCircle2 size={15}/><b>{acertosSessao}</b><small>acertos</small></span>
          <span><XCircle size={15}/><b>{errosSessao}</b><small>erros</small></span>
        </div>
        <p className="result-guidance">
          {percentual >= 80
            ? 'Bom domínio nesta sessão. Continue usando a revisão espaçada para consolidar retenção.'
            : percentual >= 60
              ? 'Desempenho intermediário. Refaça os erros e concentre a próxima sessão nos temas mais fracos.'
              : 'Priorize o caderno de erros e sessões menores antes de repetir um simulado.'}
        </p>
        <div className="residency-actions"><Button onClick={() => iniciar(modo)}>Refazer sessão</Button><Button variant="outline" onClick={voltarInicio}>Voltar ao painel</Button></div>
      </section>
    );
  }

  if (etapa === 'sessao' && questao) {
    const numero = indiceQuestao + 1;
    const simulado = modo === 'simulado';
    return (
      <section className="residency-center glass residency-session" aria-live="polite">
        <div className="residency-heading">
          <div><span className="eyebrow">{ROTULOS_MODO[modo].titulo.toUpperCase()}</span><h2>Questão {numero} de {fila.length}</h2></div>
          <Button variant="ghost" className="icon-button" onClick={voltarInicio} aria-label="Encerrar sessão">×</Button>
        </div>
        <div className="session-meta"><span><Clock3 size={13}/>{formatarTempo(segundos)}</span><span>{acertosSessao} acertos</span><span className={`difficulty ${questao.nivel}`}>{questao.nivel}</span></div>
        <Progress value={(numero / fila.length) * 100} aria-label="Progresso da sessão" />
        <div className="question-block">
          <span className="question-type">{questao.tipo === 'localizacao-3d' ? 'Prática no 3D' : questao.tipo === 'identificacao' ? 'Identificação visual' : 'Conhecimento anatômico'}</span>
          <h3>{questao.enunciado}</h3>
          {questao.instrucao && <p>{questao.instrucao}</p>}
        </div>

        {questao.tipo === 'localizacao-3d' ? (
          <div className={`location-answer ${resposta !== null && !simulado ? (correto ? 'correct' : 'wrong') : ''}`}>
            <Target size={20}/>
            <span>{
              resposta === null
                ? 'Use o modelo 3D ao fundo e clique na estrutura.'
                : simulado
                  ? 'Resposta registrada.'
                  : correto
                    ? 'Estrutura localizada corretamente.'
                    : 'Essa não é a estrutura solicitada.'
            }</span>
          </div>
        ) : (
          <div className="answer-grid">
            {questao.alternativas.map((alternativa) => {
              const selecionada = resposta === alternativa.id;
              const correta = resposta !== null && alternativa.id === questao.respostaCorreta;
              return (
                <Button
                  key={alternativa.id}
                  variant="outline"
                  disabled={resposta !== null}
                  className={`${selecionada ? 'selected' : ''} ${correta && !simulado ? 'correct' : ''} ${selecionada && !correto && !simulado ? 'wrong' : ''}`}
                  onClick={() => registrar(alternativa.id)}
                >{alternativa.texto}</Button>
              );
            })}
          </div>
        )}

        {resposta !== null && (
          <div className="answer-feedback">
            {!simulado && <><strong>{mensagem}</strong><p>{questao.explicacao}</p></>}
            {simulado && <p>Resposta registrada. O desempenho consolidado será mostrado ao final.</p>}
          </div>
        )}
        <div className="residency-actions"><Button disabled={resposta === null} onClick={avancar}>{numero === fila.length ? 'Finalizar' : 'Próxima questão'}</Button><Button variant="ghost" onClick={voltarInicio}>Encerrar</Button></div>
      </section>
    );
  }

  return (
    <section className="residency-center glass" aria-label="Preparação anatômica para residência médica">
      <div className="residency-heading">
        <div><span className="eyebrow">PREPARAÇÃO PARA RESIDÊNCIA</span><h2>Anatomia em revisão ativa</h2></div>
        <Button variant="ghost" className="icon-button" onClick={aoEncerrar} aria-label="Fechar preparação para residência">×</Button>
      </div>
      <p className="residency-intro">Treinos focados em anatomia para complementar sua preparação. O progresso fica salvo somente neste navegador.</p>

      <div className="residency-stats">
        <span><Brain size={16}/><b>{resumo.percentual}%</b><small>acerto global</small></span>
        <span><BookOpenCheck size={16}/><b>{resumo.estruturasEstudadas}</b><small>estruturas vistas</small></span>
        <span><Clock3 size={16}/><b>{resumo.revisoesPendentes}</b><small>revisões hoje</small></span>
        <span><Trophy size={16}/><b>{resumo.dominadas}</b><small>dominadas</small></span>
      </div>

      <div className="study-filters">
        <label>Sistema<select value={filtro.sistema ?? 'todos'} onChange={(e) => definirFiltro((atual) => ({...atual, sistema: e.target.value as IdSistema | 'todos'}))}><option value="todos">Todos os sistemas</option>{SISTEMAS.map((sistema) => <option key={sistema.id} value={sistema.id}>{sistema.nome}</option>)}</select></label>
        <label>Região<select value={filtro.regiao ?? 'todas'} onChange={(e) => definirFiltro((atual) => ({...atual, regiao: e.target.value as IdRegiaoAnatomica | 'todas'}))}><option value="todas">Todas as regiões</option>{REGIOES.filter((regiao) => regiao.id !== 'nao-classificada').map((regiao) => <option key={regiao.id} value={regiao.id}>{regiao.nome}</option>)}</select></label>
        <label>Nível<select value={filtro.nivel ?? 'todos'} onChange={(e) => definirFiltro((atual) => ({...atual, nivel: e.target.value as NivelQuestao | 'todos'}))}><option value="todos">Todos os níveis</option><option value="fundamental">Fundamental</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></select></label>
      </div>
      <span className="bank-count">{bancoFiltrado.length.toLocaleString('pt-BR')} estruturas disponíveis com estes filtros</span>

      <div className="study-modes">
        {(Object.keys(ROTULOS_MODO) as ModoEstudoResidencia[]).map((id) => (
          <button key={id} type="button" className="study-mode" onClick={() => iniciar(id)}>
            <span className="mode-icon">{id === 'simulado' ? <GraduationCap size={18}/> : id === 'revisao-espacada' ? <Clock3 size={18}/> : id === 'caderno-erros' ? <RotateCcw size={18}/> : <Target size={18}/>}</span>
            <span><strong>{ROTULOS_MODO[id].titulo}</strong><small>{ROTULOS_MODO[id].descricao}</small></span>
            {id === 'revisao-espacada' && resumo.revisoesPendentes > 0 && <b className="mode-badge">{resumo.revisoesPendentes}</b>}
            {id === 'caderno-erros' && resumo.cadernoErros > 0 && <b className="mode-badge">{resumo.cadernoErros}</b>}
          </button>
        ))}
      </div>

      {mensagem && <div className="study-notice">{mensagem}</div>}

      {desempenho.length > 0 && (
        <div className="weak-topics">
          <div className="section-title"><strong>Desempenho por sistema</strong><span>piores primeiro</span></div>
          {desempenho.map((tema) => (
            <div key={tema.id} className="topic-row"><span>{tema.nome}</span><i><b style={{width: `${tema.percentual}%`}} /></i><strong>{tema.percentual}%</strong></div>
          ))}
        </div>
      )}

      <div className="study-footer-note">
        <span>O atlas cobre anatomia. Não substitui o estudo das demais áreas cobradas em provas de residência.</span>
        {resumo.respondidas > 0 && <Button variant="ghost" onClick={aoLimparProgresso}>Limpar progresso</Button>}
      </div>
    </section>
  );
}
