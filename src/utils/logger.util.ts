import morgan from 'morgan';
import {Express} from 'express';

export class LoggerUtil{
    public loggerLocal : any;

    constructor(app: Express){
        this.basicLogger(app);
    }

    basicLogger = (app: Express) => {
        try{
            const logger = {
                write : function(msg: string){
                  console.log(msg.trimRight());
                }
            }
            
            app.use(morgan(':method :url :status :response-time ms', { stream: logger }));
        }
        catch(err){
            throw err;
        }
    }

}