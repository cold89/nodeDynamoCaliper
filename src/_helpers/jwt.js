const expressJwt = require('express-jwt');
const jwksRsa= require('jwks-rsa')
const config = require('../config.json');

module.exports = jwt;

// const secret = jwksRsa.expressJwtSecret({
//     cache: true,
//     rateLimit: true,
//     jwksRequestsPerMinute: 5,
//     jwksUri: 'https://<YOUR_AUTH0_DOMAIN>/.well-known/jwks.json',
//   })

  
function jwt() {
    const { secret } = config;
    return expressJwt({ secret, algorithms: ['HS256'] }).unless({
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