# RoomOS - Schedule & Auto-Plan Generation

## ✅ What's New

### 1. **Database Schema Update**
- Added `user_schedules` table to store weekly class schedules
- Stores schedule as JSON: `{Monday:{start:"09:00",end:"17:00",off:false},...}`

### 2. **Backend API (ScheduleController)**
Three new endpoints:
- `POST /schedule/save` - Save user's weekly schedule
- `GET /schedule/get` - Retrieve user's schedule
- `POST /schedule/generate-plan` - Auto-generate weekly plan

### 3. **Profile Page Enhancements**
- **Off Day Checkboxes** - Mark days when you don't have classes
- **Time Inputs** - Set class start/end times for each day
- **Auto-disable** - Time inputs disabled when "Off Day" is checked
- **Save Schedule** - Saves to database
- **Generate Plan** - Creates optimal weekly roster

### 4. **Auto-Plan Algorithm**
The system analyzes everyone's schedules and:
1. Checks who is available each day (not off, not in class)
2. Assigns morning shift (6am-4pm) to those free during that time
3. Assigns night shift (4pm-2am) to those free during that time
4. Assigns passengers (off-duty) to those not working
5. Saves the generated plan to the roster table

## 📦 Files to Upload

**Backend:**
1. `server/database/schema.sql` - Updated with user_schedules table
2. `server/src/Controllers/ScheduleController.php` - NEW schedule controller
3. `server/public/index.php` - Added schedule routes

**Frontend:**
4. `web/js/ui/profile.js` - Updated with checkboxes and backend integration

## 🗄️ Database Migration

Run this SQL to add the new table:

```sql
CREATE TABLE `user_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `schedule_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`schedule_json`)),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_schedule_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## 🎯 How It Works

### User Flow:

1. **Go to Profile** (click profile icon in header)
2. **Set Weekly Schedule**:
   - For each day, either:
     - Check "Off Day" if no classes
     - OR set start/end times (e.g., 9:00 AM to 5:00 PM)
3. **Click "Save Schedule"**
4. **Wait for all group members** to complete their schedules
5. **Click "Generate Weekly Plan"**
6. System creates optimal roster based on availability
7. View the generated plan in the **Plan** page

### Example Schedule:
```
Monday: 9:00 AM - 5:00 PM (in class)
Tuesday: 9:00 AM - 3:00 PM (in class)
Wednesday: 9:00 AM - 5:00 PM (in class)
Thursday: 9:00 AM - 3:00 PM (in class)
Friday: ✓ Off Day
Saturday: ✓ Off Day
Sunday: 2:00 PM - 6:00 PM (in class)
```

### Plan Generation Logic:
- **Morning Shift (6am-4pm)**: Assigned to members free during these hours
- **Night Shift (4pm-2am)**: Assigned to members free during these hours
- **Passenger**: Members not assigned to any shift

## ⚠️ Important Notes

1. **All members must complete schedules** before generating plan
2. **Off Day checkbox** prevents confusion with 00:00 times
3. **Plan overwrites** existing roster when generated
4. **Manual editing** still available on Plan page

## 🚀 Next Steps

After uploading:
1. Run the SQL migration to create `user_schedules` table
2. Upload all backend files
3. Upload frontend profile.js
4. Hard refresh browser
5. Set your schedule in Profile
6. Generate the plan!

The system will intelligently assign shifts based on when everyone is free! 🎉
