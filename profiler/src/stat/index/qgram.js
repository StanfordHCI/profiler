dp.index.qgram = function(words, q) {
  var i = 0, w, words_length = words.length, word, wl, word_to_gram_index = Array(words_length),
      gram, gram_position_index = [], dict = {}, unique = 0, v, gram_lut = [];

  for (i; i < words_length; ++i) {
    word = words[i];
    wl = word.length;


    if (wl === undefined || wl < q) {
      word_to_gram_index[i] = [];
      continue;
    }

    word_to_gram_index[i] = Array(wl - q + 1);
    for (j = 0; j < wl - q + 1; ++j) {
      gram = word.substr(j, q);
      if ((v = dict[gram]) === undefined) {
        dict[gram] = v = unique;
        unique++;
        gram_position_index[v] = [[], []];
        gram_lut.push(gram);
      }
      word_to_gram_index[i][j] = v;


      gram_position_index[v][0].push(i);
      gram_position_index[v][1].push(j);
    }
  }







  var create_gram_index_for_word = function(word) {
    var wl = word.length, index, index_length, gram, v;

    if (wl < q) {
      return [];
    }
    index_length = wl - q + 1;
    index = Array(index_length);
    for (j = 0; j < index_length; ++j) {
      gram = word.substr(j, q);
      index[j] = dict[gram];
    }
    return index;
  }

  return {create_gram_index_for_word:create_gram_index_for_word, word_to_gram_index: word_to_gram_index,
      gram_position_index: gram_position_index, gram_lut: gram_lut, q: q, words: words};
};
