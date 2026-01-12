// Re-export all dashboard actions from focused modules
// This maintains backward compatibility for existing imports

export {
  getMyAssignments,
  type DashboardAssignment,
} from './assignments'

export {
  getUpcomingEvents,
  type DashboardEvent,
} from './events'

export {
  getMyTasks,
  type DashboardTask,
} from './tasks'

export {
  getUnavailabilityCount,
} from './availability'

export {
  getCalendarEventsForMember,
  type CalendarEvent,
} from './calendar'

export {
  getUpcomingBirthdays,
  getCalendarBirthdays,
  type Birthday,
  type CalendarBirthday,
} from './birthdays'

export {
  getChurchHolidays,
  type ChurchHoliday,
} from './holidays'
