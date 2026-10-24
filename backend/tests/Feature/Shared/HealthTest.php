<?php

it('returns ok status', function () {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertJsonPath('data.status', 'ok')
        ->assertJsonStructure(['data' => ['status', 'version', 'time']]);
});
