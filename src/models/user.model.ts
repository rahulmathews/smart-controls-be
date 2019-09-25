import mongoose, { Model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

import { IUserDoc, IAddressDoc } from '../interfaces';


const AddressSchema = new mongoose.Schema<IAddressDoc>({
    name : {
        type : String,
        required : true,
        lowercase : true
    },
    street : {type : String},
    city  : {type : String},
    district : {type : String},
    state : {type : String},
    country : {type : String},
    pincode : {type : Number}
}, {_id : false});

const UserSchema = new mongoose.Schema<IUserDoc>({
    username : {
        type : String,
        required : true,
        lowercase : true,
        index : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    userType : {type : String, enum : ['USER', 'ADMIN'], default : 'USER' },
    gender : {type : String, enum : ['MALE', 'FEMALE', 'OTHERS']},
    occupation : {type : String, lowercase : true},
    emails : [{
        value : {
            type: String,
            lowercase : true,
            unique : true
        },
        primary : {type : Boolean, default : false}
    }],
    phones : [{
        value : {
            type : String,
            unique : true
        },
        primary : {type : Boolean, default : false}
    }],
    images: [{
        link : {
            type : String
        },
        primary : {type : Boolean, default : false}
    }],
    address : {type : AddressSchema}
    
}, {timestamps : true});

//Schema setters
UserSchema.set('toJSON', {
    transform : function(doc, ret){
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.__v;
        delete ret.password;
    }
})

//plugins
UserSchema.plugin(mongoosePaginate);

//methods

//Method to save/insert users
UserSchema.statics.insertUser = async(userObj : any) =>{
    return UserModel.create(userObj);
}

//Method to search for any query
UserSchema.statics.search = async(searchQuery : any, options: any) => {
    //@ts-ignore
    return UserModel.paginate(searchQuery, options);
    // return UserModel.find(searchQuery);
}

//Method to search for single document
UserSchema.statics.searchOne = async(searchQuery : any) => {
    return UserModel.findOne(searchQuery);
}

//Method to update a single document
UserSchema.statics.updateOne = async(searchQuery : any, updateQuery : any) => {
    return UserModel.findOneAndUpdate(searchQuery, updateQuery, {new : true});
}

//Method to remove a single document
UserSchema.statics.deleteOne = async(searchQuery : any) => {
    return UserModel.findOneAndRemove(searchQuery);
}

interface IUserModel extends Model<IUserDoc> {
    insertUser : (userObj : any) => Promise<IUserDoc>;
    search : (searchQuery : any, options: any) => Promise<IUserDoc[]>;
    searchOne : (searchQuery : any) => Promise<IUserDoc>;
    updateOne : (searchQuery : any, updateQuery : any) => any;
    deleteOne : (searchQuery : any) => any;
};

export const UserModel = mongoose.model<IUserDoc, IUserModel>('User', UserSchema);
