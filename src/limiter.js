const express = require('express');

/**
 * Create new rate limiter middleware
 * @param {object} o Settings for the limiter
 * 
 * @param {number} o.max Maximum request in timer
 * @param {number} o.timer Time for reset limit counter (In Seconds)
 * @param {number} o.expire How long the rate limit wear off
 * @param {*} o.message Rate limited message
 * @param {object[]=} [o.paths=[]] Use paths
 */
module.exports = (o) => {
    this.options = {
        max: o.max || 10, // max request in timer
        timer: o.timer || 20, // time request, in secs
        expire: o.expire || 60, // stop limiting time, in secs
        message: o.message || "You\'ve been rate limited. Please try again later", // rate limited message
        paths: o.paths || [] // rate limit paths
    }

    this.limit = new Map();

    this.router = express.Router();
    this.router.use((req, res, next) => {
        // Get IP
        var xff = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
        var ip = xff || req.connection.remoteAddress;
        if (ip.includes('::ffff:')) {
            ip = ip.split(':').reverse()[0]
        };

        if ((ip === '127.0.0.1' || ip === '::1')) {
            next()
            return console.warn('localhost use detected')
        };

        let listedIP = this.limit.get(ip);

        // No IP in list
        if(!listedIP) {
            this.limit.set(ip, {
                counter: 1,
                limited: false,
                timeout: setTimeout(() => {
                    if(this.limit.get(ip) !== undefined) this.limit.delete(ip)
                }, this.options.timer*1000)
            });
            return next()
        }

        // If IP already limited
        if(listedIP.limited) return res.status(429).send(this.options.message);

        // Start to update limit list
        listedIP.counter++
        if(listedIP.counter > this.options.max) {
            listedIP.limited = true
            clearTimeout(listedIP.timeout)

            listedIP.timeout = setTimeout(() => {
                if(this.limit.get(ip) !== undefined) this.limit.delete(ip)
            }, this.options.expire*1000)

            this.limit.set(ip, listedIP)
            return res.status(429).send(this.options.message);
        } else {
            clearTimeout(listedIP.timeout)

            listedIP.timeout = setTimeout(() => {
                if(this.limit.get(ip) !== undefined) this.limit.delete(ip)
            }, this.options.timer*1000)

            this.limit.set(ip, listedIP);
        }

        next()
    });
    
    return this.router;
}