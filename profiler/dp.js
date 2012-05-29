(function(){dv.EPSILON = 1e-9;

dv.logFloor = function(x, b) {
  return (x > 0)
      ? Math.pow(b, Math.floor(Math.log(x) / Math.log(b)))
      : -Math.pow(b, -Math.floor(-Math.log(-x) / Math.log(b)));
};

function dv_bins(data, bins, min, max, step) {
  var bmin = min !== undefined,
      bmax = max !== undefined;
  min = bmin ? min : dv.minv(data);
  max = bmax ? max : dv.maxv(data);
  var span = max - min;

  /* Special case: empty, invalid or infinite span. */
  if (!span || !isFinite(span)) return [min, min, 1];

  var s = Math.pow(10, Math.round(Math.log(span) / Math.log(10)) - 1),
      d = [Math.floor(min / s) * s, Math.ceil(max / s) * s];
  if (bmin) d[0] = min;
  if (bmax) d[1] = max;

  if (step === undefined) {
    step = dv.logFloor((d[1]-d[0])/bins, 10);
    var err = bins / ((d[1]-d[0]) / step);
    if (err <= .15) step *= 10;
    else if (err <= .35) step *= 5;
    else if (err <= .75) step *= 2;
  }
  d.push(step);

  return d;
}

function dv_profile_cache(evt, query) {
  if (!dv.profile.cache) return evt.data.query(query);

  var cmp = function(a,b) {
	return keys[a] < keys[b] ? -1 : (keys[a] > keys[b] ? 1 : 0);
  }
  var dims = query.dims, idx = [], i, dat
      keys = dims.map(function(d,i) { idx.push(i); return d.key; });
  idx.sort(cmp);
  var key = idx.map(function(j) { return keys[j]; }).join("__");

  if (!(dat = evt.cache[key])) {
    // cache miss: execute the query
    dims = idx.map(function(j) { return dims[j]; });
    dat = evt.data.query({dims:dims, vals:query.vals});
    evt.cache[key] = dat;
  }
  // return table columns in correct order
  idx.push(idx.length); // include count column
  return idx.map(function(j) { return dat[j]; });
}

dv.profile = function(data) {
  var g = [],
      add = function(vis) { g.push(vis); return vis; },
      timeoutID, numGraphs = 0;

  g.plot = function() {
    var type = arguments[0], args = [];
    for (var i=1; i<arguments.length; ++i)
      args.push(arguments[i]);
    return add(dv[type].apply(g, args));
  }

g.default_plot = function(x, y, opt){
	x = x || [], y = y || [], opt = opt || {};
	return_params = {};

	var graphName = opt.graphName || (numGraphs++, 'graph' + numGraphs), container = dv.jq('div').attr('id',graphName).addClass('chart_container');
	jQuery('.ui-layout-center').append(container)

	var plot;
	var type;

	if(y.length === 0){
		if(x.length===1){
			type = data[x[0]].type;
			switch(type){
				case 'numeric':
					plot = g.plot('histogram', graphName, x, {bins:opt.numBins, width:200, height:62});
					break
				case 'datetime':
					plot = g.plot('datetime', graphName, x, {bins:opt.numBins, width:200, height:62});
					break
				case 'geolocation':
					plot = g.plot('histogram', graphName, x, {bins:opt.numBins, width:200, height:62});
					break
				case 'geocountry':
					plot = g.plot('georegion', graphName, x, {bins:opt.numBins, width:412, height:348, geotype:'geocountry'});
					break
				case 'ordinal':
					plot = g.plot('bar', graphName, x, {width:200, height:204});
					break
				case 'nominal':
					plot = g.plot('labeledbar', graphName, x, {width:200, height:204});
					return_params.num_bars = plot.num_bars;
					break
			}
		}
	}

	if(x.length === 2 && y.length === 1){
			plot = g.plot('categorygram', graphName, [x[0], x[1], y[0]], {width:200, height:204});
	}

	if(y.length === 1 && x.length === 1){
		type = data[y[0]].type;

		var topInit = $('#' + graphName).css('top');
		topInit = parseInt(topInit.substring(0,topInit.length-2));
		topInit /= 72;

		var leftInit = $('#' + graphName).css('left');
		leftInit = parseInt(leftInit.substring(0,leftInit.length-2));
		leftInit /= 212;

		var h = $('#' + graphName).height();
		h /= 72;

		for(var i = topInit; i < topInit+h; i++) {
			spaces[leftInit][i] = false;
		}

		if(type == 'geolocation') {
			plot = g.plot('geolocation', graphName, [x[0], y[0]], {width:412, height:348});
		}
		else {
			plot = g.plot('scatter', graphName, [x[0], y[0]], {width:200, height:204});
		}
		$('#' + graphName).resizable( "option", "disabled", true );
		$('#' + graphName).height(206);

		var top = $('#' + graphName).css('top');
		top = parseInt(top.substring(0,top.length-2));
		top /= 72;

		var left = $('#' + graphName).css('left');
		left = parseInt(left.substring(0,left.length-2));
		left /= 212;

		$('#' + graphName).css('opacity', 1.0);

		for(var i = top; i < top+3; i++) {
			spaces[left][i] = true;
		}
	}

	container.droppable({
		drop:function(event, ui){
			var index = jQuery(ui.helper).data('index');
			if(index != undefined) {
				var plot_def = g.default_plot([index], [x], {numBins:20, graphName:graphName})
			}
		},
		greedy:true
	})

	return_params.type = type;
	return_params.plot = plot;

	return return_params;


  }


  g.select = function(sel, delay) {
	clearTimeout(timeoutID);
	delay = delay || 1;
    timeoutID = setTimeout(function() { dispatch(sel); }, delay);
  }

  function dispatch(s) {
	var t0 = Date.now();
	var e = {data: null, cache:{}}, rn = s.range;
	if (rn != null) {
      var fields = [], f, x, filter = null;
      for (f in rn) fields.push(f);

      if (fields.length == 1) {
	    f = fields[0]; x = rn[f];

		if(x.type==='categorical'){
			var a = x[0]
			filter = function(t,r) {
				var v = t[f][r];
			    return v === a;
			};
		}
		else if(x === dv.quality.missing){
			filter = function(t,r) {
			 	var x= t[f]
				var v = x.lut ? x.lut[x[r]] : x[r] ;
				return dv.is_missing(v)
			    
			};
		}
		else if(x === dv.quality.valid){
			filter = function(t,r) {
			 	var x= t[f]
				var v = x.lut ? x.lut[x[r]] : x[r];
				return !dv.is_missing(v)
			};
		}
		else{
			var a = x[0], b = x[1], ex = x.ex;
			filter = function(t,r) {
			 	var v = t[f][r];
			    return a <= v && v <= b && (ex || v != b);
			};
			
		}
      } 
	else{


        filter = function(t,r) {
          for (var i=0, len = fields.length; i<len; ++i) {
            var f = fields[i], x = rn[f], v = t[f][r];
			

			
	        if (x[0] > v || v > x[1] || (!x.ex && v === x[1]))
              return false;
          }

          return true;
        };
      }
	  e.data = data.where(filter);



    }
	else if(s.filter){
	  e.data = data.where(s.filter);
	}
	for (var i=0; i<g.length; ++i) {

      if (g[i] !== s.source) g[i].select(e);
      else g[i].select({data:null});
    }
    var t1 = Date.now();
    dv.profile.cycletime = (t1-t0);
  }
  g.data = data;
  return g;
};

dv.profile.cache = true;dv.spreadsheet = function(id, fields, opt)
{
  var group = this,
      spread = {},
      data = group.data, roll, quality, names,
      dims = opt.dims || [],
      w = opt.width || 400,
      h = (opt.height || 194),
	  minh = 8,
	  space = 2,
	  limit = opt.limit || 15,
	  fields = (fields && fields.length) ? fields : d3.range(data.length),
      b, step, min, max, q, y, vis;




  spread.initUI = function() {
    d3.select("#"+id+" svg").remove();

	vis = d3.select("#"+id)
	      .append("table")
		    .attr("width", w)
		    .attr("height", h);
			
  };

  spread.initBins = function() {
    q = {dims:dims, vals:fields.map(function(f){return dv.list(f)})};
  };

  spread.update = function() {

    spread.initBins();
    //roll = data.query(q);
	
	roll = fields.map(function(c){
		 var d = data[c]
		 if(d.type==='numeric')
			return d.slice(0, limit)
		return d.slice(0, limit).map(function(x){return d.lut[x]})
	})	
	
	names = fields.map(function(c){
		return data[c].name
	})

    // TODO handle exit

	var idx = d3.range(limit)


	// vis.selectAll("tr.base")
	//       .data(idx)
	//      .enter().append("tr")
	//       .attr("class", "base")
	//  .selectAll("td.base")
	// 	.data(function(d){return roll.map(function(x, i){return roll[i][d]})})
	// 	.enter().append("td")
	// 	.attr("class", "base")
	// 	.text(function(d){return d})



    vis.append('thead')
		.attr("class","base")
		.append("tr")
      .attr("class", "base header")
	 .selectAll("th.base")
		.data(d3.range(roll.length))
		.enter().append("th")
		.attr("class", "base")
		.text(function(d){return names[d]})
	
 	vis.append('tbody')
		.attr("class","base")
		.selectAll("tr.base")
      .data(idx)
     .enter().append("tr")
      .attr("class", "base")
	 .selectAll("td.base")
		.data(function(d){return roll.map(function(){return d})})
		.enter().append("td")
		.attr("class", "base")
		.text(function(d, i){return roll[i][d]})
	

	
	
  };

  spread.select = function(e) {

     if (e.data) {
		roll = fields.map(function(c){
			 var d = e.data[c]
			 if(d.type==='numeric')
				return d.slice(0, limit)
			return d.slice(0, limit).map(function(x){return d.lut[x]})
		})	

	    // TODO handle exit

		var idx = d3.range(limit)
		
		vis.selectAll('tr.base')
			.selectAll("td.base")
			.text(function(d, i){return roll[i][d]})


	    } else {
			roll = fields.map(function(c){
				 var d = data[c]
				 if(d.type==='numeric')
					return d.slice(0, limit)
				return d.slice(0, limit).map(function(x){return d.lut[x]})
			})	

		    // TODO handle exit

			var idx = d3.range(limit)

			vis.selectAll('tr.base')
				.selectAll("td.base")
				.text(function(d, i){return roll[i][d]})
			
	    }
  };

  spread.rollup = function() { return roll; };

  spread.fields = function() {
    if (arguments.length == 0) return fields;
    fields = arguments;
    field = fields[0];
    return spread;
  };

  spread.options = function() {
	if (arguments.length == 0) return fields;
    opt = arguments[0];
	bins = opt.bins || bins;
    w = opt.width || w;
    h = opt.height || h;
    spread.update();
    return spread;
  };

  spread.type = function() { return "spreadogram"; };

  spread.initUI();
  spread.update();
  return spread;
}dv.scatter = function(id, fields, opt)
{
  var group = this,
      scat = {},
      data = group.data, roll, sroll,
      xfield = fields[0],
      yfield = fields[1],
      bins = opt.bins || 10,
	  dims = opt.dims || [],
      xbins = 0, ybins = 0,
	  qw = 0, qh = 0,
      w = opt.width || 400,
      h = opt.height || 400,
      bx, by, xstep, ystep, q,
      x, y, o, vis, wvis, xmin, xmax, ymin, ymax, xbmax, ybmax, xbmin, ybmin;


  w = w - qw
  h = h - qh
	
  function indices(t) {
    var idx = [], len = t[2].length;
    for (var i=0; i<len; ++i) {
      if (t[2][i] > 0) idx.push(i);
    }
    return idx;
  }

  scat.initUI = function() {
    d3.select("#"+id+" svg").remove();
    wvis = d3.select("#"+id)
      .append("svg:svg")
	    .attr("width", w+qw)
	    .attr("height", h+qh);
	
    vis = wvis
      .append("svg:g")
	  .attr('transform', 'translate(0,  ' + qh + '  )')
	
  };

  scat.initBins = function() {
	var xbin = dv_bins(data[xfield], bins,
        opt.xmin, opt.xmax, opt.xstep);
	xmin = xbin[0]; xmax = xbin[1]; xstep = xbin[2];
    bx = dv.bin(xfield, xstep, xmin, xmax);

    var ybin = dv_bins(data[yfield], bins,
        opt.ymin, opt.ymax, opt.ystep);



    ymin = ybin[0]; ymax = ybin[1]; ystep = ybin[2];
    by = dv.bin(yfield, ystep, ymin, ymax);

    scat.xbin = xbin;
    scat.ybin = ybin;
    xbins = Math.ceil((xmax-xmin)/xstep);
    ybins = Math.ceil((ymax-ymin)/ystep);

    q = {dims:[bx, by], vals:[dv.count("*")]};
  };

  scat.update = function() {
    function opacity(i) {
      var v = roll[2][i];
      return v==0 ? 0 : o(v);
    }
    function mouseout() {
      d3.select(this)
        .style("fill", null)
        .attr("opacity", opacity);
      group.select({source:scat}, 25);
    }
    function mouseover(d, i) {
	
		//console.log(d)
	
      d3.select(this)
        .style("fill", "red")
        .attr("opacity", 1);
      var vx = roll[0][d], vy = roll[1][d], r = {};
      r[xfield] = [vx, vx + xstep];
      r[xfield].ex = (xbmax-vx) === 0// dv.EPSILON;
      r[yfield] = [vy, vy + ystep];
      r[yfield].ex = (ybmax-vy) ===0 //< dv.EPSILON;

	 

      group.select({source:scat, range: r});
    }

    scat.initBins();

	roll = data.query(q);

	partition_results = dv.partition_results(roll, fields, dims.length+1)
	roll = partition_results.clean
	dirty = partition_results.dirty
	

	//console.log(roll)

	var sx = Math.floor(w/xbins),
	    sy = Math.floor(h/ybins),
	    sw = sx * (xbins),
	    sh = sy * (ybins);
	
	//	console.log(sw, sh)
        //sx = w/xbins, sy = h/ybins;

//    x = d3.scale.linear().domain([xmin, xmax]).range([0, w]);
//    y = d3.scale.linear().domain([ymin, ymax]).range([h-sy, -sy]);

	xbmax = d3.max(roll[0])
	xbmin = d3.min(roll[0])
	ybmax = d3.max(roll[1])
	ybmin = d3.min(roll[1])	
	
    x = d3.scale.linear().domain([xbmin, xbmax]).range([0, sw-sx]);
    y = d3.scale.linear().domain([ybmin, ybmax]).range([sh-sy, 0]);
    o = d3.scale.linear().domain([0, d3.max(roll[2])]).range([0.15,1]);

    // TODO handle exit
    var sel = vis.selectAll("rect.base")
      .data(indices(roll));
    sel.enter().append("svg:rect")
      .attr("class", "base")
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);
    sel.exit().remove();

    vis.selectAll("rect.base")
      .attr("x", function(i) { return x(roll[0][i]); })
      .attr("y", function(i) { return y(roll[1][i]); })
      .attr("width", sx)
      .attr("height", sy)
      .attr("opacity", opacity);
  };

  scat.select = function(e) {
    if (e.data) {
      var roll = dv_profile_cache(e, q),

	partition_results = dv.partition_results(roll, fields, dims.length+1)
	roll = partition_results.clean
	console.log(roll)
	dirty = partition_results.dirty

          c = d3.scale.linear()
                .domain([0,d3.max(roll[2])])
                .range([0.15,1]);
				
				
	//console.log(roll)		
				
	  var sel = vis.selectAll("rect.brush")
        .data(indices(roll));
      sel.enter().append("svg:rect")
        .attr("class", "brush")
        .attr("pointer-events", "none")
        .attr("width", Math.floor(w/xbins))
        .attr("height", Math.floor(h/ybins));
      sel.exit().remove();

      vis.selectAll("rect.brush")
        .attr("x", function(i) { return x(roll[0][i]); })
	    .attr("y", function(i) { return y(roll[1][i]); })
		.attr("visibility", "visible")
		.style("opacity", function(i) { return c(roll[2][i]); });
    } else {
      vis.selectAll("rect.brush")
         .attr("visibility","hidden");
    }
  };

  scat.rollup = function() { return roll; };

  scat.fields = function() {
    if (arguments.length == 0) return fields;
    fields = arguments;
    xfield = fields[0];
    yfield = fields[1] || xfield;
    return scat;
  };

  scat.options = function() {
	if (arguments.length == 0) return fields;
    opt = arguments[0];
	bins = opt.bins || bins;
    w = opt.width || w;
    h = opt.height || h;
    scat.update();
    return scat;
  };

  scat.type = function() { return "scatter"; };

  scat.initUI();
  scat.update();
  return scat;
}dv.histogram = function(id, fields, opt)
{
  var group = this,
      hist = {},
      data = group.data, roll, quality,
      field = fields[0],
      bins = opt.bins || 10,
	  dims = opt.dims || [],
      xbins = bins,
      w = opt.width || 400,
	  qheight = 10,
	  xheight = 10,
      h = (opt.height || 194),
	  minh = 4,
	  space = 2,
	  h = h - qheight - space - xheight - space,
      b, step, min, max, q, y, vis, quality_query, qvis, wvis, xvis;


  hist.initUI = function() {
    d3.select("#"+id+" svg").remove();

	wvis = d3.select("#"+id)
	      .append("svg:svg")
		    .attr("width", w)
		    .attr("height", xheight+qheight+h+space);
			
    qvis = wvis
      .append("svg:g")
	    .attr("width", w)
	    .attr("height", qheight);



    vis = wvis
      .append("svg:g")
		.attr("transform", "translate(0,"+(qheight+space)+")")
	    .attr("width", w)
	    .attr("height", h)
		.attr("class", "bordered");
	
	xvis = wvis
      .append("svg:g")
		.attr("transform", "translate(0,"+(h+qheight+space)+")")
	    .attr("width", w)
	    .attr("height", xheight);
  };

  hist.initBins = function() {
	var bin = dv_bins(data[field], bins, opt.min, opt.max, opt.step);
 	min = bin[0]; max = bin[1]; step = bin[2];
    xbins = Math.ceil((max - min) / step);
	
    b = dv.bin(field, step, min, max);
    q = {dims:[b], vals:[dv.count("*")]};
//	quality_query = {vals:[dv.missing(field)]}
  };

  hist.is_clicked = false;
  
  hist.clear_all = function(d, i) {
    for(var j = 0; j < hist.num_bars; j++) {
      vis.selectAll('rect.base:nth-child('+(j+1)+')').style("fill", UNSELECTED);
    }
    group.select({source:hist}, 25);
    hist.range_state = 0;
    
    $('.bin_label').remove();
  }
  hist.make_selection = function(d, i) {
      vis.selectAll('rect.base:nth-child('+(i+1)+')').style("fill", MOUSEOVER);
      var v = roll[0][i],
          r = {};
      r[field] = [v, v+step];
      r[field].ex = Math.abs(v+step - max) < dv.EPSILON;
      group.select({source:hist, range:r});
      
      $('.bin_label').remove();
      var count = roll[0].length;
      if(i > 0 && i < count-1) {
        var dx_val = 200/count*i;
        
        var bin_text = roll[0][i] + " - " + roll[0][i+1];
        var bin_len = ("" + roll[0][i]).length;
        dx_val -= bin_len*4;
        if(dx_val < 10) {
          dx_val = 10;
        }
        var bin_max = dx_val + bin_text.length*4;
        var max_len = ("" + roll[0][roll[0].length - 1]).length*4;
        if(bin_max > 195-max_len) {
          dx_val -= (bin_max - 195 + max_len);
        }
	    xvis.append("svg:text")
			.text(bin_text)
			.attr('dy', '8')
			.attr('dx', dx_val)
			.attr('stroke', 'none')
			.attr('fill', 'black')
			.attr('font-size', '8px')
			.attr('font-family', 'sans-serif')
			.attr('shape-rendering', 'crispedges')
			.attr('text-rendering', 'optimizelegibility')
			.attr('class', 'bin_label');
      }
  }
  
  
  hist.range_start = -1;
  hist.range_end = -1;
  hist.range_state = 0;
  hist.make_ranged_selection = function() {
    if(hist.range_state != 2) {
      return;
    }
    for(var i = hist.range_start; i <= hist.range_end; i++) {
      vis.selectAll('rect.base:nth-child('+(i+1)+')').style("fill", MOUSEOVER);
    }
    var v = roll[0][hist.range_start],
        r = {};
    var dist = step*(hist.range_end - hist.range_start + 1);
    r[field] = [v, v+dist];
    r[field].ex = Math.abs(v+dist - max) < dv.EPSILON;
    group.select({source:hist, range:r});
  }
  hist.update = function() {
    
    function mouseout(d, i) {
      if(!is_clicked_all && hist.range_state == 0) {
        hist.clear_all(d, i);
      }
    }
    function mouseover(d, i) {
      if(!is_clicked_all && hist.range_state == 0) {
        hist.make_selection(d, i);
      }
      else if(hist.range_state == 1) {
        vis.selectAll('rect.base:nth-child('+(i+1)+')').style("fill", MOUSEOVER);
      }
    }
    
    function mousedown(d, i) {
    	clear_click();
    	hist.range_state = 1;
        hist.range_start = i;
        vis.selectAll('rect.base:nth-child('+(i+1)+')').style("fill", MOUSEOVER);
    }
    function mouseup(d, i) {
      hist.range_state = 2;
      if(i < hist.range_start) {
        hist.range_end = hist.range_start;
        hist.range_start = i;
      }
      else {
        hist.range_end = i;
      }
    	
      hist.make_ranged_selection();
      hist.is_clicked = true;
      is_clicked_all = true;
      click_just_happened = false;
    }
    function clicked(d, i) {
        click_just_happened = true;
    }

    hist.initBins();
    roll = data.query(q);
	var roll_len = roll[0].length;
    hist.num_bars = roll_len;
	
	partition_results = dv.partition_results(roll, fields, dims.length+1)
	roll = partition_results.clean

	dirty = partition_results.dirty
	quality = partition_results.summaries[0]

//	quality = data.query(quality_query);
	

    var idx = d3.range(roll[0].length),
        s = Math.floor(w / xbins + 0.5);

    y = d3.scale.linear()
          .domain([0, d3.max(roll[1])])
          .range([h-minh, 0]);

    // TODO handle exit



    vis.selectAll("rect.base")
      .data(idx)
     .enter().append("svg:rect")
      .attr("class", "base")

    vis.selectAll("rect.base")
      .attr("x", function(i) { return s*i; })
      .attr("y", function(i) { 	  var val = y(roll[1][i]);
		          return val >= h - minh ? 0 : val;})
//        return val < h && h - val < minh ? h-minh : val; })
      .attr("width", s-1)
      .attr("height", function(i) {  var val = h - y(roll[1][i]);
          return val <= minh ? 0 : val; });

	    vis.selectAll("rect.pointer")
	      .data(idx)
	     .enter().append("svg:rect")
	      .attr("class", "pointer")

	    vis.selectAll("rect.pointer")
	      .attr("x", function(i) { return s*i; })
	      .attr("y", 0)
	      .attr("width", s-1)
	      .attr("height", h)
			.attr("opacity", 0)
	   		.on("mouseover", mouseover)
	        .on("mouseout", mouseout)
	   		.on("mouseup", mouseup)
	   		.on("mousedown", mousedown)
	   		.on("click", clicked);


    vis.selectAll("rect.brush")
	   .data(idx)
	  .enter().append("svg:rect")
	   .attr("class", "brush");

	vis.selectAll("rect.brush")
	   .attr("x", function(i) { return s*i; })
	   .attr("y", h)
	   .attr("width", s-1)
	   .attr("height", 0);
	
	dv.quality_bar(group, qvis, quality, field, {width:w, height:qheight})
	qvis.append("svg:text")
			.text(data[field].name)
			.attr('dy', '8')
			.attr('dx', '2')
			.attr('stroke', 'none')
			.attr('fill', 'black')
			.attr('font-size', '8px')
			.attr('font-family', 'sans-serif')
			.attr('shape-rendering', 'crispedges')
			.attr('text-rendering', 'optimizelegibility')
	
	dv.bottom_axis(group, xvis, quality, field, {width:w, height:xheight})
	xvis.append("svg:text")
			.text(roll[0][0])
			.attr('dy', '8')
			.attr('dx', '2')
			.attr('stroke', 'none')
			.attr('fill', 'black')
			.attr('font-size', '8px')
			.attr('font-family', 'sans-serif')
			.attr('shape-rendering', 'crispedges')
			.attr('text-rendering', 'optimizelegibility');
	
	var max_strlen = ("" + roll[0][roll[0].length - 1]).length;
	var max_dx = 196 - max_strlen * 4;
	
	xvis.append("svg:text")
			.text(roll[0][roll[0].length - 1])
			.attr('dy', '8')
			.attr('dx', max_dx)
			.attr('stroke', 'none')
			.attr('fill', 'black')
			.attr('font-size', '8px')
			.attr('font-family', 'sans-serif')
			.attr('shape-rendering', 'crispedges')
			.attr('text-rendering', 'optimizelegibility');
  };

  hist.select = function(e) {

    if (e.data) {
      var roll = dv_profile_cache(e,q);
      

     vis.selectAll("rect.brush")
        .attr("y", function(d,i) {
          var val = y(roll[1][i]);
			          return val >= h - minh ? 0 : val;
        })
        .attr("height", function(d,i) {
	      	var val = h - y(roll[1][i]);
		          return val <= minh ? 0 : val; 
        });
    } else {
      vis.selectAll("rect.brush")
        .attr("y", h)
        .attr("height", 0);
    }
  };

  hist.rollup = function() { return roll; };

  hist.fields = function() {
    if (arguments.length == 0) return fields;
    fields = arguments;
    field = fields[0];
    return hist;
  };

  hist.options = function() {
	if (arguments.length == 0) return fields;
    opt = arguments[0];
	bins = opt.bins || bins;
    w = opt.width || w;
    h = opt.height || h;
    hist.update();
    return hist;
  };

  hist.type = function() { return "histogram"; };

  hist.initUI();
  hist.update();
  return hist;
}dv.bar = function(id, fields, opt)
{

  var group = this,
      bar = {},
      data = group.data, roll, quality, oroll,
      field = fields[0],
      bins = opt.bins || 10,
	  dims = opt.dims || [],
      xbins = bins,
      w = opt.width || 400,
	  qheight = 10,
      h = (opt.height || 594),
	  minh = 2,
	  space = 2,
	  menu,
      b, step, min, max, q, y, vis, quality_query, qvis, wvis, sortidx, context, contextw = 20, contexth = h, contexty,	  h = h - qheight, mincw = 1, mouse, xx;



  bar.initUI = function() {
    d3.select("#"+id+" div").remove();

	


	wvis = d3.select("#"+id)
		   .append("div")
			.style("float","left")
			.attr('class', 'chart_area')
	      .append("svg:svg")
		    .attr("width", w)
		    .attr("height", qheight+h)

			// .attr("pointer-events", "all")
		    // .call(d3.behavior.zoom()
		    // .on("zoom", redraw));
	
	var r = wvis.append("svg:g")
		.attr("transform", "translate( " + (w-contextw) +",0)")
		



			

	vis = wvis
      .append("svg:g")
		.attr("transform", "translate(0,"+(qheight+space)+")")
		//.attr("y", 1000)
	    .attr("width", w)
	    .attr("height", h)
		.attr("class", "bordered");


    qvis = wvis
      .append("svg:g")
	    .attr("width", w)
	    .attr("height", qheight);

			function contextmousedown(d, i){

				xx = 1;
			}


	var position = jQuery('#'+id + ' .chart_area').position();

	//menu = dv.options_menu(group, bar, id, {toggler:r, togglerw: contextw, togglerh: qheight, width:w, height:h+qheight, left:position.left+w+6, top:position.top+6})
	// menu = d3.select("#"+id)
	//   .append("div")
	//   .attr("class", "chart_menu")
	//   .style("width", w)
	//   .style("height", h+qheight)
	//   .style("left", position.left+w+6)
	//   .style("top", position.top+6)
	//   .style("position", "absolute")
	//   .style("visibility", "hidden")
	//   .text("ALKLKJDFLJDJ")
	
		
	context = wvis.append("svg:g")
				.attr("transform", "translate(" + (w-contextw) + ", "+(qheight+space)+")")
				.attr("width", contextw)
				.attr("height", contexth)

	context.append('svg:rect')
			.attr("width", contextw)
			.attr('height', contexth)
			.style("fill", '#EFEFEF')
			.style("stroke", '#BCBCBC')
			//.on("mousedown", contextmousedown)
  };

var redraw = function(){
	
}

  bar.redraw = function() {
	  if (d3.event) d3.event.transform(x, y);
  }

  bar.initBins = function() {
	xbins = 12;
	
    b = field//dv.month(field);

    q = {dims:[b], vals:[dv.count("*")]};
//	quality_query = {vals:[dv.missing(field)]}
  };

  bar.update = function() {
    function mouseout(d, i) {
      vis.selectAll('rect.base:nth-child('+(i+1)+')').style("fill", UNSELECTED);
      group.select({source:bar}, 25);
    }
    function mouseover(d, i, e) {

      vis.selectAll('rect.base:nth-child('+(i+1)+')').style("fill", MOUSEOVER);



	  var index = oroll[0].indexOf(roll[0][d])

	  var f = function(t, r){

		return index === data[field][r]
		// var v = tlut[data[field][r]];
		// 
		// 		return (v && new Date(v)).getMonth() === i
	  }

      group.select({filter:f, source:bar});
    }

    bar.initBins();
    roll = data.query(q);
	
	partition_results = dv.partition_results(roll, fields, dims.length+1)
	oroll = roll = partition_results.clean

	roll = dv.sort_multiple(roll, [dims.length+1], [1])
	sortidx = roll.idx;


	
	// var cap = 3;
	// 		var dict = roll[0].filter(function(d, i){ return roll[1][i] > cap})
	// 		console.log(roll[0].length, dict.length)
	// 		var ms = dv.misspellings(roll[0], dict, {cap:3})
	// 		ms = d3.range(ms[0].length).map(function(i){if(ms[0][i]!=-1&&ms[1][i]!=0) return [roll[0][i],roll[0][ms[0][i]]]}).filter(function(d){return d})
	// 		console.log(ms)
	


	dirty = partition_results.dirty
	quality = partition_results.summaries[0]

//	quality = data.query(quality_query);
	

    var idx = d3.range(roll[0].length),
        s = Math.floor(w / xbins + 0.5);

    y = d3.scale.linear()
          .domain([0, d3.max(roll[1])])
          .range([0, w-contextw-space]);

	contextx = d3.scale.linear()
	    .domain([0, d3.max(roll[1])])
	     .range([0, contextw]);
    // TODO handle exit

//	console.log(roll)

	
    vis.selectAll("rect.base")
      .data(idx)
     .enter().append("svg:rect")
      .attr("class", "base")


    vis.selectAll("rect.base")
      .attr("y", function(i) { return s*i; })
      .attr("x", function(i) { 0})
      .attr("height", s-1)
      // .attr("width", function(i) {  var val = h - y(roll[1][i]);
      //     return val > 0 && val < minh ? minh : val; });
      .attr("width", function(i) {  var val = y(roll[1][i]);
          return val <= minh ? 0 : val; });


		  vis.selectAll("rect.pointer")
		      .data(idx)
		     .enter().append("svg:rect")
		      .attr("class", "pointer")

		    vis.selectAll("rect.pointer")
		      .attr("y", function(i) { return s*i; })
		      .attr("x", 0)
		      .attr("width", w-contextw)
		      .attr("height", s-1)
				.attr("opacity", 0)
		   		.on("mouseover", mouseover)
		      .on("mouseout", mouseout);


    vis.selectAll("rect.brush")
	   .data(idx)
	  .enter().append("svg:rect")
	   .attr("class", "brush");

	vis.selectAll("rect.brush")
	   .attr("y", function(i) { return s*i; })
	   .attr("x", 0)
	   .attr("height", s-1)
	   .attr("width", 0);
	
	dv.quality_bar(group, qvis, quality, field, {width:w-contextw-space, height:qheight})

	qvis.append("svg:text")
			.text(data[field].name)
			.attr('dy', '8')
			.attr('dx', '2')
			.attr('stroke', 'none')
			.attr('fill', 'black')
			.attr('font-size', '8px')
			.attr('font-family', 'sans-serif')
			.attr('shape-rendering', 'crispedges')
			.attr('text-rendering', 'optimizelegibility')


		  context.selectAll("rect.context")
		      .data(idx)
		     .enter().append("svg:rect")
		      .attr("class", "context")

	    context.selectAll("rect.context")
	      .attr("y", function(i) { return 2*i; })
	      .attr("x", 0)
	     .attr("width", function(i) {  var val = contextx(roll[1][i]);
	        if(val===0) return 0;  
			return val <= mincw ? mincw : val; })
	      .attr("height", 2)
			.attr("opacity", 1)
	   		.on("mouseover", mouseover)
	      .on("mouseout", mouseout);



		function contextmousedown(d, i){
			console.log('mousedown')
			xx = 1;
		}
		function contextmouseout(d, i){
		  xx = null;
		}
		function contextmouseup(d, i){
		  xx = null;
		}
	   function contextmouseover(d, i) {
			if(1){
				var mouse = d3.svg.mouse(this);
				//console.log(mouse)
				vis.selectAll("rect")
					.attr('transform', "translate(0, " + d*(1-s) + ")")
			}
	    }
	
		//d3.select(window).on('mouseup', contextmouseup)

		context.selectAll("rect.pointer")
		      .data(idx)
		     .enter().append("svg:rect")
		      .attr("class", "pointer")

		    context.selectAll("rect.pointer")
		      .attr("y", function(i) { return 2*i; })
		      .attr("x", 0)
		      .attr("width", w-contextw)
		      .attr("height", 2)
				.attr("opacity", 0)
		   		.on("mouseover", contextmouseover)
		   		// 				.on("mousedown", contextmousedown)
		   		// 				.on("mouseup", contextmouseup);
		      // .on("mouseout", contextmouseout);
			
			// vis.selectAll("rect")
			// .attr('transform', "translate(0, 0)")
  };

  bar.select = function(e) {

    if (e.data) {

    var roll = e.data.query(q)//dv_profile_cache(e,q);

	partition_results = dv.partition_results(roll, fields, dims.length+1)
	roll = partition_results.clean

 	vis.selectAll("rect.brush")
        .attr("width", function(d,i) {
	    	var val = y(roll[1][sortidx[i]]);
			return val <= minh ? 0 : val;
        });
    } else {
      vis.selectAll("rect.brush")
        .attr("width", 0)

    }
  };

  bar.rollup = function() { return roll; };

  bar.fields = function() {
    if (arguments.length == 0) return fields;
    fields = arguments;
    field = fields[0];
    return bar;
  };

  bar.options = function() {
	if (arguments.length == 0) return fields;
    opt = arguments[0];
	bins = opt.bins || bins;
    w = opt.width || w;
    h = opt.height || h;
    bar.update();
    return bar;
  };

  bar.type = function() { return "bar"; };

  bar.initUI();
  bar.update();
  return bar;
}dv.sort = {
	alphabetically:'alphabetically',
	count:'count'
}

dv.options_menu = function(group, vis, id, opt){
	
	var menu = {}, m,
		h = opt.height, w = opt.width, t = opt.top, l = opt.left, toggler = opt.toggler, tw = opt.togglerw, th = opt.togglerh, toggler_image;


	menu.show = function(){
		m.style('visibility', 'visible')
		toggler_image.attr("xlink:href", "style/images/downArrow.png")
		toggler_image.on("mousedown", menu.hide)
	}

	menu.hide = function(){
		m.style('visibility', 'hidden')
		toggler_image.attr("xlink:href", "style/images/rightArrow.png")
		toggler_image.on("mousedown", menu.show)
	}



	
	menu.initUI = function() {
   				
		toggler.append("svg:rect")
			.attr("width", tw)
			.attr("height", th)
			.attr("fill", "#EFEFEF")


		toggler_image = toggler.append("svg:image")
			.attr("width", tw)
			.attr("fill", "#EFEFEF")
			.attr("height", th)
			.attr("class", "menu_toggler")
			.attr("xlink:href", "style/images/downArrow.png")
			.on("mousedown", menu.show)

		m = d3.select("#"+id)
		  .append("div")
		  .attr("class", "chart_menu")
		  .style("width", w)
		  .style("height", h)
		  .style("left", l)
		  .style("top", t)
		  .style("position", "absolute")
		  .style("visibility", "hidden")
		  
	
	}
	
	

	
	menu.update = function(){
		
		menu.add_editor('select', 'Sort', {select_options:{count:'Count', alphabet:'Alphabetically'}})
		
		
	}
	
	menu.add_editor = function(type, name, opt){
		var e = dv.jq(type, opt)
		var label = dv.jq('span').append(name)
		jQuery(m[0]).append(label).append(e)
	}
	
	
	menu.initUI();
	menu.update();
	return menu;
	
	
}dv.schema = function(id, data) {
	
	var schema = {}, vis;
	
	schema.initUI = function() {
	    d3.select("#"+id+" div").remove();

		vis = d3.select("#"+id)
		      .append("div")
	 };
	
	schema.update = function() {
		
		var idx = d3.range(data.length)


		// vis.selectAll("tr.base")
		//       .data(idx)
		//      .enter().append("tr")
		//       .attr("class", "base")
		//  .selectAll("td.base")
		// 	.data(function(d){return roll.map(function(x, i){return roll[i][d]})})
		// 	.enter().append("td")
		// 	.attr("class", "base")
		// 	.text(function(d){return d})

		//var types = dv.sort_multiple([idx, data.map(function(d){return d.type})], [1])
		
		var sorted = idx.filter(function(d){return data[d].type==='nominal'}).concat(idx.filter(function(d){return data[d].type==='numeric'}))
		
		
		idx //= sorted
	    var label = vis.selectAll('div.data_label')
			.data(idx)
			.enter().append('div')
			.attr("class","data_label")	
			.attr("id",function(d){return "data_label" + d})		
		label.append('div')
			 .attr("class", function(d){return "type_icon " + data[d].type})
		
		label.append('div')
			.attr("class", 'data_name')
			.text(function(d){return data[d].name})
			// .on('mousedown', function() {
			// 					var position = jQuery(this).position()
			// 				
			// 					var label = $(this).html();
			// 					$("body").append("<div id='current_drag' class='dragged'>" + label + " chart<\/div>");
			// 					$("#current_drag").draggable();
			// 					$("#current_drag").css("left", '10px');
			// 					$("#current_drag").css("top", position.top+"px");
			// 					var e = document.createEvent('MouseEvents');
			// 					e.initEvent( 'mousedown', true, true );
			// 					$("#current_drag")[0].dispatchEvent(e);
			// 					$('.ui-layout-center').css('background-color', '#ffd');
			// 				});
			
			jQuery('div.data_label').draggable({
				zIndex:3, 
				helper:function(e){return jQuery(this).clone().appendTo('body').addClass('dragged').data('index', jQuery(e.currentTarget).index())},
				start:function(){
					jQuery('.ui-layout-center').addClass('drag_target');
				},
				stop:function(){
					jQuery('.ui-layout-center').removeClass('drag_target');
				}
				
			})
			
	}
	
	
	schema.initUI();
  	schema.update();
  
	return schema;
	
	
}dv.stat = {};
dv.stat.entropy = function(table, field, bins) {
    var dims = [dv_stats_dim(table, field, bins)],
	    vals = [dv.count("*")],
        data = table.query({dims:dims, vals:vals});
    return dv_stats_entropy(data[1]);
};

dv.stat.perplexity = function(table, field, bins) {
    return Math.pow(2, dv.stat.entropy(table, field, bins));
};

dv.stat.mutual = function(table, field1, field2, bins) {
    var dims = [dv_stats_dim(table, field1, bins),
                dv_stats_dim(table, field2, bins)],
	    vals = [dv.count("*")],
        data = table.query({dims:dims, vals:vals, raw:true});
    return dv_stats_mutual(data, false);
};

dv.stat.mutualdist = function(table, field1, field2, bins) {
    var dims = [dv_stats_dim(table, field1, bins),
                dv_stats_dim(table, field2, bins)],
	    vals = [dv.count("*")],
        data = table.query({dims:dims, vals:vals, code:true});
    return dv_stats_mutual(data, true);
};

function dv_stats_dim(table, field, bins) {
	if (table[field].type === dv.type.numeric) {
    	bins = bins || 20;
    	bins = dv_bins(table[field], bins);
        return dv.bin(field, bins[2], bins[0], bins[1]);
	} else {
		return field;
	}
}
 
function dv_stats_entropy(x) {
    var i, p, s=0, H=0;
    for (i=0; i<x.length; ++i) {
        s += x[i];
    }
    if (s == 0) return 0;
    for (i=0; i<x.length; ++i) {
        p = x[i] / s;
        if (p > 0) H += p * Math.log(p)/Math.LN2;
    }
    return -H;
}

function dv_stats_mutual(data, dist) {
	var dist = dist || false,
	    x = data[0], y = data[1], z = data[2],
	    px = dv.array(x.unique),
	    py = dv.array(y.unique),
	    i, s = 0, t, N = z.length, p, I = 0;
	for (i=0; i<N; ++i) {
		px[x[i]] += z[i];
		py[y[i]] += z[i];
		s += z[i];
	}
	t = 1 / (s * Math.LN2);
	for (i=0; i<N; ++i) {
		if (z[i] == 0) continue;
		p = (s * z[i]) / (px[x[i]] * py[y[i]]);
		I += z[i] * t * Math.log(p);
	}
	if (dist) {
		px = dv_stats_entropy(px);
		py = dv_stats_entropy(py);
		return 1.0 - I / (px > py ? px : py);
	} else {
		return I;
	}
}
var thedb;
is_clicked_all = false;
click_just_happened = false;
all_plots = new Array();
all_selections = new Array();
show_text = true;

init_layout = function(in_db) {
	thedb = in_db;
	var numGraphs = 0;
	var numBins = 20;
	
	//array that holds places of all the current grids
	spaces = new Array();
	maxColumns = 4;
	maxRows = 8;
	for(var i = 0; i < maxColumns; i++) {
		var temp = new Array();
		for(var j = 0; j < maxRows; j++) {
			temp.push(false);
		}
		spaces.push(temp);
	}
	
	toggle_text = function() {
		show_text = !show_text;
		for(var i = 0; i < all_plots.length; i++) {
			if(all_plots[i] != "deleted" && all_plots[i].type() == "bar") {
				all_plots[i].set_label_visibility(show_text);
			}
		}
		if(show_text) {
			$('#toggle_text').html('hide text');
		}
		else {
			$('#toggle_text').html('show text');
		}
	}
	
	$('#toggle_text').click(toggle_text);
	
	numericResizeFunc = function(event, ui) {
		//retrieve element from DOM
		var elem_id = $(this).attr('id');
		numericResizeHelper(elem_id);
	};
	
	numericResizeHelper = function(elem_id) {
		var obj = document.getElementById(elem_id);
		var overlap = checkHeightBounds(elem_id);
		if(overlap > 0) {
			var top = $('#' + elem_id).css('top');
			top = parseInt(top.substring(0,top.length-2));
			overlap -= top;
			$('#' + elem_id).height(overlap - 10);
		}
		
		var newHeight = $('#' + elem_id).height() - 2;
		var newWidth = $('#' + elem_id).width() - 2;
		var origWidth = 200; 
		var origHeight = 60;
		var origSubHeight = origHeight - 22;
		var newSubHeight = newHeight - 22;
		//var newHeightRatio = newHeight / origHeight;
		var newSubHeightRatio = newSubHeight / origSubHeight;
		var newWidthRatio = newWidth / origWidth;
		var translate_height = 12 + Math.floor(newHeight/100);
		
		//edit the params of the svg stuff
		//obj.childNodes[0].setAttribute('width', newWidth);
		//obj.childNodes[0].childNodes[0].setAttribute('transform', 'scale(' + newWidthRatio + ',1)');
		obj.childNodes[0].setAttribute('height', newHeight);
		obj.childNodes[0].childNodes[1].setAttribute('transform', 'translate( 0,' + translate_height + ') scale(' + newWidthRatio + ', ' + newSubHeightRatio + ')');
		obj.childNodes[0].childNodes[2].setAttribute('transform', 'translate(0,' + (newHeight - 10) + ')');
	};
	
	barResizeFunc = function(event, ui) {
		//retrieve element from DOM
		var elem_id = $(this).attr('id');
		barResizeHelper(elem_id);
	};
	
	barResizeHelper = function(elem_id) {
		var obj = document.getElementById(elem_id);
		
		var overlap = checkHeightBounds(elem_id);
		if(overlap > 0) {
			var top = $('#' + elem_id).css('top');
			top = parseInt(top.substring(0,top.length-2));
			overlap -= top;
			$('#' + elem_id).height(overlap - 10);
		}
		
		//compute new params
		var newHeight = $('#' + elem_id).height() - 2;
		var newWidth = $('#' + elem_id).width() - 2;
		var newTranslateWidth = newWidth - 20;
		var origWidth = 200; 
		var origHeight = 204;
		var newTranslateHeight = origHeight / newHeight * 12;
		var newHeightRatio = newHeight / origHeight;
		var newTranslateWidthRatio = newTranslateWidth / (origWidth - 20);
		
		//edit the params of the svg stuff
		obj.childNodes[0].childNodes[0].setAttribute('width', newWidth);
		obj.childNodes[0].childNodes[0].setAttribute('height', newHeight);
		obj.childNodes[0].childNodes[0].childNodes[0].setAttribute('transform', 'translate(' + newTranslateWidth + ',0)');
		obj.childNodes[0].childNodes[0].childNodes[1].setAttribute('transform', 'translate( 0,12) scale(' + newTranslateWidthRatio + ', 1.0)');
		obj.childNodes[0].childNodes[0].childNodes[2].setAttribute('transform', 'scale(' + newTranslateWidthRatio + ', 1)'); //TODO: don't hardcode 180
		obj.childNodes[0].childNodes[0].childNodes[3].setAttribute('transform', 'scale(1.0, ' + newHeightRatio + ') translate(' + newTranslateWidth +  ', ' + newTranslateHeight + ')');
	};
	
	//precondition: already falsify spaces[][] from old spot
	reposition_graph = function(new_pos_x, new_pos_y, new_height, id_num) {
		var left = new_pos_x * 212;
		var top = new_pos_y * 72;
		
		$('#graph' + id_num).css('left', left + 'px');
		$('#graph' + id_num).css('top', top + 'px');
		
		var h = new_height * 72 - 10;
		$('#graph' + id_num).height(h);
		if(all_plots[id_num-1].type() == "histogram") {
			numericResizeHelper('graph' + id_num);
		}
		else {
			barResizeHelper('graph' + id_num);
		}
		
		//for now just assuming that w=1 as it always should
		for(var i = new_pos_y; i < new_pos_y+new_height; i++) {
			spaces[new_pos_x][i] = true;
		}
	};
	
	//finds the "optimal" location based on height input (first place where it fits basically)
	automove_naive = function(plot_index, height) {
		var new_pos = new Object();
		for(var i = 0; i < maxColumns; i++) {
			for(var j = 0; j < maxRows - height + 1; j++) {
				var is_space = true;
				for(var k = j; k < j + height; k++) {
					if(spaces[i][k]) {
						is_space = false;
						break;
					}
				}
				if(is_space) {
					new_pos.x = i;
					new_pos.y = j;
					return new_pos;
				}
			}
		}
		
		//TODO: deal with unable to find space
		return -1;
	};
	
	//finds optimal height by using min height that fits all content, or 8 max
	autoresize_naive = function(plot_index) {
		if(all_plots[plot_index] == "deleted") {
			return 0;
		}
		if(all_plots[plot_index].type() == "histogram") {
			return 1;
		}
		else {
			if(all_plots[plot_index].num_bars != undefined) {
				var temp_h = 26 + 18 * all_plots[plot_index].num_bars;
				temp_h = Math.ceil(temp_h / 72);
				if(temp_h > maxRows) {
					temp_h = maxRows;
				}
				return temp_h;
			}
			return 3;
		}
	};
	
	//resizes graphs to a good size, then asks autolayout_naive
	autolayout = function() {
		//clear spaces
		for(var i = 0; i < maxColumns; i++) {
			for(var j = 0; j < maxRows; j++) {
				spaces[i][j] = false;
			}
		}
	
		//auto-layout
		for(var i = 0; i < numGraphs; i++) {
			if(all_plots[i] == "deleted") {
			
			}
			else {
				var new_height = autoresize_naive(i);
				var new_pos = automove_naive(i, new_height);
				reposition_graph(new_pos.x, new_pos.y, new_height, i+1);
			}
		}
	};
	
	$('#autolayout').click(autolayout);
	
	checkHeightBounds = function(elem_id) {
		//compute spaces positioning
		var top = $('#' + elem_id).css('top');
		var left = $('#' + elem_id).css('left');
		top = parseInt(top.substring(0,top.length-2));
		left = parseInt(left.substring(0,left.length-2));
		var h = $('#' + elem_id).height() + 10;
		var w = $('#' + elem_id).width() + 10;
		top /= 72;
		left /= 212;
		h /= 72;
		w /= 212;
		
		//check overlaps with other grids
		for(var i = top; i < top+h; i++) {
			if(spaces[left][i]) {
				//overlap detected
				return i*72;
			}
		}
		
		//check outer boundaries
		if(top + h - 1 >= maxRows) {
			//out of bounds
			return maxRows*72;
		}
		return -1;
	};
	
	moveFunc = function(event, ui) {
		/*
		var elem_id = $(this).attr('id');
		var overlap = checkHeightBounds(elem_id);
		if(overlap > 0) {
			
		}
		*/
	}
	
	moveStartFunc = function(event, ui) {
		//set initial location in spaces to false
		var elem_id = $(this).attr('id');
		var top = $('#' + elem_id).css('top');
		var left = $('#' + elem_id).css('left');
		top = parseInt(top.substring(0,top.length-2));
		left = parseInt(left.substring(0,left.length-2));
		var h = $('#' + elem_id).height() + 10;
		var w = $('#' + elem_id).width() + 10;
		top /= 72;
		left /= 212;
		h /= 72;
		w /= 212;
		//for now just assuming that w=1 as it always should
		for(var i = top; i < top+h; i++) {
			spaces[left][i] = false;
		}
	};
	
	moveStopFunc = function(event, ui) {
		//update spaces to include new size
		var top = $(this).css('top');
		var left = $(this).css('left');
		top = parseInt(top.substring(0,top.length-2));
		left = parseInt(left.substring(0,left.length-2));
		var h = $(this).height() + 10;
		var w = $(this).width() + 10;
		top /= 72;
		left /= 212;
		h /= 72;
		w /= 212;
		
		//for now just assuming that w=1, since there is no width resizing
		
		//check if it's overlapping with any other bros
		var problem = false;
		for(var i = top; i < top+h; i++) {
			if(spaces[left][i]) {
				//houston we got a problem
				//for now we'll just stick it anywhere else that it fits
				//eventually this should be smarter
				var located;
				for(var i = 0; i < maxColumns; i++) {
					for(var j = 0; j < maxRows - h + 1; j++) {
						for(var k = j; k < j+h; k++) {
							if(spaces[i][k]) {
								break;
							}
							if(!spaces[i][k] && k == j+h-1) {
								var topDist = j*72;
								var leftDist = i*212;
								$(this).css('top', topDist + 'px');
								$(this).css('left', leftDist + 'px');
								located = true;
								for(var l = j; l < j+h; l++) {
									spaces[i][l] = true;
								}
							}
						}
						if(located) { break; }
					}
					if(located) { break; }
				}
				problem = true;
				break;
			}
		}
		
		if(!problem) {
			for(var i = top; i < top+h; i++) {
				spaces[left][i] = true;
			}
		}
	};
	
	clear_click = function() {
		if(is_clicked_all) {
			all_selections = new Array();
			for(var i = 0; i < all_plots.length; i++) {
				if(all_plots[i].is_clicked) {
					for(var j = 0; j < all_plots[i].num_bars; j++) {
						all_plots[i].clear_all(0, j);
					}
					all_plots[i].is_clicked = false;
				}
			}
			is_clicked_all = false;
		}
	}
	
	$('body').click(function() {
		if(click_just_happened) {
			click_just_happened = false;
		}
		else {
			clear_click(); //TODO uncomment
		}
	});
	
	createGraph = function(index) {
		var plot_params = thedb.default_plot([index], [], {numBins:20})
		all_plots.push(plot_params.plot);
		numGraphs++;
		
		var idGraphName = '#graph' + numGraphs;
		
		$(idGraphName).draggable({ grid: [212, 72], containment: 'parent' });
		$(idGraphName).bind("dragstart", moveStartFunc);
		$(idGraphName).bind("dragstop", moveStopFunc);
		//$(idGraphName).bind("drag", moveFunc); //don't really need it for now
		$(idGraphName).addClass('category' + index);
		$(idGraphName).css('background-color', '#fff');
		$(idGraphName).css('position', 'absolute');
		
		
		var hslots = 1;
		var wslots = 1;
		var located = false;
		if($(idGraphName).css('height') == '206px') {
			var maxRows_limited = maxRows;
			if(plot_params.num_bars != undefined) {
				var temp_h = 26 + 18 * plot_params.num_bars;
				temp_h = temp_h / 72;
				if(maxRows_limited > temp_h) {
					maxRows_limited = Math.ceil(temp_h);
				}
			}
			hslots = 3;
			for(var i = 0; i < maxColumns; i++) {
				for(var j = 0; j < maxRows - 2; j++) {
					if(!spaces[i][j] && !spaces[i][j+1] && !spaces[i][j+2]) {
						var topDist = j*72;
						var leftDist = i*212;
						$(idGraphName).css('top', topDist + 'px');
						$(idGraphName).css('left', leftDist + 'px');
						located = true;
						spaces[i][j] = true;
						spaces[i][j+1] = true;
						spaces[i][j+2] = true;
						
						//TODO: try to fill the rest of the column, if possible
						var numIncrease = 0;
						for(var k = j+3; k < maxRows_limited; k++) {
							if(spaces[i][k]) {
								break;
							}
							spaces[i][k] = true;
							numIncrease++;
						}
						//increase the graph height by numIncrease
						if(numIncrease > 0) {
							$(idGraphName).height((numIncrease+3) * 72 - 10);
							var newHeight = (numIncrease+3) * 72 - 12;
							var origHeight = 204;
							var newTranslateHeight = origHeight / newHeight * 12;
							var newHeightRatio = newHeight / origHeight;
							
							//edit the params of the svg stuff
							var obj = document.getElementById(idGraphName.substring(1));
							obj.childNodes[0].childNodes[0].setAttribute('height', newHeight);
							obj.childNodes[0].childNodes[0].childNodes[3].setAttribute('transform', 'scale(1.0, ' + newHeightRatio + ') translate(180, ' + newTranslateHeight + ')');
						}
						break;
					}
				}
				if(located) break;
			}
		}
		else if($(idGraphName).css('height') == '62px'){
			for(var i = 0; i < maxColumns; i++) {
				for(var j = 0; j < maxRows; j++) {
					if(!spaces[i][j]) {
						var topDist = j*72;
						var leftDist = i*212;
						$(idGraphName).css('top', topDist + 'px');
						$(idGraphName).css('left', leftDist + 'px');
						located = true;
						spaces[i][j] = true;
						break;
					}
				}
				if(located) break;
			}
		}
		else{
			for(var i = 0; i < maxColumns-1; i++) {
				for(var j = 0; j < maxRows-5; j++) {
					//check vacancy
					vacancy = true;
					for(var k = j; k < j+5; k++) {
						if(spaces[i][k] || spaces[i+1][k]) {
							vacancy = false;
							break;
						}
					}
					
					if(vacancy) {
						var topDist = j*72;
						var leftDist = i*212;
						$(idGraphName).css('top', topDist + 'px');
						$(idGraphName).css('left', leftDist + 'px');
						located = true;
						for(var k = j; k < j+5; k++) {
							spaces[i][k] = true;
							spaces[i+1][k] = true;
						}
						break;
					}
				}
				if(located) break;
			}
		}
		if(!located) {
			$(idGraphName).remove();
			alert('Not enough room, resize existing graphs');
			return;
		}
		
		//resize stuff
		$(idGraphName).resizable({
			grid: [212, 72],
			handles: 's',
			minHeight: 72,
			containment: 'parent'
		});
		$(idGraphName).bind("resizestart", moveStartFunc);
		$(idGraphName).bind("resizestop", moveStopFunc);
		switch(plot_params.type){
			case 'numeric':
				$(idGraphName).bind("resize", numericResizeFunc);
				break
			case 'ordinal':
				$(idGraphName).bind("resize", barResizeFunc);
				break
			case 'nominal':
				$(idGraphName).bind("resize", barResizeFunc);
				break
		}
		
		$(idGraphName).mouseover(function() {
			var classString = $(this).attr('class');
			var classArray = classString.split(' ');
			var graphNum = -1;
			for(var i = 0; i < classArray.length; i++) {
				if(classArray[i].substring(0, 8) == 'category') {
					graphNum = classArray[i].substring(8);
					break;
				}
			}
			var labelClass = 'data_label' + graphNum;
			var graphClass = 'category' + graphNum;
			//$('.' + graphClass).css('background-color', '#fed');
			$('.' + graphClass).css('border', '5px solid #fed');
			$('#' + labelClass).css('background-color', '#fed');
		});
		
		$(idGraphName).mouseout(function() {
			var classString = $(this).attr('class');
			var classArray = classString.split(' ');
			var graphNum = -1;
			for(var i = 0; i < classArray.length; i++) {
				if(classArray[i].substring(0, 8) == 'category') {
					graphNum = classArray[i].substring(8);
					break;
				}
			}
			var labelClass = 'data_label' + graphNum;
			var graphClass = 'category' + graphNum;
			//$('.' + graphClass).css('background-color', '#fff');
			$('.' + graphClass).css('border', '5px solid #fff');
			$('#' + labelClass).css('background-color', '#fff');
		});
		
		$(idGraphName).dblclick(function() {
			var classString = $(this).attr('class');
			var classArray = classString.split(' ');
			var graphNum = -1;
			for(var i = 0; i < classArray.length; i++) {
				if(classArray[i].substring(0, 8) == 'category') {
					graphNum = classArray[i].substring(8);
					break;
				}
			}
			var labelClass = 'data_label' + graphNum;
			var graphClass = 'category' + graphNum;
			//$('.' + graphClass).css('background-color', '#fff');
			$('.' + graphClass).css('border', '5px solid #fff');
			$('#' + labelClass).css('background-color', '#fff');
			
			id_num = parseInt($(this).attr('id').substring(5));
			all_plots[id_num - 1] = "deleted";
			
			//find out where the graph was, and reset spaces to false there
			var top = $(this).css('top');
			var left = $(this).css('left');
			top = parseInt(top.substring(0,top.length-2));
			left = parseInt(left.substring(0,left.length-2));
			var h = $(this).height();
			var w = $(this).width();
			top /= 72;
			left /= 212;
			h /= 72;
			w /= 212;
			//for now just assuming that w=1 as it always should
			for(var i = top; i < top+h; i++) {
				spaces[left][i] = false;
			}
			
			$(this).fadeOut(150, function() { $(this).remove(); });
		});
		
		$(idGraphName).css('border', '5px solid #000');
		$(idGraphName).animate({borderTopColor: '#fff',
			borderBottomColor: '#fff',
			borderLeftColor: '#fff',
			borderRightColor: '#fff'}, 800);
	}
	
	jQuery('.ui-layout-center').droppable({
		drop:function(event, ui){
			
			var index = jQuery(ui.helper).data('index');
			if(index != undefined) {
				createGraph(index);
			}
		}
	})
	
	$('.data_label').mouseover(function() {
		var elem_id = $(this).attr('id');
		var graphClass = 'category' + elem_id.substring(10);
		//$('.' + graphClass).css('background-color', '#fed');
		$('.' + graphClass).css('border', '5px solid #fed');
		$(this).css('background-color', '#fed');
	});
	
	$('.data_label').mouseout(function() {
		var elem_id = $(this).attr('id');
		var graphClass = 'category' + elem_id.substring(10);
		//$('.' + graphClass).css('background-color', '#fff');
		$('.' + graphClass).css('border', '5px solid #fff');
		$(this).css('background-color', '#fff');
	});
	
	$('.data_label').dblclick(function() {
		var elem_id = $(this).attr('id');
		var index = parseInt(elem_id.substring(10));
		createGraph(index);
	});
};
	
})();
