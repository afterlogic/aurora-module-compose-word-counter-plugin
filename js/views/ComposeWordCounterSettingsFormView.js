'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function ComposeWordCounterFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.typingSpeedValues = [
		{ name: 'Slow',		value: 100 },
		{ name: 'Medium',	value: 140 },
		{ name: 'Fast',		value: 180 }
	];
	this.typingSpeed = ko.observable(100);
	this.typingSpeedCPM = ko.observable(Settings.typingSpeedCPM() ? Settings.typingSpeedCPM() : 100);
	this.readingSpeedValues = [
		{ name: 'Slow',		value: 170 },
		{ name: 'Medium',	value: 220 },
		{ name: 'Fast',		value: 270 }
	];
	this.readingSpeed = ko.observable(170);
	this.readingSpeedWPM = ko.observable(Settings.readingSpeedWPM() ? Settings.readingSpeedWPM() : 170);
	this.currencyValues = [
		{ name: '$USD',		value: Enums.Currency.USD },
		{ name: '€EUR',		value: Enums.Currency.EUR }
	];
	this.currency = ko.observable(Settings.currency());
	this.hourlyRate = ko.observable(Settings.hourlyRate());
	this.typingSpeed.subscribe(function (newValue) {
		this.typingSpeedCPM(newValue);
	}, this);
	this.readingSpeed.subscribe(function (newValue) {
		this.readingSpeedWPM(newValue);
	}, this);
}

_.extendOwn(ComposeWordCounterFormView.prototype, CAbstractSettingsFormView.prototype);

ComposeWordCounterFormView.prototype.ViewTemplate = '%ModuleName%_ComposeWordCounterSettingsFormView';

ComposeWordCounterFormView.prototype.getParametersForSave = function ()
{
	return {
		'TypingSpeedCPM': Types.pInt(this.typingSpeedCPM()),
		'ReadingSpeedWPM': Types.pInt(this.readingSpeedWPM()),
		'CurrencyId': Types.pInt(this.currency()),
		'HourlyRate': Types.pInt(this.hourlyRate())
	};
};

ComposeWordCounterFormView.prototype.validateBeforeSave = function ()
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

ComposeWordCounterFormView.prototype.applySavedValues = function ()
{
	Settings.update(this.typingSpeedCPM(), this.readingSpeedWPM(), this.currency(), this.hourlyRate());
};

module.exports = new ComposeWordCounterFormView();