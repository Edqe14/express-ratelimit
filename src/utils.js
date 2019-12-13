function limit(ip, listedIP, map, expire, message, res) {
    listedIP.limited = true
    clearTimeout(listedIP.timeout)

    listedIP.timeout = setTimeout(() => {
        if (map.get(ip) !== undefined) map.delete(ip)
    }, expire * 1000)

    map.set(ip, listedIP)
    return res.status(429).send(message);
}

module.exports = {
    limit
}