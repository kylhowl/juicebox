function requireUser(req, res, next) {
    if (!req.user) {
      next({
        name: "MissingUserError",
        message: "You must be logged in to perform this action"
      });
    }
  
    next();
  }

function requireActiveUser(req, res, next) {
  if (!req.user.active) {
    next({
      name: "InactiveUser",
      message: "User must be set to active to perform this action"
    })
  }
}
  
module.exports = {
    requireUser,
    requireActiveUser
  }