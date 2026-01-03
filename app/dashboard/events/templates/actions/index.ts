// Re-export all template actions
export {
  getEventTemplates,
  getEventTemplate,
  createEventTemplate,
  updateEventTemplate,
  deleteEventTemplate,
  duplicateEventTemplate,
} from './template-crud'

export {
  addTemplateAgendaItem,
  updateTemplateAgendaItem,
  removeTemplateAgendaItem,
  reorderTemplateAgendaItems,
} from './agenda-items'

export {
  addTemplatePositions,
  updateTemplatePosition,
  removeTemplatePosition,
} from './positions'

export { createEventFromTemplate } from './create-event'

export {
  getChurchSettings,
  getMinistries,
  getCampuses,
} from './helpers'

// Re-export types and schemas
export {
  templateSchema,
  templateAgendaItemSchema,
  type TemplateInput,
  type TemplateAgendaItemInput,
} from './schemas'
