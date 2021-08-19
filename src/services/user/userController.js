const { v4: uuidv4 } = require('uuid');

const config = require('../../config.json');
const jwt = require('jsonwebtoken');

const userProvider=require('./providers/userProvider');
const e = require('express');

const registerUserData=async (params)=>{
try {
    let app_id=uuidv4();
    let tokenDetail=await createJwtToken(app_id);
    await userProvider.registerUserData({appId:app_id,authToken:tokenDetail.token,...params});
    return {appId:app_id,authToken:tokenDetail.token}
} catch (error) {
    throw error
}
}

const createDynamicSubUserData=async (params)=>{
    try {
        let dynamicPrimaryKey=uuidv4();
        let paramsReq={
            tableName:params.dynamicTable,
            AttributeName:"uuid",
            KeyType: `HASH`,
            AttributeType:"S"
                
        };
        let authToken=params.token;

        let authenticated=await authenticate(params.app_id,authToken);
        console.log(authenticated)
        return;
         await userProvider.createDynamicHashKeyTable(paramsReq);//will create dynamic table
         let itemObj= {};
         params.dynamicColumns.map((d)=> {
            itemObj[d]=``
            });
        let dynamicColumnsObj={
            Item: {...itemObj,uuid:dynamicPrimaryKey},
            TableName: params.dynamicTable,
        };
        
        await userProvider.insertRowData(dynamicColumnsObj);// will create columns by inserting data

        let appMappingKey=uuidv4();
        let appMappingObj={
            TableName:`app_table_mapping`,
            Item:{
                mapping_id:appMappingKey,
                app_id:params.app_id,
                table_name:params.dynamicTable,
                dynamic_uuid:dynamicPrimaryKey
            }
        }

        await userProvider.insertRowData(appMappingObj);
        return ;

    } catch (error) {
        throw error
    }
    }


    
    const insertDynamicSubUserData=async (params)=>{
        try{
        let dynamicPrimaryKey=uuidv4();
        let reqItemObj=params.data;
        let dynamicColumnsObj={
            Item: {
                ...reqItemObj,
                uuid:dynamicPrimaryKey
            },
            TableName: params.dynamicTable
        };

        // await uploads3Bucket(params.data.s3File);
        // return;
        let checkAuthroizedUserData= await checkAuthroizedUser(params);
        let responseDetail=`unauthrozed User`;
        if(checkAuthroizedUserData.length){
             let insertedData=await userProvider.insertRowData(dynamicColumnsObj);
             responseDetail= {processData:dynamicColumnsObj,...insertedData};
        }
        return responseDetail;
    } catch (error) {
        throw error
    }

    }

    const updateDynamicSubUserData=async (params)=>{
        try{
            
            
            // return await uploads3Bucket(params);
        let dynamicPrimaryKey=params.uuid;
        let reqItemObj=params.data;
        let dynamicColumnsObj={
            Item: {
                ...reqItemObj,
                uuid:dynamicPrimaryKey
            },
            TableName: params.dynamicTable
        };

       
        let checkAuthroizedUserData= await checkAuthroizedUser(params);
        let responseDetail=`unauthrozed User`;
        if(checkAuthroizedUserData.length){
            if(params.data.s3File){//will update the s3 bucket
                // await uploads3Bucket(params);
            }
            let UpdateExpression=`set `; 
            let dataMain= Object.keys(params.data);
            let ExpressionAttributeValues={}
             dataMain.map((d,i)=> {

                UpdateExpression+= `${d}= :p${i},`

                ExpressionAttributeValues= { [`:p${i}`]:  params['data'][d],...ExpressionAttributeValues}
            });
            UpdateExpression =UpdateExpression.substring(0, UpdateExpression.length - 1);
            let dynamicObj={
                TableName:params.dynamicTable,
                Key:{
                    "uuid": params.uuid
                },
                UpdateExpression,
                ExpressionAttributeValues
            }
             let updateData=await userProvider.updateRowData(dynamicObj);
             responseDetail= {processData:dynamicColumnsObj,...updateData};
        }
        return responseDetail;
    } catch (error) {
        throw error
    }

    }

    const uploads3Bucket = async(params)=>{
    try {
        let respData= await userProvider.uploadS3Bucket({params,bucketName:`nodedynamocaliper`});
        return respData;
    } catch (error) {
    throw error;
    }
    }

    const checkAuthroizedUser= async(params)=>{
        try {
        var paramsObj = {
            TableName : `app_table_mapping`,
            FilterExpression: "#app_id=:app_id_value",
            ExpressionAttributeNames: {
                "#app_id": "app_id",
            },
            ExpressionAttributeValues: {
                 ":app_id_value": params.app_id,
            }
            
        };
       return await userProvider.queryData(paramsObj);
    } catch (error) {
            throw error;
        }
    }

    const createJwtToken= async ({ app_id }) =>{
        
        // create a jwt token that is valid for 7 days
          // create a jwt token that is valid for 7 days
     try {
        const token = jwt.sign({ appId: "shorys" }, config.secret);
        return {
            token
        };
    } catch(err) {
        throw err;
      }
    }  

    const authenticate= async (pp_id,token ) =>{
        
       
     // create a jwt token that is valid for 7 days
       // create a jwt token that is valid for 7 days
       try {
        var decoded = jwt.verify(token, config.secret);
        return decoded;
      } catch(err) {
        throw err;
      }
    }
    


module.exports={
    registerUserData,
    createDynamicSubUserData,
    insertDynamicSubUserData,
    updateDynamicSubUserData,
    checkAuthroizedUser,
    createJwtToken,
    authenticate
}