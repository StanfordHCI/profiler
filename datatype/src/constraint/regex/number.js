dt.number = function() {
  var pattern = {};

  pattern.regex = function(x) {
    if (!arguments.length) return pattern;
    pattern = x;
  	return regex;
  };

  return regex;
};
