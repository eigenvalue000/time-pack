const GetCurrentDate = require("./GetCurrentDate");

/**
 * This function gets the most recent weekday if the date happens to fall on a weekend.
 * @param (string) timezone - Supported values are "Eastern", "Central", "Mountain", "Pacific"
 * @returns (string) The date converted into a string for the most recent weekday ex: YYYY-MM-DD
 * 
 * @example
 * const currentDate = GetCurrentWeekdayDate("Eastern");
 * console.log(currentDate); // Output will be YYYY-MM-DD
 */
const GetCurrentWeekdayDate = (timezone) => {
    // 0 Sunday
    // 1 Monday
    // 2 Tuesday
    // 3 Wednesday
    // 4 Thursday
    // 5 Friday
    // 6 Saturday
    const currentDay = new Date(GetCurrentDate(timezone)).getUTCDay();
    if (currentDay === 6) {
        return new Date(new Date(GetCurrentDate(timezone)).valueOf() - 1 * 24 * 60 * 60 * 1000).toJSON().slice(0,10);
    } else if (currentDay === 0) {
        return new Date(new Date(GetCurrentDate(timezone)).valueOf() - 2 * 24 * 60 * 60 * 1000).toJSON().slice(0,10);
    } else {
        return GetCurrentDate(timezone);
    }
}

module.exports = GetCurrentWeekdayDate;