import { populate } from './helpers/index.js';

const createRecords = async (Model, body, {
  populate: _populate,
  max,
  bindWithToken
} = {}) => {
  if (max && body.length > max) {
    throw new Error([
      'USER_ERROR: The maximum number of records allowed in ',
      `one request is ${max}.`
    ].join(''));
  }

  const create = async values => {
    if (bindWithToken) {
      values[bindWithToken.recordKey] = bindWithToken.tokenValue;
    }
    const record = await Model.create(values);
    _populate && await populate(record, _populate);
    return record;
  };

  if (Array.isArray(body)) {
    const records = [];
    for (const i in body) {
      records.push(await create(body[i]));
    }
    return { records };

  } else {
    return { record: await create(body) };

  }
};

export default createRecords;