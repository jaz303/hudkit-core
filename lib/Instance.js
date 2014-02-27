var fs 			= require('fs'),
	styleTag 	= require('style-tag'),
    action      = require('hudkit-action'),
	registry 	= require('./registry'),
	signals 	= require('./signals'),
	theme 		= require('./theme'),
	constants	= require('./constants');

module.exports = Instance;

var BASE_CSS = fs.readFileSync(__dirname + '/style.unwise', 'utf8');

function Instance(doc) {

    this.document = doc;
    this.appendCSS(BASE_CSS);

    registry.modules().forEach(function(mod) {
    	mod.attach(this);
    }, this);

    this.rootPane = new this.RootPane();

    this.rootEl = this.document.body;
    this.rootEl.className = 'hk';
    this.rootEl.appendChild(this.rootPane.getRoot());

}

Instance.prototype.constants = Instance.prototype.k = constants;
Instance.prototype.action = action;

Instance.prototype.appendCSS = function(css) {

    css = css.replace(/\$(\w+)/g, function(m) {
        return theme[RegExp.$1];
    });

    return styleTag(this.doc, css);

}

// when widget is registered make it available to all hudkit instances
signals.widgetRegistered.connect(function(name, ctor) {
	Instance.prototype[name] = ctor;
});