import { Router } from "express";
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import * as ctrl from "./subscriptions.controller.js";

const RECEIPTS_DIR = path.join(process.cwd(), "uploads", "receipts");

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(RECEIPTS_DIR, { recursive: true })
      .then(() => cb(null, RECEIPTS_DIR))
      .catch((err) => cb(err as Error, ""));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : ".png";
    cb(null, `receipt-${Date.now()}${safeExt}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

const router = Router();

router.use(authMiddleware);

router.get("/plans", ctrl.getPlans);
router.get("/my-status", ctrl.getMySubscription);
router.post("/submit-payment", receiptUpload.single("receipt"), ctrl.submitPayment);
router.get("/payment-status", ctrl.getPaymentStatus);

router.get("/admin/payments", requireRole("super_admin"), ctrl.getAllPayments);
router.patch("/admin/payments/:id/approve", requireRole("super_admin"), ctrl.approvePayment);
router.patch("/admin/payments/:id/reject", requireRole("super_admin"), ctrl.rejectPayment);

export const subscriptionRoutes = router;
