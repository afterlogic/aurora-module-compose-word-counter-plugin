'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'compose-word-counter',
	typingSpeedCPM: ko.observable(100),
	readingSpeedWPM: ko.observable(170),
	currency: ko.observable(Enums.Currency.USD),
	hourlyRate: ko.observable(0),
	BillingInterval: 1,
	userRole: ko.observable(Enums.WordCounterUserRole.Client),
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = _.extend({}, oAppData[this.ServerModuleName] || {}, oAppData['%ModuleName%'] || {});

		if (!_.isEmpty(oAppDataSection))
		{
			this.typingSpeedCPM(Types.isPositiveNumber(oAppDataSection.TypingSpeedCPM) ? oAppDataSection.TypingSpeedCPM : this.typingSpeedCPM());
			this.readingSpeedWPM(Types.isPositiveNumber(oAppDataSection.ReadingSpeedWPM) ? oAppDataSection.ReadingSpeedWPM : this.readingSpeedWPM());
			this.currency(Types.pEnum(oAppDataSection.CurrencyId, Enums.Currency, this.currency()));
			this.hourlyRate(Types.pInt(oAppDataSection.HourlyRate, this.hourlyRate()));
			this.BillingInterval = Types.pInt(oAppDataSection.BillingInterval, this.BillingInterval);
			this.userRole(Types.pEnum(oAppDataSection.UserRole, Enums.WordCounterUserRole, this.userRole()));
		}
	},

	/**
	 * Updates new settings values after saving on server.
	 *
	 * @param {number} iTypingSpeedCPM
	 * @param {number} iReadingSpeedWPM
	 * @param {number} iCurrency
	 * @param {number} iHourlyRate
	 * @param {number} iBillingInterval
	 */
	update: function (iTypingSpeedCPM, iReadingSpeedWPM, iCurrency, iHourlyRate, iBillingInterval)
	{
		this.typingSpeedCPM(Types.pInt(iTypingSpeedCPM));
		this.readingSpeedWPM(Types.pInt(iReadingSpeedWPM));
		this.currency(Types.pInt(iCurrency));
		this.hourlyRate(Types.pInt(iHourlyRate));
		this.BillingInterval = Types.pInt(iBillingInterval);
	}
};
