const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const config = require("../../config.json");
const userProvider = require("./providers/userProvider");

const registerUserData = async (params) => {
  try {
    console.log(`registerUserData : Start`, params);
    let app_id = uuidv4();
    let tokenDetail = await createJwtToken(app_id);
    await userProvider.registerUserData({
      app_id: app_id,
      authToken: tokenDetail.token,
      ...params,
    });
    console.log(`registerUserData : End`, params);
    return { app_id: app_id, authToken: tokenDetail.token };
  } catch (error) {
    throw error;
  }
};

const refreshRegisterUserToken = async (params, authToken) => {
  try {
    console.log(
      `refreshRegisterUserToken : Start => params ${JSON.stringify(params)}`
    );
    let authenticated = await appAuthenticate(authToken); //will automatic throw error
    console.log(
      `refreshRegisterUserToken : In Progreess / authenticated => Success`
    );

    let app_id = authenticated.app_id;
    let tokenDetail = await createJwtToken(app_id);

    console.log(`refreshRegisterUserToken : End`);

    return { app_id: app_id, authToken: tokenDetail.token };
  } catch (error) {
    throw error;
  }
};

const createDynamicAppTable = async (params, authToken) => {
  try {
    console.log(
      `createDynamicAppTable : Start => params ${JSON.stringify(params)}`
    );
    let authenticated = await appAuthenticate(authToken); //will automatic throw error
    console.log(
      `createDynamicAppTable : In Progreess / authenticated => Success`
    );

    let app_id = authenticated.app_id;
    let dynamicPrimaryKey = uuidv4();
    let paramsReq = {
      tableName: params.dynamicTable,
      AttributeName: "uuid",
      KeyType: `HASH`,
      AttributeType: "S",
    };

    console.log(
      `createDynamicAppTable : In Progreess / createDynamicHashKeyTable => Start`
    );
    await userProvider.createDynamicHashKeyTable(paramsReq); //will create dynamic table
    console.log(
      `createDynamicAppTable : In Progreess / createDynamicHashKeyTable => Completed`
    );

    let itemObj = {};
    params.dynamicColumns.map((d) => {
      itemObj[d] = ``;
    });
    let dynamicColumnsObj = {
      Item: { ...itemObj, uuid: dynamicPrimaryKey },
      TableName: params.dynamicTable,
    };

    console.log(
      `createDynamicAppTable : In Progreess / insertRowData : Table ${params.dynamicTable} => Start`
    );
    await userProvider.insertRowData(dynamicColumnsObj); // will create columns by inserting data
    console.log(
      `createDynamicAppTable : In Progreess / insertRowData : Table ${params.dynamicTable} => Completed `
    );

    let appMappingKey = uuidv4();
    let appMappingObj = {
      TableName: `app_table_mapping`,
      Item: {
        mapping_id: appMappingKey,
        app_id: app_id,
        table_name: params.dynamicTable,
      },
    };

    console.log(
      `createDynamicAppTable : In Progreess / insertRowData : Table ${appMappingObj.TableName} => Start`
    );
    await userProvider.insertRowData(appMappingObj);
    console.log(
      `createDynamicAppTable : In Progreess / insertRowData : Table ${appMappingObj.TableName} => Completed`
    );

    console.log(`createDynamicAppTable : Completed`);
    return;
  } catch (error) {
    throw error;
  }
};

