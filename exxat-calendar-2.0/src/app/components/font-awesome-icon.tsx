import React from 'react';
import { cn } from './ui/utils';

// Font Awesome icon mapping - semantic names to FA classes
const fontAwesomeIcons = {
  // Navigation
  home: "far fa-home",
  menu: "far fa-bars",
  search: "far fa-search",
  magnifyingGlass: "far fa-magnifying-glass",
  
  // User & Profile
  user: "far fa-user",
  users: "far fa-users",
  userCheck: "far fa-user-check",
  userCircle: "far fa-circle-user",
  
  // Actions
  plus: "far fa-plus",
  minus: "far fa-minus",
  edit: "far fa-edit",
  trash: "far fa-trash",
  check: "far fa-check",
  x: "far fa-xmark",
  ellipsisVertical: "far fa-ellipsis-vertical",
  copy: "far fa-copy",
  penToSquare: "far fa-pen-to-square",
  
  // Arrows & Navigation
  chevronLeft: "far fa-chevron-left",
  chevronRight: "far fa-chevron-right",
  chevronDown: "far fa-chevron-down",
  chevronUp: "far fa-chevron-up",
  arrowLeft: "far fa-arrow-left",
  arrowRight: "far fa-arrow-right",
  arrowRotateLeft: "far fa-arrow-rotate-left",
  
  // Buildings & Places
  building: "far fa-building",
  mapPin: "far fa-location-dot",
  location: "far fa-location-dot",
  locationDot: "far fa-location-dot",
  
  // Calendar & Time
  calendar: "far fa-calendar",
  clock: "far fa-clock",
  
  // Tasks & Lists
  clipboardList: "far fa-clipboard-list",
  clipboard: "far fa-clipboard",
  listCheck: "far fa-list-check",
  tableCells: "far fa-table-cells",
  
  // Work & Jobs
  briefcase: "far fa-briefcase",
  briefcaseMedical: "far fa-briefcase-medical",
  
  // Communication
  bell: "far fa-bell",
  envelope: "far fa-envelope",
  comments: "far fa-comments",
  phone: "far fa-phone",
  
  // Charts & Reports
  chartBar: "far fa-chart-bar",
  chartLine: "far fa-chart-line",
  chartPie: "far fa-chart-pie",
  barChart: "far fa-chart-column",
  
  // Settings & System
  settings: "far fa-gear",
  gear: "far fa-gear",
  cog: "far fa-cog",
  
  // Medical & Healthcare (Pro exclusive)
  heart: "far fa-heart",
  stethoscope: "far fa-stethoscope",
  pills: "far fa-pills",
  syringe: "far fa-syringe",
  hospitalUser: "far fa-hospital-user",
  
  // Tech & Integration
  plug: "far fa-plug",
  database: "far fa-database",
  link: "far fa-link",
  paperclip: "far fa-paperclip",
  
  // UI Elements
  eye: "far fa-eye",
  eyeOff: "far fa-eye-slash",
  spinner: "far fa-spinner",
  refresh: "far fa-rotate",
  circleQuestion: "far fa-circle-question",
  circleInfo: "far fa-circle-info",
  circleCheck: "far fa-circle-check",
  headset: "far fa-headset",
  bullhorn: "far fa-bullhorn",
  graduationCap: "far fa-graduation-cap",
  
  // AI System (special)
  starChristmas: "fas fa-star-christmas",
  sparkles: "far fa-sparkles",
  robot: "far fa-robot",
  
  // Misc
  signOut: "far fa-right-from-bracket",
  circle: "far fa-circle",
  filter: "far fa-filter",
  sliders: "far fa-sliders",
  fileLines: "far fa-file-lines",
  download: "far fa-download",
  clipboardCheck: "far fa-clipboard-check",
  fileChartColumn: "far fa-file-chart-column",
  map: "far fa-map",
  arrowUpRightFromSquare: "far fa-arrow-up-right-from-square",
  tag: "far fa-tag",
  arrowUpDown: "far fa-arrow-up-arrow-down",
  sort: "far fa-sort",
  listUl: "far fa-list-ul",
  magnifyingGlassPlus: "far fa-magnifying-glass-plus",
  pen: "far fa-pen",
  tableList: "far fa-table-list",
  gripHorizontal: "far fa-grip-horizontal",
  angleLeft: "far fa-angle-left",
  angleRight: "far fa-angle-right",
  anglesLeft: "far fa-angles-left",
  anglesRight: "far fa-angles-right",
} as const;

export type FontAwesomeIconName = keyof typeof fontAwesomeIcons;

export type FontAwesomeWeight = 'light' | 'regular' | 'solid' | 'duotone' | 'thin';

interface FontAwesomeIconProps {
  name: FontAwesomeIconName;
  className?: string;
  weight?: FontAwesomeWeight;
  spin?: boolean;
  pulse?: boolean;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
  role?: string;
}

const weightPrefixes: Record<FontAwesomeWeight, string> = {
  light: 'fal',
  regular: 'far',
  solid: 'fas',
  duotone: 'fad',
  thin: 'fat',
};

export function FontAwesomeIcon({
  name,
  className,
  weight = 'regular',
  spin = false,
  pulse = false,
  style,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  role,
}: FontAwesomeIconProps) {
  const iconClass = fontAwesomeIcons[name];
  
  // Replace the default weight prefix if a different weight is specified
  let finalIconClass = iconClass;
  if (weight !== 'regular') {
    const parts = iconClass.split(' ');
    parts[0] = weightPrefixes[weight];
    finalIconClass = parts.join(' ');
  }
  
  const animationClass = spin ? 'fa-spin' : pulse ? 'fa-pulse' : '';
  
  return (
    <i
      className={cn(finalIconClass, animationClass, className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style,
      }}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      role={role}
    />
  );
}