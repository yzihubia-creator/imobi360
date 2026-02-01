export interface FormulaConfig {
  /**
   * Kind identifier for formula fields
   */
  kind: 'formula'

  /**
   * Formula expression to evaluate
   * Examples:
   * - "value * 0.1"
   * - "IF(status = 'won', value, 0)"
   * - "CONCAT(title, ' - ', contact.name)"
   */
  expression: string

  /**
   * Array of field keys this formula depends on
   * Used for dependency resolution
   */
  dependencies: string[]

  /**
   * Expected return type
   */
  return_type: 'number' | 'string' | 'boolean'
}

export interface FormulaEvaluationContext {
  /**
   * The current record data
   */
  record: Record<string, any>

  /**
   * Tenant ID for isolation
   */
  tenantId: string
}

export interface FormulaEvaluationResult {
  success: boolean
  value?: any
  error?: string
}

/**
 * Supported formula functions
 */
export type FormulaFunction =
  | 'IF'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'SUM'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'CONCAT'
  | 'UPPER'
  | 'LOWER'
  | 'TRIM'
  | 'ROUND'
  | 'CEIL'
  | 'FLOOR'
  | 'ABS'
  | 'MAX'
  | 'MIN'
