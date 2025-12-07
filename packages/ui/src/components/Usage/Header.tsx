'use client';

import { CalendarMonth } from '@mui/icons-material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Checkbox from '@mui/material/Checkbox';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import Grow from '@mui/material/Grow';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { DateRangeEditor } from '@/components/DateRangePicker';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  parseAsString,
  parseAsIsoDateTime,
  useQueryState,
  parseAsInteger,
  parseAsJson,
} from 'nuqs';
import React, { useEffect, useRef, useState } from 'react';
import type {
  DateRangePickerValue,
  RelativeValueUnit,
} from '../DateRangePicker/types';
import { ApiResponse } from '@/clients/types';
import { ApiKeyEntity } from '@/clients/api';

type RefreshOption = {
  label: string;
  value: number;
};

const refreshOptions: RefreshOption[] = [
  {
    label: 'Refresh',
    value: -1,
  },
  {
    label: 'Auto Refresh (5s)',
    value: 5000,
  },
  {
    label: 'Auto Refresh (10s)',
    value: 10000,
  },
];

export type UsageHeaderProps = {
  apiKeys: ApiResponse<ApiKeyEntity[]>;
};

export default function UsageHeader({ apiKeys }: UsageHeaderProps) {
  const router = useRouter();
  const [openRefreshButton, setOpenRefreshButton] = useState(false);
  const refreshButtonAnchorRef = useRef<HTMLDivElement>(null);
  const [autoRefresh, setAutoRefresh] = useQueryState(
    'autoRefresh',
    parseAsInteger.withDefault(-1).withOptions({
      history: 'push',
      shallow: false,
    })
  );

  const handleRefreshClick = () => {
    router.refresh();
  };

  const handleRefreshMenuItemClick = (
    _: React.MouseEvent<HTMLLIElement, MouseEvent>,
    option: RefreshOption
  ) => {
    setAutoRefresh(option.value);
    setOpenRefreshButton(false);
  };

  const [granularity, setGranularity] = useQueryState(
    'granularity',
    parseAsString.withDefault('minute').withOptions({
      history: 'push',
      shallow: false,
    })
  );

  const [dateType, setDateType] = useQueryState(
    'dateType',
    parseAsString.withDefault('relative').withOptions({
      history: 'push',
      shallow: false,
    })
  );

  const [relativeValue, setRelativeValue] = useQueryState(
    'relativeValue',
    parseAsInteger.withDefault(30).withOptions({
      history: 'push',
      shallow: false,
    })
  );

  const [relativeUnit, setRelativeUnit] = useQueryState(
    'relativeUnit',
    parseAsString.withDefault('minute').withOptions({
      history: 'push',
      shallow: false,
    })
  );

  const [startDate, setStartDate] = useQueryState(
    'start',
    parseAsIsoDateTime.withDefault(startOfMonth(new Date())).withOptions({
      history: 'push',
      shallow: false,
    })
  );
  const [endDate, setEndDate] = useQueryState(
    'end',
    parseAsIsoDateTime.withDefault(endOfMonth(new Date())).withOptions({
      history: 'push',
      shallow: false,
    })
  );

  const [datePickerValue, setDatePickerValue] = useState<DateRangePickerValue>({
    type: dateType as 'relative' | 'absolute',
    relative: {
      unit: relativeUnit as RelativeValueUnit,
      value: relativeValue,
    },
    absolute: {
      endDate,
      startDate,
    },
  });

  const [filters, setFilters] = useQueryState(
    'filters',
    parseAsJson<Record<string, string[]>>((value) => {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    })
      .withDefault({})
      .withOptions({
        history: 'push',
        shallow: false,
      })
  );

  useEffect(() => {
    if (
      datePickerValue.absolute &&
      datePickerValue.absolute.startDate &&
      datePickerValue.absolute.endDate
    ) {
      setStartDate(datePickerValue.absolute.startDate);
      setEndDate(datePickerValue.absolute.endDate);
    }
    if (datePickerValue.relative) {
      setRelativeUnit(datePickerValue.relative.unit);
      setRelativeValue(datePickerValue.relative.value);
    }
    setDateType(datePickerValue.type);
  }, [
    datePickerValue,
    setEndDate,
    setStartDate,
    setDateType,
    setRelativeUnit,
    setRelativeValue,
  ]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          gap: '1rem',
        }}
      >
        <DateRangeEditor
          value={datePickerValue}
          onChange={(newValue) => {
            setDatePickerValue(newValue);
          }}
          renderRelativeInput={(inputProps) => (
            <Grid size={12}>
              <TextField
                {...inputProps}
                label="Date Range"
                sx={{ width: '23rem' }}
              />
            </Grid>
          )}
          renderAbsoluteInput={(startProps, endProps) => (
            <React.Fragment>
              <Grid size={12}>
                <TextField
                  value={`${startProps.value} - ${endProps.value}`}
                  onClick={startProps.onClick}
                  label="Date Range"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="calendar"
                            onClick={() => {
                              startProps.onClick &&
                                startProps.onClick(null as never);
                            }}
                            edge="end"
                          >
                            <CalendarMonth />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: '30rem' }}
                />
              </Grid>
            </React.Fragment>
          )}
          cloneOnSelection={false}
        />
        <ToggleButtonGroup
          value={granularity}
          onChange={(_, value) => setGranularity(value)}
          color="primary"
          exclusive
          aria-label="Granularity"
        >
          <ToggleButton value="second">second</ToggleButton>
          <ToggleButton value="second_5">second (5s)</ToggleButton>
          <ToggleButton value="second_10">second (10s)</ToggleButton>
          <ToggleButton value="second_15">second (15s)</ToggleButton>
          <ToggleButton value="second_30">second (30s)</ToggleButton>
          <ToggleButton value="minute">minute</ToggleButton>
          <ToggleButton value="hour">hour</ToggleButton>
          <ToggleButton value="day">day</ToggleButton>
          <ToggleButton value="week">week</ToggleButton>
          <ToggleButton value="month">month</ToggleButton>
          <ToggleButton value="year">year</ToggleButton>
        </ToggleButtonGroup>
        <ButtonGroup variant="outlined" ref={refreshButtonAnchorRef}>
          <Button onClick={handleRefreshClick}>
            {
              refreshOptions.find((option) => option.value === autoRefresh)
                ?.label
            }
          </Button>
          <Button
            size="small"
            aria-controls={openRefreshButton ? 'split-button-menu' : undefined}
            aria-expanded={openRefreshButton ? 'true' : undefined}
            aria-haspopup="menu"
            variant="outlined"
            onClick={() => {
              setOpenRefreshButton(!openRefreshButton);
            }}
          >
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
        <Popper
          sx={{
            zIndex: 1,
          }}
          open={openRefreshButton}
          anchorEl={refreshButtonAnchorRef.current}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom' ? 'center top' : 'center bottom',
              }}
            >
              <Paper>
                <ClickAwayListener
                  onClickAway={(event) => {
                    if (
                      refreshButtonAnchorRef.current &&
                      refreshButtonAnchorRef.current.contains(
                        event.target as HTMLElement
                      )
                    ) {
                      return;
                    }

                    setOpenRefreshButton(false);
                  }}
                >
                  <MenuList id="split-button-menu" autoFocusItem>
                    {refreshOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        selected={option.value === autoRefresh}
                        onClick={(event) =>
                          handleRefreshMenuItemClick(event, option)
                        }
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          gap: '1rem',
        }}
      >
        {apiKeys.data && (
          <>
            <Autocomplete
              multiple
              disablePortal
              sx={{ width: '23rem' }}
              options={apiKeys.data}
              value={filters?.apiKeyId
                ?.map((id: string) =>
                  apiKeys.data.find((v) => v.apiKeyId === id)
                )
                .filter(
                  (v: ApiKeyEntity | undefined): v is ApiKeyEntity => !!v
                )}
              onChange={(_, newValue) => {
                setFilters({
                  ...(filters ?? {}),
                  apiKeyId: newValue?.map((v) => v.apiKeyId),
                });
              }}
              disableCloseOnSelect
              isOptionEqualToValue={(option, value) =>
                option.apiKeyId === value.apiKeyId
              }
              getOptionLabel={(option) =>
                `${option.name} - ${option.maskedKey}`
              }
              renderOption={(props, option, { selected }) => {
                return (
                  <li {...props}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.name} - {option.maskedKey}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Filter By Role" />
              )}
            />
            <Autocomplete
              multiple
              disablePortal
              sx={{ width: '23rem' }}
              options={[
                ...new Set(apiKeys.data.flatMap((v) => v.labels ?? [])),
              ]}
              value={filters?.apiKeyLabels}
              onChange={(_, newValue) => {
                setFilters({
                  ...(filters ?? {}),
                  apiKeyLabels: newValue,
                });
              }}
              disableCloseOnSelect
              isOptionEqualToValue={(option, value) => option === value}
              getOptionLabel={(option) => option}
              renderOption={(props, option, { selected }) => {
                return (
                  <li {...props}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Filter By Role Groups" />
              )}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
