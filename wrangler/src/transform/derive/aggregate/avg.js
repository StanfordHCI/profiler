dw.derive.avg = function(children, group) {

	var avg = dw.derive.aggregate(children, group);

	avg.query = function(vals) {
	  return {vals:[dv.avg(vals[0])], bins:[]}
	}

	avg.name = 'avg';

	return avg;

};

