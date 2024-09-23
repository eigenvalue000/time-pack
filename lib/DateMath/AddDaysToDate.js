/**
 * 
 * @param {string} date - The date string in format YYYY-MM-DD.
 * @param {number} numDaysToAdd - The number of days to add. The number must be nonzero.
 * @param {boolean} skipWeekend - Set to false if you want to include weekends in the calculation.
 * @returns {string}
 */

const AddDaysToDate = (date, numDaysToAdd, skipWeekend = true) => {
    if (skipWeekend) {
        if (new Date(new Date(date).valueOf() + numDaysToAdd * 24 * 60 * 60 * 1000).getUTCDay() === 0) {
            // Sunday
            if (numDaysToAdd < 0) {
                return new Date(new Date(date).valueOf() + (numDaysToAdd * 24 * 60 * 60 * 1000) + (-2 * 24 * 60 * 60 * 1000)).toJSON().slice(0,10);
            } else if (numDaysToAdd > 0) {
                return new Date(new Date(date).valueOf() + (numDaysToAdd * 24 * 60 * 60 * 1000) + (1 * 24 * 60 * 60 * 1000)).toJSON().slice(0,10);
            }
        }
        else if (new Date(new Date(date).valueOf() + numDaysToAdd * 24 * 60 * 60 * 1000).getUTCDay() === 6) {
            // Saturday
            if (numDaysToAdd < 0) {
                return new Date(new Date(date).valueOf() + (numDaysToAdd * 24 * 60 * 60 * 1000) + (-1 * 24 * 60 * 60 * 1000)).toJSON().slice(0,10);
            } else if (numDaysToAdd > 0) {
                return new Date(new Date(date).valueOf() + (numDaysToAdd * 24 * 60 * 60 * 1000) + (2 * 24 * 60 * 60 * 1000)).toJSON().slice(0,10);
            }
        }
        else {
            return new Date(new Date(date).valueOf() + numDaysToAdd * 24 * 60 * 60 * 1000).toJSON().slice(0,10);
        }
    } else {
        return new Date(new Date(date).valueOf() + numDaysToAdd * 24 * 60 * 60 * 1000).toJSON().slice(0,10);
    }

}

module.exports = AddDaysToDate;