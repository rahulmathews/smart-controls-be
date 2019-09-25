import {Express, Request, Response, NextFunction} from 'express';

export class ErrorHandlerUtil{
    public appLocal : Express
    
    constructor(app: Express){
        this.appLocal = app;
        this.basicErrorHandler();
    }

    basicErrorHandler = () => {
        try{
            this.appLocal.use(function(err: any, req: Request, res: Response, next: NextFunction) {
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};
          
                console.error(err);
                // render the error page
                return res.status(err.status || 500).json({message : err.message});
            });
        }
        catch(err){
            throw err;
        }
    }
}