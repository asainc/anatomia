import {
  PROGRESSO_RESIDENCIA_VAZIO,
  type ProgressoResidencia,
} from '../dominio/estudo-residencia.ts';

const CHAVE = 'atlas-anatomico:progresso-residencia:v1';

/** Carrega o progresso local sem enviar dados do estudante para servidores. */
export function carregarProgressoResidencia(): ProgressoResidencia {
  if (typeof window === 'undefined') return PROGRESSO_RESIDENCIA_VAZIO;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return PROGRESSO_RESIDENCIA_VAZIO;
    const dados = JSON.parse(bruto) as Partial<ProgressoResidencia>;
    if (dados.versao !== 1 || typeof dados.registros !== 'object' || !Array.isArray(dados.historico)) {
      return PROGRESSO_RESIDENCIA_VAZIO;
    }
    return {
      ...PROGRESSO_RESIDENCIA_VAZIO,
      ...dados,
      registros: dados.registros ?? {},
      historico: dados.historico ?? [],
    };
  } catch {
    return PROGRESSO_RESIDENCIA_VAZIO;
  }
}

export function salvarProgressoResidencia(progresso: ProgressoResidencia): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(progresso));
  } catch {
    // Falhas de quota/privacidade não devem impedir o uso do atlas.
  }
}

export function limparProgressoResidencia(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Mantém comportamento tolerante a navegadores com armazenamento bloqueado.
  }
}
