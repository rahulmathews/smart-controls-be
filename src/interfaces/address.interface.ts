import {Document, Schema} from 'mongoose';

export interface IAddress{
    name : string;
    street?: string;
    city: string;
    district?: string;
    state: string;
    country: string;
    pincode: number;
}

export interface IAddressDoc extends IAddress, Document {
    _id: Schema.Types.ObjectId
};