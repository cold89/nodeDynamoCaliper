# nodeDynamoCaliper - > Shorya Saxena ->26thAug2021

## To run application locally use below steps 
# npm i -> will install node modules
# run command nodemon index.js or node index.js

## For Debugging
# User Launch.js and update entry point to index.js inside program Key

## Setting AWS Credts
# update or configure aws prfile with credts in default or your any custom profile by giving command aws configure in terminal 
# you can user serverless command also to integrate and deploy code from local machine to AWS Lambda 

## ServerLess
# Install serverless using npm
# after that give sls deploy command on root level 
# After sls deploy command severless will check serverless.yml file and do the necessary operation given in the file


## Future enhancement
# User sls deploy command in git hub actions when we merge anythging in development branch in git hub


## SonarCube Running
## 1: execute the file with the command to cerate the server :docker-compose -f docker-compose.sonar.yml up -d
## localhost:9000/project
## 2: run command npm run test for coverage


# Happy coding