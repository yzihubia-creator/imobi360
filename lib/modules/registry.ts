/**
 * Module Registry
 *
 * Central registry mapping module_id to view components.
 * Explicit, type-safe, extensible.
 *
 * To add a new module:
 * 1. Create view component in components/modules/
 * 2. Import and register here
 * 3. No other changes needed
 */

import { DealsView } from '@/components/modules/deals-view'
import { ContactsView } from '@/components/modules/contacts-view'
import { GenericModuleView } from '@/components/modules/generic-module-view'
import type { ModuleRegistryEntry } from './types'

/**
 * Module Registry
 *
 * Maps module_id to view component.
 * Fallback: GenericModuleView for unregistered modules.
 */
const MODULE_REGISTRY: Record<string, ModuleRegistryEntry> = {
  // Sales & CRM Modules
  deals: {
    id: 'deals',
    name: 'Deals',
    component: DealsView,
  },

  contacts: {
    id: 'contacts',
    name: 'Contacts',
    component: ContactsView,
  },

  leads: {
    id: 'leads',
    name: 'Leads',
    component: GenericModuleView, // TODO: Implement LeadsView
  },

  activities: {
    id: 'activities',
    name: 'Activities',
    component: GenericModuleView, // TODO: Implement ActivitiesView
  },

  // Industry-Specific Modules
  properties: {
    id: 'properties',
    name: 'Properties',
    component: GenericModuleView, // TODO: Implement PropertiesView
  },

  // Management Modules
  reports: {
    id: 'reports',
    name: 'Reports',
    component: GenericModuleView, // TODO: Implement ReportsView
    minRole: 'manager',
  },

  settings: {
    id: 'settings',
    name: 'Settings',
    component: GenericModuleView, // TODO: Implement SettingsView
    minRole: 'admin',
  },
}

/**
 * Get module view component
 *
 * @param moduleId - Module identifier
 * @returns Module registry entry or null if not found
 */
export function getModuleView(moduleId: string): ModuleRegistryEntry | null {
  return MODULE_REGISTRY[moduleId] || null
}

/**
 * Get module view component with fallback
 *
 * @param moduleId - Module identifier
 * @returns Module registry entry (uses GenericModuleView as fallback)
 */
export function getModuleViewWithFallback(moduleId: string): ModuleRegistryEntry {
  return MODULE_REGISTRY[moduleId] || {
    id: moduleId,
    name: moduleId,
    component: GenericModuleView,
  }
}

/**
 * Check if module has a registered view
 *
 * @param moduleId - Module identifier
 * @returns True if module has a registered view
 */
export function hasModuleView(moduleId: string): boolean {
  return moduleId in MODULE_REGISTRY
}

/**
 * List all registered module IDs
 *
 * @returns Array of registered module IDs
 */
export function listRegisteredModules(): string[] {
  return Object.keys(MODULE_REGISTRY)
}
