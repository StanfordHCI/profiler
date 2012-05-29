
dw.view.related_view_type = undefined;
dw.view.grouped_suggestions = function(container, opt) {
  opt = opt || {};
  var view = {}, vis,
      suggestions,
      suggestion_view = opt.type || dw.view.suggestion.text,
      selected_suggestion_index;

  view.initUI = function() {

    vis = d3.select(container[0])
            .append('div');
   };

  view.suggestions = function(x) {
    if (!arguments.length) return suggestions;
    suggestions = x;
    return view;
  }

  view.highlight_suggestion = function(x) {
    selected_suggestion_index = x;
    vis.selectAll('div.suggestion')
        .classed("selected_suggestion", function(d, i) {
            return i === selected_suggestion_index;
        })
  }

  view.update = function() {
    var idx, suggestion_containers;
    jQuery(vis[0]).empty();

    function switch_related(d, i) {
      opt.onswitchtype(d);
    }


    function draw_related_options(related_container) {
      var related_type_select = dv.jq('select').attr('id', 'related_type_select');

      related_container.append(dv.jq('div').addClass('related_views_title')
         .text("Related Views:"))



      related_container.append(related_type_select);



      related_container.append(dv.jq('div').addClass('browser_title')
         .text("Anomaly Browser"))

      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}

    	related_type_select.change(function() {
      dw.view.related_view_type = related_type_select.val().toLowerCase();
        opt.onswitchtype(related_type_select.val())
    	})
      var items = ['None', 'Anomalies', 'Data Values'];
      items.forEach(function(ex) {
        add_option(ex, ex);
      })
    }
    function draw_table_options(related_container) {
      var related_type_select = dv.jq('select').attr('id', 'table_type_select');
      related_container.append(related_type_select);

      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}

    	related_type_select.change(function() {
      dw.view.related_view_type = related_type_select.val().toLowerCase();
        opt.onswitchtype(related_type_select.val())
    	})

      add_option(undefined, 'Hide Table');
      ['Show Table'].forEach(function(ex) {
        add_option(ex, ex);
      })
    }

















    function suggestion_clicked(d, i) {
      opt.onclick(i);
    }

    var grouped_suggestions = [];
    suggestions.map(function(s) {
      if (!grouped_suggestions[s.group]) {
        grouped_suggestions[s.group] = [];
      }
      grouped_suggestions[s.group].push(s);
    })

    d3.keys(grouped_suggestions).map(function(k) {
      grouped_suggestions.push(grouped_suggestions[k])
    })

    idx = d3.range(grouped_suggestions.length);

    suggestion_groups = vis.selectAll('div.suggestion_group')
               .data(idx)
               .enter().append('div')
               .attr('class', 'suggestion_group')
              .classed('selected_group', function(d) {return d === 0})


    function switch_group(d, i) {
      jQuery(d3.event.currentTarget).parent().toggleClass('selected_group')
    }

    suggestion_groups.append('div')
                  .attr('class', 'group_type')
                  .text(function(d) {return grouped_suggestions[d][0].group + " (" + grouped_suggestions[d].length + ")"})
                  .on('click', switch_group)



    suggestion_groups.selectAll('div.suggestion')
               .data(function(d) {return grouped_suggestions[d]})
               .enter().append('div')
               .attr('class', 'suggestion')

    suggestion_containers = vis.selectAll('div.suggestion')
               .classed("selected_suggestion", function(d, i) {
                 return i === selected_suggestion_index;
               })
               .on('click', suggestion_clicked)


    suggestion_containers.each(function(d, i) {
      var suggestion = suggestion_view(jQuery(this), {suggest:suggestion_clicked})
      suggestion.suggestion(d)
      suggestion.initUI();
      suggestion.update();
    })
  }

  return view;
};
