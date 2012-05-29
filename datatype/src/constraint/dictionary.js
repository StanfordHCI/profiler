dt.dictionary = function(values) {
  var dictionary = {},
      values = values || [], lut = {}, transform;

  dictionary.transform = function(x) {
    if (!arguments.length) return transform;
    transform = x;
    return dictionary;
  };

  dictionary.values = function(x) {
    if (!arguments.length) return values;
    lut = {};
    values = x.map(function(v){
      lut[v] = 1;
      return v;
    });
  	return dictionary;
  };


  dictionary.test = function(v) {
    if(transform) v = transform(v);
    return lut[v] != undefined;
  };

  dictionary.values(values);

  return dictionary;
};
