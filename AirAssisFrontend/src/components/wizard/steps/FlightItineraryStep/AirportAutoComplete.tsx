import { useEffect, useState } from "react";
import axios from "axios";
import { Autocomplete, TextField, InputAdornment } from "@mui/material";
import { FlightTakeoff as FlightTakeoffIcon } from "@mui/icons-material";

export interface AirportOption {
  iata: string;
  name: string;
  city: string;
  country: string;
}

interface AutocompleteProps {
  label: string;
  placeholder: string;
  value: AirportOption | null;
  onChange: (option: AirportOption | null) => void;
  error?: string;
}

function AirportAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  error,
}: AutocompleteProps) {
  const [options, setOptions] = useState<AirportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (inputValue.length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await axios.get(`/api/airports/search/?q=${inputValue}`);
      setOptions(res.data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <Autocomplete
      fullWidth
      options={options}
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
                <InputAdornment position="start">
                  <FlightTakeoffIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
export default AirportAutocomplete;
