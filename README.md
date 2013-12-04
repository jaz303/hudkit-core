# hudkit-core

Provides base functionality for `hudkit`. Includes actions, widgets, root pane, styles, plus some housekeeping. You probably don't want to use this module directly - check out `hudkit` instead.

## API

#### `hk.init([document])`

Initialise hudkit with the given `document` (defaults to `global.document`).

#### `hk.register(fn)`

Register a function to be called when `hudkit` is initialised. This is normally used to register additional widgets using a pattern like this:

    hk.register(require('my-widget'));

Wherein module `my-widget` exports a single function receiving the parameters `hk, k, theme`.

#### `hk.constants`

Dictionary of defined constants.

#### `hk.defineConstant(k, v)`

A define constant `k` with value `v`.

#### `hk.defineConstants(ks)`

Mass-define constants.

#### `hk.styles`

Hudkit's `stylekit` instance for dynamically adding widget styles to the document.

#### `hk.theme`

Shortcut for `hk.styles.vars`; a `wmap` instance used for updating the theme.

#### `hk.action(callback, [opts])`

Create an action function for the given callback. See [hudkit-action](http://github.com/jaz303/hudkit-action) for documentation.