"use client";
import React, { useCallback, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSheetStore } from "@/store/useSheetStore";
import { coordToAddress } from "@/lib/helpers";
import type { CellAddress } from "@/store/types";
import Cell from "@/components/Cell";
import { COL_WIDTH, headerHeight, ROW_HEIGHT } from "@/store/constants";

export default function DynamicSheetTable() {
  const {
    rows,
    cols,
    grid,
    selectedCell,
    setCellContent,
    setSelectedCell,
    isCalculating,
  } = useSheetStore();

  // container refs
  const parentRef = useRef<HTMLDivElement | null>(null);
  const colParentRef = useRef<HTMLDivElement | null>(null);

  // row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // column virtualizer
  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: cols,
    getScrollElement: () => colParentRef.current,
    estimateSize: () => COL_WIDTH,
    overscan: 4,
  });

  // helpers
  const addressAt = useCallback(
    (colIndex: number, rowIndex: number): CellAddress =>
      coordToAddress(colIndex, rowIndex),
    []
  );

  const handleCellChange = useCallback(
    (address: CellAddress, newContent: string) => {
      if (isCalculating) return;
      setCellContent(address, newContent);
    },
    [setCellContent, isCalculating]
  );

  const handleSelect = useCallback(
    (address: CellAddress | null) => {
      setSelectedCell(address);
    },
    [setSelectedCell]
  );

  // column headers (A, B, C, ...)
  const colHeader = useMemo(() => {
    const headers: string[] = [];
    for (let c = 0; c < cols; c++) {
      // convert 0-based index to spreadsheet column label
      let n = c + 1;
      let label = "";
      while (n > 0) {
        const rem = (n - 1) % 26;
        label = String.fromCharCode(65 + rem) + label;
        n = Math.floor((n - 1) / 26);
      }
      headers.push(label);
    }
    return headers;
  }, [cols]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full overflow-scroll relative"
        style={{ height: "calc(100vh - 190px)", border: "1px solid #ddd" }}
        ref={parentRef}
      >
        {/* Column header scrollbar sync container */}
        <div
          className="sticky top-0 z-10 bg-[#fafafa] flex items-stretch border-b border-[#e6e6e6]"
          style={{ height: headerHeight }}
        >
          <div className="min-w-[40px] w-[40px] flex-none flex items-center justify-center border-r border-[#eee] bg-[#f0f0f0]">
            #
          </div>

          <div ref={colParentRef} className="overflow-visible flex-1">
            <div
              style={{
                width: colVirtualizer.getTotalSize(),
                height: headerHeight,
                position: "relative",
              }}
            >
              {colVirtualizer.getVirtualItems().map((virtualCol) => {
                const c = virtualCol.index;
                const left = virtualCol.start;
                return (
                  <div
                    key={c}
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      width: COL_WIDTH,
                      height: headerHeight,
                    }}
                    className="box-border border-r border-[#eee] flex items-center justify-center font-semibold bg-[#fafafa]"
                  >
                    {colHeader[c]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* rows container */}
        <div style={{ height: "calc(100% - 28px)", position: "relative" }}>
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowIndex = virtualRow.index;
              const top = virtualRow.start;

              return (
                <div
                  key={rowIndex}
                  style={{
                    position: "absolute",
                    left: 0,
                    top,
                    height: ROW_HEIGHT,
                    width: "100%",
                  }}
                  className="flex items-stretch"
                >
                  {/* row index cell */}
                  <div className="min-w-[40px] w-[40px] flex-none box-border border-r border-[#eee] border-b bg-[#fbfbfb] flex items-center justify-center">
                    {rowIndex + 1}
                  </div>

                  {/* horizontally virtualized cells for this row */}
                  <div className="relative w-full overflow-visible">
                    <div
                      style={{
                        height: ROW_HEIGHT,
                        width: colVirtualizer.getTotalSize(),
                        position: "relative",
                      }}
                    >
                      {colVirtualizer.getVirtualItems().map((vCol) => {
                        const colIndex = vCol.index;
                        const left = vCol.start;
                        const addr = addressAt(colIndex, rowIndex);
                        const cell = grid[addr];

                        const isSelected = selectedCell === addr;

                        return (
                          <div
                            key={addr}
                            style={{
                              position: "absolute",
                              left,
                              top: 0,
                              width: COL_WIDTH,
                              height: ROW_HEIGHT,
                            }}
                            className="box-border border-r border-[#eee] border-b  p-[2px_4px] flex items-center"
                            onDoubleClick={() => handleSelect(addr)}
                          >
                            <Cell
                              address={addr}
                              cell={cell}
                              isSelected={isSelected}
                              onSelect={() => handleSelect(addr)}
                              onChange={(newContent: string) =>
                                handleCellChange(addr, newContent)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
