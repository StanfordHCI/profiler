dw.derive.count = function(children, group) {

	var count = dw.derive.aggregate(children, group);

	count.query = function(vals) {
	  return {vals:[dv.count(vals[0])], bins:[]}
	}

	count.name = 'count';

	return count;

};

