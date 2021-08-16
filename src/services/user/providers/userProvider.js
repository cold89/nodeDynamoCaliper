const AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1"
  });

const dynamodbClient = new AWS.DynamoDB.DocumentClient();

const dynamodb = new AWS.DynamoDB();

const registerUserData=async (paramsData)=>{
    try {
        let params = {
            Item: {
              app_id:paramsData.appId, 
              app_name: paramsData.app_name,
              app_desc:paramsData.app_desc
            },
            TableName: `apps`,
          };
          return await insertRowData(params);
    } catch (error) {
        throw error
    }
    }

   
      
    const createDynamicHashKeyTable=async (paramsData)=>{
      try {
          let params = {
            TableName: paramsData.tableName,
            KeySchema: [{AttributeName: paramsData.AttributeName, KeyType:paramsData.KeyType}],
            AttributeDefinitions:[{AttributeName: paramsData.AttributeName, AttributeType: paramsData.AttributeType}]
      };

      return await createTableData(params);
       
      } catch (error) {
          throw error
      }
      }

      const createTableData=async (paramsData)=>{
        try {
          let params = {
            TableName: paramsData.TableName,
            KeySchema: paramsData.KeySchema,
            AttributeDefinitions:paramsData.AttributeDefinitions,
            ProvisionedThroughput: {       
              ReadCapacityUnits: 10, 
              WriteCapacityUnits: 10
        }
      }
            let res= await dynamodb.createTable(params).promise();
          return res;
       
      } catch (error) {
          throw error
      }
    }

      const insertRowData=async (paramsData)=>{
          try {
              let params = {
                  Item: paramsData.Item,
                  ReturnConsumedCapacity: "TOTAL",
                  TableName: paramsData.TableName,
                };
              return await dynamodbClient.put(params).promise();
           
          } catch (error) {
              throw error
          }
      }

      const queryData=async (paramsData)=>{
        try {
            return   await  dynamodbClient.get(paramsData).promise();      
        } catch (error) {
          throw error;
        }
      }
    module.exports={
        registerUserData,
        createDynamicHashKeyTable,
        createTableData,
        insertRowData,
        queryData
    }



        // var params = {
    //     TableName : "TestAsync",
    //     KeySchema: [       
    //         { AttributeName: "year", KeyType: "HASH"},  //Partition key
    //         { AttributeName: "title", KeyType: "RANGE" }  //Sort key
    //     ],
    //     AttributeDefinitions: [       
    //         { AttributeName: "year", AttributeType: "N" },
    //         { AttributeName: "title", AttributeType: "S" }
    //     ],
    //     ProvisionedThroughput: {       
    //         ReadCapacityUnits: 10, 
    //         WriteCapacityUnits: 10
    //     }
    // };


