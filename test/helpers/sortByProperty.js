const sortByProperty = (a, b, p) => {
  const textA = a[p].toUpperCase();
  const textB = b[p].toUpperCase();
  return textA < textB ? -1 : textA > textB ? 1 : 0;
};

export default sortByProperty;