// Map of every domain event (name -> payload). Each feature adds its own
// events here; publishing an event that is not listed is a type error.
export interface DomainEvents {}

export type DomainEventName = Extract<keyof DomainEvents, string>
