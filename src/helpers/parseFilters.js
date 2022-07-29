const parseFilters = filters => {
  let parsed;
  try {
    parsed = JSON.parse(filters);
  } catch(error) {
    throw new Error('USER_ERROR: "filters" are unparsable.');
  }
  return parsed;
};

export default parseFilters;