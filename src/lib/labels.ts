import type { DealType, PropertyType } from './types';

export const TYPE_LABELS: Record<PropertyType, { singular: string; plural: string; short: string }> = {
  house: { singular: 'house', plural: 'houses', short: 'Houses' },
  apartment: { singular: 'apartment', plural: 'apartments', short: 'Apartments' },
  commercial: { singular: 'commercial property', plural: 'commercial properties', short: 'Commercial' },
  land: { singular: 'land plot', plural: 'land plots', short: 'Land' },
};

export const DEAL_LABELS: Record<DealType, { badge: string; filter: string; phrase: string }> = {
  sale: { badge: 'For sale', filter: 'Buy', phrase: 'for sale' },
  rent: { badge: 'For rent', filter: 'Rent', phrase: 'for rent' },
};

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
