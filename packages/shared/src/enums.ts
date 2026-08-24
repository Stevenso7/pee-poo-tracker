// Machine-level enums shared between the mobile app and the API.

export type RecordType = 'PEE' | 'POO';
export const RECORD_TYPES: RecordType[] = ['PEE', 'POO'];

export type PeeColor =
  | 'TRANSPARENT'
  | 'PALE_YELLOW'
  | 'YELLOW'
  | 'DARK_YELLOW'
  | 'AMBER'
  | 'BROWN'
  | 'RED_PINK'
  | 'BLUE_GREEN'
  | 'CLOUDY';

export const PEE_COLORS: PeeColor[] = [
  'TRANSPARENT',
  'PALE_YELLOW',
  'YELLOW',
  'DARK_YELLOW',
  'AMBER',
  'BROWN',
  'RED_PINK',
  'BLUE_GREEN',
  'CLOUDY',
];

export type PeeFoam = 'NONE' | 'SLIGHT' | 'MODERATE' | 'HEAVY';
export const PEE_FOAMS: PeeFoam[] = ['NONE', 'SLIGHT', 'MODERATE', 'HEAVY'];

export type PeeVolume = 'SMALL' | 'MEDIUM' | 'LARGE';
export const PEE_VOLUMES: PeeVolume[] = ['SMALL', 'MEDIUM', 'LARGE'];

export type PooColor =
  | 'BROWN'
  | 'DARK_BROWN'
  | 'YELLOW'
  | 'GREEN'
  | 'BLACK'
  | 'RED'
  | 'PALE_CLAY'
  | 'GREY';

export const POO_COLORS: PooColor[] = [
  'BROWN',
  'DARK_BROWN',
  'YELLOW',
  'GREEN',
  'BLACK',
  'RED',
  'PALE_CLAY',
  'GREY',
];

export type AnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type Plan = 'FREE' | 'PREMIUM';
export type Confidence = 'low' | 'medium' | 'high';

// Product constants
export const POO_CONSISTENCY_MIN = 1;
export const POO_CONSISTENCY_MAX = 7;
export const FREE_ANALYSIS_LIMIT = 3;
export const MAX_REMINDER_SLOTS = 3;
export const DEFAULT_PHOTO_RETENTION_DAYS = 14;
export const MAX_PHOTO_RETENTION_DAYS = 90;
export const DEFAULT_LANGUAGE = 'yue';
