dw.regex = function(){
	var r = {};

	var numberRecord = function(m){


		/*TODO: Add regex such as #of digits or range of digits*/
		var r = [
			new RegExp(m),
			/\d+/
		];
		return r;
	}

	var stringRecord = function(m){


		/*TODO: Add conditional regex such as UPPERCASE, LOWERCASE, or paramterized by length of word*/
		var r = [
			new RegExp(m),
			/[a-zA-Z]+/
		];

		if(m.toLowerCase()===m){
			r.push(/[a-z]+/)
		}
		else if(m.toUpperCase()===m){
			r.push(/[A-Z]+/)
		}
		return r;

	}

	var symbolRecord = function(m){
		var regex

		if(['|'].indexOf(m)!=-1){
			m = '\\'+m
		}

		if (m == '.') {
			m = '\\.';
		}

		try{
			regex = new RegExp(m);
		}
		catch(e){
			regex = new RegExp('\\'+m);
		}

		var r = [
			regex
		];
		return r;
	}


	r.candidates = function(records, o){

		if(records.length){
			var enumerations = r.parse(records[0].text, records[0].start, records[0].end),
				tests = records.slice(0), on, between, match, candidates;




			on = (enumerations.on || []).map(function(c){
				return {on:c}
			});


			var before = enumerations.before, after = enumerations.after;



			if(before === undefined || before.length === 0){
				between = after.map(function(a){return {after:a, on:/.*/}});
			}
			else if(after === undefined || after.length === 0){
				between = before.map(function(a){return {before:a,on:/.*/}});
			}
			else{
				between = (before||[]).reduce(function(x, b){
					return x.concat((after||[]).map(function(a){
						return {before:b, after:a, on:/.*/}
					}))
				}, [])
			}





			candidates = on.concat(between);


			if(tests.length===0) return candidates;

			candidates = candidates.filter(function(candidate){
				return tests.filter(function(test){
					match = dw.regex.match(test.text, candidate);
					return(match.length < 2 || match[1].start!=test.start||match[1].end!=test.end)
				}).length===0
			})
			return candidates
		}

		return []

	}

	var collapse = function(regexArray){
		var joined = regexArray.map(function(r){
			return r.toString().replace(/^\/|\/$/g,'')
		}).join('')

		return new RegExp(joined)
	}


	r.parse = function(str, startCursor, endCursor, o){
		str = ''+str

		var token = /([a-zA-Z]+)|([0-9]+)|([^a-zA-Z0-9])/g;

		var match = (str.substring(0, startCursor).match(token) || [])
					.concat(str.substring(startCursor, endCursor).match(token) || [])
					.concat(str.substring(endCursor).match(token) || [])



		var	o = o || {}, code, records, startIndex, endIndex, index = 0,
			on, before, after,
			matchAfter = o.matchAfter||3, matchBefore=o.matchBefore||3; /*candidates*/



		match = match.filter(function(m){return m!=null})



		records = match.map(function(m, ind){
			code = m.charCodeAt(0);
			if(startCursor >= index && startCursor < index+m.length){
				startIndex = ind;
			}
			if(endCursor > index && endCursor <= index+m.length){
				endIndex = ind;
			}
			index+=m.length;

			if((code > 64 && code < 91) || (code > 96 && code < 123)){
				return stringRecord(m);
			}else if(code > 47 && code < 58){
				return numberRecord(m);
			}
			else{
				return symbolRecord(m);
			}
		})




		if(startIndex===undefined) startIndex = match.length-1;
		if(endIndex===undefined) endIndex = match.length-1


		on = records.slice(startIndex, endIndex+1).reduce(function(a, b){
			var cross = [];
			a.forEach(function(i){
				b.forEach(function(j){
					cross.push(i.concat(j))
				})
			})
			return cross;
		}, [[]])




		var enumerate = function(a, b){
			var cross = [];
			if(a.length){
				a.forEach(function(i){
					b.forEach(function(j){
						cross.push(i.concat(j))
					})
				})
				return a.concat(cross);
			}
			else{
				return b.map(function(j){
					return [j];
				})
			}
		}




			after = records.slice(Math.max(startIndex-matchAfter-1, 0), startIndex).reverse().reduce(enumerate, [])

			before = records.slice(endIndex+1, Math.min(endIndex+matchBefore+1, records.length)).reduce(enumerate, [])




		return {on:on.map(collapse), after:(after||[]).map(function(x){return collapse(x.reverse())}), before:(before||[]).map(function(x){return collapse(x)})}

	}

	return r;
}

dw.regex.record = function(text, start, end, col, row, table){
	return {text:text, start:start, end:end, col:col, row:row, table:table}
}

dw.regex.friendly_description = function(regex){

	var regex = regex.toString().replace(/^\/|\/$/g,'')
	regex = regex.replace(/\n/g, 'newline')
	regex = regex.replace(/ /g, ' ')
	regex = regex.replace(/\t/g, 'tab')
	regex = regex.replace(/\(?(\[0\-9\]|\\d)\+\)?/g, ' any number ')
	regex = regex.replace(/\(?(\[a\-z\A\-Z\]|\[A\-Z\a\-\z\])\+\)?/g, ' any word ')
	regex = regex.replace(/\(?(\[a\-z\])\+\)?/g, ' any lowercase word ')
	regex = regex.replace(/\(?(\[A\-Z\])\+\)?/g, ' any uppercase word ')
	regex = regex.replace(/\$$/, '{end}')
	regex = regex.replace(/^\^/, '{begin}')

	regex = regex.replace('\\','')


	if(regex === 'newline') return regex

	return "'"+regex+"'";
}

dw.regex.description_length = function(regex){
	if(!regex) return 0;

	regex = regex.toString().replace(/^\/|\/$/g,'');







	regex = regex.replace(/\\n/g, 'n')
	regex = regex.replace(/ /g, ' ')
	regex = regex.replace(/\t/g, 't')
	regex = regex.replace(/\(?(\[0\-9\]|\\d)\+\)?/g, 'n')
	regex = regex.replace(/\(?(\[A\-Z\])\+\)?/g, ' w')
	regex = regex.replace(/\(?(\[a\-z\])\+\)?/g, 'w')
	regex = regex.replace(/\(?(\[a\-z\A\-Z\]|\[A\-Z\a\-\z\])\+\)?/g, 'w')
	regex = regex.replace(/\$$/, 'e')
	regex = regex.replace(/^\^/, 'b')
	regex = regex.replace('\\','')

	var match = regex.match(/([a-zA-Z]+)|([0-9]+)|([^a-zA-Z0-9])/g)

	return match.length+1


	return regex.length;
}
