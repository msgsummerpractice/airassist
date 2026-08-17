import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

type CaseDetailsTableProps = {
  rows: Array<[string, ReactNode]>;
};

function CaseDetailsTable({ rows }: CaseDetailsTableProps) {
  return (
    <TableContainer>
      <Table
        size="small"
        sx={{
          "& td:first-of-type": { fontWeight: 400, width: "38%" },
          "& td:last-of-type": { pl: 2 },
        }}
      >
        <TableBody>
          {rows.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell>{label}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CaseDetailsTable;
