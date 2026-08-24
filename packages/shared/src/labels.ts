import type { PeeColor, PeeFoam, PeeVolume, PooColor } from './enums';

// Cantonese (Traditional Chinese) display labels. UI is friendly/informal.
export const PEE_COLOR_LABELS: Record<PeeColor, string> = {
  TRANSPARENT: '透明',
  PALE_YELLOW: '淡黃',
  YELLOW: '黃',
  DARK_YELLOW: '深黃',
  AMBER: '琥珀',
  BROWN: '啡色',
  RED_PINK: '紅/粉紅',
  BLUE_GREEN: '藍/綠',
  CLOUDY: '混濁',
};

export const PEE_FOAM_LABELS: Record<PeeFoam, string> = {
  NONE: '無泡',
  SLIGHT: '少少泡',
  MODERATE: '中等',
  HEAVY: '好多泡',
};

export const PEE_VOLUME_LABELS: Record<PeeVolume, string> = {
  SMALL: '少',
  MEDIUM: '中等',
  LARGE: '多',
};

export const POO_COLOR_LABELS: Record<PooColor, string> = {
  BROWN: '啡色',
  DARK_BROWN: '深啡',
  YELLOW: '黃色',
  GREEN: '綠色',
  BLACK: '黑色',
  RED: '紅色',
  PALE_CLAY: '淺色/泥色',
  GREY: '灰色',
};

export const POO_CONSISTENCY_LABELS: Record<number, string> = {
  1: '一粒粒，好硬',
  2: '一條條，表面凹凸',
  3: '一條條，有裂紋',
  4: '一條條，滑捋捋',
  5: '一舊舊，軟熟',
  6: '糊狀',
  7: '水狀',
};

export const RECORD_TYPE_LABELS = {
  PEE: '屙尿',
  POO: '屙屎',
} as const;
