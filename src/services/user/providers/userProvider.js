const fs = require('fs');
const request= require('request');
const AWS = require("aws-sdk");
const { resolve } = require('path');
const { rejects } = require('assert');
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
              app_id:paramsData.app_id, 
              app_name: paramsData.app_name,
              app_desc:paramsData.app_desc,
              authToken:paramsData.authToken
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


  const updateRowData=async ({TableName,Key,UpdateExpression,ExpressionAttributeValues})=>{
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

const checkCreates3Bucket=async (bucketName) => {//if bucket not created it will create bucket
  try {
    return await s3.createBucket({Bucket:bucketName}).promise();
  } catch (error) {
    throw error;
  }
}   


const uploadS3Bucket=async({params,bucketName})=>{
      try {
        
      // Read content from the file
    const fileWriteStream = fs.createWriteStream("file.jpg");
    await request(params.data.s3File).pipe(fileWriteStream);
    let readStream = await fs.createReadStream("file.jpg");

    // Setting up S3 upload parameters
    let s3PathArray=params.data.s3File.split('/');
    let s3folderPath=`${params.app_id}/${params.uuid}/${s3PathArray[s3PathArray.length-1]}`
    const paramsData = {
      Bucket: bucketName,
      Key: s3folderPath, // File name you want to save as in S3
      Body: readStream,
      ACL:`public-read-write`
    };
    var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
    let respData=await new Promise((resolve, reject) => {
      s3.upload({
        ...paramsData
      }, (err, data) => err == null ? resolve(data) : reject(err));
    });
    return respData || [];
    } catch (error) {
        throw error;
    }
    
    }

    const test= (paramsData)=>{
      return new Promise((resolve,rejects)=>{

        s3.upload(paramsData,err=>{
          if(err){
            rejects(err)
          }
          resolve("ss")
        })
      });
    }

    module.exports={
        registerUserData,
        createDynamicHashKeyTable,
        createTableData,
        insertRowData,
        queryData,
        updateRowData,
        checkCreates3Bucket,
        uploadS3Bucket
    }