const fs = require("fs");
const request = require("request");

const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});

const dynamodbClient = new AWS.DynamoDB.DocumentClient();

const dynamodb = new AWS.DynamoDB();

const s3 = new AWS.S3();

const registerUserData = async (paramsData) => {
  try {
    let params = {
      Item: {
        app_id: paramsData.app_id,
        app_name: paramsData.app_name,
        app_desc: paramsData.app_desc,
        authToken: paramsData.authToken,
      },
      TableName: `apps`,
    };
    return await insertRowData(params);
  } catch (error) {
    throw error;
  }
};

const createDynamicHashKeyTable = async (paramsData) => {
  try {
    let params = {
      TableName: paramsData.tableName,
      KeySchema: [
        {
          AttributeName: paramsData.AttributeName,
          KeyType: paramsData.KeyType,
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: paramsData.AttributeName,
          AttributeType: paramsData.AttributeType,
        },
      ],
    };

    return await createTableData(params);
  } catch (error) {
    throw error;
  }
};

const createTableData = async (paramsData) => {
  try {
    let params = {
      TableName: paramsData.TableName,
      KeySchema: paramsData.KeySchema,
      AttributeDefinitions: paramsData.AttributeDefinitions,
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10,
      },
    };
    console.log(`createTableData => Start params ${params}`);
    console.log(`createTable => Start`);
    await dynamodb.createTable(params).promise();
    console.log(`createTable => Completed`);

    let dataMain = await checkTableProgressStatus(paramsData);
    console.log(`createTableData  => End`);

    return dataMain;
  } catch (error) {
    throw error;
  }
};
const deleteDynamicHashKeyTable = async (paramsData) => {
  try {
    let params = {
      TableName: paramsData.TableName,
    };

    return await deleteTableData(params);
  } catch (error) {
    throw error;
  }
};

const deleteTableData = async (paramsData) => {
  try {
    console.log(`deleteTableData : Start`);

    console.log(
      `deleteTableData : Inprogress / deleteTable => Start params ${paramsData}`
    );
    await dynamodb.deleteTable(paramsData).promise();
    console.log(`deleteTableData : Inprogress / deleteTable => Completed`);

    return `${paramsData.TableName} Deleted Succsfully `;
  } catch (error) {
    throw error;
  }
};

const checkTableProgressStatus = (paramsData) => {
  return new Promise((resolve) => {
    console.log(
      `checkTableProgressStatus : Start ${JSON.stringify(paramsData)}`
    );

    let intervalId = setInterval(async () => {
      console.log(`checkTableProgressStatus : In Progress`);

      let tableStatus = await checkTableExists(paramsData.TableName);
      console.log(
        `checkTableProgressStatus : In Progress  => ${paramsData.TableName} tableStatus ${tableStatus}`
      );

      if (tableStatus) {
        clearInterval(intervalId);
        console.log(
          `checkTableProgressStatus : Completed / setInterval : Completed`
        );
        resolve(true);
        return;
      }
    }, 1000);
  });
};
const checkTableExists = async (tableName) => {
  try {
    let params = {
      TableName: tableName /* required */,
    };
    let tableStatus = await dynamodb.describeTable(params).promise();
    console.log(`describeTable Status ${tableStatus.Table.TableStatus} --->`);
    return tableStatus.Table.TableStatus == `ACTIVE` ? true : false;
  } catch (error) {
    throw error;
  }
};
const queryData = async (paramsData) => {
  try {
    return (await dynamodbClient.scan(paramsData).promise()).Items || [];
  } catch (error) {
    throw error;
  }
};

const getItemData = async (paramsData) => {
  try {
    let data =(await dynamodb.getItem(paramsData).promise()).Item || [];
    return AWS.DynamoDB.Converter.unmarshall(data);
  } catch (error) {
    throw error;
  }
};

const insertRowData = async (paramsData) => {
  try {
    let params = {
      Item: paramsData.Item,
      ReturnConsumedCapacity: "TOTAL",
      TableName: paramsData.TableName,
    };
    return await dynamodbClient.put(params).promise();
  } catch (error) {
    throw error;
  }
};

const updateRowData = async ({
  TableName,
  Key,
  UpdateExpression,
  ExpressionAttributeValues,
}) => {
  try {
    let params = {
      TableName: TableName,
      Key: Key,
      UpdateExpression: UpdateExpression,
      ExpressionAttributeValues: ExpressionAttributeValues,
      ReturnValues: "UPDATED_NEW",
    };
    return (await dynamodbClient.update(params).promise()) || [];
  } catch (error) {
    throw error;
  }
};

