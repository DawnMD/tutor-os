/** A single spotlight step. */
export interface TourStep {
  /**
   * `data-tour` value of the element to spotlight. Omit for a centered step
   * with no anchor (used for the opening "welcome" step of a tour).
   */
  target?: string;
  title: string;
  description: string;
}

export type TourRole = "owner" | "student";

export interface TourDefinition {
  id: string;
  /**
   * Bump whenever the steps change materially: the seen-state key is versioned,
   * so a bump re-shows the tour to everyone who already saw the old one.
   */
  version: number;
  /** Which role this tour is written for; disambiguates shared routes. */
  role: TourRole;
  /** True when this tour belongs to the given pathname. */
  match: (pathname: string) => boolean;
  steps: TourStep[];
}
