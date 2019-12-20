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
}

_.extendOwn(ShowActiveBillPopup.prototype, CAbstractPopup.prototype);

ShowActiveBillPopup.prototype.PopupTemplate = '%ModuleName%_ShowActiveBillPopup';

ShowActiveBillPopup.prototype.onOpen = function (aOperations, sClientEmail)
{
	this.aOperations(aOperations);
	this.sLabel(TextUtils.i18n('%MODULENAME%/LABEL_ACTIVE_BILL_POPUP', {'EMAIL': sClientEmail}));
};

module.exports = new ShowActiveBillPopup();
