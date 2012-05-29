dt.length = function(x) {
  var constaint = {},
      lower = 0, upper = 1, closed_lower = true, closed_upper = true;

  constaint.length = function(x) {
    if (!arguments.length) return [lower, upper];
    if (!x.length) x = [x, x];
    else if (x.length===1) x.push(x[0])
    lower = x[0];
    upper = x[1];
  	return constraint;
  };

  constraint.test = function(v) {
    return v.length <= max && v.length >= min;
  };

  constraint.length(x);

  return constraint;
};
