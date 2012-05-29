dp.chart.text_cluster = function(container, fields, opt)
{
  opt = opt || {};
  var group = opt.group || this,
      cluster = dp.chart.chart(container, group, fields, opt),
      w = opt.width || 400,
      h = (opt.height || 194), cashed_clusters,
	    limit = opt.limit || 15, timeout = opt.timeout || 200;

  cluster.width(w);
  cluster.height(h);

  cluster.initUI = function() {
    jQuery(container[0]).empty();
    container.attr('class', 'chart_area');
    var vis = container.append('div')
        .attr('width', cluster.width())
        .attr('min-width', cluster.width())
        .attr('height', cluster.height())
        .attr('class', 'bordered')
        .classed('cluster_visualization', true);
    cluster.vis(vis);
  };
  cluster.initBins = function() {
    cluster.query(undefined)
  };

  cluster.draw = function() {
    var data = cluster.data(),
        fields = cluster.fields(),
        d, names, roll, vis = cluster.vis(), groups;

    if (!fields || fields.length === 0) return;


    jQuery(vis[0]).empty();

    var q = 2, k = 2;
    var group_by_col = 'Release Date'
    if (true) {
      var view = dv.partition(data, ['datestr(Release Date)'])
    }

    cached_clusters = roll = dp.qgram_self_cluster(data, fields[0], q, k);

  	var idx = d3.range(Math.min(roll.length, 25)),
  	    column_widths, header_width = 20;

   	groups = vis.append('div')
  		.attr('class', 'base')
  		.selectAll('div.base')
        .data(idx)
       .enter().append('div')
        .attr('class', 'base')
        .classed('cluster_group', true)

	 groups.selectAll('div.cluster_element')
		.data(function(d) {return d3.range(roll[d].cluster.length).map(function(){return d})})
  	.enter().append('div')
  	.attr('class', 'cluster_element')
  	.text(function(d, i) {
  	  var str = roll[d].cluster[i], count = roll[d].counts[i];
  	  return (str != undefined) ? (''+ str).substr(0,35) + ' (' + count + ')' : '';
  	});
  };

  cluster.select = function(e) {
    var vis = cluster.vis(), roll;
    if (e.data) {

       jQuery(vis[0]).empty();

       var q = 2, k = 2, cache = [], filtered_lut = [], f = e.data[fields[0]], lut = f.lut;
       f.map(function(x) {
         if (x && !cache[lut[x]]) {
          filtered_lut.push(lut[x]);
         cache[lut[x]] = 1
         }
       })
       filtered_lut.sort();
       roll = dp.qgram_self_cluster(filtered_lut, q, k);

     	var idx = d3.range(Math.min(roll.length, 25)),
     	    column_widths, header_width = 20;

      	groups = vis.append('div')
     		.attr('class', 'base')
     		.selectAll('div.base')
           .data(idx)
          .enter().append('div')
           .attr('class', 'base')
           .classed('cluster_group', true)

   	 groups.selectAll('div.cluster_element')
   		.data(function(d) {return roll[d].cluster})
     	.enter().append('div')
     	.attr('class', 'cluster_element')
     	.text(function(d) {return (d != undefined) ? (''+ d).substr(0,35) : '';});
	  } else {

        jQuery(vis[0]).empty();


        roll = cached_clusters;

      	var idx = d3.range(Math.min(roll.length, 25)),
      	    column_widths, header_width = 20;

       	groups = vis.append('div')
      		.attr('class', 'base')
      		.selectAll('div.base')
            .data(idx)
           .enter().append('div')
            .attr('class', 'base')
            .classed('cluster_group', true)

    	 groups.selectAll('div.cluster_element')
    		.data(function(d) {return roll[d].cluster})
      	.enter().append('div')
      	.attr('class', 'cluster_element')
      	.text(function(d) {return (d != undefined) ? (''+ d).substr(0,35) : '';});
    }
  };

  cluster.type = function() { return 'text_cluster'; };
  cluster.initUI();
  cluster.initBins();
  cluster.update_rollup();

  cluster.visible_rows = function() {

    return [0, 20]
  }

  return cluster;
};
