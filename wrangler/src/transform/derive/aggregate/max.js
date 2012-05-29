dw.derive.max = function(children, group) {

	var max = dw.derive.aggregate(children, group);

	max.query = function(vals) {
	  return {vals:[dv.max(vals[0])], bins:[]}
	}

	max.name = 'max';

	return max;

};

