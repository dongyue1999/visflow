import { Express, Response, Request, NextFunction } from 'express';
import { check  } from 'express-validator/check';
import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import passport from 'passport';
import User, { UserModel } from '../models/user';
import { IVerifyOptions } from 'passport-local';
import {MconnectMongo, isMongooseConnected} from '../mongo';
import { checkValidationResults } from '../common/util';
import Dataset from "@/models/dataset";
import path from "path";
import {DATA_PATH} from "@/config/env";
import fs from "fs-extra";
var DB_URI = '';

const userApi = (app: Express) => {
  app.post('/api/user/connect', (req: Request, res: Response) => {
    console.log('api-user-connecting...');
    const database_type=req.body.database_type;
    const uri=req.body.uri;
    DB_URI = req.body.uri;
    //console.log(DB_URI);
    MconnectMongo(uri);
    console.log('连接成功');

  });

  app.post('/api/user/*', isMongooseConnected);
  app.post('/api/user/signup', [
    check('username')
      .isLength({ min: 3 }).withMessage('用户名至少3个字符')
      .matches(/^[a-z0-9_]+$/).withMessage('username must consist of letters, digits, underscores')
      .matches(/^[a-z]/).withMessage('username must begin with letters')
      .custom(username => {
        return User.findOne({ username }).then(user => {
          if (user) {
            return Promise.reject('username already in use');
          }
        });
      }),
    check('password')
      .isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
    check('confirmPassword', 'passwords do not match')
      .custom((password, { req }) => password === req.body.password),
    check('email').isEmail().withMessage('invalid email address')
      .normalizeEmail()
      .custom(email => {
        return User.findOne({ email }).then(user => {
          if (user) {
            return Promise.reject('email already in use');
          }
        });
      }),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
    });
    // Password is hashed with mongoose middleware in models/user.ts.
    user.save((err: mongoose.Error) => {
      if (err) {
        return next(err);
      }
      req.login(user, (loginErr: Error) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({
          username: user.username,
          email: user.email,
        });
      });
    });
  });

  app.post('/api/user/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error, user: UserModel | undefined, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(500).send(info.message);
      }
      req.login(user, (loginErr: Error) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({
          username: user.username,
          email: user.email,
        });
      });
    })(req, res, next);
  });

  app.post('/api/user/logout', (req: Request, res: Response) => {
    req.logout();
    return res.end();
  });

  app.post('/api/user/whoami', (req: Request, res: Response) => {
    if (!req.user) {
      return res.json({ username: '', email: '' });
    }
    return res.json({
      username: req.user.username,
      email: req.user.email,
    });
  });

  app.post('/api/user/changePassword', [
    check('password').exists(),
    check('newPassword')
      .isLength({ min: 6 }).withMessage('new password must be at least 6 characters long'),
    check('confirmNewPassword', 'new passwords do not match')
      .custom((newPassword, { req }) => newPassword === req.body.newPassword),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    User.findOne({ username: req.user.username }).then(user => {
      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(401).send('incorrect password');
      }
      user.password = req.body.newPassword;
      // Resave the user object. Password is hashed with mongoose middleware in models/user.ts.
      user.save((err: mongoose.Error) => {
        if (err) {
          return next(err);
        }
        res.status(200).send();
      });
    });
  });
};

export default userApi;
