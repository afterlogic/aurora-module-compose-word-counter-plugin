'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'compose-word-counter',
	typingSpeedCPM: ko.observable(0),
	readingSpeedWPM: ko.observable(0),
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
			this.typingSpeedCPM(Types.pInt(oAppDataSection.TypingSpeedCPM, this.typingSpeedCPM()));
			this.readingSpeedWPM(Types.pInt(oAppDataSection.ReadingSpeedWPM, this.readingSpeedWPM()));
			this.currency(Types.pEnum(oAppDataSection.CurrencyId, Enums.Currency, this.currency()));
			this.hourlyRate(Types.pInt(oAppDataSection.HourlyRate, this.hourlyRate()));
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
