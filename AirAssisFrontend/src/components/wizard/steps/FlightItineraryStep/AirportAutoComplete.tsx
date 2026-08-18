import { useEffect, useState } from "react";
import axios from "axios";
import { Autocomplete, TextField, InputAdornment } from "@mui/material";

export interface AirportOption {
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

interface AutocompleteProps {
  label: string;
  placeholder: string;
  value: AirportOption | null;
  onChange: (option: AirportOption | null) => void;
  error?: string;
  icon?: React.ReactNode;
}

function AirportAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  error,
  icon,
}: AutocompleteProps) {
  const [options, setOptions] = useState<AirportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const visibleOptions = inputValue.length < 2 ? [] : options;

  useEffect(() => {
    if (inputValue.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await axios.get(`/api/airports/search/?q=${inputValue}`);
      setOptions(res.data.filter((airport: AirportOption) => airport.timezone));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <Autocomplete
      fullWidth
      options={visibleOptions}
      getOptionLabel={(opt) => `${opt.iata} – ${opt.name}`}
      filterOptions={(x) => x}
      isOptionEqualToValue={(option, val) => option.iata === val.iata}
      onInputChange={(_, newInputValue, reason) => {
        if (reason !== "reset") setInputValue(newInputValue);
      }}
      onChange={(_, selected) => {
        onChange(selected);
      }}
      loading={loading}
      value={value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error}
          slotProps={{
            ...params.slotProps,
            input: {
              ...(params.slotProps?.input as object),
              startAdornment: (
                <InputAdornment position="start">{icon}</InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
export default AirportAutocomplete;
