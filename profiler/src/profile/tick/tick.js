dp.tick = {};

var BILLION = 1000000000, MILLION = 1000000, THOUSAND = 1000;
dp.tick.pretify = function(val) {
  if (val >= BILLION) {
    val = Math.ceil(val / BILLION) + 'B';
  } else if (val >= MILLION) {
    val = Math.ceil(val / MILLION) + 'M';
  } else if (val >= THOUSAND) {
    val = Math.ceil(val / THOUSAND) + 'K';
  }
  return val;
}
