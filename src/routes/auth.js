const express = require('express');
const passport = require('passport');
const boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const ApiKeysService = require('../services/apiKeys.js');
const UsersService = require('../services/users');
const { config } = require('../config');

// Basic strategy
require('../utils/auth/strategies/basic');

function authApi(app) {
  const router = express.Router();
  app.use('/api/auth', router);

  const apiKeysService = new ApiKeysService();
  const usersService = new UsersService();

  router.post('/sign-out' , async function(req, res, next) {
    const { parsedUser, parsedCart, parsedAddresses, parsedAlias } = req.body;
    if (!parsedUser) {
      next(boom.unauthorized('user is required to logout'));
    }
    parsedUser['shoppingCart'] = parsedCart;
    parsedUser['addresses'] = parsedAddresses;
    parsedUser['shippingAddress'] = parsedAlias;
    try {
      const updatedUser = await usersService.updateUserById(parsedUser.id, parsedUser)
      if (req.session.email) {
        res.header('Cache-Control', 'no-cache');
        req.session.destroy((err) => {
          console.log(err);
        })
        res.send('Logout exitoso')
      }
      return updatedUser;
    } catch(err) {
      return err;
    };
  })

  router.post('/sign-in', async function(req, res, next) {
    const { apiKeyToken } = req.body;
    if (!apiKeyToken) {
      next(boom.unauthorized('apiKeyToken is required'));
    }
    passport.authenticate('basic', function(error, user) {
      try {
        if (error || !user) {
          next(boom.unauthorized(user));
        }
        req.login(user, { session: false }, async function(error) {
          if (error) {
            next(error);
          }
          const apiKey = await apiKeysService.getApiKey({ token: apiKeyToken });
          if (!apiKey) {
            next(boom.unauthorized());
          }
          const { _id: id, email } = user;
          const payload = {
            sub: id,
            email,
            scopes: apiKey.scopes
          };
          const token = jwt.sign(payload, config.authJwtSecret, {
            expiresIn: '15m'
          });
          res.status(200).json({ token, user: { id, email } });
        });
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  });

  router.post('/sign-up', async function(req, res, next) {
    
    const { email, password } = req.body;
    const user = {}
    user['email'] = email;
    user['password'] = password;

    try {
      const createdUserId = await usersService.createUser(user);
      res.status(201).json({
        data: createdUserId,
        message: 'user created'
      });
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/sign-provider',
    async function(req, res, next) {
      const { body } = req;
      const { apiKeyToken, ...user } = body;
      if (!apiKeyToken) {
        next(boom.unauthorized('apiKeyToken is required'));
      }
      try {
        const queriedUser = await usersService.getOrCreateUser({ user });
        const apiKey = await apiKeysService.getApiKey({ token: apiKeyToken });
        if (!apiKey) {
          next(boom.unauthorized());
        }
        const { _id: id, email } = queriedUser;
        const payload = {
          sub: id,
          email,
          scopes: apiKey.scopes
        };
        const token = jwt.sign(payload, config.authJwtSecret, {
          expiresIn: '15m'
        });
        return res.status(201).json({ token, user: { id, email } });
      } catch (error) {
        next(error);
      }
    }
  );
}

module.exports = authApi;