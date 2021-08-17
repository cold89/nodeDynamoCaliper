const { v4: uuidv4 } = require('uuid');

const userProvider=require('./providers/userProvider');

const registerUserData=async (params)=>{
try {
    return await userProvider.registerUserData({appId:uuidv4(),...params});
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
            let UpdateExpression=``; 
            let dataMain= Object.keys(params.data);
            let ExpressionAttributeValues= dataMain.map((d,i)=> {

                UpdateExpression+= `${d}= :p${i}, `

            return { ':p${i}':  params['data'][d]}
            });

            let dynamicObj={
                TableName:params.dynamicTable,
                Key:{
                    "app_id": params.app_id
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

    const uploads3Bucket = async(s3File)=>{
    try {
        let respData= await userProvider.uploadS3Bucket({s3File:s3File,bucketName:`Test`});
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
   

module.exports={
    registerUserData,
    createDynamicSubUserData,
    insertDynamicSubUserData,
    updateDynamicSubUserData,
    checkAuthroizedUser
}