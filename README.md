# Mini SHEET

### A lightweight spreadsheet-like React/Next.js app built as a technical exercise.

This repository implements a client-only spreadsheet with editable cells, formula support, virtualization for performance, undo/redo. It was developed to meet the Mini SHEET evaluation criteria and to demonstrate a clean, performant architecture for spreadsheet behavior in the browser.

# Demo

![Demo](/src/docs/demo.gif)

## Table of contents

- Project goals
- Key features (how requirements are met)
- Architecture and design
- Notable implementation details
- Developer setup
- Scripts
- Testing
- Areas for improvement / next steps

## Project goals

Build a responsive, high-performance spreadsheet-like component with the following principal goals:

- Dynamic table with editable cells.
- Support basic formulas with references and arithmetic operations.
- Auto-update dependent cells when referenced values change.
- Good performance for large grids via virtualization and memoization.
- Undo/Redo support for edits.
- Tests to ensure core behavior.

## Key features — how the app meets the requirements

Below is a mapping between the task requirements and the repository implementation.

- Dynamic Table
  - Add/remove rows and columns: The store exposes row/column counts and CRUD functions to adjust size. The virtualized layout renders only visible cells so dynamic resizing is efficient.
  - Editable cells (inline editing): Cells are editable inline. Double-click or single-click (configurable) opens an input. Editing commits on Enter/blur.

- Formula Support
  - Cells accept formulas starting with `=` (e.g. `=A1+B2*3`).
  - Parser supports referencing other cells and the operators +, -, \*, / with basic operator precedence.
  - The calculation engine tracks dependencies so that when a cell changes, dependent cells are invalidated and recalculated.

- Performance
  - Virtualization using `@tanstack/react-virtual` keeps rendering fast even with large grids. The UI only renders visible rows/columns.
  - Cells are memoized (`React.memo`) and comparison skips re-rendering when a cell's value/formula didn't actually change.

- Undo/Redo
  - The state store (Zustand) includes undo/redo history and supports keyboard shortcuts (Ctrl+Z / Ctrl+Y) to navigate edits. Individual cell edits are recorded as actions in the history stack.

- Extras / Validation
  - Circular references are detected and flagged; cells involved in cycles show an error value (e.g. `#CYCLE!`).
  - CSV import/export and dark/light mode are included as bonus features (see `Toolbar` and `utils`), or planned as next-step improvements depending on the branch.

## Architecture and design

High-level structure (src/)

- `app/` — Next.js App Router entry (`layout.tsx`, `page.tsx`). The UI is client-only for the sheet.
- `src/components/` — UI components (Table, Cell, Toolbar, Headers, Footer, UI primitives). Components are kept small and focused.
- `src/store/` — Zustand store that manages the sheet state (grid data, selection, undo/redo, calculation triggers).
- `src/lib/` — helper utilities (parsing formulas, converting coordinates, CSV helpers, etc.).

Design choices

- State management: Zustand was chosen for a compact, fast client-side store that is easy to subscribe to from components and supports middleware for history (undo/redo).
- Virtualization: `@tanstack/react-virtual` reduces DOM nodes and improves performance for large tables.
- Separation of concerns: parsing/evaluation and dependency tracking live in `lib`/store so UI components remain rendering-only and simple.

## Notable implementation details

- Formula parsing and evaluation
  - The parser accepts expressions like `=A1 + B2 * 3`.
  - Cell references are resolved via coordinate helpers and the engine builds a dependency graph so updates propagate to dependents.
  - Circular references are detected during graph evaluation; cells in cycles are marked and display `#CYCLE!`.

- Rendering performance
  - `Cell` is memoized with a custom comparator that only re-renders when the cell's formula, displayValue, or circular flag changes.
  - `Table` uses row and column virtualizer and only applies absolute positioning inline for dynamic coordinates (left/top/width/height). Static visual styles were converted to Tailwind classes.

- Undo/Redo
  - The store tracks actions and snapshots; editing a cell pushes a single action that can be undone/redone.
  - Keyboard shortcuts are implemented at app-level key handlers.

## Developer setup

Prerequisites

- Node.js (recommended 18.x or newer)
- pnpm (preferred) or npm/yarn

Install

```bash
pnpm install
```

Run locally

```bash
pnpm dev
```

Open http://localhost:3000

Notes

- The app is client-only for the sheet; server routes are not required for the core functionality.
- Tailwind utilities are used for component styling. Some dynamic sizes (virtualizer-provided left/top/width/height) are set inline to preserve virtualization performance.

## Scripts

Common scripts (see `package.json`):

- `pnpm dev` — run dev server
- `pnpm build` — production build
- `pnpm start` — start production server
- `pnpm test` — run tests (Jest)
- `pnpm typecheck` — run TypeScript checks (if configured)

## Testing

- Basic unit tests are included using Jest and React Testing Library. The tests cover core store behavior (cell updates, formula evaluation, undo/redo) and basic component rendering for `Cell` and hooks.
- To run tests:

```bash
pnpm test
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
