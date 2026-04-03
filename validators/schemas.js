const Joi = require("joi");
const { ORDER_STATUSES, PAYMENT_STATUSES, USER_ROLES, STITCHING_STYLES } = require("../config/constants");
const { DEFAULT_EMAIL_TEMPLATES } = require("../services/emailTemplateDefaults");
const { PERMISSION_MODULES } = require("../config/permissions");
const {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} = require("../config/constants");

const objectId = Joi.string().hex().length(24);

exports.registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid(...USER_ROLES),
});

exports.loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

exports.refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

exports.logoutSchema = Joi.object({
  refreshToken: Joi.string().allow("", null),
});

exports.customerCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  phone: Joi.string().trim().min(1).max(40).required(),
  email: Joi.alternatives()
    .try(Joi.string().trim().valid(""), Joi.string().trim().email().max(200))
    .optional(),
  address: Joi.string().trim().allow("").max(500),
  notes: Joi.string().trim().allow("").max(2000),
});

exports.customerUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  phone: Joi.string().trim().min(1).max(40),
  email: Joi.alternatives()
    .try(Joi.string().trim().valid(""), Joi.string().trim().email().max(200))
    .optional(),
  address: Joi.string().trim().allow("").max(500),
  notes: Joi.string().trim().allow("").max(2000),
}).min(1);

exports.customerListQuerySchema = Joi.object({
  q: Joi.string().trim().allow("").max(200),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  sort: Joi.string().valid("createdAt", "name").default("createdAt"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

exports.customerIdParams = Joi.object({
  id: objectId.required(),
});

exports.customerNoteCreateSchema = Joi.object({
  customerId: objectId.required(),
  subject: Joi.string().trim().min(1).max(200).required(),
  note: Joi.string().trim().min(1).max(5000).required(),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  pinned: Joi.boolean().default(false),
});

exports.customerNoteUpdateSchema = Joi.object({
  subject: Joi.string().trim().min(1).max(200),
  note: Joi.string().trim().min(1).max(5000),
  priority: Joi.string().valid("low", "medium", "high"),
  pinned: Joi.boolean(),
}).min(1);

exports.customerNoteListQuerySchema = Joi.object({
  customerId: objectId.required(),
  pinned: Joi.boolean(),
  sort: Joi.string().valid("createdAt", "priority").default("createdAt"),
  order: Joi.string().valid("asc", "desc").default("desc"),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

exports.noteIdParams = Joi.object({
  id: objectId.required(),
});

exports.measurementCreateSchema = Joi.object({
  customerId: objectId.required(),
  label: Joi.string().trim().allow("").max(200),
  values: Joi.object().default({}),
});

exports.measurementUpdateSchema = Joi.object({
  label: Joi.string().trim().allow("").max(200),
  values: Joi.object(),
}).min(1);

exports.measurementListQuerySchema = Joi.object({
  customerId: objectId,
  q: Joi.string().trim().allow("").max(200),
  from: Joi.date(),
  to: Joi.date(),
  createdFrom: Joi.date(),
  createdTo: Joi.date(),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

exports.measurementIdParams = Joi.object({
  id: objectId.required(),
});

exports.orderItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  cost: Joi.number().min(0).required(),
});

exports.orderCreateSchema = Joi.object({
  customerId: objectId.required(),
  status: Joi.string().valid(...ORDER_STATUSES),
  items: Joi.array().items(exports.orderItemSchema).default([]),
  price: Joi.number().min(0).default(0),
  stitchingTypeId: objectId,
  stitchingStyle: Joi.string().valid(...STITCHING_STYLES),
  advance: Joi.number().min(0).default(0),
  deliveryDate: Joi.alternatives().try(Joi.date(), Joi.allow(null)),
  notes: Joi.string().allow("").max(2000),
});

exports.orderUpdateSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES),
  paymentStatus: Joi.string().valid(...PAYMENT_STATUSES),
  items: Joi.array().items(exports.orderItemSchema),
  price: Joi.number().min(0),
  deliveryDate: Joi.alternatives().try(Joi.date(), Joi.allow(null)),
  notes: Joi.string().allow("").max(2000),
}).min(1);

exports.orderPaymentSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
});

exports.orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...ORDER_STATUSES)
    .required(),
});

exports.orderListQuerySchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES),
  customerId: objectId,
  from: Joi.date(),
  to: Joi.date(),
  dateField: Joi.string().valid("createdAt", "deliveryDate").default("createdAt"),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

exports.orderIdParams = Joi.object({
  id: objectId.required(),
});

exports.stitchingTypeListQuerySchema = Joi.object({
  q: Joi.string().trim().allow("").max(200),
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
}).default();

