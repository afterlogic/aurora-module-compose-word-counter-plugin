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
 * @property string $BillUUID
 * @property int $TotalChar
 * @property int $TotalWord
 * @property int $TypingSpeedCPM
 * @property int $ReadingSpeedWPM
 * @property double $Value
 * @property int $CurrencyId
 * @property string $MessageId
 * @property string $MessageSubject
 * @property text $MessageText
 * @property bool $Deleted
 * @property datetime  CreateDate
 *
 * @package Chat
 * @subpackage Classes
 */
class Operation extends \Aurora\System\EAV\Entity
{
	public function __construct($sModuleName)
	{
		$this->aStaticMap = [
			'BillUUID'			=> ['string', ''],
			'TotalChar'			=> ['int', 0],
			'TotalWord'			=> ['int', 0],
			'TypingSpeedCPM'	=> ['int', 0],
			'ReadingSpeedWPM'	=> ['int', 0],
			'HourlyRate'		=> ['int', 0],
			'Value'				=> ['double', 0],
			'CurrencyId'		=> ['int', 0],
			'MessageId'			=> ['string', ''],
			'MessageSubject'	=> ['string', ''],
			'MessageText'		=> ['text', ''],
			'MessageDate'		=> ['datetime', date('Y-m-d H:i:s', 0), true],
			'Sender'			=> ['string', ''],
			'IsIncoming'		=> ['bool', false],
			'Deleted'			=> ['bool', false],
			'CreateDate'		=> ['datetime', date('Y-m-d H:i:s', 0), true]
		];
		parent::__construct($sModuleName);
	}
}
