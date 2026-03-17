const success = (res, data = null, message = 'Success', statusCode = 200, meta = {}) =>
  res.status(statusCode).json({ success: true, message, data, meta });

const error = (res, message = 'Error', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ success: false, message, errors });

const paginated = (res, data, total, page, limit) =>
  res.status(200).json({
    success: true,
    data,
    meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
  });

module.exports = { success, error, paginated };
