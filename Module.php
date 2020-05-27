<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\ComposeWordCounterPlugin;

/**
 * Provides user groups.
 * 
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 *
 * @package Modules
 */
class Module extends \Aurora\System\Module\AbstractModule
{
	protected $aManagers = [
		'Bills'			=> null,
		'Operations'	=> null
	];

	public function init()
	{
		\Aurora\System\Router::getInstance()->registerArray(
			self::GetName(),
			[
				'sso-send' => [$this, 'EntrySsoSend'],
			]
		);
		
		$this->aErrors = [
			Enums\ErrorCodes::ClientAndOwnerSamePerson		=> $this->i18N('ERROR_SAME_PERSON'),
			Enums\ErrorCodes::OperationCreateFailed			=> $this->i18N('ERROR_OPERATION_CREATE_FAILED'),
			Enums\ErrorCodes::Validation_InvalidParameters	=> $this->i18N('ERROR_INVALID_PARAMETERS'),
			Enums\ErrorCodes::OperationUpdateFailed			=> $this->i18N('ERROR_OPERATION_UPDATE_FAILED'),
			Enums\ErrorCodes::BillCreateFailed				=> $this->i18N('ERROR_BILL_CREATE_FAILED'),
			Enums\ErrorCodes::BillUpdateFailed				=> $this->i18N('ERROR_BILL_UPDATE_FAILED'),
			Enums\ErrorCodes::OperationAlreadyInOpenBill	=> $this->i18N('ERROR_OPERATION_ALREADY_IN_OPEN_BILL'),
			Enums\ErrorCodes::OperationAlreadyInClosedBill	=> $this->i18N('ERROR_OPERATION_ALREADY_IN_CLOSED_BILL'),
		];

		\Aurora\Modules\Core\Classes\User::extend(
			self::GetName(),
			[
				'TypingSpeedCPM'		=> array('int', 0),
				'ReadingSpeedWPM'		=> array('int', 0),
				'CurrencyId'			=> array('int', 0),
				'HourlyRate'			=> array('int', 0),
				'BillingInterval'		=> array('int', 0),
				'MobileTypingSpeedCPM'	=> array('int', 0),
				'MobileReadingSpeedWPM'	=> array('int', 0),
				'MobileCurrencyId'		=> array('int', 0),
				'MobileHourlyRate'		=> array('int', 0),
				'MobileBillingInterval'	=> array('int', 0),
				'UserRole'				=> array('int', Enums\UserRole::Client)
			]
		);
	}

	/**
	 * @ignore
	 */
	public function EntrySsoSend()
	{
		try
		{
			$sHash = $this->oHttp->GetRequest('hash');
			if (!empty($sHash))
			{
				$sData = \Aurora\System\Api::Cacher()->get('SSO:'.$sHash, true);
				$aData = \Aurora\System\Api::DecodeKeyValues($sData);
				if (isset($aData['Password'], $aData['Email']))
				{
					$aResult = \Aurora\Modules\Core\Module::Decorator()->Login($aData['Email'], $aData['Password']);
					if (is_array($aResult) && isset($aResult['AuthToken']))
					{
						$iAuthTokenCookieExpireTime = (int) \Aurora\Modules\Core\Module::getInstance()->getConfig('AuthTokenCookieExpireTime', 30);
						@\setcookie(
							\Aurora\System\Application::AUTH_TOKEN_KEY,
							$aResult['AuthToken'],
							\strtotime('+' . $iAuthTokenCookieExpireTime . ' days'),
							\Aurora\System\Api::getCookiePath(), null, \Aurora\System\Api::getCookieSecure()
						);
					}
				}
			}
			else
			{
				\Aurora\Modules\Core\Module::Decorator()->Logout();
			}
		}
		catch (\Exception $oExc)
		{
			\Aurora\System\Api::LogException($oExc);
		}

		$sTo = $this->oHttp->GetRequest('to');
		$sSubject = $this->oHttp->GetRequest('subject');
		$sText = $this->oHttp->GetRequest('text');

		\Aurora\System\Api::Location('./#mail/compose/to/' . rawurlencode('mailto:' . $sTo . '?subject=' . $sSubject . '&body=' . $sText));
	}
	
	public function getManager($sManager)
	{
		if ($this->aManagers[$sManager] === null)
		{
			$sManagerClass = Module::getNamespace() . "\\Managers\\" . $sManager;
			$this->aManagers[$sManager] = new $sManagerClass($this);
		}

		return $this->aManagers[$sManager];
	}
	
