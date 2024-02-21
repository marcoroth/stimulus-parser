<?php

use Tonysm\ImportmapLaravel\Facades\Importmap;

Importmap::pinAllFrom("resources/js", to: "js/");

Importmap::pin("@hotwired/stimulus-loading", to: "/vendor/stimulus-laravel/stimulus-loading.js");
Importmap::pin("@hotwired/stimulus", to: "/js/vendor/@hotwired--stimulus.js"); // @hotwired/stimulus@3.2.2 downloaded from https://ga.jspm.io/npm:@hotwired/stimulus@3.2.2/dist/stimulus.js
