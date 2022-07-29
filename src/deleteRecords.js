import dao from '@sempervirens/dao';

const deleteRecords = async (Model, {
  ids,
  filters,
  max,
  dbName,
  removeRefs = [],
  bindWithToken
} = {}) => {
  if (!ids && !filters) {
    throw new Error('USER_ERROR: "ids" or "filters" are required.');
  } else if (ids && filters) {
    throw new Error([
      'USER_ERROR: "ids" or "filters" may be used, not both. If more refined ',
      'filtering is needed along with IDs, move the IDs into "filters".'
    ].join(''));
  }

  const throwMaxError = () => {
    throw new Error([
      'USER_ERROR: The maximum number of records allowed in ',
      `one request is ${max}.`
    ].join(''));
  };

  const allIds = [];
  let deletedCount = 0;

  // Delete by ID

  if (ids) {
    const split = ids?.split(',');
    if (max && split.length > max) throwMaxError();
    try {

      const where = { _id: split.length == 1 ? split[0] : { $in: split } };
      if (bindWithToken) {
        where[bindWithToken.recordKey] = bindWithToken.tokenValue;
      }

      if (split?.length == 1) {
        deletedCount = (await Model.deleteOne(where))?.deletedCount;
        if (deletedCount > 0) allIds.push(split[0]);

      } else if (split?.length > 1) {
        deletedCount = (await Model.deleteMany(where))?.deletedCount;
        if (deletedCount > 0) allIds.push(...split);
      }

    } catch({ message }) {
      if (message.includes('Cast to ObjectId failed for value')) {
        throw new Error('USER_ERROR: One or more ID is not valid.');
      }
    }
  }

  // Delete by filter

  else if (filters) {
    let where;
    try {
      where = JSON.parse(filters);
    } catch(error) {
      throw new Error('USER_ERROR: "filters" are unparsable.');
    }
    if (bindWithToken) {
      where[bindWithToken.recordKey] = bindWithToken.tokenValue;
    }
    const records = await Model.find(where).select('_id').lean();
    if (records?.length > 0) {
      if (max && records.length > max) throwMaxError();
      const ids = records.map(({ _id }) => _id.toString());
      deletedCount += (await Model.deleteMany({ _id: { $in: ids } }))?.deletedCount;
      allIds.push(...ids);
    }
  }

  // Remove references

  if (removeRefs?.length > 0) {
    for (const i in removeRefs) {
      const { modelName, field } = removeRefs[i];
      const Model = dao.getModel(dbName, modelName);

      let where = {};
      where[field] = { $exists: true };
      if (bindWithToken) {
        where[bindWithToken.recordKey] = bindWithToken.tokenValue;
      }
      const record = await Model.findOne(where).select(field).lean();

      if (!record) continue;

      let toUpdate = {};
      if (Array.isArray(record[field])) {
        toUpdate = { $pullAll: {} };
        toUpdate.$pullAll[field] = allIds;

      } else {
        where[field] = { $in: allIds };
        toUpdate[field] = null;

      }

      await Model.updateMany(where, toUpdate);
    }
  }

  return deletedCount;
}

export default deleteRecords;