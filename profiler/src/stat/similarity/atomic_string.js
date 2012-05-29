dp.atomic_string = function(left, right, delimiter) {
  var left_atomic, right_atomic, delimiter = delimiter || dp.atomic_string.delimiter,
      l = 0, r = 0, llength, rlength, lword, rword, lc, rc, matches = 0;
  left_atomic = left.split(delimiter).sort();
  right_atomic = right.split(delimiter).sort();
  llength = left_atomic.length;
  rlength = right_atomic.length;
  for (l, r; l < llength, r < rlength; ) {
    lword = left_atomic[l];
    rword = right_atomic[r];
    if (lword === rword) (matches++, ++l, ++r);
    else if (lword < rword) ++l;
    else ++r;
  }

  return (2 * matches) / (llength + rlength);
};

dp.atomic_string.delimiter = /[^a-zA-Z0-9]+/;


