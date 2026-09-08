import type {EstadoCena, IdSistema, Vista} from '../anatomia.ts';

const CHAVE = 'atlas-anatomico-3d:preferencias:v2';

export interface PreferenciasAtlas {
  explosao: number;
  sistemasVisiveis: IdSistema[];
  vista: Vista;
  mostrarMetricas: boolean;
}

export function carregarPreferencias(padrao: PreferenciasAtlas): PreferenciasAtlas {
  if (typeof window === 'undefined') return padrao;
  try {
    const texto = localStorage.getItem(CHAVE);
    if (!texto) return padrao;
    const dados = JSON.parse(texto) as Partial<PreferenciasAtlas>;
    return {
      explosao: typeof dados.explosao === 'number' ? Math.min(1, Math.max(0, dados.explosao)) : padrao.explosao,
      sistemasVisiveis: Array.isArray(dados.sistemasVisiveis) ? dados.sistemasVisiveis : padrao.sistemasVisiveis,
      vista: typeof dados.vista === 'string' ? (dados.vista as Vista) : padrao.vista,
      mostrarMetricas: typeof dados.mostrarMetricas === 'boolean' ? dados.mostrarMetricas : padrao.mostrarMetricas,
    };
  } catch {
    return padrao;
  }
}

export function salvarPreferencias(estado: EstadoCena, mostrarMetricas: boolean): void {
  if (typeof window === 'undefined') return;
  const preferencias: PreferenciasAtlas = {
    explosao: estado.explosao,
    sistemasVisiveis: estado.sistemasVisiveis,
    vista: estado.vista,
    mostrarMetricas,
  };
  localStorage.setItem(CHAVE, JSON.stringify(preferencias));
}
