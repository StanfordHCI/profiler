dw.derive.variance = function(children, group) {

	var variance = dw.derive.aggregate(children, group);

	variance.query = function(vals) {
	  return {vals:[dv.variance(vals[0])], bins:[]}
	}

  variance.name = 'variance';

	return variance;

};

