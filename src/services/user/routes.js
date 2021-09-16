const userToken=`eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyYWZkYjliOGJmZmMyY2M4ZTU4NGQ2ZWE2ODlmYzEwYTg3MGI2NzgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaGFkaS1hcHAtZTZlNWUiLCJhdWQiOiJoYWRpLWFwcC1lNmU1ZSIsImF1dGhfdGltZSI6MTYzMTcxNzUyOSwidXNlcl9pZCI6InVDbm82ZDk0eUpUTVg5UkNISkV1cnJMbWlVbzIiLCJzdWIiOiJ1Q25vNmQ5NHlKVE1YOVJDSEpFdXJyTG1pVW8yIiwiaWF0IjoxNjMxNzE3NTI5LCJleHAiOjE2MzE3MjExMjksImVtYWlsIjoia2lydGVzaC5zdXRoYXIxNUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsia2lydGVzaC5zdXRoYXIxNUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.llcTOGen4y-EoKwwEZ6CLXb4lm0w1fFPjuwiqX8J8y7E5dqeR5PwTYQsLNTMbkp_QzvtJHWEbMdhKkpPw2mBM6-MAxjQa4kZ-uVL7fAIg1VRPPG1dW-0q9l6pIf3A9qiHQiM51tZH4gIQWtV1CXmEG7qiYCNmrcHpCApRf8u90Ls0Iq49UAwLdQPPMr7vTb00FinyxS5_7WGxN4FzrrhrkwUg_r8Z91nBrafKKM5Xb0sE5n0eb_W2hCsLPJDmLR6m5JuecF7HJstwUI91K1cdFp221vCWJgkX2PrLLyrn_M5sXI8JWnRSie9s1eFrx-cghMtwaMVafm4cqoKdpq7qw`;
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

routes.delete("/delete-dynamnic-table", async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.deleteDynamicAppTable(
      req.body,
      authToken
    );
    res.status(200).json({ msg: `Dynamic AppTable Deletd`, response: result });
  } catch (error) {
    res.status(401).json(error);
  }
});

routes.post("/insert-update-dynamnic-table", async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.insertAppDynamicData(
      req.body,
      authToken
    );
    res.status(200).json({ msg: `User Inserted Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.put("/insert-update-dynamnic-table", async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.updateDynamicSubUserData(
      req.body,
      authToken
    );
    res.status(200).json({ msg: `User Updated Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.delete("/insert-update-dynamnic-table", async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.deleteDynamicSubUserData(
      req.body,
      authToken
    );
    res
      .status(200)
      .json({ msg: `User Record Deleted Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
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

routes.post("/insert-update-dynamnic-table-s3Upload", 
        multer({ dest: '/tmp/', limits: { fieldSize: 8 * 1024 * 1024 } })
        .single('s3FileName'),async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.s3MultiPartUpload(
      req,
      authToken
    );
    res.status(200).json({ msg: `s3 upload `, response: result });
  } catch (error) {
    res.status(401).json(error);
  }
});

routes.put("/insert-update-dynamnic-table-s3Upload", 
        multer({ dest: '/tmp/', limits: { fieldSize: 8 * 1024 * 1024 } })
        .single('s3FileName'),async (req, res) => {
  try {
    let authToken = fetchToken(req.headers);
    let result = await userController.updates3MultiPartUpload(
      req,
      authToken
    );
    res.status(200).json({ msg: `s3 upload `, response: result });
  } catch (error) {
    res.status(401).json(error);
  }
});


routes.post("/users-dynamic", async (req, res) => {
  try {
    // let authToken = fetchToken(req.headers);
    let result = await userController.registerUsersDynamicData(
      req.body,
      userToken
    );
    res.status(200).json({ msg: `User Inserted Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});


routes.put("/users-notes",  
  multer({ dest: '/tmp/', limits: { fieldSize: 8 * 1024 * 1024 } })
  .single('s3FileName'),async (req, res) => {
  try {
    // let authToken = fetchToken(req.headers);
    let result = await userController.insertUpdateUsersNotesData(
      req,
      userToken
    );
    res.status(200).json({ msg: `Notes Inserted Succfully`, response: result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

routes.delete("/users-notes", async (req, res) => {
  try {
  // let authToken = fetchToken(req.headers);
  let result = await userController.insertUpdateUsersNotesData(
    req,
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
