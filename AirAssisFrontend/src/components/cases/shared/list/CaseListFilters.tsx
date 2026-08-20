import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";

type CaseListStatusOption = {
  value: string;
  label: string;
};

type CaseListFiltersProps = {
  statusFilter: string;
  statusOptions: CaseListStatusOption[];
  assigneeFilter: string;
  assigneeOptions: string[];
  statusLabelId: string;
  assigneeLabelId: string;
  onStatusChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
};

function CaseListFilters({
  statusFilter,
  statusOptions,
  assigneeFilter,
  assigneeOptions,
  statusLabelId,
  assigneeLabelId,
  onStatusChange,
  onAssigneeChange,
}: CaseListFiltersProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        mb: 3,
        width: "100%",
        justifyContent: "center",
        alignItems: { xs: "stretch", sm: "center" },
        flexWrap: "wrap",
      }}
    >
      <FormControl
        size="small"
        sx={{ width: { xs: "100%", sm: 180 }, flexShrink: 0 }}
      >
        <InputLabel id={statusLabelId}>Status</InputLabel>
        <Select
          labelId={statusLabelId}
          label="Status"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <MenuItem value="ALL">All</MenuItem>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ width: { xs: "100%", sm: 220 }, flexShrink: 0 }}
      >
        <InputLabel id={assigneeLabelId}>Assignee</InputLabel>
        <Select
          labelId={assigneeLabelId}
          label="Assignee"
          value={assigneeFilter}
          onChange={(event) => onAssigneeChange(event.target.value)}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
          {assigneeOptions.map((assigneeName) => (
            <MenuItem key={assigneeName} value={assigneeName}>
              {assigneeName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}

export default CaseListFilters;
