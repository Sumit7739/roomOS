<?php

class GroupController {
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

    public function create() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Group name required']);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            // Create Group
            $stmt = $this->pdo->prepare("INSERT INTO `groups` (name) VALUES (?)");
            $stmt->execute([$data['name']]);
            $groupId = $this->pdo->lastInsertId();

            // Update User
            $stmt = $this->pdo->prepare("UPDATE users SET group_id = ?, role = 'admin' WHERE id = ?");
            $stmt->execute([$groupId, $userId]);

            $this->pdo->commit();

            echo json_encode(['message' => 'Group created', 'group_id' => $groupId]);
        } catch (Exception $e) {
            $this->pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create group: ' . $e->getMessage()]);
        }
    }

    public function join() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['group_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Group ID required']);
            return;
        }

        // Verify Group Exists
        $stmt = $this->pdo->prepare("SELECT id FROM `groups` WHERE id = ?");
        $stmt->execute([$data['group_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Group not found']);
            return;
        }

        // Update User
        $stmt = $this->pdo->prepare("UPDATE users SET group_id = ? WHERE id = ?");
        $stmt->execute([$data['group_id'], $userId]);

        echo json_encode(['message' => 'Joined group successfully']);
    }

    public function members() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        // Get User's Group
        $stmt = $this->pdo->prepare("SELECT group_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user['group_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'User not in a group']);
            return;
        }

        // Get Members
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.name, u.email, u.role 
            FROM users u 
            WHERE u.group_id = ?
        ");
        $stmt->execute([$user['group_id']]);
        $members = $stmt->fetchAll();

        echo json_encode(['members' => $members]);
    }
}
