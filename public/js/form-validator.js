/**
 * FormValidator — Lightweight client-side validation utility
 * Mirrors backend Joi schemas for consistent validation UX.
 *
 * Usage:
 *   const rules = {
 *     firstName: { required: true, minLength: 2, maxLength: 50, pattern: /^[A-Za-z]+$/, patternMsg: 'Only letters allowed' },
 *     email:     { required: true, isEmail: true, emailTlds: ['com','net','org','io'] },
 *     phone:     { required: true, exactLength: 10, pattern: /^[0-9]+$/, patternMsg: 'Only digits allowed' },
 *     password:  { required: true, minLength: 8 },
 *     confirmPassword: { required: true, matchField: 'password', matchMsg: 'Passwords do not match' },
 *   };
 *
 *   // Validate all — returns true if valid
 *   const ok = FormValidator.validate(rules);
 *
 *   // Bind live blur/input validation
 *   FormValidator.bindLiveValidation(rules);
 */

const FormValidator = (() => {

  /* ── helpers ─────────────────────────────────────────── */

  function getInput(fieldId) {
    return document.getElementById(fieldId);
  }

  function getOrCreateError(fieldId) {
    const errId = fieldId + 'Error';
    let el = document.getElementById(errId);
    if (!el) {
      el = document.createElement('p');
      el.id = errId;
      el.className = 'mt-1 text-sm text-red-500';
      const input = getInput(fieldId);
      if (input) input.parentElement.appendChild(el);
    }
    return el;
  }

  function showFieldError(fieldId, msg) {
    const errEl = getOrCreateError(fieldId);
    errEl.textContent = msg;
    const input = getInput(fieldId);
    if (input) {
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-300');
    }
  }

  function clearFieldError(fieldId) {
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) errEl.textContent = '';
    const input = getInput(fieldId);
    if (input) {
      input.classList.remove('border-red-500');
      input.classList.add('border-gray-300');
    }
  }

  function clearAllErrors(rules) {
    Object.keys(rules).forEach(clearFieldError);
  }

  /* ── single-field validator ──────────────────────────── */

  function validateField(fieldId, rule, allRules) {
    const input = getInput(fieldId);
    if (!input) return '';

    // For select elements, use value directly
    const isSelect = input.tagName === 'SELECT';
    const raw = input.value;
    const value = isSelect ? raw : raw.trim();

    const label = rule.label || fieldId.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

    // required
    if (rule.required && !value) {
      return `${label} is required`;
    }

    // skip further checks if empty and not required
    if (!value) return '';

    // minLength
    if (rule.minLength && value.length < rule.minLength) {
      return `${label} must be at least ${rule.minLength} characters`;
    }

    // maxLength
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${label} cannot exceed ${rule.maxLength} characters`;
    }

    // exactLength
    if (rule.exactLength && value.length !== rule.exactLength) {
      return `${label} must be exactly ${rule.exactLength} characters`;
    }

    // pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.patternMsg || `${label} format is invalid`;
    }

    // isEmail
    if (rule.isEmail) {
      const tlds = rule.emailTlds || ['com', 'net', 'org', 'io'];
      const re = new RegExp('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.(' + tlds.join('|') + ')$', 'i');
      if (!re.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // matchField
    if (rule.matchField) {
      const other = getInput(rule.matchField);
      if (other && value !== other.value) {
        return rule.matchMsg || 'Values do not match';
      }
    }

    // oneOf (for select / enum)
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      return `${label} must be one of: ${rule.oneOf.join(', ')}`;
    }

    // min (numeric)
    if (rule.min !== undefined) {
      const num = parseFloat(value);
      if (isNaN(num) || num < rule.min) {
        return `${label} must be at least ${rule.min}`;
      }
    }

    // isPositive
    if (rule.isPositive) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return `${label} must be a positive number`;
      }
    }

    // isDate
    if (rule.isDate) {
      if (isNaN(Date.parse(value))) {
        return `${label} must be a valid date`;
      }
    }

    // dateAfterField
    if (rule.dateAfterField) {
      const otherInput = getInput(rule.dateAfterField);
      if (otherInput && otherInput.value) {
        const thisDate = new Date(value);
        const otherDate = new Date(otherInput.value);
        if (thisDate <= otherDate) {
          return rule.dateAfterMsg || `${label} must be after ${rule.dateAfterField}`;
        }
      }
    }

    // custom validator function
    if (typeof rule.custom === 'function') {
      const msg = rule.custom(value);
      if (msg) return msg;
    }

    return '';
  }

  /* ── public API ──────────────────────────────────────── */

  /**
   * Validate all fields. Shows inline errors. Returns true if all valid.
   */
  function validate(rules) {
    clearAllErrors(rules);
    let firstErrorField = null;
    let valid = true;

    for (const [fieldId, rule] of Object.entries(rules)) {
      const msg = validateField(fieldId, rule, rules);
      if (msg) {
        showFieldError(fieldId, msg);
        if (!firstErrorField) firstErrorField = fieldId;
        valid = false;
      }
    }

    // Scroll to first error
    if (firstErrorField) {
      const el = getInput(firstErrorField);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
  }

  /**
   * Bind live validation on blur and input events.
   */
  function bindLiveValidation(rules) {
    for (const [fieldId, rule] of Object.entries(rules)) {
      const input = getInput(fieldId);
      if (!input) continue;

      // Validate on blur
      input.addEventListener('blur', () => {
        const msg = validateField(fieldId, rule, rules);
        if (msg) {
          showFieldError(fieldId, msg);
        } else {
          clearFieldError(fieldId);
        }
      });

      // Clear error on input (debounced feel)
      input.addEventListener('input', () => {
        // Clear immediately when user starts typing
        const errEl = document.getElementById(fieldId + 'Error');
        if (errEl && errEl.textContent) {
          clearFieldError(fieldId);
        }
      });
    }
  }

  return { validate, bindLiveValidation, showFieldError, clearFieldError, clearAllErrors };
})();
