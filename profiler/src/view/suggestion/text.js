dp.view.suggestion = {};

dp.view.suggestion.text = function(container, opt) {
  var view = dw.view.suggestion(container, opt)

  view.update = function() {
    var suggestion = view.suggestion(),
        vis = view.vis();

    if (!suggestion) {
      return;
    }

    vis.append('div').classed('suggestion_title', true).text(suggestion.text())


    function draw_menu(related_container) {

      var rundetector = function() {
        /* TODO: fix bug in paritioning code. */
      }
      related_container.append(dv.jq('div').width(120).text("Run Detector").css('text-decoration', 'underline').click(rundetector));

      var related_type_select = dv.jq('select').attr('id', 'anomaly_type_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})
      var names = ['Levenshtein'];
      names.forEach(function(ex) {
        add_option(ex, ex);
      })

      var related_type_select = dv.jq('select').attr('id', 'anomaly_type_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})
    	add_option("Radius: 2", "Threshold: 3")
      var groups = ["2", "3", "", ""];
      groups.forEach(function(ex) {
        add_option(ex.name, ex.name);
      })


      related_container.append(dv.jq('div').width(120).text("Partitions:"));

      var related_type_select = dv.jq('select').attr('id', 'partition_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})

    	add_option("Column:", "Column:")
      movies_data.forEach(function(ex) {
        add_option(ex.name, ex.name);
      })

      var related_type_select = dv.jq('select').attr('id', 'partition_select');
      related_container.append(related_type_select);
      add_option = function(type, name) {
    		dv.add_select_option(related_type_select, name, type);
    	}
    	related_type_select.change(function() {

    	})
    	add_option("Group:", "Group:")
      var groups = ["Year", "Quarter", "Month", "Day"];
      groups.forEach(function(ex) {
        add_option(ex, ex);
      })
      related_container.append(dv.jq('div').width(120).text("Add Partition").css('text-decoration', 'underline'));

    }

    if (suggestion.routines) {
      vis.append('div').classed('suggestion_routine', true).text("(" + suggestion.routines[0] + ")")


        function togglemenu(d, i) {
          menu_div.classed('displayed_menu', !menu_div.classed('displayed_menu'))
          d3.event.stopImmediatePropogation();
        }
      var menu_div = vis.append('div').classed('suggestion_menu',true);
      draw_menu(jQuery(menu_div[0]))

    }

  }

  return view;
};