	private function _getSettings($bMobile)
	{
		$aSettings = null;
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
			$bDesktopEmpty = empty($oUser->{self::GetName().'::TypingSpeedCPM'}) && empty($oUser->{self::GetName().'::ReadingSpeedWPM'})
							&& empty($oUser->{self::GetName().'::CurrencyId'})
							&& empty($oUser->{self::GetName().'::HourlyRate'}) && empty($oUser->{self::GetName().'::BillingInterval'});
			$bMobileEmpty = empty($oUser->{self::GetName().'::MobileTypingSpeedCPM'}) && empty($oUser->{self::GetName().'::MobileReadingSpeedWPM'})
							&& empty($oUser->{self::GetName().'::MobileCurrencyId'})
							&& empty($oUser->{self::GetName().'::MobileHourlyRate'}) && empty($oUser->{self::GetName().'::MobileBillingInterval'});
			$bBothEmpty = $bDesktopEmpty && $bMobileEmpty;
			$sMobilePrefix = ($bDesktopEmpty || $bMobile) && !$bMobileEmpty ? 'Mobile' : '';
			
			$aSettings = [
				'TypingSpeedCPM' => $bBothEmpty ? 100 : $oUser->{self::GetName().'::' . $sMobilePrefix . 'TypingSpeedCPM'},
				'ReadingSpeedWPM' => $bBothEmpty ? 170 : $oUser->{self::GetName().'::' . $sMobilePrefix . 'ReadingSpeedWPM'},
				'CurrencyId' => $bBothEmpty ? 1 : $oUser->{self::GetName().'::' . $sMobilePrefix . 'CurrencyId'},
				'HourlyRate' => $bBothEmpty ? 0 : $oUser->{self::GetName().'::' . $sMobilePrefix . 'HourlyRate'},
				'BillingInterval' => $bBothEmpty ? 1 : $oUser->{self::GetName().'::' . $sMobilePrefix . 'BillingInterval'},
				'UserRole' => $oUser->{self::GetName().'::UserRole'}
			];
		}

