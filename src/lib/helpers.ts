import { CellAddress, CellData, GridData } from "@/store/types";

/** Converts 0-based coordinates to spreadsheet address (e.g., 0, 0 -> 'A1'). */
export const coordToAddress = (col: number, row: number): CellAddress => {
  let columnName: string = "";
  let tempCol: number = col;
  while (tempCol >= 0) {
    columnName = String.fromCharCode((tempCol % 26) + 65) + columnName;
    tempCol = Math.floor(tempCol / 26) - 1;
  }
  return `${columnName}${row + 1}`;
};

/** Converts spreadsheet address to 0-based coordinates (e.g., 'A1' -> 0, 0). */
export const addressToCoord = (
  address: CellAddress
): { col: number; row: number } | null => {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const colName = match[1];
  const rowNum = parseInt(match[2], 10);

  let col = 0;
  for (let i = 0; i < colName.length; i++) {
    col = col * 26 + (colName.charCodeAt(i) - 64);
  }

  return { col: col - 1, row: rowNum - 1 };
};

export const createInitialCell = (
  formula: string = "",
  displayValue: string | number | null = null,
  calculatedValue: number | null = null
): CellData => ({
  formula,
  displayValue,
  calculatedValue,
  precedents: [],
  dependents: [],
  isCircular: false,
});

export const createInitialGrid = (rows: number, cols: number): GridData => {
  const grid: GridData = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const address = coordToAddress(c, r);
      grid[address] = createInitialCell("", null, null);
    }
  }
  return grid;
};

export const safeCalculateFormula = (
  content: string,
  currentGrid: GridData
): { value: number | string; isError: boolean } => {
  const cellAddressRegex = /([A-Z]+[0-9]+)/g;
  let executableString: string = content.substring(1);

  // Substitute cell addresses with their numeric values
  executableString = executableString.replace(cellAddressRegex, (match) => {
    const cell = currentGrid[match];
    return cell ? (cell.calculatedValue ?? 0).toString() : "0";
  });

  try {
    const result = new Function(`return ${executableString}`)();
    if (typeof result === "number" && !isNaN(result)) {
      return { value: result, isError: false };
    }
    return { value: "#VALUE!", isError: true };
  } catch (e) {
    return { value: "#SYNTAX!", isError: true };
  }
};

export const processContent = (
  address: CellAddress,
  content: string,
  currentGrid: GridData
): { newGrid: GridData; recalculatedAddresses: CellAddress[] } => {
  const cell: CellData = currentGrid[address] || createInitialCell();
  let displayValue: string | number | null = content;
  let calculatedValue: number | null = null;
  let isCircular: boolean = false;
  let newDependents: CellAddress[] = cell.dependents;
  // Parse precedents (addresses referenced by this cell)
  const precedentRegex = /([A-Z]+[0-9]+)/g;
  const newPrecedents: CellAddress[] = [];
  if (content.startsWith("=")) {
    let m: RegExpExecArray | null;
    while ((m = precedentRegex.exec(content))) {
      newPrecedents.push(m[1]);
    }
  }

  if (content.startsWith("=")) {
    const { value, isError } = safeCalculateFormula(content, currentGrid);
    displayValue = isError ? value : value;
    calculatedValue = isError ? null : (value as number);
    isCircular = isError;
    newDependents = cell.dependents;
  } else if (!isNaN(Number(content)) && content !== "") {
    calculatedValue = Number(content);
    displayValue = calculatedValue;
    newDependents = cell.dependents;
  }

  const updatedCell: CellData = {
    ...cell,
    formula: content,
    displayValue,
    calculatedValue,
    isCircular,
    dependents: newDependents,
    precedents: content.startsWith("=") ? newPrecedents : [],
  };

  const cellsToRecalculate: CellAddress[] = [
    address,
    ...updatedCell.dependents,
  ];

  return {
    newGrid: { ...currentGrid, [address]: updatedCell },
    recalculatedAddresses: cellsToRecalculate,
  };
};

export const updateDependencyMap = (
  grid: GridData,
  address: CellAddress,
  newPrecedents: CellAddress[]
): GridData => {
  const finalGrid = { ...grid };
  const oldPrecedents = finalGrid[address]?.precedents || [];

  for (const p of oldPrecedents) {
    const cell = finalGrid[p];
    if (cell) {
      const newDependents = (cell.dependents || []).filter(
        (d) => d !== address
      );
      finalGrid[p] = {
        ...cell,
        dependents: newDependents,
      };
    }
  }

  for (const p of newPrecedents) {
    const cell = finalGrid[p] || createInitialCell();
    let newDependents = cell.dependents || [];
    if (!cell.dependents.includes(address)) {
      newDependents = [...cell.dependents, address];
    }
    finalGrid[p] = { ...cell, dependents: newDependents };
  }

  finalGrid[address] = {
    ...(finalGrid[address] || createInitialCell()),
    precedents: newPrecedents,
  };

  return finalGrid;
};

export const detectCycle = (
  grid: GridData,
  start: CellAddress
): CellAddress[] | null => {
  const visited = new Set<CellAddress>();
  const stack = new Set<CellAddress>();
  const cycleNodes: CellAddress[] = [];

  const dfs = (node: CellAddress): boolean => {
    if (stack.has(node)) {
      cycleNodes.push(node);
      return true;
    }
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    const cell = grid[node];
    const nexts = cell?.precedents || [];
    for (const n of nexts) {
      if (dfs(n)) return true;
    }
    stack.delete(node);
    return false;
  };

  if (dfs(start)) return cycleNodes;
  return null;
};

export const recalculateGrid = (
  grid: GridData,
  addresses: CellAddress[]
): GridData => {
  let finalGrid: GridData = { ...grid };
  const uniqueAddresses: CellAddress[] = [...new Set(addresses)];
  const queue: CellAddress[] = [...uniqueAddresses];
  const seen = new Set<CellAddress>(queue);

  while (queue.length > 0) {
    const a = queue.shift()!;
    const cell = finalGrid[a];
    if (cell && cell.formula.startsWith("=")) {
      const { value, isError } = safeCalculateFormula(cell.formula, finalGrid);
      const calculatedValue = isError ? null : (value as number);
      const displayValue = isError ? value : value;
      const changed =
        cell.calculatedValue !== calculatedValue ||
        cell.displayValue !== displayValue ||
        cell.isCircular !== isError;
      finalGrid[a] = {
        ...cell,
        calculatedValue,
        displayValue,
        isCircular: isError,
      };
      if (changed) {
        for (const dep of finalGrid[a].dependents || []) {
          if (!seen.has(dep)) {
            seen.add(dep);
            queue.push(dep);
          }
        }
      }
    }
  }

  return finalGrid;
};
