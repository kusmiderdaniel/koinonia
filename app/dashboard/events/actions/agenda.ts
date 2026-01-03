// Re-export all agenda actions from the split files
// This file is kept for backwards compatibility

export {
  // CRUD operations
  addAgendaItem,
  updateAgendaItem,
  removeAgendaItem,
  reorderAgendaItems,
  updateAgendaItemSongKey,
  updateAgendaItemLeader,
  updateAgendaItemDuration,
  updateAgendaItemDescription,
  // Song operations
  getSongsForAgenda,
  getSongTags,
  addSongToAgenda,
  replaceSongPlaceholder,
  createSongAndAddToAgenda,
  // Template operations
  getAgendaTemplates,
  createAgendaTemplate,
  addAgendaItemFromTemplate,
} from './agenda/index'
