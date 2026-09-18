"use client";

import { useMemo, useSyncExternalStore } from "react";
import { dateToLocalDate } from "@/lib/dates/local-date";
import { TodayMoonContent } from "./TodayMoonContent";
import { createTodayMoonViewModel } from "./today-moon";

// No timer or listener is needed: the feature resolves today's date on load.
const subscribe = () => () => {};
const getServerSnapshot = () => null;
const getLocalDaySnapshot = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export function TodayMoon() {
  // React uses the null server snapshot for both SSR and the hydration render.
  const localDay = useSyncExternalStore(subscribe, getLocalDaySnapshot, getServerSnapshot);
  const model = useMemo(() => localDay === null ? null : createTodayMoonViewModel(dateToLocalDate(new Date(localDay))), [localDay]);
  return <TodayMoonContent model={model} />;
}
