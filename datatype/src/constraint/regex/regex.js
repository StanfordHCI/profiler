dt.regex = function(pattern) {
  var regex = {};

  regex.pattern = function(x) {
    if (!arguments.length) return pattern;
    pattern = x;
  	return regex;
  };

  regex.test = function(v) {
    v = ""+v;
    var m = v.match(pattern);
    return (m != null) && (m[0].length === v.length);
  };

  return regex;
};
