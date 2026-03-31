const Joi = require("joi");
const { ORDER_STATUSES, PAYMENT_STATUSES, USER_ROLES } = require("../config/constants");
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

exports.analyticsQuerySchema = Joi.object({
  from: Joi.date(),
  to: Joi.date(),
});

exports.searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(200).required(),
  limit: Joi.number().integer().min(1).max(20).default(8),
});
