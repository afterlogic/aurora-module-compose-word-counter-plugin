<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\ComposeWordCounterPlugin\Managers;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 */
class Operations extends \Aurora\System\Managers\AbstractManager
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
	 * @param \Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation $oOperation
	 * @return bool
	 */
	public function createOperation(\Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation &$oOperation)
	{
		$bResult = false;
		if ($oOperation->validate())
		{
			if (!$this->oEavManager->saveEntity($oOperation))
			{
				throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\ComposeWordCounterPlugin\Enums\ErrorCodes::OperationCreateFailed);
			}

			$bResult = true;
		}
		return $bResult;
	}

	/**
	 * @param \Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation $oOperation
	 * @return bool
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function deleteOperation(\Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation $oOperation)
	{
		$oOperation->Deleted = true;
		$bResult = $this->updateOperation($oOperation);
		return $bResult;
	}

	/**
	 * @param int $iLimit Limit
	 * @param int $iOffset Offset
	 * @return array|bool
	 */
	public function getOperations($iLimit = 0, $iOffset = 0, $aSearchFilters = [], $aViewAttributes = [])
	{
		$mResult = false;

		$aSearchFilters = $this->getFilters($aSearchFilters);
		$mResult = $this->oEavManager->getEntities(
			\Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation::class,
			$aViewAttributes,
			$iOffset,
			$iLimit,
			$aSearchFilters,
			['CreateDate'],
			\Aurora\System\Enums\SortOrder::DESC
		);
		return $mResult;
	}

	/**
	 * @return int
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function getOperationsCount($aSearchFilters = [])
	{
		$aSearchFilters = $this->getFilters($aSearchFilters);
		$iResult = $this->oEavManager->getEntitiesCount(
			\Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation::class,
			$aSearchFilters
		);
		return $iResult;
	}

	/**
	 *
	 * @param int|string $mIdOrUUID
	 * @return \Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation|bool
	 * @throws \Aurora\System\Exceptions\BaseException
	 */
	public function getOperationByIdOrUUID($mIdOrUUID)
	{
		$mOperation = false;
		if ($mIdOrUUID)
		{
			$mOperation = $this->oEavManager->getEntity($mIdOrUUID, \Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation::class);
		}
		else
		{
			throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\ComposeWordCounterPlugin\Enums\ErrorCodes::Validation_InvalidParameters);
		}
		return $mOperation;
	}

	/**
	 * @param string $sMessageId
	 * @param string $aBillUUIDs
	 * @return array
	 */
	public function getBillsOperationsByMessageId($sMessageId, $aBillUUIDs)
	{

		$aSearchFilters = [
			'MessageId'	=> $sMessageId,
			'BillUUID'	=> [$aBillUUIDs, 'IN']
		];
		$aResult = $this->getOperations(0, 0, $aSearchFilters);

		return $aResult;
	}

	/**
	 * @param \Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation $oOperation
	 * @return bool
	 */
	public function updateOperation(\Aurora\Modules\ComposeWordCounterPlugin\Classes\Operation $oOperation)
	{
		$bResult = false;
		if ($oOperation->validate())
		{
			if (!$this->oEavManager->saveEntity($oOperation))
			{
				throw new \Aurora\System\Exceptions\ManagerException(\Aurora\Modules\ComposeWordCounterPlugin\Enums\ErrorCodes::OperationUpdateFailed);
			}

			$bResult = true;
		}
		return $bResult;
	}

	public function getFilters($aSearchFilters = [])
	{
		if (is_array($aSearchFilters) && count($aSearchFilters) > 0)
		{
			$aSearchFilters = [
				'$AND'	=> $aSearchFilters,
				'$OR'	=> [
					'1@Deleted' => false,
					'2@Deleted' => ['NULL', 'IS']
				]
			];
		}
		else
		{
			$aSearchFilters = ['$OR' => [
				'1@Deleted' => false,
				'2@Deleted' => ['NULL', 'IS'],
			]];
		}
		return is_array($aSearchFilters) ? $aSearchFilters : [];
	}
}