(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.init = function() {
    var hudkit = require('../');
	hudkit.init();
	window.hk = hudkit.instance(window);
};

},{"../":2}],2:[function(require,module,exports){
var fs          = require('fs'),
    signals     = require('./lib/signals'),
    constants   = require('./lib/constants'),
    theme       = require('./lib/theme'),
    Instance    = require('./lib/Instance'),
    Context     = require('./lib/Context'),
    registry    = require('./lib/registry');

var hk = module.exports = {
    register    : registry.registerModule,
    init        : init,
    instance    : function(doc) { return new Instance(doc); }
};

var initialized = false;

signals.moduleRegistered.connect(function(mod) {
    if (initialized) {
        initializeModule(mod);
    }
});

function initializeModule(mod) {
    mod.initialize(Context, constants, theme);
}

function init() {
    if (initialized) {
        return;
    }
    registry.modules().forEach(initializeModule);
    initialized = true;
}

Context.defineConstants({
    POSITION_MODE_MANUAL        : 'manual',
    POSITION_MODE_AUTO          : 'auto'
});

hk.register(require('./lib/Widget'));
hk.register(require('./lib/RootPane'));

},{"./lib/Context":3,"./lib/Instance":4,"./lib/RootPane":5,"./lib/Widget":6,"./lib/constants":7,"./lib/registry":8,"./lib/signals":9,"./lib/theme":10,"fs":18}],3:[function(require,module,exports){
var registry 	= require('./registry'),
	signals		= require('./signals'),
	constants 	= require('./constants');

// Context object is passed to each registered module's initialize()
// function, allowing them to access select registry methods and 
// all previously registered widgets.
var Context = module.exports = {
	
	registerWidget  : registry.registerWidget,
	
	defineConstant: function(name, value) {
		Object.defineProperty(constants, name, {
			enumerable	: true,
			writable	: false,
			value		: value
		});
	},

	defineConstants: function(constants) {
		for (var k in constants) {
			this.defineConstant(k, constants[k]);
		}
	}

};

signals.widgetRegistered.connect(function(name, ctor) {
	Context[name] = ctor;
});
},{"./constants":7,"./registry":8,"./signals":9}],4:[function(require,module,exports){
var fs 			= require('fs'),
	styleTag 	= require('style-tag'),
    action      = require('hudkit-action'),
	registry 	= require('./registry'),
	signals 	= require('./signals'),
	theme 		= require('./theme'),
	constants	= require('./constants'),
    slice       = Array.prototype.slice;

module.exports = Instance;

var BASE_CSS = ".hk-root {\n\t-webkit-user-select: none;\n\tcursor: default;\n\tbackground: #101010;\n\tfont: 12px $HK_CONTROL_FONT;\n}\n\n.hk-root a {\n\ttext-decoration: none;\n}\n\n.hk-root * {\n\t-webkit-user-select: none;\n\tcursor: default;\n}";

function Instance(window) {

    this.window = window;
    this.document = window.document;
    
    this.appendCSS(BASE_CSS);

    registry.modules().forEach(function(mod) {
    	mod.attach(this);
    }, this);

    this.rootPane = this.rootPane();

    this.rootEl = this.document.body;
    this.rootEl.className = 'hk';
    this.rootEl.appendChild(this.rootPane.getRoot());

}

Instance.prototype.constants = Instance.prototype.k = constants;
Instance.prototype.action = action;

Instance.prototype.appendCSS = function(css) {

    css = css.replace(/\$(\w+)/g, function(m) {
        return theme.get(RegExp.$1);
    });

    return styleTag(this.document, css);

}

// when widget is registered make it available to all hudkit instances
signals.widgetRegistered.connect(function(name, ctor) {

    var method = name[0].toLowerCase() + name.substring(1);

    Instance.prototype[method] = function(a, b, c, d, e, f, g, h) {
        switch (arguments.length) {
            case 0: return new ctor(this);
            case 1: return new ctor(this, a);
            case 2: return new ctor(this, a, b);
            case 3: return new ctor(this, a, b, c);
            case 4: return new ctor(this, a, b, c, d);
            case 5: return new ctor(this, a, b, c, d, e);
            case 6: return new ctor(this, a, b, c, d, e, f);
            case 7: return new ctor(this, a, b, c, d, e, f, g);
            case 8: return new ctor(this, a, b, c, d, e, f, g, h);
            default: throw new Error("too many ctor arguments. sorry :(");
        }
    }

});
},{"./constants":7,"./registry":8,"./signals":9,"./theme":10,"fs":18,"hudkit-action":13,"style-tag":16}],5:[function(require,module,exports){
var fs      = require('fs'),
    trbl    = require('trbl');

var DEFAULT_PADDING = 8;

exports.initialize = function(ctx, k, theme) {

    var RootPane = ctx.Widget.extend(function(_sc, _sm) {

        return [

            function() {

                this._padding           = [DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING];
                this._toolbarVisible    = true;
                this._toolbar           = null;
                this._rootWidget        = null;
                this._resizeDelay       = 500;

                _sc.apply(this, arguments);

                this._setupResizeHandler();

            },

            'methods', {

                dispose: function() {
                    this.setToolbar(null);
                    this.setRootWidget(null);
                    _sm.dispose.call(this);
                },

                setPadding: function(padding) {
                    this._padding = trbl(padding);
                    this._layout();
                },

                setBackgroundColor: function(color) {
                    this._root.style.backgroundColor = color;
                },

                setToolbar: function(widget) {

                    if (widget === this._toolbar)
                        return;

                    if (this._toolbar) {
                        this._removeChildViaElement(this._toolbar, this._root);
                        this._toolbar = null;
                    }

                    if (widget) {
                        this._toolbar = widget;
                        this._attachChildViaElement(this._toolbar, this._root);
                    }

                    this._layout();

                },

                showToolbar: function() {
                    this._toolbarVisible = true;
                    this._layout();
                },
                
                hideToolbar: function() {
                    this._toolbarVisible = false;
                    this._layout();
                },
                
                toggleToolbar: function() {
                    this._toolbarVisible = !this._toolbarVisible;
                    this._layout();
                },
                
                isToolbarVisible: function() {
                    return this._toolbarVisible;
                },

                setRootWidget: function(widget) {

                    if (widget === this._rootWidget)
                        return;

                    if (this._rootWidget) {
                        this._removeChildViaElement(this._rootWidget, this._root);
                        this._rootWidget = null;
                    }

                    if (widget) {
                        this._rootWidget = widget;
                        this._attachChildViaElement(this._rootWidget, this._root);
                    }

                    this._layout();

                },

                setBounds: function(x, y, width, height) {
                    /* no-op; root widget always fills its containing DOM element */
                },

                setResizeDelay: function(delay) {
                    this._resizeDelay = parseInt(delay, 10);
                },

                _buildStructure: function() {
                    this._root = this.document.createElement('div');
                    this._root.className = 'hk-root-pane';
                },

                _layout: function() {
                    
                    var rect        = this._root.getBoundingClientRect(),
                        left        = this._padding[3],
                        top         = this._padding[0],
                        width       = rect.width - (this._padding[1] + this._padding[3]),
                        rootTop     = top,
                        rootHeight  = rect.height - (this._padding[0] + this._padding[2]);
                    
                    if (this._toolbar && this._toolbarVisible) {
                        
                        this._toolbar.setHidden(false);
                        this._toolbar.setBounds(left,
                                                top,
                                                width,
                                                theme.getInt('HK_TOOLBAR_HEIGHT'));
                        
                        var delta = theme.getInt('HK_TOOLBAR_HEIGHT') + theme.getInt('HK_TOOLBAR_MARGIN_BOTTOM');
                        rootTop += delta;
                        rootHeight -= delta;
                    
                    } else if (this._toolbar) {
                        this._toolbar.setHidden(true);
                    }
                    
                    if (this._rootWidget) {
                        this._rootWidget.setBounds(left, rootTop, width, rootHeight);
                    }
                    
                },

                _setupResizeHandler: function() {

                    var self    = this,
                        timeout = null;

                    // FIXME: stash this registration for later unbinding
                    // isn't this what basecamp is for?
                    this.window.addEventListener('resize', function() {
                        if (self._resizeDelay <= 0) {
                            self._layout();    
                        } else {
                            if (timeout) {
                                self._clearTimeout(timeout);
                            }
                            timeout = self._setTimeout(function() {
                                self._layout();
                            }, self._resizeDelay);
                        }
                    });

                }

            }

        ];

    });

    ctx.registerWidget('RootPane', RootPane);

}

exports.attach = function(instance) {
    instance.appendCSS(".hk-root-pane {\n\ttop: 0;\n\tleft: 0;\n\tright: 0;\n\tbottom: 0;\n\toverflow: hidden;\n\tbackground-color: $HK_ROOT_BG_COLOR;\n}");
}

},{"fs":18,"trbl":17}],6:[function(require,module,exports){
var fs 		= require('fs'),
	Class   = require('classkit').Class,
	du 		= require('domutil');

exports.initialize = function(ctx, k, theme) {

    var Widget = Class.extend(function(_sc, _sm) {

        return [

            function(hk, rect) {

                this._hk = hk;
                
                this._parent = null;
                this._hidden = false;
                this._positionMode = k.POSITION_MODE_MANUAL;

                var root = this._buildStructure();
                if (root) this._root = root;
                if (!this._root) throw new Error("widget root not built");
                du.addClass(this._root, 'hk-widget hk-position-manual');

                if (rect) {
                    this.setBounds(rect.x, rect.y, rect.width, rect.height, true);
                } else {
                    var size = this._defaultSize();
                    this.setBounds(0, 0, size.width, size.height);
                }

            },

            'properties', {
                window: {
                    get: function() { return this._hk.window; }
                },
                document: {
                    get: function() { return this._hk.document; }
                }
            },

            'methods', {
                /**
                 * Call on a widget when you're done with it and never want to use it again.
                 *
                 * There is no need to remove this widget's root from the DOM, this guaranteed
                 * to have happened by the time dispose() is called. However, container widgets
                 * *must* remove all of their children (non-recursively).
                 *
                 * Subclasses should override this method to unregister listeners, remove child
                 * widgets and nullify any references likely to cause memory leaks.
                 */
                dispose: function() {
                    this._root = null;
                },

                getRoot: function() { return this._root; },

                getParent: function() { return this._parent; },
                setParent: function(p) { this._parent = p; },

                isHidden: function() { return this._hidden; },
                setHidden: function(hidden) {
                    this._hidden = !!hidden;
                    this._root.style.display = this._hidden ? 'none' : this._cssDisplayMode();
                },

                setRect: function(rect) {
                    return this.setBounds(rect.x, rect.y, rect.width, rect.height);
                },

                /**
                 * Set the position and size of this widget
                 * Of all the public methods for manipulating a widget's size, setBounds()
                 * is the one that does the actual work. If you need to override resizing
                 * behaviour in a subclass (e.g. see hk.RootPane), this is the only method
                 * you need to override.
                 */
                setBounds: function(x, y, width, height) {
                    this._setBounds(x, y, width, height);
                    this._applyBounds();
                },

                /**
                 * A widget's implementation of this method should create that widget's
                 * HTML structure and either assign it to this.root or return it. There
                 * is no need to assign the CSS class `hk-widget`; this is done by the
                 * widget initialiser, but any additional CSS classes must be added by
                 * your code.
                 *
                 * Shortly after it has called _buildStructure(), the initialiser will
                 * call setBounds() - a method you may have overridden to perform
                 * additional layout duties - so ensure that the HTML structure is
                 * set up sufficiently for this call to complete.
                 */
                _buildStructure: function() {
                    throw new Error("widgets must override Widget.prototype._buildStructure()");
                },

                _setBounds: function(x, y, width, height) {
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                },

                _applyBounds: function() {
                    this._applyPosition();
                    this._applySize();
                },

                _unapplyBounds: function() {
                    if (this._positionMode === k.POSITION_MODE_AUTO) {
                        this._root.style.left = '';
                        this._root.style.top = '';
                        this._root.style.width = '';
                        this._root.style.height = '';
                    }
                },

                _applyPosition: function() {
                    if (this._positionMode === k.POSITION_MODE_MANUAL) {
                        this._root.style.left = this.x + 'px';
                        this._root.style.top = this.y + 'px';    
                    }
                },

                _applySize: function() {
                    if (this._positionMode === k.POSITION_MODE_MANUAL) {
                        this._root.style.width = this.width + 'px';
                        this._root.style.height = this.height + 'px';
                    }
                },

                _setPositionMode: function(newMode) {

                    if (newMode === this._positionMode)
                        return;

                    this._positionMode = newMode;

                    if (newMode === k.POSITION_MODE_MANUAL) {
                        du.removeClass(this._root, 'hk-position-auto');
                        du.addClass(this._root, 'hk-position-manual');
                        this._applyBounds();
                    } else if (newMode === k.POSITION_MODE_AUTO) {
                        du.removeClass(this._root, 'hk-position-manual');
                        du.addClass(this._root, 'hk-position-auto');
                        this._unapplyBounds();
                    } else {
                        throw new Error("unknown position mode: " + newMode);
                    }

                },

                _defaultSize: function() {
                    return {width: 100, height: 100};
                },

                _cssDisplayMode: function() {
                    return 'block';
                },

                _attachChildViaElement: function(childWidget, ele) {

                    // TODO: it would probably be better if we just asked the
                    // child to remove itself from the its current parent here
                    // but that pre-supposes a standard interface for removing
                    // elements from "containers", which we don't have yet. And
                    // I'm not willing to commit to an interface that hasn't yet
                    // proven to be required...
                    var existingParent = childWidget.getParent();
                    if (existingParent) {
                        throw "can't attach child widget - child already has a parent!";
                    }

                    ele = ele || this.getRoot();
                    ele.appendChild(childWidget.getRoot());
                    childWidget.setParent(this);

                },

                _removeChildViaElement: function(childWidget, ele) {

                    ele = ele || this.getRoot();
                    ele.removeChild(childWidget.getRoot());
                    childWidget.setParent(null);

                },

                //
                // Timeout/intervals

                _setTimeout: function(fn, timeout) {
                    return this._hk.window.setTimeout(fn, timeout);
                },

                _clearTimeout: function(id) {
                    return this._hk.window.clearTimeout(id);
                },

                _setInterval: function(fn, interval) {
                    return this._hk.window.setInterval(fn, interval);
                },

                _clearInterval: function(id) {
                    return this._hk.window.clearInterval(id);
                }
            
            }
        
        ];

    });

	ctx.registerWidget('Widget', Widget);

}

exports.attach = function(instance) {
	instance.appendCSS(".hk-widget {\n\toverflow: hidden;\n\tbox-sizing: border-box;\n\t-moz-box-sizing: border-box;\n}\n\n.hk-position-manual {\n\tposition: absolute;\n}\n\n.hk-position-auto {\n\t/* placeholder only */\n}\n");
}

},{"classkit":11,"domutil":12,"fs":18}],7:[function(require,module,exports){
module.exports = {};
},{}],8:[function(require,module,exports){
var signals = require('./signals');

module.exports = {
	registerModule	: registerModule,
	modules 		: modules,
	registerWidget	: registerWidget,
	widgets 		: widgets
};

var moduleList 			= [],
	widgetMap 			= {},
	moduleRegistered	= signals.moduleRegistered,
	widgetRegistered	= signals.widgetRegistered;

function registerModule(mod) {
	moduleList.push(mod);
	moduleRegistered.emit(mod);
}

function modules() {
	return moduleList;
}

function registerWidget(name, ctor) {
	if (name in widgetMap) {
		throw new Error("duplicate widget type: " + name);
	}
	widgetMap[name] = ctor;
	widgetRegistered.emit(name, ctor);
}

function widgets() {
	return widgetMap;
}

},{"./signals":9}],9:[function(require,module,exports){
var signal = require('signalkit');

function s(signalName) {
	exports[signalName] = signal(signalName);
}

s('moduleRegistered');
s('widgetRegistered');
},{"signalkit":15}],10:[function(require,module,exports){
// TODO: this is eventually to be handled by Unwise,
// with live updating when themes change.

var theme = {
    'HK_MONOSPACE_FONT'             : 'Menlo, Monaco, "Liberation Mono", monospace',
    'HK_TEXT_COLOR'                 : '#121729',

    'HK_CONTROL_FONT'               : 'Helvetica, sans-serif',
    'HK_CONTROL_FONT_SIZE'          : '10px',
    'HK_CONTROL_BORDER_COLOR'       : '#455366',
    'HK_CONTROL_ACTIVE_BG_COLOR'    : '#EAF20F',
    
    'HK_BUTTON_BG_COLOR'            : '#929DA8',

    'HK_ROOT_BG_COLOR'              : '#181E23',

    'HK_CONSOLE_FONT_SIZE'          : '13px',

    'HK_SPLIT_PANE_DIVIDER_SIZE'    : '8px',
    
    'HK_TAB_SPACING'                : '7px',
    'HK_TAB_PADDING'                : '7px',

    // control font size + 2 * tab padding
    'HK_TAB_HEIGHT'                 : '24px',
    'HK_TAB_BORDER_RADIUS'          : '5px',
    'HK_TAB_BACKGROUND_COLOR'       : '#67748C',

    'HK_BLOCK_BORDER_RADIUS'        : '10px',

    'HK_TOOLBAR_HEIGHT'             : '18px',
    'HK_TOOLBAR_ITEM_BORDER_COLOR'  : '#A6B5BB',
    'HK_TOOLBAR_MARGIN_TOP'         : '8px',
    'HK_TOOLBAR_MARGIN_RIGHT'       : '8px',
    'HK_TOOLBAR_MARGIN_BOTTOM'      : '8px',
    'HK_TOOLBAR_MARGIN_LEFT'        : '8px',

    // Unused currently...
    'HK_DIALOG_PADDING'             : '6px',
    'HK_DIALOG_BORDER_RADIUS'       : '6px',
    'HK_DIALOG_HEADER_HEIGHT'       : '24px',
    'HK_DIALOG_TRANSITION_DURATION' : '200'
};

module.exports = {
    get: function(k) {
        return theme[k];
    },
    getInt: function(k) {
        return parseInt(k, 10);
    }
};

},{}],11:[function(require,module,exports){
function Class() {};
  
Class.prototype.method = function(name) {
  var self = this, method = this[name];
  return function() { return method.apply(self, arguments); }
}

Class.prototype.lateBoundMethod = function(name) {
  var self = this;
  return function() { return self[name].apply(self, arguments); }
}

Class.extend = function(fn) {

  var features = fn ? fn(this, this.prototype) : [function() {}];
  
  var ctor = features[0];
  ctor.prototype = Object.create(this.prototype);
  
  ctor.extend = this.extend;
  ctor.Features = Object.create(this.Features);
    
  for (var i = 1; i < features.length; i += 2) {
    this.Features[features[i]](ctor, features[i+1]);
  }
  
  return ctor;
  
};

Class.Features = {
  methods: function(ctor, methods) {
    for (var methodName in methods) {
      ctor.prototype[methodName] = methods[methodName];
    }
  },
  properties: function(ctor, properties) {
    Object.defineProperties(ctor.prototype, properties);
  }
};

exports.Class = Class;

},{}],12:[function(require,module,exports){
// Constants from jQuery
var rclass = /[\t\r\n]/g;
var core_rnotwhite = /\S+/g;

var DataStore         = {},
    kDataStoreNextIx  = 1,
    kDataKey          = 'du-data-key';

var __window = typeof window === 'undefined'
                ? null
                : window;

var __document = typeof document === 'undefined'
                  ? null
                  : document;

function generateElementKey() {
  return kDataStoreNextIx++;
}

module.exports = {
  init: function(window, document) {
    __window = window;
    __document = document;
  },

  data: function(el, key, val) {
    var elementKey = el.getAttribute(kDataKey);
    if (!elementKey) {
      elementKey = generateElementKey();
      el.setAttribute(kDataKey, elementKey);
    }

    var elementData = DataStore[elementKey];
    
    if (arguments.length === 2) {
      if (typeof key === 'undefined') {
        delete DataStore[elementKey];
      } else {
        return elementData ? elementData[key] : undefined;
      }
    } else if (arguments.length === 3) {
      if (typeof val === 'undefined') {
        if (elementData) {
          delete elementData[key];
        }
      } else {
        if (!elementData) {
          elementData = {};
          DataStore[elementKey] = elementData;
        }
        elementData[key] = val;
      }
    } else {
      throw "data() - invalid arguments";
    }
  },

  // from jQuery
  hasClass: function(ele, className) {
    className = " " + className + " ";
    return (" " + ele.className + " ").replace(rclass, " ").indexOf(className) >= 0;
  },

  // from jQuery
  addClass: function(ele, value) {
    var classes = (value || "").match(core_rnotwhite) || [],
        cur = ele.className ? (" " + ele.className + " ").replace(rclass, " ") : " ";

    if (cur) {
      var j = 0, clazz;
      while ((clazz = classes[j++])) {
        if (cur.indexOf(" " + clazz + " ") < 0) {
          cur += clazz + " ";
        }
      }
      ele.className = cur.trim();
    }
  },

  // from jQuery
  removeClass: function(ele, value) {
    var classes = (value || "").match(core_rnotwhite) || [],
        cur = ele.className ? (" " + ele.className + " ").replace(rclass, " ") : " ";

    if (cur) {
      var j = 0, clazz;
      while ((clazz = classes[j++])) {
        while (cur.indexOf(" " + clazz + " ") >= 0) {
          cur = cur.replace(" " + clazz + " ", " ");
        }
        ele.className = value ? cur.trim() : "";
      }
    }
  },

  toggleClass: function(ele, value) {
    var classes = (value || "").match(core_rnotwhite) || [],
        cur = ele.className ? (" " + ele.className + " ").replace(rclass, " ") : " ";

    if (cur) {
      var j = 0, clazz;
      while ((clazz = classes[j++])) {
        var removeCount = 0;
        while (cur.indexOf(" " + clazz + " ") >= 0) {
          cur = cur.replace(" " + clazz + " ", " ");
          removeCount++;
        }
        if (removeCount === 0) {
          cur += clazz + " ";
        }
        ele.className = cur.trim();
      }
    }
  },

  viewportSize: function() {
    return {
      width: __document.documentElement.clientWidth,
      height: __document.documentElement.clientHeight
    };
  },

  stop: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  },

  setPosition: function(el, x, y) {
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  },

  setSize: function(width, height) {
    el.style.width = width + 'px';
    el.style.height = height + 'px';
  },

  isElement: function(el) {
    return el && el.nodeType === 1;
  }
};
},{}],13:[function(require,module,exports){
var signal = require('signalkit');

var ActionProto = Object.create(Function.prototype);

ActionProto.getTitle = function() { return this._title; };
ActionProto.setTitle = function(t) { this._title = ('' + t); this.onchange.emit(); };

ActionProto.isEnabled = function() { return this._enabled; };
ActionProto.toggleEnabled = function() { this.setEnabled(!this._enabled); };
ActionProto.enable = function() { this.setEnabled(true); };
ActionProto.disable = function() { this.setEnabled(false); };

ActionProto.setEnabled = function(en) {
    en = !!en;
    if (en != this._enabled) {
        this._enabled = en;
        this.onchange.emit();
    }
}

module.exports = function(fn, opts) {

    var actionFun = function() {
        if (actionFun._enabled) {
            return fn.apply(null, arguments);
        }
    }

    opts = opts || {};

    actionFun._title    = ('title' in opts) ? ('' + opts.title) : '';
    actionFun._enabled  = ('enabled' in opts) ? (!!opts.enabled) : true;
    actionFun.onchange  = signal('onchange');
    actionFun.__proto__ = ActionProto;

    return actionFun;

}

},{"signalkit":14}],14:[function(require,module,exports){
(function (process){//
// Helpers

if (typeof process !== 'undefined') {
    var nextTick = process.nextTick;
} else {
    var nextTick = function(fn) { setTimeout(fn, 0); }
}

function makeUnsubscriber(listeners, handlerFn) {
    var cancelled = false;
    return function() {
        if (cancelled) return;
        for (var i = listeners.length - 1; i >= 0; --i) {
            if (listeners[i] === handlerFn) {
                listeners.splice(i, 1);
                cancelled = true;
                break;
            }
        }
    }
}

//
// Signals

function Signal(name) {
    this.name = name;
    this._listeners = [];
}

Signal.prototype.onError = function(err) {
    nextTick(function() { throw err; });
}

Signal.prototype.emit = function() {
    for (var ls = this._listeners, i = ls.length - 1; i >= 0; --i) {
        try {
            ls[i].apply(null, arguments);
        } catch (err) {
            if (this.onError(err) === false) {
                break;
            }
        }
    }
}

Signal.prototype.connect = function(target, action) {
    if (target && action) {
        var handler = function() {
            target[action].apply(target, arguments);
        }
    } else if (typeof target === 'function') {
        var handler = target;
    } else {
        throw "signal connect expects either handler function or target/action pair";
    }
    this._listeners.push(handler);
    return makeUnsubscriber(this._listeners, handler);
}

Signal.prototype.clear = function() {
    this._listeners = [];
}

//
// Exports

module.exports = function(name) { return new Signal(name); }
module.exports.Signal = Signal;}).call(this,require("/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":19}],15:[function(require,module,exports){
module.exports=require(14)
},{"/usr/local/lib/node_modules/watchify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":19}],16:[function(require,module,exports){
// adapted from
// http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
module.exports = function(doc, initialCss) {
    
    if (typeof doc === 'string') {
        initialCss = doc;
        doc = null;
    }

    doc = doc || document;

    var head    = doc.getElementsByTagName('head')[0],
        style   = doc.createElement('style');

    style.type = 'text/css';
    head.appendChild(style);

    function set(css) {
        css = '' + (css || '');
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            while (style.childNodes.length) {
                style.removeChild(style.firstChild);
            }
            style.appendChild(doc.createTextNode(css));
        }
    }

    set(initialCss || '');

    set.el = style;
    set.destroy = function() {
        head.removeChild(style);
    }

    return set;

}
},{}],17:[function(require,module,exports){
// [a] => [a,a,a,a]
// [a,b] => [a,b,a,b]
// [a,b,c] => [a,b,c,b]
// [a,b,c,d] => [a,b,c,d]
// a => [(int)a, (int)a, (int)a, (int)a]
module.exports = function(thing) {
    if (Array.isArray(thing)) {
        switch (thing.length) {
            case 1:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[0], 10),
                    parseInt(thing[0], 10),
                    parseInt(thing[0], 10)
                ];
            case 2:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10),
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10)
                ];
            case 3:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10),
                    parseInt(thing[2], 10),
                    parseInt(thing[1], 10)
                ];
            case 4:
                return [
                    parseInt(thing[0], 10),
                    parseInt(thing[1], 10),
                    parseInt(thing[2], 10),
                    parseInt(thing[3], 10)
                ];
            default:
                throw new Error("trbl - array must have 1-4 elements");
        }
    } else {
        var val = parseInt(thing);
        return [val, val, val, val];
    }
}
},{}],18:[function(require,module,exports){

},{}],19:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1])