		return $aSettings;
	}
	
	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		
		return $this->_getSettings(\Aurora\System\Api::IsMobileApplication());
	}

	/**
	 * Updates settings
	 *
	 * @return boolean
	 */
	public function UpdateSettings($TypingSpeedCPM, $ReadingSpeedWPM, $CurrencyId, $HourlyRate, $BillingInterval)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
			$oUser->{self::GetName().'::TypingSpeedCPM'} = $TypingSpeedCPM;
			$oUser->{self::GetName().'::ReadingSpeedWPM'} = $ReadingSpeedWPM;
			$oUser->{self::GetName().'::CurrencyId'} = $CurrencyId;
			$oUser->{self::GetName().'::HourlyRate'} = $HourlyRate;
			$oUser->{self::GetName().'::BillingInterval'} = $BillingInterval;

			return $oCoreDecorator->UpdateUserObject($oUser);
		}

		return false;
	}

	public function UpdateMobileSettings($TypingSpeedCPM, $ReadingSpeedWPM, $CurrencyId, $HourlyRate, $BillingInterval)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$oCoreDecorator = \Aurora\Modules\Core\Module::Decorator();
			$oUser->{self::GetName().'::MobileTypingSpeedCPM'} = $TypingSpeedCPM;
			$oUser->{self::GetName().'::MobileReadingSpeedWPM'} = $ReadingSpeedWPM;
			$oUser->{self::GetName().'::MobileCurrencyId'} = $CurrencyId;
			$oUser->{self::GetName().'::MobileHourlyRate'} = $HourlyRate;
			$oUser->{self::GetName().'::MobileBillingInterval'} = $BillingInterval;

			return $oCoreDecorator->UpdateUserObject($oUser);
		}

		return false;
	}

	public function GetPerUserSettings($UserId)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oUser = \Aurora\Modules\Core\Module::Decorator()->GetUserUnchecked($UserId);
		if ($oUser)
		{
			return [
				'UserRole' => $oUser->{self::GetName() . '::UserRole'}
			];
		}

		return null;
	}

	public function UpdatePerUserSettings($UserId, $UserRole)
	{
		$bResult = false;
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::SuperAdmin);

		$oUser = \Aurora\Modules\Core\Module::Decorator()->GetUserUnchecked($UserId);

		if ($oUser)
		{
			$oUser->{self::GetName() . '::UserRole'} = $UserRole;
			$bResult = \Aurora\Modules\Core\Module::Decorator()->UpdateUserObject($oUser);
		}

		return $bResult;
	}

	public function AddToBill($UserId, $ClientEmail,
		$TotalChar, $TotalWord, $TypingSpeedCPM, $ReadingSpeedWPM, $Value, $CurrencyId, $HourlyRate, $BillingInterval,
		$MessageId, $MessageSubject, $MessageText, $MessageDate, $Sender, $IsIncoming
	)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;
		$oOwnerUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oOwnerUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			if($ClientEmail === $oOwnerUser->PublicId)
			{
				throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::ClientAndOwnerSamePerson);
			}
			$oLastBill = $this->getManager('Bills')->getOpenedBillByOwnerAndClient($oOwnerUser->UUID, $ClientEmail);
			if (!$oLastBill)
			{
				$oNewBill = new Classes\Bill(self::GetName());
				$oNewBill->OwnerUserUUID = $oOwnerUser->UUID;
				$oNewBill->ClientUserEmail = $ClientEmail;
				$oNewBill->CreateDate = date('Y-m-d H:i:s');
				$iNewBillId = $this->getManager('Bills')->createBill($oNewBill);
				if ($iNewBillId)
				{
					$oNewBill = $this->getManager('Bills')->getBillByIdOrUUID($iNewBillId);
					$oLastBill = $oNewBill ? $oNewBill : null;
				}
			}
			if ($oLastBill)
			{
				//Search for operation in the opened bill
				$aOperationsInOpenBill = $this->getManager('Operations')->getBillsOperationsByMessageId($MessageId, [$oLastBill->UUID]);
				if (!empty($aOperationsInOpenBill))
				{
					throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::OperationAlreadyInOpenBill);
				}
				//Search for operation in closed bills
				$aClosedBills = $this->getManager('Bills')->getBillsByOwner($oOwnerUser->UUID);
				$aClosedBillsUIDs = array_map(function ($oClosedBill) {
					return $oClosedBill->UUID;
				}, $aClosedBills);
				$aOperationsInClosedBills = $this->getManager('Operations')->getBillsOperationsByMessageId($MessageId, $aClosedBillsUIDs);
				if (!empty($aOperationsInClosedBills))
				{
					throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::OperationAlreadyInClosedBill);
				}

				$oNewOperation = new Classes\Operation(self::GetName());
				$oNewOperation->BillUUID = $oLastBill->UUID;
				$oNewOperation->TotalChar = $TotalChar;
				$oNewOperation->TotalWord = $TotalWord;
				$oNewOperation->TypingSpeedCPM = $TypingSpeedCPM;
				$oNewOperation->ReadingSpeedWPM = $ReadingSpeedWPM;
				$oNewOperation->Value = $Value;
				$oNewOperation->CurrencyId = $CurrencyId;
				$oNewOperation->HourlyRate = $HourlyRate;
				$oNewOperation->BillingInterval = $BillingInterval;
				$oNewOperation->MessageId = $MessageId;
				$oNewOperation->MessageSubject =  substr($MessageSubject, 0, 255);
				$oNewOperation->MessageText = $MessageText;
				$oNewOperation->MessageDate = $MessageDate;
				$oNewOperation->Sender = $Sender;
				$oNewOperation->IsIncoming = $IsIncoming;
				$oNewOperation->CreateDate = date('Y-m-d H:i:s');
				$bResult = !!$this->getManager('Operations')->createOperation($oNewOperation);
			}
		}

		return $bResult;
	}

	public function GetUserBills()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aResult = [];
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$aResult = $this->getManager('Bills')->getBillsByOwner($oUser->UUID);
		}

		return $aResult;
	}

	public function ClearBill($UserId, $ClientEmail)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$bResult = false;
		$oOwnerUser = \Aurora\System\Api::getAuthenticatedUser();

		// if($ClientEmail === $oOwnerUser->PublicId)
		// {
		// 	throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::ClientAndOwnerSamePerson);
		// }
		$oLastBill = $this->getManager('Bills')->getOpenedBillByOwnerAndClient($oOwnerUser->UUID, $ClientEmail);

		if ($oLastBill) {
			// $aResult[] = $oLastBill->ClientUserEmail;
			if ($this->getManager('Operations')->deleteBillOperationsPermanently($oLastBill->UUID))
			{
				$bResult = $this->getManager('Bills')->deleteBill($oLastBill);
			}
		} else {
			throw new \Aurora\System\Exceptions\BaseException(Enums\ErrorCodes::NoBillsOpened);
		}

		return $bResult;
	}

	public function GetOpenBillByClientEmail($ClientEmail)
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::NormalUser);

		$aResult = [];
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if ($oUser instanceof \Aurora\Modules\Core\Classes\User)
		{
			$oLastBill = $this->getManager('Bills')->getOpenedBillByOwnerAndClient($oUser->UUID, $ClientEmail);
			if ($oLastBill)
			{
				$aResult = $this->getManager('Operations')->getOperations(0, 0, ['BillUUID'	=> $oLastBill->UUID]);
			}
		}

		return $aResult;
	}
	
	private function _getDefaultAccount($oUser)
	{
		$aAccounts = \Aurora\Modules\Mail\Module::Decorator()->GetAccounts($oUser->EntityId);
		$oDefaultAccount = null;
		if (is_array($aAccounts))
		{
			foreach ($aAccounts as $oAccount)
			{
				if ($oAccount->Email === $oUser->PublicId)
				{
					$oDefaultAccount = $oAccount;
				}
			}
		}
		return $oDefaultAccount;
	}
	
	private function _getSentFolderFullName($oAccount)
	{
		$sSentFolderFullName = "";
		
		$oFolderCollection = \Aurora\System\Api::GetModuleDecorator('Mail')->getMailManager()->getFolders($oAccount);
		$oFolderCollection->foreachWithSubFolders(function ($oFolder) use (&$sSentFolderFullName) {
			if ($oFolder && $oFolder->getType() === \Aurora\Modules\Mail\Enums\FolderType::Sent)
			{
				$sSentFolderFullName = $oFolder->getRawFullName();
			}
		});
		
		return $sSentFolderFullName;
	}
	
	private function _getCustomHeaders($sText, $bMobileSenderClient, $oUser)
	{
		$aPatterns = [
			'/<br *\/{0,1}>/',
			'/<p[^>]*>/',
			'/<\/p>/',
			'/<div[^>]*>/',
			'/<\/div>/'
		];
		$sPlainText = html_entity_decode(strip_tags(preg_replace($aPatterns, "\n", $sText)));
		$iCharsCount = strlen($sPlainText);
		$aWords = preg_split('/\s+/', $sPlainText, 0, PREG_SPLIT_NO_EMPTY);
		$iWordsCount = count($aWords);
		$CustomHeaders = [
			'X-ComposeWordCounter-SenderClient' => $bMobileSenderClient ? 'mobile' : 'desktop',
			'X-ComposeWordCounter-TotalChar' => $iCharsCount,
			'X-ComposeWordCounter-TotalWord' => $iWordsCount
		];
		
		if ($oUser->{self::GetName().'::UserRole'} === 1) // it is lawyer
		{
			$aSettings = $this->_getSettings($bMobileSenderClient);
			$CustomHeaders['X-ComposeWordCounter-ReadingSpeed'] = $aSettings['ReadingSpeedWPM'];
			$CustomHeaders['X-ComposeWordCounter-TypingSpeed'] = $aSettings['TypingSpeedCPM'];
			$CustomHeaders['X-ComposeWordCounter-Currency'] = $aSettings['CurrencyId'];
			$CustomHeaders['X-ComposeWordCounter-HourlyRate'] = $aSettings['HourlyRate'];
			$CustomHeaders['X-ComposeWordCounter-BillingInterval'] = $aSettings['BillingInterval'];
		}
		
		return $CustomHeaders;
	}

	public function SendMessage($Hash, $To, $Subject, $Text, $MobileSenderClient = false)
	{
		if (empty($Hash))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'There is no hash');
		}
		
		$sData = \Aurora\System\Api::Cacher()->get('SSO:'.$Hash, true);
		$aData = \Aurora\System\Api::DecodeKeyValues($sData);
		if (!isset($aData['Password'], $aData['Email']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::InvalidInputParameter, null, 'There is no data in hash');
		}
		
		$aResult = \Aurora\Modules\Core\Module::Decorator()->Login($aData['Email'], $aData['Password']);
		if (!is_array($aResult) && !isset($aResult['AuthToken']))
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AuthError, null, 'Can not sign in');
		}
		
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!$oUser || !$oUser->isNormalOrTenant())
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied, null, 'User is not found');
		}
		
		$oDefaultAccount = $this->_getDefaultAccount($oUser);
		if (!$oDefaultAccount)
		{
			throw new \Aurora\System\Exceptions\ApiException(\Aurora\System\Notifications::AccessDenied, null, 'User does not have default account');
		}
		
		$AccountID = $oDefaultAccount->EntityId;
		$Fetcher = null;
		$Alias = null;
		$IdentityID = 0;
		$DraftInfo = [];
		$DraftUid = "";
		$Cc = "";
		$Bcc = "";
		$IsHtml = true;
		$Importance = \MailSo\Mime\Enumerations\MessagePriority::NORMAL;
		$SendReadingConfirmation = false;
		$Attachments = array();
		$InReplyTo = "";
		$References = "";
		$Sensitivity = \MailSo\Mime\Enumerations\Sensitivity::NOTHING;
		$SentFolder = $this->_getSentFolderFullName($oDefaultAccount);
		$DraftFolder = "";
		$ConfirmFolder = "";
		$ConfirmUid = "";
		$CustomHeaders = $this->_getCustomHeaders($Text, $MobileSenderClient, $oUser);
		
		return \Aurora\Modules\Mail\Module::Decorator()->SendMessage($AccountID, $Fetcher, $Alias, $IdentityID,
			$DraftInfo, $DraftUid, $To, $Cc, $Bcc, $Subject, $Text, $IsHtml, $Importance,
			$SendReadingConfirmation, $Attachments, $InReplyTo, $References, $Sensitivity, $SentFolder,
			$DraftFolder, $ConfirmFolder, $ConfirmUid, $CustomHeaders);
	}
}
