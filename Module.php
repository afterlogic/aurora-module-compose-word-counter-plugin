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
				'TypingSpeedCPM'	=> array('int', 0),
				'ReadingSpeedWPM'	=> array('int', 0),
				'CurrencyId'		=> array('int', 0),
				'HourlyRate'		=> array('int', 0),
				'UserRole'			=> array('int', Enums\UserRole::Client)
			]
		);
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

	/**
	 * Obtains list of module settings for authenticated user.
	 *
	 * @return array
	 */
	public function GetSettings()
	{
		\Aurora\System\Api::checkUserRoleIsAtLeast(\Aurora\System\Enums\UserRole::Anonymous);
		$aSettings = null;
		$oUser = \Aurora\System\Api::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->isNormalOrTenant())
		{
			$aSettings = [
				'TypingSpeedCPM'	=> $oUser->{self::GetName().'::TypingSpeedCPM'},
				'ReadingSpeedWPM'	=> $oUser->{self::GetName().'::ReadingSpeedWPM'},
				'CurrencyId'		=> $oUser->{self::GetName().'::CurrencyId'},
				'HourlyRate'		=> $oUser->{self::GetName().'::HourlyRate'},
				'UserRole'			=> $oUser->{self::GetName().'::UserRole'}
			];
		}

		return $aSettings;
	}

	/**
	 * Updates settings
	 *
	 * @return boolean
	 */
	public function UpdateSettings($TypingSpeedCPM, $ReadingSpeedWPM, $CurrencyId, $HourlyRate)
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

			return $oCoreDecorator->UpdateUserObject($oUser);
		}

		return false;
	}

	public function AddToBill($UserId, $ClientEmail,
		$TotalChar, $TotalWord, $TypingSpeedCPM, $ReadingSpeedWPM, $Value, $CurrencyId, $HourlyRate,
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
}
