import redis, { RedisClient } from "redis";
import { Promise } from "bluebird";
import * as _ from 'lodash';
import createError from 'http-errors';

//Promisified redis functions
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

export class RedisUtil {
  public static  prom : Promise<string | Error> ;
  protected static client : RedisClient; 

  constructor() {
    
  }

  static initializeRedis = async() => {
	  try{
		RedisUtil.client = redis.createClient();
		RedisUtil.prom = new Promise((res, rej) => {

			RedisUtil.client.on("error", function(err) {
				console.error("Error Connecting to redis");
				process.exit(1);
				rej(err); //No need of rejection as process is terminated
			});

			RedisUtil.client.on("connect", function() {
				console.log("Successfully Connected to redis");
				this.isConnected = true;
				res();
			});
		});

		await RedisUtil.prom; // Await for this promise
	  }
	  catch(err){
		console.error(err);
		process.exit(1);
		// throw err;
	  }
  }

  setKey = async(key : string, value : Object | string) => {
	try{
		//validations for key-value pair
		if(_.isNil(key) || _.isNil(value)){
			return createError(500, 'Invalid key-value pair');
		}

		if(key === ''){
			return createError(500, 'Empty key');
		}

		if(value === ''){
			return createError(500, 'Empty value');
		}

		if(!_.isString(value)){
			value = JSON.stringify(value);
		}

		let prom = null;
		let keyArr = key.split('.');

		if(keyArr.length === 1){
			//@ts-ignore
			prom = RedisUtil.client.setAsync(key, value);
		}
		else{
			let valueOfRootKey = await this.getValue(keyArr[0]);
			keyArr.shift();
			let keyMod = keyArr.join()
			let jsonVal = JSON.parse(valueOfRootKey);
			_.set(jsonVal, keyMod, value);
			//@ts-ignore
			prom = RedisUtil.client.setAsync(keyArr[0], jsonVal);
		}

		//@ts-ignore
		return prom
			// .then(function(res){
			// 	return res;
			// })
			// .catch(function(err){
			// 	next(err);
			// })
	}
	catch(err){
		throw err;
	}
  }	

  getValue = async(key: string) => {
	try{
		//validation for key
		if(key === ''){
			return createError(500, 'Empty key');
		}

		let prom = null;
		let keyArr = key.split('.');

		if(keyArr.length === 1){
			//@ts-ignore
			prom = RedisUtil.client.getAsync(key);
		}
		else{
			//@ts-ignore
			prom = RedisUtil.client.getAsync(keyArr[0])
					.then(function(res){
						let jsonVal = JSON.parse(res);
						keyArr.shift();
						let keyMod = keyArr.join()
						let value = _.get(jsonVal, keyMod);
						return value;
					})
					.catch(function(err){
						return err;
					})
		}

		//@ts-ignore
		return prom
			// .then(function(res){
			// 	return res;
			// })
			// .catch(function(err){
			// 	next(err);
			// })
	}	
	catch(err){
		throw err;
	}
  }

  deleteKey = async(key: string) => {
	try{
		//validation for key
		if(key === ''){
			return createError(500, 'Empty key');
		}

		let prom = null;
		let keyArr = key.split('.');

		if(keyArr.length === 1){
			//@ts-ignore
			prom = RedisUtil.client.delAsync(key);
		}
		else{
			//@ts-ignore
			prom = RedisUtil.client.getAsync(keyArr[0])
					.then(function(res){
						let jsonVal = JSON.parse(res);
						if(_.unset(jsonVal, key)){
							return this.setAsync(keyArr[0], JSON.stringify(jsonVal));
						}
						else{
							return createError(500, 'Deletion failed');
						}
					})
					.then(function(setResponse){
						return setResponse;
					})
					.catch(function(err){
						return err;
					})
		}

		//@ts-ignore
		return prom
			// .then(function(res){
			// 	return res;
			// })
			// .catch(function(err){
			// 	return err;
			// })
	}
	catch(err){
		throw err;
	}
  }
}
