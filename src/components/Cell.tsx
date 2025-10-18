"use client";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  ChangeEvent,
  memo,
} from "react";
import type { CellData, CellAddress } from "@/store/types";

export interface CellComponentProps {
  address: CellAddress;
  cell: CellData | undefined;
  isSelected: boolean;
  onSelect: (addr: CellAddress | null) => void;
  onChange: (newContent: string) => void;
}

function CellComponentInner({
  address,
  cell,
  isSelected,
  onSelect,
  onChange,
}: CellComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [isHover, setIsHover] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      if (!cell) {
        setDraft("");
        return;
      }
      if (cell.formula && cell.formula !== "") {
        setDraft(cell.formula);
      } else if (
        cell.displayValue !== null &&
        cell.displayValue !== undefined
      ) {
        setDraft(String(cell.displayValue));
      } else {
        setDraft("");
      }
    }
  }, [cell, isEditing]);

  useEffect(() => {
    if (isEditing) {
      const el = inputRef.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }, [isEditing]);

  const startEdit = useCallback(
    (evt?: React.SyntheticEvent) => {
      evt?.stopPropagation();
      setDraft(
        cell && cell.formula && cell.formula !== ""
          ? cell.formula
          : String(cell?.displayValue ?? "")
      );
      setIsEditing(true);
      onSelect(address);
    },
    [address, cell, onSelect]
  );

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setDraft(
      cell && cell.formula && cell.formula !== ""
        ? cell.formula
        : String(cell?.displayValue ?? "")
    );
  }, [cell]);

  const commitEdit = useCallback(() => {
    const newContent = draft ?? "";
    onChange(newContent);
    setIsEditing(false);
  }, [draft, onChange]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      } else if (e.key === "Tab") {
        commitEdit();
      }
    },
    [commitEdit, cancelEdit]
  );

  const onChangeLocal = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  }, []);

  const onMouseEnter = useCallback(() => setIsHover(true), []);
  const onMouseLeave = useCallback(() => setIsHover(false), []);

  const nonEditDisplay = (() => {
    if (!cell) return "";
    if (cell.isCircular) return cell.displayValue ?? "#CYCLE!";
    if (cell.displayValue !== null && cell.displayValue !== undefined) {
      return String(cell.displayValue);
    }
    return cell.formula ?? "";
  })();

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          startEdit(e);
        } else {
          onSelect(address);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEdit(e);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        [
          "w-full h-full flex items-center whitespace-nowrap overflow-hidden truncate cursor-default",
          "text-[13px]",
          isEditing ? "select-text" : "select-none",
        ].join(" ") +
        (isSelected && !isEditing
          ? " outline outline-[#1890ff] bg-[rgba(24,144,255,0.06)]"
          : isSelected
            ? " bg-[rgba(24,144,255,0.06)]"
            : isHover
              ? " bg-[rgba(0,0,0,0.03)]"
              : "")
      }
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={onChangeLocal}
          onKeyDown={onKeyDown}
          onBlur={commitEdit}
          onClick={(e) => e.stopPropagation()}
          className={
            "w-full h-full border-none outline-none p-[2px_4px] m-0 bg-transparent text-inherit font-inherit box-border"
          }
        />
      ) : (
        <div
          title={cell?.formula || String(cell?.displayValue || "")}
          className={
            "w-full pr-1 box-border " +
            (cell?.isCircular ? "text-[#d9534f]" : "")
          }
        >
          {nonEditDisplay}
        </div>
      )}
    </div>
  );
}

export default memo(CellComponentInner, (prev, next) => {
  if (prev.address !== next.address) return false;
  if (prev.isSelected !== next.isSelected) return false;

  const a = prev.cell;
  const b = next.cell;

  if (!a && !b) return true;
  if (!!a !== !!b) return false;
  if (!a || !b) return false;

  if (a.formula !== b.formula) return false;
  if (String(a.displayValue) !== String(b.displayValue)) return false;
  if (a.isCircular !== b.isCircular) return false;

  return true;
});
