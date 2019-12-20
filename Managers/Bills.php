<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\ComposeWordCounterPlugin\Managers;

/*
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 */
class Bills extends \Aurora\System\Managers\AbstractManager
{
	/**
	 * @var \Aurora\System\Managers\Eav
	 */
	public $oEavManager = null;

	/**
	 * @param \Aurora\System\Module\AbstractModule $oModule
	 */
	public function __construct(\Aurora\System\Module\AbstractModule $oModule = null)
	{
		parent::__construct($oModule);

		$this->oEavManager = \Aurora\System\Managers\Eav::getInstance();
	}

	/**
	 * @param \Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill $oBill
	 * @return int|bool
	 */
	public function createBill(\Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill &$oBill)
	{
		$mResult = false;
		if ($oBill->validate())
		{
			$mResult = $this->oEavManager->saveEntity($oBill);
			if (!$mResult)
			{
				throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\ComposeWordCounterPlugin\Enums\ErrorCodes::BillCreateFailed);
			}
		}

		return $mResult;
	}

	/**
	 * @param \Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill $oBill
	 * @return bool
	 */
	public function updateBill(\Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill $oBill)
	{
		$bResult = false;
		if ($oBill->validate())
		{
			if (!$this->oEavManager->saveEntity($oBill))
			{
				throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\ComposeWordCounterPlugin\Enums\ErrorCodes::BillUpdateFailed);
			}

			$bResult = true;
		}
		return $bResult;
	}

	/**
	 * @param string $sOwnerUserUUID UUID of bills owner.
	 * @return array
	 */
	public function getBillsByOwner($sOwnerUserUUID)
	{
		$aResult = [];
		if ($sOwnerUserUUID)
		{
			$aSearchFilters = ['OwnerUserUUID' => $sOwnerUserUUID];
			$aResult = $this->getBills(0, 0, $aSearchFilters);
		}

		return $aResult;
	}

	/**
	 * @param string $sOwnerUserUUID UUID of bill's owner.
	 * @param string $sClientUserEmail Email of bill's client.
	 * @return \Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill|bool
	 */
	public function getOpenedBillByOwnerAndClient($sOwnerUserUUID, $sClientUserEmail)
	{
		$mBill = false;
		{
			$aSearchFilters = [
				'OwnerUserUUID'	=> $sOwnerUserUUID,
				'ClientUserEmail'	=> $sClientUserEmail,
				'$OR' => [
					'1@IsClosed' => false,
					'2@IsClosed' => ['NULL', 'IS']
				]	
			];
			$aResult = $this->getBills(1, 0, $aSearchFilters);
			if (count($aResult) > 0)
			{
				$mBill = $aResult[0];
			}
		}

		return $mBill;
	}

	/**
	 *
	 * @param int|string $mIdOrUUID
	 * @return \Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill|bool
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function getBillByIdOrUUID($mIdOrUUID)
	{
		$mBill = false;
		if ($mIdOrUUID)
		{
			$mBill = $this->oEavManager->getEntity($mIdOrUUID, '\Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill');
		}
		else
		{
			throw new \Aurora\System\Exceptions\BaseException(\Aurora\Modules\ComposeWordCounterPlugin\Enums\ErrorCodes::Validation_InvalidParameters);
		}
		return $mBill;
	}

	/**
	 * @param int $iLimit Limit.
	 * @param int $iOffset Offset.
	 * @param array $aSearchFilters Search filters.
	 * @param array$aViewAttributes Fields List
	 * @return array
	 */
	public function getBills($iLimit = 0, $iOffset = 0, $aSearchFilters = [], $aViewAttributes = [])
	{
		$aResults = $this->oEavManager->getEntities(
			\Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill::class,
			$aViewAttributes,
			$iOffset,
			$iLimit,
			$aSearchFilters
		);

		return $aResults;
	}

	/**
	 * @return int
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function getBillsCount($aSearchFilters = [])
	{
		$iResult = 0;
		$iResult = $this->oEavManager->getEntitiesCount(
			\Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill::class,
			$aSearchFilters
		);
		return $iResult;
	}

	/**
	 * @param \Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill $oBill
	 * @return bool
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function deleteBill(\Aurora\Modules\ComposeWordCounterPlugin\Classes\Bill $oBill)
	{
		$bResult = $this->oEavManager->deleteEntity($oBill->EntityId);

		return $bResult;
	}
}