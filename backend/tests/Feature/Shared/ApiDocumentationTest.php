<?php

it('serves the swagger ui page', function () {
    $this->get('/api/documentation')
        ->assertOk()
        ->assertSee('swagger-ui', false);
});

it('generates the openapi document with v1 routes', function () {
    $this->getJson('/docs/api.json')
        ->assertOk()
        ->assertJsonPath('info.title', 'Bakht Stroy API')
        ->assertJsonStructure(['paths' => ['/health']]);
});
