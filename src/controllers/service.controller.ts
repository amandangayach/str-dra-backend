import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Service, ServiceSection, EServiceStatus, EServiceSectionStatus } from "@/models/service.model";
import { cloudinaryUtils } from "@/utils/cloudinary.utils";
import { v2 as cloudinary } from 'cloudinary';

// Section Controllers

// Create section
export const createSection = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, description, order } = req.body;

      // Generate slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-");

      // Check if slug exists
      const existingSection = await ServiceSection.findOne({ slug });
      if (existingSection) {
        return res.status(400).json({
          success: false,
          message: "A section with this name already exists",
        });
      }

      const section = new ServiceSection({
        name,
        description,
        slug,
        order: order || 0,
      });

      await section.save();

      res.status(201).json({
        success: true,
        message: "Section created successfully",
        data: section,
      });
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({
        success: false,
        message: "Error creating section",
      });
    }
  }

// Get all sections
export const getSections = async (req: Request, res: Response) => {
  try {
    const sections = await ServiceSection.find()
      .sort("order")
      .select("-__v");

    res.status(200).json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sections",
    });
  }
};

// Update section
export const updateSection = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, order, status } = req.body;

      const section = await ServiceSection.findById(id);
      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      // If name is changing, check slug uniqueness
      if (name && name !== section.name) {
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, "-");

        const existingSection = await ServiceSection.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });

        if (existingSection) {
          return res.status(400).json({
            success: false,
            message: "A section with this name already exists",
          });
        }

        section.slug = newSlug;
      }

      // Update fields
      section.name = name || section.name;
      section.description = description || section.description;
      section.order = order ?? section.order;
      section.status = status || section.status;

      await section.save();

      res.status(200).json({
        success: true,
        message: "Section updated successfully",
        data: section,
      });
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({
        success: false,
        message: "Error updating section",
      });
    }
  }

// Delete section
export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if section has any services
    const servicesCount = await Service.countDocuments({ section: id });
      if (servicesCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete section with existing services",
        });
      }

      const section = await ServiceSection.findByIdAndDelete(id);
      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Section deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting section",
      });
    }
  }

// Service Controllers

// Create service
export const createService = async (req: Request, res: Response) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        section,
        title,
        subtitle,
        description,
        content,
        features,
        experts,
        process,
        promises,
        cta,
        order,
      } = req.body;

      // Check if section exists
      const existingSection = await ServiceSection.findById(section);
      if (!existingSection) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      // Generate slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-");

      // Check if slug exists
      const existingService = await Service.findOne({ slug });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: "A service with this title already exists",
        });
      }

      // Handle content upload to Cloudinary
      let contentUrl: string | undefined;
      if (content) {
        if (content.startsWith('http')) {
          contentUrl = content;
        } else {
          const publicId = `content/services/${slug}-content.md`;
          try {
            const uploadResult = await cloudinary.uploader.upload(`data:text/markdown;base64,${Buffer.from(content).toString('base64')}`, {
              resource_type: 'raw',
              public_id: publicId,
              folder: 'ping-assignments/content/services',
            });
            contentUrl = uploadResult.secure_url;
          } catch (error) {
            console.error('Error uploading content to Cloudinary:', error);
            return res.status(500).json({
              success: false,
              message: "Error uploading content",
            });
          }
        }
      }

      const service = new Service({
        section,
        title,
        subtitle,
        description,
        slug,
        contentUrl,
        features,
        experts,
        process,
        promises,
        cta,
        order: order || 0,
      });

      await service.save();

      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      });
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({
        success: false,
        message: "Error creating service",
      });
    }
  }

