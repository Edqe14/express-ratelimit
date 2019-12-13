const express = require('express');
const { getIpAndVerify } = require('./ip.js');
const { limit } = require('./utils.js');

/**
 * Create new rate limiter middleware
 * @param {object} o Settings for the limiter
 * 
 * @param {number} o.max Maximum request in timer
 * @param {number} o.timer Time for reset limit counter (In Seconds)
 * @param {number} o.expire How long the rate limit wear off
 * @param {*} o.message Rate limited message
 */
module.exports = (o) => {
    this.options = {
        max: o.max || 10, // max request in timer
        timer: o.timer || 20, // time request, in secs
        expire: o.expire || 60, // stop limiting time, in secs
        message: o.message || "You\'ve been rate limited. Please try again later" // rate limited message
    }

    this.limit = new Map();

    this.router = express.Router();
    this.router.use((req, res, next) => {
        // Get IP
        let ip = getIpAndVerify(req);
        if(ip == 'localhost') {
            next();
            console.warn("localhost detected!")
        }

        let listedIP = this.limit.get(ip);
        // If no IP in the list..
        if(!listedIP) {
            this.limit.set(ip, {
                counter: 1,
                limited: false,
                timeout: setTimeout(() => {
                    if(this.limit.get(ip) !== undefined) this.limit.delete(ip)
                }, this.options.timer*1000)
            });
            return next();
        }

        // If IP already limited..
        if(listedIP.limited) return res.status(429).send(this.options.message);

        // Start to update limit list
        listedIP.counter++
        if(listedIP.counter > this.options.max) {
            return limit(ip, listedIP, this.limit, this.options.expire, this.options.message, res);
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