const deleteDynamicAppTable = async (params, authToken) => {
  try {
    console.log(
      `deleteDynamicAppTable : Start => params ${JSON.stringify(params)}`
    );
    let authenticated = await appAuthenticate(authToken); //will automatic throw error
    console.log(
      `deleteDynamicAppTable : In Progreess / authenticated => Success`
    );

    params = { ...authenticated, ...params };

    let checkAuthroizedUserData = await checkAuthroizedUser(params);
    let responseDetail = `unauthrozed User`;
    if (checkAuthroizedUserData.length) {
      // if (params.data.s3File) {//will update the s3 bucket
      //     await uploads3Bucket(params);
      // }
      let mappingObj = checkAuthroizedUserData.find(
        (d) => d.table_name == params.dynamicTable
      );
      let appMappingObj = {
        TableName: `app_table_mapping`,
        Key: {
          mapping_id: mappingObj.mapping_id,
        },
      };

      console.log(
        `deleteDynamicAppTable : In Progreess / deleteRowData : Table ${appMappingObj.TableName} => Start`
      );
      await userProvider.deleteRowData(appMappingObj);
      console.log(
        `deleteDynamicAppTable : In Progreess / deleteRowData : Table ${appMappingObj.TableName} => Completd`
      );

      let deleteTableObj = {
        TableName: mappingObj.table_name,
      };
      console.log(
        `deleteDynamicAppTable : In Progreess / deleteDynamicHashKeyTable : Table ${deleteTableObj.TableName} => Start`
      );
      await userProvider.deleteDynamicHashKeyTable(deleteTableObj);
      console.log(
        `deleteDynamicAppTable : In Progreess / deleteDynamicHashKeyTable : Table ${deleteTableObj.TableName} => Completd`
      );
    }

    console.log(`deleteDynamicAppTable : Completed`);
    return;
  } catch (error) {
    throw error;
  }
};

const insertAppDynamicData = async (params, authToken,mutliPartObj={}) => {
  try {
    let authenticated = await appAuthenticate(authToken); //will automatic throw error
    params.app_id = authenticated.app_id;
    return await processInsertDynamicData(params,mutliPartObj);
  } catch (error) {
    throw error;
  }
};


const loginUsersDynamicData = async (params, authToken) => {
  try {
    // let authenticated = await usersAuthenticate(authToken,params.data.email); //will automatic throw error
    let authenticated=  jwt.decode(authToken);
    let checkAuthroizedUserData = await checkAuthroizedUser({app_id:params.appId});
    let responseDetail = `unauthrozed User`;
  if (checkAuthroizedUserData.length) {
    responseDetail= await fetchNoteData(params.dynamicTable,authenticated.user_id,params.appId);
    if(!responseDetail){
      throw {messsage:"User Not Found"}
    }

  }
  return responseDetail
  } catch (error) {
    throw error;
  }
};


const registerUsersDynamicData = async (params, authToken,mutliPartObj={}) => {
  try {
    let authenticated = await usersAuthenticate(authToken,params.data.email); //will automatic throw error
    params.app_id=params.appId;
    delete params.appId;
    let  currentTimeStamp=Math.floor(Date.now() / 1000);
    params.data.userTimer=`${currentTimeStamp+(24*60*60*3)}`;
    //currentTimeStamp+(24*60*60*basetimerDB)-> resetTimer=true-> basetimer
     //userTimerDB+(24*60*60*updateTimerDays)-> 
    params.data.baseTimerDays=3;
    return await processInsertDynamicData(params,mutliPartObj,authenticated.user_id);
  } catch (error) {
    throw error;
  }
};

const updateUsersDynamicData = async (params, authToken) => {
  try {
    let authenticated =  jwt.decode(authToken); //will automatic throw error
    params.app_id=params.appId;
    delete params.appId;
    params.uuid=authenticated.user_id;
    // "data": { //refrence
    //   "baseTimerDays":5
    //    "updateTimerDays":7 //for updating days count 
    //    "resetTimer":true //for reseting days count
    //   }
    return await processUpdateDynamicData(params,{});
  } catch (error) {
    throw error;
  }
};

const updateTimerDaysData= async(params,updateTimerDays)=>{
  try {
    responseDetail= await fetchNoteData(params.dynamicTable,params.uuid);
    return responseDetail.userTimer+(24*60*60*`${JSON.parse(updateTimerDays)}`);
  } catch (error) {
   throw error; 
  }
}

const resetTimerDaysData= async(params)=>{
  try {
    let  currentTimeStamp=Math.floor(Date.now() / 1000);
    responseDetail= await fetchNoteData(params.dynamicTable,params.uuid);
    return currentTimeStamp+(24*60*60*`${JSON.parse(responseDetail.baseTimerDays)}`);
  } catch (error) {
   throw error; 
  }
}

