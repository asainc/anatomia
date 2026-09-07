import {useEffect, useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarLayoutExplosao} from './layout-explosao.ts';
import {decodificarRespostaModelo} from './download-modelo.ts';
import {DetectorToquePonteiro} from './toque-ponteiro.ts';
import {SISTEMAS, type Atlas, type EstadoCena} from './anatomia.ts';

interface PropriedadesCena {
  atlas: Atlas;
  estado: EstadoCena;
  aoSelecionar: (id: string) => void;
  aoProgredir: (percentual: number) => void;
  aoFalhar: (mensagem: string) => void;
}

/**
 * Renderizador Three.js do atlas anatômico.
 *
 * A cena usa poucas malhas combinadas para renderização eficiente, mas mantém
 * uma malha de seleção por estrutura para o raycasting. Texturas na GPU
 * controlam deslocamento, visibilidade e realce de cada peça sem criar milhares
 * de objetos renderizados separadamente.
 */
export default function CenaAnatomia({
  atlas,
  estado,
  aoSelecionar,
  aoProgredir,
  aoFalhar,
}: PropriedadesCena) {
  const elementoHospedeiro = useRef<HTMLDivElement>(null);
  const estadoAtualRef = useRef(estado);
  const selecionarRef = useRef(aoSelecionar);

  // Refs evitam recriar a cena Three.js toda vez que o estado React muda.
  estadoAtualRef.current = estado;
  selecionarRef.current = aoSelecionar;

  useEffect(() => {
    const elemento = elementoHospedeiro.current!;
    let descartado = false;
    let quadroAnimacao = 0;
    let precisaRenderizar = true;
    let pronto = false;
    let ultimaVista = '';
    let ultimoReinicio = -1;
    let ultimaChaveIsolamento = '';
    let chaveLayout = '';
    let nivelExplosao = 0;
    let ultimoEstado: EstadoCena | null = null;

    const controlador = new AbortController();
    let renderizador: T.WebGLRenderer;

    try {
      renderizador = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      aoFalhar(
        'Este navegador não conseguiu iniciar o visualizador 3D. Tente um navegador com WebGL habilitado.',
      );
      return;
    }

    renderizador.setPixelRatio(
      Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2),
    );
    renderizador.setClearColor('#f2f3f3');
    renderizador.outputColorSpace = T.SRGBColorSpace;
    renderizador.toneMapping = T.ACESFilmicToneMapping;
    renderizador.toneMappingExposure = 1.12;
    elemento.appendChild(renderizador.domElement);
    renderizador.domElement.setAttribute(
      'aria-label',
      'Anatomia humana interativa. Arraste para orbitar, use pinça ou rolagem para aplicar zoom e toque em uma estrutura para inspecioná-la.',
    );

    const cena = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.005, 100);
    const controles = new OrbitControls(camera, renderizador.domElement);

    camera.position.set(1.4, 1.05, 3.6);
    controles.target.set(0, 0.85, 0);
    controles.enableDamping = true;
    controles.dampingFactor = 0.085;
    controles.minDistance = 0.07;
    controles.maxDistance = 40;
    controles.maxPolarAngle = Math.PI * 0.96;
    controles.addEventListener('change', () => {
      precisaRenderizar = true;
    });

    // Iluminação baseada em ambiente mantém materiais legíveis sem texturas externas.
    const geradorAmbiente = new T.PMREMGenerator(renderizador);
    const ambienteSala = new RoomEnvironment();
    const ambiente = geradorAmbiente.fromScene(ambienteSala, 0.04);
    cena.environment = ambiente.texture;
    ambienteSala.dispose();
    geradorAmbiente.dispose();

    cena.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.05));
    const luzPrincipal = new T.DirectionalLight(0xfffaf4, 2.3);
    luzPrincipal.position.set(-2, 4, 3);
    cena.add(luzPrincipal);

    const luzContorno = new T.DirectionalLight(0xe9f0ff, 1.8);
    luzContorno.position.set(2, 2, -3);
    cena.add(luzContorno);

    const chao = new T.Mesh(
      new T.CircleGeometry(30, 96),
      new T.MeshStandardMaterial({color: 0xd5d9dc, roughness: 1}),
    );
    chao.rotation.x = -Math.PI / 2;
    chao.position.y = -0.019;
    cena.add(chao);

    const plataforma = new T.Mesh(
      new T.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new T.MeshStandardMaterial({
        color: 0xeeeeec,
        metalness: 0.12,
        roughness: 0.67,
      }),
    );
    plataforma.position.y = -0.016;
    cena.add(plataforma);

    const anel = new T.Mesh(
      new T.RingGeometry(0.63, 0.632, 128),
      new T.MeshBasicMaterial({
        color: 0x8c969f,
        transparent: true,
        opacity: 0.4,
        side: T.DoubleSide,
      }),
    );
    anel.rotation.x = -Math.PI / 2;
    anel.position.y = 0.001;
    cena.add(anel);

    const anelInterno = new T.Mesh(
      new T.RingGeometry(0.55, 0.551, 128),
      new T.MeshBasicMaterial({
        color: 0xa4aeb8,
        transparent: true,
        opacity: 0.16,
        side: T.DoubleSide,
      }),
    );
    anelInterno.rotation.x = -Math.PI / 2;
    anelInterno.position.y = 0.001;
    cena.add(anelInterno);

    /**
     * Cada texel representa uma peça anatômica:
     * RGB = deslocamento XYZ; A = visibilidade.
     */
    const larguraTextura = T.MathUtils.ceilPowerOfTwo(atlas.partes.length);
    const dadosPartes = new Float32Array(larguraTextura * 4);
    const texturaPartes = new T.DataTexture(
      dadosPartes,
      larguraTextura,
      1,
      T.RGBAFormat,
      T.FloatType,
    );
    texturaPartes.needsUpdate = true;

    const dadosSelecao = new Uint8Array(larguraTextura * 4);
    const texturaSelecao = new T.DataTexture(dadosSelecao, larguraTextura, 1);
    texturaSelecao.needsUpdate = true;

    const materiais: T.Material[] = [];
    const geometrias: T.BufferGeometry[] = [];
    const malhasSelecao: (T.Mesh | undefined)[] = [];
    const centros = atlas.partes.map((parte) =>
      new T.Vector3()
        .fromArray(parte.limites[0])
        .add(new T.Vector3().fromArray(parte.limites[1]))
        .multiplyScalar(0.5),
    );
    const deslocamentos: T.Vector3[] = [];
    const limites = atlas.partes.map(
      (parte) =>
        new T.Box3(
          new T.Vector3().fromArray(parte.limites[0]),
          new T.Vector3().fromArray(parte.limites[1]),
        ),
    );

    let larguraEmpacotamento = 1;
    let alturaEmpacotamento = 1;

    const posicoesMarcadores = new Float32Array(atlas.partes.length * 3);
    const geometriaMarcadores = new T.BufferGeometry();
    geometriaMarcadores.setAttribute(
      'position',
      new T.BufferAttribute(posicoesMarcadores, 3),
    );
    const materialMarcadores = new T.PointsMaterial({
      color: 0x64748b,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    });
    materialMarcadores.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;',
      );
    };

    const marcadores = new T.Points(geometriaMarcadores, materialMarcadores);
    marcadores.frustumCulled = false;
    marcadores.renderOrder = 10;
    marcadores.visible = false;
    cena.add(marcadores);

    const dica = document.createElement('div');
    dica.className = 'part-hover';
    dica.setAttribute('role', 'tooltip');
    dica.hidden = true;
    elemento.appendChild(dica);

    type AlvoTela = {
      indice: number;
      x: number;
      y: number;
      esquerda: number;
      direita: number;
      topo: number;
      base: number;
    };

    let alvosTela: AlvoTela[] = [];
    const projetado = new T.Vector3();

    /** Localiza a estrutura 2D mais próxima do ponteiro no modo explodido. */
    const encontrarAlvo = (x: number, y: number, raio: number) => {
      let melhorIndice = -1;
      let melhorPontuacao = Infinity;

      for (const alvo of alvosTela) {
        const dx = Math.max(alvo.esquerda - x, 0, x - alvo.direita);
        const dy = Math.max(alvo.topo - y, 0, y - alvo.base);
        const distancia = Math.hypot(dx, dy);

        if (distancia > raio) {
          continue;
        }

        const pontuacao =
          distancia + Math.hypot(alvo.x - x, alvo.y - y) * 0.025;
        if (pontuacao < melhorPontuacao) {
          melhorPontuacao = pontuacao;
          melhorIndice = alvo.indice;
        }
      }

      return melhorIndice;
    };

    /** Cria o material do sistema e injeta estado por peça no shader. */
    const criarMaterialSistema = (idSistema: string) => {
      const sistema = SISTEMAS.find((item) => item.id === idSistema);
      const material = new T.MeshStandardMaterial({
        color: sistema?.cor ?? '#aebbb8',
        metalness: 0.08,
        roughness: 0.53,
        side: T.DoubleSide,
        transparent: idSistema === 'tegumentar',
        opacity: idSistema === 'tegumentar' ? 0.1 : 1,
        depthWrite: idSistema !== 'tegumentar',
      });

      material.onBeforeCompile = (shader) => {
        shader.uniforms.partState = {value: texturaPartes};
        shader.uniforms.selectionState = {value: texturaSelecao};
        shader.uniforms.stateWidth = {value: larguraTextura};
        shader.vertexShader =
          'attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected;\n' +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;',
        );
        shader.fragmentShader =
          'varying float partVisible; varying float partSelected;\n' +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;',
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75);',
        );
      };

      materiais.push(material);
      return material;
    };

    const materiaisPorSistema = new Map(
      SISTEMAS.map((sistema) => [sistema.id, criarMaterialSistema(sistema.id)]),
    );

    let blocosCarregados = 0;

    /** Carrega um bloco binário e cria geometrias para suas estruturas. */
    const carregarBloco = async (indiceBloco: number) => {
      const bloco = atlas.blocos[indiceBloco];
      const compactado =
        !!bloco.gzip && typeof DecompressionStream !== 'undefined';
      const resposta = await fetch(compactado ? bloco.gzip! : bloco.url, {
        signal: controlador.signal,
      });
      const buffer = await decodificarRespostaModelo(
        resposta,
        bloco.bytes,
        compactado,
      );

      if (descartado) {
        return;
      }

      const grupos = new Map<string, T.BufferGeometry[]>();

      atlas.partes.forEach((parte, indice) => {
        if (parte.bloco !== indiceBloco) {
          return;
        }

        const geometria = new T.BufferGeometry();
        geometria.setAttribute(
          'position',
          new T.BufferAttribute(
            new Float32Array(
              buffer,
              parte.posicoes,
              parte.quantidadeVertices * 3,
            ),
            3,
          ),
        );

        // Normais em int16 normalizado reduzem a memória sem remover estruturas.
        geometria.setAttribute(
          'normal',
          new T.BufferAttribute(
            new Int16Array(buffer, parte.normais, parte.quantidadeVertices * 3),
            3,
            true,
          ),
        );
        geometria.setIndex(
          new T.BufferAttribute(
            new Uint32Array(buffer, parte.indices, parte.quantidadeIndices),
            1,
          ),
        );
        geometria.boundingBox = limites[indice].clone();
        geometria.computeBoundingSphere();

        // A malha individual existe só para seleção precisa por raycasting.
        const malhaSelecao = new T.Mesh(geometria);
        malhaSelecao.matrixAutoUpdate = false;
        malhasSelecao[indice] = malhaSelecao;
        geometrias.push(geometria);

        geometria.setAttribute(
          'partIndex',
          new T.BufferAttribute(
            new Float32Array(parte.quantidadeVertices).fill(indice),
            1,
          ),
        );

        const lista = grupos.get(parte.sistema) ?? [];
        lista.push(geometria);
        grupos.set(parte.sistema, lista);
      });

      // Uma malha renderizada por sistema/bloco reduz drasticamente draw calls.
      grupos.forEach((geometriasGrupo, idSistema) => {
        const geometriaCombinada = mergeGeometries(geometriasGrupo, false);
        if (!geometriaCombinada) {
          throw new Error('Não foi possível montar a geometria anatômica.');
        }

        geometrias.push(geometriaCombinada);
        const malha = new T.Mesh(
          geometriaCombinada,
          materiaisPorSistema.get(idSistema as never),
        );
        malha.frustumCulled = false;
        cena.add(malha);
      });

      ultimoEstado = null;
      blocosCarregados += 1;
      aoProgredir(
        Math.round((blocosCarregados / atlas.blocos.length) * 100),
      );
      precisaRenderizar = true;
    };

    /** Faz até três downloads em paralelo para acelerar a abertura do atlas. */
    void (async () => {
      try {
        let proximoBloco = 0;
        await Promise.all(
          Array.from({length: 3}, async () => {
            while (proximoBloco < atlas.blocos.length) {
              const indice = proximoBloco;
              proximoBloco += 1;
              await carregarBloco(indice);
            }
          }),
        );

        if (!descartado) {
          pronto = true;
          precisaRenderizar = true;
        }
      } catch (falha) {
        if (!descartado) {
          aoFalhar(
            falha instanceof Error
              ? falha.message
              : 'Não foi possível carregar a anatomia.',
          );
        }
      }
    })();

    /** Ajusta câmera conforme a vista escolhida e o grau de explosão. */
    const ajustarCamera = (vista: string, intensidadeLayout = 0) => {
      const proporcao = camera.aspect;
      const movel = elemento.clientWidth < 768;
      const distanciaNormal = movel
        ? Math.max(
            4.5,
            (1.8 * elemento.clientHeight) /
              Math.max(160, elemento.clientHeight - 350) /
              (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))),
          )
        : 4;
      const alturaReservada = movel ? 350 : 270;
      const proporcaoDisponivel = Math.max(
        0.35,
        (elemento.clientWidth - (movel ? 40 : 340)) /
          Math.max(160, elemento.clientHeight - alturaReservada),
      );
      const distanciaAtlas =
        (Math.max(
          alturaEmpacotamento,
          larguraEmpacotamento / proporcaoDisponivel,
        ) /
          (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
        (elemento.clientHeight /
          Math.max(160, elemento.clientHeight - alturaReservada)) *
        1.08;
      const distancia = T.MathUtils.lerp(
        distanciaNormal,
        Math.max(0.2, distanciaAtlas),
        intensidadeLayout,
      );

      if (intensidadeLayout > 0.8) {
        vista = 'frente';
      }

      const direcao =
        vista === 'frente'
          ? new T.Vector3(0, 0.02, 1)
          : vista === 'costas'
            ? new T.Vector3(0, 0.02, -1)
            : vista === 'lateral'
              ? new T.Vector3(1, 0.02, 0)
              : new T.Vector3(0.35, 0.06, 1).normalize();

      controles.target.set(
        intensidadeLayout > 0.1 && elemento.clientWidth > 767
          ? -larguraEmpacotamento * 0.12
          : 0,
        intensidadeLayout > 0.1 || movel ? 0.85 : 0.68,
        0,
      );
      camera.position
        .copy(controles.target)
        .addScaledVector(direcao, distancia);
      controles.update();
      precisaRenderizar = true;
    };

    const redimensionar = () => {
      chaveLayout = '';
      ultimoEstado = null;
      renderizador.setPixelRatio(
        Math.min(
          devicePixelRatio,
          elemento.clientWidth < 768 || elemento.clientHeight < 600 ? 1.5 : 2,
        ),
      );
      camera.aspect = elemento.clientWidth / elemento.clientHeight;
      camera.updateProjectionMatrix();
      renderizador.setSize(elemento.clientWidth, elemento.clientHeight);
      ajustarCamera(estadoAtualRef.current.vista, nivelExplosao);
    };

    const observador = new ResizeObserver(redimensionar);
    observador.observe(elemento);

    const seletorRaio = new T.Raycaster();
    const ponteiro = new T.Vector2();
    const detectorToque = new DetectorToquePonteiro();
    const caixaMundo = new T.Box3();
    const pontoIntersecao = new T.Vector3();

    const tratarInicioPonteiro = (evento: PointerEvent) => {
      dica.hidden = true;
      detectorToque.iniciar(
        evento.pointerId,
        evento.clientX,
        evento.clientY,
        evento.pointerType === 'touch' ? 12 : 5,
      );
    };

    const tratarMovimentoPonteiro = (evento: PointerEvent) => {
      detectorToque.mover(evento.pointerId, evento.clientX, evento.clientY);

      if (evento.buttons || nivelExplosao < 0.5 || evento.pointerType === 'touch') {
        dica.hidden = true;
        return;
      }

      const retangulo = elemento.getBoundingClientRect();
      const x = evento.clientX - retangulo.left;
      const y = evento.clientY - retangulo.top;
      const indice = encontrarAlvo(x, y, 12);

      dica.hidden = indice < 0;
      renderizador.domElement.style.cursor = indice < 0 ? 'grab' : 'pointer';

      if (indice >= 0) {
        dica.textContent = atlas.partes[indice].nome;
        dica.style.left = `${Math.max(
          8,
          Math.min(x + 14, elemento.clientWidth - 260),
        )}px`;
        dica.style.top = `${Math.max(
          8,
          Math.min(y + 18, elemento.clientHeight - 55),
        )}px`;
      }
    };

    const tratarCancelamentoPonteiro = (evento: PointerEvent) =>
      detectorToque.cancelar(evento.pointerId);

    const tratarFimPonteiro = (evento: PointerEvent) => {
      const toqueValido = detectorToque.finalizar(
        evento.pointerId,
        evento.clientX,
        evento.clientY,
      );

      if (!toqueValido || !pronto) {
        return;
      }

      const retangulo = renderizador.domElement.getBoundingClientRect();
      ponteiro.set(
        ((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1,
        -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1,
      );
      seletorRaio.setFromCamera(ponteiro, camera);

      let menorDistancia = Infinity;
      let indiceEncontrado = -1;
      const existeEstruturaSolida = atlas.partes.some(
        (parte, indice) =>
          parte.sistema !== 'tegumentar' && dadosPartes[indice * 4 + 3] > 0.5,
      );

      malhasSelecao.forEach((malha, indice) => {
        if (
          !malha ||
          dadosPartes[indice * 4 + 3] < 0.5 ||
          (existeEstruturaSolida && atlas.partes[indice].sistema === 'tegumentar')
        ) {
          return;
        }

        caixaMundo.copy(limites[indice]).translate(malha.position);
        if (!seletorRaio.ray.intersectBox(caixaMundo, pontoIntersecao)) {
          return;
        }

        const intersecoes = seletorRaio.intersectObject(malha, false);
        if (
          intersecoes[0] &&
          intersecoes[0].distance < menorDistancia
        ) {
          menorDistancia = intersecoes[0].distance;
          indiceEncontrado = indice;
        }
      });

      if (indiceEncontrado < 0 && nivelExplosao > 0.45) {
        indiceEncontrado = encontrarAlvo(
          evento.clientX - retangulo.left,
          evento.clientY - retangulo.top,
          evento.pointerType === 'touch' ? 24 : 16,
        );
      }

      if (indiceEncontrado >= 0) {
        dica.hidden = true;
        selecionarRef.current(atlas.partes[indiceEncontrado].id);
      }
    };

    renderizador.domElement.addEventListener(
      'pointerdown',
      tratarInicioPonteiro,
    );
    renderizador.domElement.addEventListener(
      'pointermove',
      tratarMovimentoPonteiro,
    );
    renderizador.domElement.addEventListener('pointerup', tratarFimPonteiro);
    renderizador.domElement.addEventListener(
      'pointercancel',
      tratarCancelamentoPonteiro,
    );

    const relogio = new T.Clock();
    let ultimaIntensidadeLayout = -1;

    const animar = () => {
      if (descartado) {
        return;
      }

      quadroAnimacao = requestAnimationFrame(animar);
      const delta = Math.min(relogio.getDelta(), 0.05);
      const estadoAtual = estadoAtualRef.current;
      const mudouVisibilidade =
        ultimoEstado?.sistemasVisiveis !== estadoAtual.sistemasVisiveis ||
        ultimoEstado?.selecionados !== estadoAtual.selecionados ||
        ultimoEstado?.isolar !== estadoAtual.isolar;
      const emMovimento =
        Math.abs(nivelExplosao - estadoAtual.explosao) > 0.0001;

      if (emMovimento) {
        nivelExplosao = T.MathUtils.damp(
          nivelExplosao,
          estadoAtual.explosao,
          8,
          delta,
        );
        precisaRenderizar = true;
      }

      if (mudouVisibilidade || emMovimento || ultimaIntensidadeLayout < 0) {
        const sistemasVisiveis = new Set(estadoAtual.sistemasVisiveis);
        const selecao = new Set(estadoAtual.selecionados);
        const partesVisiveis = atlas.partes.filter((parte) =>
          estadoAtual.isolar
            ? selecao.has(parte.id)
            : sistemasVisiveis.has(parte.sistema) || selecao.has(parte.id),
        );
        const proximaChaveLayout =
          partesVisiveis.map((parte) => parte.id).join(',') +
          ':' +
          camera.aspect.toFixed(3);

        if (proximaChaveLayout !== chaveLayout) {
          const layout = criarLayoutExplosao(partesVisiveis, camera.aspect);
          larguraEmpacotamento = layout.largura;
          alturaEmpacotamento = layout.altura;

          atlas.partes.forEach((parte, indice) => {
            const celula = layout.celulas.get(parte.id);
            deslocamentos[indice] = celula
              ? new T.Vector3(celula.x, celula.y + 0.85, 0)
              : centros[indice].clone();
          });

          chaveLayout = proximaChaveLayout;
          if (nivelExplosao > 0.05 && !estadoAtual.isolar) {
            ajustarCamera(
              estadoAtual.vista,
              Math.max(0, (nivelExplosao - 0.3) / 0.7),
            );
          }
        }

        atlas.partes.forEach((parte, indice) => {
          const centro = centros[indice];
          const destino = deslocamentos[indice];
          let deslocamentoX = 0;
          let deslocamentoY = 0;
          let deslocamentoZ = 0;

          if (nivelExplosao <= 0.45) {
            const progresso = nivelExplosao / 0.45;
            const grupo = SISTEMAS.findIndex(
              (sistema) => sistema.id === parte.sistema,
            );
            const angulo = (grupo / SISTEMAS.length) * Math.PI * 2;
            deslocamentoX = Math.sin(angulo) * progresso * 0.48;
            deslocamentoY = (centro.y - 0.85) * progresso * 0.28;
            deslocamentoZ = Math.cos(angulo) * progresso * 0.48;
          } else {
            const progresso = (nivelExplosao - 0.45) / 0.55;
            const grupo = SISTEMAS.findIndex(
              (sistema) => sistema.id === parte.sistema,
            );
            const angulo = (grupo / SISTEMAS.length) * Math.PI * 2;
            deslocamentoX = T.MathUtils.lerp(
              Math.sin(angulo) * 0.48,
              destino.x - centro.x,
              progresso,
            );
            deslocamentoY = T.MathUtils.lerp(
              (centro.y - 0.85) * 0.28,
              destino.y - centro.y,
              progresso,
            );
            deslocamentoZ = T.MathUtils.lerp(
              Math.cos(angulo) * 0.48,
              -centro.z,
              progresso,
            );
          }

          const selecionada = selecao.has(parte.id);
          dadosPartes.set(
            [
              deslocamentoX,
              deslocamentoY,
              deslocamentoZ,
              (estadoAtual.isolar
                ? selecionada
                : sistemasVisiveis.has(parte.sistema) || selecionada)
                ? 1
                : 0,
            ],
            indice * 4,
          );
          dadosSelecao[indice * 4] = selecionada ? 255 : 0;

          posicoesMarcadores.set(
            dadosPartes[indice * 4 + 3] > 0.5
              ? [
                  centro.x + deslocamentoX,
                  centro.y + deslocamentoY,
                  centro.z + deslocamentoZ,
                ]
              : [10000, 10000, 10000],
            indice * 3,
          );

          const malha = malhasSelecao[indice];
          if (malha) {
            malha.position.set(
              deslocamentoX,
              deslocamentoY,
              deslocamentoZ,
            );
            malha.updateMatrix();
            malha.updateMatrixWorld(true);
          }
        });

        texturaPartes.needsUpdate = true;
        texturaSelecao.needsUpdate = true;
        geometriaMarcadores.attributes.position.needsUpdate = true;
        ultimoEstado = estadoAtual;
        ultimaIntensidadeLayout = nivelExplosao;
        precisaRenderizar = true;
      }

      if (
        estadoAtual.vista !== ultimaVista ||
        estadoAtual.reinicio !== ultimoReinicio
      ) {
        ajustarCamera(estadoAtual.vista, nivelExplosao);
        ultimaVista = estadoAtual.vista;
        ultimoReinicio = estadoAtual.reinicio;
      }

      if (emMovimento && !estadoAtual.isolar) {
        ajustarCamera(
          nivelExplosao > 0.5 ? 'frente' : estadoAtual.vista,
          Math.max(0, (nivelExplosao - 0.3) / 0.7),
        );
      }

      const chaveIsolamento = estadoAtual.isolar
        ? `${estadoAtual.selecionados.join(',')}:${estadoAtual.reinicio}:${
            estadoAtual.inspetorAberto
          }:${camera.aspect}`
        : '';

      if (
        chaveIsolamento !== ultimaChaveIsolamento ||
        (estadoAtual.isolar && emMovimento)
      ) {
        if (estadoAtual.isolar) {
          const caixa = new T.Box3();
          atlas.partes.forEach((parte, indice) => {
            if (estadoAtual.selecionados.includes(parte.id)) {
              caixa.union(
                limites[indice]
                  .clone()
                  .translate(
                    new T.Vector3(
                      dadosPartes[indice * 4],
                      dadosPartes[indice * 4 + 1],
                      dadosPartes[indice * 4 + 2],
                    ),
                  ),
              );
            }
          });

          if (!caixa.isEmpty()) {
            const centro = caixa.getCenter(new T.Vector3());
            const tamanho = caixa.getSize(new T.Vector3());
            const largura = elemento.clientWidth;
            const altura = elemento.clientHeight;
            const movel = largura < 768;
            const paisagem = largura > altura && altura <= 600;
            let esquerda = 20;
            let direita = largura - 20;
            let topo = movel ? 175 : 110;
            let base = altura - 170;

            // Reserva espaço para o painel de detalhes antes de enquadrar a peça.
            if (estadoAtual.inspetorAberto) {
              if (paisagem) {
                direita = largura - 335;
                topo = 100;
                base = altura - 125;
              } else if (movel) {
                const painelDetalhe = document
                  .querySelector('.detail-sheet')
                  ?.getBoundingClientRect();
                const cabecalho = document
                  .querySelector('.identity')
                  ?.getBoundingClientRect();
                topo = (cabecalho?.bottom ?? 94) + 16;
                base = (painelDetalhe?.top ?? altura * 0.58 - 139) - 16;
              } else {
                direita = largura - 370;
                esquerda = largura > 1100 ? 285 : 25;
              }
            }

            const larguraDisponivel = Math.max(150, direita - esquerda);
            const alturaDisponivel = Math.max(40, base - topo);
            camera.setViewOffset(
              largura,
              altura,
              largura / 2 - (esquerda + direita) / 2,
              altura / 2 - (topo + base) / 2,
              largura,
              altura,
            );

            const distancia = Math.max(
              0.07,
              (Math.max(
                (tamanho.y * altura) / alturaDisponivel,
                (tamanho.x * largura) / larguraDisponivel / camera.aspect,
                tamanho.z,
              ) /
                (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)))) *
                1.35,
            );
            controles.maxDistance = Math.max(40, distancia * 2);
            controles.target.copy(centro);
            camera.position
              .copy(centro)
              .add(
                new T.Vector3(0.2, 0.1, 1)
                  .normalize()
                  .multiplyScalar(distancia),
              );
            controles.update();
            precisaRenderizar = true;
          }
        } else if (ultimaChaveIsolamento) {
          camera.clearViewOffset();
          ajustarCamera(estadoAtual.vista, nivelExplosao);
        }

        ultimaChaveIsolamento = chaveIsolamento;
      }

      controles.enableRotate = nivelExplosao < 0.8;
      controles.mouseButtons.LEFT =
        nivelExplosao < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN;
      controles.touches.ONE =
        nivelExplosao < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN;
      chao.visible =
        plataforma.visible =
        anel.visible =
        anelInterno.visible =
          nivelExplosao < 0.5 && !estadoAtual.isolar;
      marcadores.visible = nivelExplosao > 0.75;
      controles.autoRotate =
        estadoAtual.rotacionar && !estadoAtual.isolar && nivelExplosao < 0.4;
      controles.autoRotateSpeed = 0.65;
      controles.update();

      if (controles.autoRotate) {
        precisaRenderizar = true;
      }

      if (precisaRenderizar) {
        renderizador.render(cena, camera);
        alvosTela = [];

        if (nivelExplosao > 0.45) {
          const existeEstruturaSolida = atlas.partes.some(
            (parte, indice) =>
              parte.sistema !== 'tegumentar' &&
              dadosPartes[indice * 4 + 3] > 0.5,
          );

          atlas.partes.forEach((parte, indice) => {
            if (
              dadosPartes[indice * 4 + 3] < 0.5 ||
              (existeEstruturaSolida && parte.sistema === 'tegumentar')
            ) {
              return;
            }

            let esquerda = Infinity;
            let direita = -Infinity;
            let topo = Infinity;
            let base = -Infinity;

            // Projeta os oito cantos da caixa 3D para criar uma área clicável 2D.
            for (let canto = 0; canto < 8; canto += 1) {
              projetado
                .set(
                  parte.limites[canto & 1 ? 1 : 0][0] +
                    dadosPartes[indice * 4],
                  parte.limites[canto & 2 ? 1 : 0][1] +
                    dadosPartes[indice * 4 + 1],
                  parte.limites[canto & 4 ? 1 : 0][2] +
                    dadosPartes[indice * 4 + 2],
                )
                .project(camera);

              const x = ((projetado.x + 1) * elemento.clientWidth) / 2;
              const y = ((1 - projetado.y) * elemento.clientHeight) / 2;
              esquerda = Math.min(esquerda, x);
              direita = Math.max(direita, x);
              topo = Math.min(topo, y);
              base = Math.max(base, y);
            }

            projetado
              .copy(centros[indice])
              .add(
                new T.Vector3(
                  dadosPartes[indice * 4],
                  dadosPartes[indice * 4 + 1],
                  dadosPartes[indice * 4 + 2],
                ),
              )
              .project(camera);

            if (projetado.z < -1 || projetado.z > 1) {
              return;
            }

            alvosTela.push({
              indice,
              x: ((projetado.x + 1) * elemento.clientWidth) / 2,
              y: ((1 - projetado.y) * elemento.clientHeight) / 2,
              esquerda,
              direita,
              topo,
              base,
            });
          });
        }

        precisaRenderizar = false;
      }
    };

    animar();

    const tratarPerdaContexto = (evento: Event) => {
      evento.preventDefault();
      aoFalhar(
        'A sessão 3D foi pausada pelo dispositivo. Recarregue a página para continuar.',
      );
    };
    renderizador.domElement.addEventListener(
      'webglcontextlost',
      tratarPerdaContexto,
    );

    /** Libera GPU, eventos e observadores ao desmontar o componente. */
    return () => {
      descartado = true;
      controlador.abort();
      cancelAnimationFrame(quadroAnimacao);
      observador.disconnect();
      controles.dispose();
      geometrias.forEach((geometria) => geometria.dispose());
      materiais.forEach((material) => material.dispose());
      cena.traverse((objeto) => {
        if (objeto instanceof T.Mesh && !geometrias.includes(objeto.geometry)) {
          objeto.geometry.dispose();
          const materiaisObjeto = Array.isArray(objeto.material)
            ? objeto.material
            : [objeto.material];
          materiaisObjeto.forEach((material) => material.dispose());
        }
      });
      ambiente.dispose();
      texturaPartes.dispose();
      texturaSelecao.dispose();
      geometriaMarcadores.dispose();
      materialMarcadores.dispose();
      dica.remove();
      renderizador.dispose();
      renderizador.domElement.remove();
    };
  }, [atlas]);

  return <div className="scene" ref={elementoHospedeiro} />;
}
