/**
 * Automatically format text strings to Smart Title Case:
 * - First letter of each word is capitalized.
 * - Preserves user-entered uppercase acronyms (e.g. MM, SS, BWR, PVC, LED, TV).
 * - Keeps minor helping words (of, the, and, in, a, with, etc.) in clean lowercase.
 */

// Minor helping words to keep lowercase in title case (unless at sentence start)
const MINOR_WORDS = new Set([
  'a', 'an', 'the',
  'and', 'or', 'nor', 'but',
  'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with', 'from', 'into', 'onto', 'as', 'per', 'etc'
]);

// Interior industry acronyms to keep or format as uppercase
const KNOWN_ACRONYMS = new Set([
  'SS', 'BWR', 'PVC', 'LED', 'PU', 'MS', 'CNC', 'HDHMR', 'MDF', 'GI', 'CP', 'WPC', 'ACP', 'MM', 'RFT', 'SQFT', 'NOS', 'TV', '2D', '3D'
]);

export function toTitleCase(val) {
  if (!val || typeof val !== 'string') return val;

  return val.replace(/\b([A-Za-z0-9'-]+)\b/g, (match, word, offset) => {
    const upperWord = word.toUpperCase();

    // 1. Known interior acronyms (turn lowercase ss -> SS, bwr -> BWR, tv -> TV)
    if (KNOWN_ACRONYMS.has(upperWord)) {
      return upperWord;
    }

    const lower = word.toLowerCase();
    // 2. Helping / minor words: keep lowercase UNLESS it is the very first word or starts a sentence
    const isStartOfSentence = offset === 0 || /[\n\r.!?]\s*$/.test(val.slice(0, offset));
    if (!isStartOfSentence && MINOR_WORDS.has(lower)) {
      return lower;
    }

    // 3. If word contains 2 or more uppercase letters that user explicitly typed (e.g. AutoCAD, iPhone, G-Profile), preserve exact casing
    const upperCount = word.replace(/[^A-Z]/g, '').length;
    if (upperCount >= 2 && word !== upperWord) {
      return word;
    }

    // 4. Standard Title Case: capitalize first letter, rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Check whether an input or textarea element should be auto-capitalized.
 * Excludes:
 * - Elements with data-custom-casing="true" or data-col="1"
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

  // Respect components with their own custom casing logic (like Estimate description)
  if (target.getAttribute('data-custom-casing') === 'true' || target.getAttribute('data-col') === '1' || target.getAttribute('data-no-auto-capitalize') === 'true') {
    return false;
  }

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

  // Handle paste: auto-capitalize pasted text
  const handlePaste = (e) => {
    const target = e.target;
    if (!shouldAutoCapitalize(target)) return;
    setTimeout(() => {
      handleInputOrBlur({ target });
    }, 0);
  };

  // Listen on 'blur' (when leaving the field) and 'paste' (when pasting text)
  // We do NOT modify .value synchronously on 'input' while actively typing,
  // because in React controlled inputs and HTML DOM, programmatically assigning .value
  // causes the browser to reset the caret/cursor to the end of the text.
  window.addEventListener('blur', handleInputOrBlur, true);
  window.addEventListener('paste', handlePaste, true);
}
