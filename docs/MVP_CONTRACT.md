# Luna — MVP Contract

## Objective

Build a responsive lunar calendar that calculates and displays Moon information for a user-selected local calendar date without external APIs, geolocation, or a database.

## Required Features

1. Show today's date.
2. Show the current Moon phase.
3. Show the illumination percentage.
4. Show the approximate Moon age.
5. Show the previous and next major Moon phases.
6. Display a reusable visual Moon component.
7. Display a monthly lunar calendar.
8. Allow switching between months.
9. Allow selecting a calendar date.
10. Update Moon details when a date is selected.
11. Support desktop, tablet, and mobile layouts.
12. Support keyboard navigation and reduced-motion preferences.

## Locked Technical Decisions

- Use the visitor's local calendar date.
- Treat a selected date as a local civil date.
- Perform all astronomy calculations locally.
- Implement astronomy calculations as pure functions.
- Do not use external astronomy APIs.
- Do not request the visitor's location.
- Do not implement moonrise or moonset.
- Do not add a database.
- Do not add authentication.
- Do not add server-side persistence.
- Do not use external moon-data APIs.
- Astronomy Engine is the approved local calculation dependency.
- Do not add other astronomy packages without approval.

## Core User Flow

1. The application opens using today's local date.
2. Today's Moon information is displayed.
3. The current month appears in the lunar calendar.
4. The user switches to another month if desired.
5. The user selects a date.
6. The selected date becomes visually highlighted.
7. The Moon visualization and calculated details update.

## Astronomy Output

For any supported date, the calculation module must return:

- Phase name
- Phase fraction
- Illumination percentage
- Approximate Moon age in days
- Previous major phase
- Next major phase

## Major Phases

The application recognizes:

- New Moon
- First Quarter
- Full Moon
- Last Quarter

Intermediate phase labels:

- Waxing Crescent
- Waxing Gibbous
- Waning Gibbous
- Waning Crescent

## Suggested Calculation Contract

```ts
export type LocalDate = {
  year: number;
  month: number;
  day: number;
};

export type MoonDetails = {
  phaseName: string;
  phaseFraction: number;
  illuminationPercentage: number;
  moonAgeDays: number;
  previousMajorPhase: {
    name: string;
    date: LocalDate;
  };
  nextMajorPhase: {
    name: string;
    date: LocalDate;
  };
};

export function calculateMoonDetails(
  date: LocalDate
): MoonDetails;