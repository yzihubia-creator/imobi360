/**
 * Template Registry
 *
 * Central registry for all available templates.
 * Templates are static TypeScript configs with no runtime mutation.
 */

import type { TemplateManifest } from './types'
import { imobi360Template } from './imobi360'
import { blankTemplate } from './blank'

/**
 * Template Registry Map
 * Key: template_id (string)
 * Value: TemplateManifest (immutable config)
 */
const TEMPLATE_REGISTRY: Record<string, TemplateManifest> = {
  imobi360: imobi360Template,
  blank: blankTemplate,
}

/**
 * Get a template by ID
 *
 * @param templateId - Template identifier
 * @returns Template manifest or null if not found
 */
export function getTemplate(templateId: string): TemplateManifest | null {
  return TEMPLATE_REGISTRY[templateId] || null
}

/**
 * List all available templates
 *
 * @returns Array of template manifests
 */
export function listTemplates(): TemplateManifest[] {
  return Object.values(TEMPLATE_REGISTRY)
}

/**
 * Check if a template exists
 *
 * @param templateId - Template identifier
 * @returns True if template exists
 */
export function hasTemplate(templateId: string): boolean {
  return templateId in TEMPLATE_REGISTRY
}

/**
 * Get template metadata only (id, name, description, category)
 *
 * @returns Array of template metadata
 */
export function listTemplateMetadata(): Array<{
  id: string
  name: string
  description: string
  category: string
  version: string
}> {
  return Object.values(TEMPLATE_REGISTRY).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    version: template.version,
  }))
}

// Re-export types for convenience
export type { TemplateManifest, TenantConfig, TenantSettings } from './types'
