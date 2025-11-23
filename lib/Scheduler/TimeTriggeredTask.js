const PeriodicTask = require("./PeriodicTask");
/**
 * Creates a time-triggered task that executes the provided function `fn`
 * when the current time matches the specified `scheduleConfig`.
 *
 * The `scheduleConfig` object defines all time-based conditions that determine
 * when the task is allowed to run. It supports:
 * - One-time execution
 * - Recurring schedules by minute/hour/day/week/month
 * - Time-of-day triggers
 * - Time windows
 * - Day-of-week restrictions
 * - Start/end date bounds
 * - Maximum run count
 * - Monthly patterns like "3rd Monday of the month"
 * - Explicit include/exclude dates
 *
 * scheduleConfig structure:
 *
 * {
 *   Overall schedule type:
 *   "once"      → run a single time
 *   "recurring" → run repeatedly based on rules below
 *   type: "once" | "recurring",
 *
 *   Specific trigger time:
 *   - "HH:MM" → time of day (interpreted in `timezone`)
 *   - Date    → exact timestamp
 *   at: "HH:MM" | Date | null,
 *
 *   Optional daily time window:
 *   Task may only run when current time is between start and end.
 *   window: {
 *     start: "HH:MM" | null,
 *     end: "HH:MM" | null
 *   } | null,
 *
 *   Optional recurrence frequency:
 *   Examples:
 *     { unit: "minute", every: 5 }
 *     { unit: "hour",   every: 1 }
 *     { unit: "day",    every: 1 }
 *     { unit: "week",   every: 1 }
 *     { unit: "month",  every: 1 }
 *   frequency: {
 *     unit: "minute" | "hour" | "day" | "week" | "month" | null,
 *     every: number | null
 *   } | null,
 *
 *   Optional day-of-week restriction:
 *   Example: ["Mon","Tue","Wed","Thu","Fri"] for weekdays only.
 *   daysOfWeek: string[] | null,
 *
 *   Optional date bounds:
 *   No runs before startDate, no runs after endDate.
 *   startDate: Date | null,
 *   endDate: Date | null,
 *
 *   Optional maximum number of allowed executions:
 *   If null, no hard limit; if a number, stop after this many runs.
 *   maxRuns: number | null,
 *
 *   Optional monthly pattern rules:
 *   Supports expressions like "3rd Monday of the month", "last Friday", etc.
 *   Examples:
 *     [{ week: 3,  dayOfWeek: "Mon" }]  → 3rd Monday each month
 *     [{ week: -1, dayOfWeek: "Fri" }]  → last Friday each month
 *   monthlyPattern: Array<{
 *     week: number,        // 1, 2, 3, 4, or -1 for "last"
 *     dayOfWeek: string    // "Mon".."Sun"
 *   }> | null,
 *
 *   Optional explicit date exceptions:
 *   includeDates: dates where the task is allowed to run even if other rules say no.
 *   excludeDates: dates where the task must not run even if other rules say yes.
 *   includeDates: Date[] | null,
 *   excludeDates: Date[] | null,
 *
 *   Timezone for interpreting all time-of-day and calendar rules.
 *   Example: "America/Los_Angeles", "UTC".
 *   timezone: string | null
 * }
 *
 * @param {Object} scheduleConfig - Configuration describing when `fn` is allowed to run.
 * @param {Function} fn - The function to execute when the schedule condition is met.
 * @returns {Function} stop - A function that cancels the scheduled task.
 */

const TimeTriggeredTask = (scheduleConfig, fn) => {
    if (typeof fn !== "function") throw new TypeError("fn must be a function.");
    if (!scheduleConfig || typeof scheduleConfig !== "object") throw new TypeError("scheduleConfig must be an object.");
    const {
        type = "recurring",
        frequency,
        window,
        daysOfWeek,
        startDate = null,
        endDate = null,
        maxRuns = null,
        // monthlyPattern,
        // includeDates,
        // excludeDates,
        // timezone
    } = scheduleConfig;

    if (type === "once") {
        throw new Error('TimeTriggeredTask: type "once" is not implemented yet.');
    }

    if (type !== "recurring") {
        throw new Error(`TimeTriggeredTask: unsupported type "${type}".`);
    }

    // --- frequency → intervalSeconds for PeriodicTask ----------------------

    const computeIntervalSeconds = (freq) => {
        if (!freq || freq.every == null || freq.every <= 0) {
            throw new RangeError("scheduleConfig.frequency.every must be a positive number.");
        }

        const every = freq.every;
        switch (freq.unit) {
            case "second":
                return every;
            case "minute":
                return every * 60;
            case "hour":
                return every * 60 * 60;
            case "day":
                return every * 60 * 60 * 24;
            case "week":
                return every * 60 * 60 * 24 * 7;
            default:
                throw new Error(`TimeTriggeredTask: unsupported frequency.unit "${freq.unit}".`);
        }
    };

    const intervalSeconds = computeIntervalSeconds(frequency);

    // --- helpers: time window & weekday checks -----------------------------

    const parseHhMmToMinutes = (hhmm) => {
        if (!hhmm) return null;
        const [hhStr, mmStr] = hhmm.split(":");
        const hh = Number(hhStr);
        const mm = Number(mmStr);
        if (
            !Number.isInteger(hh) || !Number.isInteger(mm) ||
            hh < 0 || hh > 23 || mm < 0 || mm > 59
        ) {
            throw new Error(`Invalid time string: "${hhmm}" (expected "HH:MM")`);
        }
        return hh * 60 + mm; 
    };

    const windowStartMinutes = window && window.start ? parseHhMmToMinutes(window.start) : null;
    const windowEndMinutes = window && window.end ? parseHhMmToMinutes(window.end) : null;

    const isInWindow = (date) => {
        if (windowStartMinutes == null && windowEndMinutes == null) return true;

        const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();

        if (windowStartMinutes != null && minutesSinceMidnight < windowStartMinutes) {
            return false;
        }
        if (windowEndMinutes != null && minutesSinceMidnight > windowEndMinutes) {
            return false;
        }
        return true;
    };

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isAllowedWeekday = (date) => {
        if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
            return true;
        }
        const todayName = weekdayNames[date.getDay()];
        return daysOfWeek.includes(todayName);
    };

    const isWithinDateBounds = (date) => {
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
    };

    // --- run-count tracking & stopping -------------------------------------

    let runCount = 0;
    let stopPeriodic = null;

    // Wrap fn with schedule checks; this is what PeriodicTask will call
    const wrappedFn = async () => {
        const now = new Date();

        // Date bounds
        if (!isWithinDateBounds(now)) {
            // If we've passed endDate, stop permanently
            if (endDate && now > endDate && typeof stopPeriodic === "function") {
                stopPeriodic();
            }
            return;
        }

        // Max runs
        if (maxRuns != null && runCount >= maxRuns) {
            if (typeof stopPeriodic === "function") {
                stopPeriodic();
            }
            return;
        }

        // Day-of-week restriction
        if (!isAllowedWeekday(now)) {
            return;
        }

        // Time window restriction
        if (!isInWindow(now)) {
            return;
        }

        // All conditions satisfied → run the task
        await fn();
        runCount += 1;

        // Check maxRuns again in case it was reached exactly now
        if (maxRuns != null && runCount >= maxRuns && typeof stopPeriodic === "function") {
            stopPeriodic();
        }
    };

    // Start periodic loop; PeriodicTask handles the sequential timing
    stopPeriodic = PeriodicTask(intervalSeconds, wrappedFn);

    // Expose stop to caller
    return stopPeriodic;
};

module.exports = TimeTriggeredTask;