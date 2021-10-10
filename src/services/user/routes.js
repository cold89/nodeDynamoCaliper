const userController = require("./userController");
const express = require("express");
const multer =require('multer');

const routes = express.Router({
  mergeParams: true,
});

routes.get("/health-check", async (req, res) => {
  try {
    console.log(`Testing health check-up`);
    res.status(200).json({ msg: `server up and runing` });
  } catch (error) {
    res.status(500).json(error);
  }
});

routes.post("/register", async (req, res) => {
  try {
    let result = await userController.registerUserData(req.body);
    res
      .status(200)
      .json({ msg: `User Registered Succfully`, response: result });
  } catch (error) {
    res.status(500).json(error);
  }
});

routes.post("/refresh-token", async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.refreshRegisterUserToken(
      req.body,
      authToken
    );
    res
      .status(200)
      .json({ msg: `Refresh Token Generated Succfully`, response: result });
  } catch (error) {
    res.status(500).json(error);
  }
});

routes.post("/create-dynamnic-table", async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.createDynamicAppTable(
      req.body,
      authToken
    );
    res.status(200).json({ msg: `Dynamic AppTable Created`, response: result });
  } catch (error) {
    res.status(401).json(error);
  }
});

routes.post("/authenticate", async (req, res) => {
  try {
    let result = await userController.authenticate(req.body.app_id);
    res.status(200).json({ msg: `User Updated Succfully`, response: result });
  } catch (error) {
    res.status(500).json(error);
  }
});

//Below Routing is for USER modules////////////

routes.get("/users-dynamic", async (req, res) => {
  try {
    let userToken = fetchToken(req.headers);
    let result = await userController.loginUsersDynamicData(
      req.query,
      userToken
    );
    res.status(200).json({ msg: `User Logged in  Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.post("/users-dynamic", async (req, res) => {
  try {
    let userToken = fetchToken(req.headers);
    let result = await userController.registerUsersDynamicData(
      req.body,
      userToken
    );
    res.status(200).json({ msg: `User Inserted Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.put("/users-dynamic", async (req, res) => {
  try {
    let userToken = fetchToken(req.headers);
    let result = await userController.updateUsersDynamicData(
      req.body,
      userToken
    );
    res.status(200).json({ msg: `User Updated Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.get("/users-notes-all", async (req, res) => {
  try {
    let usersToken = fetchToken(req.headers);
    let result = await userController.getAllUsersNotesData(
      req.body,
      usersToken
    );
    res.status(200).json({ msg: `User Fetched Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.post("/users-notes",  
  multer({ dest: '/tmp/', limits: { fieldSize: 8 * 1024 * 1024 } })
  .single('imageUrl'),async (req, res) => {
  try {
    let userToken = fetchToken(req.headers);
    let result = await userController.insertUpdateUsersNotesData(
      req,
      userToken
    );
    res.status(200).json({ msg: `Notes Inserted Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});


routes.put("/users-notes",  
  multer({ dest: '/tmp/', limits: { fieldSize: 8 * 1024 * 1024 } })
  .single('imageUrl'),async (req, res) => {
  try {
    let userToken = fetchToken(req.headers);
    let result = await userController.insertUpdateUsersNotesData(
      req,
      userToken
    );
    res.status(200).json({ msg: `Notes Updated Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.delete("/users-notes", async (req, res) => {
  try {
    let userToken = fetchToken(req.headers);
    let result = await userController.insertUpdateUsersNotesData(
    {body: req.query},
    userToken,
   true
  );
  res.status(200).json({ msg: `Notes Deleted Succfully`, response: result });
  } catch (error) {
    res.status(401).json(error);
  }
});


function fetchToken(paramsObj) {
  return paramsObj.authorization.split(" ")[1];
}
module.exports = {
  routes,
};
