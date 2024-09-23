const CheckDST = (date, IANAid) => {
    const year = date.getFullYear();
    
    const march = new Date(year, 2, 1);
    const dayOfWeekMarch = march.getDay();
    const secondSundayInMarch = new Date(year, 2, ((7 - dayOfWeekMarch) + 7) + 1);

    const november = new Date(year, 10, 1);
    const dayOfWeekNovember = november.getDay();
    const firstSundayInNovember = new Date(year, 10, ((7 - dayOfWeekNovember) + 1));

    return date >= secondSundayInMarch && date < firstSundayInNovember;
}

module.exports = CheckDST;
