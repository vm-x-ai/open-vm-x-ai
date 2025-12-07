'use client';

import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import React from 'react';

export function DefaultLoading() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Skeleton variant="rounded" height="325px" />
      </Grid>
      <Grid size={12}>
        <Skeleton variant="rounded" height="50px" />
      </Grid>
    </Grid>
  );
}
