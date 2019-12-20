<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\ComposeWordCounterPlugin\Classes;

/**
 * @license https://www.gnu.org/licenses/agpl-3.0.html AGPL-3.0
 * @license https://afterlogic.com/products/common-licensing Afterlogic Software License
 * @copyright Copyright (c) 2019, Afterlogic Corp.
 * 
 * @property string $OwnerUserUUID
 * @property string ClientUserEmail
 * @property datetime  CreateDate
 * @property bool IsClosed
 *
 * @package Chat
 * @subpackage Classes
 */
class Bill extends \Aurora\System\EAV\Entity
{
	public function __construct($sModuleName)
	{
		$this->aStaticMap = [
			'OwnerUserUUID'		=> ['string', ''],
			'ClientUserEmail'	=> ['string', ''],
			'CreateDate'		=> ['datetime', date('Y-m-d H:i:s', 0), true],
			'IsClosed'			=> ['bool', false]
		];
		parent::__construct($sModuleName);
	}
}
