# Estudo Anatômico Avançado

## Objetivo

A Central **Avançado** transforma o atlas em um ambiente de revisão por rotas anatômicas. Em vez de apresentar apenas estruturas isoladas, cada roteiro conduz o estudante por uma sequência lógica de relações anatômicas usadas em provas de residência, internato e revisão clínica.

A versão 0.6.0 inclui **53 rotas avançadas**, totalizando **165 etapas** e **804 associações com conceitos 3D reais** do catálogo.

## Áreas cobertas

### Neuroanatomia fina

Inclui rotas para:

- círculo de Willis;
- cápsula interna e núcleos da base;
- córtex motor e somatossensitivo;
- linguagem;
- sistema límbico;
- tronco encefálico;
- nervos oculomotores;
- trigêmeo V1;
- nervo óptico;
- cerebelo.

### Vascular arterial

Inclui:

- aorta completa;
- eixo carotídeo;
- subclávia → axilar → braquial;
- radial e ulnar;
- tronco celíaco;
- mesentérica superior;
- mesentérica inferior;
- artérias renais;
- ilíaca → femoral → poplítea;
- circulação arterial pulmonar.

### Vascular venosa

Inclui:

- veias cavas;
- sistema ázigos;
- sistema porta hepático;
- veias renais;
- femoral → ilíaca → VCI;
- veias pulmonares.

### Linfáticos

A geometria BodyParts3D possui pouca segmentação linfonodal. Por isso, o módulo linfático usa estruturas-âncora e relações topográficas para ensinar:

- timo;
- baço;
- drenagem linfática da mama;
- cadeias cervicais;
- drenagem pélvica e retroperitoneal.

A aplicação nunca cria uma malha fictícia para um linfonodo inexistente. Quando a malha não existe, a limitação aparece explicitamente na rota.

### Nervos periféricos

As rotas de nervos periféricos usam músculos, vasos e ossos como referências espaciais quando a base 3D não possui o nervo como estrutura contínua:

- plexo braquial;
- mediano;
- ulnar;
- radial;
- femoral;
- ciático;
- tibial;
- fibular comum;
- obturatório;
- nervo óptico.

### Correlações por especialidade

Existem roteiros integrados para:

- Cirurgia Geral;
- Cardiologia;
- Neurologia;
- Neurocirurgia;
- Ortopedia — membro superior;
- Ortopedia — membro inferior;
- Cirurgia Vascular;
- Urologia;
- Otorrinolaringologia;
- Cirurgia Torácica;
- Medicina de Emergência;
- Radiologia.

## Como usar

1. Abra **Avançado** na barra superior.
2. Escolha uma área ou pesquise um tema.
3. Abra uma rota.
4. Percorra as etapas com **Anterior** e **Próxima**.
5. Cada etapa seleciona uma estrutura principal e destaca estruturas relacionadas no modelo 3D.
6. Quando existem várias malhas compatíveis, elas aparecem como botões de navegação dentro da etapa.
7. Leia os **Pontos de alta incidência** para revisar a associação com provas.
8. Consulte **Limitações desta base 3D** sempre que uma estrutura estiver sendo ensinada apenas por topografia.

## Relação com os Guias de prova

A aplicação agora possui duas camadas complementares:

- **53 Guias de prova**: fichas objetivas de marcos anatômicos, limites, componentes e correlações clínicas;
- **53 Rotas avançadas**: percursos sequenciais que conectam estruturas no modelo 3D.

Somadas, são **106 unidades estruturadas de estudo**, além das 1.916 estruturas elegíveis para questões da Central Residência.

## Segurança e escopo educacional

A aplicação é um recurso educacional. As rotas de procedimentos e correlações cirúrgicas são usadas apenas para aprendizagem anatômica e não devem orientar procedimentos reais, diagnóstico, laudo, planejamento cirúrgico ou decisão clínica.

A precisão geométrica fica limitada à fonte BodyParts3D. Estruturas microscópicas, histológicas, fascículos nervosos finos, cadeias linfonodais completas e alguns ligamentos/nervos periféricos não estão presentes como malhas independentes.

## Visualização filtrada automática

Ao escolher uma etapa visualizável, a rota avançada ativa o mesmo mecanismo de filtro contextual dos Guias de prova: a estrutura principal fica destacada, as estruturas associadas permanecem visíveis como contexto e todas as demais peças do corpo são ocultadas temporariamente. A câmera enquadra o conjunto completo.

Esse filtro não altera permanentemente as preferências de sistemas do estudante. Ao sair da rota ou redefinir a visualização, o contexto anatômico normal é restaurado.
