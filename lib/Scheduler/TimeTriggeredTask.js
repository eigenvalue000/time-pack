/**
 * 
 * 
 * @param {Function} fn - The function to execute periodically.
 * 
 */

const Delay = require("../Delay");

const TimeTriggeredTask = (n, fn) => {
    if (typeof fn !== "function") throw new TypeError("fn must be a function.");
    
}

module.exports = TimeTriggeredTask;