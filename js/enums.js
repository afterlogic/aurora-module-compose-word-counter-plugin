'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {number}
 */
Enums.Currency = {
	'USD': 1,
	'EUR': 2
};

/**
 * @enum {number}
 */
Enums.WordCounterUserRole = {
	'Client': 0,
	'Lawyer': 1
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
