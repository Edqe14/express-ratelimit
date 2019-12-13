function getIp(req) {
    var xff = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
    var ip = xff || req.connection.remoteAddress;
    if (ip.includes('::ffff:')) {
        ip = ip.split(':').reverse()[0]
    };

    return ip;
}

function verify(ip) {
    if (ip === '127.0.0.1' || ip === '::1') return false;

    return temp;
}

function getIpAndVerify(req) {
    let ip = getIp(req);
    if(!verify(ip)) return 'localhost';

    return ip;
}

module.exports = {
    getIp,
    getIpAndVerify,
    verify
}