# hudkit-core

Provides base functionality for `hudkit`. Includes actions, widgets, root pane, styles, plus some housekeeping. You probably don't want to use this module directly - check out `hudkit` instead.

## API

### `hudkit` module

#### `hudkit.register(module)`

Register a module with `hudkit` is initialised. Hudkit modules are objects with two functions:

  * `initialize(ctx)`: perform one-time module initialisation; this probably means registering a custom widget constructor by calling `ctx.registerWidget(name, ctor)`. Check out `lib/Widget/index.js` and `lib/RootPane/index.js` for reference.

  * `attach(instance)`: attach

#### `hudkit.init()`

Initialise hudkit. Calls each registered module's `initialize()` function.

#### `hudkit.instance(document)`

Create an instance of hudkit rooted on the given `document`. Returns an `Instance` object granting access to widget constructors, constants etc.

### `Instance`

In addition to the following every `Instance` will contain a property for each registered widget constructor e.g. `instance.Widget`, `instance.RootPane`.

#### `i.action(callback, [opts])`

Create an action function for the given callback. See [hudkit-action](http://github.com/jaz303/hudkit-action) for documentation.

#### `i.constants`, `i.k`

Dictionary of defined constants.

#### `i.appendCSS(css)`

Append CSS to this instance's `document`.

## Example

    var hudkit = require('hudkit-core');
    hudkit.register(require('my-widget-1'));
    hudkit.register(require('my-widget-2'));
    hudkit.init();

    var hk = hudkit.instance();
