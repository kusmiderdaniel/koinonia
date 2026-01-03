// Re-export all template actions from the split files
// This file is kept for backwards compatibility

export {
  // Template CRUD
  getEventTemplates,
  getEventTemplate,
  createEventTemplate,
  updateEventTemplate,
  deleteEventTemplate,
  duplicateEventTemplate,
  // Agenda items
  addTemplateAgendaItem,
  updateTemplateAgendaItem,
  removeTemplateAgendaItem,
  reorderTemplateAgendaItems,
  // Positions
  addTemplatePositions,
  updateTemplatePosition,
  removeTemplatePosition,
  // Create event from template
  createEventFromTemplate,
  // Helpers
  getChurchSettings,
  getMinistries,
  getCampuses,
  // Types and schemas
  templateSchema,
  templateAgendaItemSchema,
  type TemplateInput,
  type TemplateAgendaItemInput,
} from './actions/index'
