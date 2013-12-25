var stylekit = require('stylekit');

var hk = {};

var initialized = false,
    styles      = null,
    modules     = [],
    constants   = {};

function initializeModule(mod) {
    if (typeof mod === 'function') {
        mod(hk, hk.constants, hk.theme);
    }
}

function installDefaultTheme() {

    var controlFontSize = 10,
        tabPadding      = 7;

    // TODO: stylekit should support assigned of functions as values
    // and give those functions the ability to watch depend on variables.
    // This would make it possible to have the entire stylesheet update correctly
    // when live. (we can't use calc() here because the calculated variables also
    // need to be accessible from Javascript)
    // Maybe this should be a change in wmap...
    var theme = {
        'HK_MONOSPACE_FONT'             : 'Menlo, Monaco, "Liberation Mono", monospace',
        'HK_TEXT_COLOR'                 : '#121729',

        'HK_CONTROL_FONT'               : 'Helvetica, sans-serif',
        'HK_CONTROL_FONT_SIZE'          : controlFontSize + 'px',
        'HK_CONTROL_BORDER_COLOR'       : '#455366',
        'HK_CONTROL_ACTIVE_BG_COLOR'    : '#EAF20F',
        
        'HK_BUTTON_BG_COLOR'            : '#929DA8',

        'HK_ROOT_BG_COLOR'              : '#181E23',

        'HK_CONSOLE_FONT_SIZE'          : '13px',

        'HK_SPLIT_PANE_DIVIDER_SIZE'    : '8px',
        
        'HK_TAB_SPACING'                : '7px',
        'HK_TAB_PADDING'                : tabPadding + 'px',
        'HK_TAB_HEIGHT'                 : (controlFontSize + (2 * tabPadding)) + 'px',
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
        'HK_DIALOG_BORDER_RADIUS'       : '$HK_DIALOG_PADDING',
        'HK_DIALOG_HEADER_HEIGHT'       : '24px',
        'HK_DIALOG_TRANSITION_DURATION' : '200'
    };

    for (var k in theme) {
        hk.theme.set(k, theme[k]);
    }

}

function installDefaultStyles() {

    //
    // Global macros

    var ms = styles.macros;

    ms.noSelect = function() {
        this.attribs({
            webkitUserSelect    : 'none',
            cursor              : 'default'
        });
    };

    ms.controlFont = function() {
        this.attribs({
            font: '$HK_CONTROL_FONT_SIZE $HK_CONTROL_FONT',
            lineHeight: 1
        });
    };

    ms.controlBorder = function() {
        this.attribs({
            border: '1px solid $HK_CONTROL_BORDER_COLOR'
        });
    }

    ms.button = function() {
        this.controlFont();

        this.attribs({
            background: '$HK_BUTTON_BG_COLOR',
            color: '$HK_TEXT_COLOR'
        });

        this.rule('&.disabled', {
            color: '#d0d0d0'
        });

        this.rule('&:not(.disabled):active', {
            background: '$HK_CONTROL_ACTIVE_BG_COLOR'
        });
    };

    ms.borderedButton = function() {
        this.button();
        this.controlBorder();
    };

    //
    // Default styles

    var sb = styles.block();

    sb.rule('.hk', function(b) {
        
        b.noSelect();

        b.attribs({
            background: '#101010',
            font: '12px Arial, Helvetica, sans-serif',
        });

        b.rules({
            a: {
                textDecoration: 'none'
            },
            '*': function() {
                b.noSelect();
            }
        });

    });

    sb.commit();

}

function init(doc) {

    if (initialized)
        return hk.rootPane;

    doc = doc || global.document;

    styles = stylekit(doc);

    hk.styles = styles;
    hk.theme = styles.vars;

    installDefaultTheme();
    installDefaultStyles();

    modules.forEach(initializeModule);

    hk.rootPane = new hk.RootPane();
    hk.rootEl = doc.body;
    doc.body.className = 'hk';
    doc.body.appendChild(hk.rootPane.getRoot());

    initialized = true;

    return hk.rootPane;

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
hk.action           = require('hudkit-action');

register(require('./lib/Widget'));
register(require('./lib/RootPane'));

module.exports = hk;