const PeriodicTask = require("./PeriodicTask");

/**
 * Creates a time-triggered task that executes the provided function `fn`
 * when the current time matches the specified `scheduleConfig`.
 *
 * The `scheduleConfig` object defines all time-based conditions that determine
 * when the task is allowed to run. It supports (conceptually):
 * - One-time execution (type: "once")          [NOT IMPLEMENTED YET]
 * - Recurring schedules by second/minute/hour/day/week
 * - Time-of-day triggers via `at: "HH:MM"`
 * - Time windows via `window.start` / `window.end`
 * - Day-of-week restrictions via `daysOfWeek`
 * - Start/end date bounds
 * - Maximum run count via `maxRuns`
 *
 * See docstring above for the full structure.
 *
 * @param {Object} scheduleConfig - Configuration describing when `fn` is allowed to run.
 * @param {Function} fn - The function to execute when the schedule condition is met.
 * @returns {Function} stop - A function that cancels the scheduled task.
 */
const TimeTriggeredTask = (scheduleConfig, fn) => {
    if (typeof fn !== "function") throw new TypeError("fn must be a function.");
    if (!scheduleConfig || typeof scheduleConfig !== "object") {
        throw new TypeError("scheduleConfig must be an object.");
    }

    const {
        type = "recurring",
        at,
        frequency,
        window,
        daysOfWeek,
        startDate = null,
        endDate = null,
        maxRuns = null,
        // monthlyPattern,
        // includeDates,
        // excludeDates,
        // timezone, // NOTE: currently using local system timezone
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

    // If we have an "at: HH:MM" daily-style schedule, we want a short tick
    // so we can reliably catch that minute and still only run once per day.
    let intervalSeconds;
    const hasAtString = typeof at === "string";

    if (hasAtString && frequency && frequency.unit === "day") {
        // Check every 30 seconds; enough to catch the 18:00 minute
        intervalSeconds = 30;
    } else {
        intervalSeconds = computeIntervalSeconds(frequency);
    }

    // --- helpers: time-of-day, window & weekday checks ---------------------

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
        return hh * 60 + mm; // minutes since midnight
    };

    const atMinutes =
        hasAtString ? parseHhMmToMinutes(at) : null;

    const windowStartMinutes =
        window && window.start ? parseHhMmToMinutes(window.start) : null;

    const windowEndMinutes =
        window && window.end ? parseHhMmToMinutes(window.end) : null;

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

    // If `at` is specified as "HH:MM", require that the current minute matches.
    const isAtTimeOfDay = (date) => {
        if (atMinutes == null) return true; // no specific time constraint
        const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
        return minutesSinceMidnight === atMinutes;
    };

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const isAllowedWeekday = (date) => {
        if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
            return true; // no restriction
        }
        const todayName = weekdayNames[date.getDay()];
        return daysOfWeek.includes(todayName);
    };

    const isWithinDateBounds = (date) => {
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
    };

    // Local "YYYY-MM-DD" key in system local time
    const localDateKey = (date) => {
        const y = date.getFullYear();
        const m = date.getMonth() + 1; // 0-based
        const d = date.getDate();
        const mm = m < 10 ? `0${m}` : `${m}`;
        const dd = d < 10 ? `0${d}` : `${d}`;
        return `${y}-${mm}-${dd}`;
    };

    // --- run-count tracking & stopping -------------------------------------

    let runCount = 0;
    let lastRunDateKey = null;
    let stopPeriodic = null;

    // Wrapped function executed on each PeriodicTask tick
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

        // Global max runs
        if (maxRuns != null && runCount >= maxRuns) {
            if (typeof stopPeriodic === "function") {
                stopPeriodic();
            }
            return;
        }

        // Weekday restriction
        if (!isAllowedWeekday(now)) {
            return;
        }

        // Time window restriction (if any)
        if (!isInWindow(now)) {
            return;
        }

        // If we have an "at: HH:MM" constraint, enforce it
        if (!isAtTimeOfDay(now)) {
            return;
        }

        // Once-per-day semantics when using at="HH:MM":
        if (atMinutes != null) {
            const todayKey = localDateKey(now);
            if (todayKey === lastRunDateKey) {
                // Already ran today at this time; skip
                return;
            }

            // All conditions satisfied → run the task
            await fn();
            runCount += 1;
            lastRunDateKey = todayKey;

            // Max runs check again
            if (maxRuns != null && runCount >= maxRuns && typeof stopPeriodic === "function") {
                stopPeriodic();
            }
        } else {
            // No "at" constraint: behave like a normal time-window scheduler
            await fn();
            runCount += 1;

            if (maxRuns != null && runCount >= maxRuns && typeof stopPeriodic === "function") {
                stopPeriodic();
            }
        }
    };

    // Start periodic loop; PeriodicTask handles sequential timing
    stopPeriodic = PeriodicTask(intervalSeconds, wrappedFn);

    // Expose stop to caller
    return stopPeriodic;
};

module.exports = TimeTriggeredTask;
