var stylekit = require('stylekit');

var hk = {};

var initialized = false,
    styles      = null,
    modules     = [],
    constants   = {};

function initializeModule(mod) {
    if (typeof mod === 'function') {
        // mod(hk, hk.constants, hk.theme);
    }
}

function installDefaultTheme() {

    // TODO: install default theme

}

function installDefaultStyles() {

    var sb = styles.block();

    sb.rule('.hk', {

        // TODO: need macros
        webkitUserSelect: 'none',
        cursor: 'default',

        background: '#101010',
        font: '12px Arial, Helvetica, sans-serif',
        
        a: {
            textDecoration: 'none';
        },
        
        '*': {
            // TODO: need macros
            webkitUserSelect: 'none',
            cursor: 'default'
        }
    
    });

    sb.commit();

}

function init(doc) {

    if (initialized)
        return;

    doc = doc || global.document;

    styles = stylekit(doc);

    installDefaultTheme();
    installDefaultStyles();

    modules.forEach(initializeModule);

    // TODO: create root pane
    
    initialized = true;

}

function register(mod) {

    modules.push(mod);

    if (initialized)
        initializeModule(mod);

}

function defineConstant(key, value) {
    
    if (key in constants) {
        throw new Error("duplicate constant: " + key);
    }

    Object.defineProperty(constants, key, {
        value       : value,
        writable    : false,
        enumerable  : true
    });

}

function defineConstants(cs) {
    for (var k in cs) {
        defineConstant(k, cs[k]);
    }
}

hk.init             = init;
hk.register         = register;
hk.constants        = constants;
hk.defineConstant   = defineConstant;
hk.defineConstants  = defineConstants;
hk.styles           = styles;
hk.theme            = styles.vars;
hk.action           = require('hudkit-action');

register(require('./lib/Widget'));
register(require('./lib/RootPane'));

module.exports = hk;