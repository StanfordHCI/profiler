dp.editor.range = function(container, fields, opt) {
  var input = dp.editor(container, fields, opt),
      container = input.container(),
      slider;

  slider = container
      .append("div")
      .attr('height', input.height())
      .attr('width', input.width());


  jQuery(slider).slider({
  			range: true,
  			min: 0,
  			max: 500,
  			values: [ 75, 300 ],
  			slide: function( event, ui ) {
  				$( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
  			}
  		});

  return input;
};