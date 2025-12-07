'use client';

import { useTheme } from '@mui/material/styles';
import { ThemeProvider } from '@nivo/theming';
import { nivoTheme } from './theme';

export default function ChartContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return <ThemeProvider theme={nivoTheme(theme)}>{children}</ThemeProvider>;
}
