const { v4: uuidv4 } = require("uuid");

const config = require("../../config.json");
const userProvider = require("./providers/userProvider");
const common=require('./common');


const loginUsers = async (params, authToken) => {
  try {
    let authenticated=  common.jwtDecode(authToken);
    let checkAuthroizedUserData = await checkAuthroizedUser({app_id:params.appId});
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
    let authenticated = await common.usersAuthenticate(authToken,params.data.email);
    params.app_id=params.appId;
    delete params.appId;
    let  currentTimeStamp=Math.floor(Date.now() / 1000);
    params.data.userTimer=`${currentTimeStamp+(24*60*60*3)}`;
    params.data.baseTimerDays=3;
    
    return await processInsertDynamicData(params,mutliPartObj,authenticated.user_id);
  } catch (error) {
    throw error;
  }
};

const updateUsersDynamicData = async (params,  authToken) => {
  try {
    let authenticated =  common.jwtDecode(authToken);
    params.app_id=params.appId;
    delete params.appId;
    params.uuid=authenticated.user_id;
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

 const getAllUsersNotesData = async (params, authToken) => {
   try {
  let authenticated= common.jwtDecode(authToken);
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
    let authenticated = common.jwtDecode(authToken); 
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
        params.data.timerSetAt = Math.floor(Date.now() / 1000);// for update operation
        delete(params.data.resetTimer);
      }
      if(params.data.baseTimerDays){
        params.data.baseTimerDays=params.data.baseTimerDays;
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
      // delete(scanNoteData.notes[`${notesData}`]);
      scanNoteData.notes[`${notesData}`].deleteFlag=true;
      notesData=scanNoteData.notes;
    }else{
      let notesId=Object.keys(notesData)[0];
      !(scanNoteData.notes[`${notesId}`])?notesData.deleteFlag=false:null;//will get updated to false for insert
      notesData={...scanNoteData.notes,...notesData};
    }    
  }
  return notesData;
  } catch (error) {
    throw error
  }
  
}

const fetchNoteData= async (dynamicTable,uuid,appId=undefined)=>{
 
  try {
    let paramsObj = {
      Key: {
       "uuid": {
         S: uuid
        }
      }, 
      TableName: dynamicTable
     };

  let respData=  await userProvider.getItemData(paramsObj);
  if(respData.notes && appId){
    for (const key in respData.notes) {
      if(respData.notes[key]['imageUrl'] && !respData.notes[key]['deleteFlag']){
        respData.notes[key]['imageUrl']=`https://nodedynamocaliper.s3.amazonaws.com/${appId}/${dynamicTable}/${respData.notes[key]['imageUrl']}`;
      }
    }
    
  }
  return respData;
} catch (error) {
    throw error;
}
}

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
      IndexName: 'mapping_id-app_id-index',
      FilterExpression: "#app_id=:app_id_value",
      ExpressionAttributeNames: {
        "#app_id": "app_id",
      },
      ExpressionAttributeValues: {
        ":app_id_value": params.app_id,
      },
    };
    return await common.checkAuthroizedUser(paramsObj,  params.dynamicTable);
  } catch (error) {
    throw error;
  }
};


const createDynamicAppTable = async (params, authToken) => {
  try {
    console.log(`createDynamicAppTable : Start => params ${JSON.stringify(params)}`);
    let authenticated = await appAuthenticate(authToken); 
    console.log(`createDynamicAppTable : In Progreess / authenticated => Success`);

    let app_id = authenticated.app_id;
    let dynamicPrimaryKey = uuidv4();
    let paramsReq = {
      tableName: params.dynamicTable,
      AttributeName: "uuid",
      KeyType: `HASH`,
      AttributeType: "S",
    };
    console.log(`createDynamicAppTable : In Progreess / createDynamicHashKeyTable => Start`);
    await userProvider.createDynamicHashKeyTable(paramsReq); //will create dynamic table
    console.log(`createDynamicAppTable : In Progreess / createDynamicHashKeyTable => Completed`);

    let itemObj = {};
    params.dynamicColumns.map((d) => {
      itemObj[d] = ``;
    });
    let dynamicColumnsObj = {
      Item: { ...itemObj, uuid: dynamicPrimaryKey },
      TableName: params.dynamicTable,
    };
    console.log(`createDynamicAppTable : In Progreess / insertRowData : Table ${params.dynamicTable} => Start`);
    await userProvider.insertRowData(dynamicColumnsObj); // will create columns by inserting data
    console.log(`createDynamicAppTable : In Progreess / insertRowData : Table ${params.dynamicTable} => Completed`);

    let appMappingKey = uuidv4();
    let appMappingObj = {
      TableName: `app_table_mapping`,
      Item: {
        mapping_id: appMappingKey,
        app_id: app_id,
        table_name: params.dynamicTable,
      },
    };

    console.log(`createDynamicAppTable : In Progreess / insertRowData : Table ${appMappingObj.TableName} => Start`);
    await userProvider.insertRowData(appMappingObj);
    console.log(`createDynamicAppTable : In Progreess / insertRowData : Table ${appMappingObj.TableName} => Completed`);

    console.log(`createDynamicAppTable : Completed`);
    return;
  } catch (error) {throw error;}
};

const appAuthenticate = async (token) => {
  try {
    let decoded = common.jwtVerify(token, config.secret);
    let paramsObj = {
      Key: {
       "app_id": {
         S: decoded.app_id
        }
      }, 
      TableName: `apps`
     };

  let checkApiId=  await userProvider.getItemData(paramsObj);
    if (!checkApiId.length) {
      throw { message: `Unauthroized User` };
    }
    return decoded;
  } catch (err) {
    throw err;
  }
};


module.exports = {
  loginUsers,
  registerUsersDynamicData,
  updateUsersDynamicData,
  getAllUsersNotesData,
  insertUpdateUsersNotesData,

  createDynamicAppTable//@toDo: maybe Needed for furture use
};
