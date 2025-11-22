# RoomOS - Dashboard & Plan Generation Fixes

## 🐛 Issues Fixed

### 1. **Dashboard Not Showing Data**
**Problem:** Dashboard showed empty "Live Protocol"
**Cause:** Property name mismatch - backend uses `passenger_m`/`passenger_n`, frontend was looking for wrong properties
**Fix:** Updated `dashboard.js` to correctly read roster data and show fallback messages

### 2. **Plan Generation Empty on Off Days**
**Problem:** Days marked as "Off" had no shifts assigned
**Cause:** Algorithm was skipping people with off days
**Fix:** Updated logic - "Off Day" now means "Free ALL DAY" = PRIORITY for shift assignment

## 📦 Files to Upload

1. `web/js/ui/dashboard.js` - Fixed roster data display
2. `server/src/Controllers/ScheduleController.php` - Already uploaded (fixed algorithm)

## 🗄️ **CRITICAL: Database Migration Required**

You MUST run this SQL on your database:

```sql
CREATE TABLE IF NOT EXISTS `user_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `schedule_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`schedule_json`)),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_schedule_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## ✅ How to Test

### Step 1: Create the Database Table
1. Go to your database (phpMyAdmin or MySQL client)
2. Run the SQL above to create `user_schedules` table

### Step 2: Upload Files
1. Upload `web/js/ui/dashboard.js`
2. Verify `server/src/Controllers/ScheduleController.php` is uploaded
3. Verify `server/public/index.php` has schedule routes

### Step 3: Set Schedules
1. Go to Profile page (click profile icon in header)
2. Set your weekly schedule:
   - For class days: Set start/end times (e.g., 9:00 AM - 5:00 PM)
   - For off days: Check the "Off Day" checkbox
3. Click "Save Schedule"
4. Have all group members do the same

### Step 4: Generate Plan
1. Once all members have saved schedules
2. Click "Generate Weekly Plan" button
3. System will create optimal roster
4. Navigate to "Plan" page to see results

### Step 5: Check Dashboard
1. Go to Home (Dashboard)
2. Should show:
   - **Live Protocol**: Current shift workers (e.g., "Sumit + Aditya")
   - **Passenger**: Off-duty person
   - **Badge**: Morning ☀️ or Night 🌙

## 🎯 Expected Behavior

### Dashboard Display:
```
Live Protocol
Sumit + Aditya
Active Team (Cook+Clean)  [☀️ MORNING]

Passenger (Off-Duty)
Priyanshu
Relaxing / Sleeping / Class
```

### Plan Generation for Off Days:
**Example: Friday (Off Day for everyone)**
- Morning Shift: Person A + Person B (Free all day)
- Night Shift: Person A + Person C (Free all day)
- Passenger: Person B (not working this shift)

**Everyone gets assigned because off day = fully available!**

## ⚠️ Troubleshooting

### "Not all members have completed their schedules"
- Make sure EVERY group member has:
  1. Gone to Profile page
  2. Set their weekly schedule
  3. Clicked "Save Schedule"

### Dashboard still empty
- Check if roster data exists in database
- Try manually editing a day in Plan page first
- Then check dashboard again

### Plan generation not working
- Verify `user_schedules` table exists
- Check browser console for errors
- Verify all backend files are uploaded

## 🚀 Quick Fix Checklist

- [ ] Run SQL migration to create `user_schedules` table
- [ ] Upload `web/js/ui/dashboard.js`
- [ ] Upload `server/src/Controllers/ScheduleController.php`
- [ ] Upload `server/public/index.php`
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] All members set schedules in Profile
- [ ] Click "Generate Weekly Plan"
- [ ] Check Plan page for results
- [ ] Check Dashboard for live protocol

The dashboard should now show current shift workers and the plan should assign shifts on off days! 🎉
