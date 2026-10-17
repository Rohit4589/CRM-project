/**
 * Automatically format text strings to Title Case:
 * - First letter of each word is capitalized.
 * - If user types in ALL CAPS (e.g. "MAHENDRA SHARMA"), converts to Title Case ("Mahendra Sharma").
 * - If user types all lowercase (e.g. "ekjfejfb kbajskasjk"), converts to Title Case ("Ekjfejfb Kbajskasjk").
 */
export function toTitleCase(val) {
  if (!val || typeof val !== 'string') return val;
  // Match each word starting after beginning of string, space, slash, dash, comma, dot, parenthesis, etc.
  return val.replace(/(^|[\s\/\-\,\.\(\)\[\]])([a-zA-Z])([a-zA-Z]*)/g, (match, prefix, first, rest) => {
    return prefix + first.toUpperCase() + rest.toLowerCase();
  });
}

/**
 * Check whether an input or textarea element should be auto-capitalized.
 * Excludes:
 * - Passwords (type="password" or name/id contains "password" or "pin")
 * - Usernames (name/id/autocomplete contains "username")
 * - Emails (type="email" or name/id/placeholder contains "email")
 * - Numeric / date / tel / code inputs (type="tel", "number", "date", siteCode, codes)
 * - GPS coordinates
 */
export function shouldAutoCapitalize(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName ? target.tagName.toUpperCase() : '';
  if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') return false;
  if (target.readOnly || target.disabled) return false;

  const type = (target.getAttribute('type') || target.type || 'text').toLowerCase();
  const excludedTypes = [
    'password', 'email', 'number', 'tel', 'date', 'time',
    'datetime-local', 'month', 'week', 'file', 'checkbox',
    'radio', 'range', 'color', 'hidden'
  ];
  if (excludedTypes.includes(type)) return false;

  const name = (target.getAttribute('name') || target.name || '').toLowerCase();
  const id = (target.getAttribute('id') || target.id || '').toLowerCase();
  const placeholder = (target.getAttribute('placeholder') || target.placeholder || '').toLowerCase();
  const auto = (target.getAttribute('autocomplete') || target.autocomplete || '').toLowerCase();
  const inputMode = (target.getAttribute('inputmode') || target.inputMode || '').toLowerCase();
  const pattern = target.getAttribute('pattern') || target.pattern || '';

  // Exclude passwords and PINs
  if (name.includes('password') || id.includes('password') || auto.includes('password')) return false;
  if (name.includes('pin') || id.includes('pin') || placeholder.includes('pin')) return false;

  // Exclude usernames
  if (name.includes('username') || id.includes('username') || auto.includes('username') || placeholder.includes('username')) return false;

  // Exclude emails
  if (name.includes('email') || id.includes('email') || placeholder.includes('@')) return false;

  // Exclude numeric / codes / order numbers / phone / latlng
  if (inputMode === 'numeric' || inputMode === 'decimal' || pattern === '[0-9]*') return false;
  if (name.includes('code') || id.includes('code') || placeholder.includes('001') || placeholder.includes('002')) return false;
  if (name.includes('latlng') || id.includes('latlng') || placeholder.includes('18.') || placeholder.includes('lat')) return false;
  if (name.includes('phone') || id.includes('phone') || placeholder.includes('98765')) return false;

  return true;
}

/**
 * Install global DOM listener that handles automatic title casing for all text inputs.
 */
export function initGlobalAutoCapitalize() {
  if (typeof window === 'undefined') return;

  let isFormatting = false;

  const handleInputOrBlur = (e) => {
    if (isFormatting) return;
    const target = e.target;
    if (!shouldAutoCapitalize(target)) return;

    const original = target.value;
    if (!original || typeof original !== 'string') return;

    const formatted = toTitleCase(original);
    if (formatted === original) return;

    isFormatting = true;
    try {
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Use native HTMLInputElement/HTMLTextAreaElement value descriptor setter
      // so React's internal value tracker is notified and dispatches synthetic events correctly
      const proto = target instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      if (nativeSetter) {
        nativeSetter.call(target, formatted);
      } else {
        target.value = formatted;
      }

      if (start !== null && end !== null && typeof target.setSelectionRange === 'function') {
        target.setSelectionRange(start, end);
      }

      // Fire React's input event so all component states update
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (err) {
      console.warn('Auto-capitalize error:', err);
    } finally {
      isFormatting = false;
    }
  };

  // Listen on both 'input' (while typing or pasting) and 'blur' (when leaving the field)
  window.addEventListener('input', handleInputOrBlur, true);
  window.addEventListener('blur', handleInputOrBlur, true);
}
