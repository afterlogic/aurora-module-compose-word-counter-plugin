'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function ComposeWordCounterPerUserAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.iUserId = 0;
	this.userRole = ko.observable(Enums.WordCounterUserRole.Client);
}

_.extendOwn(ComposeWordCounterPerUserAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

ComposeWordCounterPerUserAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_PerUserAdminSettingsView';

/**
 * Runs after routing to this view.
 */
ComposeWordCounterPerUserAdminSettingsView.prototype.onRoute = function ()
{
	this.requestPerUserSettings();
};

/**
 * Requests per user settings.
 */
ComposeWordCounterPerUserAdminSettingsView.prototype.requestPerUserSettings = function ()
{
	if (Types.isPositiveNumber(this.iUserId))
	{
		Ajax.send(Settings.ServerModuleName,
			'GetPerUserSettings',
			{'UserId': this.iUserId},
			function (oResponse) {
				if (oResponse.Result)
				{
					this.userRole(oResponse.Result.UserRole);
				}
			},
			this
		);
	}
};

/**
 * Saves per user settings.
 */
ComposeWordCounterPerUserAdminSettingsView.prototype.savePerUserSettings = function()
{
	this.isSaving(true);

	var oSettingsData = {
		'UserId': this.iUserId,
		'UserRole': this.userRole()
	};

	Ajax.send(
		Settings.ServerModuleName,
		'UpdatePerUserSettings',
		oSettingsData,
		function (oResponse) {
			this.isSaving(false);
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
			}
			else
			{
				Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
			}
		},
		this
	);
};

/**
 * Sets access level for the view via entity type and entity identifier.
 * This view is visible only for User entity type.
 * 
 * @param {string} sEntityType Current entity type.
 * @param {number} iEntityId Indentificator of current intity.
 */
ComposeWordCounterPerUserAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === 'User');
	if (this.iUserId !== iEntityId)
	{
		this.iUserId = iEntityId;
	}
};

module.exports = new ComposeWordCounterPerUserAdminSettingsView();
