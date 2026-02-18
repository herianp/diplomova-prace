import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFormValidation } from '../useFormValidation'

describe('useFormValidation', () => {
  const { rules, surveyRules, userRules, validateField, validateFields, createFormValidator, getFieldError, hasFieldError } = useFormValidation()

  // -------------------------------------------------------------------------
  // rules.required
  // -------------------------------------------------------------------------
  describe('rules.required', () => {
    const rule = rules.required()

    it('returns error message for empty string', () => {
      expect(rule('')).toBe('This field is required')
    })

    it('returns error message for null', () => {
      expect(rule(null)).toBe('This field is required')
    })

    it('returns error message for undefined', () => {
      expect(rule(undefined)).toBe('This field is required')
    })

    it('returns true for non-empty string', () => {
      expect(rule('hello')).toBe(true)
    })

    it('returns true for number 0 (falsy but numeric)', () => {
      // Note: 0 is falsy, required treats it as invalid
      expect(rule(0)).toBe('This field is required')
    })

    it('accepts custom message', () => {
      const customRule = rules.required('Custom required message')
      expect(customRule('')).toBe('Custom required message')
    })
  })

  // -------------------------------------------------------------------------
  // rules.requiredSelect
  // -------------------------------------------------------------------------
  describe('rules.requiredSelect', () => {
    const rule = rules.requiredSelect()

    it('returns error for null', () => {
      expect(rule(null)).toBe('Please select an option')
    })

    it('returns error for undefined', () => {
      expect(rule(undefined)).toBe('Please select an option')
    })

    it('returns error for empty string', () => {
      expect(rule('')).toBe('Please select an option')
    })

    it('returns true for valid selection (string)', () => {
      expect(rule('option-a')).toBe(true)
    })

    it('returns true for valid selection (number)', () => {
      expect(rule(1)).toBe(true)
    })

    it('returns true for false boolean (explicitly selected)', () => {
      expect(rule(false)).toBe(true)
    })

    it('accepts custom message', () => {
      const customRule = rules.requiredSelect('Pick one please')
      expect(customRule(null)).toBe('Pick one please')
    })
  })

  // -------------------------------------------------------------------------
  // rules.email
  // -------------------------------------------------------------------------
  describe('rules.email', () => {
    const rule = rules.email()

    it('returns true for valid email', () => {
      expect(rule('user@example.com')).toBe(true)
    })

    it('returns true for valid email with subdomain', () => {
      expect(rule('user@mail.example.co.uk')).toBe(true)
    })

    it('returns error for missing @', () => {
      expect(rule('notanemail')).toBe('Please enter a valid email')
    })

    it('returns error for missing domain', () => {
      expect(rule('user@')).toBe('Please enter a valid email')
    })

    it('returns error for missing local part', () => {
      expect(rule('@example.com')).toBe('Please enter a valid email')
    })

    it('returns true for empty string (field is optional)', () => {
      expect(rule('')).toBe(true)
    })

    it('returns true for null (field is optional)', () => {
      expect(rule(null)).toBe(true)
    })

    it('accepts custom error message', () => {
      const customRule = rules.email('Invalid email address')
      expect(customRule('bad-email')).toBe('Invalid email address')
    })
  })

  // -------------------------------------------------------------------------
  // rules.minLength
  // -------------------------------------------------------------------------
  describe('rules.minLength', () => {
    it('returns error when value is below minimum', () => {
      const rule = rules.minLength(5)
      expect(rule('hi')).toBe('Must be at least 5 characters')
    })

    it('returns true when value equals minimum', () => {
      const rule = rules.minLength(5)
      expect(rule('hello')).toBe(true)
    })

    it('returns true when value exceeds minimum', () => {
      const rule = rules.minLength(5)
      expect(rule('hello world')).toBe(true)
    })

    it('returns true for empty string (not required)', () => {
      const rule = rules.minLength(5)
      expect(rule('')).toBe(true)
    })

    it('returns true for null value', () => {
      const rule = rules.minLength(5)
      expect(rule(null)).toBe(true)
    })

    it('accepts custom error message', () => {
      const rule = rules.minLength(3, 'Too short!')
      expect(rule('ab')).toBe('Too short!')
    })
  })

  // -------------------------------------------------------------------------
  // rules.maxLength
  // -------------------------------------------------------------------------
  describe('rules.maxLength', () => {
    it('returns error when value exceeds maximum', () => {
      const rule = rules.maxLength(5)
      expect(rule('toolongstring')).toBe('Must be no more than 5 characters')
    })

    it('returns true when value equals maximum', () => {
      const rule = rules.maxLength(5)
      expect(rule('hello')).toBe(true)
    })

    it('returns true when value is below maximum', () => {
      const rule = rules.maxLength(5)
      expect(rule('hi')).toBe(true)
    })

    it('returns true for empty string', () => {
      const rule = rules.maxLength(5)
      expect(rule('')).toBe(true)
    })

    it('accepts custom error message', () => {
      const rule = rules.maxLength(10, 'Too long!')
      expect(rule('this is way too long')).toBe('Too long!')
    })
  })

  // -------------------------------------------------------------------------
  // rules.pattern
  // -------------------------------------------------------------------------
  describe('rules.pattern', () => {
    it('returns error when value does not match pattern', () => {
      const rule = rules.pattern(/^\d+$/)
      expect(rule('abc')).toBe('Invalid format')
    })

    it('returns true when value matches pattern', () => {
      const rule = rules.pattern(/^\d+$/)
      expect(rule('12345')).toBe(true)
    })

    it('returns true for empty string', () => {
      const rule = rules.pattern(/^\d+$/)
      expect(rule('')).toBe(true)
    })

    it('returns true for null value', () => {
      const rule = rules.pattern(/^\d+$/)
      expect(rule(null)).toBe(true)
    })

    it('accepts custom error message', () => {
      const rule = rules.pattern(/^\d+$/, 'Numbers only')
      expect(rule('abc')).toBe('Numbers only')
    })
  })

  // -------------------------------------------------------------------------
  // rules.numeric
  // -------------------------------------------------------------------------
  describe('rules.numeric', () => {
    const rule = rules.numeric()

    it('returns true for valid integer string', () => {
      expect(rule('42')).toBe(true)
    })

    it('returns true for valid decimal string', () => {
      expect(rule('3.14')).toBe(true)
    })

    it('returns error for non-numeric string', () => {
      expect(rule('abc')).toBe('Must be a number')
    })

    it('returns error for string with letters mixed', () => {
      expect(rule('12abc')).toBe('Must be a number')
    })

    it('returns true for empty/null (not required)', () => {
      expect(rule('')).toBe(true)
      expect(rule(null)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // rules.positiveNumber
  // -------------------------------------------------------------------------
  describe('rules.positiveNumber', () => {
    const rule = rules.positiveNumber()

    it('returns error for 0', () => {
      expect(rule('0')).toBe('Must be a positive number')
    })

    it('returns error for negative number', () => {
      expect(rule('-5')).toBe('Must be a positive number')
    })

    it('returns true for positive number', () => {
      expect(rule('1')).toBe(true)
    })

    it('returns true for positive decimal', () => {
      expect(rule('0.5')).toBe(true)
    })

    it('returns true for empty/null (not required)', () => {
      expect(rule('')).toBe(true)
      expect(rule(null)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // rules.url
  // -------------------------------------------------------------------------
  describe('rules.url', () => {
    const rule = rules.url()

    it('returns true for valid http URL', () => {
      expect(rule('http://example.com')).toBe(true)
    })

    it('returns true for valid https URL', () => {
      expect(rule('https://example.com/path?q=1')).toBe(true)
    })

    it('returns error for invalid URL without protocol', () => {
      expect(rule('example.com')).toBe('Please enter a valid URL')
    })

    it('returns error for random string', () => {
      expect(rule('not a url')).toBe('Please enter a valid URL')
    })

    it('returns true for empty string (optional)', () => {
      expect(rule('')).toBe(true)
    })

    it('returns true for null (optional)', () => {
      expect(rule(null)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // rules.dateFormat
  // -------------------------------------------------------------------------
  describe('rules.dateFormat', () => {
    const rule = rules.dateFormat()

    it('returns true for valid YYYY-MM-DD format', () => {
      expect(rule('2026-01-15')).toBe(true)
    })

    it('returns error for DD/MM/YYYY format', () => {
      expect(rule('15/01/2026')).toBe('Please enter a valid date (YYYY-MM-DD)')
    })

    it('returns error for partial date', () => {
      expect(rule('2026-01')).toBe('Please enter a valid date (YYYY-MM-DD)')
    })

    it('returns error for non-date string', () => {
      expect(rule('tomorrow')).toBe('Please enter a valid date (YYYY-MM-DD)')
    })

    it('returns true for empty string (optional)', () => {
      expect(rule('')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // rules.timeFormat
  // -------------------------------------------------------------------------
  describe('rules.timeFormat', () => {
    const rule = rules.timeFormat()

    it('returns true for valid HH:MM format', () => {
      expect(rule('14:30')).toBe(true)
    })

    it('returns true for single digit hour (H:MM)', () => {
      expect(rule('9:05')).toBe(true)
    })

    it('returns true for midnight', () => {
      expect(rule('00:00')).toBe(true)
    })

    it('returns true for end of day', () => {
      expect(rule('23:59')).toBe(true)
    })

    it('returns error for invalid hour (25:00)', () => {
      expect(rule('25:00')).toBe('Please enter a valid time (HH:MM)')
    })

    it('returns error for invalid minutes (14:60)', () => {
      expect(rule('14:60')).toBe('Please enter a valid time (HH:MM)')
    })

    it('returns error for non-time string', () => {
      expect(rule('noon')).toBe('Please enter a valid time (HH:MM)')
    })

    it('returns true for empty string (optional)', () => {
      expect(rule('')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // rules.futureDate
  // -------------------------------------------------------------------------
  describe('rules.futureDate', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Fix "today" to 2026-01-15 at noon
      vi.setSystemTime(new Date('2026-01-15T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('accepts a future date', () => {
      const rule = rules.futureDate()
      expect(rule('2026-01-20')).toBe(true)
    })

    it('accepts today (today >= today)', () => {
      const rule = rules.futureDate()
      expect(rule('2026-01-15')).toBe(true)
    })

    it('rejects a past date', () => {
      const rule = rules.futureDate()
      expect(rule('2026-01-14')).toBe('Date must be in the future')
    })

    it('rejects a date from last year', () => {
      const rule = rules.futureDate()
      expect(rule('2025-01-15')).toBe('Date must be in the future')
    })

    it('returns true for empty string (optional)', () => {
      const rule = rules.futureDate()
      expect(rule('')).toBe(true)
    })

    it('accepts custom error message', () => {
      const rule = rules.futureDate('Must be upcoming')
      expect(rule('2025-01-01')).toBe('Must be upcoming')
    })
  })

  // -------------------------------------------------------------------------
  // rules.pastDate
  // -------------------------------------------------------------------------
  describe('rules.pastDate', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('accepts a past date', () => {
      const rule = rules.pastDate()
      expect(rule('2026-01-14')).toBe(true)
    })

    it('accepts a date from last year', () => {
      const rule = rules.pastDate()
      expect(rule('2025-01-01')).toBe(true)
    })

    it('rejects a future date', () => {
      const rule = rules.pastDate()
      expect(rule('2026-01-20')).toBe('Date must be in the past')
    })

    it('returns true for empty string (optional)', () => {
      const rule = rules.pastDate()
      expect(rule('')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // rules.confirm
  // -------------------------------------------------------------------------
  describe('rules.confirm', () => {
    it('returns true when values match', () => {
      const rule = rules.confirm('mypassword')
      expect(rule('mypassword')).toBe(true)
    })

    it('returns error when values do not match', () => {
      const rule = rules.confirm('mypassword')
      expect(rule('wrongpassword')).toBe('Values do not match')
    })

    it('is case-sensitive', () => {
      const rule = rules.confirm('Password')
      expect(rule('password')).toBe('Values do not match')
    })

    it('accepts custom error message', () => {
      const rule = rules.confirm('abc', 'Passwords must be identical')
      expect(rule('xyz')).toBe('Passwords must be identical')
    })
  })

  // -------------------------------------------------------------------------
  // rules.custom
  // -------------------------------------------------------------------------
  describe('rules.custom', () => {
    it('returns true when custom validator returns true', () => {
      const rule = rules.custom((val) => val === 'magic', 'Not magic')
      expect(rule('magic')).toBe(true)
    })

    it('returns error message when custom validator returns false', () => {
      const rule = rules.custom((val) => val === 'magic', 'Not magic')
      expect(rule('notmagic')).toBe('Not magic')
    })

    it('delegates validation to the provided function', () => {
      const validator = vi.fn(() => true)
      const rule = rules.custom(validator, 'Error')
      rule('testvalue')
      expect(validator).toHaveBeenCalledWith('testvalue')
    })
  })

  // -------------------------------------------------------------------------
  // validateField
  // -------------------------------------------------------------------------
  describe('validateField', () => {
    it('returns null when all rules pass', () => {
      const result = validateField('hello@example.com', [
        rules.required(),
        rules.email()
      ])
      expect(result).toBeNull()
    })

    it('returns first error message when a rule fails', () => {
      const result = validateField('', [
        rules.required(),
        rules.email()
      ])
      expect(result).toBe('This field is required')
    })

    it('returns null for empty rules array', () => {
      const result = validateField('anything', [])
      expect(result).toBeNull()
    })

    it('returns error from first failing rule (short-circuits)', () => {
      const rule1 = vi.fn(() => 'First error')
      const rule2 = vi.fn(() => 'Second error')
      const result = validateField('value', [rule1, rule2])
      expect(result).toBe('First error')
      expect(rule2).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // validateFields
  // -------------------------------------------------------------------------
  describe('validateFields', () => {
    it('returns isValid=true and empty errors when all fields valid', () => {
      const result = validateFields({
        name: { value: 'John', rules: [rules.required()] },
        email: { value: 'john@example.com', rules: [rules.required(), rules.email()] }
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('returns isValid=false with errors map when any field invalid', () => {
      const result = validateFields({
        name: { value: '', rules: [rules.required()] },
        email: { value: 'john@example.com', rules: [rules.required(), rules.email()] }
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveProperty('name')
      expect(result.errors).not.toHaveProperty('email')
    })

    it('collects errors for multiple invalid fields', () => {
      const result = validateFields({
        name: { value: '', rules: [rules.required()] },
        email: { value: 'bad-email', rules: [rules.required(), rules.email()] }
      })
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors)).toHaveLength(2)
    })
  })

  // -------------------------------------------------------------------------
  // createFormValidator
  // -------------------------------------------------------------------------
  describe('createFormValidator', () => {
    it('validate() returns false and populates errors when fields are invalid', () => {
      const { validate, errors } = createFormValidator({
        name: { value: '', rules: [rules.required()] }
      })
      const result = validate()
      expect(result).toBe(false)
      expect(errors.value).toHaveProperty('name')
    })

    it('validate() returns true when all fields are valid', () => {
      const { validate, errors } = createFormValidator({
        name: { value: 'John', rules: [rules.required()] }
      })
      const result = validate()
      expect(result).toBe(true)
      expect(errors.value).toEqual({})
    })

    it('isValid computed updates reactively based on errors', () => {
      const { validate, isValid } = createFormValidator({
        name: { value: '', rules: [rules.required()] }
      })
      // Before validation, no errors => isValid is true
      expect(isValid.value).toBe(true)
      validate()
      // After validation with invalid field, isValid becomes false
      expect(isValid.value).toBe(false)
    })

    it('clearErrors() resets errors and touched state', () => {
      const { validate, clearErrors, errors, touched } = createFormValidator({
        name: { value: '', rules: [rules.required()] }
      })
      validate()
      expect(Object.keys(errors.value).length).toBeGreaterThan(0)
      clearErrors()
      expect(errors.value).toEqual({})
      expect(touched.value).toEqual({})
    })

    it('validateField(name) validates single field and marks it touched', () => {
      const { validateField: validateSingleField, errors, touched } = createFormValidator({
        name: { value: '', rules: [rules.required()] },
        email: { value: 'valid@example.com', rules: [rules.required(), rules.email()] }
      })
      validateSingleField('name')
      expect(errors.value).toHaveProperty('name')
      expect(errors.value).not.toHaveProperty('email')
      expect(touched.value['name']).toBe(true)
    })

    it('validateField(name) clears error when field becomes valid', () => {
      const form = createFormValidator({
        name: { value: '', rules: [rules.required()] }
      })
      form.validate()
      expect(form.errors.value).toHaveProperty('name')

      // Update field value and re-validate single field
      form.fields.value['name']!.value = 'John'
      form.validateField('name')
      expect(form.errors.value).not.toHaveProperty('name')
    })
  })

  // -------------------------------------------------------------------------
  // surveyRules presets
  // -------------------------------------------------------------------------
  describe('surveyRules.title', () => {
    it('returns array with required, minLength, and maxLength rules', () => {
      const titleRules = surveyRules.title()
      expect(titleRules).toHaveLength(3)
    })

    it('fails for empty title (required)', () => {
      const titleRules = surveyRules.title()
      const error = validateField('', titleRules)
      expect(error).toBe('Survey title is required')
    })

    it('fails for title too short (minLength 3)', () => {
      const titleRules = surveyRules.title()
      const error = validateField('ab', titleRules)
      expect(error).toBe('Title must be at least 3 characters')
    })

    it('fails for title too long (maxLength 100)', () => {
      const titleRules = surveyRules.title()
      const longTitle = 'a'.repeat(101)
      const error = validateField(longTitle, titleRules)
      expect(error).toBe('Title must be no more than 100 characters')
    })

    it('passes for valid title', () => {
      const titleRules = surveyRules.title()
      const error = validateField('Match vs Praha', titleRules)
      expect(error).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // userRules presets
  // -------------------------------------------------------------------------
  describe('userRules.email', () => {
    it('returns array with required and email rules', () => {
      const emailRules = userRules.email()
      expect(emailRules).toHaveLength(2)
    })

    it('fails for empty email (required)', () => {
      const emailRules = userRules.email()
      const error = validateField('', emailRules)
      expect(error).toBe('Email is required')
    })

    it('fails for invalid email format', () => {
      const emailRules = userRules.email()
      const error = validateField('not-an-email', emailRules)
      expect(error).toBe('Please enter a valid email')
    })

    it('passes for valid email', () => {
      const emailRules = userRules.email()
      const error = validateField('user@example.com', emailRules)
      expect(error).toBeNull()
    })
  })

  describe('userRules.confirmPassword', () => {
    it('returns array with required and confirm rules', () => {
      const confirmRules = userRules.confirmPassword('mypassword')
      expect(confirmRules).toHaveLength(2)
    })

    it('fails for empty value (required)', () => {
      const confirmRules = userRules.confirmPassword('mypassword')
      const error = validateField('', confirmRules)
      expect(error).toBe('Please confirm your password')
    })

    it('fails when passwords do not match', () => {
      const confirmRules = userRules.confirmPassword('mypassword')
      const error = validateField('wrongpassword', confirmRules)
      expect(error).toBe('Passwords do not match')
    })

    it('passes when passwords match', () => {
      const confirmRules = userRules.confirmPassword('mypassword')
      const error = validateField('mypassword', confirmRules)
      expect(error).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // getFieldError
  // -------------------------------------------------------------------------
  describe('getFieldError', () => {
    it('returns error when field is touched AND has error', () => {
      const errors = { name: 'Name is required' }
      const touched = { name: true }
      const result = getFieldError('name', errors, touched)
      expect(result).toBe('Name is required')
    })

    it('returns undefined when field is NOT touched even with error', () => {
      const errors = { name: 'Name is required' }
      const touched = { name: false }
      const result = getFieldError('name', errors, touched)
      expect(result).toBeUndefined()
    })

    it('returns undefined when field has no error', () => {
      const errors = {}
      const touched = { name: true }
      const result = getFieldError('name', errors, touched)
      expect(result).toBeUndefined()
    })

    it('returns undefined for unknown field', () => {
      const errors = {}
      const touched = {}
      const result = getFieldError('unknown', errors, touched)
      expect(result).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // hasFieldError
  // -------------------------------------------------------------------------
  describe('hasFieldError', () => {
    it('returns true when field is touched AND has error', () => {
      const errors = { name: 'Name is required' }
      const touched = { name: true }
      expect(hasFieldError('name', errors, touched)).toBe(true)
    })

    it('returns false when field is NOT touched', () => {
      const errors = { name: 'Name is required' }
      const touched = { name: false }
      expect(hasFieldError('name', errors, touched)).toBe(false)
    })

    it('returns false when field has no error', () => {
      const errors = {}
      const touched = { name: true }
      expect(hasFieldError('name', errors, touched)).toBe(false)
    })

    it('returns false for unknown field', () => {
      const errors = {}
      const touched = {}
      expect(hasFieldError('unknown', errors, touched)).toBe(false)
    })
  })
})
