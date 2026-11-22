/**
 * Universal Form Keyboard Navigation Utility
 * Enables smooth 2D Arrow Key (Up, Down, Left, Right) & Enter navigation across form inputs.
 * - ArrowUp/ArrowDown: Moves focus vertically between inputs based on spatial positioning.
 * - ArrowLeft/ArrowRight: Moves focus horizontally between inputs (while preserving internal cursor movement inside text).
 * - Enter: Advances focus to the next logical input, or submits if on the submit button.
 * - Number inputs: Prevents annoying number incrementing on arrow keys and navigates fields instead.
 */

const isAtStart = (el) => {
  if (!el) return true;
  const tag = el.tagName ? el.tagName.toUpperCase() : '';
  if (tag === 'SELECT' || tag === 'BUTTON') return true;
  if (typeof el.selectionStart === 'number') {
    const val = el.value || '';
    return el.selectionStart === 0 && (el.selectionEnd === 0 || el.selectionEnd === val.length);
  }
  return true;
};

const isAtEnd = (el) => {
  if (!el) return true;
  const tag = el.tagName ? el.tagName.toUpperCase() : '';
  if (tag === 'SELECT' || tag === 'BUTTON') return true;
  if (typeof el.selectionStart === 'number') {
    const len = el.value?.length || 0;
    return el.selectionEnd === len && (el.selectionStart === len || el.selectionStart === 0);
  }
  return true;
};

const isAtFirstLine = (textarea) => {
  if (!textarea || typeof textarea.selectionStart !== 'number') return true;
  const before = textarea.value.substring(0, textarea.selectionStart);
  return !before.includes('\n');
};

const isAtLastLine = (textarea) => {
  if (!textarea || typeof textarea.selectionEnd !== 'number') return true;
  const after = textarea.value.substring(textarea.selectionEnd);
  return !after.includes('\n');
};

export const focusFormField = (el) => {
  if (!el) return;
  el.focus();
  if (el.tagName === 'INPUT' && typeof el.select === 'function') {
    const type = (el.type || '').toLowerCase();
    if (!['checkbox', 'radio', 'date', 'time', 'button', 'submit', 'color', 'file'].includes(type)) {
      try {
        el.select();
      } catch (err) {
        // Some input types throw on select()
      }
    }
  }
  try {
    el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  } catch (err) {}
};

/**
 * Attach this handler to <form onKeyDown={handleFormKeyDown}> or container <div>
 */
