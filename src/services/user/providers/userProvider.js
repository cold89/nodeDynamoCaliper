const fs = require('fs');
const AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1"
  });

const dynamodbClient = new AWS.DynamoDB.DocumentClient();

const dynamodb = new AWS.DynamoDB();

const s3= new AWS.S3();
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

    const queryData=async (paramsData)=>{
        try {
            return   (await  dynamodbClient.scan(paramsData).promise())?.Items || [];      
        } catch (error) {
          throw error;
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


  const updateRowData=async ({TableName,Key,uuid,UpdateExpression,ExpressionAttributeValues})=>{
    try {
        let params = {
          TableName:TableName,
          Key:Key,
          UpdateExpression: UpdateExpression,
          ExpressionAttributeValues:ExpressionAttributeValues,
          ReturnValues:"UPDATED_NEW"
      };
        return (await dynamodbClient.update(params).promise())|| [];
     
    } catch (error) {
        throw error
    }
}

  const uploadS3Bucket=async(paramsObj)=>{
      try {
        
      // Read content from the file
    const fileContent = fs.readFileSync(paramsObj.s3File);

    // Setting up S3 upload parameters
    const paramsData = {
      Bucket: paramsObj.bucketName,
      Key: 'cat.jpg', // File name you want to save as in S3
      Body: fileContent
    };

    let respData=s3.upload(paramsData).promise();
     return respData|| [];
    } catch (error) {
        throw error;
    }
    
    }


    module.exports={
        registerUserData,
        createDynamicHashKeyTable,
        createTableData,
        insertRowData,
        queryData,
        updateRowData,
        uploadS3Bucket
    }