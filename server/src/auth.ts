import { NextFunction } from 'express';
import admin from './fb';

const getAuthToken = (req: any, res: any, next: NextFunction) => {
  if (req.headers.authorization?.split(' ')[0] === 'Bearer') {
    req.authToken = req.headers.authorization.split(' ')[1];
  } else {
    req.authToken = null;
  }
  next();
};

const authenticate = (req: any, res: any, next: NextFunction) => {
  
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req;
      const uid = (await admin.auth().verifyIdToken(authToken)).uid;
      req.user = await admin.auth().getUser(uid);
      return next();
    } catch (e) {
      console.log(e)
      return res
        .status(401)
        .send({ error: 'You are not authorized to make this request' });
    }
  });

};

export default authenticate;
