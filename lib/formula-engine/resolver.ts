import { createClient } from '@/lib/supabase/server'
import { evaluateFormula } from './evaluator'
import type { FormulaConfig, FormulaEvaluationContext } from './types'

/**
 * Resolve all formula fields for a record
 * Returns object with computed values keyed by field name
 */
export async function resolveFormulaFields(
  tenantId: string,
  entityType: 'deal' | 'contact',
  record: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const supabase = await createClient()

    // Fetch all formula fields for this entity type
    const { data: formulaFields, error } = await supabase
      .from('custom_fields')
      .select('field_name, options')
      .eq('tenant_id', tenantId)
      .eq('entity_type', entityType)

    if (error || !formulaFields) {
      console.error('[FormulaResolver] Failed to fetch formula fields:', error)
      return {}
    }

    const computedValues: Record<string, any> = {}

    for (const field of formulaFields) {
      const config = field.options as any

      // Check if this is a formula field
      if (config?.kind !== 'formula') {
        continue
      }

      // Validate config
      const formulaConfig = config as FormulaConfig

      // Evaluate formula
      const context: FormulaEvaluationContext = {
        record,
        tenantId,
      }

      const result = evaluateFormula(formulaConfig, context)

      if (result.success) {
        computedValues[field.field_name] = result.value
      } else {
        // Store error state for debugging
        computedValues[field.field_name] = null
        console.error(
          `[FormulaResolver] Failed to evaluate ${field.field_name}:`,
          result.error
        )
      }
    }

    return computedValues
  } catch (error) {
    console.error('[FormulaResolver] Unexpected error:', error)
    return {}
  }
}

/**
 * Check if a field is a formula field
 */
export async function isFormulaField(
  tenantId: string,
  entityType: 'deal' | 'contact',
  fieldName: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('custom_fields')
      .select('options')
      .eq('tenant_id', tenantId)
      .eq('entity_type', entityType)
      .eq('field_name', fieldName)
      .single()

    if (error || !data) {
      return false
    }

    const config = data.options as any
    return config?.kind === 'formula'
  } catch (error) {
    return false
  }
}

/**
 * Get formula field configuration
 */
export async function getFormulaConfig(
  tenantId: string,
  entityType: 'deal' | 'contact',
  fieldName: string
): Promise<FormulaConfig | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('custom_fields')
      .select('options')
      .eq('tenant_id', tenantId)
      .eq('entity_type', entityType)
      .eq('field_name', fieldName)
      .single()

    if (error || !data) {
      return null
    }

    const config = data.options as any

    if (config?.kind !== 'formula') {
      return null
    }

    return config as FormulaConfig
  } catch (error) {
    console.error('[FormulaResolver] Failed to get formula config:', error)
    return null
  }
}
