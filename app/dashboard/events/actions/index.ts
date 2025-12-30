// Re-export all actions from modular files
// Note: Individual files have 'use server' directive

// Event CRUD
export {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from './event-crud'

// Positions
export {
  addEventPosition,
  updateEventPosition,
  removeEventPosition,
  addMultiplePositions,
} from './positions'

// Assignments
export {
  assignVolunteer,
  unassignVolunteer,
  getEligibleVolunteers,
} from './assignments'

// Agenda
export {
  addAgendaItem,
  updateAgendaItem,
  removeAgendaItem,
  reorderAgendaItems,
  updateAgendaItemSongKey,
  updateAgendaItemLeader,
  updateAgendaItemDuration,
  updateAgendaItemDescription,
  getAgendaTemplates,
  createAgendaTemplate,
  addAgendaItemFromTemplate,
  getSongsForAgenda,
  getSongTags,
  addSongToAgenda,
  replaceSongPlaceholder,
  createSongAndAddToAgenda,
} from './agenda'

// Shared Queries
export {
  getChurchMembers,
  getMinistriesWithRoles,
  getMinistryMembersForAgenda,
} from './queries'

// Types
export type { EventInput, PositionInput, AgendaItemInput } from './helpers'
