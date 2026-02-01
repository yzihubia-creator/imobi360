import { createClient } from '@/lib/supabase/server'
import type {
  RelationConfig,
  RelationResolutionContext,
  RelationResolutionResult,
} from './types'

/**
 * Resolve a single relation field
 */
export async function resolveRelation(
  config: RelationConfig,
  context: RelationResolutionContext
): Promise<RelationResolutionResult> {
  try {
    const { record, tenantId } = context

    // Validate config
    const validation = validateRelationConfig(config)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
      }
    }

    // Resolve based on relation type
    if (config.relation_type === 'many_to_one') {
      return await resolveManyToOneRelation(config, record, tenantId)
    } else if (config.relation_type === 'one_to_many') {
      return await resolveOneToManyRelation(config, record, tenantId)
    }

    return {
      success: false,
      error: 'Unknown relation type',
    }
  } catch (error) {
    console.error('[RelationEngine] Resolution error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Resolve many-to-one relation (lookup)
 * Example: Deal -> Contact (via contact_id)
 */
async function resolveManyToOneRelation(
  config: RelationConfig,
  record: Record<string, any>,
  tenantId: string
): Promise<RelationResolutionResult> {
  const supabase = await createClient()

  // Get foreign key value from current record
  const foreignKeyValue = record[config.foreign_key]

  if (!foreignKeyValue) {
    return { success: true, value: null }
  }

  // Fetch related record
  const tableName = getTableName(config.target_entity)
  const { data: relatedRecord, error } = await supabase
    .from(tableName as any)
    .select('*')
    .eq('id', foreignKeyValue)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !relatedRecord) {
    return {
      success: false,
      error: error?.message || 'Related record not found',
    }
  }

  // Return lookup value if specified
  if (config.lookup_field) {
    const lookupValue = getNestedValue(relatedRecord, config.lookup_field)
    return { success: true, value: lookupValue }
  }

  // Return full related record
  return { success: true, value: relatedRecord }
}

/**
 * Resolve one-to-many relation (rollup)
 * Example: Contact -> Deals (sum of values)
 */
async function resolveOneToManyRelation(
  config: RelationConfig,
  record: Record<string, any>,
  tenantId: string
): Promise<RelationResolutionResult> {
  const supabase = await createClient()

  // Fetch all related records
  const tableName = getTableName(config.target_entity)
  const { data: relatedRecords, error } = await supabase
    .from(tableName as any)
    .select('*')
    .eq(config.foreign_key, record.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  const records = relatedRecords || []

  // If no rollup config, return count
  if (!config.rollup) {
    return { success: true, value: records.length }
  }

  // Perform rollup operation
  const result = performRollup(
    records,
    config.rollup.operation,
    config.rollup.source_field
  )

  return { success: true, value: result }
}

/**
 * Perform rollup aggregation
 */
function performRollup(
  records: any[],
  operation: string,
  sourceField?: string
): number | null {
  if (records.length === 0) {
    return operation === 'count' ? 0 : null
  }

  switch (operation) {
    case 'count':
      return records.length

    case 'sum': {
      if (!sourceField) return null
      return records.reduce((sum, record) => {
        const value = Number(record[sourceField]) || 0
        return sum + value
      }, 0)
    }

    case 'avg': {
      if (!sourceField) return null
      const sum = records.reduce((sum, record) => {
        const value = Number(record[sourceField]) || 0
        return sum + value
      }, 0)
      return sum / records.length
    }

    case 'min': {
      if (!sourceField) return null
      const values = records
        .map((record) => Number(record[sourceField]))
        .filter((v) => !isNaN(v))
      return values.length > 0 ? Math.min(...values) : null
    }

    case 'max': {
      if (!sourceField) return null
      const values = records
        .map((record) => Number(record[sourceField]))
        .filter((v) => !isNaN(v))
      return values.length > 0 ? Math.max(...values) : null
    }

    default:
      return null
  }
}

/**
 * Resolve all relation fields for a record
 */
export async function resolveRelationFields(
  tenantId: string,
  entityType: 'deal' | 'contact',
  record: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const supabase = await createClient()

    // Fetch all relation fields for this entity type
    const { data: relationFields, error } = await supabase
      .from('custom_fields')
      .select('field_name, options')
      .eq('tenant_id', tenantId)
      .eq('entity_type', entityType)

    if (error || !relationFields) {
      console.error('[RelationResolver] Failed to fetch relation fields:', error)
      return {}
    }

    const resolvedValues: Record<string, any> = {}

    // Resolve each relation field
    for (const field of relationFields) {
      const config = field.options as any

      // Check if this is a relation field
      if (config?.kind !== 'relation') {
        continue
      }

      const relationConfig = config as RelationConfig

      // Resolve relation
      const context: RelationResolutionContext = {
        record,
        tenantId,
        entityType,
      }

      const result = await resolveRelation(relationConfig, context)

      if (result.success) {
        resolvedValues[field.field_name] = result.value
      } else {
        resolvedValues[field.field_name] = null
        console.error(
          `[RelationResolver] Failed to resolve ${field.field_name}:`,
          result.error
        )
      }
    }

    return resolvedValues
  } catch (error) {
    console.error('[RelationResolver] Unexpected error:', error)
    return {}
  }
}

/**
 * Check if a field is a relation field
 */
export async function isRelationField(
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
    return config?.kind === 'relation'
  } catch (error) {
    return false
  }
}

/**
 * Validate relation configuration
 */
function validateRelationConfig(
  config: RelationConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.target_entity) {
    errors.push('target_entity is required')
  }

  if (!['one_to_many', 'many_to_one'].includes(config.relation_type)) {
    errors.push('relation_type must be one_to_many or many_to_one')
  }

  if (!config.foreign_key) {
    errors.push('foreign_key is required')
  }

  // Validate lookup (many_to_one only)
  if (config.lookup_field && config.relation_type !== 'many_to_one') {
    errors.push('lookup_field only valid for many_to_one relations')
  }

  // Validate rollup (one_to_many only)
  if (config.rollup) {
    if (config.relation_type !== 'one_to_many') {
      errors.push('rollup only valid for one_to_many relations')
    }

    const validOps = ['sum', 'count', 'avg', 'min', 'max']
    if (!validOps.includes(config.rollup.operation)) {
      errors.push(`rollup.operation must be one of: ${validOps.join(', ')}`)
    }

    if (
      ['sum', 'avg', 'min', 'max'].includes(config.rollup.operation) &&
      !config.rollup.source_field
    ) {
      errors.push(`rollup.source_field required for ${config.rollup.operation}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Map entity name to table name
 */
function getTableName(entityType: string): string {
  const mapping: Record<string, string> = {
    deal: 'deals',
    deals: 'deals',
    contact: 'contacts',
    contacts: 'contacts',
    lead: 'contacts',
    leads: 'contacts',
    activity: 'activities',
    activities: 'activities',
  }

  return mapping[entityType.toLowerCase()] || entityType
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}
