
dp.menu.menu_widget = function (parent_container, name, type, opt) {
  opt = opt || {};
  var editor_id = opt.editor_id, container = dv.jq('div').addClass('editor_container');

  parent_container.append(container);

  function input(container, name, type, opt) {
    var editor = dv.jq('input');
    editor.attr('id', editor_id);
    editor.val(opt.default_value);
    editor.keypress(function(event) {
      if (event.keyCode === 13) {
        opt.onenter(editor.val(), editor.attr('id'));
      }
    });
    container.append(editor);
  }

  function select(container, name, type, opt) {
    var editor = dv.jq('select', opt);
    editor.attr('id', editor_id);
    editor.change(function() {
      opt.onchange(editor.val());
    })
    container.append(editor);
  }

  function label(container, name, type, for_id, opt) {
    var label = dv.jq('label');
    label.attr('for', for_id);
    label.append(name);
    container.append(label);
  }

  label(container, name, type, editor_id, opt);

  switch (type) {
    case dp.menu.menu_widget.type.input:
      input(container, name, type, opt);
    break;
    case dp.menu.menu_widget.type.select:
      select(container, name, type, opt);
    break;
  }
};

dp.menu.menu_widget.type= {
 input:'input',
 select:'select'
};
