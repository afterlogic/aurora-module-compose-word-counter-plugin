'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	$html = $('html')
;

/**
 * @constructor
 */
function CMobileSettingsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.appsDom = null;
	this.showApps = ko.observable(false);
				
	this.typingSpeedValues = [
		{ name: 'Slow',		value: 100 },
		{ name: 'Medium',	value: 140 },
		{ name: 'Fast',		value: 180 }
	];
	this.typingSpeed = ko.observable((Settings.TypingSpeedCPM === 140 || Settings.TypingSpeedCPM === 180) ? Settings.TypingSpeedCPM : 100);
	this.typingSpeedCPM = ko.observable(Settings.TypingSpeedCPM);
	this.readingSpeedValues = [
		{ name: 'Slow',		value: 170 },
		{ name: 'Medium',	value: 220 },
		{ name: 'Fast',		value: 270 }
	];
	
	this.readingSpeed = ko.observable((Settings.ReadingSpeedWPM === 220 || Settings.ReadingSpeedWPM === 270) ? Settings.ReadingSpeedWPM : 170);
	this.readingSpeedWPM = ko.observable(Settings.ReadingSpeedWPM);
	this.currencyValues = [
		{ name: '$USD',		value: Enums.Currency.USD },
		{ name: '€EUR',		value: Enums.Currency.EUR }
	];
	this.currency = ko.observable(Settings.Currency);
	this.hourlyRate = ko.observable(Settings.HourlyRate);
	this.billingIntervalValues = [
		{ name: TextUtils.i18n('%MODULENAME%/LABEL_HOURLY_BILLING_INTERVAL_VALUE_PLURAL', { 'COUNT': 1 }, null, 1), value: 1 },
		{ name: TextUtils.i18n('%MODULENAME%/LABEL_HOURLY_BILLING_INTERVAL_VALUE_PLURAL', { 'COUNT': 6 }, null, 6), value: 6 },
		{ name: TextUtils.i18n('%MODULENAME%/LABEL_HOURLY_BILLING_INTERVAL_VALUE_PLURAL', { 'COUNT': 10 }, null, 10), value: 10 },
		{ name: TextUtils.i18n('%MODULENAME%/LABEL_HOURLY_BILLING_INTERVAL_VALUE_PLURAL', { 'COUNT': 15 }, null, 15), value: 15 }
	];
	this.billingInterval = ko.observable(Settings.BillingInterval);
	
	this.typingSpeed.subscribe(function (newValue) {
		this.typingSpeedCPM(newValue);
	}, this);
	this.readingSpeed.subscribe(function (newValue) {
		this.readingSpeedWPM(newValue);
	}, this);
	
	this.isSaving = ko.observable(false);
}

_.extendOwn(CMobileSettingsView.prototype, CAbstractScreenView.prototype);

CMobileSettingsView.prototype.ViewTemplate = '%ModuleName%_MobileSettingsView';
CMobileSettingsView.prototype.ViewConstructorName = 'CMobileSettingsView';

CMobileSettingsView.prototype.onShow = function ()
{
	$html.addClass('non-adjustable');
	if (this.appsDom === null)
	{
		this.appsDom = $('#apps-list');
		this.appsDom.on('click', function () {
			this.showApps(false);
		}.bind(this));

		this.showApps.subscribe(function (value) {
			$('body').toggleClass('with-panel-right-cover', value);
		}, this);
	}
};

CMobileSettingsView.prototype.getParametersForSave = function ()
{
	return {
		'TypingSpeedCPM': Types.pInt(this.typingSpeedCPM()),
		'ReadingSpeedWPM': Types.pInt(this.readingSpeedWPM()),
		'CurrencyId': Types.pInt(this.currency()),
		'HourlyRate': Types.pInt(this.hourlyRate()),
		'BillingInterval': Types.pInt(this.billingInterval())
	};
};

CMobileSettingsView.prototype.save = function () {
	if (this.validateBeforeSave())
	{
		this.isSaving(true);

		Ajax.send(Settings.ServerModuleName, 'UpdateMobileSettings', this.getParametersForSave(), this.onResponse, this);
	}
};

CMobileSettingsView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var oParameters = oRequest.Parameters;
		
//		this.updateSavedState();

		this.applySavedValues(oParameters);
		
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

CMobileSettingsView.prototype.validateBeforeSave = function ()
{
	if (Types.pInt(this.typingSpeedCPM()) < 1)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_DATA', {
			'FIELDNAME': TextUtils.i18n('%MODULENAME%/LABEL_TYPING_SPEED')
		}));

		return false;
	}

	if (Types.pInt(this.readingSpeedWPM()) < 1)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_DATA', {
			'FIELDNAME': TextUtils.i18n('%MODULENAME%/LABEL_READING_SPEED')
		}));

		return false;
	}

	if (Types.pInt(this.hourlyRate()) < 1)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_DATA', {
			'FIELDNAME': TextUtils.i18n('%MODULENAME%/LABEL_HOURLY_RATE')
		}));

		return false;
	}

	return true;
};

CMobileSettingsView.prototype.applySavedValues = function ()
{
	Settings.update(this.typingSpeedCPM(), this.readingSpeedWPM(), this.currency(), this.hourlyRate(), this.billingInterval());
};

module.exports = new CMobileSettingsView();
