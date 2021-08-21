const fs = require('fs');
const request= require('request');
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
            console.log(`createTableData- >> start`);
            await dynamodb.createTable(params).promise();
            console.log(`createTableData- >> END`);
            let dataMain = await sleep(paramsData);
       return dataMain;
      } catch (error) {
          throw error
      }
    }

    const sleep= (paramsData)=> {
      return new Promise((resolve) => {
        let intervalId=setInterval(async() => {
          console.log(`setInterval-->Start`)
           let tableStatus= await checkTableExists(paramsData.TableName);
          console.log(`${paramsData.TableName}tableStatus`,tableStatus);
          if(tableStatus){
            clearInterval(intervalId)
            console.log(`setInterval-->Completed`);
            resolve(true);
          }
          console.log(`setInterval-->END`)
        }, 3000)
      })
    }
    const checkTableExists=async (tableName)=>{
      try {
       let params = {
        TableName: tableName /* required */
    };
        console.log(`checkTableExists--> start`)
      let tableStatus= await dynamodb.describeTable(params).promise();
      console.log(`checkTableExists--> Ebd`,tableStatus.Table.TableStatus)
      return (tableStatus.Table.TableStatus==`ACTIVE`)?true:false;
       
      } catch (error) {
          throw error
      }
      }
    const queryData=async (paramsData)=>{
        try {
            return   (await  dynamodbClient.scan(paramsData).promise()).Items || [];      
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
        
    // Create the file and get Data from API and update the file with that API data   
    let tempFileName=`file.jpg`;
    await mainFunctionPromises(params,tempFileName);
    
    // Read content from the file
    let readStream = await readStreamData(tempFileName);
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

    const mainFunctionPromises =async (params,tempFileName)=>{
      try {
        return new Promise((resolve, _rejects) => {
          requestApi(params, tempFileName).then(data => {
            resolve(data);
          });
        });
      } catch (err) {
        _rejects(err);
      }
    }

    const requestApi=(params,tempFileName)=>{
      return new Promise((resolve,rejects)=>{
        const fileWriteStream = fs.createWriteStream(tempFileName);
      let writeStreamData = request(params.data.s3File).pipe(fileWriteStream);
      writeStreamData.on('close',(data)=>{
        console.log('request finished downloading file');
        resolve(data);
      });
        
      });
    };

    const readStreamData=(fileName)=>{
      return new Promise((resolve,rejects)=>{
        let readStream=fs.createReadStream(fileName);
        let chunks = [];
        readStream.on('data', function (chunk) {
          chunks.push(chunk);
        });

        // File is done being read
        readStream.on('end', () => {
          // Create a buffer of the image from the stream
          resolve(Buffer.concat(chunks));
      });
       
      
        // This catches any errors that happen while creating the readable stream (usually invalid names)
        readStream.on('error', function(err) {
          rejects(err);
        });

      });
    };

  
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

    //Below Code for future references 
     // let dataMain=require('util').promisify(setInterval(async() => {
            //   console.log(`setInterval-->Start`)
            //   let tableStatus= await checkTableExists(paramsData.TableName);
            //   console.log(tableStatus,"_+__+_")
            //   if(tableStatus){
            //     console.log(`setInterval-->Completed`)
            //     // clearInterval(intervalID);
            //     return `Success`
            //   }
            //   console.log(`setInterval-->END`)
            // }, 1000));