const deleteRowData = async ({ TableName, Key }) => {
  try {
    let params = {
      TableName: TableName,
      Key: Key,
    };
    return (await dynamodbClient.delete(params).promise()) || [];
  } catch (error) {
    throw error;
  }
};

const checkCreates3Bucket = async (bucketName) => {
  //if bucket not created it will create bucket
  try {
    return await s3.createBucket({ Bucket: bucketName }).promise();
  } catch (error) {
    throw error;
  }
};

const uploadS3Bucket = async ({ params,bucketName }) => {
  try {
    let tempFileName,readStream = ``,s3folderPath=``,orignalFileName=`Sample`;
    let s3PathArray=[];
    
    if(params.data.s3File){
    // Create the file and get Data from API and update the file with that API data
    
    tempFileName = `/tmp/file.jpg`;
    console.log(`uploadS3Bucket: Wrtie Stream Strarted`);
    await mainFunctionPromises(params, tempFileName);
    console.log(`uploadS3Bucket: Wrtie Stream Completed`);
    // Read content from the file
    s3PathArray = params.data.s3File.split("/");
    orignalFileName=s3PathArray[s3PathArray.length - 1];
    }

    if(params.mutliPartObj.isMutliPart){
      tempFileName=params.mutliPartObj.reqFileObj.path;
      orignalFileName=params.mutliPartObj.reqFileObj.originalname
    }

    s3folderPath = `${params.app_id}/${params.dynamicTable}/${orignalFileName}`;

    console.log(`uploadS3Bucket: readStreamData Stream started`);
    readStream = await readStreamData(tempFileName);
    console.log(`uploadS3Bucket: readStreamData Completed`);
    // Setting up S3 upload parameters

   
    const paramsData = {
      Bucket: bucketName,
      Key: s3folderPath, // File name you want to save as in S3
      Body: readStream,
      ACL: `public-read-write`,
    };

    console.log(`uploadS3Bucket: started`);
    let respData = await new Promise((resolve, reject) => {
      s3.upload(
        {
          ...paramsData,
        },
        (err, data) => (err == null ? resolve(data) : reject(err))
      );
    });

    console.log(`uploadS3Bucket: Completed`);

    return respData || [];
  } catch (error) {
    throw error;
  }
};

const mainFunctionPromises = async (params, tempFileName) => {
  try {
    return new Promise((resolve, _rejects) => {
      requestApi(params, tempFileName).then((data) => {
        resolve(data);
      });
    });
  } catch (err) {
    _rejects(err);
  }
};

const requestApi = (params, tempFileName) => {
  return new Promise((resolve, rejects) => {
    const fileWriteStream = fs.createWriteStream(tempFileName);
    let writeStreamData = request(params.data.s3File).pipe(fileWriteStream);
    writeStreamData.on("close", (data) => {
      console.log("request finished downloading file");
      resolve(data);
    });
  });
};

const readStreamData = (fileName) => {
  return new Promise((resolve, rejects) => {
    let readStream = fs.createReadStream(fileName);
    let chunks = [];
    readStream.on("data", function (chunk) {
      chunks.push(chunk);
    });

    // File is done being read
    readStream.on("end", () => {
      // Create a buffer of the image from the stream
      resolve(Buffer.concat(chunks));
    });

    // This catches any errors that happen while creating the readable stream (usually invalid names)
    readStream.on("error", function (err) {
      rejects(err);
    });
  });
};

const multipPartUploadS3Bucket = async (req) => {
  try {
    // Create the file and get Data from API and update the file with that API data
    console.log(`multipPartUploadS3Bucket : Start`)

    // Read content from the file

    console.log(`uploadS3Bucket: readStreamData Stream started`);
    let readStream = await readStreamData(req.file.path);
    console.log(`uploadS3Bucket: readStreamData Completed`);
    // Setting up S3 upload parameters

    const paramsData = {
      Bucket: `nodedynamocaliper`,
      Key: `userAvatar/${req.file.originalname}`, // File name you want to save as in S3
      Body: readStream,
      ACL: `public-read-write`,
    };

    console.log(`uploadS3Bucket: started`);
    let respData = await new Promise((resolve, reject) => {
      s3.upload(
        {
          ...paramsData,
        },
        (err, data) => (err == null ? resolve(data) : reject(err))
      );
    });
    console.log(`uploadS3Bucket: Completed`);
    return  respData || [];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  registerUserData,
  createDynamicHashKeyTable,
  deleteDynamicHashKeyTable,
  insertRowData,
  queryData,
  getItemData,
  updateRowData,
  deleteRowData,
  checkCreates3Bucket,
  uploadS3Bucket,
  multipPartUploadS3Bucket
};
