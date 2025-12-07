'use client';

import { getRolesOptions } from '@/clients/api/@tanstack/react-query.gen';
import Alert from '@mui/material/Alert';
import { useQuery } from '@tanstack/react-query';
import Autocomplete from '@mui/material/Autocomplete';
import { RoleDto } from '@/clients/api/types.gen';
import { useMemo } from 'react';
import TextField from '@mui/material/TextField';

export type RoleSelectorProps = {
  value?: string[];
  onChange: (value: string[]) => void;
};

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const { data: roles, error } = useQuery({
    ...getRolesOptions({}),
  });
  const rolesMap = useMemo(() => {
    return roles?.reduce((acc, role) => {
      acc[role.roleId] = role;
      return acc;
    }, {} as Record<string, RoleDto>);
  }, [roles]);

  if (error) {
    return <Alert severity="error">{error.errorMessage}</Alert>;
  }

  return (
    <Autocomplete
      multiple
      options={roles?.map((role) => role.roleId) ?? []}
      getOptionLabel={(option) => rolesMap?.[option]?.name ?? ''}
      value={value ?? []}
      onChange={(_, newValue) => {
        onChange(newValue ?? []);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Roles" placeholder="Select roles" />
      )}
    />
  );
}
