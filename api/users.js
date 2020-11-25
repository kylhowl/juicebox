// api/users.js

const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');

const { getAllUsers, getUserByUsername, createUser, getUserById, updateUser, client } = require('../db');
const { requireUser } = require('./utils')

usersRouter.use((req, res, next) => {
  console.log("A request is being made to /users");

  next();
  
});

usersRouter.get('/', async (req, res) => {

    const users = await getAllUsers();

    res.send({
        users
    })
});

usersRouter.post('/login', async (req, res, next) => {

    const { username, password } = req.body;

    if (!username || !password) {
        next({ 
            name: 'MissingCredentialsError',
            message: 'Please supply both a username and password'
        });
    }

    try {
        const user = await getUserByUsername(username);

        if (user && user.password == password) {
            // create token and return to user
            const token = jwt.sign({ id: user.id, username: username }, process.env.JWT_SECRET);
            
           res.send({message : "You're logged in!", token : token});
        } else {
            next({
                name: 'IncorrectCredentialsError',
                message: "Username or password is incorrect"
            });
        }
    } catch(error) {
        console.log(error);
        next(error);
    }

});

usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;
  
    try {
      const _user = await getUserByUsername(username);
  
      if (_user) {
        next({
          name: 'UserExistsError',
          message: 'A user by that username already exists'
        });
      }
  
      const user = await createUser({
        username,
        password,
        name,
        location,
      });
  
      const token = jwt.sign({ 
        id: user.id, 
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });
  
      res.send({ 
        message: "thank you for signing up",
        token 
      });
    } catch ({ name, message }) {
      next({ name, message })
    } 
  });

  usersRouter.delete('/:userId', requireUser, async (req, res, next) => {

    const { userId } = req.params;
  
    try {
      const user = await getUserById(userId)
       if (!user) {
         next({
           name: 'UserDoesNotExist',
           message: 'No user exists with that ID.'
         });
       }
       if (req.user.id == userId) {
          const updatedUser = await updateUser( userId, { active : false } );
          res.send({ user : updatedUser });
      } else {
      next({
        name: 'UnauthorizedUser',
        message: 'You cannot delete an account that is not your own.'
      });
      } 
    } catch ({name, message}) {
      next({name, message})
      }
  });

  usersRouter.patch('/:userId', requireUser, async (req, res, next) => {

    const { userId } = req.params;

    try {
      const user = await getUserById(userId)
       if (!user) {
         next({
           name: 'UserDoesNotExist',
           message: 'No user exists with that ID.'
         });
       }
       if (req.user.id == userId) {
          const updatedUser = await updateUser( userId, { active : true } );
          res.send({ user : updatedUser });
      } else {
      next({
        name: 'UnauthorizedUser',
        message: 'You cannot activate an account that is not your own.'
      });
      } 
    } catch ({name, message}) {
      next({name, message})
      }
  });

module.exports = usersRouter;