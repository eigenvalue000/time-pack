
/**
 * Creates a period task that runs a given function every `n` seconds.
 * @param {number} n - Interval in seconds between executions.
 * @param {Function} fn - The function to execute periodically.
 * @returns {Function} stop - A function that cancels the periodic task.
 */
const PeriodicTask = (n, fn) => {
    if (typeof fn !== "function") throw new TypeError("fn must be a function.");
    if (n <= 0) throw new RangeError("Interval must be greater than zero.");

    const intervalID = setInterval(() => {
        try {
            const result = fn();

            if (result instanceof Promise) {
                result.catch(err => console.error("PeriodicTask async error:", err));
            }
        } catch (err) {
            console.error("PeriodicTask error:", err);
        }
    }, n * 1000);

    return () => clearInterval(intervalID);
}

module.exports = PeriodicTask;