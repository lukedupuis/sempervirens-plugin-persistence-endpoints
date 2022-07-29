const populate = async (toPopulate, populate) => {
  try { populate = JSON.parse(populate); } catch(error) {}

  const _populate = async record => {
    if (!record) return;
    if (typeof populate == 'string') {
      await record.populate(populate);

    } else if (typeof populate == 'object') {
      if (Array.isArray(populate)) {
        for (const i in populate) {
          await record.populate(populate[i]);
        }

      } else {
        await record.populate(populate);

      }
    }
  };

  if (Array.isArray(toPopulate)) {
    for (const i in toPopulate) {
      await _populate(toPopulate[i]);
    }
  } else {
    await _populate(toPopulate);
  }

  return toPopulate;
};

export default populate;