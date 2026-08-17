import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";

type CaseListFiltersProps = {
  statusFilter: string;
  assigneeFilter: string;
  assigneeOptions: string[];
  statusLabelId: string;
  assigneeLabelId: string;
  onStatusChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
};

function CaseListFilters({
  statusFilter,
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
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <FormControl size="small" sx={{ minWidth: 180, flex: "1 1 180px" }}>
        <InputLabel id={statusLabelId}>Status</InputLabel>
        <Select
          labelId={statusLabelId}
          label="Status"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="NEW">New</MenuItem>
          <MenuItem value="VALID">Valid</MenuItem>
          <MenuItem value="ASSIGNED">Assigned</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 220, flex: "1 1 220px" }}>
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
