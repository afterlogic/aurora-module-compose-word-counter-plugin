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
	
	TypingSpeedCPM: 100,
	ReadingSpeedWPM: 170,
	Currency: Enums.Currency.USD,
	HourlyRate: 0,
	BillingInterval: 1,
	
	UserRole: Enums.WordCounterUserRole.Client,
	
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
			this.TypingSpeedCPM = Types.isPositiveNumber(oAppDataSection.TypingSpeedCPM) ? oAppDataSection.TypingSpeedCPM : this.TypingSpeedCPM;
			this.ReadingSpeedWPM = Types.isPositiveNumber(oAppDataSection.ReadingSpeedWPM) ? oAppDataSection.ReadingSpeedWPM : this.ReadingSpeedWPM;
			this.Currency = Types.pEnum(oAppDataSection.CurrencyId, Enums.Currency, this.Currency);
			this.HourlyRate = Types.pInt(oAppDataSection.HourlyRate, this.HourlyRate);
			this.BillingInterval = Types.pInt(oAppDataSection.BillingInterval, this.BillingInterval);
			this.UserRole = Types.pEnum(oAppDataSection.UserRole, Enums.WordCounterUserRole, this.UserRole);
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
		this.TypingSpeedCPM = Types.pInt(iTypingSpeedCPM);
		this.ReadingSpeedWPM = Types.pInt(iReadingSpeedWPM);
		this.Currency = Types.pInt(iCurrency);
		this.HourlyRate = Types.pInt(iHourlyRate);
		this.BillingInterval = Types.pInt(iBillingInterval);
	}
};
