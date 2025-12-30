// Re-export all actions from modular files

// Song CRUD
export {
  getArtists,
  getSongs,
  getSong,
  createSong,
  updateSong,
  deleteSong,
} from './song-crud'

// Tags
export {
  getTags,
  createTag,
  deleteTag,
} from './tags'

// Attachments
export {
  getAttachmentUrl,
  uploadAttachment,
  deleteAttachment,
} from './attachments'

// Types
export type { SongInput, TagInput } from './helpers'
