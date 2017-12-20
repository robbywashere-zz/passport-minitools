
// onReceiveUser(user=>store.dispatch(loginUser(user)))
module.exports = function onReceiveUser(fn) {
  window.addEventListener('storage', e => {
    const user = JSON.parse(window.localStorage.getItem('__passport-user'));
    window.localStorage.removeItem('__passport-user');
    fn(user);
  });
}

