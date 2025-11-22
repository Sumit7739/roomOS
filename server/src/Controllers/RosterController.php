<?php

class RosterController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    private function getUserIdFromToken() {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) return null;
        
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        
        $stmt = $this->pdo->prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
        
        return $session ? $session['user_id'] : null;
    }

    private function getUserGroup($userId) {
        $stmt = $this->pdo->prepare("SELECT group_id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function getWeek() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $user = $this->getUserGroup($userId);
        if (!$user['group_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'No group']);
            return;
        }

        $stmt = $this->pdo->prepare("SELECT * FROM roster WHERE group_id = ? ORDER BY day_index ASC");
        $stmt->execute([$user['group_id']]);
        $roster = $stmt->fetchAll();

        // If empty, init empty roster
        if (empty($roster)) {
            $roster = $this->initRoster($user['group_id']);
        }

        echo json_encode(['roster' => $roster, 'role' => $user['role']]);
    }

    public function getToday() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $user = $this->getUserGroup($userId);
        
        // 0 = Monday in DB, but PHP date('w') is 0=Sunday.
        // Let's map: Mon(1)->0, Tue(2)->1 ... Sun(0)->6
        $w = date('w'); 
        $dayIndex = ($w == 0) ? 6 : $w - 1;

        $stmt = $this->pdo->prepare("SELECT * FROM roster WHERE group_id = ? AND day_index = ?");
        $stmt->execute([$user['group_id'], $dayIndex]);
        $today = $stmt->fetch();

        echo json_encode(['day' => $today]);
    }

    public function update() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $user = $this->getUserGroup($userId);
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Only admins can edit roster']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        // Expect: { day_index: 0, morning: ["A","B"], night: ["C","D"], passenger_m: "E", passenger_n: "F" }

        $stmt = $this->pdo->prepare("
            UPDATE roster 
            SET morning = ?, night = ?, passenger_m = ?, passenger_n = ? 
            WHERE group_id = ? AND day_index = ?
        ");

        $stmt->execute([
            json_encode($data['morning']),
            json_encode($data['night']),
            $data['passenger_m'],
            $data['passenger_n'],
            $user['group_id'],
            $data['day_index']
        ]);

        echo json_encode(['message' => 'Roster updated']);
    }

    private function initRoster($groupId) {
        // Create 7 days
        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $stmt = $this->pdo->prepare("INSERT INTO roster (group_id, day_index, morning, night) VALUES (?, ?, '[]', '[]')");
            $stmt->execute([$groupId, $i]);
            $days[] = [
                'day_index' => $i,
                'morning' => '[]',
                'night' => '[]',
                'passenger_m' => null,
                'passenger_n' => null
            ];
        }
        return $days;
    }
}
