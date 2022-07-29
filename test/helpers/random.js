function random() {
  let max, min = 0;
  if (arguments.length == 1) {
    max = arguments[0];
  } else if (arguments.length == 2) {
    min = arguments[0];
    max = arguments[1];
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default random;