/**
   qgram filter based on algorithm from Gravano et. al,
   Approximate String Joins in a Database (Almost) for Free

 *  id: The id of the word of interest within the dictionary
 *  index: a dp.qgram.index
 *  k: the desired edit distance between candidates and target word.
*/
dp.qgram_filter = function(target_word, target_word_grams, index, k, opt) {
  opt = opt || {};
	var q = index.q, dictionary = index.words, min_matching_grams = target_word.length - 1 - ((k-1)*q),
	    target_word_length = target_word.length, candidates = [], counts = {}, gram, i, j, candidate_id, grams = target_word_grams,
	    gram_position_index = index.gram_position_index, grams_length = grams.length, gram, count, gram_words, gram_positions, abs = Math.abs,
	    candidate_word, less_than_id = opt.less_than_id;

	for (i = 0; i < grams_length; ++i) {
		gram = grams[i];
		if (gram === undefined) continue;
		gram_words = gram_position_index[gram][0];
		gram_positions = gram_position_index[gram][1];
		for (j = 0; j < gram_words.length; ++j) {
      candidate_id = gram_words[j];

			if (candidate_id != less_than_id && (!less_than_id || candidate_id < less_than_id)
			    && (abs(pos = gram_positions[j] - i) <= k )) {
				count = counts[candidate_id]
				if (count === -1) continue;
				candidate_word = dictionary[candidate_id];
				if (count === undefined) {

					if (abs(target_word_length-candidate_word.length) > k) {
						count = counts[candidate_id] = -1;
					}
					else {
						count = counts[candidate_id] = 0;
					}
				}
				if (count===-1) continue;
				count = ++counts[candidate_id]
				if (count >= min_matching_grams && count >= candidate_word.length-1-((k-1)*q)) {
					counts[candidate_id] = -1;
					if(dp.levenshtein(target_word, dictionary[candidate_id], k) <= k)
						candidates.push(candidate_id)

				}
			}
		}
	}

	return candidates;
};

dp.qgram_dictionary_filter = function(word, index, k) {
  return dp.qgram_filter(word, index.create_gram_index_for_word(word), index, k)
};

dp.qgram_self_filter = function(id, index, k) {
  return dp.qgram_filter(index.words[id], index.word_to_gram_index[id], index, k, {less_than_id:id})
};

dp.qgram_self_cluster = function(data, field, q, k) {
  var index, candidates = [], clustered = [], list, counts;
  list = data[field].lut;
  counts = data.query({dims: [field], vals: [dv.count('*')], code:false})
  index = dp.index.qgram(list, q);
  list.map(function(x) {
    x = "" + x;
    if (clustered[x]) return;
    var c = dp.qgram_dictionary_filter(x, index, k);
    if (c.length > 1) {

      var old_cluster;
      c.map(function(i){
        if (!old_cluster) old_cluster = clustered[list[i]]
      })
      if (old_cluster) {
        c.map(function(i) {
          if (old_cluster.cluster.indexOf(list[i])===-1) {
            old_cluster.cluster.push(list[i])
            old_cluster.counts.push(counts[1][i])
            old_cluster.size++;
          }
          clustered[list[i]] = old_cluster;
        })
      } else {
        var new_cluster = {};
        new_cluster.id = x;
        new_cluster.cluster = c.map(function(i){
            clustered[list[i]] = new_cluster;
            return list[i]}
        );
        new_cluster.size = c.length,
        new_cluster.counts =  c.map(function(i){
            return counts[1][i];
          })
          candidates.push(new_cluster)
      }
      if (false) {
        var new_cluster = {
          id: x,
          cluster: c.map(function(i){
            clustered[list[i]] = 1;
            return list[i]}
          ),
          size: c.length,
          counts: c.map(function(i){
            return counts[1][i];
          })
        }
        candidates.push(new_cluster);
      }

    }
  })
  return candidates;
};
