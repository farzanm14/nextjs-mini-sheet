import {
  coordToAddress,
  createInitialCell,
  createInitialGrid,
  detectCycle,
  processContent,
  recalculateGrid,
  updateDependencyMap,
} from "@/lib/helpers";
import createSelectors from "@/store/createSelectors";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CellAddress, SheetStore } from "./types";
import { INITIAL_COLS, INITIAL_ROWS } from "@/store/constants";

const baseUseSheetStore = create<SheetStore>()(
  immer((set, get) => ({
    // STATE
    grid: createInitialGrid(INITIAL_ROWS, INITIAL_COLS),
    rows: INITIAL_ROWS,
    cols: INITIAL_COLS,
    selectedCell: null,
    history: [],
    future: [],
    isCalculating: false,

    // ACTIONS
    setSelectedCell: (address) => {
      set({ selectedCell: address });
    },

    setCellContent: (address, content) => {
      const state = get();

      if (state.grid[address]?.formula !== content) {
        set((draft) => {
          draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
          draft.future = [];
          draft.isCalculating = true;
        });

        const parsedPrecedents: CellAddress[] = [];
        const precedentRegex = /([A-Z]+[0-9]+)/g;
        if (content.startsWith("=")) {
          let m: RegExpExecArray | null;
          while ((m = precedentRegex.exec(content)))
            parsedPrecedents.push(m[1]);
        }

        let interimGrid = { ...get().grid };
        interimGrid = {
          ...interimGrid,
          [address]: {
            ...(interimGrid[address] || createInitialCell()),
            formula: content,
          },
        };
        interimGrid = updateDependencyMap(
          interimGrid,
          address,
          parsedPrecedents
        );

        const cycle = detectCycle(interimGrid, address);
        if (cycle) {
          for (const a of cycle) {
            interimGrid[a] = {
              ...(interimGrid[a] || createInitialCell()),
              isCircular: true,
              displayValue: "#CYCLE!",
              calculatedValue: null,
            };
          }
          set((draft) => {
            draft.grid = interimGrid;
            draft.isCalculating = false;
          });
          return;
        }

        const { newGrid, recalculatedAddresses } = processContent(
          address,
          content,
          interimGrid
        );
        const finalDepGrid = updateDependencyMap(
          newGrid,
          address,
          parsedPrecedents
        );
        const finalGrid = recalculateGrid(finalDepGrid, recalculatedAddresses);

        set((draft) => {
          draft.grid = finalGrid;
          draft.isCalculating = false;
        });
      }
    },

    updateDimensions: (newRows, newCols) => {
      set((draft) => {
        draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
        draft.rows = newRows;
        draft.cols = newCols;
        draft.grid = createInitialGrid(newRows, newCols);
        draft.future = [];
      });
    },

    addRow: () => {
      set((draft) => {
        draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
        const r = draft.rows;
        for (let c = 0; c < draft.cols; c++) {
          const addr = coordToAddress(c, r);
          draft.grid[addr] = createInitialCell();
        }
        draft.rows = draft.rows + 1;
        draft.future = [];
      });
    },

    removeRow: () => {
      set((draft) => {
        if (draft.rows <= 1) return;
        draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
        const last = draft.rows - 1;
        for (let c = 0; c < draft.cols; c++) {
          const addr = coordToAddress(c, last);
          delete draft.grid[addr];
        }
        draft.rows = draft.rows - 1;
        draft.future = [];
      });
    },

    addCol: () => {
      set((draft) => {
        draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
        const c = draft.cols;
        for (let r = 0; r < draft.rows; r++) {
          const addr = coordToAddress(c, r);
          draft.grid[addr] = createInitialCell();
        }
        draft.cols = draft.cols + 1;
        draft.future = [];
      });
    },

    removeCol: () => {
      set((draft) => {
        if (draft.cols <= 1) return;
        draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
        const last = draft.cols - 1;
        for (let r = 0; r < draft.rows; r++) {
          const addr = coordToAddress(last, r);
          delete draft.grid[addr];
        }
        draft.cols = draft.cols - 1;
        draft.future = [];
      });
    },

    exportCSV: () => {
      const state = get();
      const rows = state.rows;
      const cols = state.cols;
      let csv = "";
      for (let r = 0; r < rows; r++) {
        const line: string[] = [];
        for (let c = 0; c < cols; c++) {
          const addr = coordToAddress(c, r);
          const cell = state.grid[addr];
          line.push(cell?.formula ?? "");
        }
        csv +=
          line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") +
          "\n";
      }
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sheet.csv";
      a.click();
      URL.revokeObjectURL(url);
    },

    importCSV: (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = text.split(/\r?\n/).filter((l) => l.length > 0);
        const parsed: string[][] = rows.map((r) =>
          r
            .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
            .map((c) => c.replace(/^"|"$/g, ""))
        );
        set((draft) => {
          draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
          const nr = parsed.length;
          const nc = parsed[0]?.length || 0;
          draft.rows = nr;
          draft.cols = nc;
          draft.grid = createInitialGrid(nr, nc);
          for (let r = 0; r < nr; r++) {
            for (let c = 0; c < nc; c++) {
              const addr = coordToAddress(c, r);
              draft.grid[addr] = createInitialCell(parsed[r][c] ?? "");
            }
          }
          draft.future = [];
        });
      };
      reader.readAsText(file);
    },

    toggleDark: () => {
      set((draft) => {
        (draft as any).theme =
          (draft as any).theme === "dark" ? "light" : "dark";
      });
    },

    undo: () => {
      set((draft) => {
        if (draft.history.length > 0) {
          draft.future.push(JSON.parse(JSON.stringify(draft.grid)));
          const previousGrid = draft.history.pop();
          if (previousGrid) {
            draft.grid = previousGrid;
          }
        }
      });
    },

    redo: () => {
      set((draft) => {
        if (draft.future.length > 0) {
          draft.history.push(JSON.parse(JSON.stringify(draft.grid)));
          const nextGrid = draft.future.pop();
          if (nextGrid) {
            draft.grid = nextGrid;
          }
        }
      });
    },
  }))
);

export const useSheetStore = createSelectors(baseUseSheetStore); // Access simplified selectors for use in components
export const sheetSelectors = useSheetStore.use;
