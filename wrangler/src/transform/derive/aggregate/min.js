dw.derive.min = function(children, group) {

	var min = dw.derive.aggregate(children, group);

	min.query = function(vals) {
	  return {vals:[dv.min(vals[0])], bins:[]}
	}

  min.name = 'min';

  return min;

};

