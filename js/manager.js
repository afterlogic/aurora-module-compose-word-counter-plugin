'use strict';

require('modules/%ModuleName%/js/enums.js');

var
	$ = require('jquery'),
	ko = require('knockout'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

module.exports = function (oAppData) {
	var
		bInitialized = false,
		getCurrencySymbol = function (){
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
			str = str.replace(/\r?\n/g, ' ')
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
		totalChar = function (chars){
			var totalChar = 0;
			chars = purify_string(chars);
			chars = chars.replace(/\s/ig, '');
			totalChar = chars.length > 0 ? chars.length : 0;
			return totalChar;
		},
		wordCounter = function (text){
			var totalWord = 0;
			var j;
			text = purify_string(text);
			text = text.replace(/\s+/ig, ' ');
			text = text.trim();
			totalWord += text.length > 0 ? text.split(' ').length : 0;
			return totalWord;
		}
	;

	Settings.init(oAppData);

	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
					function () { return require('modules/%ModuleName%/js/views/ComposeWordCounterSettingsFormView.js'); },
					Settings.HashModuleName,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
				]);

				App.subscribeEvent('MailWebclient::ConstructView::after', function (oParams) {
					if (!bInitialized && oParams.Name === 'CComposeView')
					{
						if (ko.isSubscribable(oParams.View.oHtmlEditor.actualTextСhanged))
						{
							oParams.View.oHtmlEditor.actualTextСhanged.subscribe(function() {
								var counterPanelElement = $('.message_panel').find('.counter-panel');
								var panelCenterElement = $('.message_panel').find('.panel_center');
								var iTotalChar = totalChar(oParams.View.oHtmlEditor.getText());
								var iTimeSeconds = Math.floor((iTotalChar / Settings.typingSpeedCPM()) * 60);
								var dTime = new Date(null);
								dTime.setSeconds(iTimeSeconds);
								var iAmount = (iTimeSeconds / 3600) * Settings.hourlyRate();
								var counterPanel = `<div style="box-sizing:border-box;display:flex;width: 100%;padding: 0 12px;" class="counter-panel">${charactersCounter}${wordsCounter}${sessionCounter}${amountCounter}</div>`;
								var charactersCounter = `<div style="box-sizing:border-box;width:25%;padding:15px;border:1px solid #cccccc;border-bottom-left-radius:5px;border-top-left-radius:5px;border-right:0;background-color:#f0f0f0;"><span style="font-weight:bold;font-size:16px">${iTotalChar}</span></br><span style="color:#5a6373;">Characters</span></div>`;
								var wordsCounter = `<div style="box-sizing:border-box;width:25%;padding:15px;border:1px solid #cccccc;border-right:0;background-color:#f0f0f0;"><span style="font-weight:bold;font-size:16px">${wordCounter(oParams.View.oHtmlEditor.getText())}</span></br><span style="color:#5a6373;">Words</span></div>`;
								var sessionCounter = `<div style="box-sizing:border-box;width:25%;padding:15px;border:1px solid #cccccc;border-right:0;background-color:#f0f0f0;"><span style="font-weight:bold;font-size:16px">${dTime.toISOString().substr(11, 8)}</span></br><span style="color:#5a6373;">Session Time</span></div>`;
								var amountCounter = `<div style="box-sizing:border-box;width:25%;padding:15px;border:1px solid #cccccc;background-color:#f0f0f0;border-bottom-right-radius:5px;border-top-right-radius:5px;"><span style="font-weight:bold;font-size:16px">${getCurrencySymbol()}${iAmount.toFixed(2)}</span></br><span style="color:#5a6373;">Amount</span></div>`;
								if (counterPanelElement.length)
								{
									counterPanelElement.html(`${charactersCounter}${wordsCounter}${sessionCounter}${amountCounter}`);
								}
								else panelCenterElement.after(counterPanel);
							}, this);
						}

						bInitialized = true;
					}
				});
			}
		};
	}

	return null;
};

