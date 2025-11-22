<?php

class TestController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function index() {
        echo json_encode(['message' => 'Test controller working']);
    }

    public function debugInfo() {
        echo json_encode([
            'REQUEST_URI' => $_SERVER['REQUEST_URI'],
            'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'],
            'PHP_SELF' => $_SERVER['PHP_SELF'],
            'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'],
            'cwd' => getcwd(),
        ]);
    }
}
