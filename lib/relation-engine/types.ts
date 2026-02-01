export interface RelationConfig {
  /**
   * Kind identifier for relation fields
   */
  kind: 'relation'

  /**
   * Target entity for the relation
   * Examples: 'deals', 'contacts', 'activities'
   */
  target_entity: string

  /**
   * Type of relation
   * - one_to_many: Current record has many related records
   * - many_to_one: Current record belongs to one related record
   */
  relation_type: 'one_to_many' | 'many_to_one'

  /**
   * Foreign key field in the current or target entity
   * For many_to_one: field in current record (e.g., 'contact_id')
   * For one_to_many: field in target records (e.g., 'contact_id')
   */
  foreign_key: string

  /**
   * Lookup configuration - fetches value from related record
   * Only used with many_to_one relations
   */
  lookup_field?: string

  /**
   * Rollup configuration - aggregates values from multiple related records
   * Only used with one_to_many relations
   */
  rollup?: {
    /**
     * Aggregation operation
     */
    operation: 'sum' | 'count' | 'avg' | 'min' | 'max'

    /**
     * Source field to aggregate (required for sum, avg, min, max)
     */
    source_field?: string
  }
}

export interface RelationResolutionContext {
  /**
   * Current record data
   */
  record: Record<string, any>

  /**
   * Tenant ID for isolation
   */
  tenantId: string

  /**
   * Entity type of current record
   */
  entityType: 'deal' | 'contact'
}

export interface RelationResolutionResult {
  success: boolean
  value?: any
  error?: string
}

/**
 * Supported rollup operations
 */
export type RollupOperation = 'sum' | 'count' | 'avg' | 'min' | 'max'
