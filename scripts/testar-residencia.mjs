import fs from 'node:fs';
import assert from 'node:assert/strict';
import {normalizarAtlas} from '../app/anatomia.ts';
import {criarIndiceAnatomico} from '../app/dominio/catalogo-anatomico.ts';
import {
  PROGRESSO_RESIDENCIA_VAZIO,
  concluirSimulado,
  criarQuestaoResidencia,
  filtrarBancoResidencia,
  montarFilaEstudo,
  registrarResposta,
  resumirProgresso,
} from '../app/dominio/estudo-residencia.ts';

const bruto = JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'));
const atlas = normalizarAtlas(bruto);
const indice = criarIndiceAnatomico(atlas);
const banco = filtrarBancoResidencia(indice, {sistema: 'todos', regiao: 'todas', nivel: 'todos'});
assert.ok(banco.length > 500, `Banco de estudo pequeno demais: ${banco.length}`);

const alvo = banco.find((item) => item.conceito.nome.toLowerCase() === 'fêmur') ?? banco[0];
assert.ok(alvo, 'Não foi possível encontrar um conceito-alvo.');

const tipos = ['localizacao-3d', 'identificacao', 'regiao', 'sistema', 'categoria'];
for (const tipo of tipos) {
  const questao = criarQuestaoResidencia(banco, alvo, tipo, () => 0.42);
  assert.equal(questao.tipo, tipo);
  assert.ok(questao.enunciado.length > 10);
  assert.ok(questao.respostaCorreta);
  if (tipo !== 'localizacao-3d') {
    assert.ok(questao.alternativas.length >= 2, `${tipo} precisa de alternativas.`);
    assert.ok(questao.alternativas.some((item) => item.id === questao.respostaCorreta));
  }
}

const agora = new Date('2026-09-07T12:00:00-03:00');
const questao = criarQuestaoResidencia(banco, alvo, 'identificacao', () => 0.31);
const progressoErrado = registrarResposta(PROGRESSO_RESIDENCIA_VAZIO, questao, false, agora);
assert.equal(progressoErrado.registros[alvo.conceito.id].erros, 1);
assert.equal(resumirProgresso(progressoErrado, agora).cadernoErros, 1);

const filaErros = montarFilaEstudo(indice, 'caderno-erros', {sistema: 'todos', regiao: 'todas', nivel: 'todos'}, progressoErrado, 10, agora, () => 0.25);
assert.ok(filaErros.some((item) => item.conceito.id === alvo.conceito.id), 'Caderno de erros não recuperou o conceito errado.');

const depois = new Date('2026-09-09T12:00:00-03:00');
const filaRevisao = montarFilaEstudo(indice, 'revisao-espacada', {sistema: 'todos', regiao: 'todas', nivel: 'todos'}, progressoErrado, 10, depois, () => 0.25);
assert.ok(filaRevisao.some((item) => item.conceito.id === alvo.conceito.id), 'Revisão espaçada não recuperou item vencido.');

const progressoCorreto = registrarResposta(progressoErrado, questao, true, depois);
assert.equal(progressoCorreto.registros[alvo.conceito.id].acertos, 1);
assert.equal(progressoCorreto.registros[alvo.conceito.id].sequenciaAcertos, 1);

const depois2 = new Date('2026-09-12T12:00:00-03:00');
const progressoReabilitado = registrarResposta(progressoCorreto, questao, true, depois2);
assert.equal(resumirProgresso(progressoReabilitado, depois2).cadernoErros, 0, 'Dois acertos consecutivos devem retirar o conceito do caderno ativo.');

const simulado = concluirSimulado(progressoReabilitado, 16, 20);
assert.equal(simulado.simuladosConcluidos, 1);
assert.equal(simulado.melhorPercentualSimulado, 80);

const filaRapida = montarFilaEstudo(indice, 'treino-rapido', {sistema: 'esqueletico', regiao: 'todas', nivel: 'todos'}, simulado, 10, agora, () => 0.62);
assert.equal(filaRapida.length, 10);
assert.ok(filaRapida.every((item) => item.sistema === 'esqueletico'));

console.log(`Preparação para residência validada: ${banco.length} estruturas elegíveis, 5 tipos de questão, revisão espaçada e caderno de erros.`);
