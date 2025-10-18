"use client";
import { coordToAddress } from "@/lib/helpers";

interface HeaderProps {
  index: number;
  style: React.CSSProperties;
}

export const RowHeader: React.FC<HeaderProps> = ({ index, style }) => (
  <div
    style={style}
    className="flex items-center justify-center border-r border-b border-gray-300 bg-gray-100 font-semibold text-xs text-gray-600 select-none"
  >
    {index + 1}
  </div>
);

export const ColHeader: React.FC<HeaderProps> = ({ index, style }) => (
  <div
    style={style}
    className="flex items-center justify-center border-r border-b border-gray-300 bg-gray-100 font-semibold text-xs text-gray-600 select-none"
  >
    {coordToAddress(index, -1).replace(/[0-9]/g, "")}
  </div>
);

export const ColHeaderRenderer = ({
  columnIndex,
  style,
}: {
  columnIndex: number;
  style: React.CSSProperties;
}) => <ColHeader index={columnIndex} style={style} />;

export const RowHeaderRenderer = ({
  rowIndex,
  style,
}: {
  rowIndex: number;
  style: React.CSSProperties;
}) => <RowHeader index={rowIndex} style={style} />;
