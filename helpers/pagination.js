const baseUrl = process.env.BASE_URL;

const pagination = (sizeNum, pageNum, total, path, data) => {
  const size = parseInt(sizeNum) || 10;
  const page = parseInt(pageNum) || 1;
  const pagesTotal = Math.ceil(total / size);

  return {
    meta: {
      count: size,
      total: total
    },
    links: {
      first: `${baseUrl + path}size=${size}&page=1`,
      last: page > 1
        ? `${baseUrl + path}size=${size}&page=${pagesTotal}`
        : null,
      next: total > 0 && page !== pagesTotal
        ? `${baseUrl + path}size=${size}&page=${page + 1}`
        : null,
      prev: page > 1
        ? `${baseUrl + path}size=${size}&page=${page - 1}`
        : null
    },
    data: data
  }
}

module.exports = pagination;