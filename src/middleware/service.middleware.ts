import { body } from "express-validator";

// Validation middleware for sections
export const validateServiceSection = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Section name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Section name must be between 3 and 100 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),

  body("icon")
    .optional()
];

// Validation middleware for services
export const validateService = [
  body("section")
    .notEmpty()
    .withMessage("Section ID is required")
    .isMongoId()
    .withMessage("Invalid section ID"),
  
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  
  body("content")
    .optional()
    .isLength({ min: 1 })
    .withMessage("Content cannot be empty if provided"),
  
  body("features")
    .optional()
    .customSanitizer((value) => {
      // If features is a string (JSON), parse it
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          // If parsing fails, return empty array
          return [];
        }
      }
      // If it's already an array or something else, return as is
      return Array.isArray(value) ? value : [];
    })
    .custom((value) => {
      // Validate the array
      if (!Array.isArray(value)) {
        throw new Error("Features must be an array");
      }
      
      if (value.some(feature => typeof feature !== 'string' || feature.length < 1 || feature.length > 500)) {
        throw new Error("Each feature must be a string between 1 and 500 characters");
      }
      
      return true;
    }),
  
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),
];

// Validation middleware for FAQ operations
export const validateServiceFaq = [
  body("question")
    .trim()
    .notEmpty()
    .withMessage("Question is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Question must be between 5 and 500 characters"),
  
  body("answer")
    .trim()
    .notEmpty()
    .withMessage("Answer is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Answer must be between 10 and 2000 characters"),
  
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),
];