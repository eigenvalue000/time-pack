
/**
 * Creates a period task that runs a given function every `n` seconds.
 * @param {number} n - Interval in seconds between executions.
 * @param {Function} fn - The function to execute periodically.
 * @returns {Function} stop - A function that cancels the periodic task.
 */
const PeriodicTask = (n, fn) => {
    if (typeof fn !== "function") throw new TypeError("fn must be a function.");
    if (n <= 0) throw new RangeError("Interval must be greater than zero.");
    
    let stopped = false;

    async function loop() {
        while (!stopped) {
            try {
                await fn(); 
            } catch (err) {
                console.error("PeriodicTask error:", err);
            }

            await new Promise(resolve => setTimeout(resolve, n * 1000));
        }
    }

    loop();

    return () => { stopped = true; };
}

module.exports = PeriodicTask;