const router = require("express").Router();
const {
  validate,
  complete,
  resend,
  revoke,
} = require("../controllers/invitationController");

router.get("/:token", validate);
router.post("/complete", complete);
router.post("/resend", resend);
router.post("/revoke", revoke);

module.exports = router;