const updateBaseTimerDaysData= async(params,baseTimerDays)=>{
  try {
    responseDetail= await fetchNoteData(params.dynamicTable,params.uuid);
    return responseDetail.userTimer+(24*60*60*`${JSON.parse(baseTimerDays)}`);
  } catch (error) {
   throw error; 
  }
}

const processInsertDynamicData= async (params,mutliPartObj={},customUuid=undefined)=>{
  try {
    let dynamicPrimaryKey = (customUuid)?customUuid:uuidv4();
      let reqItemObj = params.data;
      let dynamicColumnsObj = {
        Item: {
          ...reqItemObj,
          uuid: dynamicPrimaryKey,
        },
        TableName: params.dynamicTable,
      };
  
      let checkAuthroizedUserData = await checkAuthroizedUser(params);
      let responseDetail = `unauthrozed User`;
  
      if (checkAuthroizedUserData.length) {
        if (params.data.s3File || mutliPartObj.isMutliPart) {
          //will update the s3 bucket
          await uploads3Bucket({ uuid: dynamicPrimaryKey, ...params ,mutliPartObj});
        }
        let insertedData = await userProvider.insertRowData(dynamicColumnsObj);
        responseDetail = { processData: dynamicColumnsObj, ...insertedData };
      }
      return responseDetail;
  } catch (error) {
    throw error;
  }
  }

const s3MultißPartUpload =async(req,authToken)=>{
  try {
    let paramsReqFileObj={
      isMutliPart:true,
      reqFileObj:req.file
    };
    let dynamicTable=req.body.dynamicTable;
    delete req.body["dynamicTable"];
    let paramsBody={
      dynamicTable:dynamicTable,
      data:req.body
    }
 await insertAppDynamicData(paramsBody,authToken,paramsReqFileObj);
  } catch (error) {
    throw error
  }
 }

const updates3MultiPartUpload =async(req,authToken)=>{
  try {
    let paramsReqFileObj={
      isMutliPart:true,
      reqFileObj:req.file
    };
    let dynamicTable=req.body.dynamicTable;
    let uuid= req.body.uuid;
    delete req.body["dynamicTable"];
    delete req.body["uuid"];
    let paramsBody={
      dynamicTable:dynamicTable,
      uuid:uuid,
      data:req.body
    }
 await updateDynamicSubUserData(paramsBody,authToken,paramsReqFileObj);
  } catch (error) {
    throw error
  }
 }

 const getAllUsersNotesData = async (params, authToken) => {
   try {
    // let authenticated = await usersAuthenticate(authToken); //will automatic throw error
  let authenticated= jwt.decode(authToken);
  let checkAuthroizedUserData = await checkAuthroizedUser({app_id:params.appId});
  let responseDetail = `unauthrozed User`;
  if (checkAuthroizedUserData.length) {
    responseDetail= await fetchNoteData(params.dynamicTable,authenticated.user_id,params.appId);

  }
  return responseDetail;
   } catch (error) {
     throw error;
   }


 }
 const insertUpdateUsersNotesData = async (req, authToken,notesDeleteFlag=false) => {
  try {
    let authenticated = jwt.decode(authToken); //will automatic throw error

  
    let dynamicTable=req.body.dynamicTable;
    let parentuuid= authenticated.user_id;
    let app_id=req.body.appId;
    let notesUuid=(req.body.notesUuid)?req.body.notesUuid:uuidv4(); 
    delete req.body["dynamicTable"];
    delete req.body["parentuuid"];
    delete req.body["appId"];
    delete req.body["notesUuid"];
    let notesObj=notesUuid
  if(notesDeleteFlag){
    notesObj=notesUuid;
  }else{
    notesObj={[`${notesUuid}`]:req.body}
  }
    let paramsBody={
      dynamicTable:dynamicTable,
      uuid:parentuuid,
      app_id:app_id,
      data:{notes:notesObj}
    }
    let paramsReqFileObj={};
    if(req.file){
      paramsReqFileObj={
        isMutliPart:true,
        reqFileObj:req.file
      };
      paramsBody.data.notes[`${notesUuid}`]['imageUrl']=paramsReqFileObj.reqFileObj.originalname;
    }
 await processUpdateDynamicData(paramsBody,paramsReqFileObj,notesDeleteFlag);
  } catch (error) {
    throw error;
  }
};

