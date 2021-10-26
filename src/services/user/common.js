const jwt = require("jsonwebtoken");

const userProvider = require("./providers/userProvider");

const usersAuthenticate = async (token,email) => {
    try {
      let decoded = jwt.decode(token);
      if(decoded.email!=email){
        throw { message: `Unauthroized User` };
      }
        return decoded;
    } catch (err) {
      throw err;
    }
  };

  const checkAuthroizedUser = async (paramsObj,dynamicTable) => {
    try {
      
      let authData = await userProvider.queryData(paramsObj);
  
      if (!authData.length) {
        throw {
          message: `User do not have rights to do any operation on table ${dynamicTable}`,
        };
      }
      if (
        dynamicTable &&
        !authData.find((d) => d.table_name == dynamicTable)
      ) {
        throw {
          message: `User do not have rights to any operation on table ${dynamicTable}`,
        };
      }
      return authData;
    } catch (error) {
      throw error;
    }
  };

  
  const jwtDecode=(authToken)=>{
    return jwt.decode(authToken);
  }

  const jwtSign=(paramsObj,secretKey)=>{
    jwt.sign(paramsObj, secretKey);
    return { token };
  }

  const jwtVerify=(token,secretKey)=>{
    return  jwt.verify(token, secretKey);
  }

const fetchToken=(paramsObj)=>{
    return paramsObj.authorization.split(" ")[1];
}

module.exports={
    usersAuthenticate,
    checkAuthroizedUser,
    jwtSign,
    jwtVerify,
    jwtDecode,
    fetchToken
}