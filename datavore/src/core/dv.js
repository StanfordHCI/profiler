

/**
 * The top-level Datavore namespace. All public methods and fields should be
 * registered on this object. Note that core Datavore source is surrounded by an
 * anonymous function, so any other declared globals will not be visible outside
 * of core methods. This also allows multiple versions of Datavore to coexist,
 * since each version will see their own <tt>dv</tt> namespace.
 *
 * @namespace The top-level Datavore namespace, <tt>dv</tt>.
 */
dv = {};

/**
 * Datavore major and minor version numbers.
 *
 * @namespace Datavore major and minor version numbers.
 */
dv.version = {
  /**
   * The major version number.
   *
   * @type number
   * @constant
   */
  major: 0,

  /**
   * The minor version number.
   *
   * @type number
   * @constant
   */
  minor: 1
};

/**
 * @private Reports the specified error to the JavaScript console. Mozilla only
 * allows logging to the console for privileged code; if the console is
 * unavailable, the alert dialog box is used instead.
 *
 * @param e the exception that triggered the error.
 */
dv.error = function (e) {
  (typeof console == "undefined") ? alert(e) : console.error(e);
};

/**
 * @private Registers the specified listener for events of the specified type on
 * the specified target. For standards-compliant browsers, this method uses
 * <tt>addEventListener</tt>; for Internet Explorer, <tt>attachEvent</tt>.
 *
 * @param target a DOM element.
 * @param {string} type the type of event, such as "click".
 * @param {function} the event handler callback.
 */
dv.listen = function (target, type, listener) {
  listener = dv.listener(listener);
  return target.addEventListener
    ? target.addEventListener(type, listener, false)
    : target.attachEvent("on" + type, listener);
};

/**
 * @private Returns a wrapper for the specified listener function such that the
 * {@link dv.event} is set for the duration of the listener's invocation. The
 * wrapper is cached on the returned function, such that duplicate registrations
 * of the wrapped event handler are ignored.
 *
 * @param {function} f an event handler.
 * @returns {function} the wrapped event handler.
 */
dv.listener = function (f) {
  return f.$listener || (f.$listener = function (e) {
    try {
      dv.event = e;
      return f.call(this, e);
    } finally {
      delete dv.event;
    }
  });
};