// Get all services with filters
export const getServices = async (req: Request, res: Response) => {
    try {
      const { sectionId, status, search } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : undefined;

      const query: any = {};

      // Status filter (for admins, show all. for others, show only live)
      const user = (req as any).user;
      if (user?.role === "Admin" || user?.role === "Super_Admin") {
        // Admins can see all statuses
        if (status) query.status = status;
      } else {
        // Public users only see live services
        query.status = EServiceStatus.LIVE;
      }

      if (sectionId) query.section = sectionId;

      // Search in title, subtitle, or description
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { subtitle: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      let servicesQuery = Service.find(query)
        .populate("section", "name slug")
        .sort("order");

      // Only apply pagination if limit is specified
      if (limit) {
        servicesQuery = servicesQuery
          .skip((page - 1) * limit)
          .limit(limit);
      }

      const services = await servicesQuery;
      const total = await Service.countDocuments(query);

      // Build response based on whether pagination was requested
      const responseData: any = {
        services,
      };

      if (limit) {
        responseData.pagination = {
          current: page,
          total: Math.ceil(total / limit),
          totalItems: total,
        };
      } else {
        responseData.totalItems = total;
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching services",
      });
    }
  }

// Get service by slug
export const getServiceBySlug = async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const service = await Service.findOne({ slug })
        .populate("section", "name slug");

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // Only return service if it's live
      if (service.status !== EServiceStatus.LIVE) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching service",
      });
    }
  }

// Update service
export const updateService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        section,
        title,
        subtitle,
        description,
        content,
        features,
        experts,
        process,
        promises,
        cta,
        order,
        status,
      } = req.body;

      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // If section is changing, validate it exists
      if (section && section !== service.section.toString()) {
        const existingSection = await ServiceSection.findById(section);
        if (!existingSection) {
          return res.status(404).json({
            success: false,
            message: "Section not found",
          });
        }
      }

      // If title is changing, update slug
      if (title && title !== service.title) {
        const newSlug = title
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, "-");

        const existingService = await Service.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });

        if (existingService) {
          return res.status(400).json({
            success: false,
            message: "A service with this title already exists",
          });
        }

        service.slug = newSlug;
      }

      // Process content - either upload new content or keep existing URL
      let contentUrl = content;

      // If content has changed and is not a URL (actual markdown content)
      if (content !== undefined && content !== service.contentUrl && !content.startsWith('http')) {
        // Upload new markdown content to Cloudinary
        const publicId = `content/services/${service.slug}-content.md`;
        try {
          const uploadResult = await cloudinary.uploader.upload(`data:text/markdown;base64,${Buffer.from(content).toString('base64')}`, {
            resource_type: 'raw',
            public_id: publicId,
            folder: 'ping-assignments/content/services',
          });
          contentUrl = uploadResult.secure_url;

          // Delete old content if it exists and is a URL
          if (service.contentUrl && service.contentUrl.startsWith('http')) {
            const oldPublicId = cloudinaryUtils.getPublicIdFromUrl(service.contentUrl);
            await cloudinaryUtils.deleteFile(oldPublicId, "raw");
          }
        } catch (error) {
          console.error('Error uploading content to Cloudinary:', error);
          return res.status(500).json({
            success: false,
            message: "Error uploading content",
          });
        }
      }

      // Update contentUrl if it changed
      if (contentUrl !== undefined) {
        service.contentUrl = contentUrl;
      }

      // Update fields
      service.section = section || service.section;
      service.title = title || service.title;
      service.subtitle = subtitle || service.subtitle;
      service.description = description || service.description;
      service.features = features || service.features;
      service.experts = experts !== undefined ? experts : service.experts;
      service.process = process !== undefined ? process : service.process;
      service.promises = promises !== undefined ? promises : service.promises;
      service.cta = cta !== undefined ? cta : service.cta;
      service.order = order ?? service.order;
      service.status = status || service.status;

      await service.save();

      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: service,
      });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({
        success: false,
        message: "Error updating service",
      });
    }
  }

// Delete service
export const deleteService = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // Delete content from Cloudinary if exists
      if (service.contentUrl) {
        const publicId = cloudinaryUtils.getPublicIdFromUrl(service.contentUrl);
        await cloudinaryUtils.deleteFile(publicId, "raw");
      }

      await service.deleteOne();

      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting service",
      });
    }
  }

// Admin-specific functions

