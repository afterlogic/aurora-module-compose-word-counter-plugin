<?php
/*
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\ComposeWordCounterPlugin\Enums;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 */
class ErrorCodes
{
	const ClientAndOwnerSamePerson		= 1001;
	const OperationCreateFailed			= 1002;
	const Validation_InvalidParameters	= 1003;
	const OperationUpdateFailed			= 1004;
	const BillCreateFailed				= 1005;
	const BillUpdateFailed				= 1006;
	const OperationAlreadyInOpenBill	= 1007;
	const OperationAlreadyInClosedBill	= 1008;

	/**
	 * @var array
	 */
	protected $aConsts = [
		'ClientAndOwnerSamePerson'		=> self::ClientAndOwnerSamePerson,
		'OperationCreateFailed'			=> self::SaleCreateFailed,
		'Validation_InvalidParameters'	=> self::Validation_InvalidParameters,
		'OperationUpdateFailed'			=> self::OperationUpdateFailed,
		'BillCreateFailed'				=> self::BillCreateFailed,
		'BillUpdateFailed'				=> self::BillUpdateFailed,
		'OperationAlreadyInOpenBill'	=> self::OperationAlreadyInOpenBill,
		'OperationAlreadyInClosedBill'	=> self::OperationAlreadyInClosedBill
	];
}
