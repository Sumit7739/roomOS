<?php

class ScheduleController {
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

    public function save() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['schedule'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Schedule data required']);
            return;
        }

        $scheduleJson = json_encode($data['schedule']);

        $stmt = $this->pdo->prepare("SELECT id FROM user_schedules WHERE user_id = ?");
        $stmt->execute([$userId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $this->pdo->prepare("UPDATE user_schedules SET schedule_json = ? WHERE user_id = ?");
            $stmt->execute([$scheduleJson, $userId]);
        } else {
            $stmt = $this->pdo->prepare("INSERT INTO user_schedules (user_id, schedule_json) VALUES (?, ?)");
            $stmt->execute([$userId, $scheduleJson]);
        }

        echo json_encode(['message' => 'Schedule saved successfully']);
    }

    public function get() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $stmt = $this->pdo->prepare("SELECT schedule_json FROM user_schedules WHERE user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();

        if ($result) {
            echo json_encode(['schedule' => json_decode($result['schedule_json'], true)]);
        } else {
            echo json_encode(['schedule' => null]);
        }
    }

    public function generatePlan() {
        $userId = $this->getUserIdFromToken();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }

        $stmt = $this->pdo->prepare("SELECT group_id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user['group_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'User not in a group']);
            return;
        }

        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Only admins can generate the plan']);
            return;
        }

        $stmt = $this->pdo->prepare("SELECT id, name FROM users WHERE group_id = ?");
        $stmt->execute([$user['group_id']]);
        $members = $stmt->fetchAll();

        if (count($members) < 2) {
            http_response_code(400);
            echo json_encode(['error' => 'Need at least 2 members']);
            return;
        }

        $memberIds = array_column($members, 'id');
        $placeholders = implode(',', array_fill(0, count($memberIds), '?'));
        $stmt = $this->pdo->prepare("SELECT user_id, schedule_json FROM user_schedules WHERE user_id IN ($placeholders)");
        $stmt->execute($memberIds);
        $schedules = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        if (count($schedules) < count($members)) {
            http_response_code(400);
            echo json_encode(['error' => 'Not all members have completed their schedules']);
            return;
        }

        $parsedSchedules = [];
        foreach ($schedules as $uid => $json) {
            $parsedSchedules[$uid] = json_decode($json, true);
        }

        $plan = $this->calculateOptimalPlan($members, $parsedSchedules);

        foreach ($plan as $dayIndex => $dayPlan) {
            $morning = json_encode($dayPlan['morning']);
            $night = json_encode($dayPlan['night']);
            $passengerM = $dayPlan['passenger_m'];
            $passengerN = $dayPlan['passenger_n'];

            $stmt = $this->pdo->prepare("SELECT id FROM roster WHERE group_id = ? AND day_index = ?");
            $stmt->execute([$user['group_id'], $dayIndex]);
            $existing = $stmt->fetch();

            if ($existing) {
                $stmt = $this->pdo->prepare("UPDATE roster SET morning = ?, night = ?, passenger_m = ?, passenger_n = ? WHERE group_id = ? AND day_index = ?");
                $stmt->execute([$morning, $night, $passengerM, $passengerN, $user['group_id'], $dayIndex]);
            } else {
                $stmt = $this->pdo->prepare("INSERT INTO roster (group_id, day_index, morning, night, passenger_m, passenger_n) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user['group_id'], $dayIndex, $morning, $night, $passengerM, $passengerN]);
            }
        }

        echo json_encode(['message' => 'Plan generated successfully', 'plan' => $plan]);
    }

    private function calculateOptimalPlan($members, $schedules) {
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $plan = [];
        
        // Track total shifts per person for fair rotation
        $totalShifts = [];
        foreach ($members as $member) {
            $totalShifts[$member['name']] = 0;
        }

        foreach ($days as $dayIndex => $dayName) {
            $peopleInfo = [];
            
            foreach ($members as $member) {
                $userId = $member['id'];
                $userName = $member['name'];
                $daySchedule = $schedules[$userId][$dayName] ?? null;

                if (!$daySchedule || $daySchedule['off']) {
                    $peopleInfo[] = [
                        'name' => $userName,
                        'classStart' => null,
                        'classEnd' => null,
                        'isOff' => true,
                        'classHours' => 0,
                        'shifts' => $totalShifts[$userName]
                    ];
                } else {
                    $start = $daySchedule['start'] ?? '00:00';
                    $end = $daySchedule['end'] ?? '23:59';
                    
                    // Calculate class duration in hours
                    $startTime = strtotime($start);
                    $endTime = strtotime($end);
                    $hours = ($endTime - $startTime) / 3600;
                    
                    $peopleInfo[] = [
                        'name' => $userName,
                        'classStart' => $start,
                        'classEnd' => $end,
                        'isOff' => false,
                        'classHours' => $hours,
                        'shifts' => $totalShifts[$userName]
                    ];
                }
            }

            // === MORNING SHIFT ASSIGNMENT ===
            // Rule: Need time to cook (6am-12pm)
            // If class starts before 11am → Can't cook
            // If class starts 11am or later → Can cook
            
            $morningWorkers = [];
            $morningPassengers = [];
            
            foreach ($peopleInfo as $person) {
                if ($person['isOff']) {
                    // Off day = can definitely cook
                    $morningWorkers[] = [
                        'name' => $person['name'],
                        'time' => 'Day Off',
                        'priority' => $person['shifts'] // Lower shifts = higher priority
                    ];
                } elseif ($person['classStart']) {
                    $startHour = (int)substr($person['classStart'], 0, 2);
                    $startMin = (int)substr($person['classStart'], 3, 2);
                    $startDecimal = $startHour + ($startMin / 60);
                    
                    if ($startDecimal >= 11.0) {
                        // Can cook! Has time before class
                        $morningWorkers[] = [
                            'name' => $person['name'],
                            'time' => 'Cook before leaving',
                            'priority' => $person['shifts']
                        ];
                    } else {
                        // Too early, can't cook
                        $morningPassengers[] = $person['name'];
                    }
                } else {
                    $morningPassengers[] = $person['name'];
                }
            }

            // Sort by priority (fewer shifts first) and pick top 2
            usort($morningWorkers, function($a, $b) {
                return $a['priority'] - $b['priority'];
            });
            
            $finalMorningWorkers = [];
            $morningWorkerNames = [];
            for ($i = 0; $i < min(2, count($morningWorkers)); $i++) {
                $finalMorningWorkers[] = [
                    'n' => $morningWorkers[$i]['name'],
                    't' => $morningWorkers[$i]['time']
                ];
                $morningWorkerNames[] = $morningWorkers[$i]['name'];
                $totalShifts[$morningWorkers[$i]['name']]++;
            }
            
            // Add remaining as passengers
            foreach ($peopleInfo as $person) {
                if (!in_array($person['name'], $morningWorkerNames)) {
                    $morningPassengers[] = $person['name'];
                }
            }
            $morningPassengers = array_unique($morningPassengers);

            // === NIGHT SHIFT ASSIGNMENT ===
            // Rule 1: Morning passengers MUST cook at night
            // Rule 2: Pair them with person who has LEAST classes that day
            
            $nightWorkers = [];
            
            // First, assign all morning passengers to night
            foreach ($morningPassengers as $passengerName) {
                // Find this person's info to check if off day
                $personInfo = null;
                foreach ($peopleInfo as $p) {
                    if ($p['name'] === $passengerName) {
                        $personInfo = $p;
                        break;
                    }
                }
                
                $nightWorkers[] = [
                    'name' => $passengerName,
                    'time' => $personInfo && $personInfo['isOff'] ? 'Free' : 'After class',
                    'priority' => 0 // Highest priority (must work)
                ];
            }
            
            // If we need more workers, add people with least class hours
            if (count($nightWorkers) < 2) {
                $availableForNight = [];
                foreach ($peopleInfo as $person) {
                    if (!in_array($person['name'], array_column($nightWorkers, 'name'))) {
                        $availableForNight[] = [
                            'name' => $person['name'],
                            'time' => $person['isOff'] ? 'Free' : 'After class',
                            'priority' => $person['classHours'] * 10 + $person['shifts'] // Less class hours = higher priority
                        ];
                    }
                }
                
                usort($availableForNight, function($a, $b) {
                    return $a['priority'] - $b['priority'];
                });
                
                foreach ($availableForNight as $person) {
                    if (count($nightWorkers) >= 2) break;
                    $nightWorkers[] = $person;
                }
            }
            
            $finalNightWorkers = [];
            $nightWorkerNames = [];
            foreach ($nightWorkers as $worker) {
                $finalNightWorkers[] = [
                    'n' => $worker['name'],
                    't' => $worker['time']
                ];
                $nightWorkerNames[] = $worker['name'];
                $totalShifts[$worker['name']]++;
            }

            // === PASSENGER ASSIGNMENT ===
            $allWorkers = array_unique(array_merge($morningWorkerNames, $nightWorkerNames));
            $passengerM = null;
            $passengerN = null;
            
            foreach ($peopleInfo as $person) {
                if (!in_array($person['name'], $allWorkers)) {
                    if (!$passengerM) {
                        $passengerM = $person['name'];
                    } elseif (!$passengerN) {
                        $passengerN = $person['name'];
                    }
                }
            }

            $plan[$dayIndex] = [
                'morning' => $finalMorningWorkers,
                'night' => $finalNightWorkers,
                'passenger_m' => $passengerM,
                'passenger_n' => $passengerN
            ];
        }

        return $plan;
    }
}
