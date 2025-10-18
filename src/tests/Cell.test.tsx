import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Cell from "@/components/Cell";

describe("Cell component", () => {
  test("renders display value and enters edit mode", async () => {
    const mockOnSelect = jest.fn();
    const mockOnChange = jest.fn();

    render(
      <Cell
        address="A1"
        cell={{
          formula: "",
          displayValue: "hello",
          calculatedValue: null,
          precedents: [],
          dependents: [],
          isCircular: false,
        }}
        isSelected={false}
        onSelect={mockOnSelect}
        onChange={mockOnChange}
      />
    );

    // display text should be visible
    expect(screen.getByText("hello")).toBeInTheDocument();

    // double click to edit
    fireEvent.doubleClick(screen.getByText("hello"));

    // input should appear (wait for state updates)
    const input = await screen.findByDisplayValue("hello");
    expect(input).toBeInTheDocument();

    // change value and blur to commit
    fireEvent.change(input, { target: { value: "world" } });
    fireEvent.blur(input);

    expect(mockOnChange).toHaveBeenCalledWith("world");
  });
});