// Get service by ID for admin (can fetch any status)
export const getServiceByIdForAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate("section", "name slug");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error fetching service by ID for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching service",
    });
  }
};

// Get all services for admin (no status filtering)
export const getAllServicesForAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sectionId = req.query.sectionId as string;
    const search = req.query.search as string;

    // Build query - no status filtering for admins
    const query: any = {};
    if (sectionId) query.section = sectionId;

    // Search in title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const services = await Service.find(query)
      .populate("section", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total count for pagination
    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          totalItems: total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching all services for admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching services",
    });
  }
};

// Toggle service status between Draft and Live (Admin only)
export const toggleServiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First, find the service to check its current status
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Only allow toggling between Draft and Live, not other statuses
    if (service.status === EServiceStatus.INACTIVE || service.status === EServiceStatus.COMING_SOON) {
      return res.status(400).json({
        success: false,
        message: "Cannot toggle status of inactive or coming soon service",
      });
    }

    // Toggle between Draft and Live
    const newStatus = service.status === EServiceStatus.LIVE
      ? EServiceStatus.DRAFT
      : EServiceStatus.LIVE;

    // Use findByIdAndUpdate to avoid validation issues
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { status: newStatus },
      {
        new: true,
        runValidators: false, // Skip validation since we're only updating status
        select: '_id status' // Only select the fields we need
      }
    );

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service status toggled successfully",
      data: {
        _id: updatedService._id,
        status: updatedService.status,
      },
    });
  } catch (error) {
    console.error("Error toggling service status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling service status",
    });
  }
};


// Get service stats (Admin only)
export const getServiceStats = async (req: Request, res: Response) => {
  try {
    const stats = await Service.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const sectionStats = await Service.aggregate([
      {
        $lookup: {
          from: "servicesections",
          localField: "section",
          foreignField: "_id",
          as: "sectionInfo"
        }
      },
      {
        $unwind: "$sectionInfo"
      },
      {
        $group: {
          _id: "$sectionInfo.name",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusStats: stats,
        popularSections: sectionStats,
      },
    });
  } catch (error) {
    console.error("Error getting service stats:", error);
    res.status(500).json({
      success: false,
      message: "Error getting service stats",
    });
  }
};



// FAQ CRUD Operations

// Add FAQ to service
export const addServiceFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer, order } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const newFaq = {
      question,
      answer,
      order: order || 0,
    };

    if (!service.faqs) {
      service.faqs = [];
    }

    service.faqs.push(newFaq);
    await service.save();

    res.status(201).json({
      success: true,
      message: "FAQ added successfully",
      data: service.faqs[service.faqs.length - 1],
    });
  } catch (error) {
    console.error("Error adding FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Error adding FAQ",
    });
  }
};

// Update FAQ in service
export const updateServiceFaq = async (req: Request, res: Response) => {
  try {
    const { id, faqId } = req.params;
    const { question, answer, order } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const faqIndex = service.faqs?.findIndex((faq: any) => faq._id?.toString() === faqId);
    if (faqIndex === undefined || faqIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    if (service.faqs) {
      service.faqs[faqIndex].question = question || service.faqs[faqIndex].question;
      service.faqs[faqIndex].answer = answer || service.faqs[faqIndex].answer;
      service.faqs[faqIndex].order = order ?? service.faqs[faqIndex].order;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: service.faqs?.[faqIndex],
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Error updating FAQ",
    });
  }
};

// Delete FAQ from service
export const deleteServiceFaq = async (req: Request, res: Response) => {
  try {
    const { id, faqId } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (!service.faqs) {
      return res.status(404).json({
        success: false,
        message: "No FAQs found for this service",
      });
    }

    const faqIndex = service.faqs.findIndex((faq: any) => faq._id?.toString() === faqId);
    if (faqIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    service.faqs.splice(faqIndex, 1);
    await service.save();

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting FAQ",
    });
  }
};

// Get all FAQs for a service
export const getServiceFaqs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id).select('faqs');
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.status(200).json({
      success: true,
      data: service.faqs || [],
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching FAQs",
    });
  }
};
