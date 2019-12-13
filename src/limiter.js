const express = require('express');
const { getIpAndVerify } = require('./ip.js');



/**
 * @param {String} ip User IP
 * @param {Object} listedIP User limit object
 * @param {Map<String>} map Map of limit
 * @param {Number} expire Limit expire
 * @param {*} message Limited message/response
 * @param {express.response} res Express response object
 */
let handler = function limit(next, ip, listedIP, map, code, expire, message, res) {
    listedIP.limited = true
    clearTimeout(listedIP.timeout)

    listedIP.timeout = setTimeout(() => {
        if (map.get(ip) !== undefined) map.delete(ip)
    }, expire * 1000)

    map.set(ip, listedIP)
    return res.status(code).send(message);
}

/**
 * Create new rate limiter middleware
 * @param {object} o Settings for the limiter
 * 
 * @param {Number} o.max Maximum request in timer
 * @param {Number} o.timer Time for reset limit counter (In Seconds)
 * @param {Number} o.expire How long the rate limit wear off
 * @param {*} o.message Rate limited message
 * @param {Number} o.code Rate limit response code (429)
 */
module.exports = (o) => {
    this.options = {
        max: o.max || 10, // max request in timer
        timer: o.timer || 20, // time request, in secs
        expire: o.expire || 60, // stop limiting time, in secs
        message: o.message || "You\'ve been rate limited. Please try again later", // rate limited message
        code: o.code || 429 // Response code
    }

    this.limit = new Map();

    this.router = express.Router();
    this.router.use((req, res, next) => {
        // Get IP
        let ip = getIpAndVerify(req);
        if(ip == 'localhost') {
            next();
            return console.warn("localhost detected! This won\'t be tracked")
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
        if(listedIP.limited) return res.status(this.options.code).send(this.options.message);

        // Start to update limit list
        listedIP.counter++
        if(listedIP.counter > this.options.max) {
            return handler(next, ip, listedIP, this.limit, this.options.code, this.options.expire, this.options.message, res);
        } else {
            clearTimeout(listedIP.timeout)

            listedIP.timeout = setTimeout(() => {
                if(this.limit.get(ip) !== undefined) this.limit.delete(ip)
            }, this.options.timer*1000)

            this.limit.set(ip, listedIP);
        }

        next();
    });
    
    this.router.setHandler = setHandler;
    return this.router;
}

/**
 * @param {Function} func New handler function
 */
function setHandler(func) {
    if(!(func instanceof Function)) throw TypeError("Handler input type is not a function.");

    handler = func;
}