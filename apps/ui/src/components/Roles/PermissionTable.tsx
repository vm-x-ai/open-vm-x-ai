'use client';

import type { MRT_VisibilityState } from 'material-react-table';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from 'material-react-table';
import { useMemo, useState, useEffect } from 'react';
import { ModulePermissionsDto, PermissionsDto } from '@/clients/api';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

export type PermissionTableProps = {
  permissions: PermissionsDto;
};

export default function PermissionTable({ permissions }: PermissionTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    {
      'mrt-row-expand': false,
      'mrt-row-select': false,
    }
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const columns = useMemo<MRT_ColumnDef<ModulePermissionsDto>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Module Name',
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        filterVariant: 'autocomplete',
        accessorFn: (row) => row.actions.join(', '),
        filterSelectOptions: permissions.modules.flatMap((module) =>
          module.actions.map((action) => ({ label: action, value: action }))
        ),
        filterFn: (row, columnId, filterValue) => {
          return row.original.actions.some((action) =>
            action.toLowerCase().includes(filterValue.toLowerCase())
          );
        },
        Cell: ({ row }) => {
          return (
            <Box
              sx={{
                display: 'flex',
                gap: '.5rem',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {row.original.actions.map((action) => (
                <Chip key={action} label={action} size="small" />
              ))}
            </Box>
          );
        },
      },
      {
        accessorKey: 'baseResource',
        header: 'Base Resource',
        size: 50,
      },
      {
        accessorKey: 'itemResource',
        header: 'Item Resource',
        size: 50,
      },
    ],
    [permissions.modules]
  );

  const table = useMaterialReactTable({
    columns,
    data: permissions.modules || [],
    displayColumnDefOptions: { 'mrt-row-actions': { size: 120 } },
    enableFullScreenToggle: false,
    enableExpandAll: false,
    enableRowActions: false,
    enableEditing: false,
    enableColumnResizing: false,
    enableSorting: false,
    enableColumnActions: false,
    enablePagination: false,
    muiTablePaperProps: {
      elevation: 0,
    },
    enableStickyHeader: true,
    muiTableContainerProps: { sx: { maxHeight: '500px' } },
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  return <MaterialReactTable table={table} />;
}
