const expressJwt = require('express-jwt');
const jwksRsa= require('jwks-rsa')
const config = require('../config.json');

module.exports = jwt;

const secret = jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'firebase_response.json',
  })

  
function jwt() {
    //  const secret  = ``;
    return expressJwt({ secret, algorithms: ['RS256'] }).unless({
        path: [
            // public routes that don't require authentication
            '/app/health-check',
            '/app/authenticate',
            '/app/register',
            '/app/users-dynamic',
            '/app/users-notes'
        ]
    });
}