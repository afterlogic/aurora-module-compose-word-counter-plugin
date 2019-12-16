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
	public function init()
	{
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
}
