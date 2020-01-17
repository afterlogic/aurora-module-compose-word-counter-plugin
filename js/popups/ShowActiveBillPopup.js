/* global App */

'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

/**
 * @constructor
 */
function ShowActiveBillPopup()
{
	CAbstractPopup.call(this);
	
	this.aOperations = ko.observableArray([]);
	this.sLabel = ko.observable("");
	this.totalCost = ko.observable(0);
}

_.extendOwn(ShowActiveBillPopup.prototype, CAbstractPopup.prototype);

ShowActiveBillPopup.prototype.PopupTemplate = '%ModuleName%_ShowActiveBillPopup';

ShowActiveBillPopup.prototype.onOpen = function (aOperations, sClientEmail)
{
	this.aOperations(aOperations);
	var
		 totalCost = 0,
		 currency = '$';
	;
	

	_.each(aOperations, function (oOperation) {
		totalCost += oOperation.Value;
		currency = oOperation.CurrencyId == 1 ? '$' : '€';
	});

	this.totalCost(currency + totalCost.toFixed(2));

	this.sLabel(TextUtils.i18n('%MODULENAME%/POPUP_TITLE_ACTIVE_BILL', {'EMAIL': sClientEmail}));
};

module.exports = new ShowActiveBillPopup();
