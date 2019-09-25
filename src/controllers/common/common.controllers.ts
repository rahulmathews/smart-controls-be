import {Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import * as bcrypt from 'bcrypt';
import createError from 'http-errors';

import {UserModel} from '../../models';
import {IUser} from '../../interfaces';
import {TokenUtil} from '../../utils';

export class CommonController{

    constructor(){

    }

    registerUser = async(req : Request, res : Response, next : NextFunction) => {
        try{
            const {username, password, occupation, email, phone, gender, address} = _.get(req, 'body');
            if(_.isNil(_.get(req.body, 'username'))){
                let err = createError(400, 'username is either null or undefined');
                return next(err);
            };
            
            if(_.isNil(_.get(req.body, 'password'))){
                let err = createError(400, 'password is either null or undefined');
                return next(err);
            }

            if(_.isNil(_.get(req.body, 'email'))){
                let err = createError(400, 'email is either null or undefined');
                return next(err);
            }

            if(_.isNil(_.get(req.body, 'phone'))){
                let err = createError(400, 'phone is either null or undefined');
                return next(err);
            }

            if(_.isNil(_.get(req.body, 'address'))){
                let err = createError(400, 'address is either null or undefined');
                return next(err);
            }

            const saltRounds = parseInt(process.env.AUTH_SALT_ROUNDS) || 10;
            const hashedPwd = await bcrypt.hash(password, saltRounds);
            
            let insertObj: IUser = {
                username : username,
                password : hashedPwd,
                occupation : occupation,
                gender : gender,
                emails : [{
                    value : email,
                    primary : true
                }],
                phones : [{
                    value : phone,
                    primary : true
                }],
                address : address
            };

            let userDoc = await UserModel.insertUser(insertObj);
            if(userDoc){
                return res.status(200).json({message : 'Registered Successfully'});
            }
            else{
                return res.status(204).json({message : 'Registration Failed'});
            }
        }
        catch(err){
            next(err);
        }
    }

    loginUser = (req : Request, res : Response, next : NextFunction) => {
        try{
            if(!_.get(req, "token")){
                let error = createError(500, 'Token Creation Failed')
                return next(error)
            }

            //@ts-ignore
            return res.status(200).json({
                message : 'Token Created Successfully', 
                token : req['token'], 
                sessionId : req['sessionId'],
                //@ts-ignore
                userId : req['user'].userId
            });
            
        }
        catch(err){
            next(err);
        }
    }

    changePwd = async(req : Request, res : Response, next : NextFunction) => {
        try{
            const {previousPassword, newPassword} = req.body;

            if(!previousPassword || _.isNil(previousPassword)){
                let error = createError(400, 'Previous Password is Invalid');
                throw error;
            }

            if(!newPassword || _.isNil(newPassword)){
                let error = createError(400, 'New Password is Invalid');
                throw error;
            }

            const tokenInstance = new TokenUtil();
            const token = tokenInstance.extractTokenFromHeader(req);

            if(!token){
                let error = createError(400, 'Not Implemented');//Implement Mail/Sms Sending feature.
                throw error
            }

            const tokenUtil = new TokenUtil();
            let userDoc = await tokenUtil.extractPayloadOrUserDocFromHeader(req, 'USER_DOC', next);

            if(userDoc){
                let ifMatchedPwd = await bcrypt.compare(previousPassword, userDoc.password);
                if(ifMatchedPwd){
                    const newPwd = newPassword.trim();
                    const saltRounds = parseInt(process.env.AUTH_SALT_ROUNDS) || 10;
                    const hashedPwd = await bcrypt.hash(newPwd, saltRounds);

                    let updatedDoc = await UserModel.updateOne({_id : userDoc._id}, {
                        $set : {
                            password : hashedPwd
                        }
                    });

                    if(updatedDoc){
                        return res.status(200).json({
                            message : 'Updated Password Successfully', 
                        });
                    }
                    else{
                        let err =  createError(500, 'Update Password Failed');
                        throw err;
                    }
                }
                else{
                    let err = createError(400,'Previous Password does not match');
                    throw err;
                }
            };            
        }
        catch(err){
            next(err);
        }
    }

    logoutUser = async(req : Request, res : Response, next : NextFunction) =>{
        try{
            if(!_.get(req, "logout")){
                let error = createError(500, 'Logout Failed')
                return next(error)
            }

            return res.status(200).json({message : 'Logged out Successfully'});
        }
        catch(err){
            next(err);
        }
    }

    getUser = async(req : Request, res : Response, next : NextFunction) => {
        try{
            const userId = _.get(req.params , 'userId');

            if(_.isNil(userId)){
                let error = createError(400, 'User Id is either null or undefined');
                throw error;
            };

            // let userDoc = await UserModel.searchOne({_id : userId});
            let userDoc = res.locals.docs.userDoc; //Extracted while executing router.param()
            if(userDoc){
                return res.status(200).json({message : 'Data Found', data : userDoc});
            }
            else{
                return res.status(204).json({message : 'Data Not Found'});
            }
            
        }
        catch(err){
            next(err);
        }
    }

    updateUser = async(req : Request, res : Response, next : NextFunction) => {
        try{
            const {email : emailsFromReq, phone : phonesFromReq, address, occupation, gender} = _.get(req, 'body');
            const userId = _.get(req.params, 'userId');

            if(_.isNil(userId)){
                let err = createError(400, 'userId is either null or undefined');
                return next(err);
            };
            
            let insertObj: any = {};

            // let foundDoc = await UserModel.searchOne({_id : userId});
            let foundDoc = res.locals.docs.userDoc; //Extracted while executing router.param()
            if(foundDoc){
                let emails = _.map(foundDoc.emails, 'value');
                let phones = _.map(foundDoc.phones, 'value');
                let emailsToBeInserted = null;
                let phonesToBeInserted = null;

                if(emailsFromReq && !_.isEmpty(emailsFromReq)){
                    emailsToBeInserted = _.difference(emailsFromReq, emails);
                }

                if(phonesFromReq && !_.isEmpty(phonesFromReq)){
                    phonesToBeInserted = _.difference(phonesFromReq, phones);
                }

                let emailArr = [];
                _.forEach(emailsToBeInserted, function(val){
                    emailArr.push({
                        value : val
                    });
                })

                if(!_.isEmpty(emailsToBeInserted)){
                    _.set(insertObj, '$push.emails', {$each : emailArr});
                    // insertObj.$push = {
                    //      emails: {
                    //         $each : emailArr
                    //     }
                    // }
                }

                let phoneArr = [];
                _.forEach(phonesToBeInserted, function(val){
                    phoneArr.push({
                        value : val
                    });
                })

                if(!_.isEmpty(phonesToBeInserted)){
                    _.set(insertObj, '$push.phones', {$each : phoneArr});
                    // insertObj.$push.phones = {
                    //     $each : phoneArr
                    // }
                }
                
                if(!_.isNil(address)){
                    insertObj.$set = {
                        address : address
                    }
                };

                if(!_.isNil(occupation)){
                    insertObj.$set = {
                        occupation : occupation
                    }
                };

                if(!_.isNil(gender)){
                    insertObj.$set = {
                        gender : gender
                    }
                };

                let updatedUserDoc = await UserModel.updateOne({_id : userId}, insertObj);
                if(updatedUserDoc){
                    return res.status(200).json({message : 'Update Successfull'});
                }
                else{
                    return res.status(204).json({message : 'Update Failed'});
                }

            }
            else{
                let err = createError(400, 'No Document found');
                return next(err);
            }
        }
        catch(err){
            next(err);
        }
    }

    updatePrimaryEmail = async(req : Request, res : Response, next : NextFunction) =>{
        try{
            let userId = _.get(req.params, 'userId');
            let emailId = _.get(req.params, 'emailId');

            if(_.isNil(userId)){
                let error = createError(400, 'User Id is either null or undefined');
                return next(error);
            }

            if(_.isNil(emailId)){
                let error = createError(400, 'Email Id is either null or undefined');
                return next(error);
            }

            // let userDoc = await UserModel.searchOne({_id : userId});
            let userDoc = res.locals.docs.userDoc; //Extracted while executing router.param()
            if(!userDoc){
                let error = createError(400, 'User Doc not found');
                return next(error);
            }

            if(!_.find(userDoc.emails, {id : emailId})){
                let error = createError(400, 'Email Id not found');
                return next(error);
            }

            if(userDoc.emails.length === 1){
                userDoc.emails[0].primary = true;
                let updatedUserDoc = await userDoc.save();
                if(!updatedUserDoc){
                    let error = createError(500, 'Error while saving the doc');
                    return next(error);
                }
                
                return res.status(200).json({message : 'Primary email Set successfully'});
            }

            let emailObjWithPrimary = _.find(userDoc.emails, {primary : true});
            if(emailObjWithPrimary){
                emailObjWithPrimary.primary = false;
                let emailObjToBeUpdated = _.find(userDoc.emails, {id : emailId});
                //@ts-ignore
                emailObjToBeUpdated.primary = true;
                let updatedUserDoc = await userDoc.save();
                if(!updatedUserDoc){
                    let error = createError(500, 'Error while saving the doc');
                    return next(error);
                }
                
                return res.status(200).json({message : 'Primary email Set successfully'});
            }
            else{
                let error =  createError(400, 'Primary Email Not found');
                return next(error);
            }

        }
        catch(err){
            next(err);
        }
    }

    updatePrimaryPhone = async(req : Request, res : Response, next : NextFunction) =>{
        try{
            let userId = _.get(req.params, 'userId');
            let phoneId = _.get(req.params, 'phoneId');

            if(_.isNil(userId)){
                let error = createError(400, 'User Id is either null or undefined');
                return next(error);
            }

            if(_.isNil(phoneId)){
                let error = createError(400, 'Phone Id is either null or undefined');
                return next(error);
            }

            // let userDoc = await UserModel.searchOne({_id : userId});
            let userDoc = res.locals.docs.userDoc; //Extracted while executing router.param()
            if(!userDoc){
                let error = createError(400, 'User Doc not found');
                return next(error);
            }

            if(!_.find(userDoc.phones, {id : phoneId})){
                let error = createError(400, 'Phone Id not found');
                return next(error);
            }

            if(userDoc.phones.length === 1){
                userDoc.phones[0].primary = true;
                let updatedUserDoc = await userDoc.save();
                if(!updatedUserDoc){
                    let error = createError(500, 'Error while saving the doc');
                    return next(error);
                }
                
                return res.status(200).json({message : 'Primary phone Set successfully'});
            }

            let phoneObjWithPrimary = _.find(userDoc.phones, {primary : true});
            if(phoneObjWithPrimary){
                phoneObjWithPrimary.primary = false;
                let phoneObjToBeUpdated = _.find(userDoc.phones, {id : phoneId});
                //@ts-ignore
                phoneObjToBeUpdated.primary = true;
                let updatedUserDoc = await userDoc.save();
                if(!updatedUserDoc){
                    let error = createError(500, 'Error while saving the doc');
                    return next(error);
                }
                
                return res.status(200).json({message : 'Primary phone Set successfully'});
            }
            else{
                let error =  createError(400, 'Primary Phone Not found');
                return next(error);
            }

        }
        catch(err){
            next(err);
        }
    }

}