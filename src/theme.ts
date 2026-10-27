export const colors = {
  navy: '#0B2E5C',      // dark blue
  navyDeep: '#071F40',
  blue: '#1E6FD9',
  sky: '#38A9F0',       // sky blue
  skySoft: '#BFE3FA',   // light blue
  ice: '#EAF5FD',       // page background
  white: '#FFFFFF',
  text: '#0B2E5C',
  muted: '#5F7FA3',
  border: '#D3E6F6',
  present: '#1FA971',
  late: '#F0A020',
  absent: '#E5484D',
  excused: '#7C6CF0',
};

export const statusColor = {
  present: colors.present,
  late: colors.late,
  absent: colors.absent,
  excused: colors.excused,
} as const;

export const radius = { sm: 10, md: 16, lg: 22 };
export const shadow = {
  shadowColor: '#0B2E5C',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
