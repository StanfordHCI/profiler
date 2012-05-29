dt.range = function() {
  var range = {},
      lower = 0, upper = 1, closed_lower = true, closed_upper = true;

  range.bounds = function(x) {
    if (!arguments.length) return [lower, upper];
    lower = x[0];
    upper = x[1];
	return range;
  };

  range.closed = function(x) {
    if (!arguments.length) return [closed_lower, closed_upper];
	if(arguments.length === 1) {
		closed_upper = closed_lower = x;
	}
	else{
      closed_lower = x[0];
      closed_upper = x[1];
	}
	return range;
  };


  range.test = function(v) {
    return v >= lower && (closed_lower || v != lower) && v <= upper && (closed_upper || v != upper);
  };

  return range;
};
