import {Request, NextFunction} from 'express';
import * as _ from 'lodash';
import createError from 'http-errors';
import passport from 'passport';

import {IUserDoc} from '../interfaces';

export class TokenUtil{
    constructor(){

    }

    //Function to extract bearer token from authorisation header
    extractTokenFromHeader = (req : Request) => {
        try{
            if(_.get(req, 'headers.authorization')){
                let splitArr = req.headers['authorization'].split('Bearer');
                return splitArr[1].trim();
            }
            else{
                // let error = createError(400, 'Cannot find Authorization header');
                // throw error;
            }
        }
        catch(err){
            throw err;
        }
    }

    extractPayloadOrUserDocFromHeader = async(req : Request,param: string, next: NextFunction) => {
        try{
            let prom : Promise<IUserDoc> = new Promise(function(res, rej){
                passport.authenticate('jwt', {session : false}, function(err, user, info){
                    if(err || !user){
                        let error = createError(401, err);
                        return rej(error);
                    }
                    if(param === 'USER_DOC'){
                        return res(user);
                    }
                    else{
                        return res(info);
                    }
                })(req, res, next);
            });

            let userDoc = await prom;
            if(userDoc){
                return userDoc;
            }
        }
        catch(err){
            throw err;
        }
    }

    //Middleware to extract session token from Session-Token header
    extractAndAllocateSessionTokenFromHeader = (req : Request, res: Response, next: NextFunction) => {
        try{
            if(_.get(req, 'headers.session-token')){
                let sessionToken = req.headers['session-token'];
                //@ts-ignore
                req.sessionId = sessionToken;
                return next();
            }
            else{
                // let error = createError(400, 'Cannot find Authorization header');
                // throw error;
            }
            return next();
        }
        catch(err){
            next(err);
        }
    }
}