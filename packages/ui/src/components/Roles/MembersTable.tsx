'use client';

import type { MRT_VisibilityState } from 'material-react-table';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from 'material-react-table';
import { useMemo, useState, useEffect } from 'react';
import { UserEntity, UserRelationDto, UserRoleDto } from '@/clients/api';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { getUsersOptions } from '@/clients/api/@tanstack/react-query.gen';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

export type MembersTableProps = {
  value?: Partial<UserRoleDto>[] | null;
  onAddMember: (member: Partial<UserRoleDto>) => void;
  onRemoveMember: (member: Partial<UserRoleDto>) => void;
};

const validateRequired = (value: string) => !!value.length;

export default function MembersTable({
  value,
  onAddMember,
  onRemoveMember,
}: MembersTableProps) {
  const { data: users } = useQuery({
    ...getUsersOptions({}),
  });

  const availableUsers = useMemo(() => {
    return users?.filter((user) => !value?.some((m) => m.userId === user.id));
  }, [users, value]);

  const usersMap = useMemo(() => {
    return users?.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, UserEntity>);
  }, [users]);

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    {
      'mrt-row-expand': false,
      'mrt-row-select': false,
    }
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const columns = useMemo<MRT_ColumnDef<Partial<UserRoleDto>>[]>(
    () => [
      {
        accessorKey: 'user.name',
        header: 'User Name',
        Cell: ({ row }) => {
          return (
            <Typography variant="inherit">
              {row.original.user?.name} ({row.original.user?.email})
            </Typography>
          );
        },
        Edit({ row: { original: row, index }, column }) {
          return (
            <Autocomplete
              options={availableUsers ?? []}
              fullWidth
              value={row?.user?.id ? usersMap?.[row.user.id] : null}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              onChange={(_, newValue) => {
                const selectedValue = newValue;
                const validationError = !validateRequired(
                  selectedValue?.id ?? ''
                )
                  ? 'User is required'
                  : undefined;
                setValidationErrors({
                  ...validationErrors,
                  [column.id]: validationError,
                });

                row.userId = selectedValue?.id ?? '';
                row.user = selectedValue as UserRelationDto;
                row.assignedAt = new Date().toISOString();
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  margin="none"
                  size="small"
                  slotProps={{
                    input: {
                      ...(params.InputProps ?? {}),
                      disableUnderline: true,
                      autoComplete: 'off',
                      sx: {
                        mb: 0,
                      },
                    },
                    select: {
                      MenuProps: {
                        disableScrollLock: true,
                      },
                    },
                  }}
                  error={!!validationErrors?.[column.id]}
                  helperText={validationErrors?.[column.id]}
                />
              )}
            />
          );
        },
      },
      {
        accessorKey: 'assignedAt',
        header: 'Assigned At',
        enableEditing: false,
        Cell: ({ row }) =>
          row.original.assignedAt && row.original.assignedByUser !== null ? (
            <Typography variant="inherit">
              {new Date(row.original.assignedAt).toLocaleString()}
            </Typography>
          ) : (
            <Typography variant="inherit">Not assigned yet</Typography>
          ),
      },
      {
        accessorKey: 'assignedByUser.name',
        header: 'Assigned By',
        enableEditing: false,
        Cell: ({ row }) =>
          row.original.assignedByUser ? (
            <Typography variant="inherit">
              {row.original.assignedByUser?.name} (
              {row.original.assignedByUser?.email})
            </Typography>
          ) : (
            <Typography variant="inherit">Not assigned yet</Typography>
          ),
      },
    ],
    [availableUsers, usersMap, validationErrors]
  );

  const table = useMaterialReactTable({
    columns,
    data: value || [],
    displayColumnDefOptions: { 'mrt-row-actions': { size: 120 } },
    enableFullScreenToggle: false,
    enableExpandAll: false,
    enableRowActions: true,
    enableEditing: true,
    enablePagination: false,
    muiTablePaperProps: {
      elevation: 0,
    },
    muiTableContainerProps: { sx: { maxHeight: '500px' } },
    createDisplayMode: 'row',
    positionCreatingRow: 'bottom',
    state: {
      columnVisibility,
    },
    localization: {
      noRecordsToDisplay: 'No members found',
    },
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box display="flex" gap="1rem">
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            table.setCreatingRow(true);
          }}
        >
          Add Member
        </Button>
      </Box>
    ),
    onCreatingRowCancel: () => setValidationErrors({}),
    renderRowActions: ({ row: { original: row, index } }) => (
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Tooltip title="Delete">
          <span>
            <IconButton color="error" onClick={() => onRemoveMember(row)}>
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    ),
    onCreatingRowSave: async ({ table, row: { original: row } }) => {
      if (Object.keys(validationErrors).some((key) => validationErrors[key])) {
        return;
      }

      const { 'mrt-row-actions': _, ...rest } = row as UserRoleDto & {
        'mrt-row-actions': unknown;
      };

      setValidationErrors({});
      onAddMember(rest);
      table.setCreatingRow(null);
    },
  });

  return <MaterialReactTable table={table} />;
}