export const handleFormKeyDown = (e, options = {}) => {
  const {
    submitOnLastEnter = true,
    selector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), button[type="submit"]:not([disabled])'
  } = options;

  const key = e.key;
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
    return;
  }

  const container = e.currentTarget;
  const active = document.activeElement;

  if (!container || !active || !container.contains(active)) {
    return;
  }

  // If inside an open custom dropdown or autocomplete popup, don't hijack keys
  if (active.getAttribute('aria-expanded') === 'true' || active.getAttribute('data-dropdown-open') === 'true') {
    return;
  }

  // Query all visible, focusable form controls
  const allFocusable = Array.from(container.querySelectorAll(selector)).filter(el => {
    return el.offsetParent !== null || el.getClientRects().length > 0;
  });

  if (allFocusable.length <= 1) return;

  const currentIndex = allFocusable.indexOf(active);
  if (currentIndex === -1) return;

  const tagName = active.tagName.toUpperCase();
  const isTextarea = tagName === 'TEXTAREA';
  const isSelect = tagName === 'SELECT';
  const isButton = tagName === 'BUTTON';

  // Handle Enter key navigation
  if (key === 'Enter') {
    if (isTextarea) return; // Allow normal newlines in textareas
    if (isButton) return;   // Allow clicking buttons with Enter

    e.preventDefault();
    if (currentIndex < allFocusable.length - 1) {
      focusFormField(allFocusable[currentIndex + 1]);
    } else if (submitOnLastEnter) {
      const submitBtn = container.querySelector('button[type="submit"]');
      if (submitBtn && submitBtn !== active) {
        focusFormField(submitBtn);
      } else if (typeof container.requestSubmit === 'function') {
        container.requestSubmit();
      }
    }
    return;
  }

  // Handle Alt+Arrow on <select> (standard browser shortcut to open select dropdown)
  if (isSelect && e.altKey && (key === 'ArrowDown' || key === 'ArrowUp')) {
    return;
  }

  // Text editing boundary checks
  if (key === 'ArrowLeft') {
    if (!isAtStart(active)) return;
  } else if (key === 'ArrowRight') {
    if (!isAtEnd(active)) return;
  } else if (key === 'ArrowUp') {
    if (isTextarea && !isAtFirstLine(active)) return;
  } else if (key === 'ArrowDown') {
    if (isTextarea && !isAtLastLine(active)) return;
  }

  const activeRect = active.getBoundingClientRect();
  let nextElement = null;

  if (key === 'ArrowDown') {
    const candidates = allFocusable.filter(el => {
      if (el === active) return false;
      const r = el.getBoundingClientRect();
      return r.top >= activeRect.top + 8;
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const vDiffA = ra.top - activeRect.top;
        const vDiffB = rb.top - activeRect.top;
        const hDiffA = Math.abs(ra.left - activeRect.left);
        const hDiffB = Math.abs(rb.left - activeRect.left);
        return (vDiffA * 1.5 + hDiffA) - (vDiffB * 1.5 + hDiffB);
      });
      nextElement = candidates[0];
    } else if (currentIndex < allFocusable.length - 1) {
      nextElement = allFocusable[currentIndex + 1];
    }
  } else if (key === 'ArrowUp') {
    const candidates = allFocusable.filter(el => {
      if (el === active) return false;
      const r = el.getBoundingClientRect();
      return r.bottom <= activeRect.bottom - 8;
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const vDiffA = activeRect.bottom - ra.bottom;
        const vDiffB = activeRect.bottom - rb.bottom;
        const hDiffA = Math.abs(ra.left - activeRect.left);
        const hDiffB = Math.abs(rb.left - activeRect.left);
        return (vDiffA * 1.5 + hDiffA) - (vDiffB * 1.5 + hDiffB);
      });
      nextElement = candidates[0];
    } else if (currentIndex > 0) {
      nextElement = allFocusable[currentIndex - 1];
    }
  } else if (key === 'ArrowRight') {
    const candidates = allFocusable.filter(el => {
      if (el === active) return false;
      const r = el.getBoundingClientRect();
      return r.left >= activeRect.left + 8;
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const centerActive = (activeRect.top + activeRect.bottom) / 2;
        const centerA = (ra.top + ra.bottom) / 2;
        const centerB = (rb.top + rb.bottom) / 2;
        const vDiffA = Math.abs(centerA - centerActive);
        const vDiffB = Math.abs(centerB - centerActive);
        const hDiffA = ra.left - activeRect.left;
        const hDiffB = rb.left - activeRect.left;
        return (vDiffA * 3 + hDiffA) - (vDiffB * 3 + hDiffB);
      });
      nextElement = candidates[0];
    } else if (currentIndex < allFocusable.length - 1) {
      nextElement = allFocusable[currentIndex + 1];
    }
  } else if (key === 'ArrowLeft') {
    const candidates = allFocusable.filter(el => {
      if (el === active) return false;
      const r = el.getBoundingClientRect();
      return r.right <= activeRect.right - 8;
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const centerActive = (activeRect.top + activeRect.bottom) / 2;
        const centerA = (ra.top + ra.bottom) / 2;
        const centerB = (rb.top + rb.bottom) / 2;
        const vDiffA = Math.abs(centerA - centerActive);
        const vDiffB = Math.abs(centerB - centerActive);
        const hDiffA = activeRect.right - ra.right;
        const hDiffB = activeRect.right - rb.right;
        return (vDiffA * 3 + hDiffA) - (vDiffB * 3 + hDiffB);
      });
      nextElement = candidates[0];
    } else if (currentIndex > 0) {
      nextElement = allFocusable[currentIndex - 1];
    }
  }

  if (nextElement) {
    e.preventDefault();
    focusFormField(nextElement);
  }
};
