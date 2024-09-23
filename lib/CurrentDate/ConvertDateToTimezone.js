const IsDST = require("../DaylightSavingsTime/IsDST");

const ConvertDateToTimezone = (date, timezone) => {
    if (IsDST(date, timezone)) {
        switch (timezone) {
            case "Eastern": return new Date(date.valueOf() - 4 * 60 * 60 * 1000).toJSON().slice(0,10);
            case "Central": return new Date(date.valueOf() - 5 * 60 * 60 * 1000).toJSON().slice(0,10);
            case "Mountain": return new Date(date.valueOf() - 6 * 60 * 60 * 1000).toJSON().slice(0,10);
            case "Pacific": return new Date(date.valueOf() - 7 * 60 * 60 * 1000).toJSON().slice(0,10);
            default: console.error("Unsupported time zone.");
        }
    } else {
        switch (timezone) {
            case "Eastern": return new Date(date.valueOf() - 5 * 60 * 60 * 1000).toJSON().slice(0,10);
            case "Central": return new Date(date.valueOf() - 6 * 60 * 60 * 1000).toJSON().slice(0,10);
            case "Mountain": return new Date(date.valueOf() - 7 * 60 * 60 * 1000).toJSON().slice(0,10);
            case "Pacific": return new Date(date.valueOf() - 8 * 60 * 60 * 1000).toJSON().slice(0,10);
            default: console.error("Unsupported time zone.");
        }
    }

}

module.exports = ConvertDateToTimezone;