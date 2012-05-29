dp.suggestion.entropy_all = function(data, opt) {
  var best_graph,
      binned_data, binned_data_table;

  generate_binned_data();

  function generate_binned_data() {
   var bin;
   binned_data = [];
   data.map(function(col) {
     bin = dp.factory.bin().default_bin(data, col);
     bin.unique = bin.lut.length;
     binned_data.push(bin);
     binned_data[col.name()] = bin;
     binned_data.type = dt.type
     bin.binned = true;
   })
  }

  var i = 0, j, table = dv.table(), matrix = [], score, all_scores = [];

  for (i ; i < binned_data.length; ++i) {
    matrix.push([])
  }

  table.addColumn("dummy", binned_data[0].slice(), "nominal", {encoded:true, lut:binned_data[0].lut})
  for (i = 0; i < binned_data.length - 1; ++i) {
    for (j = i + 1; j < binned_data.length; ++j) {
      score = dp.stat.mutual_binned(table, binned_data[i], binned_data[j]);
      matrix[i][j] = score;
      matrix[j][i] = score;
      all_scores.push({i:i,j:j, score:score})
    }
  }

  all_scores.sort(function(a,b) {return a.score < b.score ? 1 : -1})
  all_scores.map(function(s) {
    console.log(data[s.i].name(), data[s.j].name(), s.score)
  })
  return all_scores;
};

dp.add_generated_features = function(data) {
  data.forEach(function(col) {

    if (col.system) return false;
    var type = col.type.type(), field = col.name();
    switch (type) {
      case 'number':
      case 'int':
      case 'numeric':
      var transform = dw.derive.log(dw.derive.variable(field)),
          new_col_name = transform.name + "(" + field + ")", transformed_field = data[new_col_name];
      if (!transformed_field) {
        transformed_field = transform.evaluate(data);
        data.addColumn(new_col_name, transformed_field, transformed_field.type, {system:true, encoded:transformed_field.lut != undefined, lut:transformed_field.lut});
      }
      break;
      case 'datetime':
      case 'ordinal':
      break;
      case 'geolocation':
      case 'geo_world':
      break
      case 'string':
      case 'nominal':






      default:
      break;
    }
  })
}


dp.suggestion.entropy = function(data, bin, opt) {
  var best_graph,
      binned_data, binned_data_table,
      ignored_columns = opt.ignored_columns || [];


  generate_binned_data();



  bin.binned = true;

  function generate_binned_data() {
   var b;
   binned_data = [];
   data.filter(function(col){
     return ignored_columns.indexOf(col.name()) === -1 && (!col.lut || col.lut.length < 100);
   }).map(function(col) {
     var x = dp.suggestion.entropy.bin(data, col, bin);
     b = x.bin;
     b.binner = x.binner;

     b.unique = bin.lut.length;
     binned_data.push(b);
     binned_data[col.name()] = b;
     binned_data.type = dt.type
     b.binned = true;
     b.col = col;
   })
  }

  var i = 0, j, score, all_scores = [], min_score = .2;
  for (i = 0; i < binned_data.length; ++i) {
    score = dp.stat.normalized_mutual_binned(undefined, bin, binned_data[i]);
    if (score > 0) {
      all_scores.push({col:binned_data[i].col.name(), score:score, binner:binned_data[i].binner})
    }
  }
  all_scores.sort(function(a,b) {return a.score > b.score ? 1 : -1})
  return all_scores;
};

dp.suggestion.entropy.bin = function(table, col, targetBins) {
  var candidateBins = dp.factory.bin().all_bins(table, col), c, score, maxScore = Infinity, bestBin;

  targetBins.binned = true;
  if (col.name()=== 'Release Date') {
    var x = 'test'
  }
  candidateBins.map(function(c) {
    var bin = c.bin();
    bin.binned = true;
    bin.unique = bin.lut.length;

    score = dp.stat.normalized_mutual_binned(undefined, targetBins, bin);
    if (col.name()==='Release Date') {
      console.log(targetBins)
      console.log(bin)
      console.log(score)
    }
    if (score < maxScore) {
      bestBin = {binner:c, bin:bin, score:score}
      maxScore = score;
    }
  })
  return bestBin;
};
