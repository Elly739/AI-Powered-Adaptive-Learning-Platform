import urllib.request
import urllib.parse
import json

BASE = "http://127.0.0.1:8000"

def call(path, method="GET", data=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if data and method != "GET":
        if isinstance(data, dict):
            data = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
        elif isinstance(data, str):
            data = data.encode()

    req = urllib.request.Request(f"{BASE}{path}", data=data, method=method, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"ERROR {e.code}: {body}")
        raise

# Login
token_data = call("/auth/login", "POST", urllib.parse.urlencode({"username": "student1@university.edu", "password": "password123"}))
token = token_data["access_token"]
print(f"Login OK: token starts with {token[:20]}...")

# Test courses
courses = call("/courses", token=token)
print(f"Courses: {len(courses)}")
for c in courses:
    lesson_count = len(c.get("lessons", []))
    print(f"  - {c['title']} ({c['code']}), lessons={lesson_count}")

# Test dashboard
stats = call("/dashboard/stats", token=token)
print(f"Dashboard: courses={stats['total_courses']}, streak={stats['streak_days']}, difficulty={stats['preferred_difficulty']}")
print(f"  detected_style={stats['detected_style']}")

# Test quiz
quizzes = call("/quizzes", token=token)
print(f"Quizzes: {len(quizzes)}")

if quizzes:
    quiz_id = quizzes[0]["id"]
    init = call(f"/quizzes/{quiz_id}/attempts/start", "POST", token=token)
    q = init["questions"][0]
    print(f"Quiz started: attempt_id={init['attempt_id']}, difficulty={init['current_difficulty']}")
    print(f"  First Q: {q['question_text'][:60]}")

    # Submit correct answer (first option might not be correct, but just testing)
    result = call(f"/quizzes/{quiz_id}/attempts/{init['attempt_id']}/answer", "POST", {
        "question_id": q["question_id"],
        "selected_answer": q["options"][0],
    }, token=token)
    print(f"Answer submitted: complete={result['is_complete']}")
    if result["question"]:
        print(f"  Next Q: {result['question']['question_text'][:60]}")
    else:
        print(f"  Score: {result['score']}/{result['max_score']}")

# Test schedule generation
ScheduleResult = call(f"/schedule/generate/{courses[0]['id']}", "POST", token=token)
print(f"Schedule generated: {ScheduleResult}")

# Test schedule list
schedules = call("/schedule", token=token)
print(f"Schedule items: {len(schedules)}")

# Test recommendations
recs = call("/schedule/recommendations", token=token)
print(f"Recommendations: {len(recs)}")

print("\nAll API tests passed!")
