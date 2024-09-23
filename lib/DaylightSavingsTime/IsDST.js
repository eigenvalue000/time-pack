

const CheckDST = require("./CheckDST");
const IsDST = (date, timezone) => {
    switch (timezone) {
        case "Eastern": return CheckDST(date, "America/New_York");
        case "Central": return CheckDST(date, "America/Chicago");
        case "Mountain": return CheckDST(date, "America/Denver"); 
        case "Pacific": return CheckDST(date, "America/Los_Angeles");
        default: console.error("Unsupported time zone.");
    }
}

module.exports = IsDST;