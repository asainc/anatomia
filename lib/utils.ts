import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

/**
 * Combina classes condicionais e resolve conflitos de classes Tailwind.
 * O nome `cn` é preservado por ser a convenção usada pelos componentes shadcn/ui.
 */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}
