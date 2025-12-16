import { Router } from "express";
import * as ServiceController from "@/controllers/service.controller";
import {
  validateAdminAccess,
  validateSuperAdminAccess,
} from "@/middleware/auth.middleware";
import { upload } from "@/utils/cloudinary.utils";
import { validateService, validateServiceSection, validateServiceFaq } from "@/middleware/service.middleware";

const serviceRouter = Router();

// Section Routes (Admin Only)
serviceRouter.post(
  "/sections",
  validateAdminAccess,
  validateServiceSection,
  ServiceController.createSection
);

serviceRouter.get("/sections", ServiceController.getSections);

serviceRouter.put(
  "/sections/:id",
  validateAdminAccess,
  validateServiceSection,
  ServiceController.updateSection
);

serviceRouter.delete(
  "/sections/:id",
  validateSuperAdminAccess,
  ServiceController.deleteSection
);

// Service Routes
serviceRouter.post(
  "/",
  validateAdminAccess,
  validateService,
  ServiceController.createService
);

serviceRouter.get("/", ServiceController.getServices);

serviceRouter.get("/slug/:slug", ServiceController.getServiceBySlug);

serviceRouter.put(
  "/:id",
  validateAdminAccess,
  validateService,
  ServiceController.updateService
);

// Admin only routes
serviceRouter.get("/admin/all", validateAdminAccess, ServiceController.getAllServicesForAdmin);
serviceRouter.get("/admin/:id", validateAdminAccess, ServiceController.getServiceByIdForAdmin);
serviceRouter.get("/stats", validateAdminAccess, ServiceController.getServiceStats);
serviceRouter.patch("/:id/toggle-status", validateAdminAccess, ServiceController.toggleServiceStatus);

// Super Admin only routes
serviceRouter.delete(
  "/:id",
  validateSuperAdminAccess,
  ServiceController.deleteService
);

// FAQ Routes (Admin Only)
serviceRouter.post(
  "/:id/faqs",
  validateAdminAccess,
  validateServiceFaq,
  ServiceController.addServiceFaq
);

serviceRouter.get(
  "/:id/faqs",
  ServiceController.getServiceFaqs
);

serviceRouter.put(
  "/:id/faqs/:faqId",
  validateAdminAccess,
  validateServiceFaq,
  ServiceController.updateServiceFaq
);

serviceRouter.delete(
  "/:id/faqs/:faqId",
  validateAdminAccess,
  ServiceController.deleteServiceFaq
);

export default serviceRouter;
