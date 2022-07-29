const parseIds = ids => {
  let parsed;
  const split = ids?.split(',');
  if (split) {
    if (split.length == 1) {
      parsed = split[0];
    } else {
      parsed = { $in: split };
    }
  }
  return parsed;
};

export default parseIds;