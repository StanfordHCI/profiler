upload.app = function (opt) {
  opt = opt || {};
  var upload_button, text_area, prompt, container, example_prompt, example_select, example_tables,
      examples = opt.examples || [{name:'Simple', value:dv.table(simple)}, {name:'Water', value:dv.table(water2_data)}],// {name:'Health', value:dv.table(health)}]//{name:'SimpleGeo', value:dv.table(simple_geo)} , {name:'Crime', value:crime}, {name:'SimpleMissing', value:dv.table(simple_missing)}, {name:'Earthquakes', value:dv.table(earthquakes)}, {name:'Quality of Life', value:dv.table(quality_data)}, {name:'Movies', value:dv.table(movies_data)}, {name:"National DL", value:dv.table(national_dl_data)}, {name:"Urban Population", value:dv.table()}],
      onupload = opt.onupload, parent = opt.parent || '#app_container';

  example_tables = {};
  examples.map(function(ex) {
    if (typeOf(ex.value) !== 'string') {
      example_tables[ex.name] = ex.value;
    }
  })

  example_select = dv.jq('select').attr('id', 'upload_example_select');
	example_prompt = dv.jq('span').append('Example Data:').attr('id', 'example_prompt');
  container = dv.jq('div').attr('id', 'upload_container');
	prompt = dv.jq('div').attr('id','upload_prompt').append('Paste data below to begin wrangling').addClass('upload_prompt');
  upload_button = dv.jq('button').attr('id','upload_submit').append('Wrangle');
  text_area = dv.jq('textArea').attr('id', 'upload_text_area');

  var add_export_option = function(type, name){
		dv.add_select_option(example_select, name, type);
	}

  var choose_example = function() {
    var val = example_select.val(), table;
    if(table = example_tables[examples[example_select[0].selectedIndex].name]) {
      submit_data(table)
      return;
    }
    text_area.attr('value', example_select.val());
  }

	example_select.change(function() {
		choose_example();
	})

  examples.forEach(function(ex) {
    add_export_option(ex.value, ex.name);
  })

  var submit_data = function(parsed_table) {
    var uploaded_text, types;
    if(!parsed_table) {
      uploaded_text = text_area.attr('value');
      parsed_table = upload.upload_text(uploaded_text);
    }

    types = dt.inference.simple().infer_types(parsed_table);

    parsed_table.recode(types);


    if(onupload) {
      // TODO: Mark if uploaded text is demo text.
      jQuery(parent).empty();
      onupload(parsed_table, {text:uploaded_text, example:undefined});
    }
  };

  upload_button.click(function() {
    submit_data();
  })

  jQuery(parent).append(container);
  container.append(prompt).append(example_prompt).append(example_select).append(upload_button).append(text_area);
  if (opt.debug) choose_example();
}