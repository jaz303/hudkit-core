window.init = function() {
    var hudkit = require('../');
	hudkit.init();
	window.hk = hudkit.instance(window);
};
