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
			var
				bDesktopEmpty = !oAppDataSection.TypingSpeedCPM || !oAppDataSection.ReadingSpeedWPM || !oAppDataSection.CurrencyId || !oAppDataSection.HourlyRate,
				bMobileEmpty = !oAppDataSection.MobileTypingSpeedCPM || !oAppDataSection.MobileReadingSpeedWPM || !oAppDataSection.MobileCurrencyId || !oAppDataSection.MobileHourlyRate,
				sPrefix = (bDesktopEmpty || App.isMobile()) && !bMobileEmpty ? 'Mobile' : ''
			;
			this.typingSpeedCPM(Types.isPositiveNumber(oAppDataSection[sPrefix + 'TypingSpeedCPM']) ? oAppDataSection[sPrefix + 'TypingSpeedCPM'] : this.typingSpeedCPM());
			this.readingSpeedWPM(Types.isPositiveNumber(oAppDataSection[sPrefix + 'ReadingSpeedWPM']) ? oAppDataSection[sPrefix + 'ReadingSpeedWPM'] : this.readingSpeedWPM());
			this.currency(Types.pEnum(oAppDataSection[sPrefix + 'CurrencyId'], Enums.Currency, this.currency()));
			this.hourlyRate(Types.pInt(oAppDataSection[sPrefix + 'HourlyRate'], this.hourlyRate()));
			this.userRole(Types.pEnum(oAppDataSection.UserRole, Enums.WordCounterUserRole, this.userRole()));
		}
	},

	/**
	 * Updates new settings values after saving on server.
	 *
	 * @param {number} typingSpeedCPM
	 * @param {number} readingSpeedWPM
	 * @param {number} currency
	 * @param {number} hourlyRate
	 */
	update: function (typingSpeedCPM, readingSpeedWPM, currency, hourlyRate)
	{
		this.typingSpeedCPM(Types.pInt(typingSpeedCPM));
		this.readingSpeedWPM(Types.pInt(readingSpeedWPM));
		this.currency(Types.pInt(currency));
		this.hourlyRate(Types.pInt(hourlyRate));
	}
};
