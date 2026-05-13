/**
 * Shared application-level types.
 * Lives in lib/ so it can be imported from services, stores, and screens
 * without creating circular deps through a service module.
 */

export interface ApiUser {
  id:          string;
  email:       string;
  displayName: string;
  avatarUrl?:  string;
  createdAt:   string;
}
