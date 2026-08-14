const express = require("express");
const { requireAuth } = require("../middleware/auth");
const documentsController = require("../controllers/documentsController");

const router = express.Router();
router.use(requireAuth);

router.get("/", documentsController.getAllDocuments);
router.get("/:id", documentsController.getDocumentById);
router.post("/", documentsController.createDocument);
router.put("/:id", documentsController.updateDocument);
router.delete("/:id", documentsController.deleteDocument);
router.post("/:id/finalize", documentsController.finalizeDocument);
router.post("/:id/duplicate", documentsController.duplicateDocument);

module.exports = router;

