dt.min = function(array) {
  var i = -1,
      n = array.length,
      a,
      b;
  while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
  while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  return a;
};