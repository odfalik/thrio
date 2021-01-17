import { NextFunction, Request, Response } from 'express';
import admin from './fb';

const getAuthToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
    res.locals.authToken = req.headers.authorization.split(' ')[1];
  } else {
    res.locals.authToken = null;
  }
  next();
};

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  getAuthToken(req, res, async () => {
    try {
      const uid = (await admin.auth().verifyIdToken(res.locals.authToken)).uid;
      res.locals.user = await admin.auth().getUser(uid);
      return next();
    } catch (e) {
      console.log(e);
      return res
        .status(401)
        .send({ error: 'You are not authorized to make this request' });
    }
  });
};

export default authenticate;
