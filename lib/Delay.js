const Delay = async (ms) => {
    return new Promise(res => setTimeout(res, ms));
}

module.exports = Delay;