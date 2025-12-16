import { ObjectId, Document } from "mongodb";
import { model, Schema } from "mongoose";

export interface IServiceSection extends Document {
  _id: ObjectId;
  name: string;
  description?: string;
  slug: string;
  order: number;
  status: EServiceSectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum EServiceSectionStatus {
  DRAFT = "Draft",
  LIVE = "Live",
  INACTIVE = "Inactive"
}

const ServiceSectionSchema = new Schema<IServiceSection>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: EServiceSectionStatus,
    default: EServiceSectionStatus.DRAFT,
  },
}, {
  timestamps: true,
})

// Create indexes
ServiceSectionSchema.index({ slug: 1 });
ServiceSectionSchema.index({ order: 1 });

export interface IService extends Document {
  _id: ObjectId;
  section: ObjectId;
  title: string;
  subtitle?: string;
  description: string;
  slug: string;
  contentUrl: string; // Cloudinary URL
  order: number;
  status: EServiceStatus;
  features?: string[];
  experts?: {
    name: string;
    role: string;
    stars: number;
    reviews: number;
    content: string;
    link: string;
  }[];
  process?: {
    title: string;
    subtitle: string;
    child1: {
      title: string;
      content: string;
    };
    child2: {
      title: string;
      content: string;
    };
    child3: {
      title: string;
      content: string;
    };
  };
  promises?: {
    title: string;
    subtitle?: string;
    items: {
      title: string;
      content: string;
    }[];
  };
  cta?: {
    title: string;
    subtitle?: string;
    buttonText: string;
    buttonLink: string;
  };
  faqs?: {
    question: string;
    answer: string;
    order?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export enum EServiceStatus {
  DRAFT = "Draft",
  LIVE = "Live",
  INACTIVE = "Inactive",
  COMING_SOON = "Coming_Soon"
}

const ServiceSchema = new Schema<IService>({
  section: {
    type: Schema.Types.ObjectId,
    ref: "ServiceSection",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  contentUrl: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: EServiceStatus,
    default: EServiceStatus.DRAFT,
  },
  features: [{
    type: String,
  }],
  experts: [{
    name: {
      type: String,
    },
    role: {
      type: String,
    },
    stars: {
      type: Number,
    },
    reviews: {
      type: Number,
    },
    content: {
      type: String,
    },
    link: {
      type: String,
    },
  }],
  process: {
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    child1: {
      title: {
        type: String,
      },
      content: {
        type: String,
      },
    },
    child2: {
      title: {
        type: String,
      },
      content: {
        type: String,
      },
    },
    child3: {
      title: {
        type: String,
      },
      content: {
        type: String,
      },
    },
  },
  promises: {
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    items: [{
      title: {
        type: String,
      },
      content: {
        type: String,
      },
    }],
  },
  cta: {
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    buttonText: {
      type: String,
    },
    buttonLink: {
      type: String,
    },
  },
  faqs: [{
    question: {
      type: String,
    },
    answer: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
}, {
  timestamps: true,
})


export const ServiceSection = model<IServiceSection>("ServiceSection", ServiceSectionSchema);
export const Service = model<IService>("Service", ServiceSchema);
