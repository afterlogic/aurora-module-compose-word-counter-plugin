<?php

namespace Aurora\Modules\ComposeWordCounterPlugin\Enums;

class UserRole extends \Aurora\System\Enums\AbstractEnumeration
{
	const Client = 0;
	const Lawyer = 1;

	/**
	 * @var array
	 */
	protected $aConsts = array(
		'Client' => self::Client,
		'Lawyer' => self::Lawyer
	);
}
