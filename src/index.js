const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app=express();

const {
    routes: userRoutes,
} = require('./services/user/routes');


app.use(cors());
app.use(bodyParser.json());
app.use('/user', userRoutes);

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