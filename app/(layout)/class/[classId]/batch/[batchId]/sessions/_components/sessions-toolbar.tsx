"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ArrowUpDown, ListFilter, Search } from "lucide-react";
import { SESSION_STATUS_META, SessionStatus } from "./utils";

export type StatusFilter = "all" | SessionStatus;
export type SortOrder = "newest" | "oldest";

export interface SessionFilters {
  search: string;
  status: StatusFilter;
  pendingOnly: boolean;
  sort: SortOrder;
}

interface SessionsToolbarProps {
  filters: SessionFilters;
  onChange: (next: Partial<SessionFilters>) => void;
  activeCount: number;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: SESSION_STATUS_META.completed.label },
  { value: "in_progress", label: SESSION_STATUS_META.in_progress.label },
  { value: "draft", label: SESSION_STATUS_META.draft.label },
];

export function SessionsToolbar({
  filters,
  onChange,
  activeCount,
}: SessionsToolbarProps) {
  const filtersActive =
    filters.status !== "all" || filters.pendingOnly || filters.search !== "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search topic or summary..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </InputGroup>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {activeCount} {activeCount === 1 ? "session" : "sessions"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                <ListFilter className="size-4" />
                Filter
                {filtersActive && (
                  <span className="ml-1 size-1.5 rounded-full bg-primary" />
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={filters.status}
                onValueChange={(v) => onChange({ status: v as StatusFilter })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.pendingOnly}
                onCheckedChange={(checked) =>
                  onChange({ pendingOnly: Boolean(checked) })
                }
              >
                Attendance pending
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                <ArrowUpDown className="size-4" />
                Sort
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={filters.sort}
              onValueChange={(v) => onChange({ sort: v as SortOrder })}
            >
              <DropdownMenuRadioItem value="newest">
                Newest first
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">
                Oldest first
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
