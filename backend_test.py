import requests
import sys
import json
from datetime import datetime

class StartupConnectAPITester:
    def __init__(self, base_url="https://preview-mode-51.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different users
        self.user_ids = {}  # Store user IDs for different roles
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                if response.text:
                    try:
                        error_data = response.json()
                        details += f", Error: {error_data.get('detail', 'Unknown error')}"
                    except:
                        details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_user_registration(self, role, email, password, full_name):
        """Test user registration for different roles"""
        success, response = self.run_test(
            f"Register {role} user",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": password,
                "full_name": full_name,
                "role": role
            }
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.user_ids[role] = response['user']['id']
            return True
        return False

    def test_user_login(self, role, email, password):
        """Test user login"""
        success, response = self.run_test(
            f"Login {role} user",
            "POST",
            "auth/login",
            200,
            data={
                "email": email,
                "password": password
            }
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.user_ids[role] = response['user']['id']
            return True
        return False

    def test_get_current_user(self, role):
        """Test getting current user info"""
        success, response = self.run_test(
            f"Get current user ({role})",
            "GET",
            "auth/me",
            200,
            token=self.tokens.get(role)
        )
        return success

    def test_profile_update(self, role):
        """Test profile update"""
        profile_data = {
            "bio": f"Test bio for {role}",
            "skills": ["Python", "React", "MongoDB"],
            "experience": "5 years of experience",
            "location": "Bangalore, India",
            "company": "Test Company",
            "linkedin": "https://linkedin.com/in/test"
        }
        
        success, response = self.run_test(
            f"Update profile ({role})",
            "PUT",
            "profile",
            200,
            data=profile_data,
            token=self.tokens.get(role)
        )
        return success

    def test_job_creation(self):
        """Test job creation by startup"""
        job_data = {
            "title": "Senior Full Stack Developer",
            "company": "Test Startup Inc",
            "description": "We are looking for a senior full stack developer to join our team.",
            "requirements": ["React", "Node.js", "MongoDB", "5+ years experience"],
            "location": "Bangalore, India",
            "job_type": "full-time",
            "salary_range": "15-25 LPA"
        }
        
        success, response = self.run_test(
            "Create job (startup)",
            "POST",
            "jobs",
            200,
            data=job_data,
            token=self.tokens.get('startup')
        )
        
        if success and 'id' in response:
            self.job_id = response['id']
            return True
        return False

    def test_get_jobs(self):
        """Test getting all jobs"""
        success, response = self.run_test(
            "Get all jobs",
            "GET",
            "jobs",
            200
        )
        return success

    def test_job_application(self):
        """Test job application by job seeker"""
        if not hasattr(self, 'job_id'):
            self.log_test("Apply to job (job_seeker)", False, "No job ID available")
            return False
            
        application_data = {
            "job_id": self.job_id,
            "cover_letter": "I am very interested in this position and believe I would be a great fit."
        }
        
        success, response = self.run_test(
            "Apply to job (job_seeker)",
            "POST",
            "applications",
            200,
            data=application_data,
            token=self.tokens.get('job_seeker')
        )
        return success

    def test_get_applications(self):
        """Test getting user's applications"""
        success, response = self.run_test(
            "Get my applications (job_seeker)",
            "GET",
            "applications/my",
            200,
            token=self.tokens.get('job_seeker')
        )
        return success

    def test_mentor_profile_creation(self):
        """Test mentor profile creation"""
        mentor_data = {
            "expertise": ["Product Management", "Fundraising", "Marketing"],
            "bio": "Experienced entrepreneur with 10+ years in startups",
            "experience_years": 10,
            "hourly_rate": 2000.0,
            "availability": ["Monday", "Wednesday", "Friday"]
        }
        
        success, response = self.run_test(
            "Create mentor profile",
            "POST",
            "mentors/profile",
            200,
            data=mentor_data,
            token=self.tokens.get('mentor')
        )
        return success

    def test_get_mentors(self):
        """Test getting all mentors"""
        success, response = self.run_test(
            "Get all mentors",
            "GET",
            "mentors",
            200
        )
        return success

    def test_session_booking(self):
        """Test session booking by mentee"""
        if 'mentor' not in self.user_ids:
            self.log_test("Book session (mentee)", False, "No mentor user ID available")
            return False
            
        session_data = {
            "mentor_id": self.user_ids['mentor'],
            "session_date": "2024-12-25T10:00:00",
            "duration": 60,
            "topic": "Need help with product strategy and go-to-market planning"
        }
        
        success, response = self.run_test(
            "Book session (mentee)",
            "POST",
            "sessions",
            200,
            data=session_data,
            token=self.tokens.get('mentee')
        )
        return success

    def test_get_sessions(self):
        """Test getting user's sessions"""
        success, response = self.run_test(
            "Get my sessions (mentee)",
            "GET",
            "sessions/my",
            200,
            token=self.tokens.get('mentee')
        )
        return success

    def test_send_message(self):
        """Test sending a message"""
        if 'mentor' not in self.user_ids:
            self.log_test("Send message (mentee)", False, "No mentor user ID available")
            return False
            
        message_data = {
            "receiver_id": self.user_ids['mentor'],
            "content": "Hi! I'm interested in booking a session with you."
        }
        
        success, response = self.run_test(
            "Send message (mentee)",
            "POST",
            "messages",
            200,
            data=message_data,
            token=self.tokens.get('mentee')
        )
        return success

    def test_get_conversations(self):
        """Test getting conversations"""
        success, response = self.run_test(
            "Get conversations (mentee)",
            "GET",
            "messages/conversations/list",
            200,
            token=self.tokens.get('mentee')
        )
        return success

    def test_ai_job_matching(self):
        """Test AI job matching"""
        success, response = self.run_test(
            "AI job matching (job_seeker)",
            "POST",
            "ai/match-jobs",
            200,
            token=self.tokens.get('job_seeker')
        )
        return success

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting StartupConnect API Tests...")
        print("=" * 50)

        # Test users with timestamp to avoid conflicts
        timestamp = datetime.now().strftime('%H%M%S')
        test_users = {
            'startup': {
                'email': f'startup_{timestamp}@test.com',
                'password': 'test123',
                'full_name': 'Test Startup Company'
            },
            'job_seeker': {
                'email': f'jobseeker_{timestamp}@test.com',
                'password': 'test123',
                'full_name': 'Test Job Seeker'
            },
            'mentor': {
                'email': f'mentor_{timestamp}@test.com',
                'password': 'test123',
                'full_name': 'Test Mentor'
            },
            'mentee': {
                'email': f'mentee_{timestamp}@test.com',
                'password': 'test123',
                'full_name': 'Test Mentee'
            }
        }

        # 1. Health Check
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False

        # 2. User Registration
        print("\n📝 Testing User Registration...")
        for role, user_data in test_users.items():
            if not self.test_user_registration(role, **user_data):
                print(f"❌ Failed to register {role}. Stopping tests.")
                return False

        # 3. User Authentication
        print("\n🔐 Testing User Authentication...")
        for role, user_data in test_users.items():
            self.test_get_current_user(role)

        # 4. Profile Management
        print("\n👤 Testing Profile Management...")
        for role in test_users.keys():
            self.test_profile_update(role)

        # 5. Job Management
        print("\n💼 Testing Job Management...")
        self.test_job_creation()
        self.test_get_jobs()
        self.test_job_application()
        self.test_get_applications()

        # 6. Mentorship System
        print("\n🎓 Testing Mentorship System...")
        self.test_mentor_profile_creation()
        self.test_get_mentors()
        self.test_session_booking()
        self.test_get_sessions()

        # 7. Messaging System
        print("\n💬 Testing Messaging System...")
        self.test_send_message()
        self.test_get_conversations()

        # 8. AI Features
        print("\n🤖 Testing AI Features...")
        self.test_ai_job_matching()

        # Print Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = StartupConnectAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())