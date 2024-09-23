const ConvertDateToTimezone = require("./ConvertDateToTimezone");

/**
 * @param (string) timezone - Supported values are "Eastern", "Central", "Mountain", "Pacific"
 * @returns (string) The date converted into a string ex: YYYY-MM-DD
 * 
 * @example
 * const currentDate = GetCurrentDate("Eastern");
 * console.log(currentDate); // Output will be YYYY-MM-DD
 */
const GetCurrentDate = (timezone) => {
    let date = new Date();
    return ConvertDateToTimezone(date, timezone);;
}

module.exports = GetCurrentDate;