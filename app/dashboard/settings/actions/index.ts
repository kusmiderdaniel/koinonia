// Church settings and ownership
export {
  getChurchSettings,
  updateChurchSettings,
  getChurchMembers,
  transferOwnership,
  regenerateJoinCode,
  uploadChurchLogo,
  removeChurchLogo,
  updateBrandColor,
} from './church'

// Locations CRUD
export {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from './locations'

// Campuses CRUD
export {
  getCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  setDefaultCampus,
} from './campuses'
export type { Campus } from './campuses'

// Church preferences
export { updateChurchPreferences } from './preferences'

// Types
export type { UpdateChurchInput, LocationInput, ChurchPreferencesInput, CampusInput } from './helpers'
