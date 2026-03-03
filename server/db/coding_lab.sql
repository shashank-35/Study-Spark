-- ============================================================
-- Study Spark  —  Coding Lab  —  Supabase SQL Setup
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── 1. coding_problems ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS coding_problems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT             NOT NULL,
  description TEXT             NOT NULL,
  difficulty  TEXT             NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags        TEXT[]           DEFAULT '{}',
  boilerplate JSONB            DEFAULT '{}',  -- { javascript: '...', python: '...', ... }
  test_cases  JSONB            DEFAULT '[]',  -- [{ id, input, expected_output }]
  created_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- ── 2. coding_submissions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS coding_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT         NOT NULL DEFAULT 'anonymous',
  problem_id     UUID         REFERENCES coding_problems(id) ON DELETE SET NULL,
  language       TEXT         NOT NULL,
  code           TEXT         NOT NULL,
  output         TEXT         DEFAULT '',
  status         TEXT         NOT NULL DEFAULT 'unknown'
                               CHECK (status IN ('accepted', 'error', 'running', 'unknown')),
  execution_time NUMERIC(10,4),
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ── 3. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_submissions_user     ON coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem  ON coding_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created  ON coding_submissions(created_at DESC);

-- ── 4. Enable Realtime ───────────────────────────────────────
-- Run in Supabase Dashboard → Replication → Tables → enable for coding_submissions

-- ── 5. Row Level Security ────────────────────────────────────
ALTER TABLE coding_problems    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read problems
CREATE POLICY "public_read_problems"
  ON coding_problems FOR SELECT USING (true);

-- Allow anyone to insert/update/delete problems (adjust for production)
CREATE POLICY "public_write_problems"
  ON coding_problems FOR ALL USING (true) WITH CHECK (true);

-- Allow anyone to read submissions (useful for leaderboard)
CREATE POLICY "public_read_submissions"
  ON coding_submissions FOR SELECT USING (true);

-- Allow insert for any logged-in user (or anon for demo)
CREATE POLICY "public_insert_submissions"
  ON coding_submissions FOR INSERT WITH CHECK (true);

-- ── 6. Seed default problems ────────────────────────────────
INSERT INTO coding_problems (title, description, difficulty, tags, boilerplate, test_cases)
VALUES
(
  'Sum of Two Numbers',
  'Write a program that reads two numbers and prints their sum.',
  'easy',
  ARRAY['math', 'basics'],
  '{
    "javascript": "// Read from stdin or hardcode for testing\nconst a = 5, b = 10;\nconsole.log(a + b);",
    "python": "a = 5\nb = 10\nprint(a + b)",
    "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    int a = 5, b = 10;\n    cout << a + b << endl;\n    return 0;\n}",
    "java": "public class Solution {\n    public static void main(String[] args) {\n        int a = 5, b = 10;\n        System.out.println(a + b);\n    }\n}"
  }',
  '[{"id":"1","input":"5 10","expected_output":"15"},{"id":"2","input":"20 30","expected_output":"50"}]'
),
(
  'Factorial of a Number',
  'Calculate the factorial of a given number n (0 <= n <= 12).',
  'easy',
  ARRAY['math', 'recursion'],
  '{
    "javascript": "function factorial(n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\nconsole.log(factorial(5));",
    "python": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))",
    "cpp": "#include <iostream>\nusing namespace std;\nlong long factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\nint main() {\n    cout << factorial(5) << endl;\n    return 0;\n}",
    "java": "public class Solution {\n    static long factorial(int n) {\n        if (n <= 1) return 1;\n        return n * factorial(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println(factorial(5));\n    }\n}"
  }',
  '[{"id":"1","input":"5","expected_output":"120"},{"id":"2","input":"0","expected_output":"1"}]'
),
(
  'Reverse a String',
  'Given a string, print its reverse.',
  'easy',
  ARRAY['strings', 'basics'],
  '{
    "javascript": "const str = \"hello\";\nconsole.log(str.split(\"\").reverse().join(\"\"));",
    "python": "s = \"hello\"\nprint(s[::-1])",
    "cpp": "#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s = \"hello\";\n    reverse(s.begin(), s.end());\n    cout << s << endl;\n    return 0;\n}",
    "java": "public class Solution {\n    public static void main(String[] args) {\n        String s = \"hello\";\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}"
  }',
  '[{"id":"1","input":"hello","expected_output":"olleh"},{"id":"2","input":"world","expected_output":"dlrow"}]'
),
(
  'Check Prime',
  'Given a positive integer n, print True if it is prime, False otherwise.',
  'medium',
  ARRAY['math', 'algorithms'],
  '{
    "javascript": "function isPrime(n) {\n    if (n < 2) return false;\n    for (let i = 2; i <= Math.sqrt(n); i++) {\n        if (n % i === 0) return false;\n    }\n    return true;\n}\nconsole.log(isPrime(7));",
    "python": "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint(is_prime(7))",
    "cpp": "#include <iostream>\n#include <cmath>\nusing namespace std;\nbool isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i <= sqrt(n); i++)\n        if (n % i == 0) return false;\n    return true;\n}\nint main() {\n    cout << (isPrime(7) ? \"true\" : \"false\") << endl;\n    return 0;\n}",
    "java": "public class Solution {\n    static boolean isPrime(int n) {\n        if (n < 2) return false;\n        for (int i = 2; i <= Math.sqrt(n); i++)\n            if (n % i == 0) return false;\n        return true;\n    }\n    public static void main(String[] args) {\n        System.out.println(isPrime(7));\n    }\n}"
  }',
  '[{"id":"1","input":"7","expected_output":"true"},{"id":"2","input":"10","expected_output":"false"}]'
),
(
  'FizzBuzz',
  'Print numbers from 1 to 20. For multiples of 3 print Fizz, for multiples of 5 print Buzz, for both print FizzBuzz.',
  'easy',
  ARRAY['basics', 'loops'],
  '{
    "javascript": "for (let i = 1; i <= 20; i++) {\n    if (i % 15 === 0) console.log(\"FizzBuzz\");\n    else if (i % 3 === 0) console.log(\"Fizz\");\n    else if (i % 5 === 0) console.log(\"Buzz\");\n    else console.log(i);\n}",
    "python": "for i in range(1, 21):\n    if i % 15 == 0:\n        print(\"FizzBuzz\")\n    elif i % 3 == 0:\n        print(\"Fizz\")\n    elif i % 5 == 0:\n        print(\"Buzz\")\n    else:\n        print(i)",
    "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    for (int i = 1; i <= 20; i++) {\n        if (i % 15 == 0) cout << \"FizzBuzz\";\n        else if (i % 3 == 0) cout << \"Fizz\";\n        else if (i % 5 == 0) cout << \"Buzz\";\n        else cout << i;\n        cout << endl;\n    }\n    return 0;\n}",
    "java": "public class Solution {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 20; i++) {\n            if (i % 15 == 0) System.out.println(\"FizzBuzz\");\n            else if (i % 3 == 0) System.out.println(\"Fizz\");\n            else if (i % 5 == 0) System.out.println(\"Buzz\");\n            else System.out.println(i);\n        }\n    }\n}"
  }',
  '[]'
);
