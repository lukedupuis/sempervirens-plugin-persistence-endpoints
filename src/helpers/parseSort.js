const parseSort = sort => {
  let parsed = sort;
  if (parsed.includes('{') || parsed.includes('}') || parsed.includes('[') || parsed.includes(']')) {
    try {
      parsed = JSON.parse(sort);
    } catch(error) {
      throw new Error('USER_ERROR: "sort" is unparsable.');
    }
  } else {
    parsed = sort;
  }
  return parsed;
}

export default parseSort;