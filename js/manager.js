'use strict';

module.exports = function (oAppData) {
	var
		$ = require('jquery'),
		ko = require('knockout'),
		App = require('%PathToCoreWebclientModule%/js/App.js'),
    bInitialized = false,
    purify_string = function (str=''){
      if(str.length<1)return str;
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
      return chars.length;
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

	if (App.isUserNormalOrTenant())
	{
    return {
      start: function (ModulesManager) {
        App.subscribeEvent('MailWebclient::ConstructView::after', function (oParams) {

          if (!bInitialized && oParams.Name === 'CComposeView') {
            if (ko.isSubscribable(oParams.View.oHtmlEditor.actualTextСhanged)) {
              oParams.View.oHtmlEditor.actualTextСhanged.subscribe(function () {
                var counterPanel = $('.message_panel').find('.counter-panel');
                var panel = $('.message_panel').find('.panel_center');
                if (counterPanel.length) counterPanel.html(`<div style="float:left; padding-right:15px"><span style="font-weight:bold;font-size:16px">${totalChar(oParams.View.oHtmlEditor.getText())}</span></br><span style="color:#5a6373;">Characters</span></div><div style="float:left; padding-right:15px"><span style="font-weight:bold;font-size:16px">${wordCounter(oParams.View.oHtmlEditor.getText())}</span></br><span style="color:#5a6373;">Words</span></div>`);
                else panel.after(`<div style="padding: 0 12px; " class="counter-panel"><div style="float:left; padding-right:15px"><span style="font-weight:bold;font-size:16px">${totalChar(oParams.View.oHtmlEditor.getText())}</span></br><span style="color:#5a6373;">Characters</span></div><div style="float:left; padding-right:15px"><span style="font-weight:bold;font-size:16px">${wordCounter(oParams.View.oHtmlEditor.getText())}</span></br><span style="color:#5a6373;">Words</span></div></div>`);
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

