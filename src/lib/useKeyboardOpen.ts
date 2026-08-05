import { useEffect, useState } from 'react';

const isTypingElement = (el: Element | null): boolean =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true');

/**
 * Détecte si le clavier virtuel est probablement ouvert (un champ de saisie
 * a le focus). Sur mobile, les éléments `position: fixed` (bouton
 * WhatsApp, bulle de chat, barre de navigation basse) ne se repositionnent
 * pas de façon fiable par rapport au viewport visuel une fois le clavier
 * affiché — ils finissent superposés au contenu/formulaire au lieu de
 * rester en bas de l'écran. Les composants concernés utilisent ce hook
 * pour se masquer tant qu'un champ est actif.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => setOpen(isTypingElement(e.target as Element));
    const onFocusOut = () => setOpen(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return open;
}
