'use strict';

require('modules/%ModuleName%/js/enums.js');

var
	$ = require('jquery'),
	ko = require('knockout'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	AlertPopup = require('%PathToCoreWebclientModule%/js/popups/AlertPopup.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	ShowActiveBillPopup = require('modules/%ModuleName%/js/popups/ShowActiveBillPopup.js'),
	ModuleErrors = require('%PathToCoreWebclientModule%/js/ModuleErrors.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

module.exports = function (oAppData) {
	var
		bInitialized = false,
		iTotalChar = 0,
		iTotalWord = 0,
		getCurrencySymbol = function () {
			var symbol = '';
			switch (Settings.currency())
			{
				case Enums.Currency.EUR:
					symbol = '€';
					break;
				case Enums.Currency.USD:
				default:
					symbol = '$';
			}

			return symbol;
		},
		purify_string = function(str='') {
			if(str.length<1)
			{
				return str;
			}
      str = str
        .replace(/\r?\n/g, ' ')
				.replace(/&nbsp;/g,' ') 
				.replace(/<div data-anchor="signature".*?<\/div>/g, '')
				.replace(/<div data-anchor="reply-title".*?<\/div>/g, '')
				.replace(/<blockquote.*?<\/blockquote>/g, '')
				.replace(/([^>]{1})<div>/gi, '$1\n')
				.replace(/<style[^>]*>[^<]*<\/style>/gi, '\n')
				.replace(/<br *\/{0,1}>/gi, '\n')
				.replace(/<\/b*\/{0,1}>/gi, '\n')
				.replace(/<\/i*\/{0,1}>/gi, '\n')
				.replace(/<\/u*\/{0,1}>/gi, '\n')
				.replace(/<\/strike*\/{0,1}>/gi, '\n')
				.replace(/<\/font*\/{0,1}>/gi, '\n')
				.replace(/<\/p>/gi, '\n')
				.replace(/<\/div>/gi, '\n')
				.replace(/<[^>]*>/g, '')
				.replace(/&nbsp;/g, ' ')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&')
				.replace(/&quot;/g, '"');
			str = str.replace(/(<([^>]+)>)/ig,'');

			return str;
		},
		totalChar = function (chars) {
      var totalChar = 0;
			// chars = purify_string(chars);
      chars = chars
// 			    .replace(/\r?\n/g, ' ')
				.replace(/&nbsp;/g,' ')
				.replace(/<div data-anchor="signature".*?<\/div>/g, '')
				.replace(/<div data-anchor="reply-title".*?<\/div>/g, '')
				.replace(/<blockquote.*?<\/blockquote>/g, '')
// 				.replace(/([^>]{1})<div>/gi, '$1\n')
// 				.replace(/<style[^>]*>[^<]*<\/style>/gi, '\n')
// 				.replace(/<br *\/{0,1}>/gi, '\n')
// 				.replace(/<\/b*\/{0,1}>/gi, '\n')
// 				.replace(/<\/i*\/{0,1}>/gi, '\n')
// 				.replace(/<\/u*\/{0,1}>/gi, '\n')
// 				.replace(/<\/strike*\/{0,1}>/gi, '\n')
// 				.replace(/<\/font*\/{0,1}>/gi, '\n')
// 				.replace(/<\/p>/gi, '\n')
// 				.replace(/<\/div>/gi, '\n')
				.replace(/<[^>]*>/g, '')
				.replace(/&nbsp;/g, ' ')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&')
				.replace(/&quot;/g, '"')
			  .replace(/(<([^>]+)>)/ig,'');
			//chars = chars.replace(/\s/ig, '');
			totalChar = chars.length > 0 ? chars.length : 0;
			return totalChar;
		},
		wordCounter = function (text) {
			var totalWord = 0;
			text = purify_string(text);
			text = text.replace(/\s+/ig, ' ');
			text = text.trim();
			totalWord += text.length > 0 ? text.split(' ').length : 0;
			return totalWord;
		},
		isIncomingMessage = function (oMessage) {
			var sUserEmail = App.currentAccountEmail ? App.currentAccountEmail() : '';

			return sUserEmail !== oMessage.oFrom.getFirstEmail();
		},
		getMessageValue = function (oMessage) {
			var
				regexpTotalWord = /X-ComposeWordCounter-TotalWord: ([0-9]+)/,
				aTotalWordResult = regexpTotalWord.exec(oMessage.sourceHeaders()),
				iTotalWord = aTotalWordResult && aTotalWordResult[1] ? Types.pInt(aTotalWordResult[1], 0) : 0,
				regexpTotalChar = /X-ComposeWordCounter-TotalChar: ([0-9]+)/,
				aTotalCharResult = regexpTotalChar.exec(oMessage.sourceHeaders()),
				iTotalChar = aTotalCharResult && aTotalCharResult[1] ? Types.pInt(aTotalCharResult[1], 0) : 0,
				bIncomingMessage = isIncomingMessage(oMessage),
				iReadingSpeed = Settings.readingSpeedWPM() ? Settings.readingSpeedWPM() : 0,
				iTypingSpeed = Settings.typingSpeedCPM() ? Settings.typingSpeedCPM() : 0,
				iTimeMinutes = bIncomingMessage ? (iTotalWord / iReadingSpeed) : (iTotalChar / iTypingSpeed),
				iTimeSeconds = Math.floor(iTimeMinutes * 60),
				iValue = (iTimeSeconds / 3600) * Settings.hourlyRate()
			;

			return {
				TotalWord: iTotalWord,
				TotalChar: iTotalChar,
				Value: iValue,
				TimeSeconds: iTimeSeconds,
				IsIncomingMessage: bIncomingMessage
			};
		}
	;

	Settings.init(oAppData);

	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (ModulesManager) {
				if (Settings.userRole() === Enums.WordCounterUserRole.Lawyer)
				{
					ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
						function () { return require('modules/%ModuleName%/js/views/ComposeWordCounterSettingsFormView.js'); },
						Settings.HashModuleName,
						TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
					]);

					App.subscribeEvent('MailWebclient::AddMoreSectionCommand', function (fAddMoreSectionCommand) {
						fAddMoreSectionCommand({
							'Text': TextUtils.i18n('%MODULENAME%/ACTION_VIEW_MESSAGE_VALUE'),
							'CssClass': 'view-value',
							'Handler': function () {
								if (this.currentMessage())
								{
									var oMessageValue = getMessageValue(this.currentMessage());
									Popups.showPopup(AlertPopup, [
										TextUtils.i18n('%MODULENAME%/LABEL_MESSAGE_VALUE', {
											MEASURE: oMessageValue.IsIncomingMessage ? oMessageValue.TotalWord : oMessageValue.TotalChar,
											MEASURENAME: oMessageValue.IsIncomingMessage ? 'Words' : 'Characters',
											VALUE: oMessageValue.Value.toFixed(2),
											CURRENTWPM: Settings.readingSpeedWPM() ? Settings.readingSpeedWPM() : 0,
											CURRENTCPM: Settings.typingSpeedCPM() ? Settings.typingSpeedCPM() : 0,
											CURRENTHOURLYRATE: Settings.hourlyRate() ? Settings.hourlyRate() : 0,
											CURRENCYSYMBOL: getCurrencySymbol()
										}),
										null,
										TextUtils.i18n('%MODULENAME%/POPUP_TITLE_MESSAGE_VALUE')
									]);
								}
							}
						});
					});

					App.subscribeEvent('MailWebclient::AddMoreSectionCommand', function (fAddMoreSectionCommand) {
						fAddMoreSectionCommand({
							'Text': TextUtils.i18n('%MODULENAME%/ACTION_ADD_VALUE'),
							'CssClass': 'add-value',
							'Handler': function () {
								if (this.currentMessage())
								{
									var oMessageValue = getMessageValue(this.currentMessage());
									if (oMessageValue.Value <= 0)
									{
										Popups.showPopup(AlertPopup, [TextUtils.i18n('%MODULENAME%/ERROR_MESSAGE_NO_VALUE')]);
									}
									else
									{
										Ajax.send(
											'ComposeWordCounterPlugin',
											'AddToBill',
											{
												ClientEmail: oMessageValue.IsIncomingMessage ? this.currentMessage().oFrom.getFirstEmail() : this.currentMessage().oTo.getFirstEmail(),
												TotalChar: oMessageValue.TotalChar,
												TotalWord: oMessageValue.TotalWord,
												TypingSpeedCPM: Settings.typingSpeedCPM() ? Settings.typingSpeedCPM() : 0,
												ReadingSpeedWPM: Settings.readingSpeedWPM() ? Settings.readingSpeedWPM() : 0,
												Value: oMessageValue.Value,
												CurrencyId: Settings.currency(),
												HourlyRate: Settings.hourlyRate() ? Settings.hourlyRate() : 0,
												MessageId: this.currentMessage().messageId(),
												MessageSubject: this.currentMessage().subject(),
												MessageText: this.currentMessage().text(),
												MessageDate: this.currentMessage().oDateModel.oMoment.format('Y-MM-DD HH:mm:ss'),
												Sender: this.currentMessage().oFrom.getFirstEmail(),
												IsIncoming: oMessageValue.IsIncomingMessage
											},
											function (oResponse) {
												if (oResponse.Result)
												{
													Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_ADD_TO_BILL_SUCCESS'));
												}
												else
												{
													var sMessage = ModuleErrors.getErrorMessage(oResponse);
													if (sMessage)
													{
														Screens.showError(sMessage);
													}
													else
													{
														Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_ADD_TO_BILL'));
													}
												}
											},
											this
										);
									}
								}
							}
						});
					});

					App.subscribeEvent('MailWebclient::AddMoreSectionCommand', function (fAddMoreSectionCommand) {
						fAddMoreSectionCommand({
							'Text': TextUtils.i18n('%MODULENAME%/ACTION_VIEW_ACTIVE_BILL'),
							'CssClass': 'view-bill',
							'Handler': function () {
								if (this.currentMessage())
								{
									var sClientEmail = isIncomingMessage(this.currentMessage()) ? this.currentMessage().oFrom.getFirstEmail() : this.currentMessage().oTo.getFirstEmail();
									Ajax.send(
										'ComposeWordCounterPlugin',
										'GetOpenBillByClientEmail', 
										{
											ClientEmail: sClientEmail,
										},
										function (oResponse) {
											if (oResponse.Result)
											{
												Popups.showPopup(ShowActiveBillPopup, [
													oResponse.Result,
													sClientEmail
												]);
											}
											else
											{
												var sMessage = ModuleErrors.getErrorMessage(oResponse);
												if (sMessage)
												{
													Screens.showError(sMessage);
												}
												else
												{
													Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_INVALID_GET_BILL'));
												}
											}
										},
										this
									);
								}
							}
						});
					});

					App.subscribeEvent('MailWebclient::AddMoreSectionCommand', function (fAddMoreSectionCommand) {
						fAddMoreSectionCommand({
							'Text': TextUtils.i18n('%MODULENAME%/ACTION_CLEAR_ACTIVE_BILL'),
							'CssClass': 'clear-bill',
							'Handler': function () {
								if (this.currentMessage())
								{
									var oMessageValue = getMessageValue(this.currentMessage());
									var sClientEmail = oMessageValue.IsIncomingMessage ? this.currentMessage().oFrom.getFirstEmail() : this.currentMessage().oTo.getFirstEmail();
									Popups.showPopup(ConfirmPopup, [
										'Are you sure you want to clear current bill?',
										function(bDoClear) {
											if (bDoClear) {
												Ajax.send(
													'ComposeWordCounterPlugin',
													'ClearBill',
													{
														ClientEmail: sClientEmail
													},
													function (oResponse) {
														if (oResponse.Result)
														{
															Screens.showReport(TextUtils.i18n('The active bill was cleared successfully'));
														}
														else
														{
															var sMessage = ModuleErrors.getErrorMessage(oResponse);
															if (sMessage)
															{
																Screens.showError(sMessage);
															}
															else
															{
																Screens.showError(TextUtils.i18n("The bill wasn't cleared"));
															}
														}
													},
													this
												);
											}

										},
										TextUtils.i18n('The bill clearing confirmation'),
										'Clear'
									]);
								}
							}
						});
					});
				}


				App.subscribeEvent('MailWebclient::ConstructView::after', function (oParams) {
					if (!bInitialized && oParams.Name === 'CComposeView')
					{
						if (ko.isSubscribable(oParams.View.oHtmlEditor.actualTextСhanged))
						{
							oParams.View.oHtmlEditor.actualTextСhanged.subscribe(function() {
								var
									counterPanelElement = $('.message_panel').find('.counter-panel'),
									panelCenterElement = $('.message_panel').find('.panel_center')
								;
								iTotalChar = totalChar(oParams.View.oHtmlEditor.getText());
								iTotalWord = wordCounter(oParams.View.oHtmlEditor.getText());
								if (Settings.userRole() === Enums.WordCounterUserRole.Lawyer)
								{
									var
										iTimeSeconds = Settings.typingSpeedCPM() ? Math.floor((iTotalChar / Settings.typingSpeedCPM()) * 60) : 0,
										dTime = new Date(null)
									;
									dTime.setSeconds(iTimeSeconds);
									
									var
										iAmount = (iTimeSeconds / 3600) * Settings.hourlyRate(),
										counterPanel = `<div style="box-sizing:border-box;display:flex;width: 100%;padding: 0 12px;" class="counter-panel">${charactersCounter}${sessionCounter}${amountCounter}</div>`,
										charactersCounter = `<div style="box-sizing:border-box;flex-grow:1;padding:15px;border:1px solid #cccccc;border-bottom-left-radius:5px;border-top-left-radius:5px;border-right:0;background-color:#f0f0f0;"><span style="font-weight:bold;font-size:16px">${iTotalChar}</span></br><span style="color:#5a6373;">Characters</span></div>`,
										wordsCounter = `<div style="box-sizing:border-box;flex-grow:1;padding:15px;border:1px solid #cccccc;border-right:0;background-color:#f0f0f0;"><span style="font-weight:bold;font-size:16px">${iTotalWord}</span></br><span style="color:#5a6373;">Words</span></div>`,
										sessionCounter = `<div style="box-sizing:border-box;flex-grow:1;padding:15px;border:1px solid #cccccc;border-right:0;background-color:#f0f0f0;"><span style="font-weight:bold;font-size:16px">${dTime.toISOString().substr(11, 8)}</span></br><span style="color:#5a6373;">Session Time</span></div>`,
										amountCounter = `<div style="box-sizing:border-box;flex-grow:1;padding:15px;border:1px solid #cccccc;background-color:#f0f0f0;border-bottom-right-radius:5px;border-top-right-radius:5px;"><span style="font-weight:bold;font-size:16px">${getCurrencySymbol()}${iAmount.toFixed(2)}</span></br><span style="color:#5a6373;">Amount</span></div>`
									;
									if (!counterPanelElement.length)
									{
										panelCenterElement.after(counterPanel);
										counterPanelElement = $('.message_panel').find('.counter-panel');
									}
									
									if (counterPanelElement.length)
									{
										counterPanelElement.html(`${charactersCounter}${sessionCounter}${amountCounter}`);
									}
								}
							}, this);
						}

						bInitialized = true;
					}
				});

				App.subscribeEvent('SendAjaxRequest::before', function (oParams) {
					if (oParams.Module === 'Mail' && oParams.Method === 'SendMessage' && oParams.Parameters)
					{
						oParams.Parameters['CustomHeaders'] = {
							'X-ComposeWordCounter-TotalChar': iTotalChar,
							'X-ComposeWordCounter-TotalWord': iTotalWord
						};
						iTotalChar = 0;
						iTotalWord = 0;
					}
				});
			}
		};
	}
	else if (App.getUserRole() === Enums.UserRole.SuperAdmin)
	{
		return {
			/**
			 * Registers settings tab of a module before application start.
			 * 
			 * @param {Object} ModulesManager
			 */
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/PerUserAdminSettingsView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/PerUserAdminSettingsView.js'));
							},
							'admin-bundle'
						);
					},
					Settings.HashModuleName + '-user',
					TextUtils.i18n('%MODULENAME%/LABEL_ADMIN_SETTINGS_TAB')
				]);
			}
		};
	}

	return null;
};

