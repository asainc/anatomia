const PARAMETRO = 'estrutura';

export function lerEstruturaDaUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return parametros.get(PARAMETRO);
}

export function atualizarEstruturaNaUrl(id: string | null): void {
  if (typeof window === 'undefined') return;
  const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (id) parametros.set(PARAMETRO, id);
  else parametros.delete(PARAMETRO);
  const hash = parametros.toString();
  history.replaceState(null, '', `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`);
}

export async function copiarLinkEstrutura(id: string): Promise<boolean> {
  atualizarEstruturaNaUrl(id);
  try {
    await navigator.clipboard.writeText(location.href);
    return true;
  } catch {
    return false;
  }
}