const updateDynamicSubUserData = async (params, authToken,mutliPartObj={}) => {
  try {
    let authenticated = await appAuthenticate(authToken); //will automatic throw error
    params = { ...authenticated, ...params };
    return await processUpdateDynamicData(params,mutliPartObj)
  } catch (error) {
    throw error;
  }
};

const processUpdateDynamicData= async (params,mutliPartObj={},notesDeleteFlag=false)=>{
  try {
    let dynamicPrimaryKey = params.uuid;
    let reqItemObj = params.data;
    let dynamicColumnsObj = {
      Item: {
        ...reqItemObj,
        uuid: dynamicPrimaryKey,
      },
      TableName: params.dynamicTable,
    };

    let checkAuthroizedUserData = await checkAuthroizedUser(params);
    let responseDetail = `unauthrozed User`;
    if (checkAuthroizedUserData.length) {
      if (params.data.s3File || mutliPartObj.isMutliPart) {
        //will update the s3 bucket
        await uploads3Bucket({...params ,mutliPartObj});
      }
      if (params.data.notes) {
        params.data.notes= await processNoteData(params.data.notes,params.dynamicTable,dynamicPrimaryKey,notesDeleteFlag);
      }

      if(params.data.updateTimerDays){
        params.data.userTimer =await updateTimerDaysData(params,params.data.updateTimerDays);
        delete(params.data.updateTimerDays);
      }
      if(params.data.resetTimer){
        params.data.userTimer =await resetTimerDaysData(params);
        delete(params.data.resetTimer);
      }
      if(params.data.baseTimerDays){
        params.data.userTimer=await updateBaseTimerDaysData(params,params.data.baseTimerDays);
      }
      let UpdateExpression = `set `;
      let dataMain = Object.keys(params.data);
      let ExpressionAttributeValues = {};
      dataMain.map((d, i) => {
        UpdateExpression += `${d}= :p${i},`;

        ExpressionAttributeValues = {
          [`:p${i}`]: params["data"][d],
          ...ExpressionAttributeValues,
        };
      });
      UpdateExpression = UpdateExpression.substring(
        0,
        UpdateExpression.length - 1
      );
      let dynamicObj = {
        TableName: params.dynamicTable,
        Key: {
          uuid: params.uuid,
        },
        UpdateExpression,
        ExpressionAttributeValues,
      };
      let updateData = await userProvider.updateRowData(dynamicObj);
      responseDetail = { processData: dynamicColumnsObj, ...updateData };
    }
    return responseDetail;
  } catch (error) {
    throw error;
  }
  }

const processNoteData= async (notesData,dynamicTable,uuid,notesDeleteFlag=false)=>{
  try {
    let scanNoteData= await fetchNoteData(dynamicTable,uuid);
  if(scanNoteData.notes){
    if(notesDeleteFlag){
      delete(scanNoteData.notes[`${notesData}`]);
      notesData=scanNoteData.notes;
    }else{
      notesData={...scanNoteData.notes,...notesData};//will update the data as uuid as key
    }    
  }
  return notesData;
  } catch (error) {
    throw error
  }
  
}

