import express from 'express';
const router = express.Router();

import commonRouter from './common.routes';

/* Ping Api*/
router.get('/ping', function(req, res, next) {
  res.send('pong');
});

/* Common Routes*/
router.use('/common', commonRouter);

/* Admin Routes*/
// router.use('/admin', adminRouter);

/* User Routes*/
// router.use('/users', userRouter);

export default router;
