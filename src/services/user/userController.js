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
        let checkAuthroizedUserData= await checkAuthroizedUser(params);
        return true;
        let respData=await userProvider.insertRowData(dynamicColumnsObj);
        return {processData:dynamicColumnsObj,...respData};

    } catch (error) {
        throw error
    }

    }

    const checkAuthroizedUser= async(params)=>{
        try {
            
        var paramsObj = {
            TableName : `app_table_mapping`,
            Key: {
              
                "table_name": params.dynamicTable
               }
        };
        let data = await userProvider.queryData(paramsObj);
        return data;
    } catch (error) {
            throw error;
        }
    }
    // const createDynamicMappingData=async (paramsObj)=>{
    //     try {
    //        //@toDO
    //               //@toDO
    //     // let paramsReq={
    //     //     tableName:params.dynamicTable,
    //     //     KeySchema: params.dynamicColumns.map((d)=> {
    //     //         return { AttributeName:d, KeyType:"HASH"}
    //     //         }),
    //     //     AttributeDefinitions: params.dynamicColumns.map((d)=> {
    //     //             return { AttributeName:d, AttributeType:"S"}
    //     //             })    
    //     // };
    //        let tableName=`${paramsObj.appId}_${paramsObj.dynamicTable}`;
    //         let paramsReq={
    //             TableName:tableName,
    //             KeySchema: [       
    //                         { AttributeName: "userAppId", KeyType: "HASH"},  //Partition key
    //                         { AttributeName: "dynamicTableKey", KeyType: "RANGE" }  //Sort key
    //                     ],
    //                     AttributeDefinitions: [       
    //                         { AttributeName: "userAppId", AttributeType: "S" },
    //                         { AttributeName: "dynamicTableKey", AttributeType: "S" }
    //                     ]
    //         };
            
    //         await userProvider.createTableData(paramsReq);
    //         return true;
    
    //     } catch (error) {
    //         throw error
    //     }
    //     }    

module.exports={
    registerUserData,
    createDynamicSubUserData,
    insertDynamicSubUserData,
    // updateDynamicSubUserData,
    checkAuthroizedUser
}