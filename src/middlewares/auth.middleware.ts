import passport from 'passport'
import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import createError from 'http-errors';
import ms from 'ms';

import config from '../config/config';
import {PassportUtil} from '../utils'

export class AuthMiddleware{
    constructor(){
        new PassportUtil();
    }

    //this includes both session initialisation and local verification strategy of passport
    authLocal = (req: Request & {
        token?: string,
        sessionId?: string
    }, res: Response, next: NextFunction) => {
        try{
            passport.authenticate('local', {session : false}, function(err, user, info){
                if(err || !user){
                    let error = createError(401, err);
                    return next(error);
                }

                const JWT_EXPIRATION_MS = ms(config.authentication.AUTH_EXPIRATION_DAYS).toString();

                const payload = {
                    username: user.username,
                    userId: user._id.toString(),
                    expires: Date.now() + parseInt(JWT_EXPIRATION_MS),
                };

                //Assign payload to req.user
                req.login(payload, {session : false}, function(err){
                    if(err){
                        return next(err)
                    }
                })

                const token = jwt.sign(JSON.stringify(payload), process.env.AUTH_SECRET_KEY);
                req.token = token; // allocate token to req variable
                return next();

            })(req, res, next);
            // return next();
        }
        catch(err){
            next(err);
        }
    }

    authJwt = (req: Request, res: Response, next: NextFunction) => {
        try{
            passport.authenticate('jwt', {session : false}, function(err, user, info){
                if(err || !user){
                    let error = createError(401, err);
                    return next(error);
                }
                return next();
            })(req, res, next);
        }
        catch(err){
            next(err);
        }
    }

}