import { ref, computed } from 'vue'

export type ValidationRule = (val: any) => boolean | string
export type ValidationRules = ValidationRule[]

export interface FormField {
  value: any
  rules: ValidationRules
  error?: string
  touched?: boolean
}

export function useFormValidation() {

  /**
   * Common validation rules
   */
  const rules = {
    required: (message = 'This field is required'): ValidationRule =>
      (val: any) => !!val || message,

    requiredSelect: (message = 'Please select an option'): ValidationRule =>
      (val: any) => (val !== null && val !== undefined && val !== '') || message,

    email: (message = 'Please enter a valid email'): ValidationRule =>
      (val: string) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !val || emailPattern.test(val) || message
      },

    minLength: (min: number, message?: string): ValidationRule =>
      (val: string) => {
        const msg = message || `Must be at least ${min} characters`
        return !val || val.length >= min || msg
      },

    maxLength: (max: number, message?: string): ValidationRule =>
      (val: string) => {
        const msg = message || `Must be no more than ${max} characters`
        return !val || val.length <= max || msg
      },

    pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule =>
      (val: string) => !val || regex.test(val) || message,

    numeric: (message = 'Must be a number'): ValidationRule =>
      (val: any) => !val || !isNaN(Number(val)) || message,

    positiveNumber: (message = 'Must be a positive number'): ValidationRule =>
      (val: any) => !val || (Number(val) > 0) || message,

    url: (message = 'Please enter a valid URL'): ValidationRule =>
      (val: string) => {
        if (!val) return true
        try {
          new URL(val)
          return true
        } catch {
          return message
        }
      },

    dateFormat: (message = 'Please enter a valid date (YYYY-MM-DD)'): ValidationRule =>
      (val: string) => {
        if (!val) return true
        const datePattern = /^\d{4}-\d{2}-\d{2}$/
        return datePattern.test(val) || message
      },

    timeFormat: (message = 'Please enter a valid time (HH:MM)'): ValidationRule =>
      (val: string) => {
        if (!val) return true
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        return timePattern.test(val) || message
      },

    futureDate: (message = 'Date must be in the future'): ValidationRule =>
      (val: string) => {
        if (!val) return true
        const selectedDate = new Date(val)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return selectedDate >= today || message
      },

    pastDate: (message = 'Date must be in the past'): ValidationRule =>
      (val: string) => {
        if (!val) return true
        const selectedDate = new Date(val)
        const today = new Date()
        return selectedDate <= today || message
      },

    confirm: (originalValue: any, message = 'Values do not match'): ValidationRule =>
      (val: any) => val === originalValue || message,

    custom: (validator: (val: any) => boolean, message: string): ValidationRule =>
      (val: any) => validator(val) || message
  }

  /**
   * Survey-specific validation rules
   */
  const surveyRules = {
    title: (): ValidationRules => [
      rules.required('Survey title is required'),
      rules.minLength(3, 'Title must be at least 3 characters'),
      rules.maxLength(100, 'Title must be no more than 100 characters')
    ],

    description: (): ValidationRules => [
      rules.maxLength(500, 'Description must be no more than 500 characters')
    ],

    date: (): ValidationRules => [
      rules.required('Date is required'),
      rules.dateFormat()
    ],

    time: (): ValidationRules => [
      rules.required('Time is required'),
      rules.timeFormat()
    ],

    surveyType: (): ValidationRules => [
      rules.requiredSelect('Please select a survey type')
    ]
  }

  /**
   * Team-specific validation rules
   */
  const teamRules = {
    name: (): ValidationRules => [
      rules.required('Team name is required'),
      rules.minLength(2, 'Team name must be at least 2 characters'),
      rules.maxLength(50, 'Team name must be no more than 50 characters')
    ],

    description: (): ValidationRules => [
      rules.maxLength(200, 'Description must be no more than 200 characters')
    ]
  }

  /**
   * User-specific validation rules
   */
  const userRules = {
    email: (): ValidationRules => [
      rules.required('Email is required'),
      rules.email()
    ],

    password: (): ValidationRules => [
      rules.required('Password is required'),
      rules.minLength(6, 'Password must be at least 6 characters')
    ],

    confirmPassword: (password: string): ValidationRules => [
      rules.required('Please confirm your password'),
      rules.confirm(password, 'Passwords do not match')
    ],

    displayName: (): ValidationRules => [
      rules.minLength(2, 'Name must be at least 2 characters'),
      rules.maxLength(50, 'Name must be no more than 50 characters')
    ]
  }

  /**
   * Validate a single field
   */
  const validateField = (value: any, rules: ValidationRules): string | null => {
    for (const rule of rules) {
      const result = rule(value)
      if (result !== true) {
        return typeof result === 'string' ? result : 'Invalid value'
      }
    }
    return null
  }

  /**
   * Validate multiple fields
   */
  const validateFields = (fields: Record<string, { value: any; rules: ValidationRules }>) => {
    const errors: Record<string, string> = {}
    let isValid = true

    for (const [fieldName, field] of Object.entries(fields)) {
      const error = validateField(field.value, field.rules)
      if (error) {
        errors[fieldName] = error
        isValid = false
      }
    }

    return { isValid, errors }
  }

  /**
   * Create a reactive form validator
   */
  const createFormValidator = (initialFields: Record<string, { value: any; rules: ValidationRules }>) => {
    const fields = ref({ ...initialFields })
    const errors = ref<Record<string, string>>({})
    const touched = ref<Record<string, boolean>>({})

    const validate = () => {
      const result = validateFields(fields.value)
      errors.value = result.errors
      return result.isValid
    }

    const validateSingleField = (fieldName: string) => {
      const field = fields.value[fieldName]
      if (field) {
        const error = validateField(field.value, field.rules)
        if (error) {
          errors.value[fieldName] = error
        } else {
          delete errors.value[fieldName]
        }
        touched.value[fieldName] = true
      }
    }

    const clearErrors = () => {
      errors.value = {}
      touched.value = {}
    }

    const reset = () => {
      clearErrors()
      // Reset field values to their initial state if needed
    }

    const isValid = computed(() => Object.keys(errors.value).length === 0)
    const hasErrors = computed(() => Object.keys(errors.value).length > 0)

    return {
      fields,
      errors,
      touched,
      isValid,
      hasErrors,
      validate,
      validateField: validateSingleField,
      clearErrors,
      reset
    }
  }

  /**
   * Get error message for a field (Quasar-compatible)
   */
  const getFieldError = (fieldName: string, errors: Record<string, string>, touched: Record<string, boolean>) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : undefined
  }

  /**
   * Check if field has error (Quasar-compatible)
   */
  const hasFieldError = (fieldName: string, errors: Record<string, string>, touched: Record<string, boolean>) => {
    return !!(touched[fieldName] && errors[fieldName])
  }

  return {
    rules,
    surveyRules,
    teamRules,
    userRules,
    validateField,
    validateFields,
    createFormValidator,
    getFieldError,
    hasFieldError
  }
}
