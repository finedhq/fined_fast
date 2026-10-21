// On-screen keyboard (app build only): hide the tab bar while typing and keep the field in view.
import { Keyboard } from '@capacitor/keyboard';

export function setupKeyboard() {
  const root = document.documentElement;
  Keyboard.addListener('keyboardWillShow', () => root.classList.add('app-keyboard-open'));
  Keyboard.addListener('keyboardDidShow', () => {
    const field = document.activeElement;
    if (field && /^(INPUT|TEXTAREA|SELECT)$/.test(field.tagName)) field.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  Keyboard.addListener('keyboardWillHide', () => root.classList.remove('app-keyboard-open'));
}
