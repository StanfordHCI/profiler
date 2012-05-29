dp.levenshtein = function(s1, s2, cap) {
	cap = cap || (s1.length + s2.length);
  var l1 = s1.length, l2 = s2.length;
	if (l1 - l2 > cap) return undefined;
  if (l1 === 0) {
		if (l2 > cap) return undefined;
		return l2;
	}
	if (l2 === 0) {
   	if (l1 > cap) return undefined;
		return l1;
  }
  var i = 0, j = 0, d = [];


  for (i = 0; i <= l1; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (j = 0; j <= l2; j++) {
    d[0][j] = j;
  }

	var terminate, dist, l, u, ul,
	    max = Math.max, min = Math.min;
	for (i = 1; i <= l1; i++) {
		terminate = true;
    for (j = max(1, i - cap); j <= min(l2, i + cap); j++) {

			l = d[i - 1][j];
      u = d[i][j - 1];
      ul = d[i - 1][j - 1];
			if (l === undefined) l = Infinity;
			if (u === undefined) u = Infinity;

			dist = min(
        l + 1, u + 1, ul + (s1[i - 1] === s2[j - 1] ? 0 : 1)
      );
			if (dist <= cap) terminate = false;
			d[i][j] = dist;
    }
		if (terminate) return undefined;
  }
  return d[l1][l2];
};


