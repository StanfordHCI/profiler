dw.derive.sum = function(children, group) {

	var sum = dw.derive.aggregate(children, group);

	sum.query = function(vals) {
	  return {vals:[dv.sum(vals[0])], bins:[]}
	}

  sum.name = 'sum';

	return sum;

};

