import type { Theme } from '@mui/material/styles';

export const nivoTheme = (theme: Theme) => ({
  background: theme.palette.background.default,
  text: {
    fontSize: 11,
    fill: theme.palette.text.primary,
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  crosshair: {
    line: {
      stroke: theme.palette.text.primary,
      strokeWidth: 1,
      strokeOpacity: 0.75,
      strokeDasharray: '6 6',
    },
  },
  axis: {
    domain: {
      line: {
        stroke: theme.palette.grey[800],
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontSize: 12,
        fill: theme.palette.text.primary,
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    ticks: {
      line: {
        stroke: theme.palette.grey[800],
        strokeWidth: 1,
      },
      text: {
        fontSize: 11,
        fill: theme.palette.text.primary,
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  grid: {
    line: {
      stroke: theme.palette.grey[300],
      strokeWidth: 1,
    },
  },
  legends: {
    title: {
      text: {
        fontSize: 11,
        fill: theme.palette.text.primary,
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    text: {
      fontSize: 11,
      fill: theme.palette.text.primary,
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    ticks: {
      line: {},
      text: {
        fontSize: 10,
        fill: theme.palette.text.primary,
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  annotations: {
    text: {
      fontSize: 13,
      fill: theme.palette.text.primary,
      outlineWidth: 2,
      outlineColor: theme.palette.grey[50],
      outlineOpacity: 1,
    },
    link: {
      stroke: theme.palette.text.primary,
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: theme.palette.grey[50],
      outlineOpacity: 1,
    },
    outline: {
      stroke: theme.palette.text.primary,
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: theme.palette.grey[50],
      outlineOpacity: 1,
    },
    symbol: {
      fill: theme.palette.text.primary,
      outlineWidth: 2,
      outlineColor: theme.palette.grey[50],
      outlineOpacity: 1,
    },
  },
  tooltip: {
    container: {
      background: theme.palette.grey[50],
      fontSize: 12,
    },
    basic: {},
    chip: {},
    table: {},
    tableCell: {},
    tableCellValue: {},
  },
});
