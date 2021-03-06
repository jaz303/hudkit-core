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

hk.register(require('./lib/Widget'));
hk.register(require('./lib/RootPane'));
