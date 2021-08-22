const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const config = require('../../config.json');
const userProvider = require('./providers/userProvider');


const registerUserData = async (params) => {
    try {
        console.log(`registerUserData : Start`, params);
        let app_id = uuidv4();
        let tokenDetail = await createJwtToken(app_id);
        await userProvider.registerUserData({ app_id: app_id, authToken: tokenDetail.token, ...params });
        console.log(`registerUserData : End`, params);
        return { app_id: app_id, authToken: tokenDetail.token }
    } catch (error) {
        throw error
    }
}

const createDynamicSubUserData = async (params, authToken) => {
    try {

        console.log(`createDynamicSubUserData : Start => params ${JSON.stringify(params)}`);
        let authenticated = await authenticate(authToken);//will automatic throw error
        console.log(`createDynamicSubUserData : In Progreess / authenticated => Success`);

        let app_id = authenticated.app_id;
        let dynamicPrimaryKey = uuidv4();
        let paramsReq = {
            tableName: params.dynamicTable,
            AttributeName: "uuid",
            KeyType: `HASH`,
            AttributeType: "S"

        };

        console.log(`createDynamicSubUserData : In Progreess / createDynamicHashKeyTable => Start`);
        await userProvider.createDynamicHashKeyTable(paramsReq);//will create dynamic table
        console.log(`createDynamicSubUserData : In Progreess / createDynamicHashKeyTable => Completed`);

        let itemObj = {};
        params.dynamicColumns.map((d) => {
            itemObj[d] = ``
        });
        let dynamicColumnsObj = {
            Item: { ...itemObj, uuid: dynamicPrimaryKey },
            TableName: params.dynamicTable,
        };

        console.log(`createDynamicSubUserData : In Progreess / insertRowData : Table ${params.dynamicTable} => Start`);
        await userProvider.insertRowData(dynamicColumnsObj);// will create columns by inserting data
        console.log(`createDynamicSubUserData : In Progreess / insertRowData : Table ${params.dynamicTable} => Completed `);

        let appMappingKey = uuidv4();
        let appMappingObj = {
            TableName: `app_table_mapping`,
            Item: {
                mapping_id: appMappingKey,
                app_id: app_id,
                table_name: params.dynamicTable
            }
        }

        console.log(`createDynamicSubUserData : In Progreess / insertRowData : Table ${appMappingObj.TableName} => Start`);
        await userProvider.insertRowData(appMappingObj);
        console.log(`createDynamicSubUserData : In Progreess / insertRowData : Table ${appMappingObj.TableName} => Completed`);

        console.log(`createDynamicSubUserData : Completed`);
        return;
    } catch (error) {
        throw error
    }
}



const insertDynamicSubUserData = async (params, authToken) => {
    try {
        let authenticated = await authenticate(authToken);//will automatic throw error
        params.app_id = authenticated.app_id;

        let dynamicPrimaryKey = uuidv4();
        let reqItemObj = params.data;
        let dynamicColumnsObj = {
            Item: {
                ...reqItemObj,
                uuid: dynamicPrimaryKey
            },
            TableName: params.dynamicTable
        };

        let checkAuthroizedUserData = await checkAuthroizedUser(params);
        let responseDetail = `unauthrozed User`;

        if (checkAuthroizedUserData.length) {
            if (params.data.s3File) {//will update the s3 bucket
                await uploads3Bucket({ uuid: dynamicPrimaryKey, ...params });
            }
            let insertedData = await userProvider.insertRowData(dynamicColumnsObj);
            responseDetail = { processData: dynamicColumnsObj, ...insertedData };
        }
        return responseDetail;
    } catch (error) {
        throw error
    }

}

const updateDynamicSubUserData = async (params, authToken) => {
    try {

        let authenticated = await authenticate(authToken);//will automatic throw error
        params = { ...authenticated, ...params };
        let dynamicPrimaryKey = params.uuid;
        let reqItemObj = params.data;
        let dynamicColumnsObj = {
            Item: {
                ...reqItemObj,
                uuid: dynamicPrimaryKey
            },
            TableName: params.dynamicTable
        };


        let checkAuthroizedUserData = await checkAuthroizedUser(params);
        let responseDetail = `unauthrozed User`;
        if (checkAuthroizedUserData.length) {
            if (params.data.s3File) {//will update the s3 bucket
                await uploads3Bucket(params);
            }
            let UpdateExpression = `set `;
            let dataMain = Object.keys(params.data);
            let ExpressionAttributeValues = {}
            dataMain.map((d, i) => {

                UpdateExpression += `${d}= :p${i},`

                ExpressionAttributeValues = { [`:p${i}`]: params['data'][d], ...ExpressionAttributeValues }
            });
            UpdateExpression = UpdateExpression.substring(0, UpdateExpression.length - 1);
            let dynamicObj = {
                TableName: params.dynamicTable,
                Key: {
                    "uuid": params.uuid
                },
                UpdateExpression,
                ExpressionAttributeValues
            }
            let updateData = await userProvider.updateRowData(dynamicObj);
            responseDetail = { processData: dynamicColumnsObj, ...updateData };
        }
        return responseDetail;
    } catch (error) {
        throw error
    }

}

const uploads3Bucket = async (params) => {
    try {
        let respData = await userProvider.uploadS3Bucket({ params, bucketName: `nodedynamocaliper` });
        return respData;
    } catch (error) {
        throw error;
    }
}

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
            }
        };
        let authData = await userProvider.queryData(paramsObj);

        if (!authData.length) {
            throw { message: `User do not have rights to any operation` }
        }
        if (params.dynamicTable && !authData.find((d) => d.table_name == params.dynamicTable)) {
            throw { message: `User do not have rights to any operation on table ${params.dynamicTable}` }
        }
        return authData;
    } catch (error) {
        throw error;
    }
}

const createJwtToken = async (app_id) => {

    try {
        const token = jwt.sign({ app_id: app_id }, config.secret);
        return { token };
    } catch (err) {
        throw err;
    }
}

const authenticate = async (token) => {
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
            }
        };
        let checkApiId = await userProvider.queryData(paramsObj);
        if (!checkApiId.length) {
            throw { message: `Unauthroized User` };
        }
        return decoded;
    } catch (err) {
        throw err;
    }
}



module.exports = {
    registerUserData,
    createDynamicSubUserData,
    insertDynamicSubUserData,
    updateDynamicSubUserData,
    checkAuthroizedUser,
    createJwtToken,
    authenticate
}