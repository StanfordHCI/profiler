dt.lookup = function(lut) {
  var lookup = {},
      lut = lut || {}, transform;

  lookup.transform = function(x) {
    if (!arguments.length) return transform;
    transform = x;
    return lookup;
  };

  lookup.lut = function(x) {
    if (!arguments.length) return lut;
    lut = {};
    invert = [];
    for (v in x) {
      lut[v] = x[v];
      invert[x[v]] = v;
    }
    lut.inverted = invert;
  	return lut;
  };

  lookup.invert = function(v) {
    return invert[v];
  }

  lookup.lookup = function(v) {
    if(transform) v = transform(v);
    return lut[v];
  };

  lookup.lut(lut)

  return lookup;
};
