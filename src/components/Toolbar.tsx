"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSheetStore } from "@/store/useSheetStore";
import { useEffect, useState } from "react";

const ToolBar: React.FC = () => {
  const {
    undo,
    redo,
    isCalculating,
    addRow,
    removeRow,
    addCol,
    removeCol,
    history,
    future,
    rows,
    cols,
    exportCSV,
    updateDimensions,
  } = useSheetStore();

  const historyLength: number = history.length;
  const futureLength: number = future.length;

  const [newRows, setNewRows] = useState<number>(rows);
  const [newCols, setNewCols] = useState<number>(cols);

  useEffect(() => {
    setNewRows(rows);
    setNewCols(cols);
  }, [rows, cols]);

  return (
    <div className="p-8 bg-gray-50 font-sans">
      <Card className="shadow-xl">
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={undo}
                disabled={historyLength === 0 || isCalculating}
                variant="outline"
              >
                Undo
              </Button>
              <Button
                onClick={redo}
                disabled={futureLength === 0 || isCalculating}
                variant="outline"
              >
                Redo
              </Button>
              <Button onClick={addRow} variant="outline">
                + Row
              </Button>
              <Button onClick={removeRow} variant="outline">
                - Row
              </Button>
              <Button onClick={addCol} variant="outline">
                + Col
              </Button>
              <Button onClick={removeCol} variant="outline">
                - Col
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {isCalculating ?? "Calculating..."}
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Rows</label>
              <Input
                type="number"
                placeholder="Rows"
                value={newRows}
                onChange={(e) => setNewRows(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Columns</label>
              <Input
                type="number"
                placeholder="Columns"
                value={newCols}
                onChange={(e) => setNewCols(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button
              onClick={() => updateDimensions(newRows, newCols)}
              disabled={newRows < 1 || newCols < 1 || isCalculating}
              className="bg-green-600 hover:bg-green-700 h-10"
            >
              Resize Grid
            </Button>
            <Button onClick={exportCSV} className="h-10">
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolBar;
