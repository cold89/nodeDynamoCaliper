const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('./_helpers/jwt');
const errorHandler = require('./_helpers/error-handler');
const app=express();

const  userRoutes = require('./services/user/routes');


app.use(cors());
app.use(bodyParser.json());

// use JWT auth to secure the api
app.use(jwt());

app.use('/app', userRoutes.routes);

// global error handler for routes
app.use(errorHandler);


//Below code is use for runing aplication locally : start
const config={
    APP_URL:`localhost`,
    PORT:8000
}
app.listen(config.PORT, config.APP_URL, function() {
    console.log("server", "Server is running at port " + config.PORT);
});

//Below code is use for runing aplication locally : ebd
module.exports = app;