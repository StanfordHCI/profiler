dp.suggestion.related_variable = function(data, opt) {
  var initial_graph = dp.graph.sparse(),
      best_graph,
      binned_data;

  generate_random_graph();
  generate_binned_data();

  function shuffle(array) {
    var tmp, current, top = array.length;
    if(top) while(--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
    }
    return array;
  }

  function generate_random_graph() {

   var col, name, idx;
   idx = shuffle(d3.range(data.length));
   console.log(idx)
   idx.forEach(function(index, i) {
     col = data[index];
     name = col.name();
     initial_graph.add_node(name)
   })
   idx.forEach(function(index, i) {
     col = data[index];
     name = col.name();
     if (index < idx.length - 1)
     initial_graph.add_edge(name, data[index+1].name())
   })


   console.log("Initial graph");
   initial_graph.debug()
  }

  function generate_binned_data() {
   var bin;
   binned_data = [];
   data.map(function(col) {
     bin = dp.factory.bin().default_bin(data, col);
     bin.unique = bin.lut.length;
     binned_data.push(bin);
     binned_data[col.name()] = bin;
   })
  }

  best_graph = dp.graph.search.greedy(initial_graph, binned_data, dp.bayes.bde(),
      dp.graph.move.multi_connected_dag(), {max_moves:300, max_attempts:15000}).search()
  best_graph.graph.debug();
  console.log(best_graph.score)
};
