const userController=require('./userController');
const express= require('express'); 

const routes= express.Router({
mergeParams:true
});

routes.post('/register',async(req,res)=>{
    try {
        let result= await userController.registerUserData(req.body);
        res.status(200).json({msg :`User Registered Succfully`,response:result})
    } catch (error) {
        res.status(500).json(error)
    }
});


routes.post('/create-dynamnic-table',async(req,res)=>{
    try {
        let result= await userController.createDynamicSubUserData(req.body);
        res.status(200).json({msg :`User Registered Succfully`,response:result})
    } catch (error) {
        res.status(500).json(error)
    }
});

routes.post('/insert-update-dynamnic-table',async(req,res)=>{
    try {
        let result= await userController.insertDynamicSubUserData(req.body);
        res.status(200).json({msg :`User Inserted Succfully`,response:result})
    } catch (error) {
        res.status(500).json(error)
    }
});

routes.put('/insert-update-dynamnic-table',async(req,res)=>{
    try {
        let result= await userController.insertDynamicSubUserData(req.body);
        res.status(200).json({msg :`User Updated Succfully`,response:result})
    } catch (error) {
        res.status(500).json(error)
    }
});


module.exports={
    routes,
};