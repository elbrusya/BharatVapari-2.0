# Name Editing Feature - User Guide

## How to Edit Your Name

### Step-by-Step Instructions

1. **Login to your account**
   - Use your email and password, or Google OAuth
   - Any account type (Startup, Job Seeker, Mentor, Mentee, Admin)

2. **Navigate to Profile Page**
   - Click on "Profile" in the top navigation bar
   - Or click on "Edit Profile" / "Complete Profile" button from Dashboard

3. **Find the Name Field**
   - The "Full Name" field is located at the TOP of the profile form
   - It's the FIRST field in the form
   - Has a User icon next to the label
   - Marked with a red asterisk (*) indicating it's required

4. **Edit Your Name**
   - Click in the "Full Name" input field
   - Clear the existing name
   - Type your new name
   - Example: "John Doe" → "Jonathan Doe"

5. **Save Changes**
   - Scroll down to the bottom of the form
   - Click the "Save Profile" button
   - Wait for the success message: "Profile updated successfully!"
   - The page will automatically reload

6. **Verify Changes**
   - After reload, check that your new name appears in:
     - Profile page header (top of page)
     - Dashboard welcome message ("Welcome back, [Your Name]!")
     - Profile form (should show updated name)

## Important Notes

✅ **Available to All Users**
- Startup founders can edit their name
- Job seekers can edit their name
- Mentors can edit their name
- Mentees can edit their name
- Admins can edit their name

✅ **Required Field**
- You cannot leave the name field empty
- The form will show an error if you try to save without a name

✅ **Immediate Effect**
- Changes take effect immediately after saving
- All pages will show your new name after the reload

✅ **Affects Multiple Places**
- Profile page
- Dashboard
- Chat messages
- Job applications
- Mentor profiles
- Anywhere your name is displayed

## Troubleshooting

**Issue: Name not updating**
- Solution: Refresh the page (F5 or Ctrl+R)
- Solution: Clear browser cache and reload

**Issue: Form not saving**
- Solution: Make sure all required fields are filled
- Solution: Check your internet connection
- Solution: Try logging out and back in

**Issue: Old name still showing**
- Solution: Wait a few seconds for the page to fully reload
- Solution: Navigate away and back to the page

## Technical Details

- **API Endpoint:** PUT /api/profile
- **Database Field:** users.full_name
- **Frontend Component:** /frontend/src/pages/Profile.js
- **Backend Model:** UserProfile (server.py)

## Privacy & Security

- ✅ Only you can edit your own name
- ✅ Changes are saved securely in the database
- ✅ Name changes are logged for security
- ✅ You can change your name as many times as needed

## Examples

**Before:** John Smith
**After:** John Robert Smith

**Before:** Jane
**After:** Jane Doe

**Before:** user123
**After:** Sarah Johnson

## Need Help?

If you experience any issues editing your name:
1. Check this guide first
2. Try the troubleshooting steps above
3. Contact support if the issue persists
4. Provide your account email and description of the problem
