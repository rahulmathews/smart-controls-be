import {Document, Schema} from 'mongoose';

import {IAddress} from './address.interface';

export interface IUser{
    username: string;
    password: string;
    userType?: 'USER' | 'ADMIN';
    gender?: 'MALE' | 'FEMALE' | 'OTHERS';
    occupation?: string;
    emails?: Array<{
        value : string,
        primary : boolean,
    }>;
    phones?: Array<{
        value : string,
        primary : boolean,
    }>;
    images?: Array<{
        link : string,
        primary : boolean,
    }>;
    address?: IAddress;
}

export interface IUserDoc extends IUser, Document {
    _id: Schema.Types.ObjectId
};