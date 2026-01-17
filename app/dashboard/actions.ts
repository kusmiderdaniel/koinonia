// This file re-exports all dashboard actions for backward compatibility
// The actual implementations are in focused modules under ./actions/
// Note: Individual modules have 'use server' directives

export {
  getMyAssignments,
  type DashboardAssignment,
} from './actions/assignments'

export {
  getUpcomingEvents,
  type DashboardEvent,
} from './actions/events'

export {
  getMyTasks,
  type DashboardTask,
} from './actions/tasks'

export {
  getUnavailabilityCount,
} from './actions/availability'

export {
  getCalendarEventsForMember,
  type CalendarEvent,
} from './actions/calendar'

export {
  getUpcomingBirthdays,
  getCalendarBirthdays,
  type Birthday,
  type CalendarBirthday,
} from './actions/birthdays'

export {
  getChurchHolidays,
  type ChurchHoliday,
} from './actions/holidays'

export {
  getPendingMembers,
  type DashboardPendingMember,
} from './actions/pending-members'
