


dw.io.inference = function(text, opt) {
  opt = opt || {};
  var char_sample = opt.char_sample || text.length, char_stats = dv.array(300),
      c, delimiters, quote_chars, delimiter, row_delimiter, quote_char;

  for(c = 0; c < char_sample; ++c) {
    char_stats[text.charCodeAt(c)]++;
  }

  delimiters = opt.delimiters || [',', '\t', '|', ':', ';'];
  row_delimiters = opt.row_delimiters || ['\n', '\r'];
  quote_chars = opt.quote_chars || ['"', "'"];

  delimiter = top_char(delimiters);
  row_delimiter = top_char(row_delimiters);
  quote_char = top_char(quote_chars);

  return dw.io.delimited({delimiter:delimiter, row_delimiter:row_delimiter, quote_char:quote_char});

  function top_char(chars, opt) {
    var top_chars = chars.map(function(d) {
      return d.charCodeAt(0);
    }).sort(function(a, b) {
      if(char_stats[a] < char_stats[b]) return 1;
      return -1;
    });
    return String.fromCharCode(top_chars[0]);
  }

}