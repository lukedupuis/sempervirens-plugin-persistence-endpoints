import {
  parseIds,
  parseFilters,
  parseSort,
  populate
} from './helpers/index.js';

const updateRecords = async (Model, body, {
  ids,
  filters,
  sort,
  populate: _populate,
  max,
  bindWithToken
} = {}) => {
  if (Object.keys(body || {}).length == 0) {
    throw new Error('USER_ERROR: "body" is required.');

  } else if (ids && filters) {
    throw new Error([
      'USER_ERROR: "ids" or "filters" may be used, not both. If more refined ',
      'filtering is needed along with IDs, move the IDs into "filters". ',
      'For example, ?filters={"$or":[{"_id":{"$in":["id1","id2"]}},{"prop1":"val1"}]}.'
    ].join(''));

  } else if (Array.isArray(body) && (ids || filters)) {
    throw new Error([
      'USER_ERROR: To update multiple records separately, omit "ids" and "filters" ',
      'and send the IDs on each object in the "body" array. Otherwise, to update ',
      'multiple objects with the same body, send the body as one object literal.'
    ].join(''));

  } else if (!ids && !filters) {
    if (Array.isArray(body)) {
      ids = body.map(body => {
        const id = body._id || body.id;
        if (!id) {
          throw new Error([
            'USER_ERROR: If "body" is an array, then "_id" or "id" must be exist ',
            'on each object.'
          ].join(''));
        }
        return id;
      });

    } else if (!body._id && !body.id) {
      throw new Error([
        'USER_ERROR: If "ids" and "filters" are not given, then "_id" or "id" must ',
        'exist on the "body" object(s).'
      ].join(''));
    }
  }

  const throwMaxError = () => {
    throw new Error([
      'USER_ERROR: The maximum number of records allowed in ',
      `one request is ${max}.`
    ].join(''));
  };



  // Update 1 record with 1 body
  // - Send /{id} and body as object literal
  // - Send ?filters= and body as object literal
  // - Send body as object literal with body._id or body.id
  // Update multiple records with 1 body
  // - Send /{ids} and body as object literal
  // - Send ?filters= and body as object literal
  // - Send body with various "_id" or "id" and all the same property values
  // Update multiple records with multiple different body properties and/or values
  // - Send no ids and no filters; only send body as an array of objects



  // if multiple bodies and ids or filters, error - send bodies with IDs

  // [x] if 1 id and 1 body, update 1 record
  // [x] if multiple ids and 1 body, update all records with same body

  // [x] if filter match(es) and 1 body, update all records with same body

  // [x] if 1 body with id on body, update 1 record
  // [x] if multiple bodies with ids on bodies, separate ids from bodies and update all



  // Set options

  const options = {};

  // Sort

  if (sort) {
    options.sort = parseSort(sort);
  }

  // Update

  let record, records;
  let updatedCount = 0;

  const update = async (record, body) => {
    if (record) {
      Object.keys(body).forEach(key => {
        if (key == '_id' || key == 'id') return;
        record[key] = body[key];
      });
      record = await record.save();
      updatedCount++;
    }
  };

  // One body, ID on body

  if (body._id || body.id) {
    const where = { _id: body._id || body.id };
    if (bindWithToken) {
      where[bindWithToken.recordKey] = bindWithToken.tokenValue;
    }
    record = await Model.findOne(where);
    await update(record, body);
  }

  // Multiple bodies, IDs on bodies

  else if (Array.isArray(body)) {
    if (max && body.length > max) throwMaxError();
    const where = { $in: ids }
    if (bindWithToken) {
      where[bindWithToken.recordKey] = bindWithToken.tokenValue;
    }
    records = await Model.find(where, null, options);

    for (const i in records) {
      await update(records[i], body[i]);
    }
  }

  // One body, update by IDs

  else if (ids) {
    const where = { _id: parseIds(ids) };
    if (bindWithToken) {
      where[bindWithToken.recordKey] = bindWithToken.tokenValue;
    }

    if (where._id.$in) {
      if (max && where._id.$in.length > max) throwMaxError();
      records = await Model.find(where, null, options);
      for (const i in records) {
        await update(records[i], body);
      }

    } else {
      record = await Model.findOne(where);
      await update(record, body);
    }
  }

  // One body, update by filters

  else if (filters) {
    const where = parseFilters(filters);
    if (bindWithToken) {
      where[bindWithToken.recordKey] = bindWithToken.tokenValue;
    }
    records = await Model.find(where, null, options);
    if (max && records.length > max) throwMaxError();
    for (const i in records) {
      await update(records[i], body);
    }
  }

  else {
    throw new Error([
      'USER_ERROR: Requests may be any of: 1) 1 ID in the path parameter with 1 ',
      'object literal as the body to update a single record, 2) multiple ',
      'comma-delimited IDs in the path parameter with 1 object literal as the ',
      'body to update multiple records with the same body, 3) the "filters" ',
      'query parameter with 1 object literal as the body to update multiple ',
      'records with the same body, and 4) no ID path parameter and no "filters" ',
      'query parameter, with an array of objects containing different IDs and ',
      'field values as the body.'
    ].join(''));
  }

  // Populate

  if (_populate) {
    await populate(record || records, _populate);
  }

  // Return

  return { record, records, updatedCount };

};

export default updateRecords;