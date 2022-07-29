import {
  parseIds,
  parseFilters,
  parseSort,
  populate
} from './helpers/index.js';

const findRecords = async (Model, {
  ids,
  filters,
  sort,
  perPage,
  page,
  select,
  populate: _populate,
  max,
  bindWithToken
} = {}) => {

  const throwMaxError = () => {
    throw new Error([
      'USER_ERROR: The maximum number of records allowed in one request is ',
      `"${max}". Please set or reduce the "perPage" number of records.`
    ].join(''));
  };

  if (ids && filters) {
    throw new Error([
      'USER_ERROR: "ids" or "filters" may be used, not both. If more refined ',
      'filtering is needed along with IDs, move the IDs into "filters". ',
      'For example, ?filters={"$or":[{"_id":{"$in":["id1","id2"]}},{"prop1":"val1"}]}.'
    ].join(''));

  } else if (max && perPage > max) {
    throwMaxError();

  } else if (page && !perPage) {
    throw new Error('USER_ERROR: If "page" is given, then "perPage" is required.');
  }

  let where = {};

  // Find by IDs

  if (ids) {
    where._id = parseIds(ids);
  }

  // Find by filters

  else if (filters) {
    where = parseFilters(filters);
  }

  // Bind with token

  if (bindWithToken) {
    where[bindWithToken.recordKey] = bindWithToken.tokenValue;
  }

  // Total records

  const totalRecords = await Model.countDocuments(where);
  if (!perPage && max && totalRecords > max) throwMaxError();

  // Set options

  const options = {};

  // Sort

  if (typeof sort == 'string') {
    options.sort = parseSort(sort);
  }

  // Per page

  if (perPage) {
    options.limit = perPage;
  }

  // Page

  if (page) {
    options.skip = (page - 1) * perPage;
  }

  // Select

  if (select) {
    options.select = select.split(',').join(' ');
  }

  // Find

  let record, records;
  if (where._id && !where._id.$in) {
    record = await Model.findOne(where, null, options);
  } else {
    records = await Model.find(where, null, options);
    if (max && records.length > max) throwMaxError();
  }

  // Populate

  if (_populate) {
    await populate(record || records, _populate);
  }

  // Return

  return {
    totalRecords,
    totalPages: perPage ? Math.ceil(totalRecords / perPage) : null,
    record,
    records
  };

};

export default findRecords;