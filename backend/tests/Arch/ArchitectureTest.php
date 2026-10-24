<?php

arch('shared and module code uses strict types')
    ->expect(['App\Shared', 'App\Modules'])
    ->toUseStrictTypes();

arch('no debugging statements are left in the code')
    ->expect(['dd', 'dump', 'ray', 'var_dump'])
    ->not->toBeUsed();
