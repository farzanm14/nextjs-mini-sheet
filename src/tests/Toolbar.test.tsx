import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the store used by Toolbar
const mockStore: any = {
  undo: jest.fn(),
  redo: jest.fn(),
  isCalculating: false,
  addRow: jest.fn(),
  removeRow: jest.fn(),
  addCol: jest.fn(),
  removeCol: jest.fn(),
  history: [] as any[],
  future: [] as any[],
  rows: 10,
  cols: 5,
  exportCSV: jest.fn(),
  updateDimensions: jest.fn(),
};

jest.mock("@/store/useSheetStore", () => ({
  useSheetStore: () => mockStore,
}));

import Toolbar from "@/components/Toolbar";

describe("Toolbar UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure undo/redo buttons are enabled by providing non-empty history/future
    mockStore.history = [1];
    mockStore.future = [1];
  });

  test("renders and buttons call store functions", () => {
    render(<Toolbar />);

    // Undo and Redo buttons
    const undoBtn = screen.getByText("Undo");
    const redoBtn = screen.getByText("Redo");
    fireEvent.click(undoBtn);
    fireEvent.click(redoBtn);
    expect(mockStore.undo).toHaveBeenCalled();
    expect(mockStore.redo).toHaveBeenCalled();

    // Add/remove row/col
    fireEvent.click(screen.getByText("+ Row"));
    fireEvent.click(screen.getByText("- Row"));
    fireEvent.click(screen.getByText("+ Col"));
    fireEvent.click(screen.getByText("- Col"));
    expect(mockStore.addRow).toHaveBeenCalled();
    expect(mockStore.removeRow).toHaveBeenCalled();
    expect(mockStore.addCol).toHaveBeenCalled();
    expect(mockStore.removeCol).toHaveBeenCalled();

    // Export CSV
    fireEvent.click(screen.getByText("Export CSV"));
    expect(mockStore.exportCSV).toHaveBeenCalled();
  });

  test("resize input updates and calls updateDimensions", () => {
    render(<Toolbar />);

    const rowsInput = screen.getByPlaceholderText("Rows") as HTMLInputElement;
    const colsInput = screen.getByPlaceholderText(
      "Columns"
    ) as HTMLInputElement;
    fireEvent.change(rowsInput, { target: { value: "20" } });
    fireEvent.change(colsInput, { target: { value: "8" } });

    fireEvent.click(screen.getByText("Resize Grid"));
    expect(mockStore.updateDimensions).toHaveBeenCalledWith(20, 8);
  });
});
