import type {
  FormulaConfig,
  FormulaEvaluationContext,
  FormulaEvaluationResult,
} from './types'

/**
 * Safe formula evaluator
 * Does NOT use eval() or Function() - parses and evaluates safely
 */
export function evaluateFormula(
  config: FormulaConfig,
  context: FormulaEvaluationContext
): FormulaEvaluationResult {
  try {
    const { expression, dependencies } = config
    const { record } = context

    // Resolve dependencies
    const variables = resolveDependencies(dependencies, record)

    // Evaluate expression
    const result = evaluateExpression(expression, variables)

    // Type coercion based on return_type
    const typedResult = coerceToType(result, config.return_type)

    return {
      success: true,
      value: typedResult,
    }
  } catch (error) {
    console.error('[FormulaEngine] Evaluation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Resolve field dependencies from record
 */
function resolveDependencies(
  dependencies: string[],
  record: Record<string, any>
): Record<string, any> {
  const variables: Record<string, any> = {}

  for (const dep of dependencies) {
    variables[dep] = getNestedValue(record, dep)
  }

  return variables
}

/**
 * Get nested value from object by path (e.g., "contact.name")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Evaluate expression safely
 * Supports:
 * - Basic math: +, -, *, /
 * - Comparisons: =, !=, <, >, <=, >=
 * - Functions: IF, SUM, CONCAT, etc.
 * - Variables: field names
 */
function evaluateExpression(
  expression: string,
  variables: Record<string, any>
): any {
  // Remove whitespace
  const expr = expression.trim()

  // Check for function calls
  if (expr.includes('(')) {
    return evaluateFunction(expr, variables)
  }

  // Check for operators
  if (expr.includes('+')) {
    return evaluateBinaryOp(expr, '+', variables, (a, b) => a + b)
  }
  if (expr.includes('-')) {
    return evaluateBinaryOp(expr, '-', variables, (a, b) => a - b)
  }
  if (expr.includes('*')) {
    return evaluateBinaryOp(expr, '*', variables, (a, b) => a * b)
  }
  if (expr.includes('/')) {
    return evaluateBinaryOp(expr, '/', variables, (a, b) => a / b)
  }

  // Check for comparisons
  if (expr.includes('>=')) {
    return evaluateBinaryOp(expr, '>=', variables, (a, b) => a >= b)
  }
  if (expr.includes('<=')) {
    return evaluateBinaryOp(expr, '<=', variables, (a, b) => a <= b)
  }
  if (expr.includes('!=')) {
    return evaluateBinaryOp(expr, '!=', variables, (a, b) => a !== b)
  }
  if (expr.includes('=')) {
    return evaluateBinaryOp(expr, '=', variables, (a, b) => a === b)
  }
  if (expr.includes('>')) {
    return evaluateBinaryOp(expr, '>', variables, (a, b) => a > b)
  }
  if (expr.includes('<')) {
    return evaluateBinaryOp(expr, '<', variables, (a, b) => a < b)
  }

  // Literal value or variable
  return evaluateLiteral(expr, variables)
}

/**
 * Evaluate binary operation
 */
function evaluateBinaryOp(
  expr: string,
  op: string,
  variables: Record<string, any>,
  fn: (a: any, b: any) => any
): any {
  const parts = expr.split(op).map((p) => p.trim())
  if (parts.length !== 2) {
    throw new Error(`Invalid binary operation: ${expr}`)
  }

  const left = evaluateExpression(parts[0], variables)
  const right = evaluateExpression(parts[1], variables)

  return fn(left, right)
}

/**
 * Evaluate function call
 * Supports: IF, SUM, CONCAT, UPPER, LOWER, etc.
 */
function evaluateFunction(
  expr: string,
  variables: Record<string, any>
): any {
  const match = expr.match(/^(\w+)\((.*)\)$/)
  if (!match) {
    throw new Error(`Invalid function syntax: ${expr}`)
  }

  const [, funcName, argsStr] = match
  const args = parseArguments(argsStr, variables)

  switch (funcName.toUpperCase()) {
    case 'IF':
      return evalIf(args)
    case 'AND':
      return args.every(Boolean)
    case 'OR':
      return args.some(Boolean)
    case 'NOT':
      return !args[0]
    case 'SUM':
      return args.reduce((sum, val) => sum + Number(val || 0), 0)
    case 'MULTIPLY':
      return args.reduce((product, val) => product * Number(val || 1), 1)
    case 'DIVIDE':
      return args.length === 2 ? Number(args[0]) / Number(args[1]) : null
    case 'CONCAT':
      return args.map(String).join('')
    case 'UPPER':
      return String(args[0] || '').toUpperCase()
    case 'LOWER':
      return String(args[0] || '').toLowerCase()
    case 'TRIM':
      return String(args[0] || '').trim()
    case 'ROUND':
      return Math.round(Number(args[0] || 0))
    case 'CEIL':
      return Math.ceil(Number(args[0] || 0))
    case 'FLOOR':
      return Math.floor(Number(args[0] || 0))
    case 'ABS':
      return Math.abs(Number(args[0] || 0))
    case 'MAX':
      return Math.max(...args.map(Number))
    case 'MIN':
      return Math.min(...args.map(Number))
    default:
      throw new Error(`Unknown function: ${funcName}`)
  }
}

/**
 * Parse function arguments
 */
function parseArguments(
  argsStr: string,
  variables: Record<string, any>
): any[] {
  if (!argsStr.trim()) return []

  // Simple comma split (doesn't handle nested functions yet)
  const args = argsStr.split(',').map((arg) => {
    const trimmed = arg.trim()
    return evaluateExpression(trimmed, variables)
  })

  return args
}

/**
 * Evaluate IF function
 * IF(condition, valueIfTrue, valueIfFalse)
 */
function evalIf(args: any[]): any {
  if (args.length !== 3) {
    throw new Error('IF function requires 3 arguments')
  }
  return args[0] ? args[1] : args[2]
}

/**
 * Evaluate literal value or variable
 */
function evaluateLiteral(
  expr: string,
  variables: Record<string, any>
): any {
  // String literal
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  ) {
    return expr.slice(1, -1)
  }

  // Number literal
  if (/^-?\d+\.?\d*$/.test(expr)) {
    return Number(expr)
  }

  // Boolean literal
  if (expr === 'true') return true
  if (expr === 'false') return false
  if (expr === 'null') return null

  // Variable lookup
  if (expr in variables) {
    return variables[expr]
  }

  // Unknown - return as-is
  return expr
}

/**
 * Coerce result to expected type
 */
function coerceToType(
  value: any,
  type: 'number' | 'string' | 'boolean'
): any {
  if (value === null || value === undefined) {
    return null
  }

  switch (type) {
    case 'number':
      return Number(value)
    case 'string':
      return String(value)
    case 'boolean':
      return Boolean(value)
    default:
      return value
  }
}

/**
 * Validate formula configuration
 */
export function validateFormulaConfig(
  config: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (config.kind !== 'formula') {
    errors.push('Config must have kind = "formula"')
  }

  if (!config.expression || typeof config.expression !== 'string') {
    errors.push('Formula must have a valid expression string')
  }

  if (!Array.isArray(config.dependencies)) {
    errors.push('Formula must have dependencies array')
  }

  if (!['number', 'string', 'boolean'].includes(config.return_type)) {
    errors.push('Invalid return_type. Must be number, string, or boolean')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
