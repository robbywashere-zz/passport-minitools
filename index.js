const passport = require('passport');
const { get } = require('lodash');

function demand(name) {
  throw new Error(`Missing oauth argument ${name}`);
}


function oauth({ 
  app = demand('app'), 
  login = demand('login'), 
  callback = demand('callback'), 
  clientID = demand('clientID'), 
  clientSecret = demand('clientSecret'), 
  session = true,
  mapUser = mapStaticUser,
  serializeUser= serializeAllOfUser,
  deserializeUser= deserializeAllOfUser,
  failureRedirect = '/',
  config = {},
  successRedirect = undefined,
  strategy = demand('strategy') }) {

  app.use(passport.initialize());

  if (session) app.use(passport.session());

  let strat = new strategy({
    clientID,
    clientSecret,
    ...config,
    callbackURL: callback,
  },
    mapUser
  )

  passport.use(strat);

  passport.serializeUser(serializeUser);

  passport.deserializeUser(deserializeUser);

  app.get(login,
    passport.authenticate(strat.name, {})
  );

  app.get(callback,
    passport.authenticate(strat.name, { failureRedirect, successRedirect }), passUser);
};

function mapStaticUser(accessToken, refreshToken, profile, done)  {
  //Could Create or Update User
  done(null, { accessToken, refreshToken, profile }) 
}


function mapWithThunk(fn){
  return (accessToken, refreshToken, profile, done) => fn({ accessToken, refreshToken, profile }, done)
}

/* Example usage
mapWithThunk(async (userObj, done) => {
  let user = await Models.User.findById(userObj.id);
  try {
    if (!user) {
      await Models.User.new(userObj);
      done(null,userObj)
    } else {
      await Models.User.update({id: userObj.id }, userObj)
    }
  } catch(e) {
    done(e);
  }
})
*/

function passUser(req, res){
  res.send(`
    <script>
      localStorage.setItem('__passport-user', ${JSON.stringify(JSON.stringify(req.user))});
      self.close();
    </script>
    `)
}

// serializeUserBy('id');
function serializeUserBy(path) { 
  return (user, done) => {
    done(null, get(user,path))
  }
}

function deserializeAllOfUser(user, done){
  done(null, user);
}

function serializeAllOfUser(user, done) {
  done(null, user);
}

// deserializeUserBy(Models.User.findById);
function deserializeUserWith(findBy, path) {
  // if user is stored as { user: { id: 99, name: 'Foo' }}
  // path = 'id' will get(u,'id'), thereby passing 99 to findById
  return async (u, done) => {  
    try {
      const user = await findBy((path) ? get(u,path) : u);
      done(null, user)
    } catch(e) {
      done(e);
    }
  }
}

module.exports = { 
  deserializeUserWith,  
  deserializeAllOfUser,
  serializeAllOfUser,
  serializeUserBy,
  passUser,
  mapStaticUser,
  mapWithThunk,
  oauth,
}
