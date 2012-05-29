dw.regex.match = function(value, params){

	if(!value) return ""

	var max_splits = params.max_splits;
	if(max_splits===undefined) max_splits = 1;

	var remainder_to_split = {start:0, end:value.length,value:value}
	var splits = []
	var numSplit = 0;
	var which = Number(params.which)
	if(isNaN(which)) which = 1

	while(max_splits <= 0 || numSplit < max_splits*which){
		var s = dw.regex.matchOnce(remainder_to_split.value, params)

		if(s.length > 1){

				remainder_to_split = s[2];
				splits.push(s[0])
				splits.push(s[1])
				occurrence = 0


		}
		else{
			break
		}
		numSplit++;
		if(numSplit > 1000){

			break;
		}
	}

	splits.push(remainder_to_split)




	var occurrence = 0;
	var newSplits = []
	var prefix = ''
	var i;
	for(i = 0; i < splits.length; ++i){
		if(i%2===1){
			occurrence++;
			if(occurrence===which){
				newSplits.push({value:prefix, start:0, end:prefix.length})
				newSplits.push({start:prefix.length, end:prefix.length+splits[i].value.length, value:splits[i].value})
				occurrence = 0;
				prefix = ''
				continue
			}
		}
		prefix += splits[i].value
	}
	newSplits.push({start:0, end:prefix.length, value:prefix})



	return newSplits;
}

dw.regex.matchOnce = function(value, params){

	var positions = params.positions;
	var splits = [];

	if(positions && positions.length){
		if(positions.length==2){
			if(value.length >= positions[1]){
				var split_start = positions[0]
				var split_end = positions[1]
				splits.push({start:0, end:split_start, value:value.substr(0, split_start)});
				splits.push({start:split_start, end:split_end, value:value.substr(split_start, split_end-split_start)})
				splits.push({start:split_end, end:value.length, value:value.substr(split_end)})

				return splits;
			}
			return [{start:0, end:value.length, value:value}]

		}
	}




	var before = params.before;
	var after = params.after;
	var on = params.on
	var ignore_between = params.ignore_between;


	var remainder = value;
	var remainder_offset = 0;
	var start_split_offset = 0;
	var add_to_remainder_offset = 0;


	while(remainder.length){

		var valid_split_region = remainder;
		var valid_split_region_offset = 0;


		start_split_offset = remainder_offset;


		if(ignore_between){

			var match = remainder.match(ignore_between);
			if(match){

				valid_split_region = valid_split_region.substr(0, match.index)
				remainder_offset += match.index+match[0].length;
				remainder = remainder.substr(match.index+match[0].length)

			}
			else{
				remainder = ''
			}

		}
		else{
			remainder = ''
		}

		if(after){
			var match = valid_split_region.match(after)
			if(match){
				valid_split_region_offset = match.index+match[0].length;
				valid_split_region = valid_split_region.substr(valid_split_region_offset)

			}
			else{
				continue;
			}
		}
		if(before){
			var match = valid_split_region.match(before)
			if(match){
				valid_split_region = valid_split_region.substr(0, match.index)
			}
			else{
				continue;
			}
		}


		var match = valid_split_region.match(on)
		if(match){

			var split_start = start_split_offset + valid_split_region_offset+match.index;
			var split_end = split_start + match[0].length;

			splits.push({start:0, end:split_start, value:value.substr(0, split_start)});
			splits.push({start:split_start, end:split_end, value:value.substr(split_start, split_end-split_start)})
			splits.push({start:split_end, end:value.length, value:value.substr(split_end)})
			return splits;

		}
		continue;

	}

	return [{start:0, end:value.length, value:value}]


};
