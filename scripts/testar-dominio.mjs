import assert from 'node:assert/strict';
import {
  buscarConceitos,
  criarIndiceAnatomico,
  inferirCategoria,
  inferirRegiao,
} from '../app/dominio/catalogo-anatomico.ts';

const atlasMinimo = {
  versaoSchema: '2.0', versao: 'teste', triangulos: 0, blocos: [],
  partes: [
    {id:'p1',nome:'escápula',nomeOriginal:'scapula',idConceito:'FMA:1',sistema:'esqueletico',bloco:0,posicoes:0,normais:0,indices:0,quantidadeVertices:3,quantidadeIndices:3,limites:[[0,0,0],[1,1,1]]},
    {id:'p2',nome:'patela',nomeOriginal:'patella',idConceito:'FMA:2',sistema:'esqueletico',bloco:0,posicoes:0,normais:0,indices:0,quantidadeVertices:3,quantidadeIndices:3,limites:[[0,0,0],[1,1,1]]},
    {id:'p3',nome:'artéria radial',nomeOriginal:'radial artery',idConceito:'FMA:3',sistema:'arterial',bloco:0,posicoes:0,normais:0,indices:0,quantidadeVertices:3,quantidadeIndices:3,limites:[[0,0,0],[1,1,1]]},
  ],
  conceitos: [
    {id:'FMA:1',nome:'escápula',nomeOriginal:'scapula',elementos:['p1']},
    {id:'FMA:2',nome:'patela',nomeOriginal:'patella',elementos:['p2']},
    {id:'FMA:3',nome:'artéria radial',nomeOriginal:'radial artery',elementos:['p3']},
  ],
};

assert.equal(inferirRegiao('escápula', 'esqueletico'), 'membro-superior');
assert.equal(inferirRegiao('patela', 'esqueletico'), 'membro-inferior');
assert.equal(inferirCategoria('artéria radial', 'arterial'), 'arteria');
const indice = criarIndiceAnatomico(atlasMinimo);
assert.equal(buscarConceitos(indice, 'omoplata')[0]?.conceito.nome, 'escápula');
assert.equal(buscarConceitos(indice, 'rotula')[0]?.conceito.nome, 'patela');
assert.equal(buscarConceitos(indice, 'arteria radal')[0]?.conceito.nome, 'artéria radial');
console.log('Domínio anatômico validado: regiões, categorias, aliases e busca tolerante.');
