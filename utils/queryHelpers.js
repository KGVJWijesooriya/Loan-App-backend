/**
 * Get pagination parameters from query
 * @param {object} query
 * @returns {object}
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Create pagination response
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {object}
 */
const createPaginationResponse = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};

/**
 * Build search query from request
 * @param {object} query
 * @param {array} searchFields
 * @returns {object}
 */
const buildSearchQuery = (query, searchFields = []) => {
  const searchQuery = {};

  // Text search
  if (query.search && searchFields.length > 0) {
    searchQuery.$or = searchFields.map((field) => ({
      [field]: { $regex: query.search, $options: "i" },
    }));
  }

  // Status filter
  if (query.status) {
    searchQuery.status = query.status;
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    searchQuery.createdAt = {};
    if (query.startDate) {
      searchQuery.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      searchQuery.createdAt.$lte = new Date(query.endDate);
    }
  }

  return searchQuery;
};

/**
 * Build sort query from request
 * @param {object} query
 * @param {string} defaultSort
 * @returns {object}
 */
const buildSortQuery = (query, defaultSort = "-createdAt") => {
  const sortBy = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return { [sortBy.replace("-", "")]: sortBy.startsWith("-") ? -1 : sortOrder };
};

module.exports = {
  getPagination,
  createPaginationResponse,
  buildSearchQuery,
  buildSortQuery,
};
