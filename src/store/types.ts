export type CellAddress = string; //a cell's unique address

export interface CellData {
  //core data stored for every single cell
  formula: string;
  displayValue: string | number | boolean | null;
  calculatedValue: number | null;
  precedents: CellAddress[]; // Cells that depend on this cell
  dependents: CellAddress[];
  isCircular: boolean;
}

/**
 * The main data structure for the entire spreadsheet.
 * Uses a map for O(1) access and efficient updates.
 */
export type GridData = Record<CellAddress, CellData | undefined>;

export interface SheetStoreState {
  grid: GridData;
  rows: number;
  cols: number;
  selectedCell: CellAddress | null;
  history: GridData[]; // For Undo: stores past states
  future: GridData[]; // For Redo: stores undone states
  isCalculating: boolean; // State to disable input during a heavy recalculation cycle
}

export interface SheetStoreActions {
  setCellContent: (address: CellAddress, content: string) => void;
  setSelectedCell: (address: CellAddress | null) => void;
  updateDimensions: (newRows: number, newCols: number) => void;
  addRow: () => void;
  removeRow: () => void;
  addCol: () => void;
  removeCol: () => void;
  exportCSV: () => void;
  importCSV: (file: File) => void;
  toggleDark: () => void;
  undo: () => void;
  redo: () => void;
}

export type SheetStore = SheetStoreState & SheetStoreActions;

export type RecalculationResult = {
  newGrid: GridData;
  recalculatedAddresses: CellAddress[];
};
