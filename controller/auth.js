const logIn = async (req, res) => {
  res.redirect(process.env.FRONTEND_URL);
};

const checkSession = async (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "unAutherized user" });
  }
};

const logOut = async (req, res) => {
  req.logOut((err) => {
    if (err) {
      res.status(500).json({ error: "logout failed" });
    }
    res.redirect(process.env.FRONTEND_URL);
  });
};

module.exports = { checkSession, logOut, logIn };
