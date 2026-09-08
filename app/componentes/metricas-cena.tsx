import type {MetricasRenderizacao} from '../anatomia.ts';

export default function MetricasCena({metricas}: {metricas: MetricasRenderizacao}) {
  return (
    <aside className="performance-panel" aria-label="Métricas de renderização">
      <strong>3D</strong>
      <span>{metricas.fps} FPS</span>
      <span>{metricas.chamadas} draw calls</span>
      <span>{metricas.triangulos.toLocaleString('pt-BR')} triângulos</span>
      <span>{metricas.geometrias} geometrias · {metricas.texturas} texturas</span>
    </aside>
  );
}
