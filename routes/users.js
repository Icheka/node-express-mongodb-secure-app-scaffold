var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');

const UserController = require('../src/controllers/UserController');

const userController = new UserController();

const auth = require('../src/middleware/auth');
const admin = require('../src/middleware/isAdmin');

/* GET users listing. */
router.get('/', auth, admin, function (req, res, next) {
  res.send('respond with a resource');
});

/* DO KYC */
router.post('/kyc', auth, async (req, res) => {
  const r = await userController.doKyc(req.body);

  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(401).send({ message: r.message });
    case 2:
      return res.status(500).send({ message: r.message });

    default:
      break;
  }
});

/* VERIFY USER EMAIL */
router.get('/verify-email', async (req, res) => {
  if (!req.query.qr)
    return res.status(404).sendFile(path.join(process.cwd(), 'src', 'html_templates', 'VerifyEmailErrorTemplate.html'));

  const r = await userController.verifyEmailFromLink(req.query.qr);
  switch (r.code) {
    case 0:
      return res.sendFile(path.join(process.cwd(), 'src', 'html_templates', 'VerifyEmailSuccessTemplate.html'));
    case 1:
      return res.status(401).sendFile(path.join(process.cwd(), 'src', 'html_templates', 'VerifyEmailErrorTemplate.html'));
    case 2:
      return res.status(401).sendFile(path.join(process.cwd(), 'src', 'html_templates', 'VerifyEmailLinkAlreadyUsed.html'));
  }
});

/* CREATE NEW USER WITH GOOGLE OAUTH */
router.post('/google', async (req, res) => {
  const r = await userController.createUserWithGoogle(req.body);
  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(400).send({ message: r.message });
    case 2:
      return res.status(409).send({ message: r.message });
    case 3:
      return res.status(500).send({ message: r.message });
    case 4:
      return res.status(500).send({ message: r.message });
  }
});

/* CREATE NEW USER */
router.post('/', async (req, res) => {
  const r = await userController.createUser(req.body);
  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(400).send({ message: r.message });
    case 2:
      return res.status(409).send({ message: r.message });
    case 3:
      return res.status(500).send({ message: r.message });
    case 4:
      return res.status(500).send({ message: r.message });
  }
});

/* SIGN USER IN */
router.post('/login', async (req, res) => {
  const r = await userController.login(req.body, req, res);
  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(400).send({ message: r.message });
    case 2:
      return res.status(406).send({ message: r.message });
    case 3:
      return res.status(406).send({ message: r.message });
    case 4:
      return res.status(406).send({ message: r.message });
  }
});

/* SIGN USER IN WITH OAUTH */
router.post('/login/oauth', async (req, res) => {
  const r = await userController.loginWithOAuth(req.body.email, req, res);
  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(400).send({ message: r.message });
    case 2:
      return res.status(406).send({ message: r.message });
    case 3:
      return res.status(406).send({ message: r.message });
    case 4:
      return res.status(406).send({ message: r.message });
    case 5:
      return res.status(407).send({ message: r.message });
  }
});

/* UPDATE PROFILE PICTURE */
router.post('/update-image', auth, async (req, res) => {
  const user = {
    email: req.user.email,
    image: req.body.image || null
  };

  const r = await userController.updateProfilePicture(user);
  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(401).send({ message: r.message });
  }
});

/* GET MY DATA */
router.get('/me', auth, async (req, res) => {
  if (req.user.role !== 'user') {
    res.clearCookie('auth');
    res.status(401);
    res.end();
    return;
  }

  const r = await userController.getUserDataClean(req.user.id);
  // return res.status(401).end();

  return r == null ? res.status(501).send({ message: `A server error occurred` }) : res.send({ data: r });
});

/* LOGOUT */
router.get('/logout', async (req, res) => {
  console.log('Logout');
  res.clearCookie('auth');
  res.end();
});

/* CREATE DEPOSIT */
router.post('/deposit', auth, async (req, res) => {
  const r = await depositController.saveDeposit(req.user, req.body);

  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(406).send({ message: r.message });
    case 2:
      return res.status(409).send({ message: r.message });
    case 3:
      return res.status(500).send({ message: r.message });

    default:
      break;
  }
});
/* REQUEST WITHDRAWAL */
router.post('/withdrawal', auth, async (req, res) => {
  const r = await withdrawalController.saveWithdrawal(req.user, req.body);

  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(406).send({ message: r.message });
    case 2:
      return res.status(409).send({ message: r.message });
    case 3:
      return res.status(500).send({ message: r.message });

    default:
      break;
  }
});

/* GET DEPOSIT TRANSACT. REF */
router.get('/deposit/create-ref', auth, async (req, res) => {
  const r = await depositController.createRef();

  res.send({
    data: r
  });
});
/* GET WITHDRAWAL TRANSACT. REF */
router.get('/withdrawal/create-ref', auth, async (req, res) => {
  const r = await withdrawalController.createRef();

  res.send({
    data: r
  });
});


/* CHANGE PASSWORD */
router.post('/change-password', auth, admin, async (req, res) => {
  if (!req.body.old || !req.body.new) return res.status(406).send({ message: `\`old\` and \`new\` fields are required` });

  const r = await userController.changePassword(req.user.id, req.body.old, req.body.new);
  switch (r.code) {
    case 0:
      return res.send({ message: r.message });
    case 1:
      return res.status(500).send({ message: r.message });
    case 2:
      return res.status(406).send({ message: r.message });

    default:
      break;
  }
});


module.exports = router;
