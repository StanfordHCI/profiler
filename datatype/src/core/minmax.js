dt.minmax = function(array) {
  var i = -1,
      n = array.length,
      min, max,
      v;
  while (++i < n && ((min = array[i]) == null || min != min)) min = undefined;
  max = min;
  while (++i < n) {
    if ((v = array[i]) != null) {
       if (v > max) {
          max = v;
       } else if (v < min) {
          min = v;
       }
    }
  }
  return [min, max];
};