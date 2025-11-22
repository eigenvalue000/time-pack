const Delay = require("../Delay");
/**
 * 
 * 
 * @param {Function} fn - The function to execute periodically.
 * 
 */
const TimeTriggeredTask = (n, fn) => {
    if (typeof fn !== "function") throw new TypeError("fn must be a function.");
    
}

module.exports = TimeTriggeredTask;