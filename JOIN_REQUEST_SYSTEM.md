# RoomOS - Join Request System & Profile Updates

## ✅ New Features

### 1. **Join Request System**
Users now need admin approval to join groups:

**Flow:**
1. User enters group ID and clicks "Join Group"
2. System creates a **pending join request**
3. Admin sees pending requests in their **Profile page**
4. Admin can **Approve** or **Reject** the request
5. If approved, user is added to the group

### 2. **Profile Page Updates**
- ✅ **Group ID displayed** (Role | Group ID grid)
- ✅ **Pending Requests card** (admins only)
- ✅ Shows requester name, email, and date
- ✅ Approve/Reject buttons

## 📦 Files to Upload

**Backend:**
1. `server/database/schema.sql` - Added `join_requests` table
2. `server/src/Controllers/GroupController.php` - Join request logic
3. `server/public/index.php` - New routes

**Frontend:**
4. `web/js/ui/profile.js` - Group ID display + pending requests UI

## 🗄️ Database Migration

Run this SQL to create the join_requests table:

```sql
CREATE TABLE `join_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `fk_joinreq_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_joinreq_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## 🔗 New API Endpoints

1. **POST** `/group/join` - Create join request (modified)
2. **GET** `/group/pending-requests` - Get pending requests (admin only)
3. **POST** `/group/approve-request` - Approve request (admin only)
4. **POST** `/group/reject-request` - Reject request (admin only)

## 🎯 How It Works

### **User Joining:**
```javascript
// User enters group ID: 123
POST /group/join
{ "group_id": 123 }

// Response:
{ "message": "Join request sent. Waiting for admin approval.", "status": "pending" }
```

### **Admin Viewing Requests:**
```javascript
GET /group/pending-requests

// Response:
{
  "requests": [
    {
      "id": 5,
      "user_id": 10,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2025-11-22 05:30:00"
    }
  ]
}
```

### **Admin Approving:**
```javascript
POST /group/approve-request
{ "request_id": 5 }

// User is added to group
// Request status → "approved"
```

## 📱 UI Updates

### **Profile Page (All Users):**
```
Account Information
┌─────────────────────────┐
│ [A]  Alice              │
│      alice@email.com    │
│                         │
│ Role        Group ID    │
│ admin       123         │
└─────────────────────────┘
```

### **Profile Page (Admin with Pending Requests):**
```
Pending Join Requests
2 request(s) waiting for approval

┌─────────────────────────┐
│ John Doe                │
│ john@example.com        │
│ 11/22/2025              │
│                         │
│ [✓ Approve] [✗ Reject]  │
└─────────────────────────┘
```

## ⚠️ Important Notes

1. **Existing users** who joined before this update are already in groups (no change)
2. **New users** must wait for admin approval
3. **Admins** see pending requests immediately on Profile page
4. **Request status** tracked: pending → approved/rejected
5. **Group ID** now visible to all users in Profile

## 🚀 Testing Steps

1. Run SQL migration to create `join_requests` table
2. Upload all backend files
3. Upload `web/js/ui/profile.js`
4. Hard refresh browser
5. **Test as new user:**
   - Try to join group with ID
   - Should see "Waiting for admin approval"
6. **Test as admin:**
   - Go to Profile
   - See pending requests card
   - Click Approve/Reject
7. **Verify:**
   - Approved user can now access group features
   - Group ID shows in Profile

The join request system is now fully functional! 🎉