const fetchNoteData= async (dynamicTable,uuid,appId=undefined)=>{
  let paramsObj = {
    TableName: dynamicTable,
    FilterExpression: "#uuid=:uuid_value",
    ExpressionAttributeNames: {
      "#uuid": "uuid",
    },
    ExpressionAttributeValues: {
      ":uuid_value": uuid,
    },
  };
  let dynamicTableData = await userProvider.queryData(paramsObj);
  let respData= dynamicTableData[0];
  if(respData.notes && appId){
    for (const key in respData.notes) {
      if(respData.notes[key]['imageUrl'] ){
        respData.notes[key]['imageUrl']=`nodedynamocaliper/${appId}/dynamicTable/${respData.notes[key]['imageUrl']}`;
      }
    }
    
  }
  return respData;
}
const deleteDynamicSubUserData = async (params, authToken) => {
  try {
    let authenticated = await appAuthenticate(authToken); //will automatic throw error
    params = { ...authenticated, ...params };
    let dynamicPrimaryKey = params.uuid;

    let checkAuthroizedUserData = await checkAuthroizedUser(params);
    let responseDetail = `unauthrozed User`;
    if (checkAuthroizedUserData.length) {
      // if (params.data.s3File) {//will update the s3 bucket
      //     await uploads3Bucket(params);
      // }
      let dynamicObj = {
        TableName: params.dynamicTable,
        Key: {
          uuid: dynamicPrimaryKey,
        },
      };
      responseDetail = await userProvider.deleteRowData(dynamicObj);
    }
    return responseDetail;
  } catch (error) {
    throw error;
  }
};

const uploads3Bucket = async (params) => {
  try {
    let respData = await userProvider.uploadS3Bucket({
      params,
      bucketName: `nodedynamocaliper`
    });
    return respData;
  } catch (error) {
    throw error;
  }
};

const checkAuthroizedUser = async (params) => {
  try {
    let paramsObj = {
      TableName: `app_table_mapping`,
      FilterExpression: "#app_id=:app_id_value",
      ExpressionAttributeNames: {
        "#app_id": "app_id",
      },
      ExpressionAttributeValues: {
        ":app_id_value": params.app_id,
      },
    };
    let authData = await userProvider.queryData(paramsObj);

    if (!authData.length) {
      throw {
        message: `User do not have rights to do any operation on table ${params.dynamicTable}`,
      };
    }
    if (
      params.dynamicTable &&
      !authData.find((d) => d.table_name == params.dynamicTable)
    ) {
      throw {
        message: `User do not have rights to any operation on table ${params.dynamicTable}`,
      };
    }
    return authData;
  } catch (error) {
    throw error;
  }
};

const createJwtToken = async (app_id) => {
  try {
    const token = jwt.sign({ app_id: app_id }, config.secret);
    return { token };
  } catch (err) {
    throw err;
  }
};

const appAuthenticate = async (token) => {
  try {
    let decoded = jwt.verify(token, config.secret);
    let paramsObj = {
      TableName: `apps`,
      FilterExpression: "#app_id=:app_id_value",
      ExpressionAttributeNames: {
        "#app_id": "app_id",
      },
      ExpressionAttributeValues: {
        ":app_id_value": decoded.app_id,
      },
    };
    let checkApiId = await userProvider.queryData(paramsObj);
    if (!checkApiId.length) {
      throw { message: `Unauthroized User` };
    }
    return decoded;
  } catch (err) {
    throw err;
  }
};

const usersAuthenticate = async (token,email) => {
  try {
    let decoded = jwt.decode(token);
    if(decoded.email!=email){
      throw { message: `Unauthroized User` };
    }
      return decoded;
  } catch (err) {
    throw err;
  }
};

const processAuthenticate = async (paramsData) => {
  try {
    let paramsObj = {
      TableName: `apps`,
      FilterExpression: "#app_id=:app_id_value",
      ExpressionAttributeNames: {
        "#app_id": "app_id",
      },
      ExpressionAttributeValues: {
        ":app_id_value": paramsData.app_id,
      },
    };
    let checkApiId = await userProvider.queryData(paramsObj);
    if (!checkApiId.length) {
      throw { message: `Unauthroized User` };
    }
    return decoded;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  registerUserData,
  refreshRegisterUserToken,
  createDynamicAppTable,
  deleteDynamicAppTable,
  insertAppDynamicData,
  updateDynamicSubUserData,
  deleteDynamicSubUserData,
  checkAuthroizedUser,
  createJwtToken,
  updates3MultiPartUpload,
  loginUsersDynamicData,
  registerUsersDynamicData,
  updateUsersDynamicData,
  getAllUsersNotesData,
  insertUpdateUsersNotesData
};
