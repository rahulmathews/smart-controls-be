import passport from 'passport';
import passportJwt from 'passport-jwt';
import passportLocal from 'passport-local';
import bcrypt from 'bcrypt';
import createError from 'http-errors';

import {UserModel} from '../models';
// import config from '../config/config';

const jwtStrategy = passportJwt.Strategy;
const localStrategy = passportLocal.Strategy;
const extractJwt = passportJwt.ExtractJwt;

//Declare all the strategies here
//TODO: Add Redis to JWT strategy
export class PassportUtil{
    
    constructor(){
        //Local Strategy
        passport.use(new localStrategy({
            usernameField : 'username',
            passwordField : 'password'
        }, async(username, password, done) => {

            try{
                let userDoc = await UserModel.searchOne({username : username});
                let ifMatchedPwd = await bcrypt.compare(password, userDoc.password);
                if(ifMatchedPwd){
                    return done(null, userDoc);
                }
                else{
                    return done('Invalid Username/Password');
                }
            }
            catch(err){
                done(err);
            }
        }))

        //Jwt Strategy
        passport.use(new jwtStrategy({
            jwtFromRequest : extractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey : process.env.AUTH_SECRET_KEY
        }, async(payload, done) => {
            try{
                let userDoc = await UserModel.searchOne({_id : payload.userId});
                if(userDoc){
                    if(Date.now() > payload.expires){
                        let error = createError(401, 'Token Expired');
                        return done(error);
                    }
                    else{
                        return done(null, userDoc, payload);
                    }
                }
                else{
                    return done('Invalid Token');
                }
            }
            catch(err){
                done(err);
            }
        }))
    
        return passport;
    }
}