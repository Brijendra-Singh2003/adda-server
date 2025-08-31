export const login = async (req: any, res: any) => {
  res.redirect(process.env.FRONTEND_URL);
};

export const checkSession = async (req: any, res: any) => {
  
  console.log("req -",req.user);
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "unAutherized user" });
  }
};

export const logout = async (req: any, res: any) => {
  req.logOut((err: unknown) => {
    if (err) {
      res.status(500).json({ error: "logout failed" });
    }
    req.session.destroy((err: unknown) => {
      if (err) {
        res.status(500).json({ error: "fail to destroy session" });
      }
      res.redirect(process.env.FRONTEND_URL);
    });
  });
};

module.exports = { checkSession, logout, login };
