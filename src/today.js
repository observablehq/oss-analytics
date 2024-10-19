import {utcDay, utcHour, utcYear} from "d3-time";

export const today = utcDay(utcHour.offset(new Date(), -6)); // give npm time to compute stats
export const lastWeek = utcDay.offset(today, -7);
export const lastYear = utcYear.offset(today, -1);