exports.stitchingTypeCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  singlePrice: Joi.number().min(0).required(),
  doublePrice: Joi.number().min(0).required(),
  notes: Joi.string().trim().allow("").max(500),
  isActive: Joi.boolean(),
});

exports.stitchingTypeUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150),
  singlePrice: Joi.number().min(0),
  doublePrice: Joi.number().min(0),
  notes: Joi.string().trim().allow("").max(500),
  isActive: Joi.boolean(),
}).min(1);

exports.stitchingTypeIdParams = Joi.object({
  id: objectId.required(),
});

exports.analyticsQuerySchema = Joi.object({
  from: Joi.date(),
  to: Joi.date(),
});

exports.searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(200).required(),
  limit: Joi.number().integer().min(1).max(20).default(8),
});

const allowedTemplateKeys = DEFAULT_EMAIL_TEMPLATES.map((t) => t.key);
const placeholderToken = /^\{\{[a-zA-Z0-9_]+\}\}$/;

exports.emailTemplateKeyParams = Joi.object({
  key: Joi.string()
    .trim()
    .valid(...allowedTemplateKeys)
    .required(),
});

exports.emailTemplateUpdateSchema = Joi.object({
  templateName: Joi.string().trim().min(1).max(200),
  templateType: Joi.string().trim().min(1).max(120),
  placeholders: Joi.array().items(Joi.string().trim().pattern(placeholderToken)).max(200),
  enabled: Joi.boolean(),
  subject: Joi.string().trim().min(1).max(500),
  body: Joi.string().min(1),
}).min(1);

const rolePermissionSchema = Joi.object({
  show: Joi.boolean().default(false),
  create: Joi.boolean().default(false),
  delete: Joi.boolean().default(false),
  manage: Joi.boolean().default(false),
});

const permissionsShape = PERMISSION_MODULES.reduce((acc, moduleName) => {
  acc[moduleName] = rolePermissionSchema;
  return acc;
}, {});

exports.roleCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  permissions: Joi.object(permissionsShape).required(),
});

exports.roleUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120),
  permissions: Joi.object(permissionsShape),
}).min(1);

exports.expenseCategoryCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  isActive: Joi.boolean().default(true),
});

exports.expenseCategoryUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150),
  isActive: Joi.boolean(),
}).min(1);

exports.expenseCategoryListQuerySchema = Joi.object({
  q: Joi.string().trim().allow("").max(200),
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  sort: Joi.string().valid("name", "createdAt").default("createdAt"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

exports.expenseSubcategoryCreateSchema = Joi.object({
  categoryId: objectId.required(),
  name: Joi.string().trim().min(1).max(150).required(),
  isActive: Joi.boolean().default(true),
});

exports.expenseSubcategoryUpdateSchema = Joi.object({
  categoryId: objectId,
  name: Joi.string().trim().min(1).max(150),
  isActive: Joi.boolean(),
}).min(1);

exports.expenseSubcategoryListQuerySchema = Joi.object({
  q: Joi.string().trim().allow("").max(200),
  categoryId: objectId,
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  sort: Joi.string().valid("name", "createdAt").default("createdAt"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

exports.expenseCreateSchema = Joi.object({
  date: Joi.date().required(),
  categoryId: objectId.required(),
  subcategoryId: objectId.required(),
  title: Joi.string().trim().min(1).max(200).required(),
  amount: Joi.number().min(0).required(),
  receipt: Joi.object({
    url: Joi.string().uri().allow(""),
    publicId: Joi.string().allow(""),
    originalName: Joi.string().allow(""),
  }).default({}),
  notes: Joi.string().trim().allow("").max(2000),
});

exports.expenseUpdateSchema = Joi.object({
  date: Joi.date(),
  categoryId: objectId,
  subcategoryId: objectId,
  title: Joi.string().trim().min(1).max(200),
  amount: Joi.number().min(0),
  receipt: Joi.object({
    url: Joi.string().uri().allow(""),
    publicId: Joi.string().allow(""),
    originalName: Joi.string().allow(""),
  }),
  notes: Joi.string().trim().allow("").max(2000),
}).min(1);

exports.expenseListQuerySchema = Joi.object({
  q: Joi.string().trim().allow("").max(200),
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  amountMin: Joi.number().min(0),
  amountMax: Joi.number().min(0),
  categoryId: objectId,
  subcategoryId: objectId,
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  sort: Joi.string().valid("date", "amount", "createdAt").default("date"),
  order: Joi.string().valid("asc", "desc").default("desc"),
});

exports.expenseReceiptUploadSchema = Joi.object({
  fileData: Joi.string().required(),
  originalName: Joi.string().trim().allow("").max(255),
});
