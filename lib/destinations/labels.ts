// Display labels for destination enums, shared by the home and place pages.

import type { CrowdLevel, PlaceCategory, WorkspaceType } from "./types"

/** How a crowd level reads in a sentence or tag. */
export const CROWD_LABEL: Record<CrowdLevel, string> = {
  secret: "Few people know",
  rising: "Getting noticed",
  popular: "Popular",
  crowded: "Everyone's there",
}

/** Short form for filter chips. */
export const CROWD_CHIP: Record<CrowdLevel, string> = {
  secret: "Secret",
  rising: "Rising",
  popular: "Popular",
  crowded: "Crowded",
}

export const WORKSPACE_LABEL: Record<WorkspaceType, string> = {
  coworking: "Coworking",
  cafe: "Café",
  hotel: "Hotel",
  club: "Club",
  library: "Library",
}

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  eat: "Eat",
  drink: "Drink",
  see: "See",
  swim: "Swim",
  walk: "Walk",
  "day trip": "Day trip",
}
