dw.derive.stdev = function(children, group) {

	var stdev = dw.derive.aggregate(children, group);

	stdev.query = function(vals) {
	  return {vals:[dv.stdev(vals[0])], bins:[]}
	}

	stdev.name = 'stdev';

	return stdev;

};

