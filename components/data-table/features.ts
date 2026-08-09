import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * v9 makes features opt-in. Every file that declares a public table type needs
 * this object to infer TFeatures, so it lives in one shared module.
 *
 * Each feature is declared before the row-model slot that depends on it.
 */
export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  // No column declares an explicit sortFn, so every column resolves through
  // getAutoSortFn() against this registry.
  sortFns,
});

export type DataTableFeatures = typeof features;
